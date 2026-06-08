"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { BloodCenterSidebar } from "../components/sidebar";
import { CenterProfileCard } from "../components/center-profile-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Bell,
    Mail,
    Send,
    Loader2,
    CheckCircle,
    XCircle,
    AlertCircle,
    Users,
    Droplet,
    TrendingUp,
    Clock,
    Calendar,
    PhoneCall,
    MapPin,
    Search,
    Eye,
    RefreshCw,
    Shield
} from "lucide-react";

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

const bloodGroups = ["A", "B", "AB", "O"];
const rhesusFactors = [
    { value: "POSITIVE", label: "Positive (+)" },
    { value: "NEGATIVE", label: "Negative (-)" }
];
const componentTypes = [
    { value: "WHOLE_BLOOD", label: "Whole Blood", color: "bg-red-100 text-red-700" },
    { value: "RED_BLOOD_CELLS", label: "Red Blood Cells", color: "bg-red-100 text-red-700" },
    { value: "PLATELETS", label: "Platelets", color: "bg-yellow-100 text-yellow-700" },
    { value: "PLASMA", label: "Plasma", color: "bg-blue-100 text-blue-700" },
    { value: "CRYOPRECIPITATE", label: "Cryoprecipitate", color: "bg-purple-100 text-purple-700" }
];

const getBloodTypeDisplay = (bloodGroup: string, rhesusFactor: string) => {
    return `${bloodGroup}${rhesusFactor === "POSITIVE" ? "+" : "-"}`;
};

