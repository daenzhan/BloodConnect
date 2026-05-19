"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { BloodCenterSidebar } from "../components/sidebar";
import { CenterProfileCard } from "../components/center-profile-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Search, Calendar as CalendarIcon, User, CheckCircle, XCircle, Clock, Droplet, Loader2, AlertTriangle, FlaskConical } from "lucide-react";

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

interface Appointment {
    appointmentId: number;
    appointmentDate: string;
    status: string;
    notes: string;
    donor: {
        donorId: number;
        firstName: string;
        lastName: string;
        bloodGroup?: string;
        rhesusFactor?: string;
    };
    donation?: {
        donationId: number;
        status: string;
    };
}

interface Analysis {
    analysisId: number;
    status: string;
    hiv?: string;
    brucellosis?: string;
    hepatitisB?: string;
    hepatitisC?: string;
    syphilis?: string;
    altLevel?: number;
    bloodGroup?: string;
    rhesusFactor?: string;
    hemoglobin?: number;
    technicianNotes?: string;
    analysisDate?: string;
    donationId: number;
    bloodCenterId: number;
    isComplete: boolean;
    isDonorEligible: boolean;
}

const statusColors: Record<string, string> = {
    SCHEDULED: "bg-blue-100 text-blue-800 border-blue-200",
    COMPLETED: "bg-green-100 text-green-800 border-green-200",
    CANCELLED: "bg-red-100 text-red-800 border-red-200",
    IN_PROGRESS: "bg-purple-100 text-purple-800 border-purple-200",
};

const statusLabels: Record<string, string> = {
    SCHEDULED: "Scheduled",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
    IN_PROGRESS: "In Progress",
};

const formatBloodType = (bloodGroup?: string, rhesusFactor?: string): string => {
    if (!bloodGroup) return "Unknown";
    const rh = rhesusFactor?.toLowerCase().includes("positive") ? "+" :
        rhesusFactor?.toLowerCase().includes("negative") ? "-" : "";
    return `${bloodGroup}${rh}`;
};

