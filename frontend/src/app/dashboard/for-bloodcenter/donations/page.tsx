"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { BloodCenterSidebar } from "../components/sidebar";
import { CenterProfileCard } from "../components/center-profile-card";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, User, Calendar, Droplet } from "lucide-react";

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
        const fetchDonations = async () => {
            if (!bloodCenterId) return;
            try {
                const res = await fetch(`http://localhost:8080/donations/bloodcenter/${bloodCenterId}`);
                if (res.ok) {
                    const data = await res.json();
                    setDonations(data);
                    setFiltered(data);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchDonations();
    }, [bloodCenterId]);

    useEffect(() => {
        let result = donations;
        if (search) {
            result = result.filter(d =>
                (d.donor?.firstName?.toLowerCase().includes(search.toLowerCase()) ||
                    d.donor?.lastName?.toLowerCase().includes(search.toLowerCase()))
            );
        }
        if (statusFilter !== "ALL") result = result.filter(d => d.status === statusFilter);
        setFiltered(result);
    }, [search, statusFilter, donations]);

    const formatDate = (dateStr: string) => new Date(dateStr).toLocaleString();

    if (!userId) return <div className="flex"><BloodCenterSidebar userId={userId} /><main className="flex-1 p-6">Access Denied</main></div>;

    return (
        <div className="flex min-h-screen bg-background">
            <BloodCenterSidebar userId={userId} />
            <main className="flex-1 p-6 lg:p-8 overflow-auto">
                <header className="flex justify-between mb-8">
                    <div><h1 className="text-3xl font-bold">Donations</h1><p className="text-muted-foreground">Manage donations</p></div>
                    <CenterProfileCard name="City Blood Center" city="Almaty" />
                </header>
                <Card className="p-4 mb-6 flex gap-4 flex-wrap">
                    <div className="flex-1 min-w-64 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input placeholder="Search donor..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-48"><SelectValue placeholder="Status" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All</SelectItem>
                            {Object.keys(statusLabels).map(s => <SelectItem key={s} value={s}>{statusLabels[s]}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </Card>
                {isLoading ? <p>Loading...</p> : (
                    <div className="space-y-4">
                        {filtered.map(d => (
                            <Card key={d.donationId} className="p-4">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center"><User className="w-6 h-6 text-primary" /></div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-semibold">{d.donor?.firstName} {d.donor?.lastName}</h3>
                                                <Badge variant="outline" className={statusColors[d.status]}>{statusLabels[d.status]}</Badge>
                                            </div>
                                            <div className="flex gap-4 text-sm text-muted-foreground">
                                                <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{formatDate(d.donationDate)}</span>
                                                {d.analysis?.bloodGroup && <span className="flex items-center gap-1"><Droplet className="w-4 h-4" />{d.analysis.bloodGroup}{d.analysis.rhesusFactor}</span>}
                                            </div>
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