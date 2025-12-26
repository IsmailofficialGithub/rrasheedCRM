"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Building2, LayoutGrid, List, Ban, Plus } from "lucide-react"

// Dummy data based on the screenshot
const COMPANIES = [
    {
        id: 1,
        name: "Pacific Hotel",
        locations: 0,
        icpScore: "0/100",
        employees: 120,
        revenue: "11,500,000",
    },
    {
        id: 2,
        name: "El Tapatios Mexican Restaurant",
        locations: 0,
        icpScore: "0/100",
        employees: 11,
        revenue: "N/A",
    },
    {
        id: 3,
        name: "Hotel Cashiers",
        locations: 0,
        icpScore: "0/100",
        employees: 11,
        revenue: "N/A",
    },
    {
        id: 4,
        name: "The Ritz-Carlton, Dallas",
        locations: 0,
        icpScore: "0/100",
        employees: 58,
        revenue: "N/A",
    },
    {
        id: 5,
        name: "Top Malioboro Hotel",
        locations: 0,
        icpScore: "0/100",
        employees: 50,
        revenue: "N/A",
    },
    {
        id: 6,
        name: "Restaurant Manager POS",
        locations: 0,
        icpScore: "0/100",
        employees: 36,
        revenue: "N/A",
    },
    {
        id: 7,
        name: "Edge O Dells Bar and Restaurant",
        locations: 0,
        icpScore: "0/100",
        employees: 11,
        revenue: "N/A",
    },
    {
        id: 8,
        name: "Duckstache Hospitality",
        locations: 0,
        icpScore: "0/100",
        employees: 13,
        revenue: "N/A",
    },
    {
        id: 9,
        name: "ATOM Hospitality Group",
        locations: 0,
        icpScore: "0/100",
        employees: 13,
        revenue: "N/A",
    },
    {
        id: 10,
        name: "Brambly Park",
        locations: 0,
        icpScore: "0/100",
        employees: 14,
        revenue: "N/A",
    },
    {
        id: 11,
        name: "SkiCNY",
        locations: 0,
        icpScore: "0/100",
        employees: 13,
        revenue: "3,000,000",
    },
    {
        id: 12,
        name: "The Chloe",
        locations: 0,
        icpScore: "0/100",
        employees: 11,
        revenue: "N/A",
    },
    {
        id: 13,
        name: "Vienna Inn",
        locations: 0,
        icpScore: "0/100",
        employees: 19,
        revenue: "N/A",
    },
    {
        id: 14,
        name: "Morimoto PA",
        locations: 0,
        icpScore: "0/100",
        employees: 14,
        revenue: "N/A",
    },
    {
        id: 15,
        name: "DoubleTree by Hilton Charlotte... ",
        locations: 0,
        icpScore: "0/100",
        employees: 12,
        revenue: "N/A",
    }
]

export default function CompaniesPage() {
    return (
        <div className="flex flex-col h-full gap-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-primary flex items-center gap-2">
                        Companies
                        <span className="text-sm font-normal text-muted-foreground self-end mb-1">
                            (50) Total Companies
                        </span>
                    </h1>
                    <p className="text-muted-foreground text-sm">Manage your company accounts</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center rounded-md border text-muted-foreground">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-none rounded-l-md bg-accent text-accent-foreground">
                            <LayoutGrid className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-none rounded-r-md">
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

            {/* Grid */}
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
                                <span className="font-medium">{company.icpScore}</span>
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
        </div>
    )
}
