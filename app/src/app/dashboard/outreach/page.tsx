"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Send, Loader2 } from "lucide-react"
import { createClient } from "@/utils/supabase/client"

interface OutreachLead {
    id: string | number
    lead: string
    email: string
    company: string
    title: string
    status: string
    lastContact: string
}

export default function OutreachPage() {
    const [leads, setLeads] = useState<OutreachLead[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [stats, setStats] = useState({ notStarted: 0, responded: 0, booked: 0 })

    const supabase = createClient()

    useEffect(() => {
        const fetchOutreachLeads = async () => {
            setIsLoading(true)
            try {
                // Fetch all leads
                const { data: leadsData, error: leadsError, count } = await supabase
                    .from('leads')
                    .select('*', { count: 'exact' })

                if (leadsError) throw leadsError

                // Fetch responded count
                const { data: respondedData } = await supabase
                    .from('responses')
                    .select('lead_id')
                const uniqueResponded = new Set(respondedData?.map(r => r.lead_id)).size

                // Fetch booked count
                const { data: bookedData } = await supabase
                    .from('bookings')
                    .select('lead_id')
                const uniqueBooked = new Set(bookedData?.map(b => b.lead_id)).size

                if (leadsData) {
                    const formattedLeads = leadsData.map((lead) => {
                        let name = lead.decision_maker_name || "Unknown"
                        let title = "—"

                        if (name.includes(',')) {
                            const parts = name.split(',')
                            name = parts[0].trim()
                            title = parts.slice(1).join(',').trim()
                        }

                        return {
                            id: lead.id,
                            lead: name,
                            email: lead.email || "—",
                            company: lead.company_name || "—",
                            title: title,
                            status: "Not Started",
                            lastContact: "—"
                        }
                    })
                    setLeads(formattedLeads)
                    setStats({
                        notStarted: (count || 0) - uniqueResponded - uniqueBooked,
                        responded: uniqueResponded,
                        booked: uniqueBooked
                    })
                }
            } catch (err) {
                console.error("Error fetching outreach leads:", err)
            } finally {
                setIsLoading(false)
            }
        }

        fetchOutreachLeads()
    }, [supabase])

    return (
        <div className="flex flex-col h-full gap-6 animate-in fade-in duration-500">
            {/* Header Section with Stats */}
            <div className="flex flex-col gap-4">
                <h1 className="text-3xl font-bold tracking-tight text-primary">Outreach</h1>

                <div className="flex gap-4">
                    <Card className="shadow-sm border-l-4 border-l-primary w-32">
                        <CardContent className="p-4 flex flex-col justify-center items-center">
                            <span className="text-2xl font-bold text-foreground">{stats.notStarted}</span>
                            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Not Started</span>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm border-l-4 border-l-green-500 w-32">
                        <CardContent className="p-4 flex flex-col justify-center items-center">
                            <span className="text-2xl font-bold text-green-600">{stats.responded}</span>
                            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Responded</span>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm border-l-4 border-l-purple-500 w-32">
                        <CardContent className="p-4 flex flex-col justify-center items-center">
                            <span className="text-2xl font-bold text-purple-600">{stats.booked}</span>
                            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Booked</span>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Table Section */}
            <Card className="flex-1 flex flex-col overflow-hidden border shadow-md">
                <div className="flex-1 overflow-auto bg-background">
                    {isLoading ? (
                        <div className="flex items-center justify-center p-8 h-full">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : leads.length === 0 ? (
                        <div className="flex items-center justify-center p-8 h-full text-muted-foreground">
                            No leads found for outreach.
                        </div>
                    ) : (
                        <Table>
                            <TableHeader className="sticky top-0 bg-muted/50 z-10 backdrop-blur-sm">
                                <TableRow className="hover:bg-transparent border-b border-border">
                                    <TableHead className="w-[40px] pl-4">
                                        <Checkbox />
                                    </TableHead>
                                    <TableHead className="w-[50px] font-semibold text-muted-foreground text-xs uppercase tracking-wider">#</TableHead>
                                    <TableHead className="min-w-[150px] font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                                        Lead
                                    </TableHead>
                                    <TableHead className="min-w-[200px] font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                                        Email
                                    </TableHead>
                                    <TableHead className="min-w-[200px] font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                                        Company
                                    </TableHead>
                                    <TableHead className="min-w-[150px] font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                                        Title
                                    </TableHead>
                                    <TableHead className="min-w-[100px] font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                                        Status
                                    </TableHead>
                                    <TableHead className="min-w-[100px] font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                                        Last Contact
                                    </TableHead>
                                    <TableHead className="text-right pr-6 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                                        Action
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {leads.map((row, index) => (
                                    <TableRow key={row.id} className="hover:bg-muted/30 transition-colors">
                                        <TableCell className="pl-4">
                                            <Checkbox />
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-xs">{index + 1}</TableCell>
                                        <TableCell className="font-medium text-foreground">{row.lead}</TableCell>
                                        <TableCell className="text-muted-foreground text-sm">{row.email}</TableCell>
                                        <TableCell className="text-muted-foreground text-sm flex items-center gap-2">
                                            <span className="opacity-50">🏢</span> {row.company}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm">{row.title}</TableCell>
                                        <TableCell>
                                            <span className="inline-flex items-center rounded-full border border-gray-200 px-2.5 py-0.5 text-xs font-semibold text-gray-500 bg-gray-50 dark:bg-gray-900 dark:text-gray-400 dark:border-gray-800">
                                                {row.status}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm">{row.lastContact}</TableCell>
                                        <TableCell className="text-right pr-4">
                                            <Button
                                                size="sm"
                                                className="bg-[#0f172a] hover:bg-[#1e293b] text-white shadow-sm h-8 px-3 text-xs font-medium"
                                            >
                                                <Send className="w-3 h-3 mr-2" />
                                                Start Outreach
                                            </Button>
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
