"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { HelpCircle, Users, PhoneCall, FileText, List, Briefcase, Settings } from "lucide-react"

import { cn } from "@/lib/utils"
// import { Button } from "@/components/ui/button"

export function DashboardNav() {
    const pathname = usePathname()

    const items = [
        {
            title: "Fetch Data",
            href: "/dashboard/how-it-works",
            icon: HelpCircle,
        },
        {
            title: "Contact Lists",
            href: "/dashboard/contact-lists",
            icon: List,
        },
        {
            title: "Contacts",
            href: "/dashboard/contacts",
            icon: Users,
        },
        {
            title: "Call Logs",
            href: "/dashboard/call-logs",
            icon: PhoneCall,
        },
        {
            title: "Generated Leads",
            href: "/dashboard/generated-leads",
            icon: FileText,
        },
        {
            title: "Job Listings",
            href: "/dashboard/job-listings",
            icon: Briefcase,
        },
        {
            title: "Settings",
            href: "/dashboard/settings",
            icon: Settings,
        },
    ]

    return (
        <nav className="grid items-start gap-2">
            {items.map((item, index) => {
                const Icon = item.icon
                return (
                    <Link key={index} href={item.href}>
                        <span
                            className={cn(
                                "group flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors",
                                pathname === item.href ? "bg-accent text-accent-foreground" : "transparent"
                            )}
                        >
                            <Icon className="mr-2 h-4 w-4" />
                            <span>{item.title}</span>
                        </span>
                    </Link>
                )
            })}
        </nav>
    )
}
