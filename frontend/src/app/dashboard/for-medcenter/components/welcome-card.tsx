import { Card } from "@/components/ui/card"
import { Building2, Heart } from "lucide-react"

interface WelcomeCardProps {
    centerName: string
}

export function WelcomeCard({ centerName }: WelcomeCardProps) {
    return (
        <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground p-6 rounded-2xl relative overflow-hidden">
            <div className="relative z-10">
                <h2 className="text-2xl font-bold mb-2">
                    Welcome back, {centerName}!
                </h2>

                <p className="text-primary-foreground/80 text-lg italic mb-4">
                    "Ready to save more lives today?"
                </p>


                <div className="text-xs opacity-60 mt-2">
                    @ BloodConnect
                </div>
            </div>

            <div className="absolute right-4 bottom-4 opacity-20">
                <Building2 className="w-24 h-24" />
            </div>
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-primary-foreground/10 rounded-full" />
            <div className="absolute right-16 top-12 w-16 h-16 bg-primary-foreground/10 rounded-full" />
        </Card>
    )
}