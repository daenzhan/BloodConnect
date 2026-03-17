"use client"

import { Card } from "@/components/ui/card"
import { ChevronDown, Settings, Building2 } from "lucide-react"
import { useState } from "react"

interface CenterProfileProps {
    name: string
    city: string
}

export function CenterProfileCard({ name, city }: CenterProfileProps) {
    const [isOpen, setIsOpen] = useState(false)

    const initials = name
        ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
        : "BC"

    return (
        <div className="flex items-center gap-4">
            <div className="relative">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted transition-colors"
                >
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-primary" />
                    </div>

                    <div className="hidden sm:block text-left">
                        <p className="text-sm font-medium text-foreground">{name}</p>
                        <p className="text-xs text-muted-foreground">{city}</p>
                    </div>

                    <ChevronDown className={`w-4 h-4 text-muted-foreground hidden sm:block transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {isOpen && (
                    <Card className="absolute right-0 top-full mt-2 w-48 p-2 rounded-xl shadow-lg border border-border z-50 animate-in fade-in zoom-in duration-200">
                        <div className="space-y-1">
                            <button className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors flex items-center gap-2">
                                <Settings className="w-4 h-4" />
                                Settings
                            </button>
                            <hr className="my-1 border-border" />
                            <button className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors text-destructive">
                                Logout
                            </button>
                        </div>
                    </Card>
                )}
            </div>
        </div>
    )
}
