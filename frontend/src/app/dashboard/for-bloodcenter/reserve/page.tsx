"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { BloodCenterSidebar } from "../components/sidebar";
import { CenterProfileCard } from "../components/center-profile-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Droplet, Edit2, Save, X, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";

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
        const fetchReserves = async () => {
            if (!bloodCenterId) return;
            try {
                setIsLoading(true);
                setError(null);
                const headers = getAuthHeaders();
                if (!headers) {
                    window.location.href = '/auth/login';
                    return;
                }
                console.log("Fetching reserves for bloodCenterId:", bloodCenterId);

                const res = await fetch(`http://localhost:8080/blood-centers/${bloodCenterId}/reserves`, {
                    headers: headers
                });

                if (checkAuthAndRedirect(res)) return;
                if (res.ok) {
                    const data = await res.json();
                    console.log("Reserves data received:", data);
                    setReserves(data);
                } else {
                    setError(`Failed to fetch reserves: ${res.status}`);
                }
            } catch (err) {
                console.error("Error fetching reserves:", err);
                setError(`Network error: ${err instanceof Error ? err.message : 'Unknown error'}`);
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
            const headers = getAuthHeaders();
            if (!headers) {
                window.location.href = '/auth/login';
                return;
            }

            const res = await fetch(`http://localhost:8080/blood-centers/${bloodCenterId}/reserves`, {
                method: "PUT",
                headers: headers,
                body: JSON.stringify({ bloodGroup: group, rhesusFactor: rh, quantity: newQty }),
            });

            if (checkAuthAndRedirect(res)) return;

            if (res.ok) {
                setReserves(prev => prev.map(r =>
                    (r.bloodGroup === group && r.rhesusFactor === rh)
                        ? { ...r, quantity: newQty }
                        : r
                ));
            } else {
                console.error("Failed to update reserve:", res.status);
                alert("Failed to update reserve. Please try again.");
            }
        } catch (err) {
            console.error("Error saving reserve:", err);
            alert("Network error while saving. Please try again.");
        }
        setEditingType(null);
    };

    const getStatus = (qty: number) => {
        if (qty <= 5) return { color: "border-red-500 bg-red-50", icon: AlertTriangle, status: "Critical" };
        if (qty <= 15) return { color: "border-yellow-500 bg-yellow-50", icon: TrendingDown, status: "Low" };
        return { color: "border-green-500 bg-green-50", icon: TrendingUp, status: "Good" };
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
                        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-muted-foreground">Loading reserves...</p>
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
                        <h1 className="text-3xl font-bold">Blood Reserve</h1>
                        <p className="text-muted-foreground">Manage inventory</p>
                    </div>
                    <CenterProfileCard userId={userId} />
                </header>

                {error && (
                    <Card className="p-4 mb-6 bg-red-50 border-red-200">
                        <div className="flex items-center gap-2 text-red-600">
                            <AlertTriangle className="w-5 h-5" />
                            <span>{error}</span>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            className="mt-2"
                            onClick={() => {
                                setError(null);
                                if (bloodCenterId) {
                                    const fetchReserves = async () => {
                                        const headers = getAuthHeaders();
                                        if (headers) {
                                            const res = await fetch(`http://localhost:8080/blood-centers/${bloodCenterId}/reserves`, {
                                                headers: headers
                                            });
                                            if (res.ok) {
                                                const data = await res.json();
                                                setReserves(data);
                                            }
                                        }
                                    };
                                    fetchReserves();
                                }
                            }}
                        >
                            Retry
                        </Button>
                    </Card>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {bloodTypes.map(type => {
                        const qty = getQuantity(type.group, type.rh);
                        const { color, icon: Icon, status } = getStatus(qty);
                        const isEditing = editingType === type.label;
                        return (
                            <Card key={type.label} className={`p-4 rounded-xl border-2 ${color}`}>
                                <div className="flex justify-between items-center mb-2">
                                    <div className="flex items-center gap-2">
                                        <Droplet className="w-5 h-5" />
                                        <span className="text-xl font-bold">{type.label}</span>
                                    </div>
                                    <Icon className="w-5 h-5" />
                                </div>
                                {isEditing ? (
                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="number"
                                            value={editValue}
                                            onChange={e => setEditValue(e.target.value)}
                                            className="w-20 h-8 text-center"
                                            min="0"
                                        />
                                        <Button size="sm" variant="ghost" onClick={() => handleSave(type.group, type.rh)}>
                                            <Save className="w-4 h-4" />
                                        </Button>
                                        <Button size="sm" variant="ghost" onClick={() => setEditingType(null)}>
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-3xl font-bold">{qty}</p>
                                            <p className="text-xs text-muted-foreground">units</p>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => {
                                                setEditingType(type.label);
                                                setEditValue(qty.toString());
                                            }}
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                )}
                                <div className="mt-2 text-xs font-semibold">{status}</div>
                            </Card>
                        );
                    })}
                </div>
            </main>
        </>
    );
}