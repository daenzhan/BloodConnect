"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, MapPin, XCircle, Plus, CheckCircle, AlertCircle } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { Sidebar } from "../components/sidebar"

interface Appointment {
    appointmentId: number;
    appointmentDate: string;
    status: string;
    bloodCenter: {
        name: string;
        address: string;
        city: string;
    };
}

export default function AppointmentsPage() {
    const [appointments, setAppointments] = useState<Appointment[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const router = useRouter()
    const searchParams = useSearchParams()
    const userId = searchParams.get('userId') || searchParams.get('id')

    useEffect(() => {
        if (userId) {
            fetchAppointments(userId)
            localStorage.setItem('userId', userId)
        } else {
            const storedId = localStorage.getItem('userId')
            if (storedId) {
                fetchAppointments(storedId)
            } else {
                setIsLoading(false)
            }
        }
    }, [userId])

    const fetchAppointments = async (id: string) => {
        try {
            const response = await fetch(`http://localhost:8080/appointments/donor/${id}`)
            const data = await response.json()
            console.log("Fetched appointments:", data)
            setAppointments(Array.isArray(data) ? data : [])
        } catch (error) {
            console.error("Error fetching appointments:", error)
            setAppointments([])
        } finally {
            setIsLoading(false)
        }
    }

    const cancelAppointment = async (appointmentId: number) => {
        if (!confirm("Are you sure you want to cancel this appointment?")) return

        try {
            const response = await fetch(`http://localhost:8080/appointments/${appointmentId}/cancel`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                }
            })

            if (response.ok) {
                alert("Appointment cancelled successfully!")
                const currentId = userId || localStorage.getItem('userId') || ''
                fetchAppointments(currentId)
            } else {
                const error = await response.text()
                console.error("Cancel error:", error)
                alert(`Failed to cancel appointment: ${response.status}`)
            }
        } catch (error) {
            console.error("Error cancelling appointment:", error)
            alert("Network error. Please try again.")
        }
    }

    const getStatusBadge = (status: string) => {
        switch(status?.toUpperCase()) {
            case 'SCHEDULED':
                return {
                    text: 'Scheduled',
                    className: 'bg-chart-4/10 text-chart-4 border border-chart-4/20',
                    icon: <Calendar className="w-3 h-3 mr-1" />
                }
            case 'COMPLETED':
                return {
                    text: 'Completed',
                    className: 'bg-chart-2/10 text-chart-2 border border-chart-2/20',
                    icon: <CheckCircle className="w-3 h-3 mr-1" />
                }
            case 'CANCELLED':
                return {
                    text: 'Cancelled',
                    className: 'bg-destructive/10 text-destructive border border-destructive/20',
                    icon: <XCircle className="w-3 h-3 mr-1" />
                }
            case 'PENDING':
                return {
                    text: 'Pending',
                    className: 'bg-primary/10 text-primary border border-primary/20',
                    icon: <AlertCircle className="w-3 h-3 mr-1" />
                }
            default:
                return {
                    text: status || 'Unknown',
                    className: 'bg-muted text-muted-foreground border border-border',
                    icon: <AlertCircle className="w-3 h-3 mr-1" />
                }
        }
    }

    const getStatusColor = (status: string) => {
        switch(status?.toUpperCase()) {
            case 'SCHEDULED': return 'text-chart-4'
            case 'COMPLETED': return 'text-chart-2'
            case 'CANCELLED': return 'text-destructive'
            case 'PENDING': return 'text-primary'
            default: return 'text-muted-foreground'
        }
    }

    // Сортируем записи: сначала все кроме CANCELLED, потом CANCELLED внизу
    const sortedAppointments = [...appointments].sort((a, b) => {
        if (a.status === 'CANCELLED' && b.status !== 'CANCELLED') return 1
        if (a.status !== 'CANCELLED' && b.status === 'CANCELLED') return -1
        return 0
    })

    const renderAppointmentCard = (apt: Appointment) => {
        const statusBadge = getStatusBadge(apt.status)
        const statusColor = getStatusColor(apt.status)
        const isCancelled = apt.status === 'CANCELLED'
        const isCompleted = apt.status === 'COMPLETED'
        const isScheduled = apt.status === 'SCHEDULED'

        return (
            <Card key={apt.appointmentId} className={`p-6 hover:shadow-md transition-all ${isCancelled ? 'bg-muted/40 opacity-75' : ''} ${isCompleted ? 'bg-chart-2/5' : ''}`}>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex-1">
                        <div className="mb-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center w-fit ${statusBadge.className}`}>
                                {statusBadge.icon}
                                {statusBadge.text}
                            </span>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-foreground">
                                <Calendar className={`w-4 h-4 ${statusColor}`} />
                                <span className={isCancelled ? 'text-muted-foreground' : 'font-medium'}>
                                    {new Date(apt.appointmentDate).toLocaleDateString('en-US', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </span>
                            </div>

                            <div className="flex items-center gap-2 text-foreground">
                                <Clock className={`w-4 h-4 ${statusColor}`} />
                                <span className={isCancelled ? 'text-muted-foreground' : ''}>
                                    {new Date(apt.appointmentDate).toLocaleTimeString('en-US', {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </span>
                            </div>

                            <div className="flex items-center gap-2 text-foreground">
                                <MapPin className={`w-4 h-4 ${statusColor}`} />
                                <span className={isCancelled ? 'text-muted-foreground' : ''}>
                                    {apt.bloodCenter?.name || 'Blood Center'}
                                </span>
                            </div>

                            {apt.bloodCenter?.address && (
                                <div className="flex items-center gap-2 text-muted-foreground pl-6">
                                    <span className="text-sm">{apt.bloodCenter.address}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {isScheduled && (
                        <Button
                            variant="outline"
                            className="border-destructive text-destructive hover:bg-destructive/10 hover:border-destructive"
                            onClick={() => cancelAppointment(apt.appointmentId)}
                        >
                            <XCircle className="w-4 h-4 mr-2" />
                            Cancel
                        </Button>
                    )}

                    {isCompleted && (
                        <div className="px-3 py-1 rounded-full bg-chart-2/10 text-chart-2 text-sm font-medium flex items-center">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Completed
                        </div>
                    )}

                    {isCancelled && (
                        <div className="px-3 py-1 rounded-full bg-destructive/10 text-destructive text-sm font-medium flex items-center">
                            <XCircle className="w-4 h-4 mr-1" />
                            Cancelled
                        </div>
                    )}
                </div>
            </Card>
        )
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
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">My Appointments</h1>
                        <p className="text-muted-foreground mt-1">View and manage your donation appointments</p>
                    </div>
                    <Button
                        onClick={() => router.push(`/dashboard/for-donor/book-donation?userId=${userId || localStorage.getItem('userId')}`)}
                        className="bg-primary hover:bg-primary/90"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Book New Appointment
                    </Button>
                </div>

                {appointments.length === 0 ? (
                    <Card className="p-12 text-center">
                        <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-xl font-semibold mb-2">No Appointments Yet</h3>
                        <p className="text-muted-foreground mb-4">You haven't scheduled any donation appointments</p>
                        <Button
                            onClick={() => router.push(`/dashboard/for-donor/book-donation?userId=${userId || localStorage.getItem('userId')}`)}
                            className="bg-primary hover:bg-primary/90"
                        >
                            Book Your First Appointment
                        </Button>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {sortedAppointments.map(apt => renderAppointmentCard(apt))}
                    </div>
                )}
            </main>
        </div>
    )
}