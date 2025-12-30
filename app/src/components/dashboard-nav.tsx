"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Target, Mail, CornerUpLeft, MessageSquare, Calendar, Building2, Users, TrendingUp, Phone, PhoneCall } from "lucide-react"

import { cn } from "@/lib/utils"
// import { Button } from "@/components/ui/button"

export function DashboardNav() {
    const pathname = usePathname()

    const items = [
        {
            title: "Leads",
            href: "/dashboard/leads",
            icon: Target,
        },
        {
            title: "Outreach",
            href: "/dashboard/outreach",
            icon: Mail,
        },
        {
            title: "Follow-ups",
            href: "/dashboard/follow-ups",
            icon: CornerUpLeft, // Using CornerUpLeft for the back/return arrow style
        },
        {
            title: "Responses",
            href: "/dashboard/responses",
            icon: MessageSquare,
        },
        {
            title: "Bookings",
            href: "/dashboard/bookings",
            icon: Calendar,
        },
        {
            title: "Companies",
            href: "/dashboard/companies",
            icon: Building2,
        },
        {
            title: "Contacts",
            href: "/dashboard/contacts",
            icon: Users,
        },
        {
            title: "Calls",
            href: "/dashboard/calls",
            icon: Phone,
        },
        {
            title: "Call Logs",
            href: "/dashboard/call-logs",
            icon: PhoneCall,
        },
        {
            title: "Pipeline",
            href: "/dashboard/pipeline",
            icon: TrendingUp,
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
