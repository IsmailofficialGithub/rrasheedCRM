"use server"

import { createClient } from "@/utils/supabase/server"

export async function startCallingContacts(contactListId?: string) {
    const webhookUrl = process.env.CALL_WEBHOOK_BASE_URL;

    if (!webhookUrl) {
        return { success: false, error: "CALL_WEBHOOK_BASE_URL is not defined in environment variables" };
    }

    const supabase = await createClient();

    try {
        // Fetch contacts - either from a specific list or all contacts
        let contactsQuery = supabase
            .from('contacts')
            .select('*')
            .order('created_at', { ascending: true });

        if (contactListId) {
            contactsQuery = contactsQuery.eq('contact_list_id', contactListId);
        }

        const { data: contacts, error: contactsError } = await contactsQuery;

        if (contactsError) throw contactsError;

        if (!contacts || contacts.length === 0) {
            return { success: false, error: "No contacts found to call" };
        }

        let successCount = 0;
        let failedCount = 0;
        const errors: string[] = [];

        // Call each contact
        for (const contact of contacts) {
            try {
                // Check if call already exists for this contact
                const { data: existingCall } = await supabase
                    .from('calls_log')
                    .select('uuid, call_status')
                    .eq('phone', contact.phone)
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
                    name: contact.name,
                    phone: contact.phone,
                    email: contact.email,
                    company: contact.additional_data?.company || 'Unknown',
                    contact_list_id: contact.contact_list_id,
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
                    const errorText = await response.text();
                    throw new Error(`Webhook failed: ${response.status} ${response.statusText}`);
                }

                // Log the call in the database
                // First, try to find or create a lead record for this contact
                let leadId = null;
                
                // Check if a lead exists with this phone number
                const { data: existingLead } = await supabase
                    .from('leads')
                    .select('id')
                    .eq('phone_number', contact.phone)
                    .limit(1)
                    .single();

                if (existingLead) {
                    leadId = existingLead.id;
                } else {
                    // Create a lead record for this contact
                    const { data: newLead, error: leadError } = await supabase
                        .from('leads')
                        .insert({
                            company_name: contactData.company,
                            decision_maker_name: contact.name,
                            email: contact.email || null,
                            phone_number: contact.phone,
                        })
                        .select('id')
                        .single();

                    if (!leadError && newLead) {
                        leadId = newLead.id;
                    }
                }

                // Log the call
                const { error: logError } = await supabase
                    .from('calls_log')
                    .insert({
                        lead_id: leadId || contact.id, // Use lead_id if available, otherwise contact id
                        company: contactData.company,
                        phone: contact.phone,
                        call_status: 'initiated',
                    });

                if (logError) {
                    console.error("Failed to log call:", logError);
                }

                successCount++;
            } catch (error: any) {
                failedCount++;
                errors.push(`${contact.name}: ${error.message}`);
                console.error(`Error calling ${contact.name}:`, error);
            }
        }

        return {
            success: true,
            total: contacts.length,
            successCount,
            failedCount,
            errors: errors.slice(0, 5), // Return first 5 errors
        };
    } catch (error: any) {
        console.error("Error starting calls:", error);
        return { success: false, error: error.message };
    }
}
