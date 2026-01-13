"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/utils/supabase/client"
import { Loader2, Users, Building2, Phone, Mail } from "lucide-react"

export default function DashboardPage() {
    const [stats, setStats] = useState({
        totalLeads: 0,
        totalCompanies: 0,
        totalCalls: 0,
        totalResponses: 0,
        recentLeads: [] as any[]
    })
    const [isLoading, setIsLoading] = useState(true)

    const supabase = createClient()

    useEffect(() => {
        const fetchDashboardData = async () => {
            setIsLoading(true)
            try {
                // Fetch Leads count
                const { count: leadsCount } = await supabase
                    .from('leads')
                    .select('*', { count: 'exact', head: true })

                // Fetch Unique Companies count (approximate since Supabase count doesn't support distinct easily in one go)
                const { data: companyData } = await supabase
                    .from('leads')
                    .select('company_name')

                const uniqueCompanies = new Set(companyData?.map(l => l.company_name)).size

                // Fetch Calls count
                const { count: callsCount } = await supabase
                    .from('calls_log')
                    .select('*', { count: 'exact', head: true })

                // Fetch Responses count
                const { count: responsesCount } = await supabase
                    .from('responses')
                    .select('*', { count: 'exact', head: true })

                // Fetch Recent Leads
                const { data: recentLeads } = await supabase
                    .from('leads')
                    .select('decision_maker_name, email, company_name, created_at')
                    .order('created_at', { ascending: false })
                    .limit(5)

                setStats({
                    totalLeads: leadsCount || 0,
                    totalCompanies: uniqueCompanies || 0,
                    totalCalls: callsCount || 0,
                    totalResponses: responsesCount || 0,
                    recentLeads: recentLeads || []
                })
            } catch (err: any) {
                console.error("Error fetching dashboard stats:", err.message || err)
            } finally {
                setIsLoading(false)
            }
        }

        fetchDashboardData()
    }, [supabase])

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                    <p className="text-muted-foreground">Overview of your activity and performance.</p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[
                    { title: "Total Leads", value: stats.totalLeads.toLocaleString(), change: "All active leads", icon: <Users className="h-4 w-4" /> },
                    { title: "Companies", value: stats.totalCompanies.toLocaleString(), change: "Unique organizations", icon: <Building2 className="h-4 w-4" /> },
                    { title: "Total Calls", value: stats.totalCalls.toLocaleString(), change: "Outbound call logs", icon: <Phone className="h-4 w-4" /> },
                    { title: "AI Responses", value: stats.totalResponses.toLocaleString(), change: "Generated outreach", icon: <Mail className="h-4 w-4" /> }
                ].map((item, i) => (
                    <Card key={i} className="hover:scale-[1.01] transition-transform duration-200 border shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                {item.title}
                            </CardTitle>
                            <div className="text-muted-foreground">
                                {item.icon}
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{item.value}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {item.change}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4 shadow-sm border">
                    <CardHeader>
                        <CardTitle>Outreach Performance</CardTitle>
                        <CardDescription>Activity breakdown for the current period.</CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <div className="h-[300px] flex items-center justify-center bg-muted/20 rounded-md border border-dashed border-muted-foreground/30 m-4 mt-0">
                            <div className="flex flex-col items-center gap-2">
                                <span className="text-muted-foreground text-sm font-medium">Activity Chart Visualization</span>
                                <span className="text-[10px] text-muted-foreground">(Requires Charting Library Installation)</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="col-span-3 shadow-sm border">
                    <CardHeader>
                        <CardTitle>Recent Leads</CardTitle>
                        <CardDescription>
                            Latest {stats.recentLeads.length} leads added to the system.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-8">
                            {stats.recentLeads.length === 0 ? (
                                <div className="text-center text-muted-foreground text-sm py-8">
                                    No leads found.
                                </div>
                            ) : (
                                stats.recentLeads.map((lead, i) => (
                                    <div key={i} className="flex items-center">
                                        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                                            {lead.decision_maker_name?.split(',')[0]?.split(' ').map((n: string) => n[0]).join('') || '??'}
                                        </div>
                                        <div className="ml-4 space-y-1 overflow-hidden">
                                            <p className="text-sm font-medium leading-none truncate">{lead.decision_maker_name || "Unknown"}</p>
                                            <p className="text-xs text-muted-foreground truncate">{lead.email || "No email"}</p>
                                        </div>
                                        <div className="ml-auto text-xs font-medium text-muted-foreground text-right shrink-0">
                                            {lead.company_name}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
