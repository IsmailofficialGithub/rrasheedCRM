"use client"

import { useState, useEffect, useCallback } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, Filter, Phone, Clock, CheckCircle2, AlertCircle, ExternalLink } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { createClient } from "@/utils/supabase/client"
import { CustomPagination } from "@/components/ui/pagination-custom"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface CallLog {
  uuid: string
  lead_id: string
  company: string
  phone: string
  duration: number | null
  call_status: string | null
  created_at: string
  updated_at: string
  leads?: {
    decision_maker_name: string | null
  }
}

const ITEMS_PER_PAGE = 20

export default function CallLogsPage() {
  const [logs, setLogs] = useState<CallLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  const supabase = createClient()

  const fetchLogs = useCallback(async (pageNumber = 1) => {
    setIsLoading(true)
    const from = (pageNumber - 1) * ITEMS_PER_PAGE
    const to = from + ITEMS_PER_PAGE - 1

    let query = supabase
      .from('calls_log')
      .select('*, leads(decision_maker_name)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to)

    if (searchTerm) {
      query = query.or(`company.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`)
    }

    const { data, count } = await query

    if (data) {
      setLogs(data as CallLog[])
      if (count !== null) setTotalCount(count)
    }
    setIsLoading(false)
  }, [searchTerm, supabase])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLogs(page)
    }, 300)
    return () => clearTimeout(timer)
  }, [page, searchTerm, fetchLogs])

  const formatDuration = (seconds: number | null) => {
    if (seconds === null) return "0s"
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`
  }

  const getStatusIcon = (status: string | null) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
      case 'initiated':
        return <Clock className="h-3.5 w-3.5 text-amber-500" />
      case 'failed':
        return <AlertCircle className="h-3.5 w-3.5 text-rose-500" />
      default:
        return <Clock className="h-3.5 w-3.5 text-muted-foreground" />
    }
  }

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

  return (
    <div className="flex-1 space-y-6 p-8 animate-in fade-in duration-500 overflow-y-auto max-h-screen">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Communication History
          </h2>
          <p className="text-muted-foreground">
            Complete records of all calls initiated and their outcomes.
          </p>
        </div>
      </div>
      
      <Card className="overflow-hidden border-none shadow-2xl bg-card/60 backdrop-blur-md ring-1 ring-border/50">
        <CardHeader className="pb-3 border-b bg-muted/20">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-xl font-semibold">Call Logs</CardTitle>
              <CardDescription>
                A total of {totalCount} calls found in history.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
                <div className="relative group">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                        placeholder="Search logs..."
                        className="w-[200px] lg:w-[300px] pl-8 bg-background/50 border-muted focus-visible:ring-primary/20 focus-visible:border-primary transition-all text-sm h-9"
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value)
                            setPage(1)
                        }}
                    />
                </div>
                <Button variant="outline" size="sm" className="h-9 hover:bg-primary/10 hover:text-primary transition-colors">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="relative min-h-[400px]">
            {isLoading ? (
                <div className="absolute inset-0 flex items-center justify-center bg-background/20 backdrop-blur-sm z-10">
                    <Clock className="h-8 w-8 animate-pulse text-primary/50" />
                </div>
            ) : null}
            
            <Table>
                <TableHeader className="bg-muted/30 sticky top-0 z-10">
                <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[150px] pl-6 font-semibold uppercase text-[10px] tracking-wider text-muted-foreground">Timestamp</TableHead>
                    <TableHead className="font-semibold uppercase text-[10px] tracking-wider text-muted-foreground">Recipient</TableHead>
                    <TableHead className="font-semibold uppercase text-[10px] tracking-wider text-muted-foreground">Company</TableHead>
                    <TableHead className="font-semibold uppercase text-[10px] tracking-wider text-muted-foreground">Status</TableHead>
                    <TableHead className="font-semibold uppercase text-[10px] tracking-wider text-muted-foreground">Duration</TableHead>
                    <TableHead className="text-right pr-6 font-semibold uppercase text-[10px] tracking-wider text-muted-foreground">Reference</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {logs.length > 0 ? (
                    logs.map((log) => (
                    <TableRow 
                        key={log.uuid} 
                        className="group border-muted/30 hover:bg-primary/5 transition-all duration-300"
                    >
                        <TableCell className="pl-6 py-4">
                            <div className="flex flex-col gap-0.5">
                                <span className="text-sm font-medium whitespace-nowrap">
                                    {format(new Date(log.created_at), 'MMM dd, yyyy')}
                                </span>
                                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                    <Clock className="h-2.5 w-2.5" />
                                    {format(new Date(log.created_at), 'hh:mm a')}
                                </span>
                            </div>
                        </TableCell>
                        <TableCell>
                            <div className="flex flex-col">
                                <span className="text-sm font-semibold text-foreground/90">
                                    {log.leads?.decision_maker_name || "Unknown Contact"}
                                </span>
                                <span className="text-[11px] text-muted-foreground font-mono mt-0.5">
                                    {log.phone}
                                </span>
                            </div>
                        </TableCell>
                        <TableCell>
                            <span className="text-sm text-muted-foreground/80 font-medium">
                                {log.company}
                            </span>
                        </TableCell>
                        <TableCell>
                            <div className={cn(
                                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                                log.call_status === 'completed' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                                log.call_status === 'initiated' ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                                "bg-rose-500/10 text-rose-500 border-rose-500/20"
                            )}>
                                {getStatusIcon(log.call_status)}
                                {log.call_status || 'Unknown'}
                            </div>
                        </TableCell>
                        <TableCell>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                                <Clock className="h-3.5 w-3.5 text-muted-foreground/50" />
                                {formatDuration(log.duration)}
                            </div>
                        </TableCell>
                        <TableCell className="text-right pr-6">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary transition-colors">
                                <ExternalLink className="h-4 w-4" />
                            </Button>
                        </TableCell>
                    </TableRow>
                    ))
                ) : !isLoading && (
                    <TableRow>
                        <TableCell colSpan={6} className="h-64 text-center text-muted-foreground">
                            <div className="flex flex-col items-center gap-2">
                                <AlertCircle className="h-8 w-8 text-muted-foreground/30" />
                                <p>No call logs found matching your request.</p>
                            </div>
                        </TableCell>
                    </TableRow>
                )}
                </TableBody>
            </Table>
          </div>
          
          <CustomPagination 
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            totalItems={totalCount}
            itemsPerPage={ITEMS_PER_PAGE}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pb-4">
        {[
            { label: "Total Minutes", value: "842m", icon: Clock, color: "text-primary" },
            { label: "Success Rate", value: "72.4%", icon: CheckCircle2, color: "text-emerald-500" },
            { label: "Failures", value: "12", icon: AlertCircle, color: "text-rose-500" },
            { label: "Active Today", value: "28", icon: Phone, color: "text-amber-500" }
        ].map((stat, i) => (
            <Card key={i} className="border-none bg-card/40 ring-1 ring-border/50 hover:ring-primary/30 transition-all cursor-default">
                <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                            <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                        </div>
                        <div className="h-8 w-8 rounded-lg bg-muted/50 flex items-center justify-center">
                            <stat.icon className="h-4 w-4 text-muted-foreground" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        ))}
      </div>
    </div>
  )
}
