"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Droplet, Calendar, MapPin, FileText, Clock, XCircle, CheckCircle, ChevronRight, Filter, Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Sidebar } from "../components/sidebar";
import { ProfileCard } from "@/app/dashboard/for-donor/components/profile-card";
import { AiChatBot } from "../components/AiChatBot";
import { DonorContextProvider, useDonorContext } from "../components/DonorContextProvider";

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

// Внутренний компонент с контентом страницы
function DonationHistoryContent() {
    const [donations, setDonations] = useState<Donation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const searchParams = useSearchParams();
    const userId = searchParams.get('userId') || searchParams.get('id');
    const { donorData } = useDonorContext();

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

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/auth/login';
            return;
        }

        let finalUserId = userId;
        if (!finalUserId || finalUserId === 'null') {
            const storedId = localStorage.getItem('userId');
            if (storedId && storedId !== 'null') {
                finalUserId = storedId;
            }
        }

        if (finalUserId && finalUserId !== 'null') {
            fetchDonations(finalUserId);
            localStorage.setItem('userId', finalUserId);
        } else {
            setIsLoading(false);
            setError("No user ID found");
        }
    }, [userId]);

    const fetchDonations = async (id: string) => {
        try {
            setError(null);
            const headers = getAuthHeaders();
            if (!headers) {
                window.location.href = '/auth/login';
                return;
            }

            const response = await fetch(`http://localhost:8080/donations/donor/${id}`, {
                method: 'GET',
                headers: headers
            });

            if (response.status === 401 || response.status === 403) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                localStorage.removeItem('userId');
                window.location.href = '/auth/login';
                return;
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const text = await response.text();

            if (!text || text.trim() === "") {
                throw new Error("Server returned empty response");
            }

            const data = JSON.parse(text);
            setDonations(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error fetching donations:", error);
            setError(error instanceof Error ? error.message : "Failed to fetch donations");
            setDonations([]);
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusConfig = (status: string) => {
        switch(status?.toUpperCase()) {
            case 'COMPLETED':
                return {
                    text: 'Completed',
                    className: 'bg-chart-2/10 text-chart-2 border-chart-2/20',
                    icon: <CheckCircle className="w-3 h-3 mr-1" />
                };
            case 'SCHEDULED':
                return {
                    text: 'Scheduled',
                    className: 'bg-chart-2/10 text-chart-2 border-chart-2/20',
                    icon: <Calendar className="w-3 h-3 mr-1" />
                };
            case 'PENDING':
                return {
                    text: 'Pending',
                    className: 'bg-chart-2/10 text-chart-2 border-chart-2/20',
                    icon: <Clock className="w-3 h-3 mr-1" />
                };
            case 'CANCELLED':
                return {
                    text: 'Cancelled',
                    className: 'bg-chart-2/10 text-chart-2 border-chart-2/20',
                    icon: <XCircle className="w-3 h-3 mr-1" />
                };
            default:
                return {
                    text: status || 'Unknown',
                    className: 'bg-muted text-muted-foreground border-border',
                    icon: null
                };
        }
    };

    const getAvailableStatuses = () => {
        const statuses = new Set<string>();
        donations.forEach(donation => {
            if (donation.status) {
                statuses.add(donation.status.toUpperCase());
            }
        });
        return statuses;
    };

    const availableStatuses = getAvailableStatuses();
    const hasCompleted = availableStatuses.has('COMPLETED');
    const hasScheduled = availableStatuses.has('SCHEDULED');

    const filteredDonations = donations.filter(donation => {
        if (statusFilter === "all") return true;
        return donation.status?.toUpperCase() === statusFilter.toUpperCase();
    });

    if (isLoading) {
        return (
            <>
                <Sidebar />
                <main className="ml-20 lg:ml-64 p-6 flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
                        <p className="text-muted-foreground">Loading donation history...</p>
                    </div>
                </main>
            </>
        );
    }

    if (error) {
        return (
            <>
                <Sidebar />
                <main className="ml-20 lg:ml-64 p-6">
                    <Card className="p-12 text-center">
                        <div className="text-destructive mb-4">
                            <XCircle className="w-16 h-16 mx-auto" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Error Loading Donations</h3>
                        <p className="text-muted-foreground mb-4">{error}</p>
                        <button
                            onClick={() => userId && fetchDonations(userId)}
                            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                        >
                            Try Again
                        </button>
                    </Card>
                </main>
            </>
        );
    }

    if (!userId || userId === 'null') {
        return (
            <>
                <Sidebar />
                <main className="ml-20 lg:ml-64 p-6">
                    <Card className="p-6 text-center">
                        <p className="text-red-600">Access Denied: User ID not found</p>
                        <button
                            onClick={() => window.location.href = '/auth/login'}
                            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                        >
                            Go to Login
                        </button>
                    </Card>
                </main>
            </>
        );
    }

    return (
        <>
            <Sidebar />
            <main className="ml-20 lg:ml-64 p-6 lg:p-8 min-h-screen overflow-auto">
                <header className="flex items-start justify-between mb-8">
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold text-foreground">Donation History</h1>
                        <p className="text-muted-foreground mt-1">Track all your past and upcoming blood donations</p>
                    </div>
                    <ProfileCard userId={userId} showBookButton={false} />
                </header>
                {donations.length > 0 && (
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                        <div className="flex items-center gap-2">
                            <Filter className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">Filter:</span>
                            <div className="flex gap-2">
                                <Button
                                    variant={statusFilter === "all" ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setStatusFilter("all")}
                                    className="rounded-lg"
                                >
                                    All
                                </Button>

                                {hasCompleted && (
                                    <Button
                                        variant={statusFilter === "COMPLETED" ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setStatusFilter("COMPLETED")}
                                        className="rounded-lg"
                                    >
                                        Completed
                                    </Button>
                                )}

                                {hasScheduled && (
                                    <Button
                                        variant={statusFilter === "SCHEDULED" ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setStatusFilter("SCHEDULED")}
                                        className="rounded-lg"
                                    >
                                        Scheduled
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {donations.length === 0 ? (
                    <Card className="p-12 text-center">
                        <Droplet className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-xl font-semibold mb-2">No Donations Yet</h3>
                        <p className="text-muted-foreground">Your donation history will appear here</p>
                    </Card>
                ) : filteredDonations.length === 0 ? (
                    <Card className="p-12 text-center">
                        <p className="text-muted-foreground">No donations match the selected filter</p>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setStatusFilter("all")}
                            className="mt-4"
                        >
                            Show All
                        </Button>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {filteredDonations.map((donation) => {
                            const statusConfig = getStatusConfig(donation.status);
                            const isCompleted = donation.status === 'COMPLETED';
                            const isScheduled = donation.status === 'SCHEDULED';
                            const isCancelled = donation.status === 'CANCELLED';
                            const donationDate = new Date(donation.donationDate);

                            return (
                                <Card
                                    key={donation.donationId}
                                    className={`p-6 hover:shadow-md transition-shadow ${
                                        isCancelled ? 'bg-muted/40 opacity-75' : ''
                                    }`}
                                >
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                        <div className="flex items-start gap-4">
                                            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-primary/10">
                                                <Droplet className="w-6 h-6 text-primary" />
                                            </div>

                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Calendar className="w-4 h-4 text-destructive" />
                                                    <p className="font-semibold text-foreground">
                                                        {donationDate.toLocaleDateString('en-US', {
                                                            weekday: 'long',
                                                            year: 'numeric',
                                                            month: 'long',
                                                            day: 'numeric'
                                                        })}
                                                    </p>
                                                </div>

                                                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                                                    <Clock className="w-3 h-3 text-destructive" />
                                                    <span>
                                                        {donationDate.toLocaleTimeString('en-US', {
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <MapPin className="w-3 h-3 text-destructive" />
                                                    <span>{donation.bloodCenter?.name || 'Blood Center'}</span>
                                                </div>

                                                {donation.bloodCenter?.address && (
                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground pl-6">
                                                        <span>{donation.bloodCenter.address}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-end gap-2">
                                            <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center ${statusConfig.className}`}>
                                                {statusConfig.icon}
                                                {statusConfig.text}
                                            </div>

                                            {donation.hasAnalysis && isCompleted && (
                                                <div className="flex items-center gap-1 text-xs text-chart-2">
                                                    <FileText className="w-3 h-3" />
                                                    <span>Analysis Available</span>
                                                </div>
                                            )}

                                            {isScheduled && (
                                                <Button
                                                    variant="link"
                                                    size="sm"
                                                    className="text-primary h-auto p-0 text-xs"
                                                    asChild
                                                >
                                                    <Link href={`/dashboard/for-donor/appointments?userId=${userId}`}>
                                                        View Details
                                                        <ChevronRight className="w-3 h-3 ml-1" />
                                                    </Link>
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </main>
            <AiChatBot userId={userId} donorContext={donorData} />
        </>
    );
}

// Основной компонент с провайдером
export default function DonationHistoryPage() {
    const searchParams = useSearchParams();
    const userId = searchParams.get('userId') || searchParams.get('id') || (typeof window !== 'undefined' ? localStorage.getItem('userId') : null);

    return (
        <div className="min-h-screen bg-background">
            <DonorContextProvider userId={userId}>
                <DonationHistoryContent />
            </DonorContextProvider>
        </div>
    );
}