export default function CallDonorsPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const userId = searchParams.get('userId');
    const [bloodCenterId, setBloodCenterId] = useState<number | null>(null);
    const [bloodCenterName, setBloodCenterName] = useState<string>("");
    const [bloodCenterCity, setBloodCenterCity] = useState<string>("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [callHistory, setCallHistory] = useState<any[]>([]);
    const [showHistoryDialog, setShowHistoryDialog] = useState(false);
    const [stats, setStats] = useState<any>(null);
    const [showSuccessDialog, setShowSuccessDialog] = useState(false);
    const [callResult, setCallResult] = useState<any>(null);
    const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
    const [verificationStatus, setVerificationStatus] = useState<string | null>(null);
    const [rejectionReason, setRejectionReason] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        bloodGroup: "",
        rhesusFactor: "POSITIVE",
        componentType: "",
        requestedDonorsCount: 1,
        urgencyLevel: "NORMAL",
        customMessage: ""
    });

    // ============== ПРОВЕРКА ВЕРИФИКАЦИИ ==============
    const checkVerification = async () => {
        if (!userId) return;
        try {
            const headers = getAuthHeaders();
            if (!headers) return;
            const response = await fetch(`http://localhost:8080/blood-centers/by-user/${userId}`, { headers });

            if (response.status === 403) {
                setVerificationStatus("PENDING");
                setIsLoading(false);
                return;
            }

            if (response.status === 401) {
                localStorage.removeItem('token');
                router.push('/auth/login');
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
            router.push('/auth/login');
            return;
        }
        checkVerification();
    }, [userId, router]);

    useEffect(() => {
        if (verificationStatus !== "APPROVED") {
            setIsLoading(false);
            return;
        }

        const fetchCenter = async () => {
            if (!userId) return;
            try {
                const headers = getAuthHeaders();
                if (!headers) {
                    router.push('/auth/login');
                    return;
                }
                const res = await fetch(`http://localhost:8080/blood-centers/by-user/${userId}`, {
                    headers: headers
                });
                if (res.status === 401 || res.status === 403) {
                    localStorage.removeItem('token');
                    router.push('/auth/login');
                    return;
                }
                if (res.ok) {
                    const data = await res.json();
                    setBloodCenterId(data.bloodCenterId);
                    setBloodCenterName(data.name);
                    setBloodCenterCity(data.city);
                }
            } catch (err) {
                console.error("Error fetching center:", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchCenter();
    }, [userId, router, verificationStatus]);

    const fetchCallHistory = async () => {
        if (!bloodCenterId) return;
        try {
            const headers = getAuthHeaders();
            if (!headers) return;
            const res = await fetch(`http://localhost:8080/donor-calls/blood-center/${bloodCenterId}/history?days=30`, {
                headers: headers
            });
            if (res.ok) {
                const data = await res.json();
                setCallHistory(data.calls || []);
                setStats({
                    totalCalls: data.totalCalls,
                    pending: data.pending,
                    accepted: data.accepted,
                    declined: data.declined,
                    expired: data.expired
                });
            }
        } catch (err) {
            console.error("Error fetching history:", err);
        }
    };

    const checkAvailability = async () => {
        if (!bloodCenterCity || !formData.bloodGroup) {
            setError("Please select blood group first");
            return;
        }

        setIsCheckingAvailability(true);
        try {
            const headers = getAuthHeaders();
            if (!headers) return;

            const params = new URLSearchParams();
            params.append("city", bloodCenterCity);
            params.append("bloodGroup", formData.bloodGroup);
            params.append("rhesusFactor", formData.rhesusFactor);

            const response = await fetch(`http://localhost:8080/donor-calls/debug/eligible-donors?${params.toString()}`, {
                headers: headers
            });

            if (response.ok) {
                const data = await response.json();
                if (data.count === 0) {
                    setError(`No eligible donors found in ${data.city} for ${data.bloodType}`);
                } else if (data.count < formData.requestedDonorsCount) {
                    setError(`Only ${data.count} donor(s) available, but you requested ${formData.requestedDonorsCount}`);
                } else {
                    setError(null);
                    alert(`Found ${data.count} eligible donor(s) in ${data.city} for ${data.bloodType}`);
                }
            }
        } catch (err) {
            console.error("Error checking availability:", err);
        } finally {
            setIsCheckingAvailability(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!bloodCenterId || !formData.bloodGroup || !formData.componentType) {
            setError("Please fill all required fields");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const headers = getAuthHeaders();
            if (!headers) return;

            const params = new URLSearchParams();
            params.append("bloodCenterId", bloodCenterId.toString());
            params.append("bloodGroup", formData.bloodGroup);
            params.append("rhesusFactor", formData.rhesusFactor);
            params.append("componentType", formData.componentType);
            params.append("requestedDonorsCount", formData.requestedDonorsCount.toString());
            params.append("urgencyLevel", formData.urgencyLevel);
            if (formData.customMessage) params.append("customMessage", formData.customMessage);

            const response = await fetch(`http://localhost:8080/donor-calls/call?${params.toString()}`, {
                method: "POST",
                headers: headers
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setCallResult(data);
                setShowSuccessDialog(true);
                setFormData({
                    bloodGroup: "",
                    rhesusFactor: "POSITIVE",
                    componentType: "",
                    requestedDonorsCount: 1,
                    urgencyLevel: "NORMAL",
                    customMessage: ""
                });
                await fetchCallHistory();
            } else {
                setError(data.message || data.error || "Failed to call donors");
            }
        } catch (err) {
            setError("Network error. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatDate = (dateStr: string) => new Date(dateStr).toLocaleString();

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
                                <li>• After approval, you can call donors</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3">
                    <Button onClick={() => router.push('/auth/login')} variant="outline" className="flex-1 border-amber-300 text-amber-700 hover:bg-amber-50">
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
                    <Button onClick={() => router.push('/auth/login')} className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white">
                        Back to Login
                    </Button>
                </div>

                <p className="text-xs text-gray-400 mt-6">
                    Contact support: support@bloodconnect.com
                </p>
            </Card>
        </div>
    );

    // ============== РЕНДЕР ==============
    if (verificationStatus === "PENDING") {
        return renderPendingVerification();
    }

    if (verificationStatus === "REJECTED") {
        return renderRejectedVerification();
    }

    if (isLoading) {
        return (
            <>
                <BloodCenterSidebar userId={userId} />
                <main className="ml-20 lg:ml-64 p-6 flex items-center justify-center min-h-screen">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </main>
            </>
        );
    }

    const isFormValid = formData.bloodGroup && formData.componentType;

    return (
        <>
            <BloodCenterSidebar userId={userId} />
            <main className="ml-20 lg:ml-64 min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
                <div className="p-6 lg:p-8 max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                        <div>
                            <h1 className="text-3xl font-bold flex items-center gap-2">
                                <PhoneCall className="w-8 h-8 text-primary" />
                                Call Donors
                            </h1>
                            <p className="text-muted-foreground mt-1">
                                Send urgent donation requests to eligible donors
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <Button variant="outline" onClick={() => { fetchCallHistory(); setShowHistoryDialog(true); }}>
                                <Eye className="w-4 h-4 mr-2" />
                                History
                            </Button>
                            <CenterProfileCard userId={userId} />
                        </div>
                    </div>




                    {error && (
                        <Card className="p-4 mb-6 bg-red-50 border-red-200">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                                <div className="flex-1">
                                    <p className="font-semibold text-red-800">{error}</p>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => setError(null)} className="h-6 w-6 p-0">
                                    <XCircle className="w-4 h-4" />
                                </Button>
                            </div>
                        </Card>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2 space-y-6">
                                <Card className="p-6">
                                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                        <Droplet className="w-5 h-5 text-primary" />
                                        Donor Criteria
                                    </h2>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div className="space-y-2">
                                            <Label className="flex items-center gap-1">
                                                Blood Group <span className="text-red-500">*</span>
                                            </Label>
                                            <Select value={formData.bloodGroup} onValueChange={(v) => setFormData({...formData, bloodGroup: v})}>
                                                <SelectTrigger className="h-11 bg-white dark:bg-gray-800">
                                                    <SelectValue placeholder="Select blood group" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-white dark:bg-gray-800 border shadow-lg">
                                                    {bloodGroups.map(g => (
                                                        <SelectItem key={g} value={g}>{g}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="flex items-center gap-1">
                                                Rhesus Factor <span className="text-red-500">*</span>
                                            </Label>
                                            <Select value={formData.rhesusFactor} onValueChange={(v) => setFormData({...formData, rhesusFactor: v})}>
                                                <SelectTrigger className="h-11 bg-white dark:bg-gray-800">
                                                    <SelectValue placeholder="Select rhesus factor" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-white dark:bg-gray-800 border shadow-lg">
                                                    {rhesusFactors.map(rh => (
                                                        <SelectItem key={rh.value} value={rh.value}>{rh.label}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="flex items-center gap-1">
                                                Component Type <span className="text-red-500">*</span>
                                            </Label>
                                            <Select value={formData.componentType} onValueChange={(v) => setFormData({...formData, componentType: v})}>
                                                <SelectTrigger className="h-11 bg-white dark:bg-gray-800">
                                                    <SelectValue placeholder="Select component" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-white dark:bg-gray-800 border shadow-lg">
                                                    {componentTypes.map(comp => (
                                                        <SelectItem key={comp.value} value={comp.value}>{comp.label}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Number of Donors</Label>
                                            <Input
                                                type="number"
                                                min={1}
                                                max={50}
                                                value={formData.requestedDonorsCount}
                                                onChange={(e) => setFormData({...formData, requestedDonorsCount: parseInt(e.target.value) || 10})}
                                                className="h-11 bg-white dark:bg-gray-800"
                                            />
                                            <p className="text-xs text-muted-foreground">Max 50 donors per call</p>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Urgency Level</Label>
                                            <Select value={formData.urgencyLevel} onValueChange={(v) => setFormData({...formData, urgencyLevel: v})}>
                                                <SelectTrigger className="h-11 bg-white dark:bg-gray-800">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="bg-white dark:bg-gray-800 border shadow-lg">
                                                    <SelectItem value="NORMAL">Normal</SelectItem>
                                                    <SelectItem value="URGENT">Urgent</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2 flex items-end">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={checkAvailability}
                                                disabled={isCheckingAvailability || !formData.bloodGroup}
                                                className="w-full h-11"
                                            >
                                                {isCheckingAvailability ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                                                <span className="ml-2">Check Availability</span>
                                            </Button>
                                        </div>
                                    </div>
                                </Card>

                                <Card className="p-6">
                                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                        <Mail className="w-5 h-5 text-primary" />
                                        Custom Message (Optional)
                                    </h2>
                                    <Textarea
                                        placeholder="Add specific instructions or information for donors..."
                                        value={formData.customMessage}
                                        onChange={(e) => setFormData({...formData, customMessage: e.target.value})}
                                        rows={4}
                                        className="resize-none bg-white dark:bg-gray-800"
                                    />
                                </Card>
                            </div>

                            <div className="space-y-6">
                                <Card className="p-6 sticky top-6">
                                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                                        <Users className="w-4 h-4 text-primary" />
                                        Call Summary
                                    </h3>

                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center pb-2 border-b">
                                            <span className="text-muted-foreground">Blood Type</span>
                                            <span className="font-bold text-lg text-primary">
                                                {formData.bloodGroup || "—"}{formData.rhesusFactor === "POSITIVE" ? "+" : formData.rhesusFactor === "NEGATIVE" ? "-" : ""}
                                            </span>
                                        </div>

                                        <div className="flex justify-between items-center pb-2 border-b">
                                            <span className="text-muted-foreground">Component</span>
                                            <Badge variant="outline" className="font-normal">
                                                {componentTypes.find(c => c.value === formData.componentType)?.label || "—"}
                                            </Badge>
                                        </div>

                                        <div className="flex justify-between items-center pb-2 border-b">
                                            <span className="text-muted-foreground">Donors to Call</span>
                                            <span className="font-bold text-xl">{formData.requestedDonorsCount}</span>
                                        </div>

                                        <div className="flex justify-between items-center pb-2 border-b">
                                            <span className="text-muted-foreground">Urgency</span>
                                            <Badge className={formData.urgencyLevel === "URGENT" ? "bg-orange-500" : "bg-blue-500"}>
                                                {formData.urgencyLevel === "URGENT" ? "Urgent" : "Normal"}
                                            </Badge>
                                        </div>

                                        <div className="flex justify-between items-center pb-2 border-b">
                                            <span className="text-muted-foreground">Center</span>
                                            <span className="font-medium truncate max-w-[150px]" title={bloodCenterCity}>
                                                {bloodCenterCity || "—"}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="mt-6 space-y-3">
                                        <Button
                                            type="submit"
                                            disabled={isSubmitting || !isFormValid}
                                            className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                                        >
                                            {isSubmitting ? (
                                                <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Sending...</>
                                            ) : (
                                                <><Send className="w-5 h-5 mr-2" /> Send Donor Call</>
                                            )}
                                        </Button>

                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => router.push(`/dashboard/for-bloodcenter/reserve?userId=${userId}`)}
                                            className="w-full"
                                        >
                                            Cancel
                                        </Button>
                                    </div>

                                    {!isFormValid && (
                                        <p className="text-xs text-center text-muted-foreground mt-3">
                                            Please select blood group and component type
                                        </p>
                                    )}
                                </Card>
                            </div>
                        </div>
                    </form>
                </div>
            </main>

            <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
                <DialogContent className="max-w-md bg-white dark:bg-gray-900">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-green-600">
                            <CheckCircle className="w-6 h-6" />
                            Donor Call Initiated!
                        </DialogTitle>
                    </DialogHeader>
                    {callResult && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-3 gap-3 text-center">
                                <div className="p-3 bg-green-50 rounded-lg">
                                    <p className="text-2xl font-bold text-green-600">{callResult.notifiedCount}</p>
                                    <p className="text-xs text-muted-foreground">Notified</p>
                                </div>
                                <div className="p-3 bg-blue-50 rounded-lg">
                                    <p className="text-2xl font-bold text-blue-600">{callResult.emailSentCount}</p>
                                    <p className="text-xs text-muted-foreground">Emails</p>
                                </div>
                                <div className="p-3 bg-purple-50 rounded-lg">
                                    <p className="text-2xl font-bold text-purple-600">{callResult.eligibleFound}</p>
                                    <p className="text-xs text-muted-foreground">Eligible</p>
                                </div>
                            </div>
                            <div className="text-sm text-muted-foreground space-y-1">
                                <p><strong>Blood Type:</strong> {callResult.bloodType}</p>
                                <p><strong>Component:</strong> {callResult.componentType}</p>
                                <p><strong>City:</strong> {callResult.city}</p>
                            </div>
                            <Button className="w-full" onClick={() => setShowSuccessDialog(false)}>Close</Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-white dark:bg-gray-900">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-primary" />
                            Call History (Last 30 Days)
                        </DialogTitle>
                    </DialogHeader>

                    {stats && (
                        <div className="grid grid-cols-5 gap-2 mb-4 p-3 bg-muted rounded-lg text-center">
                            <div><p className="text-xl font-bold">{stats.totalCalls}</p><p className="text-xs">Total</p></div>
                            <div><p className="text-xl font-bold text-yellow-600">{stats.pending}</p><p className="text-xs">Pending</p></div>
                            <div><p className="text-xl font-bold text-green-600">{stats.accepted}</p><p className="text-xs">Accepted</p></div>
                            <div><p className="text-xl font-bold text-red-600">{stats.declined}</p><p className="text-xs">Declined</p></div>
                            <div><p className="text-xl font-bold text-gray-500">{stats.expired}</p><p className="text-xs">Expired</p></div>
                        </div>
                    )}

                    {callHistory.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Bell className="w-12 h-12 mx-auto mb-2 opacity-30" />
                            <p>No call history yet</p>
                        </div>
                    ) : (
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                            {callHistory.map((call) => (
                                <div key={call.id} className="p-3 border rounded-lg hover:shadow-md transition bg-white dark:bg-gray-800">
                                    <div className="flex justify-between items-start flex-wrap gap-2">
                                        <div>
                                            <p className="font-medium">
                                                {getBloodTypeDisplay(call.bloodGroup, call.rhesusFactor)} - {call.componentType}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {formatDate(call.createdAt)}
                                            </p>
                                        </div>
                                        <Badge className={
                                            call.status === "PENDING" ? "bg-yellow-100 text-yellow-800" :
                                                call.status === "ACCEPTED" ? "bg-green-100 text-green-800" :
                                                    call.status === "DECLINED" ? "bg-red-100 text-red-800" :
                                                        "bg-gray-100"
                                        }>
                                            {call.status}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowHistoryDialog(false)}>Close</Button>
                        <Button variant="outline" onClick={() => { fetchCallHistory(); }}><RefreshCw className="w-4 h-4 mr-2" />Refresh</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}