"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { BloodCenterSidebar } from "../components/sidebar";
import { CenterProfileCard } from "../components/center-profile-card";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Building2, Clock, Droplet } from "lucide-react";

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

    useEffect(() => {
        const fetchCenter = async () => {
            if (!userId) return;
            const res = await fetch(`http://localhost:8080/blood-centers/by-user/${userId}`);
            if (res.ok) {
                const data = await res.json();
                setBloodCenterId(data.bloodCenterId);
            }
        };
        fetchCenter();
    }, [userId]);

    useEffect(() => {
        const fetchRequests = async () => {
            if (!bloodCenterId) return;
            try {
                const res = await fetch(`http://localhost:8080/blood-requests/bloodcenter/${bloodCenterId}`);
                if (res.ok) {
                    const data = await res.json();
                    setRequests(data);
                    setFiltered(data);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchRequests();
    }, [bloodCenterId]);

    useEffect(() => {
        let result = requests;
        if (search) result = result.filter(r => r.medCenter?.name?.toLowerCase().includes(search.toLowerCase()) || r.componentType.toLowerCase().includes(search.toLowerCase()));
        if (statusFilter !== "ALL") result = result.filter(r => r.status === statusFilter);
        setFiltered(result);
    }, [search, statusFilter, requests]);

    const formatDeadline = (deadline: string) => {
        if (!deadline) return "No deadline";
        const date = new Date(deadline);
        const daysLeft = Math.ceil((date.getTime() - Date.now()) / (1000 * 3600 * 24));
        if (daysLeft < 0) return "Overdue";
        if (daysLeft === 0) return "Today";
        return `${daysLeft} days left`;
    };

    if (!userId) return <div className="flex"><BloodCenterSidebar userId={userId} /><main className="flex-1 p-6">Access Denied</main></div>;

    return (
        <div className="flex min-h-screen bg-background">
            <BloodCenterSidebar userId={userId} />
            <main className="flex-1 p-6 lg:p-8 overflow-auto">
                <header className="flex justify-between mb-8">
                    <div><h1 className="text-3xl font-bold">Blood Requests</h1><p className="text-muted-foreground">Manage incoming requests</p></div>
                    <CenterProfileCard name="City Blood Center" city="Almaty" />
                </header>
                <Card className="p-4 mb-6 flex gap-4 flex-wrap">
                    <div className="flex-1 relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" /><Input placeholder="Search hospital or component..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} /></div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-48"><SelectValue placeholder="Status" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All</SelectItem>
                            {Object.keys(statusColors).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </Card>
                {isLoading ? <p>Loading...</p> : (
                    <div className="space-y-4">
                        {filtered.map(req => (
                            <Card key={req.bloodRequestId} className="p-4">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center"><Droplet className="w-7 h-7 text-primary" /></div>
                                        <div>
                                            <div className="flex items-center gap-2"><h3 className="font-semibold">{req.bloodGroup}{req.rhesusFactor} - {req.componentType}</h3><Badge variant="outline" className={statusColors[req.status]}>{req.status}</Badge></div>
                                            <div className="flex gap-4 text-sm text-muted-foreground"><span className="flex items-center gap-1"><Building2 className="w-4 h-4" />{req.medCenter?.name}</span><span className="flex items-center gap-1"><Clock className="w-4 h-4" />{formatDeadline(req.deadline)}</span><span>Volume: {req.volume}</span></div>
                                            {req.comment && <p className="text-sm text-muted-foreground mt-1">Note: {req.comment}</p>}
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