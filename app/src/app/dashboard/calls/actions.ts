"use server"

import { createClient } from "@/utils/supabase/server"

export async function triggerCallWebhook(leadData: any) {
    const webhookUrl = process.env.CALL_WEBHOOK_BASE_URL;

    if (!webhookUrl) {
        throw new Error("CALL_WEBHOOK_BASE_URL is not defined in environment variables");
    }

    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(leadData),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Webhook failed: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const responseData = await response.json().catch(() => ({ message: "Success" }));

        // Log the call in the database
        const supabase = await createClient();
        const { error: logError } = await supabase
            .from('calls_log')
            .insert({
                lead_id: leadData.id,
                company: leadData.company,
                phone: leadData.phone,
                call_status: 'initiated',
            });

        if (logError) {
            console.error("Failed to log call:", logError);
            // We don't throw here as the call was already triggered
        }

        return { success: true, data: responseData };
    } catch (error: any) {
        console.error("Error triggering call webhook:", error);
        return { success: false, error: error.message };
    }
}
