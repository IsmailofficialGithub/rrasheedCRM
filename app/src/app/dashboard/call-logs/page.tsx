"use client"

import { useState, useEffect, useCallback } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, Filter, Phone, Clock, CheckCircle2, AlertCircle, ExternalLink, BarChart3, Zap, Calendar, Radio } from "lucide-react"
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

type TabType = "stats" | "immediate" | "schedule" | "ongoing" | "logs"

export default function CallLogsPage() {
  const [logs, setLogs] = useState<CallLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [activeTab, setActiveTab] = useState<TabType>("stats")

  const supabase = createClient()

  const fetchLogs = useCallback(async (pageNumber = 1, tab: TabType = activeTab) => {
    setIsLoading(true)
    const from = (pageNumber - 1) * ITEMS_PER_PAGE
    const to = from + ITEMS_PER_PAGE - 1

    let query = supabase
      .from('calls_log')
      .select('*, leads(decision_maker_name)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to)

    // Filter by tab type
    if (tab === "ongoing") {
      query = query.or('call_status.eq.ongoing,call_status.eq.initiated')
    } else if (tab === "immediate") {
      // Immediate calls are those created in the last hour
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
      query = query.gte('created_at', oneHourAgo)
    } else if (tab === "schedule") {
      // Scheduled calls - for now, we'll show calls with status 'scheduled' if it exists
      query = query.eq('call_status', 'scheduled')
    } else if (tab === "logs") {
      // All logs - no additional filter
    }
    // "stats" tab doesn't fetch logs, it shows statistics

    if (searchTerm) {
      query = query.or(`company.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`)
    }

    const { data, count } = await query

    if (data) {
      setLogs(data as CallLog[])
      if (count !== null) setTotalCount(count)
    }
    setIsLoading(false)
  }, [searchTerm, supabase, activeTab])

  useEffect(() => {
    if (activeTab !== "stats") {
      const timer = setTimeout(() => {
        fetchLogs(page, activeTab)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [page, searchTerm, activeTab, fetchLogs])

  // Fetch stats when stats tab is active
  useEffect(() => {
    if (activeTab === "stats") {
      // Fetch all logs for stats calculation
      supabase
        .from('calls_log')
        .select('*', { count: 'exact' })
        .then(({ data, count }) => {
          if (data) {
            setTotalCount(count || 0)
          }
        })
    }
  }, [activeTab, supabase])

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
      case 'ongoing':
      case 'initiated':
        return <Clock className="h-3.5 w-3.5 text-amber-500" />
      case 'failed':
        return <AlertCircle className="h-3.5 w-3.5 text-rose-500" />
      default:
        return <Clock className="h-3.5 w-3.5 text-muted-foreground" />
    }
  }

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

  // Calculate stats
  const calculateStats = () => {
    if (activeTab !== "stats") return null
    
    const completed = logs.filter(l => l.call_status?.toLowerCase() === 'completed').length
    const ongoing = logs.filter(l => l.call_status?.toLowerCase() === 'ongoing' || l.call_status?.toLowerCase() === 'initiated').length
    const failed = logs.filter(l => l.call_status?.toLowerCase() === 'failed').length
    const totalMinutes = logs.reduce((acc, log) => acc + (log.duration || 0), 0) / 60
    
    return {
      total: totalCount,
      completed,
      ongoing,
      failed,
      totalMinutes: Math.round(totalMinutes)
    }
  }

  const stats = calculateStats()

  const tabs = [
    { id: "stats" as TabType, label: "Call Stats", icon: BarChart3 },
    { id: "immediate" as TabType, label: "Immediate", icon: Zap },
    { id: "schedule" as TabType, label: "Schedule", icon: Calendar },
    { id: "ongoing" as TabType, label: "Ongoing", icon: Radio },
    { id: "logs" as TabType, label: "Logs", icon: Phone },
  ]

  return (
    <div className="flex flex-col min-h-[calc(100vh-8rem)] pb-20">
      <div className="flex-1 space-y-6 animate-in fade-in duration-500">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              {activeTab === "stats" ? "Call Statistics" : "Communication History"}
            </h2>
            <p className="text-muted-foreground">
              {activeTab === "stats" 
                ? "Overview of your call performance and metrics."
                : "Complete records of all calls initiated and their outcomes."}
            </p>
          </div>
        </div>

        {/* Call Stats View */}
        {activeTab === "stats" && stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-none bg-card/40 ring-1 ring-border/50 hover:ring-primary/30 transition-all">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Calls</p>
                  <p className="text-xl font-bold text-primary">{stats.total}</p>
                </div>
                <div className="h-8 w-8 rounded-lg bg-muted/50 flex items-center justify-center">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none bg-card/40 ring-1 ring-border/50 hover:ring-primary/30 transition-all">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Completed</p>
                  <p className="text-xl font-bold text-emerald-500">{stats.completed}</p>
                </div>
                <div className="h-8 w-8 rounded-lg bg-muted/50 flex items-center justify-center">
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none bg-card/40 ring-1 ring-border/50 hover:ring-primary/30 transition-all">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Ongoing</p>
                  <p className="text-xl font-bold text-amber-500">{stats.ongoing}</p>
                </div>
                <div className="h-8 w-8 rounded-lg bg-muted/50 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none bg-card/40 ring-1 ring-border/50 hover:ring-primary/30 transition-all">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Minutes</p>
                  <p className="text-xl font-bold text-primary">{stats.totalMinutes}m</p>
                </div>
                <div className="h-8 w-8 rounded-lg bg-muted/50 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        )}
        
        {activeTab !== "stats" && (
      <Card className="overflow-hidden border-none shadow-2xl bg-card/60 backdrop-blur-md ring-1 ring-border/50">
        <CardHeader className="pb-3 border-b bg-muted/20">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-xl font-semibold">
                {activeTab === "immediate" ? "Immediate Calls" :
                 activeTab === "schedule" ? "Scheduled Calls" :
                 activeTab === "ongoing" ? "Ongoing Calls" :
                 "Call Logs"}
              </CardTitle>
              <CardDescription>
                {activeTab === "immediate" ? "Calls from the last hour" :
                 activeTab === "schedule" ? "Upcoming scheduled calls" :
                 activeTab === "ongoing" ? "Currently active calls" :
                 `A total of ${totalCount} calls found in history.`}
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
                                log.call_status === 'ongoing' || log.call_status === 'initiated' ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
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
        )}
      </div>

      {/* Tab Navigation Bar - Fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 md:left-64 bg-background/95 backdrop-blur-sm border-t border-border z-50 shadow-lg">
        <div className="flex items-center justify-between px-4 py-3 max-w-7xl mx-auto">
          <div className="flex-1 max-w-md">
            {/* Search placeholder - can be added later */}
          </div>
          <div className="flex items-center gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id)
                    setPage(1)
                  }}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">
                    <Icon className="h-4 w-4" />
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
