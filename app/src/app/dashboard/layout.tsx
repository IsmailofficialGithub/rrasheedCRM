import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import { DashboardNav } from '@/components/dashboard-nav'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const signOut = async () => {
        'use server'
        const supabase = await createClient()
        await supabase.auth.signOut()
        redirect('/login')
    }

    return (
        <div className="flex min-h-screen bg-muted/10">
            {/* Sidebar */}
            <aside className="hidden w-64 flex-col border-r bg-background md:flex fixed inset-y-0 z-50">
                <div className="flex h-16 items-center border-b px-6">
                    <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight text-primary">
                        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground text-lg">24</div>
                        24hourplacements
                    </Link>
                </div>
                <div className="flex-1 overflow-y-auto py-6 px-4">
                    <DashboardNav />
                </div>
                <div className="border-t p-4">
                    <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                        <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                            {user.email?.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="flex flex-col overflow-hidden">
                            <span className="truncate text-xs font-medium">{user.email}</span>
                            <span className="truncate text-[10px] text-muted-foreground">Pro Plan</span>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 md:pl-64 flex flex-col h-screen overflow-hidden">
                <header className="sticky top-0 z-40 h-16 border-b bg-background/95 backdrop-blur px-6 flex items-center justify-between shrink-0">
                    <div className="md:hidden font-bold text-lg">24hourplacements</div>
                    <div className="ml-auto flex items-center gap-4">
                        <ModeToggle />
                        <form action={signOut}>
                            <Button variant="outline" size="sm">
                                Sign out
                            </Button>
                        </form>
                    </div>
                </header>
                <main className="flex-1 overflow-y-auto p-6 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    )
}
