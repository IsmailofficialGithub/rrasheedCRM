"use server"

import { createClient } from "@/utils/supabase/server"

export async function updateCallStatus(callLogId: string, status: 'paused' | 'resumed' | 'ended' | 'ongoing') {
    const supabase = await createClient();

    try {
        // Map status to call_status values
        const statusMap: Record<string, string> = {
            'paused': 'paused',
            'resumed': 'ongoing',
            'ended': 'completed',
            'ongoing': 'ongoing'
        };

        const { error } = await supabase
            .from('calls_log')
            .update({
                call_status: statusMap[status],
                updated_at: new Date().toISOString()
            })
            .eq('uuid', callLogId);

        if (error) throw error;

        return { success: true };
    } catch (error: any) {
        console.error("Error updating call status:", error);
        return { success: false, error: error.message };
    }
}

export async function startCallingAllContacts() {
    const webhookUrl = process.env.CALL_WEBHOOK_BASE_URL;

    if (!webhookUrl) {
        return { success: false, error: "CALL_WEBHOOK_BASE_URL is not defined in environment variables" };
    }

    const supabase = await createClient();

    try {
        // Fetch all contacts from leads table (contacts with decision_maker_name and phone)
        const { data: contacts, error: contactsError } = await supabase
            .from('leads')
            .select('*')
            .not('phone_number', 'is', null)
            .not('decision_maker_name', 'is', null)
            .neq('decision_maker_name', '')
            .neq('decision_maker_name', '-')
            .order('created_at', { ascending: true });

        if (contactsError) throw contactsError;

        if (!contacts || contacts.length === 0) {
            return { success: false, error: "No contacts found to call" };
        }

        let successCount = 0;
        let failedCount = 0;

        // Call each contact
        for (const contact of contacts) {
            try {
                // Check if call already exists and is not completed
                const { data: existingCall } = await supabase
                    .from('calls_log')
                    .select('uuid, call_status')
                    .eq('lead_id', contact.id)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single();

                // Skip if already completed
                if (existingCall?.call_status === 'completed') {
                    continue;
                }

                // Prepare contact data for webhook
                const contactData = {
                    id: contact.id,
                    name: contact.decision_maker_name?.split(',')[0]?.trim() || contact.company_name,
                    phone: contact.phone_number,
                    email: contact.email,
                    company: contact.company_name,
                    created_at: contact.created_at,
                    updated_at: contact.updated_at,
                    job_posting_url: contact.job_posting_url,
                    city_state: contact.city_state,
                    salary_range: contact.salary_range,
                    decision_maker_name: contact.decision_maker_name,
                };

                // Call webhook
                const response = await fetch(webhookUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(contactData),
                });

                if (!response.ok) {
                    throw new Error(`Webhook failed: ${response.status}`);
                }

                // Log the call in the database
                const { error: logError } = await supabase
                    .from('calls_log')
                    .insert({
                        lead_id: contact.id,
                        company: contact.company_name,
                        phone: contact.phone_number,
                        call_status: 'initiated',
                    });

                if (logError) {
                    console.error("Failed to log call:", logError);
                }

                successCount++;
            } catch (error: any) {
                failedCount++;
                console.error(`Error calling ${contact.decision_maker_name}:`, error);
            }
        }

        return {
            success: true,
            total: contacts.length,
            successCount,
            failedCount,
        };
    } catch (error: any) {
        console.error("Error starting calls:", error);
        return { success: false, error: error.message };
    }
}
