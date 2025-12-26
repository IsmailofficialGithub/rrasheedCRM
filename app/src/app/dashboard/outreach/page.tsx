"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Send } from "lucide-react"

// Dummy data for visualization
const DUMMY_DATA = [
    {
        id: 1,
        lead: "Marc Malnati",
        email: "marc@loumalnatis.com",
        company: "Lou Malnati's",
        title: "Owner",
        status: "Not Started",
        lastContact: "—",
    },
    {
        id: 2,
        lead: "Rik Jenkins",
        email: "rjenkins@ruthschris.com",
        company: "Ruth's Chris Steak House",
        title: "Senior Vice President Operations",
        status: "Not Started",
        lastContact: "—",
    },
    {
        id: 3,
        lead: "Joe Hernandez",
        email: "jhernandez@hcnetwork.org",
        company: "hcnetwork",
        title: "President/CEO",
        status: "Not Started",
        lastContact: "—",
    },
    {
        id: 4,
        lead: "John Fitchett",
        email: "john.fitchett@fyzicalhq.com",
        company: "FYZICAL Therapy & Balance Centers",
        title: "SVP of Franchising FYZICAL Therapy and Balance Centers",
        status: "Not Started",
        lastContact: "—",
    },
    {
        id: 5,
        lead: "Julie Riggs",
        email: "jriggs@jimmnicks.com",
        company: "Jim 'N Nick's",
        title: "Local Owner",
        status: "Not Started",
        lastContact: "—",
    },
    {
        id: 6,
        lead: "Howard Kosel",
        email: "howard@hkcglobal.com",
        company: "HKC Global",
        title: "VP High Performance Kitchens",
        status: "Not Started",
        lastContact: "—",
    },
    {
        id: 7,
        lead: "Dion Firooznia",
        email: "dfirooznia@pizzainn.com",
        company: "Pizza Inn",
        title: "Business Owner",
        status: "Not Started",
        lastContact: "—",
    },
    {
        id: 8,
        lead: "Kevin Bazner",
        email: "kbazner@awrestaurants.com",
        company: "A&W Restaurants",
        title: "Chairman",
        status: "Not Started",
        lastContact: "—",
    },
    {
        id: 9,
        lead: "Clint Woods",
        email: "cwoods@foxrc.com",
        company: "Fox Restaurant Concepts (foxrc)",
        title: "Owner",
        status: "Not Started",
        lastContact: "—",
    },
    {
        id: 10,
        lead: "Kirsten Hibbert",
        email: "khibbert@donatos.com",
        company: "Donatos",
        title: "Owner",
        status: "Not Started",
        lastContact: "—",
    },
    {
        id: 11,
        lead: "Orlando Parra",
        email: "orlando.parra@igniteco.com",
        company: "Ignite (igniteco.com)",
        title: "Owner",
        status: "Not Started",
        lastContact: "—",
    },
    {
        id: 12,
        lead: "Savanna Trimmer",
        email: "stephenville@fuzzystacoshop.com",
        company: "Fuzzy's Taco Shop",
        title: "District Manager",
        status: "Not Started",
        lastContact: "—",
    },
    {
        id: 13,
        lead: "Christian Shomberg",
        email: "christian@officeparkplaza.com",
        company: "Office Park Plaza",
        title: "Owner",
        status: "Not Started",
        lastContact: "—",
    }
]

export default function OutreachPage() {
    return (
        <div className="flex flex-col h-full gap-6 animate-in fade-in duration-500">
            {/* Header Section with Stats */}
            <div className="flex flex-col gap-4">
                <h1 className="text-3xl font-bold tracking-tight text-primary">Outreach</h1>

                <div className="flex gap-4">
                    <Card className="shadow-sm border-l-4 border-l-primary w-32">
                        <CardContent className="p-4 flex flex-col justify-center items-center">
                            <span className="text-2xl font-bold text-foreground">76</span>
                            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Not Started</span>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm border-l-4 border-l-green-500 w-32">
                        <CardContent className="p-4 flex flex-col justify-center items-center">
                            <span className="text-2xl font-bold text-green-600">0</span>
                            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Responded</span>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm border-l-4 border-l-purple-500 w-32">
                        <CardContent className="p-4 flex flex-col justify-center items-center">
                            <span className="text-2xl font-bold text-purple-600">0</span>
                            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Booked</span>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Table Section */}
            <Card className="flex-1 flex flex-col overflow-hidden border shadow-md">
                <div className="flex-1 overflow-auto bg-background">
                    <Table>
                        <TableHeader className="sticky top-0 bg-muted/50 z-10 backdrop-blur-sm">
                            <TableRow className="hover:bg-transparent border-b border-border">
                                <TableHead className="w-[40px] pl-4">
                                    <Checkbox />
                                </TableHead>
                                <TableHead className="w-[50px] font-semibold text-muted-foreground text-xs uppercase tracking-wider">#</TableHead>
                                <TableHead className="min-w-[150px] font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                                    Lead
                                </TableHead>
                                <TableHead className="min-w-[200px] font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                                    Email
                                </TableHead>
                                <TableHead className="min-w-[200px] font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                                    Company
                                </TableHead>
                                <TableHead className="min-w-[150px] font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                                    Title
                                </TableHead>
                                <TableHead className="min-w-[100px] font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                                    Status
                                </TableHead>
                                <TableHead className="min-w-[100px] font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                                    Last Contact
                                </TableHead>
                                <TableHead className="text-right pr-6 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                                    Action
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {DUMMY_DATA.map((row) => (
                                <TableRow key={row.id} className="hover:bg-muted/30 transition-colors">
                                    <TableCell className="pl-4">
                                        <Checkbox />
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-xs">{row.id}</TableCell>
                                    <TableCell className="font-medium text-foreground">{row.lead}</TableCell>
                                    <TableCell className="text-muted-foreground text-sm">{row.email}</TableCell>
                                    <TableCell className="text-muted-foreground text-sm flex items-center gap-2">
                                        <span className="opacity-50">🏢</span> {row.company}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm">{row.title}</TableCell>
                                    <TableCell>
                                        <span className="inline-flex items-center rounded-full border border-gray-200 px-2.5 py-0.5 text-xs font-semibold text-gray-500 bg-gray-50 dark:bg-gray-900 dark:text-gray-400 dark:border-gray-800">
                                            {row.status}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm">{row.lastContact}</TableCell>
                                    <TableCell className="text-right pr-4">
                                        <Button
                                            size="sm"
                                            className="bg-[#0f172a] hover:bg-[#1e293b] text-white shadow-sm h-8 px-3 text-xs font-medium"
                                        >
                                            <Send className="w-3 h-3 mr-2" />
                                            Start Outreach
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </Card>
        </div>
    )
}
