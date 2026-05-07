"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { BloodCenterSidebar } from "../components/sidebar";
import { CenterProfileCard } from "../components/center-profile-card";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {Search, User, Calendar, Droplet, Loader2, AlertCircle} from "lucide-react";

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

interface Donation {
    donationId: number;
    donor: { donorId: number; firstName?: string; lastName?: string };
    donationDate: string;
    status: string;
    analysis?: { bloodGroup?: string; rhesusFactor?: string };
}

const statusColors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    SCHEDULED: "bg-blue-100 text-blue-800",
    IN_PROGRESS: "bg-purple-100 text-purple-800",
    COMPLETED: "bg-green-100 text-green-800",
    AWAITING_ANALYSIS: "bg-orange-100 text-orange-800",
    FINALIZED: "bg-gray-100 text-gray-800",
};

const statusLabels: Record<string, string> = {
    PENDING: "Pending",
    SCHEDULED: "Scheduled",
    IN_PROGRESS: "In Progress",
    COMPLETED: "Completed",
    AWAITING_ANALYSIS: "Awaiting Analysis",
    FINALIZED: "Finalized",
};

export default function DonationsPage() {
    const searchParams = useSearchParams();
    const userId = searchParams.get('userId');
    const [bloodCenterId, setBloodCenterId] = useState<number | null>(null);
    const [donations, setDonations] = useState<Donation[]>([]);
    const [filtered, setFiltered] = useState<Donation[]>([]);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
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
        const fetchDonations = async () => {
            if (!bloodCenterId) return;
            try {
                setIsLoading(true);
                setError(null);
                const headers = getAuthHeaders();
                if (!headers) {
                    window.location.href = '/auth/login';
                    return;
                }
                console.log(`Fetching donations for bloodCenterId: ${bloodCenterId}`);
                const res = await fetch(`http://localhost:8080/donations/bloodcenter/${bloodCenterId}`, {
                    headers: headers
                });
                if (checkAuthAndRedirect(res)) return;
                if (res.ok) {
                    const data = await res.json();
                    console.log("Donations data received:", data);
                    setDonations(data);
                    setFiltered(data);
                } else {
                    setError(`Failed to fetch donations: ${res.status}`);
                }
            } catch (err) {
                console.error("Error fetching donations:", err);
                setError(`Network error: ${err instanceof Error ? err.message : 'Unknown error'}`);
            } finally {
                setIsLoading(false);
            }
        };
        fetchDonations();
    }, [bloodCenterId]);

    useEffect(() => {
        let result = donations;
        if (search) {
            const searchLower = search.toLowerCase();
            result = result.filter(d =>
                (d.donor?.firstName?.toLowerCase().includes(searchLower) ||
                    d.donor?.lastName?.toLowerCase().includes(searchLower))
            );
        }
        if (statusFilter !== "ALL") {
            result = result.filter(d => d.status === statusFilter);
        }
        setFiltered(result);
    }, [search, statusFilter, donations]);

    const formatDate = (dateStr: string) => {
        try {
            return new Date(dateStr).toLocaleString();
        } catch {
            return "Invalid date";
        }
    };

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
                        <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
                        <p className="text-muted-foreground">Loading donations...</p>
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
                        <h1 className="text-3xl font-bold">Donations</h1>
                        <p className="text-muted-foreground">Manage donations</p>
                    </div>
                    <CenterProfileCard userId={userId} />
                </header>

                {error && (
                    <Card className="p-4 mb-6 bg-red-50 border-red-200">
                        <div className="flex items-center gap-2 text-red-600">
                            <AlertCircle className="w-5 h-5" />
                            <span>{error}</span>
                        </div>
                        <button
                            onClick={() => {
                                setError(null);
                                if (bloodCenterId) {
                                    const fetchDonations = async () => {
                                        const headers = getAuthHeaders();
                                        if (headers) {
                                            const res = await fetch(`http://localhost:8080/donations/bloodcenter/${bloodCenterId}`, {
                                                headers: headers
                                            });
                                            if (res.ok) {
                                                const data = await res.json();
                                                setDonations(data);
                                                setFiltered(data);
                                            }
                                        }
                                    };
                                    fetchDonations();
                                }
                            }}
                            className="mt-2 px-3 py-1 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90"
                        >
                            Retry
                        </button>
                    </Card>
                )}

                <Card className="p-4 mb-6">
                    <div className="flex gap-4 flex-wrap">
                        <div className="flex-1 min-w-64 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Search donor..."
                                className="pl-10"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-48">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">All</SelectItem>
                                {Object.keys(statusLabels).map(s => (
                                    <SelectItem key={s} value={s}>{statusLabels[s]}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </Card>

                {filtered.length === 0 ? (
                    <Card className="p-12 text-center">
                        <Droplet className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-xl font-semibold mb-2">No Donations Found</h3>
                        <p className="text-muted-foreground">
                            {donations.length === 0
                                ? "No donations have been recorded yet"
                                : "No donations match your search criteria"}
                        </p>
                        {donations.length > 0 && (search || statusFilter !== "ALL") && (
                            <button
                                onClick={() => {
                                    setSearch("");
                                    setStatusFilter("ALL");
                                }}
                                className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                            >
                                Clear Filters
                            </button>
                        )}
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {filtered.map(d => (
                            <Card key={d.donationId} className="p-4 hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                            <User className="w-6 h-6 text-primary" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className="font-semibold">
                                                    {d.donor?.firstName} {d.donor?.lastName}
                                                </h3>
                                                <Badge variant="outline" className={statusColors[d.status]}>
                                                    {statusLabels[d.status] || d.status}
                                                </Badge>
                                            </div>
                                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mt-1">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-4 h-4" />
                                                    {formatDate(d.donationDate)}
                                                </span>
                                                {d.analysis?.bloodGroup && (
                                                    <span className="flex items-center gap-1">
                                                        <Droplet className="w-4 h-4 text-red-500" />
                                                        {d.analysis.bloodGroup}{d.analysis.rhesusFactor}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </main>
        </>
    );
}