"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { BloodCenterSidebar } from "../components/sidebar";
import { CenterProfileCard } from "../components/center-profile-card";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Building2, Clock, Droplet, AlertCircle } from "lucide-react";

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
    bloodCenter?: { bloodCenterId: number }; // Добавляем поле для проверки
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

    // Получаем центр крови по userId
    useEffect(() => {
        const fetchCenter = async () => {
            if (!userId) return;
            try {
                setError(null);
                const res = await fetch(`http://localhost:8080/blood-centers/by-user/${userId}`);
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
        fetchCenter();
    }, [userId]);

    // Получаем заявки по bloodCenterId
    useEffect(() => {
        const fetchRequests = async () => {
            if (!bloodCenterId) return;
            try {
                setIsLoading(true);
                setError(null);
                console.log(`Fetching requests for blood center: ${bloodCenterId}`);

                const res = await fetch(`http://localhost:8080/blood-requests/bloodcenter/${bloodCenterId}`);

                if (res.ok) {
                    const data = await res.json();
                    console.log("Received requests:", data);

                    // Проверяем, есть ли у заявок привязанный bloodCenter
                    if (data.length === 0) {
                        console.log("No requests found for this blood center");
                    } else {
                        // Выводим информацию для отладки
                        data.forEach((req: BloodRequest) => {
                            console.log(`Request ${req.bloodRequestId}: bloodCenterId = ${req.bloodCenter?.bloodCenterId}`);
                        });
                    }

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

    if (!userId) {
        return <div className="flex"><BloodCenterSidebar userId={userId} /><main className="flex-1 p-6">Access Denied</main></div>;
    }

    return (
        <div className="flex min-h-screen bg-background">
            <BloodCenterSidebar userId={userId} />
            <main className="flex-1 p-6 lg:p-8 overflow-auto">
                <header className="flex justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold">Blood Requests</h1>
                        <p className="text-muted-foreground">Manage incoming requests</p>
                        {bloodCenterId && <p className="text-sm text-muted-foreground mt-1">Blood Center ID: {bloodCenterId}</p>}
                    </div>
                    <CenterProfileCard name="City Blood Center" city="Almaty" />
                </header>

                {error && (
                    <Card className="p-4 mb-6 bg-red-50 border-red-200">
                        <div className="flex items-center gap-2 text-red-600">
                            <AlertCircle className="w-5 h-5" />
                            <span>{error}</span>
                        </div>
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
                    <div className="flex justify-center items-center h-64">
                        <p>Loading requests...</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <Card className="p-12 text-center text-muted-foreground">
                        <Droplet className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p className="text-lg">No blood requests found</p>
                        <p className="text-sm">When hospitals request blood, they will appear here</p>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {filtered.map(req => (
                            <Card key={req.bloodRequestId} className="p-4 hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-start gap-4">
                                        <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                                            <Droplet className="w-7 h-7 text-primary" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                                <h3 className="font-semibold text-lg">
                                                    {req.bloodGroup}{req.rhesusFactor} - {req.componentType}
                                                </h3>
                                                <Badge variant="outline" className={statusColors[req.status]}>
                                                    {req.status}
                                                </Badge>
                                            </div>
                                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
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
                                                <p className="text-sm text-muted-foreground mt-2">
                                                    Note: {req.comment}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}