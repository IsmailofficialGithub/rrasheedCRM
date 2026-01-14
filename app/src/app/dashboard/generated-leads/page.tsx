"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Loader2, Play, Pause, Volume2, FileText, AlertCircle } from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import { CustomPagination } from "@/components/ui/pagination-custom"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface GeneratedLead {
    id: string
    lead_id: string
    niche: string
    voice_url: string | null
    transcript: string | null
    status: string
    created_at: string
    updated_at: string
    leads?: {
        company_name: string
        decision_maker_name: string | null
        email: string | null
        phone_number: string | null
    }
}

const ITEMS_PER_PAGE = 20

export default function GeneratedLeadsPage() {
    const [leads, setLeads] = useState<GeneratedLead[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [page, setPage] = useState(1)
    const [totalCount, setTotalCount] = useState(0)
    const [playingId, setPlayingId] = useState<string | null>(null)
    const [audioRefs, setAudioRefs] = useState<Map<string, HTMLAudioElement>>(new Map())

    const supabase = createClient()

    const fetchLeads = useCallback(async (pageNumber = 1) => {
        setIsLoading(true)
        const from = (pageNumber - 1) * ITEMS_PER_PAGE
        const to = from + ITEMS_PER_PAGE - 1

        let query = supabase
            .from('generated_leads')
            .select('*, leads(company_name, decision_maker_name, email, phone_number)', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(from, to)

        if (searchTerm) {
            query = query.or(`niche.ilike.%${searchTerm}%,leads.company_name.ilike.%${searchTerm}%`)
        }

        const { data, count } = await query

        if (data) {
            setLeads(data as GeneratedLead[])
            if (count !== null) setTotalCount(count)
        }
        setIsLoading(false)
    }, [searchTerm, supabase])

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchLeads(page)
        }, 300)
        return () => clearTimeout(timer)
    }, [page, searchTerm, fetchLeads])

    const handlePlayPause = (leadId: string, voiceUrl: string | null) => {
        if (!voiceUrl) {
            return
        }

        if (playingId === leadId) {
            // Pause
            const audio = audioRefs.get(leadId)
            if (audio) {
                audio.pause()
            }
            setPlayingId(null)
        } else {
            // Play
            // Stop any currently playing audio
            if (playingId) {
                const currentAudio = audioRefs.get(playingId)
                if (currentAudio) {
                    currentAudio.pause()
                }
            }

            // Create or get audio element
            let audio = audioRefs.get(leadId)
            if (!audio) {
                audio = new Audio(voiceUrl)
                audio.addEventListener('ended', () => {
                    setPlayingId(null)
                })
                setAudioRefs(prev => new Map(prev).set(leadId, audio!))
            }

            audio.play()
            setPlayingId(leadId)
        }
    }

    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

    return (
        <div className="flex-1 space-y-6 p-8 animate-in fade-in duration-500 overflow-y-auto max-h-screen">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                    <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                        Generated Leads
                    </h2>
                    <p className="text-muted-foreground">
                        View leads with voice recordings and transcripts
                    </p>
                </div>
            </div>

            <Card className="overflow-hidden border-none shadow-2xl bg-card/60 backdrop-blur-md ring-1 ring-border/50">
                <CardHeader className="pb-3 border-b bg-muted/20">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="space-y-1">
                            <CardTitle className="text-xl font-semibold">Leads with Voice & Transcript</CardTitle>
                            <CardDescription>
                                A total of {totalCount} generated leads found
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
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="relative min-h-[400px]">
                        {isLoading ? (
                            <div className="absolute inset-0 flex items-center justify-center bg-background/20 backdrop-blur-sm z-10">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : null}

                        <Table>
                            <TableHeader className="bg-muted/30 sticky top-0 z-10">
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="w-[150px] pl-6 font-semibold uppercase text-[10px] tracking-wider text-muted-foreground">Date</TableHead>
                                    <TableHead className="font-semibold uppercase text-[10px] tracking-wider text-muted-foreground">Contact</TableHead>
                                    <TableHead className="font-semibold uppercase text-[10px] tracking-wider text-muted-foreground">Company</TableHead>
                                    <TableHead className="font-semibold uppercase text-[10px] tracking-wider text-muted-foreground">Niche</TableHead>
                                    <TableHead className="font-semibold uppercase text-[10px] tracking-wider text-muted-foreground">Voice</TableHead>
                                    <TableHead className="font-semibold uppercase text-[10px] tracking-wider text-muted-foreground">Transcript</TableHead>
                                    <TableHead className="font-semibold uppercase text-[10px] tracking-wider text-muted-foreground">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {leads.length > 0 ? (
                                    leads.map((lead) => (
                                        <TableRow
                                            key={lead.id}
                                            className="group border-muted/30 hover:bg-primary/5 transition-all duration-300"
                                        >
                                            <TableCell className="pl-6 py-4">
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="text-sm font-medium whitespace-nowrap">
                                                        {format(new Date(lead.created_at), 'MMM dd, yyyy')}
                                                    </span>
                                                    <span className="text-[10px] text-muted-foreground">
                                                        {format(new Date(lead.created_at), 'hh:mm a')}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-semibold text-foreground/90">
                                                        {lead.leads?.decision_maker_name || "Unknown"}
                                                    </span>
                                                    <span className="text-[11px] text-muted-foreground">
                                                        {lead.leads?.email || "No email"}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm text-muted-foreground/80 font-medium">
                                                    {lead.leads?.company_name || "—"}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm text-muted-foreground/80 font-medium">
                                                    {lead.niche}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                {lead.voice_url ? (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handlePlayPause(lead.id, lead.voice_url)}
                                                        className="h-8"
                                                    >
                                                        {playingId === lead.id ? (
                                                            <>
                                                                <Pause className="h-3.5 w-3.5 mr-2" />
                                                                Pause
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Play className="h-3.5 w-3.5 mr-2" />
                                                                Play
                                                            </>
                                                        )}
                                                    </Button>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">No audio</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {lead.transcript ? (
                                                    <div className="max-w-xs">
                                                        <p className="text-xs text-muted-foreground line-clamp-2">
                                                            {lead.transcript}
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">No transcript</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className={cn(
                                                    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                                                    lead.status === 'Completed' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                                                    lead.status === 'Pending' ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                                                    "bg-rose-500/10 text-rose-500 border-rose-500/20"
                                                )}>
                                                    {lead.status}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : !isLoading && (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-64 text-center text-muted-foreground">
                                            <div className="flex flex-col items-center gap-2">
                                                <AlertCircle className="h-8 w-8 text-muted-foreground/30" />
                                                <p>No generated leads found.</p>
                                                <p className="text-xs">Fetch leads in the "How it Works" tab to get started.</p>
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
        </div>
    )
}
