"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { BloodCenterSidebar } from "../components/sidebar";
import { CenterProfileCard } from "../components/center-profile-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Droplet, Edit2, Save, X, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";

interface BloodReserveItem {
    bloodGroup: string;
    rhesusFactor: string;
    quantity: number;
}

const bloodTypes = [
    { group: "A", rh: "+", label: "A+" }, { group: "A", rh: "-", label: "A-" },
    { group: "B", rh: "+", label: "B+" }, { group: "B", rh: "-", label: "B-" },
    { group: "AB", rh: "+", label: "AB+" }, { group: "AB", rh: "-", label: "AB-" },
    { group: "O", rh: "+", label: "O+" }, { group: "O", rh: "-", label: "O-" },
];

export default function BloodReservePage() {
    const searchParams = useSearchParams();
    const userId = searchParams.get('userId');
    const [bloodCenterId, setBloodCenterId] = useState<number | null>(null);
    const [reserves, setReserves] = useState<BloodReserveItem[]>([]);
    const [editingType, setEditingType] = useState<string | null>(null);
    const [editValue, setEditValue] = useState("");
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
        const fetchReserves = async () => {
            if (!bloodCenterId) return;
            try {
                const res = await fetch(`http://localhost:8080/blood-centers/${bloodCenterId}/reserves`);
                if (res.ok) {
                    const data = await res.json();
                    setReserves(data);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchReserves();
    }, [bloodCenterId]);

    const getQuantity = (group: string, rh: string) => {
        const r = reserves.find(r => r.bloodGroup === group && r.rhesusFactor === rh);
        return r?.quantity || 0;
    };

    const handleSave = async (group: string, rh: string) => {
        const newQty = parseInt(editValue);
        if (isNaN(newQty) || newQty < 0) { setEditingType(null); return; }
        try {
            const res = await fetch(`http://localhost:8080/blood-centers/${bloodCenterId}/reserves`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ bloodGroup: group, rhesusFactor: rh, quantity: newQty }),
            });
            if (res.ok) {
                setReserves(prev => prev.map(r => (r.bloodGroup === group && r.rhesusFactor === rh) ? { ...r, quantity: newQty } : r));
            }
        } catch (err) { console.error(err); }
        setEditingType(null);
    };

    const getStatus = (qty: number) => {
        if (qty <= 5) return { color: "border-red-500 bg-red-50", icon: AlertTriangle, status: "Critical" };
        if (qty <= 15) return { color: "border-yellow-500 bg-yellow-50", icon: TrendingDown, status: "Low" };
        return { color: "border-green-500 bg-green-50", icon: TrendingUp, status: "Good" };
    };

    if (!userId) return <div className="flex"><BloodCenterSidebar userId={userId} /><main className="flex-1 p-6">Access Denied</main></div>;

    return (
        <div className="flex min-h-screen bg-background">
            <BloodCenterSidebar userId={userId} />
            <main className="flex-1 p-6 lg:p-8 overflow-auto">
                <header className="flex justify-between mb-8">
                    <div><h1 className="text-3xl font-bold">Blood Reserve</h1><p className="text-muted-foreground">Manage inventory</p></div>
                    <CenterProfileCard name="City Blood Center" city="Almaty" />
                </header>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {bloodTypes.map(type => {
                        const qty = getQuantity(type.group, type.rh);
                        const { color, icon: Icon, status } = getStatus(qty);
                        const isEditing = editingType === type.label;
                        return (
                            <Card key={type.label} className={`p-4 rounded-xl border-2 ${color}`}>
                                <div className="flex justify-between items-center mb-2">
                                    <div className="flex items-center gap-2"><Droplet className="w-5 h-5" /><span className="text-xl font-bold">{type.label}</span></div>
                                    <Icon className="w-5 h-5" />
                                </div>
                                {isEditing ? (
                                    <div className="flex items-center gap-2">
                                        <Input type="number" value={editValue} onChange={e => setEditValue(e.target.value)} className="w-20 h-8 text-center" min="0" />
                                        <Button size="sm" variant="ghost" onClick={() => handleSave(type.group, type.rh)}><Save className="w-4 h-4" /></Button>
                                        <Button size="sm" variant="ghost" onClick={() => setEditingType(null)}><X className="w-4 h-4" /></Button>
                                    </div>
                                ) : (
                                    <div className="flex justify-between items-end">
                                        <div><p className="text-3xl font-bold">{qty}</p><p className="text-xs text-muted-foreground">units</p></div>
                                        <Button size="sm" variant="ghost" onClick={() => { setEditingType(type.label); setEditValue(qty.toString()); }}><Edit2 className="w-4 h-4" /></Button>
                                    </div>
                                )}
                                <div className="mt-2 text-xs font-semibold">{status}</div>
                            </Card>
                        );
                    })}
                </div>
            </main>
        </div>
    );
}