"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { BloodCenterSidebar } from "../components/sidebar";
import { CenterProfileCard } from "../components/center-profile-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Droplet, Users, TrendingUp, Heart, Shield, Clock, CheckCircle, XCircle, Mail, AlertTriangle } from "lucide-react";
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
    const [verificationStatus, setVerificationStatus] = useState<string | null>(null);
    const [rejectionReason, setRejectionReason] = useState<string | null>(null);

    const checkVerification = async () => {
        if (!userId) return;
        try {
            const headers = getAuthHeaders();
            if (!headers) {
                window.location.href = '/auth/login';
                return;
            }
            const response = await fetch(`http://localhost:8080/blood-centers/by-user/${userId}`, { headers });

            if (response.status === 403) {
                setVerificationStatus("PENDING");
                setIsLoading(false);
                return;
            }

            if (response.status === 401) {
                localStorage.removeItem('token');
                window.location.href = '/auth/login';
                return;
            }

            if (response.ok) {
                const data = await response.json();
                setVerificationStatus(data.verificationStatus || "APPROVED");
                setRejectionReason(data.rejectionReason || null);
            }
        } catch (err) {
            console.error("Error checking verification:", err);
        }
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/auth/login';
            return;
        }
        checkVerification();
    }, [userId]);

    useEffect(() => {
        const fetchCenter = async () => {
            if (!userId || verificationStatus !== "APPROVED") return;
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
    }, [userId, verificationStatus]);

    useEffect(() => {
        const fetchStats = async () => {
            if (!bloodCenterId || verificationStatus !== "APPROVED") return;
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
    }, [bloodCenterId, period, verificationStatus]);

    const COLORS = ["#dc2626", "#b91c1c", "#991b1b", "#7f1d1d", "#ef4444", "#f87171", "#fca5a5", "#fecaca"];

    const renderPendingVerification = () => (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-amber-50 to-amber-100/30 p-4">
            <Card className="max-w-md w-full p-8 text-center shadow-xl border-0 bg-white">
                <div className="relative">
                    <div className="w-24 h-24 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                        <Clock className="w-12 h-12 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center shadow-md">
                        <span className="text-white text-xs font-bold">!</span>
                    </div>
                </div>

                <h2 className="text-2xl font-bold text-amber-800 mb-3">Account Pending Verification</h2>
                <div className="h-1 w-20 bg-gradient-to-r from-amber-400 to-amber-600 rounded-full mx-auto mb-6"></div>

                <p className="text-gray-600 mb-6">
                    Your blood center account is awaiting approval from the administrator.
                </p>

                <div className="bg-amber-50 rounded-xl p-4 mb-6 text-left border border-amber-200">
                    <div className="flex items-start gap-3">
                        <Shield className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                        <div className="text-sm">
                            <p className="font-semibold text-amber-800 mb-1">Why is this happening?</p>
                            <p className="text-amber-700">All blood centers must have their license verified before accessing the system.</p>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
                    <div className="flex items-start gap-3">
                        <Mail className="w-5 h-5 text-gray-500 mt-0.5 shrink-0" />
                        <div className="text-sm">
                            <p className="font-semibold text-gray-700 mb-1">What happens next?</p>
                            <ul className="text-gray-600 space-y-1">
                                <li>• Admin will review your license document</li>
                                <li>• You will receive an email notification once approved</li>
                                <li>• After approval, you can view statistics</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3">
                    <Button onClick={() => window.location.href = '/auth/login'} variant="outline" className="flex-1 border-amber-300 text-amber-700 hover:bg-amber-50">
                        Back to Login
                    </Button>
                    <Button onClick={() => window.location.reload()} className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white">
                        Refresh Status
                    </Button>
                </div>

                <p className="text-xs text-gray-400 mt-6">
                    Need help? Contact support at support@bloodconnect.com
                </p>
            </Card>
        </div>
    );

    const renderRejectedVerification = () => (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 to-red-100/30 p-4">
            <Card className="max-w-md w-full p-8 text-center shadow-xl border-0 bg-white">
                <div className="relative">
                    <div className="w-24 h-24 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                        <XCircle className="w-12 h-12 text-white" />
                    </div>
                </div>

                <h2 className="text-2xl font-bold text-red-800 mb-3">Account Not Verified</h2>
                <div className="h-1 w-20 bg-gradient-to-r from-red-400 to-red-600 rounded-full mx-auto mb-6"></div>

                <p className="text-gray-600 mb-6">
                    Your blood center account could not be verified by the administrator.
                </p>

                {rejectionReason && (
                    <div className="bg-red-50 rounded-xl p-4 mb-6 text-left border border-red-200">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                            <div className="text-sm">
                                <p className="font-semibold text-red-800 mb-1">Rejection Reason</p>
                                <p className="text-red-700">{rejectionReason}</p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
                    <div className="flex items-start gap-3">
                        <Mail className="w-5 h-5 text-gray-500 mt-0.5 shrink-0" />
                        <div className="text-sm">
                            <p className="font-semibold text-gray-700 mb-1">What can you do?</p>
                            <ul className="text-gray-600 space-y-1">
                                <li>• Contact support for more information</li>
                                <li>• Correct any issues with your license document</li>
                                <li>• Submit a new registration with updated documents</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3">
                    <Button onClick={() => window.location.href = '/auth/login'} className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white">
                        Back to Login
                    </Button>
                </div>

                <p className="text-xs text-gray-400 mt-6">
                    Contact support: support@bloodconnect.com
                </p>
            </Card>
        </div>
    );

    if (verificationStatus === "PENDING") {
        return renderPendingVerification();
    }

    if (verificationStatus === "REJECTED") {
        return renderRejectedVerification();
    }

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