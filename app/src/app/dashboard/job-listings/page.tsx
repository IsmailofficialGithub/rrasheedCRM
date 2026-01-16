"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader2, Briefcase, Search, Building2, MapPin, DollarSign, Calendar, ExternalLink, RefreshCw, Filter, Mail } from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import { toast } from "sonner"
import { format } from "date-fns"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { CustomPagination } from "@/components/ui/pagination-custom"
import { Label } from "@/components/ui/label"

interface JobListing {
    id: string
    job_key: string | null
    job_title: string | null
    company_name: string | null
    job_url: string | null
    salary_min: number | null
    salary_max: number | null
    salary_text: string | null
    currency: string | null
    job_location: string | null
    company_address: string | null
    description_text: string | null
    shifts: string[] | null
    job_type: string[] | null
    is_remote: boolean | null
    status: boolean | null
    date_published: string | null
    emails: string[] | null
    created_at: string
    updated_at: string
}

export default function JobListingsPage() {
    const [jobListings, setJobListings] = useState<JobListing[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [jobTypeFilter, setJobTypeFilter] = useState<string>("")
    const [dateFilter, setDateFilter] = useState<string>("")
    const [page, setPage] = useState(1)
    const [totalCount, setTotalCount] = useState(0)
    const [totalPages, setTotalPages] = useState(0)
    const [availableJobTypes, setAvailableJobTypes] = useState<string[]>([])
    const itemsPerPage = 20

    const supabase = createClient()

    const fetchJobListings = useCallback(async (pageNumber = 1) => {
        setIsLoading(true)
        try {
            let query = supabase
                .from('job_listings')
                .select('*', { count: 'exact' })

            // Apply search filter
            if (searchTerm.trim()) {
                query = query.or(`job_title.ilike.%${searchTerm}%,company_name.ilike.%${searchTerm}%,description_text.ilike.%${searchTerm}%`)
            }

            // Apply job type filter
            if (jobTypeFilter) {
                query = query.contains('job_type', [jobTypeFilter])
            }

            // Apply date filter
            if (dateFilter) {
                query = query.eq('date_published', dateFilter)
            }

            // Get total count
            const { count } = await query

            // Apply pagination
            const from = (pageNumber - 1) * itemsPerPage
            const to = from + itemsPerPage - 1

            const { data, error } = await query
                .order('created_at', { ascending: false })
                .range(from, to)

            if (error) throw error

            setJobListings(data || [])
            setTotalCount(count || 0)
            setTotalPages(Math.ceil((count || 0) / itemsPerPage))

            // Extract unique job types for filter dropdown
            if (data) {
                const jobTypes = new Set<string>()
                data.forEach(job => {
                    if (job.job_type && Array.isArray(job.job_type)) {
                        job.job_type.forEach(type => jobTypes.add(type))
                    }
                })
                setAvailableJobTypes(Array.from(jobTypes).sort())
            }
        } catch (err: any) {
            console.error("Error fetching job listings:", err)
            toast.error("Failed to fetch job listings")
        } finally {
            setIsLoading(false)
        }
    }, [searchTerm, jobTypeFilter, dateFilter, supabase])

    // Fetch all unique job types on mount
    useEffect(() => {
        const fetchJobTypes = async () => {
            try {
                const { data, error } = await supabase
                    .from('job_listings')
                    .select('job_type')
                
                if (error) throw error
                
                const jobTypes = new Set<string>()
                data?.forEach(job => {
                    if (job.job_type && Array.isArray(job.job_type)) {
                        job.job_type.forEach(type => jobTypes.add(type))
                    }
                })
                setAvailableJobTypes(Array.from(jobTypes).sort())
            } catch (err) {
                console.error("Error fetching job types:", err)
            }
        }
        fetchJobTypes()
    }, [supabase])

    // Reset to page 1 when filters change
    useEffect(() => {
        setPage(1)
    }, [jobTypeFilter, dateFilter])

    useEffect(() => {
        fetchJobListings(page)
    }, [fetchJobListings, page])

    // Auto-refresh every 1 minute to get latest entries
    useEffect(() => {
        const interval = setInterval(() => {
            // Auto-refresh current page to get latest data
            if (!isLoading) {
                fetchJobListings(page)
            }
        }, 60000) // 60 seconds = 1 minute

        // Cleanup interval on unmount
        return () => clearInterval(interval)
    }, [page, isLoading, fetchJobListings])

    const handleSearch = () => {
        setPage(1)
        fetchJobListings(1)
    }

    const handleRefresh = () => {
        setPage(1)
        fetchJobListings(1)
    }

    const handleClearFilters = () => {
        setSearchTerm("")
        setJobTypeFilter("")
        setDateFilter("")
        setPage(1)
    }

    // Check if any job listing has emails
    const hasEmails = jobListings.some(job => job.emails && job.emails.length > 0)

    const formatSalary = (job: JobListing): string => {
        if (job.salary_text) {
            return job.salary_text
        }
        if (job.salary_min && job.salary_max) {
            return `${job.salary_min} - ${job.salary_max} ${job.currency || ''}`
        }
        if (job.salary_min) {
            return `${job.salary_min}+ ${job.currency || ''}`
        }
        if (job.salary_max) {
            return `Up to ${job.salary_max} ${job.currency || ''}`
        }
        return "—"
    }

    return (
        <div className="flex flex-col h-full gap-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight text-primary flex items-center gap-2">
                        <Briefcase className="h-8 w-8" />
                        Job Listings
                        <span className="text-base font-normal text-muted-foreground">
                            ({totalCount})
                        </span>
                    </h1>
                    <p className="text-muted-foreground">
                        Browse and manage job listings from various sources
                    </p>
                </div>
            </div>

            {/* Search and Filters */}
            <Card className="border shadow-sm">
                <CardContent className="pt-6">
                    <div className="space-y-4">
                        {/* Search Bar */}
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search by title, company, or description..."
                                    className="pl-9"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            handleSearch()
                                        }
                                    }}
                                />
                            </div>
                            <Button onClick={handleSearch} disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Searching...
                                    </>
                                ) : (
                                    <>
                                        <Search className="mr-2 h-4 w-4" />
                                        Search
                                    </>
                                )}
                            </Button>
                            <Button onClick={handleRefresh} disabled={isLoading} variant="outline">
                                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                            </Button>
                        </div>

                        {/* Filters */}
                        <div className="flex flex-wrap gap-4 items-end">
                            <div className="flex-1 min-w-[200px]">
                                <Label htmlFor="job-type-filter" className="mb-2 flex items-center gap-2">
                                    <Filter className="h-3 w-3" />
                                    Job Type
                                </Label>
                                <select
                                    id="job-type-filter"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={jobTypeFilter}
                                    onChange={(e) => {
                                        setJobTypeFilter(e.target.value)
                                        setPage(1)
                                    }}
                                >
                                    <option value="">All Types</option>
                                    {availableJobTypes.map((type) => (
                                        <option key={type} value={type}>
                                            {type}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex-1 min-w-[200px]">
                                <Label htmlFor="date-filter" className="mb-2 flex items-center gap-2">
                                    <Calendar className="h-3 w-3" />
                                    Date Published
                                </Label>
                                <Input
                                    id="date-filter"
                                    type="date"
                                    value={dateFilter}
                                    onChange={(e) => {
                                        setDateFilter(e.target.value)
                                        setPage(1)
                                    }}
                                />
                            </div>
                            {(searchTerm || jobTypeFilter || dateFilter) && (
                                <Button onClick={handleClearFilters} variant="outline" size="sm">
                                    Clear Filters
                                </Button>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Job Listings Table */}
            <Card className="flex-1 flex flex-col overflow-hidden border shadow-md">
                <CardHeader>
                    <CardTitle>Job Listings</CardTitle>
                    <CardDescription>
                        {searchTerm ? `Search results for "${searchTerm}"` : "All available job listings"}
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0 flex-1 flex flex-col overflow-hidden">
                    {isLoading ? (
                        <div className="flex items-center justify-center p-8 h-full">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : jobListings.length === 0 ? (
                        <div className="flex items-center justify-center p-8 h-full text-muted-foreground">
                            {searchTerm ? "No job listings found matching your search." : "No job listings found."}
                        </div>
                    ) : (
                        <>
                            <div className="flex-1 overflow-y-auto overflow-x-auto">
                                <Table>
                                    <TableHeader className="sticky top-0 bg-muted/50 z-10 backdrop-blur-sm">
                                        <TableRow className="hover:bg-transparent border-b border-border">
                                            <TableHead className="min-w-[200px] font-semibold text-muted-foreground text-xs uppercase tracking-wider py-4">Title</TableHead>
                                            <TableHead className="min-w-[150px] font-semibold text-muted-foreground text-xs uppercase tracking-wider py-4">Company</TableHead>
                                            <TableHead className="min-w-[150px] font-semibold text-muted-foreground text-xs uppercase tracking-wider py-4">Location</TableHead>
                                            <TableHead className="min-w-[150px] font-semibold text-muted-foreground text-xs uppercase tracking-wider py-4">Salary Range</TableHead>
                                            <TableHead className="min-w-[100px] font-semibold text-muted-foreground text-xs uppercase tracking-wider py-4">Type</TableHead>
                                            {hasEmails && (
                                                <TableHead className="min-w-[150px] font-semibold text-muted-foreground text-xs uppercase tracking-wider py-4">Email</TableHead>
                                            )}
                                            <TableHead className="min-w-[100px] font-semibold text-muted-foreground text-xs uppercase tracking-wider py-4">Remote</TableHead>
                                            <TableHead className="min-w-[120px] font-semibold text-muted-foreground text-xs uppercase tracking-wider py-4">Published</TableHead>
                                            <TableHead className="min-w-[100px] font-semibold text-muted-foreground text-xs uppercase tracking-wider text-right py-4">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {jobListings.map((job) => (
                                            <TableRow key={job.id} className="hover:bg-muted/30 transition-colors min-h-[80px]">
                                                <TableCell className="font-medium py-4">
                                                    <div className="flex flex-col gap-1.5">
                                                        <span className="text-sm">{job.job_title || "—"}</span>
                                                        {job.job_key && (
                                                            <span className="text-xs text-muted-foreground">Key: {job.job_key}</span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-4">
                                                    <div className="flex flex-col gap-1.5">
                                                        <span className="text-sm">{job.company_name || "—"}</span>
                                                        {job.company_address && 
                                                         typeof job.company_address === 'string' &&
                                                         job.company_address !== "[]" && 
                                                         job.company_address.trim() !== "" && (
                                                            <span className="text-xs text-muted-foreground">{job.company_address}</span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-4">
                                                    <div className="flex items-center gap-1 text-sm">
                                                        <MapPin className="h-3 w-3 text-muted-foreground" />
                                                        {job.job_location || "—"}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-sm py-4">
                                                    <div className="flex items-center gap-1">
                                                        <DollarSign className="h-3 w-3 text-muted-foreground" />
                                                        <span className="font-medium">{formatSalary(job)}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-4">
                                                    {job.job_type && job.job_type.length > 0 ? (
                                                        <div className="flex flex-wrap gap-1">
                                                            {job.job_type.slice(0, 2).map((type, idx) => (
                                                                <span 
                                                                    key={idx}
                                                                    className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground"
                                                                >
                                                                    {type}
                                                                </span>
                                                            ))}
                                                            {job.job_type.length > 2 && (
                                                                <span className="text-xs text-muted-foreground">
                                                                    +{job.job_type.length - 2}
                                                                </span>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        "—"
                                                    )}
                                                </TableCell>
                                                {hasEmails && (
                                                    <TableCell className="py-4">
                                                        {job.emails && job.emails.length > 0 ? (
                                                            <div className="flex items-center gap-1 text-sm">
                                                                <Mail className="h-3 w-3 text-muted-foreground" />
                                                                <span>{job.emails[0]}</span>
                                                                {job.emails.length > 1 && (
                                                                    <span className="text-xs text-muted-foreground">
                                                                        +{job.emails.length - 1}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            "—"
                                                        )}
                                                    </TableCell>
                                                )}
                                                <TableCell className="py-4">
                                                    {job.is_remote ? (
                                                        <span className="text-xs px-2 py-1 rounded bg-green-500/10 text-green-500">
                                                            Remote
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground">On-site</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="py-4">
                                                    {job.date_published ? (
                                                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                                            <Calendar className="h-3 w-3" />
                                                            {format(new Date(job.date_published), 'MMM dd, yyyy')}
                                                        </div>
                                                    ) : (
                                                        "—"
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right py-4">
                                                    {job.job_url && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => window.open(job.job_url || '', '_blank')}
                                                            className="h-8 w-8 p-0"
                                                        >
                                                            <ExternalLink className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="border-t p-4">
                                    <CustomPagination
                                        currentPage={page}
                                        totalPages={totalPages}
                                        onPageChange={setPage}
                                        totalItems={totalCount}
                                        itemsPerPage={itemsPerPage}
                                        isLoading={isLoading}
                                    />
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
