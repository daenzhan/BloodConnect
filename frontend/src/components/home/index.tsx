"use client"

import { useState } from "react"
import { Button } from "@/components/home/ui/button"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/home/ui/accordion"
import {
    Heart,
    ArrowDown,
    ClipboardCheck,
    Stethoscope,
    Droplets,
    Coffee,
    Check,
    X,
    Menu,
} from "lucide-react"

/* ─────────────────────── DATA ─────────────────────── */

const steps = [
    {
        icon: ClipboardCheck,
        step: "01",
        title: "Registration",
        description:
            "Sign up online or walk into your nearest donation center. You will fill out a brief health history questionnaire to determine your eligibility.",
    },
    {
        icon: Stethoscope,
        step: "02",
        title: "Health Screening",
        description:
            "A medical professional will check your temperature, pulse, blood pressure, and hemoglobin level. This quick screening takes about 10 minutes.",
    },
    {
        icon: Droplets,
        step: "03",
        title: "The Donation",
        description:
            "The actual blood draw takes only 8-10 minutes. A sterile, single-use needle is used to collect about one pint of blood. The process is safe and hygienic.",
    },
    {
        icon: Coffee,
        step: "04",
        title: "Rest & Refresh",
        description:
            "After donating, relax in the refreshment area for 10-15 minutes. Enjoy snacks and beverages while your body begins to replenish the donated blood.",
    },
]

const eligible = [
    "You are in good general health",
    "You weigh at least 110 lbs (50 kg)",
    "You are 17 years or older (16 with parental consent in some areas)",
    "You have not donated blood in the last 56 days",
    "You have a hemoglobin level of at least 12.5 g/dL",
]

const notEligible = [
    "You have a cold, flu, or other active infection",
    "You have had a tattoo or piercing in the last 3 months",
    "You are currently taking antibiotics",
    "You have recently traveled to a malaria-risk area",
    "You are pregnant or have recently given birth",
]

const faqs = [
    {
        question: "Does donating blood hurt?",
        answer:
            "You may feel a brief pinch when the needle is inserted, but most donors describe the process as relatively painless. The discomfort is minimal and lasts only a few seconds. Our trained staff works to make the experience as comfortable as possible.",
    },
    {
        question: "How long does the entire process take?",
        answer:
            "The whole process typically takes about 45 minutes to 1 hour. This includes registration, the health screening, the actual donation (8-10 minutes), and a short rest period afterwards where you can enjoy refreshments.",
    },
    {
        question: "How often can I donate blood?",
        answer:
            "You can donate whole blood every 56 days (about 8 weeks). Platelet donors can give more frequently, up to every 7 days, with a maximum of 24 times per year. Plasma can be donated every 28 days.",
    },
    {
        question: "What should I do before donating?",
        answer:
            "Get a good night's sleep, eat a healthy meal, and drink plenty of water before your appointment. Avoid fatty foods and alcohol. Wear comfortable clothing with sleeves that can be easily rolled up above the elbow.",
    },
    {
        question: "Are there any side effects after donating?",
        answer:
            "Most donors feel fine after donating. Some may experience mild lightheadedness or bruising at the needle site. These effects are temporary. We recommend drinking extra fluids, avoiding heavy exercise for 24 hours, and eating iron-rich foods.",
    },
    {
        question: "What blood types are most needed?",
        answer:
            "All blood types are needed and valuable. However, Type O negative is considered the universal donor type and is always in high demand for emergencies. Type AB positive plasma is also highly sought after as it can be given to patients of any blood type.",
    },
    {
        question: "Can I donate if I have a chronic condition?",
        answer:
            "Many people with chronic conditions can still donate. Conditions like well-controlled diabetes or high blood pressure may not disqualify you. However, some conditions or medications may affect your eligibility. Consult with the medical staff at the donation center for personalized guidance.",
    },
    {
        question: "What happens to my blood after donation?",
        answer:
            "After collection, your blood is tested for infectious diseases and typed. It is then separated into components (red cells, platelets, plasma) so that a single donation can help multiple patients. The components are stored under appropriate conditions until needed by hospitals.",
    },
]

const stats = [
    { value: "4.5M+", label: "Blood transfusions yearly" },
    { value: "~1 hr", label: "Total donation time" },
    { value: "3 Lives", label: "Saved per donation" },
]

/* ─────────────────────── COMPONENT ─────────────────────── */

