"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { BloodCenterSidebar } from "../components/sidebar";
import { CenterProfileCard } from "../components/center-profile-card";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Search,
    Droplet,
    AlertCircle,
    Package,
    Calendar,
    ChevronDown,
    ChevronUp,
    FlaskConical,
    Syringe,
    Heart,
    Layers,
    Plus,
    Loader2,
    Bell,
    Shield,
    Clock,
    CheckCircle,
    XCircle,
    Mail
} from "lucide-react";

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    if (!token) return null;
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

const componentLabels: Record<string, string> = {
    "WHOLE_BLOOD": "Whole Blood",
    "RED_BLOOD_CELLS": "Red Blood Cells",
    "PLATELETS": "Platelets",
    "PLASMA": "Plasma",
    "CRYOPRECIPITATE": "Cryoprecipitate"
};

const componentIcons: Record<string, any> = {
    "WHOLE_BLOOD": Droplet,
    "RED_BLOOD_CELLS": Heart,
    "PLATELETS": FlaskConical,
    "PLASMA": Syringe,
    "CRYOPRECIPITATE": Package
};

const bloodGroups = ["A", "B", "AB", "O"];
const rhesusFactors = [
    { value: "POSITIVE", label: "Positive (+)" },
    { value: "NEGATIVE", label: "Negative (-)" }
];

