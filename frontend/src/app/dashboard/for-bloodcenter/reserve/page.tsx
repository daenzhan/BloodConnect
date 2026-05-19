"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { BloodCenterSidebar } from "../components/sidebar";
import { CenterProfileCard } from "../components/center-profile-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Droplet,
    Edit2,
    AlertTriangle,
    Package,
    RefreshCw,
    Search,
    AlertCircle,
    CheckCircle,
    Clock,
    Plus,
    Zap
} from "lucide-react";

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

interface BloodReserveDetail {
    reserveId: number;
    componentType: string;
    bloodGroup: string;
    rhesusFactor: string;
    quantity: number;
    inQuarantine: boolean;
    quarantineEndDate?: string;
    isAvailable: boolean;
    expirationDate: string;
    createdDate: string;
    donationId: number;
    daysUntilExpiration: number;
    isReady: boolean;
}

const componentTypes = [
    { value: "WHOLE_BLOOD", label: "Whole Blood", icon: "🩸", color: "bg-red-100 text-red-700", defaultQty: 450 },
    { value: "RED_BLOOD_CELLS", label: "Red Blood Cells", icon: "🔴", color: "bg-red-100 text-red-700", defaultQty: 250 },
    { value: "PLATELETS", label: "Platelets", icon: "🟡", color: "bg-yellow-100 text-yellow-700", defaultQty: 200 },
    { value: "PLASMA", label: "Plasma", icon: "💧", color: "bg-blue-100 text-blue-700", defaultQty: 250 },
    { value: "CRYOPRECIPITATE", label: "Cryoprecipitate", icon: "❄️", color: "bg-purple-100 text-purple-700", defaultQty: 150 },
];

const bloodGroups = [
    { group: "A", rh: "+", label: "A+" },
    { group: "A", rh: "-", label: "A-" },
    { group: "B", rh: "+", label: "B+" },
    { group: "B", rh: "-", label: "B-" },
    { group: "AB", rh: "+", label: "AB+" },
    { group: "AB", rh: "-", label: "AB-" },
    { group: "O", rh: "+", label: "O+" },
    { group: "O", rh: "-", label: "O-" },
];

