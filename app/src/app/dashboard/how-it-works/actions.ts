"use server"

import { createClient } from "@/utils/supabase/server"
import axios from "axios"

export async function fetchLeadsByNiche(niche: string) {
    try {
        const trimmedKeyword = niche.trim()
        
        if (!trimmedKeyword) {
            return {
                success: false,
                error: "Keyword cannot be empty"
            }
        }

        const webhookUrl = process.env.FETCH_DATA_WEBHOOK
        
        if (!webhookUrl) {
            console.error("FETCH_DATA_WEBHOOK environment variable is not set")
            return {
                success: false,
                error: "Webhook URL is not configured"
            }
        }

        const response = await axios.post(webhookUrl, {
            keyword: trimmedKeyword
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        })

        const data = response.data
        
        return {
            success: true,
            data: data
        }
    } catch (error: any) {
        console.error("Error fetching leads by niche:", error)
        
        // Handle axios errors specifically
        if (axios.isAxiosError(error)) {
            const status = error.response?.status
            const statusText = error.response?.statusText
            const errorMessage = error.response?.data?.message || error.message
            
            return {
                success: false,
                error: `Webhook request failed: ${status} ${statusText || ''} - ${errorMessage}`
            }
        }
        
        return {
            success: false,
            error: error.message || "Failed to fetch leads"
        }
    }
}

export async function storeFetchedLeads(leads: any[]) {
    const supabase = await createClient()
    
    try {
        const leadsToInsert = leads.map(lead => ({
            company_name: lead.company_name || "Unknown",
            job_posting_url: lead.job_posting_url || null,
            city_state: lead.city_state || null,
            salary_range: lead.salary_range || null,
            decision_maker_name: lead.decision_maker_name || null,
            email: lead.email || null,
            phone_number: lead.phone_number || null,
        }))
        
        const { data, error } = await supabase
            .from('leads')
            .insert(leadsToInsert)
            .select()
        
        if (error) throw error
        
        return {
            success: true,
            data: data,
            count: data?.length || 0
        }
    } catch (error: any) {
        console.error("Error storing leads:", error)
        return {
            success: false,
            error: error.message || "Failed to store leads"
        }
    }
}
