"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react"

export default function BookingsPage() {
    // Start with December 2025 to match the design, or use new Date() for current real time.
    // Using Dec 2025 as the initial state for consistency with the screenshot context.
    const [currentDate, setCurrentDate] = useState(new Date(2025, 11, 1))

    const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear()
        const month = date.getMonth()
        const firstDay = new Date(year, month, 1)
        const lastDay = new Date(year, month + 1, 0)
        const daysInMonth = lastDay.getDate()
        const startingDayOfWeek = firstDay.getDay() // 0 = Sunday

        const days = []

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
            days.push({
                day: i,
                currentMonth: true,
                isToday: i === 26 && month === 11 && year === 2025, // Mock "Today" for the screenshot match
                date: new Date(year, month, i)
            })
        }

        // Next month padding to fill 35 or 42 cells (5 or 6 rows)
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
        setCurrentDate(new Date(2025, 11, 1)) // Resetting to the "screenshot default" for this demo
    }

    const formattedMonth = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

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
                            <span className="text-xl font-bold text-foreground">0</span>
                            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Total</span>
                        </CardContent>
                    </Card>
                    <Card className="shadow-sm w-24 bg-green-50/50 dark:bg-green-900/10 border-green-100 dark:border-green-900/20">
                        <CardContent className="p-2 flex flex-col items-center justify-center h-full">
                            <span className="text-xl font-bold text-green-600">0</span>
                            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider text-center">Confirmed</span>
                        </CardContent>
                    </Card>
                    <Card className="shadow-sm w-24 bg-yellow-50/50 dark:bg-yellow-900/10 border-yellow-100 dark:border-yellow-900/20">
                        <CardContent className="p-2 flex flex-col items-center justify-center h-full">
                            <span className="text-xl font-bold text-yellow-600">0</span>
                            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider text-center">Pending</span>
                        </CardContent>
                    </Card>
                    <Card className="shadow-sm w-24 bg-red-50/50 dark:bg-red-900/10 border-red-100 dark:border-red-900/20">
                        <CardContent className="p-2 flex flex-col items-center justify-center h-full">
                            <span className="text-xl font-bold text-red-600">0</span>
                            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider text-center">Cancelled</span>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Calendar Card */}
            <Card className="flex-1 flex flex-col overflow-hidden shadow-sm border">
                <div className="p-4 flex items-center justify-between border-b">
                    <div className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-muted-foreground" />
                        <h2 className="text-lg font-semibold">{formattedMonth}</h2>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={prevMonth}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" className="h-8" onClick={goToToday}>
                            Today
                        </Button>
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={nextMonth}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <div className="flex-1 p-4 overflow-auto">
                    <div className="grid grid-cols-7 h-full gap-2 min-h-[500px]">
                        {/* Days Header */}
                        {daysOfWeek.map((day) => (
                            <div key={day} className="text-center text-xs font-semibold text-muted-foreground uppercase py-2">
                                {day}
                            </div>
                        ))}

                        {/* Calendar Grid */}
                        {calendarDays.map((day, index) => (
                            <div
                                key={index}
                                className={`
                                    border rounded-lg p-2 min-h-[100px] flex flex-col gap-1 relative transition-colors cursor-pointer
                                    ${day.currentMonth ? 'bg-card text-card-foreground hover:bg-accent/50' : 'bg-muted/20 text-muted-foreground opacity-50'}
                                    ${day.isToday ? 'border-primary ring-1 ring-primary' : 'border-neutral-200 dark:border-neutral-800'}
                                    hover:border-primary
                                `}
                            >
                                <span className={`text-sm font-medium ${!day.currentMonth ? 'opacity-50' : ''}`}>
                                    {day.day}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </Card>
        </div>
    )
}
