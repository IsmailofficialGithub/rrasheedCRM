"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Upload, Loader2, Search, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react"
import { CsvImporter } from "@/components/leads/csv-importer"
import { Input } from "@/components/ui/input"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { createClient } from "@/utils/supabase/client"
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
}

const ITEMS_PER_PAGE = 500

export default function LeadsPage() {
    const [isImportOpen, setIsImportOpen] = useState(false)
    const [leads, setLeads] = useState<Lead[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [page, setPage] = useState(1)
    const [totalCount, setTotalCount] = useState(0)

    const supabase = createClient()

    const fetchLeads = async (pageNumber = 1) => {
        setIsLoading(true)
        const from = (pageNumber - 1) * ITEMS_PER_PAGE
        const to = from + ITEMS_PER_PAGE - 1

        const { data, error, count } = await supabase
            .from('leads')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(from, to)

        if (data) {
            setLeads(data)
            if (count !== null) setTotalCount(count)
        }
        setIsLoading(false)
    }

    useEffect(() => {
        fetchLeads(page)
    }, [page])

    const handleRefresh = () => {
        fetchLeads(page)
    }

    const filteredLeads = leads.filter(lead =>
        lead.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.email?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

    return (
        <div className="flex flex-col h-[calc(100vh-100px)] gap-4 animate-in fade-in duration-500">
            <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 shrink-0">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Leads</h2>
                    <p className="text-sm text-muted-foreground">Manage leads and sales pipeline. {totalCount} total.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full xl:w-auto">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search leads..."
                            className="pl-8"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="icon" onClick={handleRefresh} title="Refresh Leads">
                            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                        </Button>
                        <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline">
                                    <Upload className="mr-2 h-4 w-4" /> Import
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                    <DialogTitle>Import Leads</DialogTitle>
                                    <DialogDescription>
                                        Upload a CSV or Excel file to bulk import leads.
                                    </DialogDescription>
                                </DialogHeader>
                                <CsvImporter onImportComplete={() => { setIsImportOpen(false); handleRefresh(); }} />
                            </DialogContent>
                        </Dialog>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Add Lead
                        </Button>
                    </div>
                </div>
            </div>

            <Card className="flex-1 flex flex-col overflow-hidden">
                <CardContent className="flex-1 flex flex-col overflow-hidden p-0">
                    {isLoading ? (
                        <div className="flex flex-1 items-center justify-center p-8">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : filteredLeads.length === 0 ? (
                        <div className="flex flex-1 items-center justify-center p-8 text-muted-foreground border-2 border-dashed rounded-lg m-4">
                            {searchTerm ? "No leads found matching your search." : "No leads found. Add your first lead or import from CSV to get started."}
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col min-h-0">
                            <div className="flex-1 overflow-auto border-b relative bg-background">
                                <table className="w-full caption-bottom text-sm text-left">
                                    <TableHeader className="sticky top-0 bg-background/95 backdrop-blur z-20 shadow-sm border-b">
                                        <TableRow>
                                            <TableHead className="min-w-[150px]">Company</TableHead>
                                            <TableHead className="min-w-[150px]">Job URL</TableHead>
                                            <TableHead className="min-w-[150px]">Location</TableHead>
                                            <TableHead className="min-w-[120px]">Salary</TableHead>
                                            <TableHead className="min-w-[150px]">Decision Maker</TableHead>
                                            <TableHead className="min-w-[200px]">Email</TableHead>
                                            <TableHead className="min-w-[120px]">Phone</TableHead>
                                            <TableHead className="text-right min-w-[80px]">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredLeads.map((lead) => (
                                            <TableRow key={lead.id}>
                                                <TableCell className="font-medium whitespace-nowrap">{lead.company_name}</TableCell>
                                                <TableCell className="max-w-[200px] truncate" title={lead.job_posting_url || ""}>
                                                    {lead.job_posting_url ? (
                                                        <a href={lead.job_posting_url} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">
                                                            Link
                                                        </a>
                                                    ) : "-"}
                                                </TableCell>
                                                <TableCell className="whitespace-nowrap">{lead.city_state || "-"}</TableCell>
                                                <TableCell className="whitespace-nowrap">{lead.salary_range || "-"}</TableCell>
                                                <TableCell className="whitespace-nowrap">{lead.decision_maker_name || "-"}</TableCell>
                                                <TableCell className="max-w-[200px] truncate" title={lead.email || ""}>{lead.email || "-"}</TableCell>
                                                <TableCell className="whitespace-nowrap">{lead.phone_number || "-"}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="sm">View</Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </table>
                            </div>

                            <CustomPagination
                                currentPage={page}
                                totalPages={totalPages}
                                onPageChange={setPage}
                                totalItems={totalCount}
                                itemsPerPage={ITEMS_PER_PAGE}
                                isLoading={isLoading}
                            />
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
