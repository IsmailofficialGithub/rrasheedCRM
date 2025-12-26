"use client"

import { useFormStatus } from 'react-dom'
import { login } from './actions'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"

function SubmitButton() {
    const { pending } = useFormStatus()
    return (
        <Button
            formAction={login}
            className="w-full bg-primary text-primary-foreground font-bold hover:bg-primary/90 h-10 transition-all rounded-full"
            disabled={pending}
        >
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Log in"}
        </Button>
    )
}

export function LoginForm() {
    return (
        <form className="space-y-5">
            <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground/90 font-medium">Email Address</Label>
                <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="name@company.com"
                    required
                    className="bg-background/50 border-input focus:ring-primary focus:border-primary rounded-lg h-10"
                />
            </div>
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-foreground/90 font-medium">Password</Label>
                    <a href="#" className="text-xs text-primary hover:underline font-medium">Forgot?</a>
                </div>
                <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                    className="bg-background/50 border-input focus:ring-primary focus:border-primary rounded-lg h-10"
                />
            </div>

            <div className="pt-2">
                <SubmitButton />
            </div>
        </form>
    )
}
