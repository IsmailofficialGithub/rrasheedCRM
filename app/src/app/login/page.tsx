import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { LoginForm } from './login-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function LoginPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
        return redirect('/dashboard')
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-primary p-4 relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-white/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-black/10 rounded-full blur-3xl animate-pulse" />

            <Card className="w-full max-w-lg shadow-2xl border-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 relative z-10">
                <CardHeader className="space-y-1 text-center pb-8 pt-10">
                    <div className="flex justify-center mb-6">
                        <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-3xl shadow-lg ring-4 ring-background">
                            24
                        </div>
                    </div>
                    <CardTitle className="text-3xl font-bold tracking-tight">Welcome Back</CardTitle>
                    <CardDescription className="text-base text-muted-foreground max-w-xs mx-auto">
                        Sign in to access your 24hourplacements CRM dashboard.
                    </CardDescription>
                </CardHeader>
                <CardContent className="px-8 pb-10">
                    <LoginForm />
                </CardContent>
            </Card>

            <div className="absolute bottom-6 text-primary-foreground/60 text-xs">
                © 2024 24hourplacements. All rights reserved.
            </div>
        </div>
    )
}
