"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, Settings, Plus, Trash2, X, Check, AlertCircle } from "lucide-react"
import { addKeyword, getKeywords, deleteKeyword, toggleKeywordStatus } from "./actions"
import { toast } from "sonner"
import { format } from "date-fns"

interface Keyword {
    id: string
    keyword: string
    created_at: string
    updated_at: string
    is_active: boolean
    created_by: string | null
}

export default function SettingsPage() {
    const [keywords, setKeywords] = useState<Keyword[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isAdding, setIsAdding] = useState(false)
    const [newKeyword, setNewKeyword] = useState("")
    const [validationError, setValidationError] = useState("")

    useEffect(() => {
        fetchKeywords()
    }, [])

    const fetchKeywords = async () => {
        setIsLoading(true)
        try {
            const result = await getKeywords()
            if (result.success) {
                setKeywords(result.data || [])
            } else {
                toast.error(result.error || "Failed to fetch keywords")
            }
        } catch (error: any) {
            toast.error("Error fetching keywords: " + error.message)
        } finally {
            setIsLoading(false)
        }
    }

    const validateKeyword = (keyword: string): string => {
        const trimmed = keyword.trim()
        
        if (trimmed.length < 2) {
            return "Keyword must be at least 2 characters"
        }
        
        if (trimmed.length > 100) {
            return "Keyword must be less than 100 characters"
        }
        
        // Check if it's only numbers
        if (/^\d+$/.test(trimmed)) {
            return "Keyword cannot be only numbers"
        }
        
        // Check for emojis
        const emojiPattern = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA00}-\u{1FA6F}]|[\u{1FA70}-\u{1FAFF}]|[\u{200D}]|[\u{203C}]|[\u{2049}]|[\u{2122}]|[\u{2139}]|[\u{2194}-\u{2199}]|[\u{21A9}-\u{21AA}]|[\u{231A}-\u{231B}]|[\u{2328}]|[\u{23CF}]|[\u{23E9}-\u{23F3}]|[\u{23F8}-\u{23FA}]|[\u{24C2}]|[\u{25AA}-\u{25AB}]|[\u{25B6}]|[\u{25C0}]|[\u{25FB}-\u{25FE}]|[\u{2600}-\u{2604}]|[\u{260E}]|[\u{2611}]|[\u{2614}-\u{2615}]|[\u{2618}]|[\u{261D}]|[\u{2620}]|[\u{2622}-\u{2623}]|[\u{2626}]|[\u{262A}]|[\u{262E}-\u{262F}]|[\u{2638}-\u{263A}]|[\u{2640}]|[\u{2642}]|[\u{2648}-\u{2653}]|[\u{2660}]|[\u{2663}]|[\u{2665}-\u{2666}]|[\u{2668}]|[\u{267B}]|[\u{267E}-\u{267F}]|[\u{2692}-\u{2697}]|[\u{2699}]|[\u{269B}-\u{269C}]|[\u{26A0}-\u{26A1}]|[\u{26AA}-\u{26AB}]|[\u{26B0}-\u{26B1}]|[\u{26BD}-\u{26BE}]|[\u{26C4}-\u{26C5}]|[\u{26C8}]|[\u{26CE}-\u{26CF}]|[\u{26D1}]|[\u{26D3}-\u{26D4}]|[\u{26E9}-\u{26EA}]|[\u{26F0}-\u{26F5}]|[\u{26F7}-\u{26FA}]|[\u{26FD}]|[\u{2702}]|[\u{2705}]|[\u{2708}-\u{270D}]|[\u{270F}]|[\u{2712}]|[\u{2714}]|[\u{2716}]|[\u{271D}]|[\u{2721}]|[\u{2728}]|[\u{2733}-\u{2734}]|[\u{2744}]|[\u{2747}]|[\u{274C}]|[\u{274E}]|[\u{2753}-\u{2755}]|[\u{2757}]|[\u{2763}-\u{2764}]|[\u{2795}-\u{2797}]|[\u{27A1}]|[\u{27B0}]|[\u{27BF}]|[\u{2934}-\u{2935}]|[\u{2B05}-\u{2B07}]|[\u{2B1B}-\u{2B1C}]|[\u{2B50}]|[\u{2B55}]|[\u{3030}]|[\u{303D}]|[\u{3297}]|[\u{3299}]/u
        if (emojiPattern.test(trimmed)) {
            return "Keyword cannot contain emojis"
        }
        
        // Check if it contains at least one letter
        if (!/[a-zA-Z]/.test(trimmed)) {
            return "Keyword must contain at least one letter"
        }
        
        // Check for invalid characters (only allow letters, numbers, spaces, hyphens, underscores)
        if (!/^[a-zA-Z0-9\s\-_]+$/.test(trimmed)) {
            return "Keyword can only contain letters, numbers, spaces, hyphens, and underscores"
        }
        
        return ""
    }

    const handleAddKeyword = async () => {
        const error = validateKeyword(newKeyword)
        if (error) {
            setValidationError(error)
            return
        }

        setValidationError("")
        setIsAdding(true)

        try {
            const result = await addKeyword(newKeyword)
            
            if (result.success) {
                toast.success(`Keyword "${newKeyword.trim()}" added successfully`)
                setNewKeyword("")
                fetchKeywords()
            } else {
                setValidationError(result.error || "Failed to add keyword")
                toast.error(result.error || "Failed to add keyword")
            }
        } catch (error: any) {
            setValidationError(error.message || "Error adding keyword")
            toast.error("Error adding keyword: " + error.message)
        } finally {
            setIsAdding(false)
        }
    }

    const handleDeleteKeyword = async (keywordId: string, keywordText: string) => {
        if (!confirm(`Are you sure you want to delete "${keywordText}"?`)) {
            return
        }

        try {
            const result = await deleteKeyword(keywordId)
            
            if (result.success) {
                toast.success(`Keyword "${keywordText}" deleted successfully`)
                fetchKeywords()
            } else {
                toast.error(result.error || "Failed to delete keyword")
            }
        } catch (error: any) {
            toast.error("Error deleting keyword: " + error.message)
        }
    }

    const handleToggleStatus = async (keywordId: string, currentStatus: boolean, keywordText: string) => {
        try {
            const result = await toggleKeywordStatus(keywordId, !currentStatus)
            
            if (result.success) {
                toast.success(`Keyword "${keywordText}" ${!currentStatus ? 'activated' : 'deactivated'}`)
                fetchKeywords()
            } else {
                toast.error(result.error || "Failed to update keyword status")
            }
        } catch (error: any) {
            toast.error("Error updating keyword: " + error.message)
        }
    }

    return (
        <div className="flex flex-col h-full gap-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Settings className="h-5 w-5 text-primary" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                    <p className="text-muted-foreground">Manage search keywords and preferences</p>
                </div>
            </div>

            {/* Add Keyword Section */}
            <Card>
                <CardHeader>
                    <CardTitle>Add Search Keyword</CardTitle>
                    <CardDescription>
                        Add keywords to use for lead generation. 
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <Input
                                placeholder="Enter keyword (e.g., 'software engineer', 'marketing manager')"
                                value={newKeyword}
                                onChange={(e) => {
                                    setNewKeyword(e.target.value)
                                    setValidationError("")
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && !isAdding && newKeyword.trim()) {
                                        handleAddKeyword()
                                    }
                                }}
                                className={validationError ? "border-red-500" : ""}
                            />
                            {validationError && (
                                <div className="flex items-center gap-2 mt-2 text-sm text-red-500">
                                    <AlertCircle className="h-4 w-4" />
                                    <span>{validationError}</span>
                                </div>
                            )}
                        </div>
                        <Button 
                            onClick={handleAddKeyword}
                            disabled={isAdding || !newKeyword.trim()}
                        >
                            {isAdding ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Adding...
                                </>
                            ) : (
                                <>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Keyword
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Keywords List */}
            <Card>
                <CardHeader>
                    <CardTitle>Search Keywords</CardTitle>
                    <CardDescription>
                        Manage your saved keywords for lead generation ({keywords.length} total)
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : keywords.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                            <Settings className="h-12 w-12 mb-4 opacity-50" />
                            <p>No keywords added yet.</p>
                            <p className="text-sm mt-2">Add your first keyword above to get started.</p>
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[50px]">#</TableHead>
                                        <TableHead>Keyword</TableHead>
                                        <TableHead>Created</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {keywords.map((keyword, index) => (
                                        <TableRow key={keyword.id}>
                                            <TableCell className="text-muted-foreground text-xs text-center">
                                                {index + 1}
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                {keyword.keyword}
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {format(new Date(keyword.created_at), 'MMM dd, yyyy')}
                                            </TableCell>
                                            <TableCell>
                                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                                                    keyword.is_active
                                                        ? 'bg-emerald-500/10 text-emerald-500'
                                                        : 'bg-muted text-muted-foreground'
                                                }`}>
                                                    {keyword.is_active ? (
                                                        <>
                                                            <Check className="h-3 w-3" />
                                                            Active
                                                        </>
                                                    ) : (
                                                        <>
                                                            <X className="h-3 w-3" />
                                                            Inactive
                                                        </>
                                                    )}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleToggleStatus(keyword.id, keyword.is_active, keyword.keyword)}
                                                    >
                                                        {keyword.is_active ? "Deactivate" : "Activate"}
                                                    </Button>
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() => handleDeleteKeyword(keyword.id, keyword.keyword)}
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
