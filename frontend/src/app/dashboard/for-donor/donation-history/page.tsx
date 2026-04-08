"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Droplet, Calendar, MapPin, FileText, Clock, XCircle, CheckCircle } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { Sidebar } from "../components/sidebar"  // Импортируем Sidebar

interface Donation {
    donationId: number;
    donationDate: string;
    status: string;
    bloodCenter: {
        name: string;
        address: string;
    };
    hasAnalysis: boolean;
}

export default function DonationHistoryPage() {
    const [donations, setDonations] = useState<Donation[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const searchParams = useSearchParams()
    const userId = searchParams.get('userId') || searchParams.get('id')

    useEffect(() => {
        if (userId) {
            fetchDonations(userId)
            localStorage.setItem('userId', userId)
        } else {
            const storedId = localStorage.getItem('userId')
            if (storedId) {
                fetchDonations(storedId)
            } else {
                setIsLoading(false)
            }
        }
    }, [userId])

    const fetchDonations = async (id: string) => {
        try {
            const response = await fetch(`http://localhost:8080/api/donations/donor/${id}`)
            const data = await response.json()
            setDonations(Array.isArray(data) ? data : [])
        } catch (error) {
            console.error("Error fetching donations:", error)
            setDonations([])
        } finally {
            setIsLoading(false)
        }
    }

    const getStatusBadge = (status: string) => {
        switch(status?.toUpperCase()) {
            case 'COMPLETED':
                return {
                    text: 'Completed',
                    className: 'bg-chart-2/10 text-chart-2',
                    icon: <CheckCircle className="w-3 h-3 mr-1" />
                }
            case 'SCHEDULED':
                return {
                    text: 'Scheduled',
                    className: 'bg-chart-4/10 text-chart-4',
                    icon: <Calendar className="w-3 h-3 mr-1" />
                }
            case 'PENDING':
                return {
                    text: 'Pending',
                    className: 'bg-primary/10 text-primary',
                    icon: <Clock className="w-3 h-3 mr-1" />
                }
            case 'CANCELLED':
                return {
                    text: 'Cancelled',
                    className: 'bg-destructive/10 text-destructive',
                    icon: <XCircle className="w-3 h-3 mr-1" />
                }
            default:
                return {
                    text: status || 'Unknown',
                    className: 'bg-muted text-muted-foreground',
                    icon: null
                }
        }
    }

    if (isLoading) {
        return (
            <div className="flex min-h-screen bg-background">
                <Sidebar />
                <div className="flex-1 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen bg-background">
            <Sidebar />
            <main className="flex-1 p-6 lg:p-8 overflow-auto">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-foreground">Donation History</h1>
                    <p className="text-muted-foreground mt-1">Track all your past and upcoming blood donations</p>
                </div>

                {donations.length === 0 ? (
                    <Card className="p-12 text-center">
                        <Droplet className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-xl font-semibold mb-2">No Donations Yet</h3>
                        <p className="text-muted-foreground">Your donation history will appear here</p>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {donations.map((donation) => {
                            const statusBadge = getStatusBadge(donation.status)
                            return (
                                <Card key={donation.donationId} className="p-6 hover:shadow-md transition-shadow">
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                        <div className="flex items-start gap-4">
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                                                donation.status === 'COMPLETED' ? 'bg-chart-2/10' :
                                                    donation.status === 'SCHEDULED' ? 'bg-chart-4/10' :
                                                        donation.status === 'CANCELLED' ? 'bg-destructive/10' :
                                                            'bg-primary/10'
                                            }`}>
                                                <Droplet className={`w-6 h-6 ${
                                                    donation.status === 'COMPLETED' ? 'text-chart-2' :
                                                        donation.status === 'SCHEDULED' ? 'text-chart-4' :
                                                            donation.status === 'CANCELLED' ? 'text-destructive' :
                                                                'text-primary'
                                                }`} />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-foreground">
                                                    {new Date(donation.donationDate).toLocaleDateString('en-US', {
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric'
                                                    })}
                                                </p>
                                                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                                    <span className="flex items-center gap-1">
                                                        <MapPin className="w-3 h-3" />
                                                        {donation.bloodCenter?.name || 'Blood Center'}
                                                    </span>
                                                    {donation.hasAnalysis && (
                                                        <span className="flex items-center gap-1 text-chart-2">
                                                            <FileText className="w-3 h-3" />
                                                            Analysis Available
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center ${statusBadge.className}`}>
                                            {statusBadge.icon}
                                            {statusBadge.text}
                                        </div>
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