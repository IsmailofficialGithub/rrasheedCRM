"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, Plus, RefreshCw, Settings, Save, Info, Mail, Calendar as CalendarIcon, Clock } from "lucide-react"

export default function PipelinePage() {
    const [strategy, setStrategy] = useState("moderate")
    const [delay, setDelay] = useState("6")
    const [prompt, setPrompt] = useState(`You are an expert email responder for B2B sales conversations.

Analyze the conversation history and generate a professional, helpful response to the client's latest email.

Guidelines:
1. Be professional, friendly, and solution-oriented
2. Address all questions and concerns raised by the client
3. Keep the response concise and focused
4. Include a clear next step or call-to-action when appropriate
5. Maintain the conversation's tone and context
6. If the client shows interest, suggest a meeting or next steps
7. If they have concerns, address them directly and offer solutions

Context:
[Use variables like {{lead_name}}, {{company_name}}, {{conversation_history}}, {{client_message}}]`)

    return (
        <div className="flex flex-col h-full gap-6 animate-in fade-in duration-500 pb-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-primary">Email Outreach Pipeline</h1>
                    <p className="text-muted-foreground">Manage your email warm-up and outreach campaigns</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button className="bg-[#0f172a] hover:bg-[#1e293b]">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Sequence
                    </Button>
                    <Button variant="outline">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                    </Button>
                    <Button variant="outline">
                        <Settings className="h-4 w-4 mr-2" />
                        Settings
                    </Button>
                </div>
            </div>

            {/* Email Sequences Section */}
            <Card className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div className="flex items-center gap-2">
                        <Mail className="h-5 w-5 text-muted-foreground" />
                        <CardTitle className="text-lg font-medium">Email Sequences</CardTitle>
                    </div>
                    <Button size="sm" className="bg-[#0f172a] hover:bg-[#1e293b]">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Sequence
                    </Button>
                </CardHeader>
                <CardContent className="min-h-[150px] flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/50" />
                </CardContent>
            </Card>

            {/* AI Responder Configuration */}
            <Card className="shadow-sm">
                <CardHeader className="pb-4">
                    <div className="flex items-center gap-2">
                        <div className="h-5 w-5 rounded-md bg-primary/10 flex items-center justify-center">
                            <span className="text-xs font-bold text-primary">AI</span>
                        </div>
                        <CardTitle className="text-lg font-medium">AI Responder Configuration</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Toggles */}
                    <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                            <Checkbox id="enable-ai" defaultChecked />
                            <Label htmlFor="enable-ai" className="font-medium">Enable AI Auto Responder</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="auto-send" />
                            <Label htmlFor="auto-send" className="text-muted-foreground font-normal">Automatically send responses (without manual review)</Label>
                        </div>
                    </div>

                    {/* Response Strategy */}
                    <div className="space-y-3">
                        <Label>Response Strategy</Label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div
                                className={`cursor-pointer rounded-lg border p-4 text-center transition-all hover:bg-accent ${strategy === 'aggressive' ? 'border-primary bg-primary/5 ring-1 ring-primary' : ''}`}
                                onClick={() => setStrategy('aggressive')}
                            >
                                <div className="font-semibold text-primary">Aggressive</div>
                                <div className="text-xs text-muted-foreground mt-1">Quick, proactive responses with strong calls-to-action</div>
                            </div>
                            <div
                                className={`cursor-pointer rounded-lg border p-4 text-center transition-all hover:bg-accent ${strategy === 'moderate' ? 'border-primary bg-primary/5 ring-1 ring-primary' : ''}`}
                                onClick={() => setStrategy('moderate')}
                            >
                                <div className="font-semibold text-primary">Moderate</div>
                                <div className="text-xs text-muted-foreground mt-1">Balanced approach with thoughtful responses and natural progression</div>
                            </div>
                            <div
                                className={`cursor-pointer rounded-lg border p-4 text-center transition-all hover:bg-accent ${strategy === 'conservative' ? 'border-primary bg-primary/5 ring-1 ring-primary' : ''}`}
                                onClick={() => setStrategy('conservative')}
                            >
                                <div className="font-semibold text-primary">Conservative</div>
                                <div className="text-xs text-muted-foreground mt-1">Cautious, formal responses that wait for clear signals</div>
                            </div>
                        </div>
                    </div>

                    {/* Delay */}
                    <div className="space-y-3">
                        <Label>Response Delay (minutes)</Label>
                        <Input
                            value={delay}
                            onChange={(e) => setDelay(e.target.value)}
                            type="number"
                        />
                        <p className="text-[10px] text-muted-foreground">Wait this many minutes before sending auto-responses (0 = immediate, max 72 hours = 4320 minutes)</p>
                    </div>

                    {/* Prompt */}
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <Label>Response Generation Prompt</Label>
                            <Button variant="ghost" className="h-auto p-0 text-xs text-blue-600 hover:text-blue-700">Reset to Default</Button>
                        </div>
                        <textarea
                            className="flex min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                        />
                        <p className="text-[10px] text-muted-foreground">
                            Use variables like <span className="text-blue-500">{`{{lead_name}}`}</span>, <span className="text-blue-500">{`{{company_name}}`}</span>, <span className="text-blue-500">{`{{conversation_history}}`}</span>, <span className="text-blue-500">{`{{client_message}}`}</span>
                        </p>
                    </div>

                    {/* Info Box */}
                    <div className="rounded-md bg-blue-50 dark:bg-blue-900/10 p-4 border border-blue-100 dark:border-blue-900/20">
                        <div className="flex items-start gap-3">
                            <Info className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                            <div className="space-y-1">
                                <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-300">How it works:</h4>
                                <ul className="text-xs text-blue-800 dark:text-blue-400 list-disc pl-4 space-y-0.5">
                                    <li>When a client responds to your outreach, the AI will analyze the conversation</li>
                                    <li>It will generate a contextual response based on your prompt and strategy</li>
                                    <li>Responses will be generated and saved for your review before sending</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <Button className="bg-[#0f172a] hover:bg-[#1e293b]">
                            <Save className="h-4 w-4 mr-2" />
                            Save Configuration
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Calendly Schedule */}
            <Card className="shadow-sm">
                <CardHeader className="flex flex-row items-center gap-2 pb-2">
                    <CalendarIcon className="h-5 w-5 text-muted-foreground" />
                    <CardTitle className="text-lg font-medium">Calendly Schedule</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="mb-4">
                        <div className="text-sm font-semibold">Viewing: 11828-outsource/30min</div>
                        <a href="#" className="text-xs text-blue-500 hover:underline">Open in Calendly ↗</a>
                    </div>

                    {/* Visual Mock of Calendly */}
                    <div className="border rounded-lg overflow-hidden bg-background">
                        <div className="grid grid-cols-1 md:grid-cols-3 min-h-[500px]">
                            {/* Left Panel */}
                            <div className="p-6 border-b md:border-b-0 md:border-r flex flex-col items-center md:items-start text-center md:text-left">
                                <div className="h-16 w-16 bg-blue-900 rounded-full mb-4 flex items-center justify-center text-white text-xl font-bold">L</div>
                                <div className="text-muted-foreground text-sm font-medium mb-1">Lincoln Waste Solutions</div>
                                <h3 className="text-2xl font-bold mb-4">30 Minute Meeting</h3>
                                <div className="flex items-center text-muted-foreground text-sm gap-2">
                                    <Clock className="h-4 w-4" />
                                    30 min
                                </div>
                                <div className="mt-auto pt-8">
                                    <a href="#" className="text-xs text-blue-500">Cookie settings</a>
                                </div>
                            </div>

                            {/* Calendar Selection */}
                            <div className="col-span-2 p-6">
                                <h3 className="text-lg font-bold mb-6">Select a Date & Time</h3>
                                <div className="flex flex-col items-center">
                                    <div className="w-full max-w-md">
                                        <div className="flex items-center justify-between mb-4">
                                            <Button variant="ghost" size="sm">◀</Button>
                                            <span className="font-medium">December 2025</span>
                                            <Button variant="ghost" size="sm">▶</Button>
                                        </div>
                                        {/* Simple Calendar Grid Mock */}
                                        <div className="grid grid-cols-7 gap-2 text-center text-sm mb-2">
                                            <div className="text-xs text-muted-foreground font-medium uppercase">Sun</div>
                                            <div className="text-xs text-muted-foreground font-medium uppercase">Mon</div>
                                            <div className="text-xs text-muted-foreground font-medium uppercase">Tue</div>
                                            <div className="text-xs text-muted-foreground font-medium uppercase">Wed</div>
                                            <div className="text-xs text-muted-foreground font-medium uppercase">Thu</div>
                                            <div className="text-xs text-muted-foreground font-medium uppercase">Fri</div>
                                            <div className="text-xs text-muted-foreground font-medium uppercase">Sat</div>
                                        </div>
                                        <div className="grid grid-cols-7 gap-2 text-center text-sm">
                                            {/* Days (Mock) */}
                                            {/* Week 1 */}
                                            <div className="py-2 text-muted-foreground/30">30</div>
                                            <div className="py-2">1</div>
                                            <div className="py-2">2</div>
                                            <div className="py-2">3</div>
                                            <div className="py-2">4</div>
                                            <div className="py-2">5</div>
                                            <div className="py-2">6</div>

                                            {/* Week 2 */}
                                            <div className="py-2">7</div>
                                            <div className="py-2">8</div>
                                            <div className="py-2">9</div>
                                            <div className="py-2">10</div>
                                            <div className="py-2">11</div>
                                            <div className="py-2">12</div>
                                            <div className="py-2">13</div>

                                            {/* Week 3 */}
                                            <div className="py-2">14</div>
                                            <div className="py-2">15</div>
                                            <div className="py-2">16</div>
                                            <div className="py-2">17</div>
                                            <div className="py-2">18</div>
                                            <div className="py-2">19</div>
                                            <div className="py-2">20</div>

                                            {/* Week 4 */}
                                            <div className="py-2">21</div>
                                            <div className="py-2">22</div>
                                            <div className="py-2">23</div>
                                            <div className="py-2">24</div>
                                            <div className="py-2">25</div>
                                            <div className="py-2">26</div>
                                            <div className="py-2">27</div>

                                            {/* Week 5 */}
                                            <div className="py-2">28</div>
                                            <div className="py-2">29</div>
                                            <div className="py-2 font-bold text-primary bg-blue-100 rounded-full w-8 h-8 flex items-center justify-center mx-auto">30</div>
                                            <div className="py-2">31</div>
                                            <div className="py-2 text-muted-foreground/30">1</div>
                                            <div className="py-2 text-muted-foreground/30">2</div>
                                            <div className="py-2 text-muted-foreground/30">3</div>
                                        </div>
                                    </div>

                                    <div className="mt-8 text-xs text-muted-foreground">
                                        Time zone: <strong>Pakistan, Maldives Time (10:54pm)</strong>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
