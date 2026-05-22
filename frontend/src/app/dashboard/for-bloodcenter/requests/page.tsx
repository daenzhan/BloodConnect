"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { BloodCenterSidebar } from "../components/sidebar";
import { CenterProfileCard } from "../components/center-profile-card";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Building2, Clock, Droplet, AlertCircle, CheckCircle, XCircle } from "lucide-react";

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

interface BloodRequest {
    bloodRequestId: number;
    componentType: string;
    bloodGroup: string;
    rhesusFactor: string;
    volume: string;
    deadline: string;
    status: string;
    comment: string;
    medCenter: { name: string };
    bloodCenter?: { bloodCenterId: number };
}

const statusColors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    APPROVED: "bg-green-100 text-green-800",
    REJECTED: "bg-red-100 text-red-800",
    IN_PROGRESS: "bg-blue-100 text-blue-800",
    COMPLETED: "bg-gray-100 text-gray-800",
};

export default function BloodRequestsPage() {
    const searchParams = useSearchParams();
    const userId = searchParams.get('userId');
    const [bloodCenterId, setBloodCenterId] = useState<number | null>(null);
    const [requests, setRequests] = useState<BloodRequest[]>([]);
    const [filtered, setFiltered] = useState<BloodRequest[]>([]);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [executingRequestId, setExecutingRequestId] = useState<number | null>(null);
    const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<BloodRequest | null>(null);
    const [availabilityData, setAvailabilityData] = useState<any>(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successData, setSuccessData] = useState<any>(null);

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
                const res = await fetch(`http://localhost:8080/blood-centers/by-user/${userId}`, {
                    headers: headers
                });
                if (checkAuthAndRedirect(res)) return;
                if (res.ok) {
                    const data = await res.json();
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
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/auth/login';
            return;
        }
        fetchCenter();
    }, [userId]);

    const refreshRequests = async () => {
        if (!bloodCenterId) return;
        try {
            const headers = getAuthHeaders();
            if (!headers) return;

            const res = await fetch(`http://localhost:8080/blood-requests/bloodcenter/${bloodCenterId}`, {
                headers: headers
            });
            if (res.ok) {
                const data = await res.json();
                setRequests(data);
                setFiltered(data);
            }
        } catch (err) {
            console.error("Error refreshing:", err);
        }
    };

    useEffect(() => {
        const fetchRequests = async () => {
            if (!bloodCenterId) return;
            try {
                setIsLoading(true);
                setError(null);
                console.log(`Fetching requests for blood center: ${bloodCenterId}`);

                const headers = getAuthHeaders();
                if (!headers) {
                    window.location.href = '/auth/login';
                    return;
                }

                const res = await fetch(`http://localhost:8080/blood-requests/bloodcenter/${bloodCenterId}`, {
                    headers: headers
                });

                if (checkAuthAndRedirect(res)) return;

                if (res.ok) {
                    const data = await res.json();
                    console.log("Received requests:", data);
                    setRequests(data);
                    setFiltered(data);
                } else {
                    const errorText = await res.text();
                    console.error("Failed to fetch requests:", res.status, errorText);
                    setError(`Failed to fetch requests: ${res.status}`);
                }
            } catch (err) {
                console.error("Error fetching requests:", err);
                setError(`Network error: ${err instanceof Error ? err.message : 'Unknown error'}`);
            } finally {
                setIsLoading(false);
            }
        };

        fetchRequests();
    }, [bloodCenterId]);

    useEffect(() => {
        let result = requests;
        if (search) {
            result = result.filter(r =>
                r.medCenter?.name?.toLowerCase().includes(search.toLowerCase()) ||
                r.componentType.toLowerCase().includes(search.toLowerCase()) ||
                r.bloodGroup.toLowerCase().includes(search.toLowerCase())
            );
        }
        if (statusFilter !== "ALL") {
            result = result.filter(r => r.status === statusFilter);
        }
        setFiltered(result);
    }, [search, statusFilter, requests]);

    const formatDeadline = (deadline: string) => {
        if (!deadline) return "No deadline";
        try {
            const date = new Date(deadline);
            const daysLeft = Math.ceil((date.getTime() - Date.now()) / (1000 * 3600 * 24));
            if (daysLeft < 0) return "Overdue";
            if (daysLeft === 0) return "Today";
            return `${daysLeft} days left`;
        } catch {
            return "Invalid date";
        }
    };

    const checkAvailability = async (request: BloodRequest) => {
        setSelectedRequest(request);
        try {
            const headers = getAuthHeaders();
            if (!headers) return;

            const res = await fetch(`http://localhost:8080/blood-requests/${request.bloodRequestId}/check-availability`, {
                headers: headers
            });

            if (checkAuthAndRedirect(res)) return;

            if (res.ok) {
                const data = await res.json();
                setAvailabilityData(data);
                setShowAvailabilityModal(true);
            } else {
                const error = await res.json();
                alert(`Failed to check availability: ${error.error || 'Unknown error'}`);
            }
        } catch (err) {
            console.error("Error checking availability:", err);
            alert("Network error while checking availability");
        }
    };

    const executeRequest = async (requestId: number) => {
        setExecutingRequestId(requestId);
        try {
            const headers = getAuthHeaders();
            if (!headers) return;

            const res = await fetch(`http://localhost:8080/blood-requests/${requestId}/execute`, {
                method: 'POST',
                headers: headers
            });

            if (checkAuthAndRedirect(res)) return;

            if (res.ok) {
                const data = await res.json();
                setSuccessData(data);
                setShowSuccessModal(true);
                setShowAvailabilityModal(false);
                setTimeout(() => {
                    refreshRequests();
                }, 2000);
            } else {
                const error = await res.json();
                alert(`Failed to execute: ${error.error || 'Unknown error'}`);
            }
        } catch (err) {
            console.error("Error executing request:", err);
            alert("Network error while executing request");
        } finally {
            setExecutingRequestId(null);
        }
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/auth/login';
        }
    }, []);

    if (!userId) {
        return <div className="flex"><BloodCenterSidebar userId={userId} /><main className="flex-1 p-6">Access Denied</main></div>;
    }

    return (
        <>
            <BloodCenterSidebar userId={userId} />
            <main className="ml-20 lg:ml-64 p-6 lg:p-8 min-h-screen overflow-auto">
                <header className="flex justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold">Blood Requests</h1>
                        <p className="text-muted-foreground">Manage incoming requests from hospitals</p>
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
                                    refreshRequests();
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
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Search hospital, component or blood group..."
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
                                <SelectItem value="ALL">All Statuses</SelectItem>
                                {Object.keys(statusColors).map(s => (
                                    <SelectItem key={s} value={s}>{s}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </Card>

                {isLoading ? (
                    <Card className="p-12 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                        <p className="mt-4 text-muted-foreground">Loading requests...</p>
                    </Card>
                ) : filtered.length === 0 ? (
                    <Card className="p-12 text-center text-muted-foreground">
                        <Droplet className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-semibold">No blood requests found</p>
                        <p className="text-sm">When hospitals request blood, they will appear here</p>
                        {(search || statusFilter !== "ALL") && (
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
                        {filtered.map(req => (
                            <Card key={req.bloodRequestId} className="p-4 hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-start gap-4 flex-1">
                                        <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                                            <Droplet className="w-7 h-7 text-primary" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                                <h3 className="font-semibold text-lg">
                                                    {req.bloodGroup}{req.rhesusFactor === "POSITIVE" ? "+" : req.rhesusFactor === "NEGATIVE" ? "-" : req.rhesusFactor} - {req.componentType}
                                                </h3>
                                                <Badge variant="outline" className={statusColors[req.status]}>
                                                    {req.status}
                                                </Badge>
                                            </div>
                                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-2">
                                                <span className="flex items-center gap-1">
                                                    <Building2 className="w-4 h-4" />
                                                    {req.medCenter?.name || "Unknown Hospital"}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-4 h-4" />
                                                    {formatDeadline(req.deadline)}
                                                </span>
                                                <span>Volume: {req.volume}</span>
                                            </div>
                                            {req.comment && (
                                                <p className="text-sm text-muted-foreground">
                                                    Note: {req.comment}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-2 ml-4">
                                        {req.status === "PENDING" && (
                                            <>
                                                <button
                                                    onClick={() => checkAvailability(req)}
                                                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                                                >
                                                    Check Availability
                                                </button>
                                                <button
                                                    onClick={() => executeRequest(req.bloodRequestId)}
                                                    disabled={executingRequestId === req.bloodRequestId}
                                                    className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                >
                                                    {executingRequestId === req.bloodRequestId ? "Executing..." : "Execute"}
                                                </button>
                                            </>
                                        )}
                                        {req.status === "COMPLETED" && (
                                            <div className="flex items-center gap-1 text-green-600">
                                                <CheckCircle className="w-5 h-5" />
                                                <span className="text-sm">Completed</span>
                                            </div>
                                        )}
                                        {req.status === "REJECTED" && (
                                            <div className="flex items-center gap-1 text-red-600">
                                                <XCircle className="w-5 h-5" />
                                                <span className="text-sm">Rejected</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </main>

            {/* Модальное окно проверки доступности */}
            {showAvailabilityModal && availabilityData && selectedRequest && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowAvailabilityModal(false)}>
                    <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <h2 className="text-xl font-bold mb-4">Blood Availability Check</h2>

                        <div className="space-y-3 mb-6">
                            <div className="flex justify-between pb-2 border-b">
                                <span className="font-medium">Request:</span>
                                <span>{selectedRequest.bloodGroup}{selectedRequest.rhesusFactor === "POSITIVE" ? "+" : "-"} - {selectedRequest.componentType}</span>
                            </div>
                            <div className="flex justify-between pb-2 border-b">
                                <span className="font-medium">Requested Volume:</span>
                                <span>{availabilityData.requestedVolume} ml</span>
                            </div>
                            <div className="flex justify-between pb-2 border-b">
                                <span className="font-medium">Available Volume:</span>
                                <span className={availabilityData.totalAvailable >= availabilityData.requestedVolume ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
                                    {availabilityData.totalAvailable} ml
                                </span>
                            </div>
                            <div className="flex justify-between pb-2 border-b">
                                <span className="font-medium">Can Fulfill:</span>
                                <span className={availabilityData.isFulfillable ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
                                    {availabilityData.isFulfillable ? "Yes" : "No"}
                                </span>
                            </div>
                            <div className="flex justify-between pb-2 border-b">
                                <span className="font-medium">Available Units:</span>
                                <span>{availabilityData.availableReservesCount}</span>
                            </div>

                            {availabilityData.reserves?.length > 0 && (
                                <div className="mt-4">
                                    <p className="font-medium mb-2">Available Reserves:</p>
                                    <div className="space-y-2 max-h-48 overflow-y-auto">
                                        {availabilityData.reserves.map((reserve: any) => (
                                            <div key={reserve.reserveId} className="text-sm p-2 bg-gray-50 rounded border">
                                                <div className="flex justify-between">
                                                    <span className="font-medium">Unit #{reserve.reserveId}:</span>
                                                    <span>{reserve.quantity} ml</span>
                                                </div>
                                                <div className="text-gray-500 text-xs mt-1">
                                                    Expires in: {reserve.daysUntilExpiration} days
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3">
                            {availabilityData.isFulfillable && selectedRequest.status === "PENDING" && (
                                <button
                                    onClick={() => executeRequest(selectedRequest.bloodRequestId)}
                                    disabled={executingRequestId === selectedRequest.bloodRequestId}
                                    className="flex-1 bg-green-600 text-white py-2 rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
                                >
                                    {executingRequestId === selectedRequest.bloodRequestId ? "Executing..." : "Execute Request"}
                                </button>
                            )}
                            <button
                                onClick={() => setShowAvailabilityModal(false)}
                                className="flex-1 border py-2 rounded-md hover:bg-gray-50 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Модальное окно успешного выполнения */}
            {showSuccessModal && successData && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowSuccessModal(false)}>
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
                        <div className="text-center">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="w-8 h-8 text-green-600" />
                            </div>
                            <h2 className="text-xl font-bold mb-2">Request Executed Successfully!</h2>
                            <p className="text-gray-600 mb-4">
                                Blood has been allocated to the hospital.
                            </p>
                            <div className="bg-gray-50 rounded-lg p-4 mb-4 text-left">
                                <div className="flex justify-between mb-2">
                                    <span className="font-medium">Fulfilled Volume:</span>
                                    <span>{successData.fulfilledVolume} ml</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-medium">Reserves Used:</span>
                                    <span>{successData.reservesUsed} unit(s)</span>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    setShowSuccessModal(false);
                                    refreshRequests();
                                }}
                                className="w-full bg-primary text-white py-2 rounded-md hover:bg-primary/90 transition-colors"
                            >
                                OK
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}