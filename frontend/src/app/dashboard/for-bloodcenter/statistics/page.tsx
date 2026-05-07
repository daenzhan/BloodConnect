"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { BloodCenterSidebar } from "../components/sidebar";
import { CenterProfileCard } from "../components/center-profile-card";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Droplet, Users, TrendingUp, Heart } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, ResponsiveContainer } from "recharts";

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    if (!token) {
        console.error("No token found");
        return null;
    }
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

const checkAuthAndRedirect = (response: Response) => {
    if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (typeof window !== 'undefined') {
            window.location.href = '/auth/login';
        }
        return true;
    }
    return false;
};

export default function StatisticsPage() {
    const searchParams = useSearchParams();
    const userId = searchParams.get('userId');
    const [bloodCenterId, setBloodCenterId] = useState<number | null>(null);
    const [period, setPeriod] = useState("month");
    const [stats, setStats] = useState<any>(null);
    const [bloodTypeData, setBloodTypeData] = useState([]);
    const [monthlyData, setMonthlyData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/auth/login';
        }
    }, []);

    useEffect(() => {
        const fetchCenter = async () => {
            if (!userId) return;
            try {
                setError(null);
                const headers = getAuthHeaders();
                if (!headers) {
                    window.location.href = '/auth/login';
                    return;
                }
                console.log("Fetching blood center for userId:", userId);
                const res = await fetch(`http://localhost:8080/blood-centers/by-user/${userId}`, {
                    headers: headers
                });
                if (checkAuthAndRedirect(res)) return;
                if (res.ok) {
                    const data = await res.json();
                    console.log("Blood center data received:", data);
                    setBloodCenterId(data.bloodCenterId);
                } else if (res.status === 404) {
                    setError("Blood center not found for this user");
                } else {
                    setError("Failed to fetch blood center");
                }
            } catch (err) {
                console.error("Error fetching center:", err);
                setError("Network error while fetching blood center");
            }
        };
        fetchCenter();
    }, [userId]);

    useEffect(() => {
        const fetchStats = async () => {
            if (!bloodCenterId) return;
            try {
                setIsLoading(true);
                setError(null);
                const headers = getAuthHeaders();
                if (!headers) {
                    window.location.href = '/auth/login';
                    return;
                }
                console.log(`Fetching statistics for bloodCenterId: ${bloodCenterId}, period: ${period}`);
                const res = await fetch(`http://localhost:8080/blood-centers/${bloodCenterId}/statistics?period=${period}`, {
                    headers: headers
                });
                if (checkAuthAndRedirect(res)) return;
                if (res.ok) {
                    const data = await res.json();
                    console.log("Statistics data received:", data);
                    setStats(data.stats);
                    setBloodTypeData(data.bloodTypeDistribution || []);
                    setMonthlyData(data.monthlyData || []);
                } else {
                    setError(`Failed to fetch statistics: ${res.status}`);
                }
            } catch (err) {
                console.error("Error fetching statistics:", err);
                setError(`Network error: ${err instanceof Error ? err.message : 'Unknown error'}`);
            } finally {
                setIsLoading(false);
            }
        };

        fetchStats();
    }, [bloodCenterId, period]);

    const COLORS = ["#dc2626", "#b91c1c", "#991b1b", "#7f1d1d", "#ef4444", "#f87171", "#fca5a5", "#fecaca"];

    if (!userId) {
        return (
            <div className="flex min-h-screen bg-background">
                <BloodCenterSidebar userId={userId} />
                <main className="flex-1 p-6">
                    <Card className="p-6 text-center">
                        <p className="text-red-600">Access Denied: User ID not found</p>
                    </Card>
                </main>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex min-h-screen bg-background">
                <BloodCenterSidebar userId={userId} />
                <main className="flex-1 p-6 flex items-center justify-center">
                    <div className="text-center">
                        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-muted-foreground">Loading statistics...</p>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <>
            <BloodCenterSidebar userId={userId} />
            <main className="ml-20 lg:ml-64 p-6 lg:p-8 min-h-screen overflow-auto">
                <header className="flex justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold">Statistics</h1>
                        <p className="text-muted-foreground">Analytics insights</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <Select value={period} onValueChange={setPeriod}>
                            <SelectTrigger className="w-32">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="week">Week</SelectItem>
                                <SelectItem value="month">Month</SelectItem>
                                <SelectItem value="year">Year</SelectItem>
                                <SelectItem value="all">All Time</SelectItem>
                            </SelectContent>
                        </Select>
                        <CenterProfileCard userId={userId} />
                    </div>
                </header>

                {error && (
                    <Card className="p-4 mb-6 bg-red-50 border-red-200">
                        <div className="flex items-center gap-2 text-red-600">
                            <TrendingUp className="w-5 h-5" />
                            <span>{error}</span>
                        </div>
                        <button
                            onClick={() => {
                                setError(null);
                                if (bloodCenterId) {
                                    const fetchStats = async () => {
                                        const headers = getAuthHeaders();
                                        if (headers) {
                                            const res = await fetch(`http://localhost:8080/blood-centers/${bloodCenterId}/statistics?period=${period}`, {
                                                headers: headers
                                            });
                                            if (res.ok) {
                                                const data = await res.json();
                                                setStats(data.stats);
                                                setBloodTypeData(data.bloodTypeDistribution || []);
                                                setMonthlyData(data.monthlyData || []);
                                            }
                                        }
                                    };
                                    fetchStats();
                                }
                            }}
                            className="mt-2 px-3 py-1 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90"
                        >
                            Retry
                        </button>
                    </Card>
                )}

                {!error && stats && (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                            <Card className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                        <Droplet className="w-6 h-6 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold">{stats?.totalDonations || 0}</p>
                                        <p className="text-sm">Total Donations</p>
                                    </div>
                                </div>
                            </Card>
                            <Card className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                                        <Users className="w-6 h-6 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold">{stats?.totalDonors || 0}</p>
                                        <p className="text-sm">Total Donors</p>
                                    </div>
                                </div>
                            </Card>
                            <Card className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                                        <Heart className="w-6 h-6 text-red-600" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold">{stats?.livesSaved || 0}</p>
                                        <p className="text-sm">Lives Saved</p>
                                    </div>
                                </div>
                            </Card>
                            <Card className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                                        <TrendingUp className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold">{stats?.avgDonationsPerDay || 0}</p>
                                        <p className="text-sm">Avg/Day</p>
                                    </div>
                                </div>
                            </Card>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                            <Card className="p-6">
                                <h3 className="font-semibold mb-4">Blood Type Distribution</h3>
                                {bloodTypeData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={300}>
                                        <PieChart>
                                            <Pie
                                                data={bloodTypeData}
                                                dataKey="count"
                                                nameKey="bloodType"
                                                cx="50%"
                                                cy="50%"
                                                outerRadius={100}
                                                label={({ bloodType, percentage }) => `${bloodType} (${percentage}%)`}
                                            >
                                                {bloodTypeData.map((entry, idx) => (
                                                    <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex items-center justify-center h-72 text-muted-foreground">
                                        No data available
                                    </div>
                                )}
                            </Card>
                            <Card className="p-6">
                                <h3 className="font-semibold mb-4">Monthly Donations</h3>
                                {monthlyData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={monthlyData}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="month" />
                                            <YAxis />
                                            <Tooltip />
                                            <Legend />
                                            <Bar dataKey="donations" fill="#dc2626" name="Donations" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex items-center justify-center h-72 text-muted-foreground">
                                        No data available
                                    </div>
                                )}
                            </Card>
                        </div>

                        <Card className="p-6">
                            <h3 className="font-semibold mb-4">Growth Trend</h3>
                            {monthlyData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={monthlyData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="month" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Line type="monotone" dataKey="donations" stroke="#dc2626" name="Donations" />
                                        <Line type="monotone" dataKey="newDonors" stroke="#16a34a" name="New Donors" />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-72 text-muted-foreground">
                                    No data available
                                </div>
                            )}
                        </Card>
                    </>
                )}
            </main>
        </>
    );
    }