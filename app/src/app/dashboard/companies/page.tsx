"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Building2, LayoutGrid, List, Ban, Plus, Globe, Facebook, Linkedin } from "lucide-react"

// Dummy data based on the screenshot
const COMPANIES = [
    {
        id: 1,
        name: "Pacific Hotel",
        locations: 0,
        icpScore: "0",
        employees: 120,
        revenue: "11,500,000",
        address: "Seattle, Washington, United States",
        website: true,
        linkedin: true,
        facebook: true
    },
    {
        id: 2,
        name: "El Tapatios Mexican Restaurant",
        locations: 0,
        icpScore: "0",
        employees: 11,
        revenue: "—",
        address: "608 Austin Ave, Waco, Texas, United States",
        website: true,
        linkedin: true,
        facebook: false
    },
    {
        id: 3,
        name: "Hotel Cashiers",
        locations: 0,
        icpScore: "0",
        employees: 11,
        revenue: "—",
        address: "7 Slab Town Rd, Cashiers, North Carolina",
        website: true,
        linkedin: true,
        facebook: true
    },
    {
        id: 4,
        name: "The Ritz-Carlton, Dallas",
        locations: 0,
        icpScore: "0",
        employees: 58,
        revenue: "—",
        address: "Dallas, Texas, United States",
        website: false,
        linkedin: true,
        facebook: false
    },
    {
        id: 5,
        name: "Top Malioboro Hotel",
        locations: 0,
        icpScore: "0",
        employees: 80,
        revenue: "—",
        address: "United States",
        website: true,
        linkedin: true,
        facebook: true
    },
    {
        id: 6,
        name: "Restaurant Manager POS",
        locations: 0,
        icpScore: "0",
        employees: 36,
        revenue: "—",
        address: "Silver Spring, Maryland, United States",
        website: false,
        linkedin: true,
        facebook: false
    },
    {
        id: 7,
        name: "Edge O Dells Bar and Restaurant",
        locations: 0,
        icpScore: "0",
        employees: 11,
        revenue: "—",
        address: "N555 US-12, Wisconsin Dells, Wisconsin",
        website: true,
        linkedin: true,
        facebook: false
    },
    {
        id: 8,
        name: "Duckstache Hospitality",
        locations: 0,
        icpScore: "0",
        employees: 13,
        revenue: "—",
        address: "3510 White Oak Drive, Houston, Texas",
        website: true,
        linkedin: true,
        facebook: false
    },
    {
        id: 9,
        name: "ATOM Hospitality Group",
        locations: 0,
        icpScore: "0",
        employees: 13,
        revenue: "—",
        address: "1120 Madison Ave, Mankato, Minnesota",
        website: true,
        linkedin: true,
        facebook: false
    },
    {
        id: 10,
        name: "Brambly Park",
        locations: 0,
        icpScore: "0",
        employees: 14,
        revenue: "—",
        address: "1708 Belleville St, Richmond, Virginia",
        website: true,
        linkedin: true,
        facebook: true
    },
    {
        id: 11,
        name: "SkiCNY",
        locations: 0,
        icpScore: "0",
        employees: 13,
        revenue: "3,000,000",
        address: "Syracuse, New York, United States",
        website: true,
        linkedin: true,
        facebook: false
    },
    {
        id: 12,
        name: "The Chloe",
        locations: 0,
        icpScore: "0",
        employees: 11,
        revenue: "—",
        address: "4125 St Charles Ave, New Orleans",
        website: true,
        linkedin: true,
        facebook: false
    },
    {
        id: 13,
        name: "Vienna Inn",
        locations: 0,
        icpScore: "0",
        employees: 19,
        revenue: "—",
        address: "120 Maple Ave E, Vienna, Virginia",
        website: true,
        linkedin: true,
        facebook: true
    },
    {
        id: 14,
        name: "Morimoto PA",
        locations: 0,
        icpScore: "0",
        employees: 14,
        revenue: "—",
        address: "723 Chestnut St, Philadelphia, Pennsylvania",
        website: true,
        linkedin: true,
        facebook: true
    },
    {
        id: 15,
        name: "DoubleTree by Hilton Charlotte... ",
        locations: 0,
        icpScore: "0",
        employees: 12,
        revenue: "—",
        address: "895 W Trade St, Charlotte, North Carolina",
        website: true,
        linkedin: true,
        facebook: true
    }
]

