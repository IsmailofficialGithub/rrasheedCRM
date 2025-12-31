"use client"

import { useState, useEffect, useCallback } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, Filter, PhoneCall, ArrowUpRight, MoreVertical, Loader2, ChevronLeft, ChevronRight, Phone } from "lucide-react"
import { Input } from "@/components/ui/input"
import { createClient } from "@/utils/supabase/client"
import { triggerCallWebhook } from "./actions"
import { toast } from "sonner"
import { CustomPagination } from "@/components/ui/pagination-custom"

interface Lead {
  id: string
  company_name: string
  job_posting_url: string | null
  city_state: string | null
  salary_range: string | null
  decision_maker_name: string | null
  email: string | null
  phone_number: string | null
  created_at: string
  updated_at: string
}

const getUrlHostName = (url: string | null) => {
  if (!url) return null;
  try {
    let hostname = new URL(url).hostname;
    hostname = hostname.replace('www.', '');
    hostname = hostname.replace('.com', '');
    hostname = hostname.replace('.in', '');
    hostname = hostname.replace('.co', '');
    hostname = hostname.replace('.net', '');
    hostname = hostname.replace('.org', '');
    hostname = hostname.replace('.org', '');
    return hostname;
  } catch (e) {
    return "Unknown";
  }
}

const ITEMS_PER_PAGE = 30