export default function BloodReservesPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const userId = searchParams.get('userId');
    const [bloodCenterId, setBloodCenterId] = useState<number | null>(null);
    const [groupedReserves, setGroupedReserves] = useState<any[]>([]);
    const [filteredReserves, setFilteredReserves] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterComponent, setFilterComponent] = useState<string>("ALL");
    const [filterBloodGroup, setFilterBloodGroup] = useState<string>("ALL");
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
    const [verificationStatus, setVerificationStatus] = useState<string | null>(null);
    const [rejectionReason, setRejectionReason] = useState<string | null>(null);

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [createForm, setCreateForm] = useState({
        componentType: "",
        bloodGroup: "",
        rhesusFactor: "POSITIVE",
        quantity: 450,
        notes: ""
    });

    // ============== ПРОВЕРКА ВЕРИФИКАЦИИ ==============
    const checkVerification = async () => {
        if (!userId) return;
        try {
            const headers = getAuthHeaders();
            if (!headers) {
                window.location.href = '/auth/login';
                return;
            }
            const response = await fetch(`http://localhost:8080/blood-centers/by-user/${userId}`, { headers });

            if (response.status === 403) {
                setVerificationStatus("PENDING");
                setIsLoading(false);
                return;
            }

            if (response.status === 401) {
                localStorage.removeItem('token');
                window.location.href = '/auth/login';
                return;
            }

            if (response.ok) {
                const data = await response.json();
                setVerificationStatus(data.verificationStatus || "APPROVED");
                setRejectionReason(data.rejectionReason || null);
            }
        } catch (err) {
            console.error("Error checking verification:", err);
        }
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/auth/login';
            return;
        }
        checkVerification();
    }, [userId]);

    // ============== FETCH CENTER ==============
    useEffect(() => {
        const fetchCenter = async () => {
            if (!userId || verificationStatus !== "APPROVED") return;
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
                } else {
                    setError("Blood center not found");
                }
            } catch (err) {
                console.error("Error fetching center:", err);
                setError("Network error");
            }
        };
        fetchCenter();
    }, [userId, verificationStatus]);

    const fetchGroupedReserves = async () => {
        if (!bloodCenterId || verificationStatus !== "APPROVED") return;
        try {
            setIsLoading(true);
            setError(null);
            const headers = getAuthHeaders();
            if (!headers) return;

            const res = await fetch(`http://localhost:8080/blood-reserves/bloodcenter/${bloodCenterId}/grouped`, {
                headers: headers
            });

            if (checkAuthAndRedirect(res)) return;

            if (res.ok) {
                const data = await res.json();
                console.log("Grouped reserves:", data);
                setGroupedReserves(data);
                setFilteredReserves(data);
            } else {
                setError("Failed to fetch blood reserves");
            }
        } catch (err) {
            console.error("Error fetching grouped reserves:", err);
            setError("Network error");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (verificationStatus === "APPROVED") {
            fetchGroupedReserves();
        }
    }, [bloodCenterId, verificationStatus]);

    useEffect(() => {
        let filtered = groupedReserves;

        if (filterComponent !== "ALL") {
            filtered = filtered.filter(item => item.componentType === filterComponent);
        }

        if (filterBloodGroup !== "ALL") {
            filtered = filtered.filter(item => item.bloodGroup === filterBloodGroup);
        }

        if (searchTerm) {
            filtered = filtered.filter(item =>
                componentLabels[item.componentType].toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.bloodGroup.toLowerCase().includes(searchTerm.toLowerCase()) ||
                `${item.bloodGroup}${item.rhesusFactor === "POSITIVE" ? "+" : "-"}`.includes(searchTerm.toUpperCase())
            );
        }

        setFilteredReserves(filtered);
    }, [filterComponent, filterBloodGroup, searchTerm, groupedReserves]);

    const toggleExpand = (key: string) => {
        const newExpanded = new Set(expandedGroups);
        if (newExpanded.has(key)) {
            newExpanded.delete(key);
        } else {
            newExpanded.add(key);
        }
        setExpandedGroups(newExpanded);
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        const daysUntilExpiration = Math.ceil((date.getTime() - Date.now()) / (1000 * 3600 * 24));

        if (daysUntilExpiration < 0) return "Expired";
        if (daysUntilExpiration === 0) return "Today";
        if (daysUntilExpiration <= 7) return `${daysUntilExpiration} days (⚠️ Soon)`;
        return `${daysUntilExpiration} days`;
    };

    const getExpirationColor = (dateString: string) => {
        if (!dateString) return "text-gray-500";
        const daysUntil = Math.ceil((new Date(dateString).getTime() - Date.now()) / (1000 * 3600 * 24));
        if (daysUntil < 0) return "text-red-600";
        if (daysUntil <= 7) return "text-orange-600";
        return "text-green-600";
    };

    const formatDateDisplay = (dateString: string) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const handleCreateReserve = async () => {
        if (!bloodCenterId || verificationStatus !== "APPROVED") {
            setError("Blood center not found or not verified");
            return;
        }

        if (!createForm.componentType || !createForm.bloodGroup || !createForm.quantity) {
            setError("Please fill all required fields");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const headers = getAuthHeaders();
            if (!headers) return;

            const requestData = {
                bloodCenterId: bloodCenterId,
                componentType: createForm.componentType,
                bloodGroup: createForm.bloodGroup,
                rhesusFactor: createForm.rhesusFactor,
                quantity: createForm.quantity,
                notes: createForm.notes || "Manually added to inventory"
            };

            const response = await fetch("http://localhost:8080/blood-reserves/create-manual", {
                method: "POST",
                headers: headers,
                body: JSON.stringify(requestData)
            });

            if (checkAuthAndRedirect(response)) return;

            if (response.ok) {
                const data = await response.json();
                console.log("Reserve created:", data);
                setIsCreateModalOpen(false);
                setCreateForm({
                    componentType: "",
                    bloodGroup: "",
                    rhesusFactor: "POSITIVE",
                    quantity: 450,
                    notes: ""
                });
                await fetchGroupedReserves();
            } else {
                const error = await response.json();
                setError(error.error || "Failed to create reserve");
            }
        } catch (err) {
            console.error("Error creating reserve:", err);
            setError("Network error while creating reserve");
        } finally {
            setIsSubmitting(false);
        }
    };

    // ============== КОМПОНЕНТЫ ДЛЯ СТАТУСОВ ==============
    const renderPendingVerification = () => (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-amber-50 to-amber-100/30 p-4">
            <Card className="max-w-md w-full p-8 text-center shadow-xl border-0 bg-white">
                <div className="relative">
                    <div className="w-24 h-24 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                        <Clock className="w-12 h-12 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center shadow-md">
                        <span className="text-white text-xs font-bold">!</span>
                    </div>
                </div>

                <h2 className="text-2xl font-bold text-amber-800 mb-3">Account Pending Verification</h2>
                <div className="h-1 w-20 bg-gradient-to-r from-amber-400 to-amber-600 rounded-full mx-auto mb-6"></div>

                <p className="text-gray-600 mb-6">
                    Your blood center account is awaiting approval from the administrator.
                </p>

                <div className="bg-amber-50 rounded-xl p-4 mb-6 text-left border border-amber-200">
                    <div className="flex items-start gap-3">
                        <Shield className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                        <div className="text-sm">
                            <p className="font-semibold text-amber-800 mb-1">Why is this happening?</p>
                            <p className="text-amber-700">All blood centers must have their license verified before accessing the system.</p>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
                    <div className="flex items-start gap-3">
                        <Mail className="w-5 h-5 text-gray-500 mt-0.5 shrink-0" />
                        <div className="text-sm">
                            <p className="font-semibold text-gray-700 mb-1">What happens next?</p>
                            <ul className="text-gray-600 space-y-1">
                                <li>• Admin will review your license document</li>
                                <li>• You will receive an email notification once approved</li>
                                <li>• After approval, you can manage blood reserves</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3">
                    <Button onClick={() => window.location.href = '/auth/login'} variant="outline" className="flex-1 border-amber-300 text-amber-700 hover:bg-amber-50">
                        Back to Login
                    </Button>
                    <Button onClick={() => window.location.reload()} className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white">
                        Refresh Status
                    </Button>
                </div>

                <p className="text-xs text-gray-400 mt-6">
                    Need help? Contact support at support@bloodconnect.com
                </p>
            </Card>
        </div>
    );

    const renderRejectedVerification = () => (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 to-red-100/30 p-4">
            <Card className="max-w-md w-full p-8 text-center shadow-xl border-0 bg-white">
                <div className="relative">
                    <div className="w-24 h-24 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                        <XCircle className="w-12 h-12 text-white" />
                    </div>
                </div>

                <h2 className="text-2xl font-bold text-red-800 mb-3">Account Not Verified</h2>
                <div className="h-1 w-20 bg-gradient-to-r from-red-400 to-red-600 rounded-full mx-auto mb-6"></div>

                <p className="text-gray-600 mb-6">
                    Your blood center account could not be verified by the administrator.
                </p>

                {rejectionReason && (
                    <div className="bg-red-50 rounded-xl p-4 mb-6 text-left border border-red-200">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                            <div className="text-sm">
                                <p className="font-semibold text-red-800 mb-1">Rejection Reason</p>
                                <p className="text-red-700">{rejectionReason}</p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
                    <div className="flex items-start gap-3">
                        <Mail className="w-5 h-5 text-gray-500 mt-0.5 shrink-0" />
                        <div className="text-sm">
                            <p className="font-semibold text-gray-700 mb-1">What can you do?</p>
                            <ul className="text-gray-600 space-y-1">
                                <li>• Contact support for more information</li>
                                <li>• Correct any issues with your license document</li>
                                <li>• Submit a new registration with updated documents</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3">
                    <Button onClick={() => window.location.href = '/auth/login'} className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white">
                        Back to Login
                    </Button>
                </div>

                <p className="text-xs text-gray-400 mt-6">
                    Contact support: support@bloodconnect.com
                </p>
            </Card>
        </div>
    );

    if (verificationStatus === "PENDING") {
        return renderPendingVerification();
    }

    if (verificationStatus === "REJECTED") {
        return renderRejectedVerification();
    }

    if (!userId) {
        return <div className="flex"><BloodCenterSidebar userId={userId} /><main className="flex-1 p-6">Access Denied</main></div>;
    }

    return (
        <>
            <BloodCenterSidebar userId={userId} />
            <main className="ml-20 lg:ml-64 p-6 lg:p-8 min-h-screen overflow-auto">
                <header className="flex justify-between items-start mb-8">
                    <div>
                        <h1 className="text-3xl font-bold">Blood Reserves</h1>
                        <p className="text-muted-foreground">View and manage your blood inventory</p>
                    </div>
                    <CenterProfileCard userId={userId} />
                </header>



                <Card className="p-4 mb-6">
                    <div className="flex flex-col md:flex-row gap-3">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by component or blood type..."
                                className="pl-10 h-9"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <Select value={filterComponent} onValueChange={setFilterComponent}>
                            <SelectTrigger className="w-full md:w-48 h-9">
                                <SelectValue placeholder="Filter by component" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">All Components</SelectItem>
                                {Object.entries(componentLabels).map(([value, label]) => (
                                    <SelectItem key={value} value={value}>{label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={filterBloodGroup} onValueChange={setFilterBloodGroup}>
                            <SelectTrigger className="w-full md:w-40 h-9">
                                <SelectValue placeholder="Filter by blood group" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">All Blood Groups</SelectItem>
                                <SelectItem value="A">A</SelectItem>
                                <SelectItem value="B">B</SelectItem>
                                <SelectItem value="AB">AB</SelectItem>
                                <SelectItem value="O">O</SelectItem>
                            </SelectContent>
                        </Select>

                        <Button
                            variant="outline"
                            size="sm"
                            className="h-9"
                            onClick={() => {
                                setFilterComponent("ALL");
                                setFilterBloodGroup("ALL");
                                setSearchTerm("");
                            }}
                        >
                            Clear Filters
                        </Button>

                        <Button
                            onClick={() => setIsCreateModalOpen(true)}
                            size="sm"
                            className="bg-primary hover:bg-primary/90 h-9 px-3"
                        >
                            <Plus className="w-3.5 h-3.5 mr-1" />
                            Add Blood
                        </Button>

                        <Button
                            onClick={() => router.push(`/dashboard/for-bloodcenter/call-donors?userId=${userId}`)}
                            variant="outline"
                            size="sm"
                            className="h-9 border-orange-300 text-orange-600 hover:bg-orange-50"
                        >
                            <Bell className="w-3.5 h-3.5 mr-1" />
                            Call Donors
                        </Button>
                    </div>
                </Card>

                {error && (
                    <Card className="p-4 mb-6 bg-red-50 border-red-200">
                        <div className="flex items-center gap-2 text-red-600">
                            <AlertCircle className="w-5 h-5" />
                            <span>{error}</span>
                        </div>
                    </Card>
                )}

                {isLoading ? (
                    <Card className="p-12 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                        <p className="mt-4 text-muted-foreground">Loading blood reserves...</p>
                    </Card>
                ) : filteredReserves.length === 0 ? (
                    <Card className="p-12 text-center text-muted-foreground">
                        <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-semibold">No blood reserves found</p>
                        <p className="text-sm">Add blood components to start building your inventory</p>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {filteredReserves.map((group, idx) => {
                            const Icon = componentIcons[group.componentType] || Droplet;
                            const groupKey = `${group.componentType}_${group.bloodGroup}_${group.rhesusFactor}_${idx}`;
                            const isExpanded = expandedGroups.has(groupKey);

                            return (
                                <Card key={groupKey} className="overflow-hidden border-2 hover:border-primary/20 transition-colors">
                                    <div
                                        className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                                        onClick={() => toggleExpand(groupKey)}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                                                    <Icon className="w-7 h-7 text-primary" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h3 className="font-bold text-xl">
                                                            {group.bloodGroup}{group.rhesusFactor === "POSITIVE" ? "+" : "-"}
                                                        </h3>
                                                        <Badge variant="outline" className="text-sm">
                                                            {componentLabels[group.componentType]}
                                                        </Badge>
                                                        <Badge variant="secondary" className="bg-blue-100">
                                                            <Layers className="w-3 h-3 mr-1" />
                                                            {group.unitsCount} units
                                                        </Badge>
                                                    </div>
                                                    <div className="flex gap-4 text-sm text-muted-foreground">
                                                        <span className="flex items-center gap-1">
                                                            <Calendar className="w-3 h-3" />
                                                            Earliest expiry: {formatDate(group.oldestExpiration)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-6">
                                                <div className="text-right">
                                                    <p className="text-3xl font-bold text-primary">
                                                        {group.totalQuantity} ml
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">total volume</p>
                                                </div>
                                                {isExpanded ? (
                                                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                                                ) : (
                                                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {isExpanded && (
                                        <div className="border-t p-4 bg-gray-50">
                                            <h4 className="font-medium mb-3 flex items-center gap-2">
                                                <Package className="w-4 h-4" />
                                                Individual Blood Units ({group.unitsCount} units)
                                            </h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                {group.reserves.map((reserve: any) => (
                                                    <div
                                                        key={reserve.reserveId}
                                                        className="bg-white p-3 rounded-lg border hover:shadow-md transition-shadow"
                                                    >
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div>
                                                                <p className="font-mono text-sm font-semibold">Unit #{reserve.reserveId}</p>
                                                                <p className="text-xs text-muted-foreground">
                                                                    Donation: #{reserve.donationId}
                                                                </p>
                                                            </div>
                                                            <Badge variant={reserve.available ? "default" : "secondary"}>
                                                                {reserve.available ? "Available" : "Unavailable"}
                                                            </Badge>
                                                        </div>

                                                        <div className="flex justify-between items-center mt-2 pt-2 border-t">
                                                            <div>
                                                                <p className="text-sm text-muted-foreground">Quantity</p>
                                                                <p className="font-bold text-lg">{reserve.quantity} ml</p>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-sm text-muted-foreground">Expires</p>
                                                                <p className={`text-sm font-medium ${getExpirationColor(reserve.expirationDate)}`}>
                                                                    {formatDateDisplay(reserve.expirationDate)}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
                                                            <span>Created: {formatDateDisplay(reserve.createdDate)}</span>
                                                            {reserve.inQuarantine && (
                                                                <Badge variant="outline" className="bg-yellow-50">
                                                                    In Quarantine
                                                                </Badge>
                                                            )}
                                                        </div>

                                                        {reserve.notes && (
                                                            <p className="text-xs text-muted-foreground mt-2 pt-2 border-t">
                                                                📝 {reserve.notes}
                                                            </p>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </Card>
                            );
                        })}
                    </div>
                )}

                {/* Статистика */}
                {filteredReserves.length > 0 && (
                    <Card className="p-4 mt-6 bg-gradient-to-r from-primary/5 to-primary/10">
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                            <Package className="w-4 h-4" />
                            Inventory Summary
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <p className="text-sm text-muted-foreground">Total Units</p>
                                <p className="text-2xl font-bold">
                                    {filteredReserves.reduce((sum: number, g: any) => sum + g.unitsCount, 0)}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Total Volume</p>
                                <p className="text-2xl font-bold">
                                    {filteredReserves.reduce((sum: number, g: any) => sum + g.totalQuantity, 0)} ml
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Component Types</p>
                                <p className="text-2xl font-bold">
                                    {new Set(filteredReserves.map((g: any) => g.componentType)).size}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Blood Groups</p>
                                <p className="text-2xl font-bold">
                                    {new Set(filteredReserves.map((g: any) => `${g.bloodGroup}${g.rhesusFactor === "POSITIVE" ? "+" : "-"}`)).size}
                                </p>
                            </div>
                        </div>
                    </Card>
                )}
            </main>

            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Plus className="w-5 h-5" />
                            Add Blood Manually
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="componentType">Component Type *</Label>
                            <Select
                                value={createForm.componentType}
                                onValueChange={(value) => setCreateForm({...createForm, componentType: value})}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select component type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(componentLabels).map(([value, label]) => (
                                        <SelectItem key={value} value={value}>{label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="bloodGroup">Blood Group *</Label>
                                <Select
                                    value={createForm.bloodGroup}
                                    onValueChange={(value) => setCreateForm({...createForm, bloodGroup: value})}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {bloodGroups.map(group => (
                                            <SelectItem key={group} value={group}>{group}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="rhesusFactor">Rhesus Factor *</Label>
                                <Select
                                    value={createForm.rhesusFactor}
                                    onValueChange={(value) => setCreateForm({...createForm, rhesusFactor: value})}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {rhesusFactors.map(rh => (
                                            <SelectItem key={rh.value} value={rh.value}>{rh.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="quantity">Quantity (ml) *</Label>
                            <Input
                                id="quantity"
                                type="number"
                                value={createForm.quantity}
                                onChange={(e) => setCreateForm({...createForm, quantity: parseInt(e.target.value) || 0})}
                                min={1}
                                max={1000}
                                step={50}
                            />
                            <p className="text-xs text-muted-foreground">Standard donation: 450 ml</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="notes">Notes (Optional)</Label>
                            <Textarea
                                id="notes"
                                placeholder="Any additional information..."
                                value={createForm.notes}
                                onChange={(e) => setCreateForm({...createForm, notes: e.target.value})}
                                rows={2}
                            />
                        </div>
                    </div>

                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleCreateReserve}
                            disabled={isSubmitting || !createForm.componentType || !createForm.bloodGroup || createForm.quantity <= 0}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Adding...
                                </>
                            ) : (
                                <>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add to Inventory
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}