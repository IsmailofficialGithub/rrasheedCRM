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
import { Search, Eye, User, Building2, Loader2 } from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import { format } from "date-fns"

interface ResponseData {
    id: string
    leadName: string
    email: string
    company: string
    subject: string
    snippet: string
    status: string
    generatedAt: string
    generatedTime: string
}

export default function ResponsesPage() {
    const [filter, setFilter] = useState("All")
    const [responses, setResponses] = useState<ResponseData[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0, sent: 0 })

    const supabase = createClient()

    useEffect(() => {
        const fetchResponses = async () => {
            setIsLoading(true)
            try {
                let query = supabase
                    .from('responses')
                    .select('*, leads(decision_maker_name, email, company_name)')

                if (filter !== "All") {
                    query = query.eq('status', filter)
                }

                if (searchTerm) {
                    query = query.or(`subject.ilike.%${searchTerm}%,snippet.ilike.%${searchTerm}%`)
                }

                const { data, error } = await query

                if (error) throw error

                if (data) {
                    const formatted = data.map((item: any) => ({
                        id: item.id,
                        leadName: item.leads?.decision_maker_name || "Unknown",
                        email: item.leads?.email || "—",
                        company: item.leads?.company_name || "—",
                        subject: item.subject || "No Subject",
                        snippet: item.snippet || "No Snippet",
                        status: item.status || "Pending",
                        generatedAt: format(new Date(item.generated_at), 'MMM dd, yyyy'),
                        generatedTime: format(new Date(item.generated_at), 'hh:mm a')
                    }))
                    setResponses(formatted)

                    // Update stats (simplified, normally would be a separate query or derived)
                    const s = { pending: 0, approved: 0, rejected: 0, sent: 0 }
                    data.forEach((item: any) => {
                        const status = item.status?.toLowerCase()
                        if (status === 'pending') s.pending++
                        if (status === 'approved') s.approved++
                        if (status === 'rejected') s.rejected++
                        if (status === 'sent') s.sent++
                    })
                    setStats(s)
                }
            } catch (err: any) {
                console.error("Error fetching responses:", err.message || err)
            } finally {
                setIsLoading(false)
            }
        }

        fetchResponses()
    }, [supabase, filter, searchTerm])

    return (
        <div className="flex flex-col h-full gap-6 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-primary">Responses</h1>
                <p className="text-muted-foreground">Review and manage AI-generated responses</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-4 gap-4">
                <Card className="shadow-sm border-l-4 border-l-yellow-400 bg-yellow-50/50 dark:bg-yellow-900/10">
                    <CardContent className="p-4 flex flex-col items-center justify-center">
                        <span className="text-2xl font-bold text-yellow-600">{stats.pending}</span>
                        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Pending</span>
                    </CardContent>
                </Card>
                <Card className="shadow-sm border-l-4 border-l-green-500 bg-green-50/50 dark:bg-green-900/10">
                    <CardContent className="p-4 flex flex-col items-center justify-center">
                        <span className="text-2xl font-bold text-green-600">{stats.approved}</span>
                        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Approved</span>
                    </CardContent>
                </Card>
                <Card className="shadow-sm border-l-4 border-l-red-500 bg-red-50/50 dark:bg-red-900/10">
                    <CardContent className="p-4 flex flex-col items-center justify-center">
                        <span className="text-2xl font-bold text-red-600">{stats.rejected}</span>
                        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Rejected</span>
                    </CardContent>
                </Card>
                <Card className="shadow-sm border-l-4 border-l-blue-500 bg-blue-50/50 dark:bg-blue-900/10">
                    <CardContent className="p-4 flex flex-col items-center justify-center">
                        <span className="text-2xl font-bold text-blue-600">{stats.sent}</span>
                        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Sent</span>
                    </CardContent>
                </Card>
            </div>

            {/* Filters and Search */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="relative w-full">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by lead name, email, company, or subject..."
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
                        variant="outline"
                        className="text-yellow-600 border-yellow-200 hover:bg-yellow-50 hover:text-yellow-700"
                        onClick={() => setFilter("Pending")}
                    >
                        Pending
                    </Button>
                    <Button
                        variant="outline"
                        className="text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700"
                        onClick={() => setFilter("Approved")}
                    >
                        Approved
                    </Button>
                    <Button
                        variant="outline"
                        className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                        onClick={() => setFilter("Rejected")}
                    >
                        Rejected
                    </Button>
                    <Button
                        variant="outline"
                        className="text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                        onClick={() => setFilter("Sent")}
                    >
                        Sent
                    </Button>
                </div>
            </div>

            {/* Responses Table */}
            <Card className="flex-1 flex flex-col overflow-hidden border shadow-md">
                <div className="flex-1 overflow-auto bg-background">
                    {isLoading ? (
                        <div className="flex items-center justify-center p-8 h-full">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : responses.length === 0 ? (
                        <div className="flex items-center justify-center p-8 h-full text-muted-foreground">
                            {searchTerm ? "No responses match your search." : "No responses found."}
                        </div>
                    ) : (
                        <Table>
                            <TableHeader className="sticky top-0 bg-muted/50 z-10 backdrop-blur-sm">
                                <TableRow className="hover:bg-transparent border-b border-border">
                                    <TableHead className="w-[50px] font-semibold text-muted-foreground text-xs uppercase tracking-wider">#</TableHead>
                                    <TableHead className="min-w-[200px] font-semibold text-muted-foreground text-xs uppercase tracking-wider">Lead</TableHead>
                                    <TableHead className="min-w-[400px] font-semibold text-muted-foreground text-xs uppercase tracking-wider">Subject</TableHead>
                                    <TableHead className="min-w-[120px] font-semibold text-muted-foreground text-xs uppercase tracking-wider">Status</TableHead>
                                    <TableHead className="min-w-[150px] font-semibold text-muted-foreground text-xs uppercase tracking-wider">Generated</TableHead>
                                    <TableHead className="text-right pr-6 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {responses.map((row, index) => (
                                    <TableRow key={row.id} className="hover:bg-muted/30 transition-colors">
                                        <TableCell className="text-muted-foreground text-xs py-4">{index + 1}</TableCell>
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
                                        <TableCell className="py-4">
                                            <div className="flex flex-col gap-1">
                                                <span className="font-medium text-blue-800 dark:text-blue-400">{row.subject}</span>
                                                <span className="text-xs text-muted-foreground line-clamp-1">{row.snippet}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4">
                                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${row.status.toLowerCase() === 'approved' ? 'bg-green-100 text-green-700' :
                                                row.status.toLowerCase() === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                    'bg-gray-100 text-gray-700'
                                                }`}>
                                                {row.status}
                                            </span>
                                        </TableCell>
                                        <TableCell className="py-4">
                                            <div className="flex flex-col text-xs text-muted-foreground">
                                                <span>{row.generatedAt}</span>
                                                <span>{row.generatedTime}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right pr-4 py-4">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-8 shadow-sm"
                                            >
                                                <Eye className="w-3 h-3 mr-2" />
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
