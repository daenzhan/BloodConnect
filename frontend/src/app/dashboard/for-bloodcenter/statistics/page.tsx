"use client"

import { useState, useEffect } from "react"
import { BloodCenterSidebar } from "../components/sidebar"
import { CenterProfileCard } from "../components/center-profile-card"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Droplet, Users, TrendingUp, Calendar, Heart } from "lucide-react"
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from "recharts"

interface DonationStats {
    totalDonations: number
    totalDonors: number
    livesSaved: number
    avgDonationsPerDay: number
}

interface BloodTypeDistribution {
    bloodType: string
    count: number
    percentage: number
}

interface MonthlyData {
    month: string
    donations: number
    newDonors: number
}

// Blood-themed color palette for charts
const BLOOD_TYPE_COLORS: Record<string, string> = {
    "O+": "#dc2626",  // red-600
    "A+": "#b91c1c",  // red-700
    "B+": "#991b1b",  // red-800
    "AB+": "#7f1d1d", // red-900
    "O-": "#ef4444",  // red-500
    "A-": "#f87171",  // red-400
    "B-": "#fca5a5",  // red-300
    "AB-": "#fecaca", // red-200
}

const STATUS_COLORS: Record<string, string> = {
    Completed: "#16a34a",           // green-600
    "In Progress": "#2563eb",       // blue-600
    Pending: "#ca8a04",             // yellow-600
    "Awaiting Analysis": "#9333ea", // purple-600
}

// Custom tooltip component for stable positioning
const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
                {label && <p className="text-sm font-medium text-foreground mb-1">{label}</p>}
                {payload.map((entry, index) => (
                    <p key={index} className="text-sm" style={{ color: entry.color }}>
                        {entry.name}: {entry.value}
                    </p>
                ))}
            </div>
        )
    }
    return null
}

const PieTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: { bloodType?: string; percentage?: number } }> }) => {
    if (active && payload && payload.length) {
        const data = payload[0]
        return (
            <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
                <p className="text-sm font-medium text-foreground">{data.payload.bloodType || data.name}</p>
                <p className="text-sm text-muted-foreground">
                    {data.value} donations {data.payload.percentage ? `(${data.payload.percentage}%)` : ''}
                </p>
            </div>
        )
    }
    return null
}

