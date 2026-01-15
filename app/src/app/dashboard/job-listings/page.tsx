"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader2, Briefcase, Search, Building2, MapPin, DollarSign, Calendar, ExternalLink } from "lucide-react"
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

interface JobListing {
    id: string
    job_key: string
    source: string | null
    job_url: string | null
    title: string | null
    description_text: string | null
    job_type: string[] | null
    occupation: string[] | null
    company_name: string | null
    company_url: string | null
    company_logo_url: string | null
    company_industry: string | null
    location: any
    salary: any
    rating: any
    benefits: string[] | null
    requirements: string[] | null
    contacts: any
    num_of_candidates: number | null
    posted_today: boolean | null
    expired: boolean | null
    is_remote: boolean | null
    date_published: string | null
    age: string | null
    emails: string[] | null
    created_at: string
    updated_at: string
}

export default function JobListingsPage() {
    const [jobListings, setJobListings] = useState<JobListing[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [page, setPage] = useState(1)
    const [totalCount, setTotalCount] = useState(0)
    const [totalPages, setTotalPages] = useState(0)
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
                query = query.or(`title.ilike.%${searchTerm}%,company_name.ilike.%${searchTerm}%,description_text.ilike.%${searchTerm}%`)
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
        } catch (err: any) {
            console.error("Error fetching job listings:", err)
            toast.error("Failed to fetch job listings")
        } finally {
            setIsLoading(false)
        }
    }, [searchTerm, supabase])

    useEffect(() => {
        fetchJobListings(page)
    }, [fetchJobListings, page])

    const handleSearch = () => {
        setPage(1)
        fetchJobListings(1)
    }

    const formatLocation = (location: any): string => {
        if (!location) return "—"
        if (typeof location === 'string') return location
        if (location.city && location.state) {
            return `${location.city}, ${location.state}`
        }
        if (location.city) return location.city
        if (location.state) return location.state
        if (location.country) return location.country
        return "—"
    }

    const formatSalary = (salary: any): string => {
        if (!salary) return "—"
        if (typeof salary === 'string') return salary
        if (salary.min && salary.max) {
            return `${salary.min} - ${salary.max} ${salary.currency || ''}`
        }
        if (salary.amount) {
            return `${salary.amount} ${salary.currency || ''}`
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

            {/* Search Bar */}
            <Card className="border shadow-sm">
                <CardContent className="pt-6">
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
                <CardContent className="p-0 flex-1 overflow-auto">
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
                            <div className="overflow-auto">
                                <Table>
                                    <TableHeader className="sticky top-0 bg-muted/50 z-10 backdrop-blur-sm">
                                        <TableRow className="hover:bg-transparent border-b border-border">
                                            <TableHead className="min-w-[200px] font-semibold text-muted-foreground text-xs uppercase tracking-wider">Title</TableHead>
                                            <TableHead className="min-w-[150px] font-semibold text-muted-foreground text-xs uppercase tracking-wider">Company</TableHead>
                                            <TableHead className="min-w-[150px] font-semibold text-muted-foreground text-xs uppercase tracking-wider">Location</TableHead>
                                            <TableHead className="min-w-[120px] font-semibold text-muted-foreground text-xs uppercase tracking-wider">Salary</TableHead>
                                            <TableHead className="min-w-[100px] font-semibold text-muted-foreground text-xs uppercase tracking-wider">Type</TableHead>
                                            <TableHead className="min-w-[100px] font-semibold text-muted-foreground text-xs uppercase tracking-wider">Remote</TableHead>
                                            <TableHead className="min-w-[120px] font-semibold text-muted-foreground text-xs uppercase tracking-wider">Published</TableHead>
                                            <TableHead className="min-w-[100px] font-semibold text-muted-foreground text-xs uppercase tracking-wider text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {jobListings.map((job) => (
                                            <TableRow key={job.id} className="hover:bg-muted/30 transition-colors">
                                                <TableCell className="font-medium">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-sm">{job.title || "—"}</span>
                                                        {job.source && (
                                                            <span className="text-xs text-muted-foreground">{job.source}</span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        {job.company_logo_url && (
                                                            <img 
                                                                src={job.company_logo_url} 
                                                                alt={job.company_name || ""} 
                                                                className="h-6 w-6 rounded object-cover"
                                                            />
                                                        )}
                                                        <span className="text-sm">{job.company_name || "—"}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-1 text-sm">
                                                        <MapPin className="h-3 w-3 text-muted-foreground" />
                                                        {formatLocation(job.location)}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-sm">
                                                    <div className="flex items-center gap-1">
                                                        <DollarSign className="h-3 w-3 text-muted-foreground" />
                                                        {formatSalary(job.salary)}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
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
                                                <TableCell>
                                                    {job.is_remote ? (
                                                        <span className="text-xs px-2 py-1 rounded bg-green-500/10 text-green-500">
                                                            Remote
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground">On-site</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {job.date_published ? (
                                                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                                            <Calendar className="h-3 w-3" />
                                                            {format(new Date(job.date_published), 'MMM dd, yyyy')}
                                                        </div>
                                                    ) : (
                                                        "—"
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
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
