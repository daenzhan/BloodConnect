import { Card } from "@/components/ui/card"
import { Clock, MapPin, Phone, Building2 } from "lucide-react"

interface CenterInfoProps {
    name: string
    location: string
    phone: string
    specialization?: string
}

export function CenterInfoCard({ name, location, phone, specialization }: CenterInfoProps) {
    return (
        <Card className="p-4 rounded-2xl border border-border">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                    <h3 className="font-semibold text-foreground">Center information</h3>
                </div>
            </div>

            <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/50">
                    <Building2 className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <div>
                        <p className="text-xs text-muted-foreground">Name</p>
                        <p className="text-sm font-medium text-foreground">{name}</p>
                    </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/50">
                    <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <div>
                        <p className="text-xs text-muted-foreground">Location</p>
                        <p className="text-sm font-medium text-foreground">{location}</p>
                    </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/50">
                    <Phone className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <div>
                        <p className="text-xs text-muted-foreground">Phone</p>
                        <p className="text-sm font-medium text-foreground">{phone}</p>
                    </div>
                </div>

                {specialization && (
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/50">
                        <Clock className="w-4 h-4 text-muted-foreground mt-0.5" />
                        <div>
                            <p className="text-xs text-muted-foreground">Specialization</p>
                            <p className="text-sm font-medium text-foreground">{specialization}</p>
                        </div>
                    </div>
                )}
            </div>
        </Card>
    )
}
