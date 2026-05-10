"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    MapPin, Droplet,
    Award, ArrowLeft, Loader2, Users,
    Heart, TrendingUp
} from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { Sidebar } from "../components/sidebar"
import { ProfileCard } from "../components/profile-card"

interface TopDonor {
    rank: number;
    donorId: number;
    fullName: string;
    donationCount: number;
    bloodType: string;
    city: string;
    rating: number;
    points: number;
    donorLevel: string;
    lastDonationDate: string | null;
}

interface CurrentDonorRank {
    rank: number;
    totalDonors: number;
    donationCount: number;
    donorLevel: string;
    nextRankDonations: number;
}

export default function TopDonorsPage() {
    const [topDonors, setTopDonors] = useState<TopDonor[]>([])
    const [currentRank, setCurrentRank] = useState<CurrentDonorRank | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()
    const searchParams = useSearchParams()
    const userIdFromUrl = searchParams.get('userId') || searchParams.get('id')
    const [userId, setUserId] = useState<string | null>(null)

    const getAuthHeaders = () => {
        const token = localStorage.getItem('token')
        if (!token) return null
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    }

    useEffect(() => {
        const token = localStorage.getItem('token')
        if (!token) {
            router.push('/auth/login')
            return
        }

        let finalUserId = userIdFromUrl
        if (!finalUserId || finalUserId === 'null') {
            const storedId = localStorage.getItem('userId')
            if (storedId && storedId !== 'null') {
                finalUserId = storedId
            }
        }

        if (finalUserId && finalUserId !== 'null') {
            setUserId(finalUserId)
            localStorage.setItem('userId', finalUserId)
        } else {
            setIsLoading(false)
            setError("No user ID found")
        }
    }, [userIdFromUrl, router])

    useEffect(() => {
        if (userId) {
            fetchTopDonors()
            fetchCurrentDonorRank()
        }
    }, [userId])

    const fetchTopDonors = async () => {
        try {
            const headers = getAuthHeaders()
            if (!headers) {
                router.push('/auth/login')
                return
            }

            const response = await fetch("http://localhost:8080/donor/top-donors", {
                headers: headers
            })

            if (response.status === 401 || response.status === 403) {
                localStorage.removeItem('token')
                localStorage.removeItem('user')
                localStorage.removeItem('userId')
                router.push('/auth/login')
                return
            }

            if (!response.ok) throw new Error("Failed to fetch top donors")
            const data = await response.json()
            setTopDonors(Array.isArray(data) ? data.slice(0, 10) : [])
        } catch (error) {
            console.error("Error fetching top donors:", error)
            setError(error instanceof Error ? error.message : "Failed to load top donors")
        }
    }

    const fetchCurrentDonorRank = async () => {
        try {
            const headers = getAuthHeaders()
            if (!headers) {
                router.push('/auth/login')
                return
            }

            const response = await fetch(`http://localhost:8080/donor/current-donor-rank/${userId}`, {
                headers: headers
            })

            if (response.status === 401 || response.status === 403) {
                localStorage.removeItem('token')
                localStorage.removeItem('user')
                localStorage.removeItem('userId')
                router.push('/auth/login')
                return
            }

            if (!response.ok) throw new Error("Failed to fetch current rank")
            const data = await response.json()
            setCurrentRank(data)
        } catch (error) {
            console.error("Error fetching current rank:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const getCorrectLevel = (donationCount: number) => {
        if (donationCount >= 50) return 'Platinum'
        if (donationCount >= 25) return 'Gold'
        if (donationCount >= 15) return 'Silver'
        if (donationCount >= 5) return 'Bronze'
        return 'Newcomer'
    }

    const getLevelInfo = (donationCount: number) => {
        const correctLevel = getCorrectLevel(donationCount)

        const thresholds: Record<string, { min: number; max: number }> = {
            'Newcomer': { min: 0, max: 5 },
            'Bronze': { min: 5, max: 15 },
            'Silver': { min: 15, max: 25 },
            'Gold': { min: 25, max: 50 },
            'Platinum': { min: 50, max: 50 }
        }

        const current = thresholds[correctLevel]

        let progress = 0
        if (current.max === current.min) {
            progress = 100
        } else {
            const adjustedCurrent = donationCount - current.min
            const adjustedMax = current.max - current.min
            progress = (adjustedCurrent / adjustedMax) * 100
            progress = Math.min(Math.max(progress, 0), 100)
        }

        let nextLevel = null
        let donationsToNext = 0

        if (correctLevel === 'Newcomer') {
            nextLevel = 'Bronze'
            donationsToNext = thresholds.Bronze.max - donationCount
        } else if (correctLevel === 'Bronze') {
            nextLevel = 'Silver'
            donationsToNext = thresholds.Silver.max - donationCount
        } else if (correctLevel === 'Silver') {
            nextLevel = 'Gold'
            donationsToNext = thresholds.Gold.max - donationCount
        } else if (correctLevel === 'Gold') {
            nextLevel = 'Platinum'
            donationsToNext = thresholds.Platinum.max - donationCount
        } else {
            nextLevel = null
            donationsToNext = 0
        }

        return {
            progress: Math.round(progress),
            currentLevel: correctLevel,
            nextLevel,
            currentDonations: donationCount,
            minDonations: current.min,
            maxDonations: current.max,
            donationsToNext: Math.max(0, donationsToNext)
        }
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background">
                <Sidebar />
                <main className="ml-20 lg:ml-64 p-6 lg:p-8">
                    <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-foreground">Top Donors</h1>
                            <p className="text-muted-foreground mt-1">Leading lifesavers in our community</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button onClick={() => router.push(`/dashboard/for-donor?userId=${userId || ''}`)} variant="outline">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back
                            </Button>
                            {userId && <ProfileCard userId={userId} showBookButton={false} />}
                        </div>
                    </div>
                    <div className="flex items-center justify-center min-h-[400px]">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                </main>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-background">
                <Sidebar />
                <main className="ml-20 lg:ml-64 p-6 lg:p-8">
                    <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-foreground">Top Donors</h1>
                            <p className="text-muted-foreground mt-1">Leading lifesavers in our community</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button onClick={() => router.push(`/dashboard/for-donor?userId=${userId || ''}`)} variant="outline">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back
                            </Button>
                            {userId && <ProfileCard userId={userId} showBookButton={false} />}
                        </div>
                    </div>
                    <Card className="p-12 text-center">
                        <Heart className="w-12 h-12 text-destructive mx-auto mb-4" />
                        <p className="text-muted-foreground">{error}</p>
                        <Button onClick={() => { fetchTopDonors(); fetchCurrentDonorRank(); }} className="mt-4">
                            Try Again
                        </Button>
                    </Card>
                </main>
            </div>
        )
    }

    if (!userId || userId === 'null') {
        return (
            <div className="min-h-screen bg-background">
                <Sidebar />
                <main className="ml-20 lg:ml-64 p-6 lg:p-8">
                    <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-foreground">Top Donors</h1>
                            <p className="text-muted-foreground mt-1">Leading lifesavers in our community</p>
                        </div>
                        <Button onClick={() => router.push('/auth/login')} variant="outline">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Login
                        </Button>
                    </div>
                    <Card className="p-12 text-center">
                        <p className="text-destructive">Please login to view top donors</p>
                        <Button onClick={() => router.push('/auth/login')} className="mt-4">
                            Go to Login
                        </Button>
                    </Card>
                </main>
            </div>
        )
    }

    const levelInfo = currentRank ? getLevelInfo(currentRank.donationCount) : null

    return (
        <div className="min-h-screen bg-background">
            <Sidebar />
            <main className="ml-20 lg:ml-64 p-6 lg:p-8">
                {/* Header */}
                <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Top Donors</h1>
                        <p className="text-muted-foreground mt-1">Leading lifesavers in our community</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button onClick={() => router.push(`/dashboard/for-donor?userId=${userId}`)} variant="outline">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Dashboard
                        </Button>
                        <ProfileCard userId={userId} showBookButton={false} />
                    </div>
                </div>

                {/* Progress Card */}
                {currentRank && levelInfo && (
                    <Card className="p-6 mb-6 border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                                    <Award className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Your Rank</p>
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl font-bold text-foreground">#{currentRank.rank}</span>
                                        <Badge className="bg-primary/20 text-primary border-primary/30">
                                            {levelInfo.currentLevel}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="flex items-baseline justify-end gap-1">
                                    <p className="text-2xl font-bold text-primary">{currentRank.donationCount}</p>
                                    <p className="text-xs text-muted-foreground"> donations</p>
                                </div>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-foreground font-medium">{levelInfo.currentLevel}</span>
                                {levelInfo.nextLevel && (
                                    <span className="text-muted-foreground">{levelInfo.nextLevel}</span>
                                )}
                            </div>

                            {/* Прогресс-бар с насыщенным красным цветом */}
                            <div className="w-full bg-primary/15 rounded-full h-3 overflow-hidden">
                                <div
                                    className="bg-primary h-full rounded-full transition-all duration-500 ease-out relative"
                                    style={{ width: `${levelInfo.progress}%` }}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                                </div>
                            </div>

                            {/* Процент и шкала */}
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-muted-foreground">{levelInfo.minDonations}</span>
                                <span className="text-sm font-bold text-primary">{levelInfo.progress}%</span>
                                <span className="text-xs text-muted-foreground">{levelInfo.maxDonations}</span>
                            </div>

                            {/* Центральная информация о прогрессе */}
                            <div className="text-center">
                                <span className="text-sm text-foreground font-medium">
                                    {levelInfo.currentDonations} / {levelInfo.maxDonations} donations
                                </span>
                            </div>


                        </div>
                    </Card>
                )}

                {/* Top Donors List */}
                {topDonors.length === 0 ? (
                    <Card className="p-12 text-center">
                        <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No donors yet</p>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 mb-4">
                            <TrendingUp className="w-4 h-4 text-primary" />
                            <h2 className="text-lg font-semibold text-foreground">Top 10 Donors</h2>
                        </div>

                        {topDonors.map((donor) => {
                            const donorCorrectLevel = getCorrectLevel(donor.donationCount)
                            return (
                                <Card
                                    key={donor.donorId}
                                    className={`p-4 hover:shadow-md transition-shadow ${
                                        donor.rank <= 3 ? 'border-primary/30 bg-primary/5' : ''
                                    }`}
                                >
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center">
                                                <span className="text-sm font-semibold text-primary">{donor.rank}</span>
                                            </div>
                                            <div>
                                                <p className="font-semibold text-foreground">{donor.fullName}</p>
                                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                    <span className="flex items-center gap-1">
                                                        <Droplet className="w-3 h-3 text-primary/70" />
                                                        {donor.bloodType}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <MapPin className="w-3 h-3" />
                                                        {donor.city}
                                                    </span>
                                                    <Badge className="bg-primary/15 text-primary text-xs border-0">
                                                        {donorCorrectLevel}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="flex items-center gap-1 justify-end">
                                                <p className="text-lg font-bold text-primary">{donor.donationCount}</p>
                                                <p className="text-xs text-muted-foreground"> donations</p>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            )
                        })}
                    </div>
                )}
            </main>

            <style jsx>{`
                @keyframes shimmer {
                    0% {
                        transform: translateX(-100%);
                    }
                    100% {
                        transform: translateX(100%);
                    }
                }
                .animate-shimmer {
                    animation: shimmer 2s infinite;
                }
            `}</style>
        </div>
    )
}