export default function CompaniesPage() {
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

    return (
        <div className="flex flex-col h-full gap-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-primary flex items-center gap-2">
                        Companies
                        <span className="text-sm font-normal text-muted-foreground self-end mb-1">
                            (80) Total Companies
                        </span>
                    </h1>
                    <p className="text-muted-foreground text-sm">Manage your company accounts</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center rounded-md border text-muted-foreground">
                        <Button
                            variant="ghost"
                            size="icon"
                            className={`h-8 w-8 rounded-none rounded-l-md ${viewMode === 'grid' ? 'bg-accent text-accent-foreground' : ''}`}
                            onClick={() => setViewMode("grid")}
                        >
                            <LayoutGrid className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className={`h-8 w-8 rounded-none rounded-r-md ${viewMode === 'list' ? 'bg-accent text-accent-foreground' : ''}`}
                            onClick={() => setViewMode("list")}
                        >
                            <List className="h-4 w-4" />
                        </Button>
                    </div>
                    <Button variant="outline" className="text-red-500 hover:text-red-600 hover:bg-red-50 h-9 border-red-200">
                        <Ban className="h-4 w-4 mr-2" />
                        DNC List
                    </Button>
                    <Button className="h-9 bg-[#0f172a] hover:bg-[#1e293b]">
                        <Plus className="h-4 w-4 mr-2" />
                        New Company
                    </Button>
                </div>
            </div>

            {/* Content */}
            {viewMode === "grid" ? (
                /* Grid View */
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pb-6">
                    {COMPANIES.map((company) => (
                        <Card key={company.id} className="flex flex-col shadow-sm">
                            <CardHeader className="flex flex-row items-center gap-3 p-4 pb-2">
                                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                                    <Building2 className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <div className="flex flex-col overflow-hidden">
                                    <h3 className="font-semibold truncate" title={company.name}>
                                        {company.name}
                                    </h3>
                                    <div className="text-xs text-muted-foreground">
                                        • {company.locations} locations
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent className="p-4 pt-2 flex flex-col gap-1 text-sm">
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">ICP Score:</span>
                                    <span className="font-medium">{company.icpScore}/100</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">Employees:</span>
                                    <span className="font-medium">{company.employees}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">Revenue:</span>
                                    <span className="font-medium">{company.revenue}</span>
                                </div>
                            </CardContent>

                            <CardFooter className="p-4 pt-0 mt-auto flex gap-2">
                                <Button variant="outline" className="flex-1 h-9">
                                    View
                                </Button>
                                <Button variant="outline" size="icon" className="h-9 w-9 text-red-400 hover:text-red-600 hover:bg-red-50 border-red-100">
                                    <Ban className="h-4 w-4" />
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            ) : (
                /* List View */
                <Card className="flex-1 flex flex-col overflow-hidden border shadow-md">
                    <div className="flex-1 overflow-auto bg-background">
                        <Table>
                            <TableHeader className="sticky top-0 bg-muted/50 z-10 backdrop-blur-sm">
                                <TableRow className="hover:bg-transparent border-b border-border">
                                    <TableHead className="w-[50px] font-semibold text-blue-900 dark:text-blue-300 text-xs uppercase tracking-wider text-center">#</TableHead>
                                    <TableHead className="min-w-[200px] font-semibold text-blue-900 dark:text-blue-300 text-xs uppercase tracking-wider">Company Name</TableHead>
                                    <TableHead className="min-w-[120px] font-semibold text-blue-900 dark:text-blue-300 text-xs uppercase tracking-wider text-center">Location Count</TableHead>
                                    <TableHead className="min-w-[300px] font-semibold text-blue-900 dark:text-blue-300 text-xs uppercase tracking-wider">Address</TableHead>
                                    <TableHead className="min-w-[100px] font-semibold text-blue-900 dark:text-blue-300 text-xs uppercase tracking-wider text-center">ICP Score</TableHead>
                                    <TableHead className="min-w-[100px] font-semibold text-blue-900 dark:text-blue-300 text-xs uppercase tracking-wider text-center">Employees</TableHead>
                                    <TableHead className="min-w-[120px] font-semibold text-blue-900 dark:text-blue-300 text-xs uppercase tracking-wider">Revenue</TableHead>
                                    <TableHead className="min-w-[80px] font-semibold text-blue-900 dark:text-blue-300 text-xs uppercase tracking-wider text-center">Website</TableHead>
                                    <TableHead className="min-w-[80px] font-semibold text-blue-900 dark:text-blue-300 text-xs uppercase tracking-wider text-center">LinkedIn</TableHead>
                                    <TableHead className="min-w-[80px] font-semibold text-blue-900 dark:text-blue-300 text-xs uppercase tracking-wider text-center">Facebook</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {COMPANIES.map((company) => (
                                    <TableRow key={company.id} className="hover:bg-muted/30 transition-colors">
                                        <TableCell className="text-blue-500 font-medium text-xs text-center py-4">{company.id}</TableCell>
                                        <TableCell className="py-4">
                                            <div className="flex items-center gap-2">
                                                <Building2 className="h-4 w-4 text-muted-foreground opacity-50" />
                                                <span className="font-semibold text-blue-900 dark:text-blue-400">{company.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground text-center py-4">{company.locations}</TableCell>
                                        <TableCell className="text-xs text-muted-foreground py-4 truncate max-w-[300px]" title={company.address}>{company.address}</TableCell>
                                        <TableCell className="py-4 text-center">
                                            <span className="inline-flex items-center justify-center rounded-md bg-muted px-2 py-1 text-xs font-bold text-muted-foreground">
                                                {company.icpScore}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground text-center py-4">{company.employees}</TableCell>
                                        <TableCell className="text-xs text-muted-foreground py-4">{company.revenue}</TableCell>
                                        <TableCell className="text-center py-4">
                                            {company.website && <Globe className="h-4 w-4 text-blue-500 mx-auto" />}
                                        </TableCell>
                                        <TableCell className="text-center py-4">
                                            {company.linkedin && <Linkedin className="h-4 w-4 text-blue-600 mx-auto" />}
                                        </TableCell>
                                        <TableCell className="text-center py-4">
                                            {company.facebook && <Facebook className="h-4 w-4 text-blue-700 mx-auto" />}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </Card>
            )}
        </div>
    )
}
