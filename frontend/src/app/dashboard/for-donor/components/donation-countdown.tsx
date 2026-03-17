"use client"

import { Card } from "@/components/ui/card"
import { Clock, CheckCircle2 } from "lucide-react"
import { useEffect, useState } from "react"

interface DonationCountdownProps {
    lastDonationDate: Date | null  // Изменено: может быть null
    daysUntilNext?: number          // Добавлено опционально
    nextEligibleDate?: Date         // Добавлено опционально
}

export function DonationCountdown({
                                      lastDonationDate,
                                      daysUntilNext = 0,
                                      nextEligibleDate
                                  }: DonationCountdownProps) {
    const [daysRemaining, setDaysRemaining] = useState(daysUntilNext)
    const [canDonate, setCanDonate] = useState(daysUntilNext <= 0)

    useEffect(() => {
        // Если передан daysUntilNext из пропсов, используем его
        if (daysUntilNext !== undefined) {
            setDaysRemaining(daysUntilNext)
            setCanDonate(daysUntilNext <= 0)
            return
        }

        // Иначе вычисляем самостоятельно (если есть lastDonationDate)
        if (lastDonationDate) {
            const calculateDays = () => {
                const now = new Date()
                const nextEligible = nextEligibleDate || new Date(lastDonationDate)
                if (!nextEligibleDate) {
                    nextEligible.setDate(nextEligible.getDate() + 90)
                }

                const diffTime = nextEligible.getTime() - now.getTime()
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

                if (diffDays <= 0) {
                    setCanDonate(true)
                    setDaysRemaining(0)
                } else {
                    setCanDonate(false)
                    setDaysRemaining(diffDays)
                }
            }

            calculateDays()
            const interval = setInterval(calculateDays, 1000 * 60 * 60) // Update hourly
            return () => clearInterval(interval)
        }
    }, [lastDonationDate, daysUntilNext, nextEligibleDate])

    const progress = Math.min(((90 - daysRemaining) / 90) * 100, 100)

    // Если нет информации о последней донации
    if (!lastDonationDate) {
        return (
            <Card className="bg-card p-6 rounded-2xl border border-border">
                <div className="flex items-center gap-3 mb-4">
                    <CheckCircle2 className="w-6 h-6 text-chart-2" />
                    <h3 className="text-lg font-semibold text-foreground">Next Donation</h3>
                </div>

                <div className="text-center py-4">
                    <p className="text-2xl font-bold text-chart-2 mb-2">Ready to donate!</p>
                    <p className="text-muted-foreground">You haven't donated before. Book your first donation!</p>
                </div>
            </Card>
        )
    }

    return (
        <Card className="bg-card p-6 rounded-2xl border border-border">
            <div className="flex items-center gap-3 mb-4">
                {canDonate ? (
                    <CheckCircle2 className="w-6 h-6 text-chart-2" />
                ) : (
                    <Clock className="w-6 h-6 text-primary" />
                )}
                <h3 className="text-lg font-semibold text-foreground">Next Donation</h3>
            </div>

            {canDonate ? (
                <div className="text-center py-4">
                    <p className="text-2xl font-bold text-chart-2 mb-2">You can donate!</p>
                    <p className="text-muted-foreground">You are eligible for blood donation</p>
                </div>
            ) : (
                <>
                    <div className="flex items-baseline gap-2 mb-4">
                        <span className="text-4xl font-bold text-primary">{daysRemaining}</span>
                        <span className="text-muted-foreground">days remaining</span>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Progress to eligibility</span>
                            <span className="text-foreground font-medium">{Math.round(progress)}%</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                                className="h-full bg-primary rounded-full transition-all duration-500"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>

                    <p className="text-sm text-muted-foreground mt-4">
                        Last donation: {lastDonationDate ?
                        lastDonationDate.toLocaleDateString("en-US", {
                            month: "long",
                            day: "numeric",
                            year: "numeric"
                        }) : "No donations yet"
                    }
                    </p>
                </>
            )}
        </Card>
    )
}