export default function BloodReservePage() {
    const searchParams = useSearchParams();
    const userId = searchParams.get('userId');
    const [bloodCenterId, setBloodCenterId] = useState<number | null>(null);
    const [allReserves, setAllReserves] = useState<BloodReserveDetail[]>([]);
    const [filteredReserves, setFilteredReserves] = useState<BloodReserveDetail[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedBloodGroup, setSelectedBloodGroup] = useState<string>("ALL");
    const [selectedComponent, setSelectedComponent] = useState<string>("ALL");

    const [quickAddOpen, setQuickAddOpen] = useState(false);
    const [quickAddData, setQuickAddData] = useState({
        componentType: "WHOLE_BLOOD",
        bloodGroup: "A",
        rhesusFactor: "+",
        quantity: 450
    });
    const [isAdding, setIsAdding] = useState(false);

    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editingReserve, setEditingReserve] = useState<BloodReserveDetail | null>(null);
    const [editQuantity, setEditQuantity] = useState("");

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
                    setError("Blood center not found");
                }
            } catch (err) {
                console.error("Error fetching center:", err);
                setError("Network error");
            }
        };
        fetchCenter();
    }, [userId]);

    const fetchReserves = async () => {
        if (!bloodCenterId) return;
        try {
            setIsLoading(true);
            const headers = getAuthHeaders();
            if (!headers) {
                window.location.href = '/auth/login';
                return;
            }
            const response = await fetch(`http://localhost:8080/blood-reserves/bloodcenter/${bloodCenterId}`, {
                headers: headers
            });
            if (checkAuthAndRedirect(response)) return;
            if (response.ok) {
                const data = await response.json();
                if (Array.isArray(data)) {
                    setAllReserves(data);
                    setFilteredReserves(data);
                } else {
                    setAllReserves([]);
                    setFilteredReserves([]);
                }
            }
        } catch (err) {
            console.error("Error fetching reserves:", err);
            setError("Failed to load reserves");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchReserves();
    }, [bloodCenterId]);

    useEffect(() => {
        let filtered = [...allReserves];

        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            filtered = filtered.filter(r =>
                r.componentType.toLowerCase().includes(searchLower) ||
                r.bloodGroup.toLowerCase().includes(searchLower)
            );
        }

        if (selectedBloodGroup !== "ALL") {
            filtered = filtered.filter(r =>
                `${r.bloodGroup}${r.rhesusFactor === "POSITIVE" ? "+" : "-"}` === selectedBloodGroup
            );
        }

        if (selectedComponent !== "ALL") {
            filtered = filtered.filter(r => r.componentType === selectedComponent);
        }

        setFilteredReserves(filtered);
    }, [searchTerm, selectedBloodGroup, selectedComponent, allReserves]);

    const reservesByBloodType = () => {
        const grouped: Record<string, BloodReserveDetail[]> = {};
        filteredReserves.forEach(reserve => {
            const key = `${reserve.bloodGroup}${reserve.rhesusFactor === "POSITIVE" ? "+" : "-"}`;
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(reserve);
        });
        return grouped;
    };

    const handleQuickAdd = async () => {
        if (!bloodCenterId) {
            alert("Blood center not found");
            return;
        }

        setIsAdding(true);
        try {
            const headers = getAuthHeaders();
            if (!headers) return;

            const response = await fetch(`http://localhost:8080/blood-reserves/create-manual`, {
                method: "POST",
                headers: headers,
                body: JSON.stringify({
                    bloodCenterId: bloodCenterId,
                    componentType: quickAddData.componentType,
                    bloodGroup: quickAddData.bloodGroup,
                    rhesusFactor: quickAddData.rhesusFactor,
                    quantity: quickAddData.quantity,
                    notes: "Manually added to inventory"
                })
            });

            const text = await response.text();
            let result;
            try {
                result = text ? JSON.parse(text) : {};
            } catch (e) {
                result = { message: text || "Operation completed" };
            }

            if (response.ok) {
                alert(result.message || "Component added successfully!");
                setQuickAddOpen(false);
                setQuickAddData({
                    componentType: "WHOLE_BLOOD",
                    bloodGroup: "A",
                    rhesusFactor: "+",
                    quantity: 450
                });
                await fetchReserves();
            } else {
                alert(result.error || "Failed to add component");
            }

        } catch (err) {
            console.error("Error adding component:", err);
            alert("Network error. Please try again.");
        } finally {
            setIsAdding(false);
        }
    };

    const handleEditQuantity = async () => {
        if (!editingReserve) return;
        const newQuantity = parseInt(editQuantity);
        if (isNaN(newQuantity) || newQuantity < 0) {
            alert("Please enter a valid quantity");
            return;
        }

        try {
            const headers = getAuthHeaders();
            if (!headers) return;

            const response = await fetch(`http://localhost:8080/blood-reserves/${editingReserve.reserveId}/quantity`, {
                method: "PUT",
                headers: headers,
                body: JSON.stringify({ quantity: newQuantity })
            });

            const text = await response.text();
            let result;
            try {
                result = text ? JSON.parse(text) : {};
            } catch (e) {
                result = { message: text || "Operation completed" };
            }

            if (response.ok) {
                alert(result.message || "Quantity updated successfully!");
                await fetchReserves();
                setEditDialogOpen(false);
            } else {
                alert(result.error || "Failed to update quantity");
            }

        } catch (err) {
            console.error("Error updating quantity:", err);
            alert("Network error");
        }
    };

    const getStatusBadge = (reserve: BloodReserveDetail) => {
        if (!reserve.isReady) return { label: "Quarantine", color: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: Clock };
        if (reserve.daysUntilExpiration <= 7 && reserve.daysUntilExpiration > 0) return { label: "Expiring Soon", color: "bg-orange-100 text-orange-700 border-orange-200", icon: AlertTriangle };
        if (reserve.daysUntilExpiration <= 0) return { label: "Expired", color: "bg-red-100 text-red-700 border-red-200", icon: AlertCircle };
        return { label: "Available", color: "bg-green-100 text-green-700 border-green-200", icon: CheckCircle };
    };

    if (!userId) {
        return (
            <div className="flex min-h-screen bg-background">
                <BloodCenterSidebar userId={userId} />
                <main className="flex-1 p-6">
                    <Card className="p-6 text-center">
                        <p className="text-destructive">Access Denied: User ID not found</p>
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
                        <p className="text-muted-foreground">Loading inventory...</p>
                    </div>
                </main>
            </div>
        );
    }

    const groupedReserves = reservesByBloodType();
    const bloodGroupOrder = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

    return (
        <>
            <BloodCenterSidebar userId={userId} />
            <main className="ml-20 lg:ml-64 p-6 lg:p-8 min-h-screen overflow-auto bg-background">
                <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                    <div>
                        <h1 className="text-3xl font-bold">Blood Inventory</h1>
                        <p className="text-muted-foreground">Track and manage blood components</p>
                    </div>
                    <div className="flex gap-3">
                        <Button onClick={() => setQuickAddOpen(true)} className="bg-primary hover:bg-primary/90">
                            <Plus className="w-4 h-4 mr-2" />
                            Quick Add
                        </Button>
                        <Button variant="outline" size="sm" onClick={fetchReserves}>
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Refresh
                        </Button>
                        <CenterProfileCard userId={userId} />
                    </div>
                </div>

                <Card className="p-4 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by type or blood group..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <Select value={selectedBloodGroup} onValueChange={setSelectedBloodGroup}>
                            <SelectTrigger>
                                <SelectValue placeholder="All Blood Types" />
                            </SelectTrigger>
                            <SelectContent className="bg-white dark:bg-card" position="popper" side="bottom" align="start">
                                <SelectItem value="ALL">All Blood Types</SelectItem>
                                {bloodGroups.map(bg => (
                                    <SelectItem key={bg.label} value={bg.label}>{bg.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={selectedComponent} onValueChange={setSelectedComponent}>
                            <SelectTrigger>
                                <SelectValue placeholder="All Components" />
                            </SelectTrigger>
                            <SelectContent className="bg-white dark:bg-card" position="popper" side="bottom" align="start">
                                <SelectItem value="ALL">All Components</SelectItem>
                                {componentTypes.map(ct => (
                                    <SelectItem key={ct.value} value={ct.value}>{ct.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </Card>

                {filteredReserves.length === 0 ? (
                    <Card className="p-12 text-center">
                        <Package className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-30" />
                        <p className="text-muted-foreground">No components found</p>
                        <Button variant="outline" className="mt-4" onClick={() => setQuickAddOpen(true)}>
                            <Plus className="w-4 h-4 mr-2" />
                            Add First Component
                        </Button>
                    </Card>
                ) : (
                    <div className="space-y-6">
                        {bloodGroupOrder.map(bloodType => {
                            const reservesForType = groupedReserves[bloodType] || [];
                            if (reservesForType.length === 0) return null;

                            return (
                                <div key={bloodType}>
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                            <Droplet className="w-5 h-5 text-primary" />
                                        </div>
                                        <h2 className="text-xl font-semibold">Blood Type {bloodType}</h2>
                                        <Badge variant="secondary" className="ml-2">
                                            {reservesForType.length} unit{reservesForType.length !== 1 ? 's' : ''}
                                        </Badge>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                        {reservesForType.map((reserve) => {
                                            const component = componentTypes.find(ct => ct.value === reserve.componentType);
                                            const status = getStatusBadge(reserve);
                                            const StatusIcon = status.icon;
                                            return (
                                                <Card key={reserve.reserveId} className="p-4 hover:shadow-md transition-all group">
                                                    <div className="flex justify-between items-start mb-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-10 h-10 rounded-full ${component?.color || "bg-gray-100"} flex items-center justify-center text-xl`}>
                                                                {component?.icon || "🩸"}
                                                            </div>
                                                            <div>
                                                                <h3 className="font-semibold">{component?.label || reserve.componentType}</h3>
                                                                <p className="text-xs text-muted-foreground">ID: {reserve.reserveId}</p>
                                                            </div>
                                                        </div>
                                                        <Badge variant="outline" className={status.color}>
                                                            <StatusIcon className="w-3 h-3 mr-1" />
                                                            {status.label}
                                                        </Badge>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                                                        <div>
                                                            <p className="text-muted-foreground text-xs">Quantity</p>
                                                            <p className="text-2xl font-bold text-primary">{reserve.quantity} <span className="text-sm font-normal text-muted-foreground">ml</span></p>
                                                        </div>
                                                        <div>
                                                            <p className="text-muted-foreground text-xs">Created</p>
                                                            <p className="font-medium">{new Date(reserve.createdDate).toLocaleDateString()}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-muted-foreground text-xs">Expires</p>
                                                            <p className={`font-medium ${reserve.daysUntilExpiration <= 7 ? "text-orange-600" : ""}`}>
                                                                {new Date(reserve.expirationDate).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="text-muted-foreground text-xs">Donation ID</p>
                                                            <p className="font-medium">#{reserve.donationId}</p>
                                                        </div>
                                                    </div>

                                                    {reserve.inQuarantine && reserve.quarantineEndDate && (
                                                        <div className="mt-2 p-2 bg-yellow-50 rounded-lg flex items-center gap-2 text-xs">
                                                            <Clock className="w-3 h-3 text-yellow-600" />
                                                            <span className="text-yellow-600">Quarantine until {new Date(reserve.quarantineEndDate).toLocaleDateString()}</span>
                                                        </div>
                                                    )}

                                                    <div className="mt-3 pt-3 border-t flex justify-end">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => {
                                                                setEditingReserve(reserve);
                                                                setEditQuantity(reserve.quantity.toString());
                                                                setEditDialogOpen(true);
                                                            }}
                                                        >
                                                            <Edit2 className="w-3 h-3 mr-1" />
                                                            Edit Quantity
                                                        </Button>
                                                    </div>
                                                </Card>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>

            <Dialog open={quickAddOpen} onOpenChange={setQuickAddOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Zap className="w-5 h-5 text-primary" />
                            Quick Add Component
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <label className="text-sm font-medium mb-2 block">Component Type</label>
                            <Select
                                value={quickAddData.componentType}
                                onValueChange={(value) => {
                                    const ct = componentTypes.find(c => c.value === value);
                                    setQuickAddData({
                                        ...quickAddData,
                                        componentType: value,
                                        quantity: ct?.defaultQty || 250
                                    });
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select component type" />
                                </SelectTrigger>
                                <SelectContent className="bg-white dark:bg-card" position="popper" side="bottom" align="start">
                                    {componentTypes.map(ct => (
                                        <SelectItem key={ct.value} value={ct.value}>{ct.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-2 block">Blood Type</label>
                            <div className="grid grid-cols-2 gap-3">
                                <Select
                                    value={quickAddData.bloodGroup}
                                    onValueChange={(value) => setQuickAddData({...quickAddData, bloodGroup: value})}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Group" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white dark:bg-card" position="popper" side="bottom" align="start">
                                        <SelectItem value="A">A</SelectItem>
                                        <SelectItem value="B">B</SelectItem>
                                        <SelectItem value="AB">AB</SelectItem>
                                        <SelectItem value="O">O</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Select
                                    value={quickAddData.rhesusFactor}
                                    onValueChange={(value) => setQuickAddData({...quickAddData, rhesusFactor: value})}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Rh" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white dark:bg-card" position="popper" side="bottom" align="start">
                                        <SelectItem value="+">Positive (+)</SelectItem>
                                        <SelectItem value="-">Negative (-)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-2 block">Quantity (ml)</label>
                            <Input
                                type="number"
                                value={quickAddData.quantity}
                                onChange={(e) => setQuickAddData({...quickAddData, quantity: parseInt(e.target.value) || 0})}
                                min="1"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setQuickAddOpen(false)}>Cancel</Button>
                        <Button onClick={handleQuickAdd} disabled={isAdding} className="bg-primary hover:bg-primary/90">
                            {isAdding ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Adding...</> : "Add Component"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Edit Quantity</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        {editingReserve && (
                            <>
                                <div className="text-center">
                                    <div className="text-lg font-semibold">
                                        {componentTypes.find(c => c.value === editingReserve.componentType)?.label}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        {editingReserve.bloodGroup}{editingReserve.rhesusFactor === "POSITIVE" ? "+" : "-"}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium mb-2 block">Current Quantity: {editingReserve.quantity} ml</label>
                                    <Input
                                        type="number"
                                        value={editQuantity}
                                        onChange={(e) => setEditQuantity(e.target.value)}
                                        min="0"
                                        className="text-center text-lg"
                                    />
                                </div>
                            </>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleEditQuantity}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}