export default function StatisticsPage() {
    const [stats, setStats] = useState<DonationStats | null>(null)
    const [bloodTypeData, setBloodTypeData] = useState<BloodTypeDistribution[]>([])
    const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([])
    const [period, setPeriod] = useState("month")
    const [isLoading, setIsLoading] = useState(true)

    const bloodCenterId = 1 // Temporarily hardcoded

    useEffect(() => {
        const fetchStatistics = async () => {
            try {
                const response = await fetch(`http://localhost:8080/blood-center/${bloodCenterId}/statistics?period=${period}`)
                if (response.ok) {
                    const data = await response.json()
                    setStats(data.stats)
                    setBloodTypeData(data.bloodTypeDistribution)
                    setMonthlyData(data.monthlyData)
                }
            } catch (error) {
                console.error("Error fetching statistics:", error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchStatistics()
    }, [bloodCenterId, period])

    // Mock data for development
    const mockStats: DonationStats = stats || {
        totalDonations: 1247,
        totalDonors: 892,
        livesSaved: 3741,
        avgDonationsPerDay: 8.5,
    }

    const mockBloodTypeData: BloodTypeDistribution[] = bloodTypeData.length > 0 ? bloodTypeData : [
        { bloodType: "O+", count: 350, percentage: 28.1 },
        { bloodType: "A+", count: 280, percentage: 22.5 },
        { bloodType: "B+", count: 220, percentage: 17.6 },
        { bloodType: "AB+", count: 120, percentage: 9.6 },
        { bloodType: "O-", count: 100, percentage: 8.0 },
        { bloodType: "A-", count: 85, percentage: 6.8 },
        { bloodType: "B-", count: 55, percentage: 4.4 },
        { bloodType: "AB-", count: 37, percentage: 3.0 },
    ]

    const mockMonthlyData: MonthlyData[] = monthlyData.length > 0 ? monthlyData : [
        { month: "Oct", donations: 95, newDonors: 28 },
        { month: "Nov", donations: 110, newDonors: 35 },
        { month: "Dec", donations: 85, newDonors: 22 },
        { month: "Jan", donations: 120, newDonors: 42 },
        { month: "Feb", donations: 135, newDonors: 38 },
        { month: "Mar", donations: 148, newDonors: 45 },
    ]

    const statusData = [
        { name: "Completed", value: 680 },
        { name: "In Progress", value: 45 },
        { name: "Pending", value: 32 },
        { name: "Awaiting Analysis", value: 28 },
    ]

    return (
        <div className="flex min-h-screen bg-background">
            <BloodCenterSidebar />
            <main className="flex-1 p-6 lg:p-8 overflow-auto">
                <header className="flex items-start justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Statistics</h1>
                        <p className="text-muted-foreground">Analytics and insights from your donation data</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <Select value={period} onValueChange={setPeriod}>
                            <SelectTrigger className="w-32">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="week">This Week</SelectItem>
                                <SelectItem value="month">This Month</SelectItem>
                                <SelectItem value="year">This Year</SelectItem>
                                <SelectItem value="all">All Time</SelectItem>
                            </SelectContent>
                        </Select>
                        <CenterProfileCard name="City Blood Center" city="Almaty" />
                    </div>
                </header>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <Card className="p-4 rounded-xl border border-border">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                <Droplet className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-foreground">{mockStats.totalDonations}</p>
                                <p className="text-sm text-muted-foreground">Total Donations</p>
                            </div>
                        </div>
                    </Card>
                    <Card className="p-4 rounded-xl border border-border">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-chart-2/10 flex items-center justify-center">
                                <Users className="w-6 h-6 text-chart-2" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-foreground">{mockStats.totalDonors}</p>
                                <p className="text-sm text-muted-foreground">Total Donors</p>
                            </div>
                        </div>
                    </Card>
                    <Card className="p-4 rounded-xl border border-border">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-chart-1/10 flex items-center justify-center">
                                <Heart className="w-6 h-6 text-chart-1" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-foreground">{mockStats.livesSaved}</p>
                                <p className="text-sm text-muted-foreground">Lives Saved</p>
                            </div>
                        </div>
                    </Card>
                    <Card className="p-4 rounded-xl border border-border">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-chart-4/10 flex items-center justify-center">
                                <TrendingUp className="w-6 h-6 text-chart-4" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-foreground">{mockStats.avgDonationsPerDay}</p>
                                <p className="text-sm text-muted-foreground">Avg/Day</p>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Charts Row 1 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {/* Blood Type Distribution Pie Chart */}
                    <Card className="p-6 rounded-xl border border-border">
                        <h3 className="font-semibold text-foreground mb-4">Blood Type Distribution</h3>
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={mockBloodTypeData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ bloodType, percentage }) => `${bloodType} (${percentage}%)`}
                                        outerRadius={100}
                                        fill="#8884d8"
                                        dataKey="count"
                                        nameKey="bloodType"
                                    >
                                        {mockBloodTypeData.map((entry) => (
                                            <Cell key={`cell-${entry.bloodType}`} fill={BLOOD_TYPE_COLORS[entry.bloodType] || "#dc2626"} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<PieTooltip />} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>

                    {/* Donation Status Pie Chart */}
                    <Card className="p-6 rounded-xl border border-border">
                        <h3 className="font-semibold text-foreground mb-4">Donation Status Overview</h3>
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={statusData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, value }) => `${name}: ${value}`}
                                        outerRadius={100}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {statusData.map((entry) => (
                                            <Cell key={`cell-${entry.name}`} fill={STATUS_COLORS[entry.name] || "#6b7280"} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<PieTooltip />} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </div>

                {/* Charts Row 2 */}
                <div className="grid grid-cols-1 gap-6">
                    {/* Monthly Donations Trend */}
                    <Card className="p-6 rounded-xl border border-border">
                        <h3 className="font-semibold text-foreground mb-4">Monthly Donations Trend</h3>
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={mockMonthlyData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                                    <YAxis stroke="hsl(var(--muted-foreground))" />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend />
                                    <Bar dataKey="donations" fill="#dc2626" name="Donations" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="newDonors" fill="#16a34a" name="New Donors" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>

                    {/* Growth Trend Line Chart */}
                    <Card className="p-6 rounded-xl border border-border">
                        <h3 className="font-semibold text-foreground mb-4">Growth Trend</h3>
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={mockMonthlyData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                                    <YAxis stroke="hsl(var(--muted-foreground))" />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend />
                                    <Line
                                        type="monotone"
                                        dataKey="donations"
                                        stroke="#dc2626"
                                        strokeWidth={2}
                                        dot={{ fill: "#dc2626" }}
                                        name="Donations"
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="newDonors"
                                        stroke="#16a34a"
                                        strokeWidth={2}
                                        dot={{ fill: "#16a34a" }}
                                        name="New Donors"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </div>
            </main>
        </div>
    )
}
