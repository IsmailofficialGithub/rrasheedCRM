import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ModeToggle } from '@/components/mode-toggle'

export default function Home() {
  redirect('/login')
  return (
    <div className="flex flex-col min-h-screen font-sans">
      <header className="px-4 lg:px-6 h-16 flex items-center border-b sticky top-0 bg-background/80 backdrop-blur-md z-50 transition-all">
        <Link className="flex items-center justify-center gap-2" href="#">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">24</div>
          <span className="font-bold text-xl tracking-tight">24hourplacements</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6 items-center">
          <Link className="text-sm font-medium hover:text-primary transition-colors" href="#features">
            Features
          </Link>
          <Link className="text-sm font-medium hover:text-primary transition-colors" href="#pricing">
            Pricing
          </Link>
          <ModeToggle />
          <Link href="/login">
            <Button variant="ghost" className="font-medium">Sign In</Button>
          </Link>
          <Link href="/login">
            <Button className="hidden sm:inline-flex rounded-full px-6">Get Started</Button>
          </Link>
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-background">
          {/* Background decoration */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-primary/10 rounded-full blur-3xl -z-10" />

          <div className="container px-4 md:px-6 relative z-10 mx-auto">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2 animate-in slide-in-from-bottom-5 fade-in duration-700">
                <div className="inline-block rounded-full bg-primary/10 px-3 py-1 text-sm text-primary mb-4 font-medium border border-primary/20">
                  New v2.0 Release
                </div>
                <h1 className="text-4xl font-extrabold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl/none bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/70">
                  Customer Relationships, <br className="hidden md:inline" />
                  <span className="text-primary block md:inline mt-2 md:mt-0">Perfected.</span>
                </h1>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl pt-4">
                  Experience the next generation of CRM. Intelligent, lightning fast, and beautifully designed to help you close more deals.
                </p>
              </div>
              <div className="space-x-4 pt-8 animate-in slide-in-from-bottom-5 fade-in duration-1000 delay-200">
                <Link href="/login">
                  <Button size="lg" className="h-12 px-8 rounded-full shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 text-lg">
                    Start Free Trial
                  </Button>
                </Link>
                <Link href="#demo">
                  <Button variant="outline" size="lg" className="h-12 px-8 rounded-full border-primary/20 hover:bg-primary/5 backdrop-blur-sm text-lg">
                    View Demo
                  </Button>
                </Link>
              </div>
            </div>
            {/* Dashboard Preview Mockup */}
            <div className="mt-16 mx-auto max-w-5xl rounded-xl border bg-card/50 shadow-2xl overflow-hidden backdrop-blur-sm p-2 animate-in fade-in zoom-in duration-1000 delay-500 hidden md:block">
              <div className="rounded-lg bg-background border aspect-video flex items-center justify-center text-muted-foreground bg-gradient-to-br from-background to-muted">
                App Dashboard Preview (Generated Image Placeholder)
              </div>
            </div>
          </div>
        </section>

        <section className="w-full py-20 bg-muted/30" id="features">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tight mb-4">Everything you need</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">From contact management to detailed analytics, we have got you covered.</p>
            </div>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { title: "Smart Analytics", desc: "Visualize your sales pipeline with advanced charting." },
                { title: "Team Collaboration", desc: "Work together seamlessly with real-time updates." },
                { title: "Automated Workflows", desc: "Trigger actions based on customer behavior." },
                { title: "Mobile Ready", desc: "Access your data from anywhere, on any device." },
                { title: "Secure & Reliable", desc: "Enterprise-grade encryption and daily backups." },
                { title: "24/7 Support", desc: "Our team is here to help you succeed." }
              ].map((feature, i) => (
                <div key={i} className="flex flex-col p-6 space-y-2 border rounded-2xl bg-background shadow-sm hover:shadow-md hover:border-primary/40 transition-all duration-300">
                  <div className="h-10 w-10 text-primary mb-2 bg-primary/10 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-8 w-full shrink-0 items-center px-4 md:px-6 border-t bg-background">
        <p className="text-xs text-muted-foreground">© 2024 CRM Pro. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link className="text-xs hover:underline underline-offset-4 text-muted-foreground hover:text-foreground" href="#">
            Terms of Service
          </Link>
          <Link className="text-xs hover:underline underline-offset-4 text-muted-foreground hover:text-foreground" href="#">
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  )
}
