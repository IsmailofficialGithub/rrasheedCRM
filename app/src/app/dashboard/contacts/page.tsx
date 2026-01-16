"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { User, Phone, Loader2, PhoneCall, Play, Pause, Square } from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import { triggerCallWebhook } from "../calls/actions"
import { startCallingAllContacts, updateCallStatus, callContactWebhook } from "./actions"
import { toast } from "sonner"

interface Contact {
    id: string | number
    name: string
    subtitle: string
    title: string
    email: string
    phone: string
    company: string
    status: string
    leadId?: string
    leadData?: any
    callLogId?: string
    callStatus?: string | null
}

export default function ContactsPage() {
    const [contacts, setContacts] = useState<Contact[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [totalCount, setTotalCount] = useState(0)
    const [callingId, setCallingId] = useState<string | null>(null)
    const [isStartingAll, setIsStartingAll] = useState(false)
    const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null)

    const supabase = createClient()

    useEffect(() => {
        const fetchContacts = async () => {
            setIsLoading(true)
            try {
                // Fetch leads who have a decision maker name
                const { data, error, count } = await supabase
                    .from('leads')
                    .select('*', { count: 'exact' })
                    .not('decision_maker_name', 'is', null)
                    .neq('decision_maker_name', '')
                    .neq('decision_maker_name', '-')

                if (error) throw error

                if (data) {
                    // Fetch call logs for all leads
                    const leadIds = data.map(l => l.id)
                    const { data: callLogs } = await supabase
                        .from('calls_log')
                        .select('uuid, lead_id, call_status')
                        .in('lead_id', leadIds)
                        .order('created_at', { ascending: false })

                    // Create a map of lead_id to latest call log
                    const callLogMap = new Map<string, { uuid: string; status: string }>()
                    if (callLogs) {
                        callLogs.forEach(log => {
                            if (!callLogMap.has(log.lead_id)) {
                                callLogMap.set(log.lead_id, { uuid: log.uuid, status: log.call_status || 'initiated' })
                            }
                        })
                    }

                    const formattedContacts = data.map((lead, index) => {
                        let name = lead.decision_maker_name || "Unknown"
                        let title = "—"

                        // If name contains a comma, it's likely "Name, Title"
                        if (name.includes(',')) {
                            const parts = name.split(',')
                            name = parts[0].trim()
                            title = parts.slice(1).join(',').trim()
                        }

                        const callLog = callLogMap.get(lead.id)

                        return {
                            id: index + 1,
                            name: name,
                            subtitle: "Lead",
                            title: title,
                            email: lead.email || "—",
                            phone: lead.phone_number || "—",
                            company: lead.company_name || "—",
                            status: "Lead",
                            leadId: lead.id,
                            leadData: lead,
                            callLogId: callLog?.uuid,
                            callStatus: callLog?.status || null
                        }
                    })
                    setContacts(formattedContacts)
                    if (count !== null) setTotalCount(count)
                }
            } catch (err) {
                console.error("Error fetching contacts:", err)
            } finally {
                setIsLoading(false)
            }
        }

        fetchContacts()
    }, [supabase])

    const handleCall = async (contact: Contact) => {
        if (!contact.phone || contact.phone === "—") {
            toast.error("Phone number not available")
            return
        }

        setCallingId(contact.id.toString())
        try {
            const result = await callContactWebhook(contact.name, contact.phone)

            if (result.success) {
                toast.success(`Calling ${contact.name}...`, {
                    description: `Connecting to ${contact.phone}`,
                })
            } else {
                toast.error(`Failed to connect`, {
                    description: result.error,
                })
            }
        } catch (err: any) {
            toast.error(`Error initiating call`, {
                description: err.message,
            })
        } finally {
            setCallingId(null)
        }
    }

    // Note: Individual call initiation removed - now using list-based scheduling
    // Users should schedule lists from the Contact Lists tab instead

    const handleCallControl = async (callLogId: string, action: 'pause' | 'resume' | 'end') => {
        if (!callLogId) {
            toast.error("Call log ID is missing")
            return
        }

        setUpdatingStatusId(callLogId)
        try {
            const status = action === 'pause' ? 'paused' : action === 'resume' ? 'resumed' : 'ended'
            const result = await updateCallStatus(callLogId, status as 'paused' | 'resumed' | 'ended' | 'ongoing')
            
            if (result.success) {
                toast.success(`Call ${action === 'pause' ? 'paused' : action === 'resume' ? 'resumed' : 'ended'}`)
                // Refresh contacts to get updated status
                const fetchContacts = async () => {
                    const { data } = await supabase
                        .from('leads')
                        .select('*')
                        .not('decision_maker_name', 'is', null)
                        .neq('decision_maker_name', '')
                        .neq('decision_maker_name', '-')

                    if (data) {
                        const leadIds = data.map(l => l.id)
                        const { data: callLogs } = await supabase
                            .from('calls_log')
                            .select('uuid, lead_id, call_status')
                            .in('lead_id', leadIds)
                            .order('created_at', { ascending: false })

                        const callLogMap = new Map<string, { uuid: string; status: string }>()
                        if (callLogs) {
                            callLogs.forEach(log => {
                                if (!callLogMap.has(log.lead_id)) {
                                    callLogMap.set(log.lead_id, { uuid: log.uuid, status: log.call_status || 'initiated' })
                                }
                            })
                        }

                        const formattedContacts = data.map((lead, index) => {
                            let name = lead.decision_maker_name || "Unknown"
                            let title = "—"
                            if (name.includes(',')) {
                                const parts = name.split(',')
                                name = parts[0].trim()
                                title = parts.slice(1).join(',').trim()
                            }
                            const callLog = callLogMap.get(lead.id)
                            return {
                                id: index + 1,
                                name: name,
                                subtitle: "Lead",
                                title: title,
                                email: lead.email || "—",
                                phone: lead.phone_number || "—",
                                company: lead.company_name || "—",
                                status: "Lead",
                                leadId: lead.id,
                                leadData: lead,
                                callLogId: callLog?.uuid,
                                callStatus: callLog?.status || null
                            }
                        })
                        setContacts(formattedContacts)
                    }
                }
                fetchContacts()
            } else {
                toast.error(result.error || `Failed to ${action} call`)
            }
        } catch (error: any) {
            console.error(`Error ${action}ing call:`, error)
            toast.error(`Error ${action}ing call: ` + error.message)
        } finally {
            setUpdatingStatusId(null)
        }
    }

    return (
        <div className="flex flex-col h-full gap-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight text-primary flex items-center gap-2">
                    Contacts
                    <span className="text-base font-normal text-muted-foreground">
                        ({totalCount})
                    </span>
                </h1>
            </div>

            {/* Table */}
            <Card className="flex-1 flex flex-col overflow-hidden border shadow-md">
                <div className="flex-1 overflow-auto bg-background">
                    {isLoading ? (
                        <div className="flex items-center justify-center p-8 h-full">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : contacts.length === 0 ? (
                        <div className="flex items-center justify-center p-8 h-full text-muted-foreground">
                            No contacts found.
                        </div>
                    ) : (
                        <Table>
                            <TableHeader className="sticky top-0 bg-muted/50 z-10 backdrop-blur-sm">
                                <TableRow className="hover:bg-transparent border-b border-border">
                                    <TableHead className="w-[50px] font-semibold text-muted-foreground text-xs uppercase tracking-wider text-center">#</TableHead>
                                    <TableHead className="min-w-[200px] font-semibold text-muted-foreground text-xs uppercase tracking-wider">Name</TableHead>
                                    <TableHead className="min-w-[200px] font-semibold text-muted-foreground text-xs uppercase tracking-wider">Job Title</TableHead>
                                    <TableHead className="min-w-[150px] font-semibold text-muted-foreground text-xs uppercase tracking-wider">Phone</TableHead>
                                    <TableHead className="min-w-[100px] font-semibold text-muted-foreground text-xs uppercase tracking-wider">Company</TableHead>
                                    <TableHead className="min-w-[100px] font-semibold text-muted-foreground text-xs uppercase tracking-wider">Status</TableHead>
                                    <TableHead className="text-right pr-6 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {contacts.map((contact, index) => (
                                    <TableRow key={contact.id} className="hover:bg-muted/30 transition-colors">
                                        <TableCell className="text-muted-foreground text-xs text-center">{index + 1}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                                                    <User className="h-4 w-4 text-muted-foreground" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-sm text-foreground">{contact.name}</span>
                                                    <span className="text-[10px] text-muted-foreground">{contact.subtitle}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground truncate max-w-[300px]" title={contact.title}>
                                            {contact.title}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                                                <Phone className="h-3 w-3" />
                                                {contact.phone}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground text-center">{contact.company}</TableCell>
                                        <TableCell className="text-sm text-muted-foreground text-center">{contact.status}</TableCell>
                                        <TableCell className="text-right pr-4">
                                            <div className="flex items-center justify-end gap-2">
                                                {contact.phone !== "—" && contact.phone && (
                                                    <Button
                                                        variant="default"
                                                        size="sm"
                                                        onClick={() => handleCall(contact)}
                                                        disabled={callingId === contact.id.toString()}
                                                        className="bg-primary hover:bg-primary/90"
                                                    >
                                                        {callingId === contact.id.toString() ? (
                                                            <>
                                                                <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                                                                Calling...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <PhoneCall className="h-3 w-3 mr-2" />
                                                                Call
                                                            </>
                                                        )}
                                                    </Button>
                                                )}
                                                {contact.phone !== "—" && contact.callLogId && (
                                                    <div className="flex items-center gap-1">
                                                        {contact.callStatus === 'ongoing' || contact.callStatus === 'initiated' ? (
                                                            <>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => contact.callLogId && handleCallControl(contact.callLogId, 'pause')}
                                                                    disabled={updatingStatusId === contact.callLogId}
                                                                >
                                                                    {updatingStatusId === contact.callLogId ? (
                                                                        <Loader2 className="h-3 w-3 animate-spin" />
                                                                    ) : (
                                                                        <Pause className="h-3 w-3" />
                                                                    )}
                                                                </Button>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => contact.callLogId && handleCallControl(contact.callLogId, 'end')}
                                                                    disabled={updatingStatusId === contact.callLogId}
                                                                >
                                                                    {updatingStatusId === contact.callLogId ? (
                                                                        <Loader2 className="h-3 w-3 animate-spin" />
                                                                    ) : (
                                                                        <Square className="h-3 w-3" />
                                                                    )}
                                                                </Button>
                                                            </>
                                                        ) : contact.callStatus === 'paused' ? (
                                                            <>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => contact.callLogId && handleCallControl(contact.callLogId, 'resume')}
                                                                    disabled={updatingStatusId === contact.callLogId}
                                                                >
                                                                    {updatingStatusId === contact.callLogId ? (
                                                                        <Loader2 className="h-3 w-3 animate-spin" />
                                                                    ) : (
                                                                        <Play className="h-3 w-3" />
                                                                    )}
                                                                </Button>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => contact.callLogId && handleCallControl(contact.callLogId, 'end')}
                                                                    disabled={updatingStatusId === contact.callLogId}
                                                                >
                                                                    {updatingStatusId === contact.callLogId ? (
                                                                        <Loader2 className="h-3 w-3 animate-spin" />
                                                                    ) : (
                                                                        <Square className="h-3 w-3" />
                                                                    )}
                                                                </Button>
                                                            </>
                                                        ) : null}
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </div>
            </Card>
        </div>
    )
}
