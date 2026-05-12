"use client";

import { Card } from "@/components/ui/card";
import { Users, Droplet, Building2, FileCheck, Clock, Activity } from "lucide-react";

interface StatsCardsProps {
    stats: {
        totalUsers: number;
        totalDonors: number;
        totalBloodCenters: number;
        totalMedicalCenters: number;
        pendingBloodCenters: number;
        pendingMedicalCenters: number;
        totalDonations: number;
        totalBloodRequests: number;
        pendingRequests: number;
    };
}

export function StatsCards({ stats }: StatsCardsProps) {
    const cards = [
        {
            title: "Total Users",
            value: stats.totalUsers,
            icon: Users,
            color: "bg-blue-100 text-blue-600",
        },
        {
            title: "Donors",
            value: stats.totalDonors,
            icon: Droplet,
            color: "bg-red-100 text-red-600",
        },
        {
            title: "Blood Centers",
            value: stats.totalBloodCenters,
            icon: Building2,
            color: "bg-green-100 text-green-600",
        },
        {
            title: "Medical Centers",
            value: stats.totalMedicalCenters,
            icon: Building2,
            color: "bg-purple-100 text-purple-600",
        },
        {
            title: "Pending BC",
            value: stats.pendingBloodCenters,
            icon: Clock,
            color: "bg-yellow-100 text-yellow-600",
        },
        {
            title: "Pending MC",
            value: stats.pendingMedicalCenters,
            icon: Clock,
            color: "bg-orange-100 text-orange-600",
        },
        {
            title: "Total Donations",
            value: stats.totalDonations,
            icon: Droplet,
            color: "bg-pink-100 text-pink-600",
        },
        {
            title: "Pending Requests",
            value: stats.pendingRequests,
            icon: Activity,
            color: "bg-red-100 text-red-600",
        },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {cards.map((card) => {
                const Icon = card.icon;
                return (
                    <Card key={card.title} className="p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">{card.title}</p>
                                <p className="text-2xl font-bold text-foreground mt-1">{card.value}</p>
                            </div>
                            <div className={`w-12 h-12 rounded-xl ${card.color} flex items-center justify-center`}>
                                <Icon className="w-6 h-6" />
                            </div>
                        </div>
                    </Card>
                );
            })}
        </div>
    );
}