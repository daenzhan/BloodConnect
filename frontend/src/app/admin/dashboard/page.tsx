"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { StatsCards } from "../components/stats-cards";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    LineChart,
    Line,
} from "recharts";

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

interface AdminStats {
    totalUsers: number;
    totalDonors: number;
    totalBloodCenters: number;
    totalMedicalCenters: number;
    pendingBloodCenters: number;
    pendingMedicalCenters: number;
    totalDonations: number;
    totalBloodRequests: number;
    pendingRequests: number;
    donationsByMonth: Record<string, number>;
}

export default function AdminDashboardPage() {
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/auth/login';
            return;
        }
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const headers = getAuthHeaders();
            if (!headers) {
                window.location.href = '/auth/login';
                return;
            }
            const response = await fetch('http://localhost:8080/admin/stats', {
                headers: headers,
            });
            if (response.status === 401 || response.status === 403) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/auth/login';
                return;
            }
            if (!response.ok) {
                throw new Error('Failed to fetch stats');
            }

            const data = await response.json();
            setStats(data);
        } catch (err) {
            console.error('Error fetching stats:', err);
            setError('Failed to load dashboard data');
        } finally {
            setIsLoading(false);
        }
    };

    const chartData = stats?.donationsByMonth
        ? Object.entries(stats.donationsByMonth).map(([month, count]) => ({
            month: month.slice(0, 3) + " " + month.slice(-4),
            donations: count,
        }))
        : [];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
            </div>
        );
    }

    if (error || !stats) {
        return (
            <div className="text-center py-12">
                <p className="text-red-600 mb-4">{error || "Failed to load dashboard"}</p>
                <button
                    onClick={fetchStats}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                >
                    Try Again
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
                <p className="text-muted-foreground mt-1">Overview of the BloodConnect system</p>
            </div>

            <StatsCards stats={stats} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6">
                    <h3 className="font-semibold text-foreground mb-4">Donations Trend</h3>
                    {chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="donations" fill="#b71234" name="Donations" />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-72 text-muted-foreground">
                            No data available
                        </div>
                    )}
                </Card>

                <Card className="p-6">
                    <h3 className="font-semibold text-foreground mb-4">Quick Actions</h3>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                            <div>
                                <p className="font-medium text-yellow-800">Pending Licenses</p>
                                <p className="text-sm text-yellow-600">
                                    Blood Centers: {stats.pendingBloodCenters} | Medical Centers: {stats.pendingMedicalCenters}
                                </p>
                            </div>
                            <button
                                onClick={() => window.location.href = '/admin/licenses'}
                                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                            >
                                Review
                            </button>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                            <div>
                                <p className="font-medium text-blue-800">Pending Blood Requests</p>
                                <p className="text-sm text-blue-600">{stats.pendingRequests} requests awaiting response</p>
                            </div>
                            <button
                                onClick={() => {}}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                View
                            </button>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                            <div>
                                <p className="font-medium text-green-800">Total Donations</p>
                                <p className="text-sm text-green-600">{stats.totalDonations} lives saved</p>
                            </div>
                            <button
                                onClick={() => window.location.href = '/admin/users'}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                            >
                                Manage
                            </button>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}