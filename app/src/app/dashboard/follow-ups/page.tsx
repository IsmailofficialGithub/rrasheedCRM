"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Search, Monitor, User, Building2, Send, Loader2 } from "lucide-react"
import { createClient } from "@/utils/supabase/client"

interface FollowUpData {
    id: string
    leadName: string
    email: string
    company: string
    sequence: string
    followUpNumber: string
    days: string
    status: string
}

export default function FollowUpsPage() {
    const [filter, setFilter] = useState("All")
    const [followUps, setFollowUps] = useState<FollowUpData[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [stats, setStats] = useState({ pending: 0, sent: 0, cancelled: 0, skipped: 0 })

    const supabase = createClient()

    useEffect(() => {
        const fetchFollowUps = async () => {
            setIsLoading(true)
            try {
                let query = supabase
                    .from('follow_ups')
                    .select('*, leads(decision_maker_name, email, company_name)')

                if (filter !== "All") {
                    query = query.eq('status', filter)
                }

                const { data, error } = await query

                if (error) throw error

                if (data) {
                    const formatted = data.map((item: any) => ({
                        id: item.id,
                        leadName: item.leads?.decision_maker_name || "Unknown",
                        email: item.leads?.email || "—",
                        company: item.leads?.company_name || "—",
                        sequence: item.sequence || "No sequence",
                        followUpNumber: item.follow_up_number || "#1",
                        days: item.days || "0 days",
                        status: item.status || "Pending"
                    }))

                    const filtered = searchTerm
                        ? formatted.filter(f =>
                            f.leadName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            f.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            f.company.toLowerCase().includes(searchTerm.toLowerCase())
                        )
                        : formatted

                    setFollowUps(filtered)

                    // Update stats
                    const s = { pending: 0, sent: 0, cancelled: 0, skipped: 0 }
                    data.forEach((item: any) => {
                        const status = item.status?.toLowerCase()
                        if (status === 'pending') s.pending++
                        if (status === 'sent') s.sent++
                        if (status === 'cancelled') s.cancelled++
                        if (status === 'skipped') s.skipped++
                    })
                    setStats(s)
                }
            } catch (err: any) {
                console.error("Error fetching follow-ups:", err.message || err)
            } finally {
                setIsLoading(false)
            }
        }

        fetchFollowUps()
    }, [supabase, filter, searchTerm])

    return (
        <div className="flex flex-col h-full gap-6 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <h1 className="text-3xl font-bold tracking-tight text-primary self-start sm:self-center">Follow-ups</h1>

                {/* Stats Cards */}
                <div className="flex gap-4 self-start sm:self-center">
                    <Card className="shadow-sm border-l-4 border-l-yellow-400 w-28 bg-yellow-50/50 dark:bg-yellow-900/10">
                        <CardContent className="p-4 flex flex-col items-center justify-center">
                            <span className="text-xl font-bold text-yellow-600">{stats.pending}</span>
                            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Pending</span>
                        </CardContent>
                    </Card>
                    <Card className="shadow-sm border-l-4 border-l-green-500 w-28 bg-green-50/50 dark:bg-green-900/10">
                        <CardContent className="p-4 flex flex-col items-center justify-center">
                            <span className="text-xl font-bold text-green-600">{stats.sent}</span>
                            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Sent</span>
                        </CardContent>
                    </Card>
                    <Card className="shadow-sm border-l-4 border-l-red-500 w-28 bg-red-50/50 dark:bg-red-900/10">
                        <CardContent className="p-4 flex flex-col items-center justify-center">
                            <span className="text-xl font-bold text-red-600">{stats.cancelled}</span>
                            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Cancelled</span>
                        </CardContent>
                    </Card>
                    <Card className="shadow-sm border-l-4 border-l-gray-500 w-28 bg-gray-50/50 dark:bg-gray-900/10">
                        <CardContent className="p-4 flex flex-col items-center justify-center">
                            <span className="text-xl font-bold text-gray-600">{stats.skipped}</span>
                            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Skipped</span>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Filters and Search */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="relative w-full">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name, email, or company..."
                        className="pl-9 w-full bg-background"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 shrink-0">
                    <Button
                        variant={filter === "All" ? "default" : "outline"}
                        onClick={() => setFilter("All")}
                        className={filter === "All" ? "bg-[#0f172a] hover:bg-[#1e293b]" : ""}
                    >
                        All
                    </Button>
                    <Button
                        variant={filter === "Pending" ? "default" : "outline"}
                        onClick={() => setFilter("Pending")}
                        className={filter === "Pending" ? "bg-yellow-600 hover:bg-yellow-700 text-white" : ""}
                    >
                        Pending
                    </Button>
                    <Button
                        variant={filter === "Sent" ? "default" : "outline"}
                        onClick={() => setFilter("Sent")}
                        className={filter === "Sent" ? "bg-green-600 hover:bg-green-700 text-white" : ""}
                    >
                        Sent
                    </Button>
                    <Button
                        variant={filter === "Cancelled" ? "default" : "outline"}
                        onClick={() => setFilter("Cancelled")}
                        className={filter === "Cancelled" ? "bg-red-600 hover:bg-red-700 text-white" : ""}
                    >
                        Cancelled
                    </Button>
                    <Button
                        variant={filter === "Skipped" ? "default" : "outline"}
                        onClick={() => setFilter("Skipped")}
                        className={filter === "Skipped" ? "bg-gray-600 hover:bg-gray-700 text-white" : ""}
                    >
                        Skipped
                    </Button>
                </div>
            </div>

            {/* Follow-ups Table */}
            <Card className="flex-1 flex flex-col overflow-hidden border shadow-md">
                <div className="flex-1 overflow-auto bg-background">
                    {isLoading ? (
                        <div className="flex items-center justify-center p-8 h-full">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : followUps.length === 0 ? (
                        <div className="flex items-center justify-center p-8 h-full text-muted-foreground">
                            No follow-ups found.
                        </div>
                    ) : (
                        <Table>
                            <TableHeader className="sticky top-0 bg-muted/50 z-10 backdrop-blur-sm">
                                <TableRow className="hover:bg-transparent border-b border-border">
                                    <TableHead className="w-[50px] font-semibold text-muted-foreground text-xs uppercase tracking-wider text-center">#</TableHead>
                                    <TableHead className="min-w-[200px] font-semibold text-muted-foreground text-xs uppercase tracking-wider">Lead</TableHead>
                                    <TableHead className="min-w-[150px] font-semibold text-muted-foreground text-xs uppercase tracking-wider">Sequence</TableHead>
                                    <TableHead className="min-w-[120px] font-semibold text-muted-foreground text-xs uppercase tracking-wider">Follow-up #</TableHead>
                                    <TableHead className="min-w-[100px] font-semibold text-muted-foreground text-xs uppercase tracking-wider">Days</TableHead>
                                    <TableHead className="min-w-[100px] font-semibold text-muted-foreground text-xs uppercase tracking-wider">Status</TableHead>
                                    <TableHead className="min-w-[120px] font-semibold text-muted-foreground text-xs uppercase tracking-wider text-center">Follow-up</TableHead>
                                    <TableHead className="text-right pr-6 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {followUps.map((row, index) => (
                                    <TableRow key={row.id} className="hover:bg-muted/30 transition-colors">
                                        <TableCell className="text-muted-foreground text-xs py-4 text-center">{index + 1}</TableCell>
                                        <TableCell className="py-4">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2">
                                                    <User className="h-4 w-4 text-muted-foreground" />
                                                    <span className="font-semibold text-foreground">{row.leadName}</span>
                                                </div>
                                                <div className="text-xs text-muted-foreground pl-6">{row.email}</div>
                                                <div className="flex items-center gap-1 text-xs text-muted-foreground pl-6">
                                                    <Building2 className="h-3 w-3" />
                                                    {row.company}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">{row.sequence}</TableCell>
                                        <TableCell className="text-sm font-medium">{row.followUpNumber}</TableCell>
                                        <TableCell className="text-sm text-muted-foreground">{row.days}</TableCell>
                                        <TableCell className="py-4">
                                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${row.status.toLowerCase() === 'sent' ? 'bg-green-100 text-green-700' :
                                                row.status.toLowerCase() === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                    row.status.toLowerCase() === 'cancelled' ? 'bg-red-100 text-red-700' :
                                                        'bg-gray-100 text-gray-700'
                                                }`}>
                                                {row.status}
                                            </span>
                                        </TableCell>
                                        <TableCell className="py-4 text-center">
                                            <Button
                                                size="sm"
                                                className="bg-[#0f172a] hover:bg-[#1e293b] text-xs h-8"
                                            >
                                                <Send className="w-3 h-3 mr-2" />
                                                Follow-up
                                            </Button>
                                        </TableCell>
                                        <TableCell className="text-right pr-4 py-4">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-8 shadow-sm"
                                            >
                                                View
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
