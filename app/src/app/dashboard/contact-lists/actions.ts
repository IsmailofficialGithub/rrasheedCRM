"use server"

import { createClient } from "@/utils/supabase/server"

// Run/Schedule a list - creates scheduled_calls entries for all contacts
export async function runCallList(listId: string, scheduledAt?: Date) {
    const supabase = await createClient();
    
    try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return { success: false, error: "User not authenticated" };
        }

        // Get contact list and count contacts
        const { data: listData, error: listError } = await supabase
            .from('contact_lists')
            .select('*, contacts(count)')
            .eq('id', listId)
            .single();

        if (listError) throw listError;
        if (!listData) {
            return { success: false, error: "Contact list not found" };
        }

        // Get all contacts from the list
        const { data: contacts, error: contactsError } = await supabase
            .from('contacts')
            .select('id')
            .eq('contact_list_id', listId);

        if (contactsError) throw contactsError;

        if (!contacts || contacts.length === 0) {
            return { success: false, error: "No contacts found in this list" };
        }

        // Schedule the call list - create a scheduled call entry for each contact
        const scheduleTime = scheduledAt || new Date();
        
        const scheduledCallsToInsert = contacts.map(contact => ({
            owner_user_id: user.id,
            contact_id: contact.id,
            list_id: listId,
            scheduled_at: scheduleTime.toISOString(),
            status: 'scheduled',
        }));

        // Insert all scheduled calls
        const { data: scheduledCalls, error: scheduleError } = await supabase
            .from('scheduled_calls')
            .insert(scheduledCallsToInsert)
            .select();

        if (scheduleError) {
            console.error("Error inserting scheduled calls:", scheduleError);
            throw scheduleError;
        }

        console.log(`Created ${scheduledCalls?.length || 0} scheduled calls for list ${listId}`);

        // Update the contact list status to 'scheduled'
        const { error: updateListError } = await supabase
            .from('contact_lists')
            .update({ status: 'scheduled' })
            .eq('id', listId);

        if (updateListError) {
            console.error("Error updating list status:", updateListError);
            // Don't fail the whole operation if status update fails
        }

        return {
            success: true,
            scheduledCalls: scheduledCalls || [],
            contactsCount: contacts.length
        };
    } catch (error: any) {
        console.error("Error scheduling call list:", error);
        return { success: false, error: error.message };
    }
}

// Start a list - updates all scheduled calls from 'scheduled' or 'paused' to 'ongoing'
export async function startCallList(listId: string) {
    const supabase = await createClient();
    
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return { success: false, error: "User not authenticated" };
        }

        // First, check how many calls exist for this list
        const { count: totalCalls, error: countError } = await supabase
            .from('scheduled_calls')
            .select('*', { count: 'exact', head: true })
            .eq('list_id', listId);

        if (countError) {
            console.error("Error counting scheduled calls:", countError);
        }

        console.log(`Total scheduled calls for list ${listId}: ${totalCalls || 0}`);

        // Check how many are in scheduled or paused status
        const { count: eligibleCalls } = await supabase
            .from('scheduled_calls')
            .select('*', { count: 'exact', head: true })
            .eq('list_id', listId)
            .in('status', ['scheduled', 'paused']);

        console.log(`Eligible calls (scheduled or paused) for list ${listId}: ${eligibleCalls || 0}`);

        // Update all scheduled calls for this list from 'scheduled' or 'paused' to 'in_progress'
        const { data, error } = await supabase
            .from('scheduled_calls')
            .update({ 
                status: 'in_progress',
                updated_at: new Date().toISOString()
            })
            .eq('list_id', listId)
            .in('status', ['scheduled', 'paused'])
            .select();

        if (error) {
            console.error("Error updating scheduled calls:", error);
            throw error;
        }

        console.log(`Updated ${data?.length || 0} calls to in_progress status`);

        // Update the contact list status to 'in_progress' (we'll use 'ongoing' for the list status to match UI)
        const { error: updateListError } = await supabase
            .from('contact_lists')
            .update({ status: 'ongoing' })
            .eq('id', listId);

        if (updateListError) {
            console.error("Error updating list status:", updateListError);
        }

        return {
            success: true,
            updatedCount: data?.length || 0
        };
    } catch (error: any) {
        console.error("Error starting call list:", error);
        return { success: false, error: error.message };
    }
}

// Stop a list - updates all scheduled calls from 'ongoing' to 'paused'
export async function stopCallList(listId: string) {
    const supabase = await createClient();
    
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return { success: false, error: "User not authenticated" };
        }

        // First, check how many calls are in 'in_progress' status
        const { count: inProgressCount, error: countError } = await supabase
            .from('scheduled_calls')
            .select('*', { count: 'exact', head: true })
            .eq('list_id', listId)
            .eq('status', 'in_progress');

        if (countError) {
            console.error("Error counting in_progress calls:", countError);
        }

        console.log(`In progress calls for list ${listId}: ${inProgressCount || 0}`);

        // Update all scheduled calls for this list from 'in_progress' to 'paused'
        const { data, error } = await supabase
            .from('scheduled_calls')
            .update({ 
                status: 'paused',
                updated_at: new Date().toISOString()
            })
            .eq('list_id', listId)
            .eq('status', 'in_progress')
            .select();

        if (error) {
            console.error("Error updating scheduled calls:", error);
            throw error;
        }

        console.log(`Updated ${data?.length || 0} calls to paused status`);

        // Update the contact list status to 'paused'
        const { error: updateListError } = await supabase
            .from('contact_lists')
            .update({ status: 'paused' })
            .eq('id', listId);

        if (updateListError) {
            console.error("Error updating list status:", updateListError);
        }

        return {
            success: true,
            updatedCount: data?.length || 0
        };
    } catch (error: any) {
        console.error("Error stopping call list:", error);
        return { success: false, error: error.message };
    }
}

// Cancel/Complete a list - updates all scheduled calls to 'completed'
export async function cancelCallList(listId: string) {
    const supabase = await createClient();
    
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return { success: false, error: "User not authenticated" };
        }

        // Update all scheduled calls for this list to 'completed'
        const { data, error } = await supabase
            .from('scheduled_calls')
            .update({ 
                status: 'completed',
                updated_at: new Date().toISOString()
            })
            .eq('list_id', listId)
            .in('status', ['scheduled', 'in_progress', 'paused'])
            .select();

        if (error) throw error;

        // Update the contact list status to 'completed'
        const { error: updateListError } = await supabase
            .from('contact_lists')
            .update({ status: 'completed' })
            .eq('id', listId);

        if (updateListError) {
            console.error("Error updating list status:", updateListError);
        }

        return {
            success: true,
            updatedCount: data?.length || 0
        };
    } catch (error: any) {
        console.error("Error cancelling call list:", error);
        return { success: false, error: error.message };
    }
}

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