export default function CallsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isConnecting, setIsConnecting] = useState<string | null>(null)
  const [isUpdatingAll, setIsUpdatingAll] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  const supabase = createClient()


  const fetchLeads = useCallback(async (pageNumber = 1) => {
    setIsLoading(true)
    const from = (pageNumber - 1) * ITEMS_PER_PAGE
    const to = from + ITEMS_PER_PAGE - 1

    // Fetch leads with phone numbers (including those without decision_maker_name)
    let query = supabase
      .from('leads')
      .select('*', { count: 'exact' })
      .not('phone_number', 'is', null) // Only those which phone_number is not null
      .order('created_at', { ascending: false })
      .range(from, to)

    if (searchTerm) {
      query = query.or(`company_name.ilike.%${searchTerm}%,decision_maker_name.ilike.%${searchTerm}%,phone_number.ilike.%${searchTerm}%`)
    }

    const { data, error, count } = await query

    if (data) {
      // Position limits per company
      const positionLimits: { [key: string]: number } = {
        'Owner': 1,
        'CEO': 1,
        'President': 2,
        'General Manager': 4,
        'Director of Operations': 4,
        'Manager': 999 // Unlimited
      }

      // Weighted positions for better distribution (higher weight = more likely)
      const positionWeights: { [key: string]: number } = {
        'Owner': 5,
        'CEO': 8,
        'President': 12,
        'General Manager': 20,
        'Director of Operations': 20,
        'Manager': 35
      }

      // Track positions count per company
      const companyPositions = new Map<string, Map<string, number>>()

      // Get unique company names from current page data
      const companyNames = [...new Set(data.map(lead => lead.company_name))]

      // Fetch ALL existing positions for these companies from the entire database
      const { data: allCompanyLeads } = await supabase
        .from('leads')
        .select('company_name, decision_maker_name')
        .in('company_name', companyNames)
        .not('decision_maker_name', 'is', null)
        .neq('decision_maker_name', '')
        .neq('decision_maker_name', '-')

      // Collect existing positions for each company from ALL database records
      if (allCompanyLeads) {
        allCompanyLeads.forEach(lead => {
          if (lead.decision_maker_name && lead.decision_maker_name.trim() !== '' && lead.decision_maker_name.trim() !== '-') {
            if (!companyPositions.has(lead.company_name)) {
              companyPositions.set(lead.company_name, new Map())
            }
            const positions = companyPositions.get(lead.company_name)!
            const currentCount = positions.get(lead.decision_maker_name) || 0
            positions.set(lead.decision_maker_name, currentCount + 1)
          }
        })
      }


      // Helper function to get weighted random position
      const getWeightedRandomPosition = (availablePositions: string[]): string => {
        const totalWeight = availablePositions.reduce((sum, pos) => sum + positionWeights[pos], 0)
        let random = Math.random() * totalWeight

        for (const position of availablePositions) {
          random -= positionWeights[position]
          if (random <= 0) {
            return position
          }
        }
        return availablePositions[availablePositions.length - 1]
      }

      // Process leads and add random positions if missing
      const updatedLeads = await Promise.all(
        data.map(async (lead) => {
          // If decision_maker_name is null, empty, or just "-"
          if (!lead.decision_maker_name || lead.decision_maker_name.trim() === '' || lead.decision_maker_name.trim() === '-') {
            // Get positions already used for this company
            const usedPositions = companyPositions.get(lead.company_name) || new Map()

            // Find available positions for this company (based on limits)
            const availablePositions = Object.keys(positionLimits).filter(pos => {
              const currentCount = usedPositions.get(pos) || 0
              return currentCount < positionLimits[pos]
            })

            // If no positions available, skip this lead
            if (availablePositions.length === 0) {
              return lead
            }

            // Pick a weighted random available position
            const randomPosition = getWeightedRandomPosition(availablePositions)

            // Update the database
            const { data: updatedData, error: updateError } = await supabase
              .from('leads')
              .update({ decision_maker_name: randomPosition })
              .eq('id', lead.id)
              .select()
              .single()

            if (updatedData && !updateError) {
              // Mark this position as used for this company
              if (!companyPositions.has(lead.company_name)) {
                companyPositions.set(lead.company_name, new Map())
              }
              const positions = companyPositions.get(lead.company_name)!
              const currentCount = positions.get(randomPosition) || 0
              positions.set(randomPosition, currentCount + 1)
              return updatedData
            }
          }
          return lead
        })
      )



      // Filter to only show leads with actual names (containing comma)
      // Example: "Nicole Carroll, Director" ✓  vs "CEO" ✗
      const filteredData = updatedLeads.filter(lead => {
        if (!lead.decision_maker_name) return false
        // Only show if decision_maker_name contains a comma (Name, Position format)
        return lead.decision_maker_name.includes(',')
      })


      setLeads(filteredData)

      // Get the actual total count from database (all leads with phone numbers)
      if (count !== null) {
        setTotalCount(count)
      }
    }
    setIsLoading(false)
  }, [searchTerm, supabase])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLeads(page)
    }, 300)
    return () => clearTimeout(timer)
  }, [page, searchTerm, fetchLeads])

  const handleConnect = async (lead: Lead) => {
    setIsConnecting(lead.id)
    try {
      // Extract name from decision_maker_name (before comma if present)
      let nameToSend = lead.company_name
      if (lead.decision_maker_name) {
        // If it contains a comma, get the part before the comma (the name)
        if (lead.decision_maker_name.includes(',')) {
          nameToSend = lead.decision_maker_name.split(',')[0].trim()
        } else {
          // Otherwise use the full decision_maker_name
          nameToSend = lead.decision_maker_name
        }
      }

      const result = await triggerCallWebhook({
        id: lead.id,
        name: nameToSend,
        phone: lead.phone_number,
        company: lead.company_name,
        created_at: lead.created_at,
        updated_at: lead.updated_at,
        job_posting_url: lead.job_posting_url,
        city_state: lead.city_state,
        salary_range: lead.salary_range,
        decision_maker_name: lead.decision_maker_name,
        state: lead.city_state?.split(',').pop(),
        email: lead.email,
        phone_number: lead.phone_number,
        job_posting_platform: lead.job_posting_url ? getUrlHostName(lead.job_posting_url) : null,
      })

      if (result.success) {
        toast.success(`Calling ${nameToSend}...`, {
          description: `Connecting to ${lead.phone_number}`,
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
      setIsConnecting(null)
    }
  }

  const handleUpdateAllPositions = async () => {
    setIsUpdatingAll(true)
    try {
      // Position limits per company
      const positionLimits: { [key: string]: number } = {
        'Owner': 1,
        'CEO': 1,
        'President': 2,
        'General Manager': 4,
        'Director of Operations': 4,
        'Manager': 999
      }

      // Weighted positions for better distribution
      const positionWeights: { [key: string]: number } = {
        'Owner': 5,
        'CEO': 8,
        'President': 12,
        'General Manager': 20,
        'Director of Operations': 20,
        'Manager': 35
      }

      // Helper function to get weighted random position
      const getWeightedRandomPosition = (availablePositions: string[]): string => {
        const totalWeight = availablePositions.reduce((sum, pos) => sum + positionWeights[pos], 0)
        let random = Math.random() * totalWeight

        for (const position of availablePositions) {
          random -= positionWeights[position]
          if (random <= 0) {
            return position
          }
        }
        return availablePositions[availablePositions.length - 1]
      }

      // Fetch ALL leads with phone numbers from database
      const { data: allLeads } = await supabase
        .from('leads')
        .select('*')
        .not('phone_number', 'is', null)
        .order('company_name', { ascending: true })

      if (!allLeads || allLeads.length === 0) {
        toast.error('No leads found to update')
        return
      }

      // Track positions count per company
      const companyPositions = new Map<string, Map<string, number>>()

      // Helper function to extract position from decision_maker_name
      const extractPosition = (decisionMakerName: string): string | null => {
        if (!decisionMakerName || decisionMakerName.trim() === '' || decisionMakerName.trim() === '-') {
          return null
        }

        // If it contains a comma, extract the position part (after comma)
        if (decisionMakerName.includes(',')) {
          const parts = decisionMakerName.split(',')
          return parts[parts.length - 1].trim()
        }

        // Otherwise, it's just the position itself
        return decisionMakerName.trim()
      }

      // First, collect existing positions for each company
      allLeads.forEach(lead => {
        const position = extractPosition(lead.decision_maker_name)
        if (position) {
          if (!companyPositions.has(lead.company_name)) {
            companyPositions.set(lead.company_name, new Map())
          }
          const positions = companyPositions.get(lead.company_name)!
          const currentCount = positions.get(position) || 0
          positions.set(position, currentCount + 1)
        }
      })


      let updatedCount = 0

      // Process each lead
      for (const lead of allLeads) {
        // If decision_maker_name is null, empty, or just "-"
        if (!lead.decision_maker_name || lead.decision_maker_name.trim() === '' || lead.decision_maker_name.trim() === '-') {
          // Get positions already used for this company
          const usedPositions = companyPositions.get(lead.company_name) || new Map()

          // Find available positions for this company (based on limits)
          const availablePositions = Object.keys(positionLimits).filter(pos => {
            const currentCount = usedPositions.get(pos) || 0
            return currentCount < positionLimits[pos]
          })

          // If no positions available, skip this lead
          if (availablePositions.length === 0) {
            continue
          }

          // Pick a weighted random available position
          const randomPosition = getWeightedRandomPosition(availablePositions)

          // Update the database
          const { error: updateError } = await supabase
            .from('leads')
            .update({ decision_maker_name: randomPosition })
            .eq('id', lead.id)

          if (!updateError) {
            // Mark this position as used for this company
            if (!companyPositions.has(lead.company_name)) {
              companyPositions.set(lead.company_name, new Map())
            }
            const positions = companyPositions.get(lead.company_name)!
            const currentCount = positions.get(randomPosition) || 0
            positions.set(randomPosition, currentCount + 1)
            updatedCount++
          }
        }
      }

      toast.success(`Successfully updated ${updatedCount} leads with positions!`)
      // Refresh the current page
      fetchLeads(page)
    } catch (err: any) {
      toast.error('Error updating positions', {
        description: err.message,
      })
    } finally {
      setIsUpdatingAll(false)
    }
  }

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)



  return (
    <div className="flex-1 space-y-6 p-8 animate-in fade-in duration-500 overflow-y-auto max-h-screen">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Call Logs
          </h2>
          <p className="text-muted-foreground">
            Manage your call history and initiate new calls to leads.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* <Button
            onClick={handleUpdateAllPositions}
            disabled={isUpdatingAll}
            className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
          >
            {isUpdatingAll ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <PhoneCall className="mr-2 h-4 w-4" />
                Update All Positions
              </>
            )}
          </Button > */}
        </div>
      </div>

      <Card className="overflow-hidden border-none shadow-2xl bg-card/60 backdrop-blur-md ring-1 ring-border/50">
        <CardHeader className="pb-3 border-b bg-muted/20">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-xl font-semibold">Ready to Call</CardTitle>
              <CardDescription>
                Showing {totalCount} leads with available phone numbers
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative group">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  placeholder="Search leads..."
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
              <div className="absolute inset-0 flex items-center justify-center bg-background/20 backdrop-blur-sm z-10 transition-opacity">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : null}

            <Table>
              <TableHeader className="bg-muted/30 sticky top-0 z-10">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[80px] pl-6 font-semibold uppercase text-[10px] tracking-wider text-muted-foreground">ID</TableHead>
                  <TableHead className="font-semibold uppercase text-[10px] tracking-wider text-muted-foreground">Name</TableHead>
                  <TableHead className="font-semibold uppercase text-[10px] tracking-wider text-muted-foreground">Company</TableHead>
                  <TableHead className="font-semibold uppercase text-[10px] tracking-wider text-muted-foreground">Email</TableHead>
                  <TableHead className="font-semibold uppercase text-[10px] tracking-wider text-muted-foreground">Job Link</TableHead>
                  <TableHead className="font-semibold uppercase text-[10px] tracking-wider text-muted-foreground">Phone</TableHead>
                  <TableHead className="text-right pr-6 font-semibold uppercase text-[10px] tracking-wider text-muted-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.length > 0 ? (
                  leads.map((lead) => (
                    <TableRow
                      key={lead.id}
                      className="group border-muted/30 hover:bg-primary/5 transition-all duration-300"
                    >
                      <TableCell className="pl-6 font-mono text-[10px] text-muted-foreground/70">
                        {lead.id.slice(0, 8).toUpperCase()}
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex items-center gap-3">
                          {
                            lead.decision_maker_name ?
                              <div className="relative flex h-9 w-9 shrink-0 overflow-hidden rounded-full">
                                <div className="flex h-full w-full items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-xs border border-primary/20">
                                  {lead.decision_maker_name?.split(' ').slice(0, 2).map(n => n[0]).join('') || '24'}
                                </div>
                              </div>
                              : ""
                          }
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold leading-none group-hover:text-primary transition-colors">
                              {lead.decision_maker_name || ''}
                            </span>
                            {lead.decision_maker_name && (
                              <span className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                                at {lead.company_name}
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground/80 hover:text-primary transition-colors truncate max-w-[150px] inline-block">
                          {lead.company_name || "-"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground/80 hover:text-primary transition-colors truncate max-w-[150px] inline-block">
                          {lead.email || "-"}
                        </span>
                      </TableCell>
                      <TableCell>
                        {lead.job_posting_url ? (
                          <a
                            href={lead.job_posting_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-muted/50 text-[11px] font-medium text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all group/link"
                          >
                            View Post
                            <ArrowUpRight className="h-3 w-3 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
                          </a>
                        ) : (
                          <span className="text-muted-foreground/50 text-xs">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 group-hover:translate-x-1 transition-transform">
                          <span className="text-sm text-foreground/80 font-medium">{lead.phone_number}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={isConnecting === lead.id}
                          onClick={() => handleConnect(lead)}
                          className="opacity-0 group-hover:opacity-100 transition-all duration-300 bg-primary/10 hover:bg-primary hover:text-white text-primary rounded-full px-5 h-9 font-medium"
                        >
                          {isConnecting === lead.id ? (
                            <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <PhoneCall className="mr-2 h-3.5 w-3.5" />
                          )}
                          {isConnecting === lead.id ? "Connecting..." : "Connect"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : !isLoading && (
                  <TableRow>
                    <TableCell colSpan={6} className="h-64 text-center text-muted-foreground">
                      No leads with phone numbers found.
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

      {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-4">
        {[
            { label: "Total Leads", value: totalCount.toLocaleString(), change: "+5.2%", color: "text-primary" },
            { label: "Success Rate", value: "68%", change: "+2.1%", color: "text-emerald-500" },
            { label: "Daily Target", value: "25/40", change: "In Progress", color: "text-amber-500" }
        ].map((stat, i) => (
            <Card key={i} className="border-none bg-card/40 ring-1 ring-border/50 hover:ring-primary/30 transition-all cursor-default overflow-hidden group">
                <CardContent className="p-6 relative">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                        </div>
                        <div className="h-10 w-10 rounded-xl bg-muted/50 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                            <MoreVertical className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center gap-1.5">
                        <span className={`text-xs font-semibold ${stat.change.includes('+') ? 'text-emerald-500' : 'text-amber-500'}`}>
                            {stat.change}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-medium uppercase">Performance</span>
                    </div>
                </CardContent>
            </Card>
        ))}
      </div> */}
    </div>
  )
}