export default function HomePage() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    return (
        <div className="min-h-screen">
            {/* ── Header ── */}
            <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
                    <a href="/home" className="flex items-center gap-2">
                        <div className="flex size-9 items-center justify-center rounded-lg bg-primary">
                            <Heart className="size-5 text-primary-foreground" fill="currentColor"/>
                        </div>
                        <span
                            className="text-xl font-bold tracking-tight text-foreground"
                            style={{fontFamily: "var(--font-heading)"}}
                        >
              BloodConnect
            </span>
                    </a>

                    <nav className="hidden items-center gap-8 md:flex">
                        <a href="#how-it-works" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                            How It Works
                        </a>
                        <a href="#faq" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                            FAQ
                        </a>
                    </nav>

                    <div className="hidden items-center gap-3 md:flex">
                        <Button variant="ghost" size="sm" onClick={() => { /* TODO: Login */ }}>
                            Log In
                        </Button>
                        <Button size="sm" onClick={() => { /* TODO: Register */ }}>
                            Register
                        </Button>
                    </div>

                    <button
                        className="flex size-9 items-center justify-center rounded-md text-foreground md:hidden"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                    >
                        {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
                    </button>
                </div>

                {mobileMenuOpen && (
                    <div className="border-t border-border bg-card px-6 py-4 md:hidden">
                        <nav className="flex flex-col gap-3">
                            <a
                                href="#how-it-works"
                                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                How It Works
                            </a>
                            <a
                                href="#faq"
                                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                FAQ
                            </a>
                            <div className="mt-2 flex flex-col gap-2 border-t border-border pt-4">
                                <Button variant="outline" size="sm" className="w-full" onClick={() => { /* TODO: Login */ }}>
                                    Log In
                                </Button>
                                <Button size="sm" className="w-full" onClick={() => { /* TODO: Register */ }}>
                                    Register
                                </Button>
                            </div>
                        </nav>
                    </div>
                )}
            </header>

            <main>
                {/* ── Hero ── */}
                <section className="relative overflow-hidden bg-card">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--color-primary)_0%,_transparent_50%)] opacity-[0.04]" />
                    <div className="mx-auto flex max-w-6xl flex-col items-center px-6 pb-20 pt-24 text-center lg:pb-28 lg:pt-32">
                        <div className="mb-6 flex items-center gap-2 rounded-full border border-border bg-secondary px-4 py-1.5">
                            <Heart className="size-4 text-primary" fill="currentColor" />
                            <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Every Drop Counts
              </span>
                        </div>

                        <h1
                            className="max-w-3xl text-balance text-4xl font-bold leading-tight tracking-tight text-foreground md:text-5xl lg:text-6xl"
                            style={{ fontFamily: "var(--font-heading)" }}
                        >
                            Give Blood.{" "}
                            <span className="text-primary">Save Lives.</span>
                        </h1>

                        <p className="mt-6 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground md:text-lg">
                            Your single donation can save up to three lives. Join thousands of
                            donors who are making a difference every day. The process is safe,
                            simple, and takes less than an hour.
                        </p>

                        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
                            <Button size="lg" className="px-8 text-base" onClick={() => { /* TODO: Register */ }}>
                                Become a Donor
                            </Button>
                            <Button variant="outline" size="lg" className="px-8 text-base" asChild>
                                <a href="#how-it-works">
                                    Learn More
                                    <ArrowDown className="ml-1 size-4" />
                                </a>
                            </Button>
                        </div>

                        <div
                            className="relative mt-16 w-full max-w-4xl overflow-hidden rounded-2xl border border-border shadow-lg">
                            <img
                                src="/images/hero-blood-donation.jpg"
                                alt="Blood donation in progress at a modern medical facility"
                                className="h-auto w-full object-cover"
                            />
                        </div>

                        <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-3">
                            {stats.map((stat) => (
                                <div key={stat.label} className="flex flex-col items-center">
                  <span
                      className="text-3xl font-bold text-foreground"
                      style={{ fontFamily: "var(--font-heading)" }}
                  >
                    {stat.value}
                  </span>
                                    <span className="mt-1 text-sm text-muted-foreground">{stat.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── How It Works ── */}
                <section id="how-it-works" className="bg-background py-20 lg:py-28">
                    <div className="mx-auto max-w-6xl px-6">
                        <div className="mb-16 text-center">
                            <span className="text-xs font-medium tracking-wide text-primary uppercase">Step by Step</span>
                            <h2
                                className="mt-3 text-balance text-3xl font-bold tracking-tight text-foreground md:text-4xl"
                                style={{ fontFamily: "var(--font-heading)" }}
                            >
                                How Blood Donation Works
                            </h2>
                            <p className="mx-auto mt-4 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground">
                                Donating blood is a straightforward and rewarding process. Here is what to expect from start to finish.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                            {steps.map((item) => (
                                <div
                                    key={item.step}
                                    className="group relative rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/30 hover:shadow-md"
                                >
                                    <div className="mb-4 flex items-center justify-between">
                                        <div className="flex size-11 items-center justify-center rounded-lg bg-primary/10">
                                            <item.icon className="size-5 text-primary" />
                                        </div>
                                        <span
                                            className="text-3xl font-bold text-border transition-colors group-hover:text-primary/20"
                                            style={{ fontFamily: "var(--font-heading)" }}
                                        >
                      {item.step}
                    </span>
                                    </div>
                                    <h3 className="mb-2 text-lg font-semibold text-foreground">{item.title}</h3>
                                    <p className="text-sm leading-relaxed text-muted-foreground">{item.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── Eligibility ── */}
                <section className="bg-card py-20 lg:py-28">
                    <div className="mx-auto max-w-6xl px-6">
                        <div className="mb-16 text-center">
                            <span className="text-xs font-medium tracking-wide text-primary uppercase">Requirements</span>
                            <h2
                                className="mt-3 text-balance text-3xl font-bold tracking-tight text-foreground md:text-4xl"
                                style={{ fontFamily: "var(--font-heading)" }}
                            >
                                Am I Eligible to Donate?
                            </h2>
                            <p className="mx-auto mt-4 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground">
                                Most healthy adults can donate blood. Review these general guidelines to see if you qualify.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div className="rounded-xl border border-border bg-background p-8">
                                <div className="mb-6 flex items-center gap-3">
                                    <div className="flex size-9 items-center justify-center rounded-full bg-primary/10">
                                        <Check className="size-4 text-primary" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-foreground">You Can Donate If</h3>
                                </div>
                                <ul className="flex flex-col gap-3">
                                    {eligible.map((item) => (
                                        <li key={item} className="flex items-start gap-3">
                                            <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                                            <span className="text-sm leading-relaxed text-muted-foreground">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="rounded-xl border border-border bg-background p-8">
                                <div className="mb-6 flex items-center gap-3">
                                    <div className="flex size-9 items-center justify-center rounded-full bg-destructive/10">
                                        <X className="size-4 text-destructive" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-foreground">You Should Wait If</h3>
                                </div>
                                <ul className="flex flex-col gap-3">
                                    {notEligible.map((item) => (
                                        <li key={item} className="flex items-start gap-3">
                                            <X className="mt-0.5 size-4 shrink-0 text-destructive" />
                                            <span className="text-sm leading-relaxed text-muted-foreground">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── FAQ ── */}
                <section id="faq" className="bg-background py-20 lg:py-28">
                    <div className="mx-auto max-w-3xl px-6">
                        <div className="mb-16 text-center">
                            <span className="text-xs font-medium tracking-wide text-primary uppercase">Common Questions</span>
                            <h2
                                className="mt-3 text-balance text-3xl font-bold tracking-tight text-foreground md:text-4xl"
                                style={{ fontFamily: "var(--font-heading)" }}
                            >
                                Frequently Asked Questions
                            </h2>
                            <p className="mx-auto mt-4 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground">
                                Find answers to the most common questions about blood donation.
                            </p>
                        </div>

                        <Accordion type="single" collapsible className="w-full">
                            {faqs.map((faq, index) => (
                                <AccordionItem key={index} value={`item-${index}`}>
                                    <AccordionTrigger className="text-left text-base font-medium text-foreground">
                                        {faq.question}
                                    </AccordionTrigger>
                                    <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                                        {faq.answer}
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </div>
                </section>

                {/* ── CTA ── */}
                <section className="bg-card py-20 lg:py-28">
                    <div className="mx-auto max-w-6xl px-6">
                        <div className="relative overflow-hidden rounded-2xl bg-primary px-8 py-16 text-center md:px-16">
                            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(255,255,255,0.1)_0%,_transparent_60%)]" />
                            <div className="relative">
                                <Heart className="mx-auto mb-6 size-10 text-primary-foreground/80" fill="currentColor" />
                                <h2
                                    className="text-balance text-3xl font-bold tracking-tight text-primary-foreground md:text-4xl"
                                    style={{ fontFamily: "var(--font-heading)" }}
                                >
                                    Ready to Make a Difference?
                                </h2>
                                <p className="mx-auto mt-4 max-w-lg text-pretty text-base leading-relaxed text-primary-foreground/80">
                                    Register today and schedule your first donation. It only takes a few minutes to sign up, and your contribution can save lives.
                                </p>
                                <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                                    <Button
                                        size="lg"
                                        variant="secondary"
                                        className="px-8 text-base font-semibold"
                                        onClick={() => { /* TODO: Register */ }}
                                    >
                                        Register Now
                                    </Button>
                                    <Button
                                        size="lg"
                                        variant="ghost"
                                        className="px-8 text-base text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
                                        onClick={() => { /* TODO: Login */ }}
                                    >
                                        Already a Donor? Log In
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            {/* ── Footer ── */}
            <footer className="border-t border-border bg-card">
                <div className="mx-auto max-w-6xl px-6 py-12">
                    <div className="flex flex-col items-center gap-6 md:flex-row md:justify-between">
                        <a href="/home" className="flex items-center gap-2">
                            <div className="flex size-8 items-center justify-center rounded-lg bg-primary">
                                <Heart className="size-4 text-primary-foreground" fill="currentColor"/>
                            </div>
                            <span
                                className="text-lg font-bold tracking-tight text-foreground"
                                style={{fontFamily: "var(--font-heading)"}}
                            >
                BloodConnect
              </span>
                        </a>

                        <nav className="flex flex-wrap items-center justify-center gap-6">
                            <a href="#how-it-works" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                                How It Works
                            </a>
                            <a href="#faq" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                                FAQ
                            </a>
                        </nav>
                    </div>

                    <div className="mt-8 border-t border-border pt-8 text-center">
                       
                    </div>
                </div>
            </footer>
        </div>
    )
}
