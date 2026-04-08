"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, MapPin, ArrowLeft, AlertCircle } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { Sidebar } from "../components/sidebar"

interface BloodCenter {
    bloodCenterId: number;
    name: string;
    location: string;
    city: string;
}

interface DonorInfo {
    lastDonationDate: string | null;
    nextEligibleDate: string | null;
    daysUntilNextDonation: number;
}

export default function BookDonationPage() {
    const [selectedDate, setSelectedDate] = useState("")
    const [selectedTime, setSelectedTime] = useState("")
    const [selectedCenter, setSelectedCenter] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [bloodCenters, setBloodCenters] = useState<BloodCenter[]>([])
    const [isLoadingCenters, setIsLoadingCenters] = useState(true)
    const [donorInfo, setDonorInfo] = useState<DonorInfo | null>(null)
    const [isLoadingDonor, setIsLoadingDonor] = useState(true)
    const [minAllowedDate, setMinAllowedDate] = useState("")
    const router = useRouter()
    const searchParams = useSearchParams()
    const userId = searchParams.get('userId') || searchParams.get('id')

    useEffect(() => {
        if (userId) {
            localStorage.setItem('userId', userId)
            fetchDonorInfo(userId)
        } else {
            const storedId = localStorage.getItem('userId')
            if (storedId) {
                fetchDonorInfo(storedId)
            } else {
                setIsLoadingDonor(false)
            }
        }
        fetchBloodCenters()
    }, [userId])

    const fetchDonorInfo = async (id: string) => {
        try {
            const response = await fetch(`http://localhost:8080/donor/dashboard/${id}`)
            if (response.ok) {
                const data = await response.json()
                setDonorInfo({
                    lastDonationDate: data.lastDonationDate,
                    nextEligibleDate: data.nextEligibleDate,
                    daysUntilNextDonation: data.daysUntilNextDonation
                })

                // Устанавливаем минимальную дату для записи
                if (data.nextEligibleDate) {
                    const eligibleDate = new Date(data.nextEligibleDate)
                    const tomorrow = new Date()
                    tomorrow.setDate(tomorrow.getDate() + 1)
                    const minDate = eligibleDate > tomorrow ? eligibleDate : tomorrow
                    setMinAllowedDate(minDate.toISOString().split('T')[0])
                } else {
                    const tomorrow = new Date()
                    tomorrow.setDate(tomorrow.getDate() + 1)
                    setMinAllowedDate(tomorrow.toISOString().split('T')[0])
                }
            }
        } catch (error) {
            console.error("Error fetching donor info:", error)
            const tomorrow = new Date()
            tomorrow.setDate(tomorrow.getDate() + 1)
            setMinAllowedDate(tomorrow.toISOString().split('T')[0])
        } finally {
            setIsLoadingDonor(false)
        }
    }

    const fetchBloodCenters = async () => {
        try {
            const response = await fetch("http://localhost:8080/blood-centers")
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }
            const data = await response.json()
            setBloodCenters(Array.isArray(data) ? data : [])
        } catch (error) {
            console.error("Error fetching blood centers:", error)
            setBloodCenters([
                { bloodCenterId: 1, name: "Central Blood Center", location: "Abay Ave 123", city: "Almaty" },
                { bloodCenterId: 2, name: "City Blood Bank", location: "Dostyk Ave 45", city: "Almaty" },
            ])
        } finally {
            setIsLoadingCenters(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedDate || !selectedTime || !selectedCenter) {
            alert("Please fill all fields")
            return
        }

        setIsLoading(true)
        try {
            const appointmentDateTime = `${selectedDate}T${selectedTime}:00`
            const donorId = parseInt(userId || localStorage.getItem('userId') || "2")

            const response = await fetch("http://localhost:8080/appointments/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    donorId: donorId,
                    bloodCenterId: parseInt(selectedCenter),
                    appointmentDate: appointmentDateTime,
                    notes: "Booked via web interface"
                })
            })

            const data = await response.json()

            if (response.ok) {
                alert("Appointment booked successfully!")
                router.push(`/dashboard/for-donor/appointments?userId=${donorId}`)
            } else {
                alert(data.error || "Failed to book appointment")
            }
        } catch (error) {
            console.error("Error booking appointment:", error)
            alert("Network error. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    const maxDateObj = new Date()
    maxDateObj.setMonth(maxDateObj.getMonth() + 3)
    const maxDate = maxDateObj.toISOString().split('T')[0]

    if (isLoadingCenters || isLoadingDonor) {
        return (
            <div className="flex min-h-screen bg-background">
                <Sidebar />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-muted-foreground">Loading...</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen bg-background">
            <Sidebar />
            <main className="flex-1 p-6 lg:p-8 overflow-auto">
                <div className="max-w-2xl mx-auto">
                    <Button
                        variant="ghost"
                        onClick={() => router.back()}
                        className="mb-6"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Appointments
                    </Button>

                    <Card className="p-6">
                        <div className="text-center mb-6">
                            <h1 className="text-2xl font-bold text-foreground">Book a Donation Appointment</h1>
                            <p className="text-muted-foreground mt-1">Schedule your next blood donation</p>
                        </div>

                        {/* Информация о последней донации */}
                        {donorInfo && donorInfo.lastDonationDate && (
                            <div className="mb-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 text-primary mt-0.5" />
                                    <div>
                                        <h4 className="font-medium text-foreground">Donation Eligibility</h4>
                                        <p className="text-sm text-muted-foreground">
                                            Last donation: {new Date(donorInfo.lastDonationDate).toLocaleDateString()}
                                        </p>
                                        {donorInfo.daysUntilNextDonation > 0 ? (
                                            <p className="text-sm text-primary font-medium mt-1">
                                                You can donate again after {donorInfo.daysUntilNextDonation} days
                                            </p>
                                        ) : (
                                            <p className="text-sm text-chart-2 font-medium mt-1">
                                                You are eligible to donate!
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">
                                    <Calendar className="w-4 h-4 inline mr-2 text-primary" />
                                    Select Date
                                </label>
                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    min={minAllowedDate}
                                    max={maxDate}
                                    className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
                                    required
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    {donorInfo && donorInfo.nextEligibleDate ? (
                                        <>Earliest eligible date: {new Date(donorInfo.nextEligibleDate).toLocaleDateString()}</>
                                    ) : (
                                        <>You can book appointments up to 3 months in advance</>
                                    )}
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">
                                    <Clock className="w-4 h-4 inline mr-2 text-primary" />
                                    Select Time
                                </label>
                                <select
                                    value={selectedTime}
                                    onChange={(e) => setSelectedTime(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
                                    required
                                >
                                    <option value="">Select time</option>
                                    <option value="09:00">09:00 AM</option>
                                    <option value="10:00">10:00 AM</option>
                                    <option value="11:00">11:00 AM</option>
                                    <option value="12:00">12:00 PM</option>
                                    <option value="14:00">02:00 PM</option>
                                    <option value="15:00">03:00 PM</option>
                                    <option value="16:00">04:00 PM</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">
                                    <MapPin className="w-4 h-4 inline mr-2 text-primary" />
                                    Select Blood Center
                                </label>
                                <select
                                    value={selectedCenter}
                                    onChange={(e) => setSelectedCenter(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
                                    required
                                >
                                    <option value="">Select center</option>
                                    {bloodCenters.map(center => (
                                        <option key={center.bloodCenterId} value={center.bloodCenterId}>
                                            {center.name} - {center.location}, {center.city}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="bg-muted/50 rounded-lg p-4">
                                <h3 className="font-medium text-foreground mb-2">Important Information:</h3>
                                <ul className="text-sm text-muted-foreground space-y-1">
                                    <li>• Please eat well before donation</li>
                                    <li>• Stay hydrated</li>
                                    <li>• Bring your ID card</li>
                                    <li>• Get at least 5 hours of sleep</li>
                                    <li className="text-primary font-medium">• Minimum 60 days between donations</li>
                                </ul>
                            </div>

                            <Button
                                type="submit"
                                className="w-full bg-primary hover:bg-primary/90"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Booking...
                                    </>
                                ) : (
                                    "Book Appointment"
                                )}
                            </Button>
                        </form>
                    </Card>
                </div>
            </main>
        </div>
    )
}