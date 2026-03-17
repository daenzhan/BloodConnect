"use client"

import { useState, useEffect } from "react"
import { BloodCenterSidebar } from "../components/sidebar"
import { CenterProfileCard } from "../components/center-profile-card"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Droplet, Edit2, Save, X, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react"

interface BloodReserveItem {
    bloodGroup: string
    rhesusFactor: string
    quantity: number
    lastUpdated?: string
}

const bloodTypes = [
    { group: "A", rh: "+", label: "A+" },
    { group: "A", rh: "-", label: "A-" },
    { group: "B", rh: "+", label: "B+" },
    { group: "B", rh: "-", label: "B-" },
    { group: "AB", rh: "+", label: "AB+" },
    { group: "AB", rh: "-", label: "AB-" },
    { group: "O", rh: "+", label: "O+" },
    { group: "O", rh: "-", label: "O-" },
]

export default function BloodReservePage() {
    const [reserves, setReserves] = useState<BloodReserveItem[]>([])
    const [editingType, setEditingType] = useState<string | null>(null)
    const [editValue, setEditValue] = useState("")
    const [isLoading, setIsLoading] = useState(true)

    const bloodCenterId = 1 // Temporarily hardcoded

    useEffect(() => {
        const fetchReserves = async () => {
            try {
                const response = await fetch(`http://localhost:8080/blood-center/${bloodCenterId}/reserves`)
                if (response.ok) {
                    const data = await response.json()
                    setReserves(data)
                }
            } catch (error) {
                console.error("Error fetching reserves:", error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchReserves()
    }, [bloodCenterId])

    const getQuantityForType = (group: string, rh: string): number => {
        const reserve = reserves.find(
            (r) => r.bloodGroup === group && r.rhesusFactor === rh
        )
        return reserve?.quantity || 0
    }

    const handleEdit = (typeLabel: string, currentQuantity: number) => {
        setEditingType(typeLabel)
        setEditValue(currentQuantity.toString())
    }

    const handleSave = async (group: string, rh: string) => {
        const newQuantity = parseInt(editValue)
        if (isNaN(newQuantity) || newQuantity < 0) {
            setEditingType(null)
            return
        }

        try {
            const response = await fetch(`http://localhost:8080/blood-center/${bloodCenterId}/reserves`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    bloodGroup: group,
                    rhesusFactor: rh,
                    quantity: newQuantity,
                }),
            })

            if (response.ok) {
                setReserves((prev) =>
                    prev.map((r) =>
                        r.bloodGroup === group && r.rhesusFactor === rh
                            ? { ...r, quantity: newQuantity }
                            : r
                    )
                )
            }
        } catch (error) {
            console.error("Error updating reserve:", error)
        }

        // Update locally for demo
        setReserves((prev) => {
            const existing = prev.find((r) => r.bloodGroup === group && r.rhesusFactor === rh)
            if (existing) {
                return prev.map((r) =>
                    r.bloodGroup === group && r.rhesusFactor === rh
                        ? { ...r, quantity: newQuantity }
                        : r
                )
            } else {
                return [...prev, { bloodGroup: group, rhesusFactor: rh, quantity: newQuantity }]
            }
        })
        setEditingType(null)
    }

    const getStatusInfo = (quantity: number) => {
        if (quantity <= 5) {
            return {
                color: "border-destructive bg-destructive/5",
                icon: AlertTriangle,
                iconColor: "text-destructive",
                status: "Critical",
            }
        }
        if (quantity <= 15) {
            return {
                color: "border-chart-4 bg-chart-4/5",
                icon: TrendingDown,
                iconColor: "text-chart-4",
                status: "Low",
            }
        }
        return {
            color: "border-chart-2 bg-chart-2/5",
            icon: TrendingUp,
            iconColor: "text-chart-2",
            status: "Good",
        }
    }

    // Mock data for development
    const mockReserves: BloodReserveItem[] = reserves.length > 0 ? reserves : [
        { bloodGroup: "A", rhesusFactor: "+", quantity: 25 },
        { bloodGroup: "A", rhesusFactor: "-", quantity: 8 },
        { bloodGroup: "B", rhesusFactor: "+", quantity: 18 },
        { bloodGroup: "B", rhesusFactor: "-", quantity: 5 },
        { bloodGroup: "AB", rhesusFactor: "+", quantity: 12 },
        { bloodGroup: "AB", rhesusFactor: "-", quantity: 3 },
        { bloodGroup: "O", rhesusFactor: "+", quantity: 30 },
        { bloodGroup: "O", rhesusFactor: "-", quantity: 10 },
    ]

    const displayReserves = reserves.length > 0 ? reserves : mockReserves

    const totalUnits = displayReserves.reduce((sum, r) => sum + r.quantity, 0)
    const criticalTypes = displayReserves.filter((r) => r.quantity <= 5).length
    const lowTypes = displayReserves.filter((r) => r.quantity > 5 && r.quantity <= 15).length

    return (
        <div className="flex min-h-screen bg-background">
            <BloodCenterSidebar />
            <main className="flex-1 p-6 lg:p-8 overflow-auto">
                <header className="flex items-start justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Blood Reserve</h1>
                        <p className="text-muted-foreground">Manage your blood inventory</p>
                    </div>
                    <CenterProfileCard name="City Blood Center" city="Almaty" />
                </header>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <Card className="p-4 rounded-xl border border-border">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                <Droplet className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-foreground">{totalUnits}</p>
                                <p className="text-sm text-muted-foreground">Total Units</p>
                            </div>
                        </div>
                    </Card>
                    <Card className="p-4 rounded-xl border border-destructive/20 bg-destructive/5">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center">
                                <AlertTriangle className="w-6 h-6 text-destructive" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-destructive">{criticalTypes}</p>
                                <p className="text-sm text-muted-foreground">Critical Types</p>
                            </div>
                        </div>
                    </Card>
                    <Card className="p-4 rounded-xl border border-chart-4/20 bg-chart-4/5">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-chart-4/10 flex items-center justify-center">
                                <TrendingDown className="w-6 h-6 text-chart-4" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-chart-4">{lowTypes}</p>
                                <p className="text-sm text-muted-foreground">Low Stock Types</p>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Blood Type Grid */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <p className="text-muted-foreground">Loading reserves...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {bloodTypes.map((type) => {
                            const quantity = getQuantityForType(type.group, type.rh) ||
                                mockReserves.find(r => r.bloodGroup === type.group && r.rhesusFactor === type.rh)?.quantity || 0
                            const statusInfo = getStatusInfo(quantity)
                            const StatusIcon = statusInfo.icon
                            const isEditing = editingType === type.label

                            return (
                                <Card
                                    key={type.label}
                                    className={`p-6 rounded-xl border-2 ${statusInfo.color} transition-all`}
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <Droplet className="w-6 h-6 text-primary" fill="currentColor" />
                                            <span className="text-2xl font-bold text-foreground">{type.label}</span>
                                        </div>
                                        <StatusIcon className={`w-5 h-5 ${statusInfo.iconColor}`} />
                                    </div>

                                    {isEditing ? (
                                        <div className="flex items-center gap-2">
                                            <Input
                                                type="number"
                                                value={editValue}
                                                onChange={(e) => setEditValue(e.target.value)}
                                                className="w-20 h-8 text-center"
                                                min="0"
                                            />
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => handleSave(type.group, type.rh)}
                                            >
                                                <Save className="w-4 h-4 text-chart-2" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => setEditingType(null)}
                                            >
                                                <X className="w-4 h-4 text-destructive" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-3xl font-bold text-foreground">{quantity}</p>
                                                <p className="text-sm text-muted-foreground">units available</p>
                                            </div>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => handleEdit(type.label, quantity)}
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    )}

                                    <div className="mt-3 pt-3 border-t border-border">
                                        <span className={`text-xs font-medium ${statusInfo.iconColor}`}>
                                            {statusInfo.status}
                                        </span>
                                    </div>
                                </Card>
                            )
                        })}
                    </div>
                )}
            </main>
        </div>
    )
}
