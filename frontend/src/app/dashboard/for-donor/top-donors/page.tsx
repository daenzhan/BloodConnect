"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
    Trophy, Medal, MapPin, Droplet,
    Award, Star, ArrowLeft, Loader2, Users,
    Heart, ChevronRight, Crown
} from "lucide-react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Sidebar } from "../components/sidebar"

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

    const searchParams = useSearchParams()
    const userId = searchParams.get('userId') || searchParams.get('id')

    useEffect(() => {
        if (userId) {
            fetchTopDonors()
            fetchCurrentDonorRank()
            localStorage.setItem('userId', userId)
        } else {
            const storedId = localStorage.getItem('userId')
            if (storedId) {
                fetchTopDonors()
                fetchCurrentDonorRank()
            } else {
                setIsLoading(false)
                setError("No user ID found")
            }
        }
    }, [userId])

    const fetchTopDonors = async () => {
        try {
            const response = await fetch("http://localhost:8080/donor/top-donors")
            if (!response.ok) throw new Error("Failed to fetch top donors")
            const data = await response.json()
            // Берем только первых 10 доноров
            setTopDonors(Array.isArray(data) ? data.slice(0, 10) : [])
        } catch (error) {
            console.error("Error fetching top donors:", error)
            setError(error instanceof Error ? error.message : "Failed to load top donors")
        }
    }

    const fetchCurrentDonorRank = async () => {
        try {
            const id = userId || localStorage.getItem('userId')
            if (!id) return

            const response = await fetch(`http://localhost:8080/donor/current-donor-rank/${id}`)
            if (!response.ok) throw new Error("Failed to fetch current rank")
            const data = await response.json()
            setCurrentRank(data)
        } catch (error) {
            console.error("Error fetching current rank:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const getRankIcon = (rank: number) => {
        if (rank === 1) return <Crown className="w-5 h-5 text-yellow-500" />
        if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />
        if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />
        return <span className="w-6 h-6 flex items-center justify-center text-sm font-medium text-muted-foreground">{rank}</span>
    }

    const getLevelColor = (level: string) => {
        switch(level?.toLowerCase()) {
            case 'platinum': return 'bg-gradient-to-r from-gray-300 to-gray-400 text-gray-900'
            case 'gold': return 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white'
            case 'silver': return 'bg-gradient-to-r from-gray-300 to-gray-400 text-gray-800'
            case 'bronze': return 'bg-gradient-to-r from-amber-500 to-amber-600 text-white'
            default: return 'bg-gradient-to-r from-primary to-primary/80 text-white'
        }
    }

    const calculateExperienceProgress = (donationCount: number, currentLevel: string) => {
        const thresholds: Record<string, { current: number; next: number }> = {
            'Newcomer': { current: 0, next: 5 },
            'Bronze': { current: 5, next: 15 },
            'Silver': { current: 15, next: 25 },
            'Gold': { current: 25, next: 50 },
            'Platinum': { current: 50, next: 50 }
        }

        const levelData = thresholds[currentLevel] || thresholds.Newcomer
        if (levelData.current === levelData.next) return 100
        const progress = ((donationCount - levelData.current) / (levelData.next - levelData.current)) * 100
        return Math.min(Math.max(progress, 0), 100)
    }

    const getNextLevelName = (currentLevel: string) => {
        const levels = ['Newcomer', 'Bronze', 'Silver', 'Gold', 'Platinum']
        const currentIndex = levels.indexOf(currentLevel)
        if (currentIndex === -1 || currentIndex === levels.length - 1) return null
        return levels[currentIndex + 1]
    }

    const getDonationsToNextLevel = (donationCount: number, currentLevel: string) => {
        const nextLevel = getNextLevelName(currentLevel)
        if (!nextLevel) return 0

        const thresholds: Record<string, number> = {
            'Newcomer': 5,
            'Bronze': 15,
            'Silver': 25,
            'Gold': 50
        }

        return thresholds[nextLevel] - donationCount
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

    if (error) {
        return (
            <div className="flex min-h-screen bg-background">
                <Sidebar />
                <main className="flex-1 p-6 lg:p-8 overflow-auto">
                    <Card className="p-12 text-center">
                        <div className="text-destructive mb-4">
                            <Heart className="w-16 h-16 mx-auto" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Error Loading Top Donors</h3>
                        <p className="text-muted-foreground mb-4">{error}</p>
                        <button
                            onClick={() => {
                                fetchTopDonors()
                                fetchCurrentDonorRank()
                            }}
                            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                        >
                            Try Again
                        </button>
                    </Card>
                </main>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen bg-background">
            <Sidebar />
            <main className="flex-1 p-6 lg:p-8 overflow-auto">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-foreground">Top Donors</h1>
                    <p className="text-muted-foreground mt-1">Meet our heroes who save lives through blood donation</p>
                </div>

                {/* Current Donor Rank Card */}
                {currentRank && (
                    <Card className="p-5 mb-6 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/30 rounded-xl">
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                                    <Award className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Your Ranking</p>
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl font-bold text-foreground">#{currentRank.rank}</span>
                                        <Badge className={getLevelColor(currentRank.donorLevel)}>
                                            {currentRank.donorLevel}
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Out of {currentRank.totalDonors} donors • {currentRank.donationCount} donations
                                    </p>
                                </div>
                            </div>

                            {/* Experience Bar */}
                            {getNextLevelName(currentRank.donorLevel) && (
                                <div className="flex-1 w-full md:max-w-sm">
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-muted-foreground">{currentRank.donorLevel}</span>
                                        <span className="text-muted-foreground">{getNextLevelName(currentRank.donorLevel)}</span>
                                    </div>
                                    <Progress
                                        value={calculateExperienceProgress(currentRank.donationCount, currentRank.donorLevel)}
                                        className="h-2"
                                    />
                                    <div className="flex justify-between text-xs mt-1">
                                        <span className="text-muted-foreground">{currentRank.donationCount} donations</span>
                                        <span className="text-primary text-xs">
                                            {getDonationsToNextLevel(currentRank.donationCount, currentRank.donorLevel)} more to go
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>
                )}

                {/* Top Donors List - First 10 */}
                {topDonors.length === 0 ? (
                    <Card className="p-12 text-center">
                        <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-xl font-semibold mb-2">No Donors Yet</h3>
                        <p className="text-muted-foreground">Be the first to make a donation!</p>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {topDonors.map((donor) => (
                            <Card
                                key={donor.donorId}
                                className={`p-5 hover:shadow-md transition-shadow ${
                                    donor.rank <= 3 ? 'bg-primary/5 border-primary/20' : ''
                                }`}
                            >
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                    {/* Left Section */}
                                    <div className="flex items-start gap-4">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                                            donor.rank === 1 ? 'bg-yellow-500/20' :
                                                donor.rank === 2 ? 'bg-gray-400/20' :
                                                    donor.rank === 3 ? 'bg-amber-600/20' :
                                                        'bg-muted'
                                        }`}>
                                            {getRankIcon(donor.rank)}
                                        </div>

                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-semibold text-foreground text-lg">
                                                    {donor.fullName}
                                                </h3>
                                                <Badge className={getLevelColor(donor.donorLevel)}>
                                                    {donor.donorLevel}
                                                </Badge>
                                            </div>

                                            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <Droplet className="w-3 h-3 text-primary" />
                                                    {donor.bloodType}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <MapPin className="w-3 h-3" />
                                                    {donor.city}
                                                </span>
                                                
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Section - Stats */}
                                    <div className="flex items-center gap-6">
                                        <div className="text-center min-w-[70px]">
                                            <p className="text-xl font-bold text-primary">{donor.donationCount}</p>
                                            <p className="text-xs text-muted-foreground">Donations</p>
                                        </div>
                                        <div className="text-center min-w-[70px]">
                                            <p className="text-xl font-bold text-chart-2">{donor.donationCount * 3}</p>
                                            <p className="text-xs text-muted-foreground">Lives Saved</p>
                                        </div>
                                        <div className="text-center min-w-[70px]">
                                            <p className="text-xl font-bold text-chart-4">{donor.points}</p>
                                            <p className="text-xs text-muted-foreground">Points</p>
                                        </div>
                                        <Button
                                            variant="link"
                                            size="sm"
                                            className="text-primary h-auto p-0 text-sm"
                                            asChild
                                        >

                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </main>
        </div>
    )
}