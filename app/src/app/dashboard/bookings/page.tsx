"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Loader2, User, Building2 } from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import { format, isSameDay, parseISO } from "date-fns"

interface Booking {
    id: string
    lead_id: string
    booking_date: string
    status: string
    leads?: {
        decision_maker_name: string | null
        company_name: string | null
    }
}

export default function BookingsPage() {
    const [currentDate, setCurrentDate] = useState(new Date())
    const [bookings, setBookings] = useState<Booking[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [stats, setStats] = useState({ total: 0, confirmed: 0, pending: 0, cancelled: 0 })

    const supabase = createClient()

    useEffect(() => {
        const fetchBookings = async () => {
            setIsLoading(true)
            try {
                const { data, error } = await supabase
                    .from('bookings')
                    .select('*, leads(decision_maker_name, company_name)')

                if (error) throw error

                if (data) {
                    setBookings(data as Booking[])

                    const s = { total: data.length, confirmed: 0, pending: 0, cancelled: 0 }
                    data.forEach((b: any) => {
                        const status = b.status?.toLowerCase()
                        if (status === 'confirmed') s.confirmed++
                        if (status === 'pending') s.pending++
                        if (status === 'cancelled') s.cancelled++
                    })
                    setStats(s)
                }
            } catch (err: any) {
                console.error("Error fetching bookings:", err.message || err)
            } finally {
                setIsLoading(false)
            }
        }

        fetchBookings()
    }, [supabase])

    const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear()
        const month = date.getMonth()
        const firstDay = new Date(year, month, 1)
        const lastDay = new Date(year, month + 1, 0)
        const daysInMonth = lastDay.getDate()
        const startingDayOfWeek = firstDay.getDay()

        const days = []
        const today = new Date()

        // Previous month padding
        const prevMonthLastDay = new Date(year, month, 0).getDate()
        for (let i = startingDayOfWeek - 1; i >= 0; i--) {
            days.push({
                day: prevMonthLastDay - i,
                currentMonth: false,
                date: new Date(year, month - 1, prevMonthLastDay - i)
            })
        }

        // Current month days
        for (let i = 1; i <= daysInMonth; i++) {
            const dayDate = new Date(year, month, i)
            days.push({
                day: i,
                currentMonth: true,
                isToday: isSameDay(dayDate, today),
                date: dayDate
            })
        }

        // Next month padding
        const totalCells = days.length > 35 ? 42 : 35
        const remainingCells = totalCells - days.length
        for (let i = 1; i <= remainingCells; i++) {
            days.push({
                day: i,
                currentMonth: false,
                date: new Date(year, month + 1, i)
            })
        }

        return days
    }

    const calendarDays = getDaysInMonth(currentDate)

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
    }

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
    }

    const goToToday = () => {
        setCurrentDate(new Date())
    }

    const formattedMonth = format(currentDate, 'MMMM yyyy')

    const getBookingsForDay = (date: Date) => {
        return bookings.filter(b => isSameDay(parseISO(b.booking_date), date))
    }

    return (
        <div className="flex flex-col h-full gap-6 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="self-start sm:self-center">
                    <h1 className="text-3xl font-bold tracking-tight text-primary">Bookings</h1>
                    <p className="text-muted-foreground">View and manage all calendar bookings</p>
                </div>

                {/* Stats Cards */}
                <div className="flex gap-4 self-start sm:self-center">
                    <Card className="shadow-sm w-24">
                        <CardContent className="p-2 flex flex-col items-center justify-center h-full">
                            <span className="text-xl font-bold text-foreground">{stats.total}</span>
                            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Total</span>
                        </CardContent>
                    </Card>
                    <Card className="shadow-sm w-24 bg-green-50/50 dark:bg-green-900/10 border-green-100 dark:border-green-900/20">
                        <CardContent className="p-2 flex flex-col items-center justify-center h-full">
                            <span className="text-xl font-bold text-green-600">{stats.confirmed}</span>
                            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider text-center">Confirmed</span>
                        </CardContent>
                    </Card>
                    <Card className="shadow-sm w-24 bg-yellow-50/50 dark:bg-yellow-900/10 border-yellow-100 dark:border-yellow-900/20">
                        <CardContent className="p-2 flex flex-col items-center justify-center h-full">
                            <span className="text-xl font-bold text-yellow-600">{stats.pending}</span>
                            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider text-center">Pending</span>
                        </CardContent>
                    </Card>
                    <Card className="shadow-sm w-24 bg-red-50/50 dark:bg-red-900/10 border-red-100 dark:border-red-900/20">
                        <CardContent className="p-2 flex flex-col items-center justify-center h-full">
                            <span className="text-xl font-bold text-red-600">{stats.cancelled}</span>
                            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider text-center">Cancelled</span>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Calendar Card */}
            <Card className="flex-1 flex flex-col overflow-hidden shadow-sm border">
                <div className="p-4 flex items-center justify-between border-b bg-muted/30">
                    <div className="flex items-center gap-2">
                        <CalendarIcon className="h-5 w-5 text-muted-foreground" />
                        <h2 className="text-lg font-semibold">{formattedMonth}</h2>
                        {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground ml-2" />}
                    </div>
                    <div className="flex items-center gap-1">
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={prevMonth}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" className="h-8 shadow-sm" onClick={goToToday}>
                            Today
                        </Button>
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={nextMonth}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <div className="flex-1 p-4 overflow-auto bg-background/50">
                    <div className="grid grid-cols-7 h-full gap-2 min-h-[500px]">
                        {/* Days Header */}
                        {daysOfWeek.map((day) => (
                            <div key={day} className="text-center text-xs font-semibold text-muted-foreground uppercase py-2">
                                {day}
                            </div>
                        ))}

                        {/* Calendar Grid */}
                        {calendarDays.map((day, index) => {
                            const dayBookings = getBookingsForDay(day.date)
                            return (
                                <div
                                    key={index}
                                    className={`
                                        border rounded-lg p-2 min-h-[120px] flex flex-col gap-1 relative transition-all duration-200
                                        ${day.currentMonth ? 'bg-card text-card-foreground hover:bg-accent/5' : 'bg-muted/10 text-muted-foreground opacity-40'}
                                        ${day.isToday ? 'border-primary ring-1 ring-primary shadow-sm bg-primary/5' : 'border-border'}
                                        hover:border-primary/50 group/day
                                    `}
                                >
                                    <span className={`text-sm font-bold mb-1 ${!day.currentMonth ? 'opacity-50' : ''}`}>
                                        {day.day}
                                    </span>

                                    <div className="flex flex-col gap-1 overflow-y-auto max-h-[80px] scrollbar-hide">
                                        {dayBookings.map(b => (
                                            <div
                                                key={b.id}
                                                className={`text-[10px] p-1 rounded border leading-tight ${b.status?.toLowerCase() === 'confirmed' ? 'bg-green-100/50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800' :
                                                    b.status?.toLowerCase() === 'pending' ? 'bg-yellow-100/50 border-yellow-200 text-yellow-700 dark:bg-yellow-900/20 dark:border-yellow-800' :
                                                        'bg-red-100/50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800'
                                                    }`}
                                            >
                                                <div className="font-bold truncate">{b.leads?.decision_maker_name || "Unknown"}</div>
                                                <div className="opacity-80 truncate">{format(parseISO(b.booking_date), 'h:mm a')}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </Card>
        </div>
    )
}
