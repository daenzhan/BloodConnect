"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { BloodCenterSidebar } from "./components/sidebar";
import { CenterProfileCard } from "./components/center-profile-card";
import { WelcomeCard } from "./components/welcome-card";
import { QuickActions } from "./components/quick-actions";
import { BloodReserveOverview } from "./components/blood-reserve-overview";
import { RecentDonations } from "./components/recent-donations";

interface BloodReserveItem {
    bloodGroup: string;
    rhesusFactor: string;
    quantity: number;
}

interface Donation {
    donationId: number;
    donorName: string;
    donationDate: string;
    status: string;
    bloodType?: string;
}

export default function BloodCenterDashboard() {
    const searchParams = useSearchParams();
    const userId = searchParams.get('userId');

    const [bloodCenterId, setBloodCenterId] = useState<number | null>(null);
    const [centerData, setCenterData] = useState<any>(null);
    const [reserves, setReserves] = useState<BloodReserveItem[]>([]);
    const [recentDonations, setRecentDonations] = useState<Donation[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchBloodCenterByUserId = async () => {
            if (!userId) {
                setIsLoading(false);
                return;
            }
            try {
                const res = await fetch(`http://localhost:8080/blood-centers/by-user/${userId}`);
                if (res.ok) {
                    const data = await res.json();
                    setBloodCenterId(data.bloodCenterId);
                    setCenterData(data);
                }
            } catch (error) {
                console.error(error);
            }
        };
        fetchBloodCenterByUserId();
    }, [userId]);

    useEffect(() => {
        const fetchCenterData = async () => {
            if (!bloodCenterId) return;
            try {
                const [reservesRes, donationsRes] = await Promise.all([
                    fetch(`http://localhost:8080/blood-centers/${bloodCenterId}/reserves`),
                    fetch(`http://localhost:8080/donations/bloodcenter/${bloodCenterId}`)
                ]);
                if (reservesRes.ok) setReserves(await reservesRes.json());
                if (donationsRes.ok) {
                    const allDonations = await donationsRes.json();
                    setRecentDonations(allDonations.slice(0, 5));
                }
            } catch (error) {
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchCenterData();
    }, [bloodCenterId]);

    if (isLoading) return <div className="flex min-h-screen bg-background"><BloodCenterSidebar userId={userId} /><main className="flex-1 p-6"><p>Loading...</p></main></div>;
    if (!userId || !bloodCenterId) return <div className="flex min-h-screen bg-background"><BloodCenterSidebar userId={userId} /><main className="flex-1 p-6 text-center">Access Denied</main></div>;

    return (
        <div className="flex min-h-screen bg-background">
            <BloodCenterSidebar userId={userId} />
            <main className="flex-1 p-6 lg:p-8 overflow-auto">
                <header className="flex items-start justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold">Dashboard</h1>
                        <p className="text-muted-foreground">Welcome back to your blood center dashboard</p>
                    </div>
                    <CenterProfileCard name={centerData?.name || "Blood Center"} city={centerData?.city || "City"} />
                </header>
                <div className="space-y-6">
                    <WelcomeCard centerName={centerData?.name} location={centerData?.city} todayDonations={5} pendingRequests={3} />
                    <QuickActions />
                    <BloodReserveOverview reserves={reserves} />
                    <RecentDonations donations={recentDonations} />
                </div>
            </main>
        </div>
    );
}