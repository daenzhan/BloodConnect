import { Card } from "@/components/ui/card"
import { Building2, Activity } from "lucide-react"

interface WelcomeCardProps {
    centerName: string
    location: string
    todayDonations: number
    pendingRequests: number
}

export function WelcomeCard({ centerName, location, todayDonations, pendingRequests }: WelcomeCardProps) {
    return (
        <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground p-6 rounded-2xl relative overflow-hidden">
            <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                    <Building2 className="w-5 h-5" />
                    <span className="text-sm opacity-80">{location}</span>
                </div>
                <h2 className="text-2xl font-bold mb-4">{centerName}</h2>

                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/10 rounded-xl p-3">
                        <p className="text-2xl font-bold">{todayDonations}</p>
                        <p className="text-sm opacity-80">Today&apos;s Donations</p>
                    </div>
                    <div className="bg-white/10 rounded-xl p-3">
                        <p className="text-2xl font-bold">{pendingRequests}</p>
                        <p className="text-sm opacity-80">Pending Requests</p>
                    </div>
                </div>
            </div>

            {/* Decorative elements */}
            <div className="absolute right-4 bottom-4 opacity-20">
                <Activity className="w-24 h-24" />
            </div>
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full" />
            <div className="absolute right-16 top-12 w-16 h-16 bg-white/10 rounded-full" />
        </Card>
    )
}
