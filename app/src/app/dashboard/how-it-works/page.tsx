"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, Search, CheckCircle2, AlertCircle, Download } from "lucide-react"
import { fetchLeadsByNiche, storeFetchedLeads } from "./actions"
import { toast } from "sonner"

interface FetchedLead {
    company_name: string
    job_posting_url?: string
    city_state?: string
    salary_range?: string
    decision_maker_name?: string
    email?: string
    phone_number?: string
}

export default function HowItWorksPage() {
    const [niche, setNiche] = useState("")
    const [isFetching, setIsFetching] = useState(false)
    const [fetchedLeads, setFetchedLeads] = useState<FetchedLead[]>([])
    const [isStoring, setIsStoring] = useState(false)

    const handleFetchLeads = async () => {
        if (!niche.trim()) {
            toast.error("Please enter a niche or keyword")
            return
        }

        setIsFetching(true)
        try {
            const result = await fetchLeadsByNiche(niche.trim())
            
            if (result.success) {
                // Use the data from the webhook response
                if (result.data && Array.isArray(result.data)) {
                    setFetchedLeads(result.data)
                    toast.success(`Successfully fetched ${result.data.length} leads`)
                } else {
                    setFetchedLeads([])
                    toast.success("Webhook called successfully")
                }
            } else {
                toast.error('error' in result ? result.error : "Failed to fetch leads")
            }
        } catch (error: any) {
            toast.error("Error fetching leads: " + error.message)
        } finally {
            setIsFetching(false)
        }
    }

    const handleStoreLeads = async () => {
        if (fetchedLeads.length === 0) {
            toast.error("No leads to store")
            return
        }

        setIsStoring(true)
        try {
            const result = await storeFetchedLeads(fetchedLeads)
            
            if (result.success) {
                toast.success(`Successfully stored ${result.count} leads in the database`)
                setFetchedLeads([])
                setNiche("")
            } else {
                toast.error(result.error || "Failed to store leads")
            }
        } catch (error: any) {
            toast.error("Error storing leads: " + error.message)
        } finally {
            setIsStoring(false)
        }
    }

    return (
        <div className="flex flex-col h-full gap-6 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-primary flex items-center gap-2">
                    Fetch Data
                </h1>
            </div>

            {/* Fetch Section */}
            <Card>
                <CardHeader>
                    <CardTitle>Fetch Leads by Niche</CardTitle>
                    <CardDescription>
                        Enter a niche or keyword to search for leads
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Enter niche or keyword (e.g., 'software engineer', 'marketing')"
                                className="pl-9"
                                value={niche}
                                onChange={(e) => setNiche(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && !isFetching) {
                                        handleFetchLeads()
                                    }
                                }}
                            />
                        </div>
                        <Button 
                            onClick={handleFetchLeads} 
                            disabled={isFetching || !niche.trim()}
                        >
                            {isFetching ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Fetching...
                                </>
                            ) : (
                                <>
                                    <Search className="mr-2 h-4 w-4" />
                                    Fetch Leads
                                </>
                            )}
                        </Button>
                    </div>

                    {fetchedLeads.length > 0 && (
                        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                            <span className="text-sm text-muted-foreground">
                                {fetchedLeads.length} leads fetched
                            </span>
                            <Button 
                                onClick={handleStoreLeads} 
                                disabled={isStoring}
                                size="sm"
                            >
                                {isStoring ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Storing...
                                    </>
                                ) : (
                                    <>
                                        <Download className="mr-2 h-4 w-4" />
                                        Store in Database
                                    </>
                                )}
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Results Table */}
            {fetchedLeads.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Fetched Leads</CardTitle>
                        <CardDescription>
                            Review the leads before storing them in the database
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Company</TableHead>
                                        <TableHead>Decision Maker</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Phone</TableHead>
                                        <TableHead>Location</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {fetchedLeads.map((lead, index) => (
                                        <TableRow key={index}>
                                            <TableCell className="font-medium">
                                                {lead.company_name}
                                            </TableCell>
                                            <TableCell>
                                                {lead.decision_maker_name || "—"}
                                            </TableCell>
                                            <TableCell>
                                                {lead.email || "—"}
                                            </TableCell>
                                            <TableCell>
                                                {lead.phone_number || "—"}
                                            </TableCell>
                                            <TableCell>
                                                {lead.city_state || "—"}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Empty State */}
            {fetchedLeads.length === 0 && !isFetching && (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <div className="rounded-full bg-muted p-4 mb-4">
                            <Search className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">No leads fetched yet</h3>
                        <p className="text-sm text-muted-foreground text-center max-w-md">
                            Enter a niche or keyword above and click "Fetch Leads" to retrieve leads from the API.
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
