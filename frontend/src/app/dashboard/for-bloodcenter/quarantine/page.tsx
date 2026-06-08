"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { BloodCenterSidebar } from "../components/sidebar";
import { CenterProfileCard } from "../components/center-profile-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import {
    Calendar,
    Clock,
    Droplet,
    AlertTriangle,
    CheckCircle,
    XCircle,
    RefreshCw,
    Shield,
    Syringe,
    CalendarClock,
    TrendingUp,
    Users,
    Package,
    FlaskConical,
    Loader2,
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
        window.location.href = '/auth/login';
        return true;
    }
    return false;
};

interface QuarantineReserve {
    reserveId: number;
    componentType: string;
    bloodGroup: string;
    rhesusFactor: string;
    quantity: number;
    quarantineEndDate: string;
    createdDate: string;
    donationId: number;
    donorId: number;
    daysRemaining: number;
    isQuarantineExpired: boolean;
    notes: string;
}

export default function QuarantinePage() {
    const searchParams = useSearchParams();
    const userId = searchParams.get('userId');
    const [bloodCenterId, setBloodCenterId] = useState<number | null>(null);
    const [quarantineItems, setQuarantineItems] = useState<QuarantineReserve[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [verificationStatus, setVerificationStatus] = useState<string | null>(null);
    const [rejectionReason, setRejectionReason] = useState<string | null>(null);


    const [selectedItem, setSelectedItem] = useState<QuarantineReserve | null>(null);
    const [isReleaseDialogOpen, setIsReleaseDialogOpen] = useState(false);


    const [isSuitabilityDialogOpen, setIsSuitabilityDialogOpen] = useState(false);
    const [suitabilityData, setSuitabilityData] = useState({
        isSuitable: "",
        testResults: "",
        technicianNotes: ""
    });
    const [isSubmitting, setIsSubmitting] = useState(false);


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

    const fetchQuarantineItems = async () => {
        if (!bloodCenterId || verificationStatus !== "APPROVED") return;
        try {
            setIsLoading(true);
            const headers = getAuthHeaders();
            if (!headers) return;

            const response = await fetch(`http://localhost:8080/blood-reserves/quarantine/${bloodCenterId}`, {
                headers: headers
            });

            if (checkAuthAndRedirect(response)) return;

            if (response.ok) {
                const data = await response.json();
                setQuarantineItems(data);
            } else {
                setError("Failed to load quarantine items");
            }
        } catch (err) {
            console.error("Error fetching quarantine:", err);
            setError("Network error");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (verificationStatus === "APPROVED") {
            fetchQuarantineItems();
        }
    }, [bloodCenterId, verificationStatus]);

    const handleReleaseFromQuarantine = async (item: QuarantineReserve) => {
        if (verificationStatus !== "APPROVED") {
            setError("Account not verified");
            return;
        }

        setSelectedItem(item);

        if (item.componentType === "PLASMA") {
            setIsReleaseDialogOpen(false);

            try {
                const headers = getAuthHeaders();
                if (!headers) return;

                const response = await fetch(`http://localhost:8080/blood-reserves/${item.reserveId}/release-from-quarantine`, {
                    method: "POST",
                    headers: headers
                });

                if (response.ok) {
                    const result = await response.json();
                    if (result.needsTesting) {
                        setSuitabilityData({
                            isSuitable: "",
                            testResults: "",
                            technicianNotes: ""
                        });
                        setIsSuitabilityDialogOpen(true);
                    }
                    await fetchQuarantineItems();
                } else {
                    const error = await response.json();
                    alert(error.error || "Failed to release from quarantine");
                }
            } catch (err) {
                console.error("Error releasing from quarantine:", err);
                alert("Network error");
            }
        } else {
            // For non-plasma, just confirm release
            setIsReleaseDialogOpen(true);
        }
    };

    const confirmRelease = async () => {
        if (!selectedItem || verificationStatus !== "APPROVED") return;

        try {
            const headers = getAuthHeaders();
            if (!headers) return;

            const response = await fetch(`http://localhost:8080/blood-reserves/${selectedItem.reserveId}/release-from-quarantine`, {
                method: "POST",
                headers: headers
            });

            if (response.ok) {
                await fetchQuarantineItems();
                alert("Successfully released from quarantine");
            } else {
                const error = await response.json();
                alert(error.error || "Failed to release from quarantine");
            }
        } catch (err) {
            console.error("Error releasing:", err);
            alert("Network error");
        } finally {
            setIsReleaseDialogOpen(false);
            setSelectedItem(null);
        }
    };

    const confirmPlasmaSuitability = async () => {
        if (!suitabilityData.isSuitable || verificationStatus !== "APPROVED") {
            alert("Please select whether the plasma is suitable or not");
            return;
        }

        setIsSubmitting(true);

        try {
            const headers = getAuthHeaders();
            if (!headers) return;

            const response = await fetch(`http://localhost:8080/blood-reserves/${selectedItem?.reserveId}/confirm-plasma-suitability`, {
                method: "POST",
                headers: headers,
                body: JSON.stringify({
                    isSuitable: suitabilityData.isSuitable,
                    testResults: suitabilityData.testResults || "Visual inspection passed",
                    technicianNotes: suitabilityData.technicianNotes || ""
                })
            });

            if (response.ok) {
                const result = await response.json();
                if (suitabilityData.isSuitable === "YES") {
                    alert("Plasma confirmed suitable and is now available for use!");
                } else {
                    alert("Plasma marked as unsuitable and has been removed from inventory");
                }
                await fetchQuarantineItems();
                setIsSuitabilityDialogOpen(false);
                setSelectedItem(null);
                setSuitabilityData({
                    isSuitable: "",
                    testResults: "",
                    technicianNotes: ""
                });
            } else {
                const error = await response.json();
                alert(error.error || "Failed to confirm suitability");
            }
        } catch (err) {
            console.error("Error confirming suitability:", err);
            alert("Network error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusColor = (daysRemaining: number, isExpired: boolean) => {
        if (isExpired) return "text-green-600 bg-green-50";
        if (daysRemaining <= 7) return "text-orange-600 bg-orange-50";
        return "text-blue-600 bg-blue-50";
    };

    const getStatusText = (daysRemaining: number, isExpired: boolean) => {
        if (isExpired) return "Ready for review";
        if (daysRemaining <= 7) return "Expiring soon";
        return `${daysRemaining} days remaining`;
    };

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
                                <li>• After approval, you can manage quarantine</li>
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
                            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
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
        return (
            <div className="flex min-h-screen bg-background">
                <BloodCenterSidebar userId={userId} />
                <main className="flex-1 p-6">Access Denied</main>
            </div>
        );
    }

    return (
        <>
            <BloodCenterSidebar userId={userId} />
            <main className="ml-20 lg:ml-64 p-6 lg:p-8 min-h-screen overflow-auto bg-background">
                {/* Header */}
                <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                    <div>
                        <h1 className="text-3xl font-bold">Quarantine Management</h1>
                        <p className="text-muted-foreground">Monitor and manage blood components in quarantine</p>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="outline" size="sm" onClick={fetchQuarantineItems}>
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Refresh
                        </Button>
                        <CenterProfileCard userId={userId} />
                    </div>
                </div>




                <Card className="p-4 mb-6 bg-blue-50 border-blue-200">
                    <div className="flex items-start gap-3">
                        <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div>
                            <p className="font-semibold text-blue-800">Plasma Quarantine Protocol</p>
                            <p className="text-sm text-blue-700">
                                Plasma requires a 90-day quarantine period and must be tested after release to ensure
                                donor stability. After quarantine ends, you'll need to confirm plasma suitability
                                before it becomes available for distribution.
                            </p>
                        </div>
                    </div>
                </Card>

                {error && (
                    <Card className="p-4 mb-6 bg-red-50 border-red-200">
                        <div className="flex items-center gap-2 text-red-600">
                            <AlertTriangle className="w-5 h-5" />
                            <span>{error}</span>
                        </div>
                    </Card>
                )}

                {isLoading ? (
                    <Card className="p-12 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                        <p className="mt-4 text-muted-foreground">Loading quarantine items...</p>
                    </Card>
                ) : quarantineItems.length === 0 ? (
                    <Card className="p-12 text-center">
                        <Shield className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-30" />
                        <p className="text-muted-foreground">No items in quarantine</p>
                        <p className="text-sm text-muted-foreground mt-1">
                            All blood components are either available or have been processed
                        </p>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {quarantineItems.map((item) => {
                            const isPlasma = item.componentType === "PLASMA";
                            const statusColor = getStatusColor(item.daysRemaining, item.isQuarantineExpired);
                            const statusText = getStatusText(item.daysRemaining, item.isQuarantineExpired);

                            return (
                                <Card key={item.reserveId} className="p-4 hover:shadow-md transition-all">
                                    <div className="flex flex-wrap justify-between items-start gap-4">
                                        <div className="flex items-start gap-4 flex-1">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                                isPlasma ? "bg-purple-100" : "bg-gray-100"
                                            }`}>
                                                {isPlasma ? (
                                                    <FlaskConical className="w-6 h-6 text-purple-600" />
                                                ) : (
                                                    <Droplet className="w-6 h-6 text-gray-600" />
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                                    <h3 className="font-semibold text-lg">
                                                        {item.bloodGroup}{item.rhesusFactor === "POSITIVE" ? "+" : "-"} - {item.componentType}
                                                    </h3>
                                                    <Badge variant="outline" className={statusColor}>
                                                        {statusText}
                                                    </Badge>
                                                    {isPlasma && (
                                                        <Badge variant="outline" className="bg-purple-100 text-purple-700">
                                                            <FlaskConical className="w-3 h-3 mr-1" />
                                                            Needs Testing
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                                    <div>
                                                        <p className="text-muted-foreground text-xs">Quantity</p>
                                                        <p className="font-medium">{item.quantity} ml</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-muted-foreground text-xs">Donation ID</p>
                                                        <p className="font-medium">#{item.donationId}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-muted-foreground text-xs">Created</p>
                                                        <p className="font-medium">{new Date(item.createdDate).toLocaleDateString()}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-muted-foreground text-xs">Quarantine End</p>
                                                        <p className="font-medium">{new Date(item.quarantineEndDate).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                                {item.notes && (
                                                    <p className="text-xs text-muted-foreground mt-2">
                                                         {item.notes}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <Button
                                            size="sm"
                                            onClick={() => handleReleaseFromQuarantine(item)}
                                            className={isPlasma ? "bg-purple-600 hover:bg-purple-700" : ""}
                                            disabled={!item.isQuarantineExpired && !isPlasma}
                                        >
                                            {isPlasma ? (
                                                <>
                                                    <FlaskConical className="w-4 h-4 mr-1" />
                                                    Review Plasma
                                                </>
                                            ) : (
                                                "Release"
                                            )}
                                        </Button>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                )}


                {quarantineItems.length > 0 && (
                    <Card className="p-4 mt-6 bg-gray-50 border-gray-200">
                        <div className="flex items-start gap-3">
                            <CalendarClock className="w-5 h-5 text-gray-600 mt-0.5" />
                            <div>
                                <p className="font-medium text-sm">Automatic Release</p>
                                <p className="text-sm text-muted-foreground">
                                    Components are automatically released from quarantine when the quarantine period ends.
                                    Plasma requires additional testing and approval before becoming available.
                                </p>
                            </div>
                        </div>
                    </Card>
                )}
            </main>

            <AlertDialog open={isReleaseDialogOpen} onOpenChange={setIsReleaseDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Release from Quarantine</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to release this component from quarantine?
                            {selectedItem?.componentType === "PLASMA" && (
                                <div className="mt-2 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                                    <p className="text-sm text-yellow-800">
                                         <strong>Plasma requires testing</strong> - After release, you will need to
                                        confirm plasma suitability before it becomes available for use.
                                    </p>
                                </div>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmRelease}>
                            Release
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>


            <Dialog open={isSuitabilityDialogOpen} onOpenChange={setIsSuitabilityDialogOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FlaskConical className="w-5 h-5 text-purple-600" />
                            Plasma Suitability Assessment
                        </DialogTitle>
                        <DialogDescription>
                            {selectedItem?.bloodGroup}{selectedItem?.rhesusFactor === "POSITIVE" ? "+" : "-"} Plasma Unit #{selectedItem?.reserveId}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <p className="text-sm text-blue-800 font-medium mb-2"> Pre-release Testing Required</p>
                            <p className="text-sm text-blue-700">
                                Before plasma can be released for use, please confirm that the donor has passed
                                follow-up testing and the plasma unit meets all quality standards. This ensures
                                donor stability and blood product safety.
                            </p>
                        </div>


                        <div className="space-y-3">
                            <Label className="text-base font-semibold">Is the plasma suitable for use?</Label>
                            <div className="flex gap-6">
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        value="YES"
                                        checked={suitabilityData.isSuitable === "YES"}
                                        onChange={(e) => setSuitabilityData({...suitabilityData, isSuitable: e.target.value})}
                                        className="w-4 h-4 text-green-600 focus:ring-green-500"
                                    />
                                    <span className="text-green-700 font-medium"> Yes, suitable</span>
                                </label>
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        value="NO"
                                        checked={suitabilityData.isSuitable === "NO"}
                                        onChange={(e) => setSuitabilityData({...suitabilityData, isSuitable: e.target.value})}
                                        className="w-4 h-4 text-red-600 focus:ring-red-500"
                                    />
                                    <span className="text-red-700 font-medium"> No, not suitable</span>
                                </label>
                            </div>
                        </div>

                        {suitabilityData.isSuitable === "YES" && (
                            <div className="space-y-3 animate-in fade-in duration-200">
                                <Label>Test Results / Confirmation Details</Label>
                                <Textarea
                                    placeholder="e.g., Donor passed follow-up testing, no abnormal results detected..."
                                    value={suitabilityData.testResults}
                                    onChange={(e) => setSuitabilityData({...suitabilityData, testResults: e.target.value})}
                                    rows={3}
                                />
                                <p className="text-xs text-green-600">
                                     After confirmation, this plasma will become AVAILABLE for use.
                                </p>
                            </div>
                        )}

                        {suitabilityData.isSuitable === "NO" && (
                            <div className="space-y-3 animate-in fade-in duration-200">
                                <Label>Reason for Unsuitability</Label>
                                <Textarea
                                    placeholder="e.g., Donor tested positive for [marker], abnormal blood chemistry, donor deferred..."
                                    value={suitabilityData.testResults}
                                    onChange={(e) => setSuitabilityData({...suitabilityData, testResults: e.target.value})}
                                    rows={3}
                                    required
                                />
                                <p className="text-xs text-red-600">
                                    ⚠ Marking as unsuitable will remove this plasma from inventory.
                                </p>
                            </div>
                        )}

                        <div className="space-y-3">
                            <Label>Technician Notes (Optional)</Label>
                            <Textarea
                                placeholder="Additional comments or observations..."
                                value={suitabilityData.technicianNotes}
                                onChange={(e) => setSuitabilityData({...suitabilityData, technicianNotes: e.target.value})}
                                rows={2}
                            />
                        </div>

                        {suitabilityData.isSuitable === "NO" && (
                            <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                                <p className="text-sm text-red-800">
                                     <strong>Important:</strong> Marking plasma as unsuitable will remove it from
                                    inventory and flag it for proper disposal. This action cannot be undone.
                                </p>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => {
                            setIsSuitabilityDialogOpen(false);
                            setSelectedItem(null);
                        }}>
                            Cancel
                        </Button>
                        <Button
                            onClick={confirmPlasmaSuitability}
                            disabled={isSubmitting || !suitabilityData.isSuitable}
                            className={suitabilityData.isSuitable === "YES" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                suitabilityData.isSuitable === "YES" ? "Confirm & Make Available" : "Mark as Unsuitable"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}