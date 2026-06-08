"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { BloodCenterSidebar } from "./components/sidebar";
import { CenterProfileCard } from "./components/center-profile-card";
import { WelcomeCard } from "./components/welcome-card";
import { QuickActions } from "./components/quick-actions";
import { RecentDonations } from "./components/recent-donations";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Clock, CheckCircle, XCircle, AlertTriangle, Mail, Building2, Loader2 } from "lucide-react";

interface Donation {
    donationId: number;
    donorName: string;
    donationDate: string;
    status: string;
    bloodType?: string;
}

interface BloodCenterData {
    bloodCenterId: number;
    name: string;
    city: string;
    verificationStatus?: string;
    rejectionReason?: string;
}

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

export default function BloodCenterDashboard() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const userIdFromUrl = searchParams.get('userId');

    const [bloodCenterId, setBloodCenterId] = useState<number | null>(null);
    const [centerData, setCenterData] = useState<BloodCenterData | null>(null);
    const [recentDonations, setRecentDonations] = useState<Donation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthChecking, setIsAuthChecking] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);
    const [todayDonations, setTodayDonations] = useState<number>(0);
    const [pendingRequests, setPendingRequests] = useState<number>(0);
    const [verificationStatus, setVerificationStatus] = useState<string | null>(null);
    const [rejectionReason, setRejectionReason] = useState<string | null>(null);

    useEffect(() => {
        const checkAuth = () => {
            const token = localStorage.getItem('token');
            if (!token) {
                router.push('/auth/login');
                return;
            }

            let finalUserId = userIdFromUrl;
            if (!finalUserId || finalUserId === 'null') {
                const userStr = localStorage.getItem('user');
                if (userStr) {
                    try {
                        const user = JSON.parse(userStr);
                        finalUserId = user.userId?.toString() || user.id?.toString();
                    } catch (e) {
                        console.error("Error parsing user from localStorage", e);
                    }
                }
            }

            if (!finalUserId || finalUserId === 'null') {
                setIsLoading(false);
                setIsAuthChecking(false);
                return;
            }

            setUserId(finalUserId);
            setIsAuthChecking(false);
        };

        checkAuth();
    }, [userIdFromUrl, router]);

    useEffect(() => {
        const fetchBloodCenterByUserId = async () => {
            if (isAuthChecking) return;
            if (!userId) {
                setIsLoading(false);
                return;
            }

            try {
                const headers = getAuthHeaders();
                if (!headers) {
                    router.push('/auth/login');
                    return;
                }

                const res = await fetch(`http://localhost:8080/blood-centers/by-user/${userId}`, {
                    method: 'GET',
                    headers: headers
                });

                if (res.status === 403) {
                    setVerificationStatus("PENDING");
                    setIsLoading(false);
                    setIsAuthChecking(false);
                    return;
                }

                if (res.status === 401) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    router.push('/auth/login');
                    return;
                }

                if (res.ok) {
                    const data = await res.json();
                    setBloodCenterId(data.bloodCenterId);
                    setCenterData(data);
                    setVerificationStatus(data.verificationStatus || "APPROVED");
                    setRejectionReason(data.rejectionReason || null);
                } else {
                    console.error(`Failed to fetch blood center: ${res.status}`);
                    setIsLoading(false);
                }
            } catch (error) {
                console.error("Error fetching blood center:", error);
                setIsLoading(false);
            }
        };

        fetchBloodCenterByUserId();
    }, [userId, isAuthChecking, router]);

    useEffect(() => {
        const fetchCenterData = async () => {
            if (!bloodCenterId || verificationStatus !== "APPROVED") return;

            try {
                const headers = getAuthHeaders();
                if (!headers) {
                    router.push('/auth/login');
                    return;
                }

                const donationsRes = await fetch(`http://localhost:8080/donations/bloodcenter/${bloodCenterId}`, {
                    method: 'GET',
                    headers: headers
                });

                if (donationsRes.ok) {
                    const allDonations = await donationsRes.json();
                    setRecentDonations(allDonations.slice(0, 5));
                }
            } catch (error) {
                console.error("Error fetching center data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCenterData();
    }, [bloodCenterId, verificationStatus, router]);

    const fetchTodayStats = useCallback(async () => {
        if (!bloodCenterId || verificationStatus !== "APPROVED") return;

        try {
            const headers = getAuthHeaders();
            if (!headers) return;
            const today = new Date().toISOString().split('T')[0];
            const donationsRes = await fetch(
                `http://localhost:8080/donations/bloodcenter/${bloodCenterId}/date?date=${today}`,
                { headers: headers }
            );
            if (donationsRes.ok) {
                const donations = await donationsRes.json();
                setTodayDonations(donations.length || 0);
            }
            const requestsRes = await fetch(
                `http://localhost:8080/blood-requests/bloodcenter/${bloodCenterId}/pending/count`,
                { headers: headers }
            );
            if (requestsRes.ok) {
                const count = await requestsRes.json();
                setPendingRequests(count);
            }
        } catch (error) {
            console.error("Error fetching today stats:", error);
        }
    }, [bloodCenterId, verificationStatus]);

    useEffect(() => {
        if (bloodCenterId && verificationStatus === "APPROVED") {
            fetchTodayStats();
        }
    }, [bloodCenterId, verificationStatus, fetchTodayStats]);

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
                            <p className="text-amber-700">All blood centers must have their license verified before accessing the system. This ensures compliance with medical regulations.</p>
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
                                <li>• After approval, you can manage blood inventory</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3">
                    <Button
                        onClick={() => router.push('/auth/login')}
                        variant="outline"
                        className="flex-1 border-amber-300 text-amber-700 hover:bg-amber-50"
                    >
                        Back to Login
                    </Button>
                    <Button
                        onClick={() => window.location.reload()}
                        className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white"
                    >
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
                    <Button
                        onClick={() => router.push('/auth/login')}
                        className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white"
                    >
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

    if (isAuthChecking || isLoading) {
        return (
            <div className="min-h-screen bg-background">
                <main className="ml-20 lg:ml-64 p-6 flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
                        <p className="text-muted-foreground">Loading dashboard...</p>
                    </div>
                </main>
            </div>
        );
    }

    if (!userId || !bloodCenterId) {
        return (
            <div className="min-h-screen bg-background">
                <main className="ml-20 lg:ml-64 p-6 text-center min-h-screen">
                    <p className="text-destructive mb-4">Access Denied. Please login again.</p>
                    <button
                        onClick={() => {
                            localStorage.removeItem('token');
                            localStorage.removeItem('user');
                            router.push('/auth/login');
                        }}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
                    >
                        Go to Login
                    </button>
                </main>
            </div>
        );
    }

    const showSuccessBanner = verificationStatus === "APPROVED" && centerData?.verificationStatus === "APPROVED";

    return (
        <>
            <BloodCenterSidebar userId={userId} />
            <main className="ml-20 lg:ml-64 p-6 lg:p-8 min-h-screen overflow-auto">
                <header className="flex items-start justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold">Dashboard</h1>
                        <p className="text-muted-foreground">Welcome back to your blood center dashboard</p>
                    </div>
                    <CenterProfileCard userId={userId} />
                </header>


                <div className="space-y-6">
                    <WelcomeCard
                        centerName={centerData?.name}
                        location={centerData?.city}
                        todayDonations={todayDonations}
                        pendingRequests={pendingRequests}
                    />
                    <QuickActions />
                    <RecentDonations donations={recentDonations} />
                </div>
            </main>
        </>
    );
}