export default function AppointmentsPage() {
    const searchParams = useSearchParams();
    const userId = searchParams.get('userId');

    const [bloodCenterId, setBloodCenterId] = useState<number | null>(null);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [isLoading, setIsLoading] = useState(true);
    const [updatingStatus, setUpdatingStatus] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Analysis states
    const [analysisDialogOpen, setAnalysisDialogOpen] = useState(false);
    const [currentAnalysis, setCurrentAnalysis] = useState<Analysis | null>(null);
    const [currentDonationId, setCurrentDonationId] = useState<number | null>(null);
    const [analysisFormData, setAnalysisFormData] = useState({
        hiv: "NEGATIVE",
        brucellosis: "NEGATIVE",
        hepatitisB: "NEGATIVE",
        hepatitisC: "NEGATIVE",
        syphilis: "NEGATIVE",
        altLevel: "",
        bloodGroup: "",
        rhesusFactor: "",
        hemoglobin: "",
        technicianNotes: ""
    });
    const [isCreatingAnalysis, setIsCreatingAnalysis] = useState(false);
    const [isSavingAnalysis, setIsSavingAnalysis] = useState(false);

    const [confirmDialog, setConfirmDialog] = useState<{
        isOpen: boolean;
        appointmentId: number | null;
        donorName: string;
    }>({
        isOpen: false,
        appointmentId: null,
        donorName: "",
    });

    const fetchBloodCenterId = useCallback(async () => {
        if (!userId) return;

        setError(null);
        try {
            const headers = getAuthHeaders();
            if (!headers) {
                window.location.href = '/auth/login';
                return;
            }
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);

            const response = await fetch(`http://localhost:8080/blood-centers/by-user/${userId}`, {
                signal: controller.signal,
                headers: headers
            });

            clearTimeout(timeoutId);
            if (checkAuthAndRedirect(response)) return;
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            if (!data.bloodCenterId || data.bloodCenterId <= 0) {
                throw new Error("Invalid blood center ID");
            }

            setBloodCenterId(data.bloodCenterId);
        } catch (error) {
            console.error("Error fetching blood center:", error);
            setError(error instanceof Error ? error.message : "Failed to load blood center");
        }
    }, [userId]);

    const fetchAppointments = useCallback(async () => {
        if (!bloodCenterId) return;

        setIsLoading(true);
        setError(null);

        try {
            const headers = getAuthHeaders();
            if (!headers) {
                window.location.href = '/auth/login';
                return;
            }
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);

            const response = await fetch(`http://localhost:8080/appointments/bloodcenter/${bloodCenterId}`, {
                signal: controller.signal,
                headers: headers
            });

            clearTimeout(timeoutId);
            if (checkAuthAndRedirect(response)) return;
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            setAppointments(data);
            setFilteredAppointments(data);
        } catch (error) {
            console.error("Error fetching appointments:", error);
            setError(error instanceof Error ? error.message : "Failed to load appointments");
        } finally {
            setIsLoading(false);
        }
    }, [bloodCenterId]);

    const fetchAnalysis = async (donationId: number) => {
        try {
            const headers = getAuthHeaders();
            if (!headers) return null;

            const response = await fetch(`http://localhost:8080/analyses/donation/${donationId}`, {
                headers: headers
            });

            if (response.status === 404) {
                return null;
            }

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            return data as Analysis;
        } catch (error) {
            console.error("Error fetching analysis:", error);
            return null;
        }
    };

    const createAnalysis = async (donationId: number) => {
        if (!bloodCenterId) return null;

        try {
            const headers = getAuthHeaders();
            if (!headers) return null;

            const response = await fetch(`http://localhost:8080/analyses/create-for-donation/${donationId}?bloodCenterId=${bloodCenterId}`, {
                method: "POST",
                headers: headers
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            return data as Analysis;
        } catch (error) {
            console.error("Error creating analysis:", error);
            return null;
        }
    };

    const updateAnalysis = async (analysisId: number, updates: any) => {
        try {
            const headers = getAuthHeaders();
            if (!headers) return null;

            const response = await fetch(`http://localhost:8080/analyses/${analysisId}`, {
                method: "PUT",
                headers: headers,
                body: JSON.stringify(updates)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error("Error updating analysis:", error);
            throw error;
        }
    };

    const handleAddAnalysis = async (appointment: Appointment) => {
        if (!appointment.donation?.donationId) {
            alert("Donation record not found. Please start the appointment first.");
            return;
        }

        setCurrentDonationId(appointment.donation.donationId);
        setIsCreatingAnalysis(true);

        try {
            // Check if analysis already exists
            let analysis = await fetchAnalysis(appointment.donation.donationId);

            if (!analysis) {
                // Create new analysis
                analysis = await createAnalysis(appointment.donation.donationId);
                if (!analysis) {
                    alert("Failed to create analysis record");
                    return;
                }
            }

            // Load analysis data into form
            setCurrentAnalysis(analysis);
            setAnalysisFormData({
                hiv: analysis.hiv || "NEGATIVE",
                brucellosis: analysis.brucellosis || "NEGATIVE",
                hepatitisB: analysis.hepatitisB || "NEGATIVE",
                hepatitisC: analysis.hepatitisC || "NEGATIVE",
                syphilis: analysis.syphilis || "NEGATIVE",
                altLevel: analysis.altLevel?.toString() || "",
                bloodGroup: analysis.bloodGroup || "",
                rhesusFactor: analysis.rhesusFactor || "",
                hemoglobin: analysis.hemoglobin?.toString() || "",
                technicianNotes: analysis.technicianNotes || ""
            });

            setAnalysisDialogOpen(true);
        } catch (error) {
            console.error("Error in handleAddAnalysis:", error);
            alert("Failed to load analysis data");
        } finally {
            setIsCreatingAnalysis(false);
        }
    };

    const handleSaveAnalysis = async () => {
        if (!currentAnalysis || !currentAnalysis.analysisId) {
            alert("No analysis record found");
            return;
        }

        // Validate required fields
        if (!analysisFormData.bloodGroup) {
            alert("Please select blood group");
            return;
        }
        if (!analysisFormData.rhesusFactor) {
            alert("Please select rhesus factor");
            return;
        }

        setIsSavingAnalysis(true);

        try {
            const updates: any = {
                hiv: analysisFormData.hiv,
                brucellosis: analysisFormData.brucellosis,
                hepatitisB: analysisFormData.hepatitisB,
                hepatitisC: analysisFormData.hepatitisC,
                syphilis: analysisFormData.syphilis,
                bloodGroup: analysisFormData.bloodGroup,
                rhesusFactor: analysisFormData.rhesusFactor,
                technicianNotes: analysisFormData.technicianNotes || ""
            };

            if (analysisFormData.altLevel) {
                updates.altLevel = parseFloat(analysisFormData.altLevel);
            }
            if (analysisFormData.hemoglobin) {
                updates.hemoglobin = parseFloat(analysisFormData.hemoglobin);
            }

            await updateAnalysis(currentAnalysis.analysisId, updates);

            alert("Analysis saved successfully!");
            setAnalysisDialogOpen(false);

            // Refresh appointments to show updated status
            await fetchAppointments();
        } catch (error) {
            console.error("Error saving analysis:", error);
            alert("Failed to save analysis");
        } finally {
            setIsSavingAnalysis(false);
        }
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            console.log("No token found on appointments page");
            window.location.href = '/auth/login';
            return;
        }
        fetchBloodCenterId();
    }, [fetchBloodCenterId]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            console.log("No token found on appointments page");
            window.location.href = '/auth/login';
            return;
        }
        if (bloodCenterId) {
            fetchAppointments();
        }
    }, [bloodCenterId, fetchAppointments]);

    useEffect(() => {
        let result = [...appointments];

        if (searchTerm.trim()) {
            const searchLower = searchTerm.toLowerCase();
            result = result.filter(apt =>
                apt.donor?.firstName?.toLowerCase().includes(searchLower) ||
                apt.donor?.lastName?.toLowerCase().includes(searchLower)
            );
        }

        if (statusFilter !== "ALL") {
            result = result.filter(apt => apt.status === statusFilter);
        }

        setFilteredAppointments(result);
    }, [searchTerm, statusFilter, appointments]);

    const formatDate = (dateStr: string) => {
        try {
            return new Date(dateStr).toLocaleString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            });
        } catch {
            return "Invalid date";
        }
    };

    const handleStartAppointment = async (appointmentId: number) => {
        setUpdatingStatus(appointmentId);
        setError(null);
        try {
            const headers = getAuthHeaders();
            if (!headers) {
                window.location.href = '/auth/login';
                return;
            }
            const response = await fetch(`http://localhost:8080/appointments/${appointmentId}/start`, {
                method: "PUT",
                headers: headers,
            });
            if (checkAuthAndRedirect(response)) return;
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || "Failed to start appointment");
            }

            await fetchAppointments();
            alert("Appointment started! Donation record created.");

        } catch (error) {
            console.error("Error starting appointment:", error);
            setError(error instanceof Error ? error.message : "Failed to start appointment");
            alert(`Failed to start appointment: ${error instanceof Error ? error.message : "Please try again"}`);
        } finally {
            setUpdatingStatus(null);
        }
    };

    const handleCancelAppointment = async (appointmentId: number) => {
        setUpdatingStatus(appointmentId);
        setError(null);

        try {
            const headers = getAuthHeaders();
            if (!headers) {
                window.location.href = '/auth/login';
                return;
            }
            const response = await fetch(`http://localhost:8080/appointments/${appointmentId}/cancel`, {
                method: "PUT",
                headers: headers,
            });
            if (checkAuthAndRedirect(response)) return;
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || "Failed to cancel appointment");
            }

            await fetchAppointments();
            alert("Appointment cancelled successfully");

        } catch (error) {
            console.error("Error cancelling appointment:", error);
            setError(error instanceof Error ? error.message : "Failed to cancel appointment");
            alert(`Failed to cancel appointment: ${error instanceof Error ? error.message : "Please try again"}`);
        } finally {
            setUpdatingStatus(null);
        }
    };

    const handleCompleteDonation = async (appointmentId: number) => {
        setUpdatingStatus(appointmentId);
        setError(null);

        try {
            const headers = getAuthHeaders();
            if (!headers) {
                window.location.href = '/auth/login';
                return;
            }
            const response = await fetch(`http://localhost:8080/appointments/${appointmentId}/complete-donation`, {
                method: "PUT",
                headers: headers,
            });
            if (checkAuthAndRedirect(response)) return;
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || "Failed to complete donation");
            }

            await fetchAppointments();
            alert("Donation completed successfully!");

        } catch (error) {
            console.error("Error completing donation:", error);
            setError(error instanceof Error ? error.message : "Failed to complete donation");
            alert(`Failed to complete donation: ${error instanceof Error ? error.message : "Please try again"}`);
        } finally {
            setUpdatingStatus(null);
            setConfirmDialog({ isOpen: false, appointmentId: null, donorName: "" });
        }
    };

    const openConfirmDialog = (appointmentId: number, donorName: string) => {
        setConfirmDialog({
            isOpen: true,
            appointmentId,
            donorName,
        });
    };

    if (!userId) {
        return (
            <div className="flex min-h-screen bg-gray-50">
                <BloodCenterSidebar userId={userId} />
                <main className="flex-1 p-6">
                    <Card className="p-6 text-center">
                        <p className="text-red-600">Access Denied: User ID not found</p>
                    </Card>
                </main>
            </div>
        );
    }

    return (
        <>
            <BloodCenterSidebar userId={userId} />
            <main className="ml-20 lg:ml-64 p-6 lg:p-8 min-h-screen overflow-auto bg-gray-50">
                <header className="flex items-start justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-bold">Appointments</h1>
                        <p className="text-sm text-gray-500 mt-1">Manage donor appointments and track donations</p>
                    </div>
                    <CenterProfileCard userId={userId} />
                </header>

                {error && (
                    <Card className="p-4 mb-5 bg-red-50 border-red-200">
                        <p className="text-red-600 text-sm">{error}</p>
                        <Button
                            variant="outline"
                            size="sm"
                            className="mt-2"
                            onClick={() => {
                                setError(null);
                                fetchAppointments();
                            }}
                        >
                            Retry
                        </Button>
                    </Card>
                )}

                <Card className="p-3 mb-5">
                    <div className="flex flex-wrap gap-3">
                        <div className="flex-1 min-w-64">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                    placeholder="Search by donor name..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-9 h-9 text-sm"
                                    disabled={isLoading}
                                />
                            </div>
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter} disabled={isLoading}>
                            <SelectTrigger className="w-40 h-9 text-sm">
                                <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">All Statuses</SelectItem>
                                <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                                <SelectItem value="COMPLETED">Completed</SelectItem>
                                <SelectItem value="CANCELLED">Cancelled</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </Card>

                {filteredAppointments.length === 0 ? (
                    <Card className="p-12 text-center">
                        <p className="text-gray-500">No appointments found</p>
                        {(searchTerm || statusFilter !== "ALL") && (
                            <Button
                                variant="link"
                                onClick={() => {
                                    setSearchTerm("");
                                    setStatusFilter("ALL");
                                }}
                                className="mt-2"
                            >
                                Clear filters
                            </Button>
                        )}
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {filteredAppointments.map((apt) => (
                            <Card key={apt.appointmentId} className="p-4 hover:shadow-md transition-shadow">
                                <div className="flex items-center justify-between flex-wrap gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                                            <User className="w-5 h-5 text-red-600" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                                <h3 className="font-medium text-gray-900 text-sm">
                                                    {apt.donor?.firstName || "Unknown"} {apt.donor?.lastName || ""}
                                                </h3>
                                                <Badge variant="outline" className={`text-xs ${statusColors[apt.status] || "bg-gray-100"}`}>
                                                    {statusLabels[apt.status] || apt.status}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
                                                <span className="flex items-center gap-1">
                                                    <CalendarIcon className="w-3 h-3" />
                                                    {formatDate(apt.appointmentDate)}
                                                </span>
                                                {(apt.donor?.bloodGroup || apt.donor?.rhesusFactor) && (
                                                    <span className="flex items-center gap-1">
                                                        <Droplet className="w-3 h-3 text-red-500" />
                                                        {formatBloodType(apt.donor?.bloodGroup, apt.donor?.rhesusFactor)}
                                                    </span>
                                                )}
                                            </div>
                                            {apt.notes && (
                                                <p className="text-xs text-gray-400 mt-1 max-w-md truncate">
                                                    Note: {apt.notes}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        {apt.status === "SCHEDULED" && (
                                            <>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-8 text-xs"
                                                    onClick={() => handleStartAppointment(apt.appointmentId)}
                                                    disabled={updatingStatus === apt.appointmentId}
                                                >
                                                    {updatingStatus === apt.appointmentId ? (
                                                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                                    ) : (
                                                        <Clock className="w-3 h-3 mr-1" />
                                                    )}
                                                    Start
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-8 text-xs text-red-600 hover:text-red-700"
                                                    onClick={() => handleCancelAppointment(apt.appointmentId)}
                                                    disabled={updatingStatus === apt.appointmentId}
                                                >
                                                    <XCircle className="w-3 h-3 mr-1" />
                                                    Cancel
                                                </Button>
                                            </>
                                        )}

                                        {apt.status === "IN_PROGRESS" && (
                                            <>
                                                <Button
                                                    size="sm"
                                                    className="h-8 text-xs bg-green-600 hover:bg-green-700 text-white"
                                                    onClick={() => openConfirmDialog(apt.appointmentId, `${apt.donor?.firstName} ${apt.donor?.lastName}`)}
                                                    disabled={updatingStatus === apt.appointmentId}
                                                >
                                                    {updatingStatus === apt.appointmentId ? (
                                                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                                    ) : (
                                                        <CheckCircle className="w-3 h-3 mr-1" />
                                                    )}
                                                    Complete Donation
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-8 text-xs text-red-600 hover:text-red-700"
                                                    onClick={() => handleCancelAppointment(apt.appointmentId)}
                                                    disabled={updatingStatus === apt.appointmentId}
                                                >
                                                    <XCircle className="w-3 h-3 mr-1" />
                                                    Cancel
                                                </Button>
                                            </>
                                        )}

                                        {apt.status === "COMPLETED" && (
                                            <>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white"
                                                    onClick={() => handleAddAnalysis(apt)}
                                                    disabled={isCreatingAnalysis}
                                                >
                                                    {isCreatingAnalysis ? (
                                                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                                    ) : (
                                                        <FlaskConical className="w-3 h-3 mr-1" />
                                                    )}
                                                    Add Analysis
                                                </Button>
                                                <Badge variant="outline" className="bg-green-100 text-green-800">
                                                    <CheckCircle className="w-3 h-3 mr-1" />
                                                    Donation Recorded
                                                </Badge>
                                            </>
                                        )}

                                        {apt.status === "CANCELLED" && (
                                            <Badge variant="outline" className="bg-red-100 text-red-800">
                                                <XCircle className="w-3 h-3 mr-1" />
                                                Cancelled
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </main>

            {/* Analysis Dialog */}
            <Dialog open={analysisDialogOpen} onOpenChange={setAnalysisDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FlaskConical className="w-5 h-5 text-blue-600" />
                            Blood Analysis Results
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {/* Infectious Diseases */}
                        <div className="space-y-3">
                            <h3 className="font-semibold text-sm text-gray-700">Infectious Disease Markers</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs text-gray-600">HIV</label>
                                    <Select
                                        value={analysisFormData.hiv}
                                        onValueChange={(v) => setAnalysisFormData({...analysisFormData, hiv: v})}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="NEGATIVE">Negative</SelectItem>
                                            <SelectItem value="POSITIVE">Positive</SelectItem>
                                            <SelectItem value="PENDING">Pending</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-600">Brucellosis</label>
                                    <Select
                                        value={analysisFormData.brucellosis}
                                        onValueChange={(v) => setAnalysisFormData({...analysisFormData, brucellosis: v})}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="NEGATIVE">Negative</SelectItem>
                                            <SelectItem value="POSITIVE">Positive</SelectItem>
                                            <SelectItem value="PENDING">Pending</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-600">Hepatitis B</label>
                                    <Select
                                        value={analysisFormData.hepatitisB}
                                        onValueChange={(v) => setAnalysisFormData({...analysisFormData, hepatitisB: v})}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="NEGATIVE">Negative</SelectItem>
                                            <SelectItem value="POSITIVE">Positive</SelectItem>
                                            <SelectItem value="PENDING">Pending</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-600">Hepatitis C</label>
                                    <Select
                                        value={analysisFormData.hepatitisC}
                                        onValueChange={(v) => setAnalysisFormData({...analysisFormData, hepatitisC: v})}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="NEGATIVE">Negative</SelectItem>
                                            <SelectItem value="POSITIVE">Positive</SelectItem>
                                            <SelectItem value="PENDING">Pending</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-600">Syphilis</label>
                                    <Select
                                        value={analysisFormData.syphilis}
                                        onValueChange={(v) => setAnalysisFormData({...analysisFormData, syphilis: v})}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="NEGATIVE">Negative</SelectItem>
                                            <SelectItem value="POSITIVE">Positive</SelectItem>
                                            <SelectItem value="PENDING">Pending</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        {/* Blood Typing */}
                        <div className="space-y-3">
                            <h3 className="font-semibold text-sm text-gray-700">Blood Typing</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs text-gray-600">Blood Group *</label>
                                    <Select
                                        value={analysisFormData.bloodGroup}
                                        onValueChange={(v) => setAnalysisFormData({...analysisFormData, bloodGroup: v})}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="A">A</SelectItem>
                                            <SelectItem value="B">B</SelectItem>
                                            <SelectItem value="AB">AB</SelectItem>
                                            <SelectItem value="O">O</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-600">Rhesus Factor *</label>
                                    <Select
                                        value={analysisFormData.rhesusFactor}
                                        onValueChange={(v) => setAnalysisFormData({...analysisFormData, rhesusFactor: v})}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="POSITIVE">Positive (+)</SelectItem>
                                            <SelectItem value="NEGATIVE">Negative (-)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        {/* Biochemistry */}
                        <div className="space-y-3">
                            <h3 className="font-semibold text-sm text-gray-700">Biochemistry</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs text-gray-600">ALT Level (U/L)</label>
                                    <Input
                                        type="number"
                                        step="0.1"
                                        value={analysisFormData.altLevel}
                                        onChange={(e) => setAnalysisFormData({...analysisFormData, altLevel: e.target.value})}
                                        placeholder="Normal: < 40"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-600">Hemoglobin (g/L)</label>
                                    <Input
                                        type="number"
                                        step="0.1"
                                        value={analysisFormData.hemoglobin}
                                        onChange={(e) => setAnalysisFormData({...analysisFormData, hemoglobin: e.target.value})}
                                        placeholder="Women: >125, Men: >135"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Technician Notes */}
                        <div className="space-y-2">
                            <label className="text-xs text-gray-600">Technician Notes</label>
                            <textarea
                                className="w-full border rounded-md p-2 text-sm"
                                rows={3}
                                value={analysisFormData.technicianNotes}
                                onChange={(e) => setAnalysisFormData({...analysisFormData, technicianNotes: e.target.value})}
                                placeholder="Additional observations or notes..."
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAnalysisDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSaveAnalysis}
                            disabled={isSavingAnalysis}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            {isSavingAnalysis ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                "Save Analysis"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Confirm Complete Donation Dialog */}
            <Dialog
                open={confirmDialog.isOpen}
                onOpenChange={(open) => !open && setConfirmDialog({ isOpen: false, appointmentId: null, donorName: "" })}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-yellow-600" />
                            Confirm Donation Completion
                        </DialogTitle>
                    </DialogHeader>
                    <div className="pt-4">
                        <p className="text-sm text-gray-600">
                            Are you sure you want to complete the donation for <strong>{confirmDialog.donorName}</strong>?
                        </p>
                    </div>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 my-2">
                        <p className="text-sm text-yellow-800">
                            This action will mark the donation as completed. You'll be able to add analysis results afterward.
                        </p>
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="outline"
                            onClick={() => setConfirmDialog({ isOpen: false, appointmentId: null, donorName: "" })}
                            disabled={updatingStatus === confirmDialog.appointmentId}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={() => confirmDialog.appointmentId && handleCompleteDonation(confirmDialog.appointmentId)}
                            disabled={updatingStatus === confirmDialog.appointmentId}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            {updatingStatus === confirmDialog.appointmentId ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Yes, Complete Donation
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}