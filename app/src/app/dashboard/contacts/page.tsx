"use client"

import { useState, useEffect } from "react"
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
import { User, Phone, Mail, Plus, Pencil, Loader2 } from "lucide-react"
import { createClient } from "@/utils/supabase/client"

interface Contact {
    id: string | number
    name: string
    subtitle: string
    title: string
    email: string
    phone: string
    company: string
    status: string
}

export default function ContactsPage() {
    const [contacts, setContacts] = useState<Contact[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [totalCount, setTotalCount] = useState(0)

    const supabase = createClient()

    useEffect(() => {
        const fetchContacts = async () => {
            setIsLoading(true)
            try {
                // Fetch leads who have a decision maker name
                const { data, error, count } = await supabase
                    .from('leads')
                    .select('*', { count: 'exact' })
                    .not('decision_maker_name', 'is', null)
                    .neq('decision_maker_name', '')
                    .neq('decision_maker_name', '-')

                if (error) throw error

                if (data) {
                    const formattedContacts = data.map((lead, index) => {
                        let name = lead.decision_maker_name || "Unknown"
                        let title = "—"

                        // If name contains a comma, it's likely "Name, Title"
                        if (name.includes(',')) {
                            const parts = name.split(',')
                            name = parts[0].trim()
                            title = parts.slice(1).join(',').trim()
                        }

                        return {
                            id: index + 1,
                            name: name,
                            subtitle: "Lead",
                            title: title,
                            email: lead.email || "—",
                            phone: lead.phone_number || "—",
                            company: lead.company_name || "—",
                            status: "Lead"
                        }
                    })
                    setContacts(formattedContacts)
                    if (count !== null) setTotalCount(count)
                }
            } catch (err) {
                console.error("Error fetching contacts:", err)
            } finally {
                setIsLoading(false)
            }
        }

        fetchContacts()
    }, [supabase])

    return (
        <div className="flex flex-col h-full gap-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight text-primary flex items-center gap-2">
                    Contacts
                    <span className="text-base font-normal text-muted-foreground">
                        ({totalCount})
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
                    {isLoading ? (
                        <div className="flex items-center justify-center p-8 h-full">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : contacts.length === 0 ? (
                        <div className="flex items-center justify-center p-8 h-full text-muted-foreground">
                            No contacts found.
                        </div>
                    ) : (
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
                                {contacts.map((contact, index) => (
                                    <TableRow key={contact.id} className="hover:bg-muted/30 transition-colors">
                                        <TableCell className="text-muted-foreground text-xs text-center">{index + 1}</TableCell>
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
                    )}
                </div>
            </Card>
        </div>
    )
}
