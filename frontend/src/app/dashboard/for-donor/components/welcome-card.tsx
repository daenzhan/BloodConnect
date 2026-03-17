import { Card } from "@/components/ui/card"
import { Droplet } from "lucide-react"

export function WelcomeCard() {
    return (
        <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground p-6 rounded-2xl relative overflow-hidden">
            <div className="relative z-10">
                <h2 className="text-2xl font-bold mb-2">Welcome back...</h2>
                <p className="text-primary-foreground/80 mb-4">
                    Thank you for being a hero!<br />
                    Your donations save lives.
                </p>
                <div className="flex items-center gap-2 text-sm">
                    <Droplet className="w-4 h-4" fill="currentColor" />
                    <span>Every drop counts</span>
                </div>
            </div>

            {/* Decorative elements */}
            <div className="absolute right-4 bottom-4 opacity-20">
                <Droplet className="w-24 h-24" fill="currentColor" />
            </div>
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full" />
            <div className="absolute right-16 top-12 w-16 h-16 bg-white/10 rounded-full" />
        </Card>
    )
}
