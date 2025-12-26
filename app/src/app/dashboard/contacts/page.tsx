"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { User, Phone, Mail, Plus, Pencil } from "lucide-react"

// Dummy data based on the screenshot
const CONTACTS = [
    {
        id: 1,
        name: "Mark London",
        subtitle: "null",
        title: "Owner/Franchisee",
        email: "markl@gmail.com",
        phone: "+1 650-555-0101",
        company: "—",
        status: "—"
    },
    {
        id: 2,
        name: "Chen Suzhen",
        subtitle: "null",
        title: "Business Owner",
        email: "csuzhen@gmail.com",
        phone: "+1 650-555-0102",
        company: "—",
        status: "—"
    },
    {
        id: 3,
        name: "Kent McCorkle",
        subtitle: "null",
        title: "Business Owner",
        email: "kmccorkle@gmail.com",
        phone: "+1 650-555-0103",
        company: "—",
        status: "—"
    },
    {
        id: 4,
        name: "Michael Hume",
        subtitle: "null",
        title: "Proprietor; Proprietor",
        email: "mhume@gmail.com",
        phone: "+1 650-555-0104",
        company: "—",
        status: "—"
    },
    {
        id: 5,
        name: "Evan Turner",
        subtitle: "null",
        title: "Vice President",
        email: "eturner@gmail.com",
        phone: "+1 650-555-0105",
        company: "—",
        status: "—"
    },
    {
        id: 6,
        name: "Allyson Georgi",
        subtitle: "null",
        title: "Owner",
        email: "ageorgi@gmail.com",
        phone: "+1 650-555-0106",
        company: "—",
        status: "—"
    },
    {
        id: 7,
        name: "Lowell Hansen",
        subtitle: "null",
        title: "Company Owner",
        email: "lhansen@gmail.com",
        phone: "+1 650-555-0107",
        company: "—",
        status: "—"
    },
    {
        id: 8,
        name: "Weston Pearson",
        subtitle: "Finance, Operations",
        title: "Senior Vice President of Procurement & Supply Chain, MTY Franchising USA",
        email: "wpearson@gmail.com",
        phone: "+1 650-555-0108",
        company: "—",
        status: "—"
    },
    {
        id: 9,
        name: "Steve Wagenheim",
        subtitle: "null",
        title: "President",
        email: "swagenheim@gmail.com",
        phone: "+1 650-555-0109",
        company: "—",
        status: "—"
    },
    {
        id: 10,
        name: "Jason Sautter",
        subtitle: "null",
        title: "General Manager",
        email: "jsautter@gmail.com",
        phone: "+1 650-555-0110",
        company: "—",
        status: "—"
    },
    {
        id: 11,
        name: "Valerie Tetzlaff",
        subtitle: "null",
        title: "AR Collection Specialist/Billing Specialist",
        email: "vtetzlaff@gmail.com",
        phone: "+1 650-555-0111",
        company: "—",
        status: "—"
    },
    {
        id: 12,
        name: "Kathy Shearer",
        subtitle: "null",
        title: "Owner/Partner",
        email: "kshearer@gmail.com",
        phone: "+1 650-555-0112",
        company: "—",
        status: "—"
    },
    {
        id: 13,
        name: "Myra Anzaldua",
        subtitle: "null",
        title: "Floor Manager",
        email: "manzaldua@gmail.com",
        phone: "+1 650-555-0113",
        company: "—",
        status: "—"
    },
    {
        id: 14,
        name: "Bryan Mam",
        subtitle: "null",
        title: "Owner",
        email: "bmam@gmail.com",
        phone: "+1 650-555-0114",
        company: "—",
        status: "—"
    },
    {
        id: 15,
        name: "Diana Dee Buzzelli",
        subtitle: "null",
        title: "Buzzelli N Lightenment",
        email: "ddbuzzelli@gmail.com",
        phone: "+1 650-555-0115",
        company: "—",
        status: "—"
    }
]

export default function ContactsPage() {
    return (
        <div className="flex flex-col h-full gap-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight text-primary flex items-center gap-2">
                    Contacts
                    <span className="text-base font-normal text-muted-foreground">
                        (1000)
                    </span>
                </h1>
                <Button className="bg-[#0f172a] hover:bg-[#1e293b]">
                    <Plus className="h-4 w-4 mr-2" />
                    New Contact
                </Button>
            </div>

            {/* Table */}
            <Card className="flex-1 flex flex-col overflow-hidden border shadow-md">
                <div className="flex-1 overflow-auto bg-background">
                    <Table>
                        <TableHeader className="sticky top-0 bg-muted/50 z-10 backdrop-blur-sm">
                            <TableRow className="hover:bg-transparent border-b border-border">
                                <TableHead className="w-[50px] font-semibold text-muted-foreground text-xs uppercase tracking-wider text-center">#</TableHead>
                                <TableHead className="min-w-[200px] font-semibold text-muted-foreground text-xs uppercase tracking-wider">Name</TableHead>
                                <TableHead className="min-w-[200px] font-semibold text-muted-foreground text-xs uppercase tracking-wider">Job Title</TableHead>
                                <TableHead className="min-w-[200px] font-semibold text-muted-foreground text-xs uppercase tracking-wider">Email</TableHead>
                                <TableHead className="min-w-[150px] font-semibold text-muted-foreground text-xs uppercase tracking-wider">Phone</TableHead>
                                <TableHead className="min-w-[100px] font-semibold text-muted-foreground text-xs uppercase tracking-wider">Company</TableHead>
                                <TableHead className="min-w-[100px] font-semibold text-muted-foreground text-xs uppercase tracking-wider">Status</TableHead>
                                <TableHead className="text-right pr-6 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {CONTACTS.map((contact) => (
                                <TableRow key={contact.id} className="hover:bg-muted/30 transition-colors">
                                    <TableCell className="text-muted-foreground text-xs text-center">{contact.id}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                                                <User className="h-4 w-4 text-muted-foreground" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-medium text-sm text-foreground">{contact.name}</span>
                                                <span className="text-[10px] text-muted-foreground">{contact.subtitle}</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground truncate max-w-[300px]" title={contact.title}>
                                        {contact.title}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                                            <Mail className="h-3 w-3" />
                                            {contact.email}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                                            <Phone className="h-3 w-3" />
                                            {contact.phone}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground text-center">{contact.company}</TableCell>
                                    <TableCell className="text-sm text-muted-foreground text-center">{contact.status}</TableCell>
                                    <TableCell className="text-right pr-4">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                                            <Pencil className="h-4 w-4" />
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
