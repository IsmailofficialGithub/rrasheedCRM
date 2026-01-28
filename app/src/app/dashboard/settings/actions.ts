"use server"

import { createClient } from "@/utils/supabase/server"
import { z } from "zod"

// Validation schema for keywords
const keywordSchema = z.string()
    .min(2, "Keyword must be at least 2 characters")
    .max(100, "Keyword must be less than 100 characters")
    .refine(
        (val) => {
            // Remove whitespace for validation
            const trimmed = val.trim()
            
            // Check if it's only numbers
            if (/^\d+$/.test(trimmed)) {
                return false
            }
            
            // Check for emojis (common emoji patterns)
            const emojiPattern = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA00}-\u{1FA6F}]|[\u{1FA70}-\u{1FAFF}]|[\u{200D}]|[\u{203C}]|[\u{2049}]|[\u{2122}]|[\u{2139}]|[\u{2194}-\u{2199}]|[\u{21A9}-\u{21AA}]|[\u{231A}-\u{231B}]|[\u{2328}]|[\u{23CF}]|[\u{23E9}-\u{23F3}]|[\u{23F8}-\u{23FA}]|[\u{24C2}]|[\u{25AA}-\u{25AB}]|[\u{25B6}]|[\u{25C0}]|[\u{25FB}-\u{25FE}]|[\u{2600}-\u{2604}]|[\u{260E}]|[\u{2611}]|[\u{2614}-\u{2615}]|[\u{2618}]|[\u{261D}]|[\u{2620}]|[\u{2622}-\u{2623}]|[\u{2626}]|[\u{262A}]|[\u{262E}-\u{262F}]|[\u{2638}-\u{263A}]|[\u{2640}]|[\u{2642}]|[\u{2648}-\u{2653}]|[\u{2660}]|[\u{2663}]|[\u{2665}-\u{2666}]|[\u{2668}]|[\u{267B}]|[\u{267E}-\u{267F}]|[\u{2692}-\u{2697}]|[\u{2699}]|[\u{269B}-\u{269C}]|[\u{26A0}-\u{26A1}]|[\u{26AA}-\u{26AB}]|[\u{26B0}-\u{26B1}]|[\u{26BD}-\u{26BE}]|[\u{26C4}-\u{26C5}]|[\u{26C8}]|[\u{26CE}-\u{26CF}]|[\u{26D1}]|[\u{26D3}-\u{26D4}]|[\u{26E9}-\u{26EA}]|[\u{26F0}-\u{26F5}]|[\u{26F7}-\u{26FA}]|[\u{26FD}]|[\u{2702}]|[\u{2705}]|[\u{2708}-\u{270D}]|[\u{270F}]|[\u{2712}]|[\u{2714}]|[\u{2716}]|[\u{271D}]|[\u{2721}]|[\u{2728}]|[\u{2733}-\u{2734}]|[\u{2744}]|[\u{2747}]|[\u{274C}]|[\u{274E}]|[\u{2753}-\u{2755}]|[\u{2757}]|[\u{2763}-\u{2764}]|[\u{2795}-\u{2797}]|[\u{27A1}]|[\u{27B0}]|[\u{27BF}]|[\u{2934}-\u{2935}]|[\u{2B05}-\u{2B07}]|[\u{2B1B}-\u{2B1C}]|[\u{2B50}]|[\u{2B55}]|[\u{3030}]|[\u{303D}]|[\u{3297}]|[\u{3299}]/u
            if (emojiPattern.test(trimmed)) {
                return false
            }
            
            // Check if it contains at least one letter (to avoid pure numbers/symbols)
            if (!/[a-zA-Z]/.test(trimmed)) {
                return false
            }
            
            // Check for invalid characters (only allow letters, numbers, spaces, hyphens, underscores)
            if (!/^[a-zA-Z0-9\s\-_]+$/.test(trimmed)) {
                return false
            }
            
            return true
        },
        {
            message: "Keyword cannot be only numbers, contain emojis, or invalid characters. Must contain at least one letter."
        }
    )

export async function addKeyword(keyword: string) {
    const supabase = await createClient()
    
    try {
        // Validate keyword
        const validatedKeyword = keywordSchema.parse(keyword.trim())
        
        // Get current user
        const { data: { user } } = await supabase.auth.getUser()
        
        // Check if keyword already exists (case-insensitive)
        const { data: existing } = await supabase
            .from('search_keywords')
            .select('id, keyword')
            .ilike('keyword', validatedKeyword)
            .single()
        
        if (existing) {
            return {
                success: false,
                error: `Keyword "${validatedKeyword}" already exists`
            }
        }
        
        // Insert keyword
        const { data, error } = await supabase
            .from('search_keywords')
            .insert({
                keyword: validatedKeyword,
                created_by: user?.id || null,
                is_active: true
            })
            .select()
            .single()
        
        if (error) {
            if (error.code === '23505') { // Unique constraint violation
                return {
                    success: false,
                    error: `Keyword "${validatedKeyword}" already exists`
                }
            }
            throw error
        }
        
        return {
            success: true,
            data: data
        }
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return {
                success: false,
                error: error.errors[0]?.message || "Invalid keyword format"
            }
        }
        
        console.error("Error adding keyword:", error)
        return {
            success: false,
            error: error.message || "Failed to add keyword"
        }
    }
}

export async function getKeywords() {
    const supabase = await createClient()
    
    try {
        const { data, error } = await supabase
            .from('search_keywords')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: false })
        
        if (error) throw error
        
        return {
            success: true,
            data: data || []
        }
    } catch (error: any) {
        console.error("Error fetching keywords:", error)
        return {
            success: false,
            error: error.message || "Failed to fetch keywords",
            data: []
        }
    }
}

export async function deleteKeyword(keywordId: string) {
    const supabase = await createClient()
    
    try {
        const { error } = await supabase
            .from('search_keywords')
            .delete()
            .eq('id', keywordId)
        
        if (error) throw error
        
        return {
            success: true
        }
    } catch (error: any) {
        console.error("Error deleting keyword:", error)
        return {
            success: false,
            error: error.message || "Failed to delete keyword"
        }
    }
}

export async function toggleKeywordStatus(keywordId: string, isActive: boolean) {
    const supabase = await createClient()
    
    try {
        const { error } = await supabase
            .from('search_keywords')
            .update({ is_active: isActive })
            .eq('id', keywordId)
        
        if (error) throw error
        
        return {
            success: true
        }
    } catch (error: any) {
        console.error("Error updating keyword status:", error)
        return {
            success: false,
            error: error.message || "Failed to update keyword status"
        }
    }
}
