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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Search, Calendar as CalendarIcon, User, CheckCircle, XCircle, Clock, Droplet, Loader2, AlertTriangle, FlaskConical, FileText, Droplets, Microscope, Stethoscope } from "lucide-react";

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
    hiv: string | null;
    brucellosis: string | null;
    hepatitisB: string | null;
    hepatitisC: string | null;
    syphilis: string | null;
    altLevel: number | null;
    bloodGroup: string | null;
    rhesusFactor: string | null;
    hemoglobin: number | null;
    technicianNotes: string | null;
    analysisDate: string;
    donationId: number;
    bloodCenterId: number;
    isComplete: boolean;
    isDonorEligible?: boolean;
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

    const [confirmDialog, setConfirmDialog] = useState<{
        isOpen: boolean;
        appointmentId: number | null;
        donorName: string;
    }>({
        isOpen: false,
        appointmentId: null,
        donorName: "",
    });

    const [analysisDialog, setAnalysisDialog] = useState<{
        isOpen: boolean;
        appointmentId: number | null;
        donationId: number | null;
        donorName: string;
        donorBloodGroup?: string;
        donorRhesusFactor?: string;
        analysis: Analysis | null;
        isLoading: boolean;
        isSaving: boolean;
    }>({
        isOpen: false,
        appointmentId: null,
        donationId: null,
        donorName: "",
        analysis: null,
        isLoading: false,
        isSaving: false,
    });

    const [analysisForm, setAnalysisForm] = useState<Partial<Analysis>>({
        hiv: null,
        brucellosis: null,
        hepatitisB: null,
        hepatitisC: null,
        syphilis: null,
        altLevel: null,
        bloodGroup: null,
        rhesusFactor: null,
        hemoglobin: null,
        technicianNotes: null,
    });

    const fetchBloodCenterId = useCallback(async () => {
        if (!userId) return;

        setError(null);
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);

            const response = await fetch(`http://localhost:8080/blood-centers/by-user/${userId}`, {
                signal: controller.signal
            });

            clearTimeout(timeoutId);

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
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);

            const response = await fetch(`http://localhost:8080/appointments/bloodcenter/${bloodCenterId}`, {
                signal: controller.signal
            });

            clearTimeout(timeoutId);

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

    // Функция для создания анализа, если он не существует
    const createAnalysis = async (donationId: number, bloodCenterId: number) => {
        try {
            console.log("Creating analysis for donationId:", donationId, "bloodCenterId:", bloodCenterId);
            const response = await fetch(`http://localhost:8080/analyses/create-for-donation/${donationId}?bloodCenterId=${bloodCenterId}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            console.log("Create analysis response status:", response.status);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || "Failed to create analysis");
            }

            const result = await response.json();
            console.log("Create analysis result:", result);
            return result;
        } catch (error) {
            console.error("Error creating analysis:", error);
            throw error;
        }
    };

    const fetchAnalysis = async (donationId: number) => {
        try {
            console.log("Fetching analysis for donationId:", donationId);
            const response = await fetch(`http://localhost:8080/analyses/donation/${donationId}`);
            console.log("Fetch analysis response status:", response.status);

            if (response.status === 404) {
                console.log("Analysis not found (404)");
                return null;
            }

            if (!response.ok) {
                throw new Error(`Failed to fetch analysis: ${response.status}`);
            }

            const data = await response.json();
            console.log("Fetched analysis data:", data);

            if (data.exists === false) {
                return null;
            }
            return data as Analysis;
        } catch (error) {
            console.error("Error fetching analysis:", error);
            return null;
        }
    };

    const saveAnalysis = async (analysisId: number, formData: Partial<Analysis>) => {
        // Подготавливаем данные для отправки - убираем undefined значения
        const cleanedData: Record<string, any> = {};

        if (formData.hiv !== undefined && formData.hiv !== "") cleanedData.hiv = formData.hiv;
        if (formData.brucellosis !== undefined && formData.brucellosis !== "") cleanedData.brucellosis = formData.brucellosis;
        if (formData.hepatitisB !== undefined && formData.hepatitisB !== "") cleanedData.hepatitisB = formData.hepatitisB;
        if (formData.hepatitisC !== undefined && formData.hepatitisC !== "") cleanedData.hepatitisC = formData.hepatitisC;
        if (formData.syphilis !== undefined && formData.syphilis !== "") cleanedData.syphilis = formData.syphilis;
        if (formData.altLevel !== undefined && formData.altLevel !== null && formData.altLevel !== "") cleanedData.altLevel = formData.altLevel;
        if (formData.bloodGroup !== undefined && formData.bloodGroup !== "") cleanedData.bloodGroup = formData.bloodGroup;
        if (formData.rhesusFactor !== undefined && formData.rhesusFactor !== "") cleanedData.rhesusFactor = formData.rhesusFactor;
        if (formData.hemoglobin !== undefined && formData.hemoglobin !== null && formData.hemoglobin !== "") cleanedData.hemoglobin = formData.hemoglobin;
        if (formData.technicianNotes !== undefined) cleanedData.technicianNotes = formData.technicianNotes;

        console.log("=== SAVING ANALYSIS ===");
        console.log("Analysis ID:", analysisId);
        console.log("Cleaned data to send:", cleanedData);

        const response = await fetch(`http://localhost:8080/analyses/${analysisId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify(cleanedData),
        });

        console.log("Response status:", response.status);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error("Error response body:", errorData);
            throw new Error(errorData.error || `Failed to save analysis: HTTP ${response.status}`);
        }

        const result = await response.json();
        console.log("Save result:", result);
        return result;
    };

    useEffect(() => {
        fetchBloodCenterId();
    }, [fetchBloodCenterId]);

    useEffect(() => {
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
            const response = await fetch(`http://localhost:8080/appointments/${appointmentId}/start`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || "Failed to start appointment");
            }

            await fetchAppointments();
            alert("✅ Appointment started! Donation record created.");

        } catch (error) {
            console.error("Error starting appointment:", error);
            setError(error instanceof Error ? error.message : "Failed to start appointment");
            alert(`❌ Failed to start appointment: ${error instanceof Error ? error.message : "Please try again"}`);
        } finally {
            setUpdatingStatus(null);
        }
    };

    const handleCancelAppointment = async (appointmentId: number) => {
        setUpdatingStatus(appointmentId);
        setError(null);

        try {
            const response = await fetch(`http://localhost:8080/appointments/${appointmentId}/cancel`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || "Failed to cancel appointment");
            }

            await fetchAppointments();
            alert("✅ Appointment cancelled successfully");

        } catch (error) {
            console.error("Error cancelling appointment:", error);
            setError(error instanceof Error ? error.message : "Failed to cancel appointment");
            alert(`❌ Failed to cancel appointment: ${error instanceof Error ? error.message : "Please try again"}`);
        } finally {
            setUpdatingStatus(null);
        }
    };

    const handleCompleteDonation = async (appointmentId: number) => {
        setUpdatingStatus(appointmentId);
        setError(null);

        try {
            const response = await fetch(`http://localhost:8080/appointments/${appointmentId}/complete-donation`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || "Failed to complete donation");
            }

            await fetchAppointments();
            alert("✅ Donation completed successfully! Analysis is now pending.");

        } catch (error) {
            console.error("Error completing donation:", error);
            setError(error instanceof Error ? error.message : "Failed to complete donation");
            alert(`❌ Failed to complete donation: ${error instanceof Error ? error.message : "Please try again"}`);
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

    const openAnalysisDialog = async (appointment: Appointment) => {
        console.log("Opening analysis dialog for appointment:", appointment);

        setAnalysisDialog({
            isOpen: true,
            appointmentId: appointment.appointmentId,
            donationId: appointment.donation?.donationId || null,
            donorName: `${appointment.donor?.firstName} ${appointment.donor?.lastName}`,
            donorBloodGroup: appointment.donor?.bloodGroup,
            donorRhesusFactor: appointment.donor?.rhesusFactor,
            analysis: null,
            isLoading: true,
            isSaving: false,
        });

        if (appointment.donation?.donationId) {
            let analysis = await fetchAnalysis(appointment.donation.donationId);

            // Если анализ не существует, создаём его
            if (!analysis && bloodCenterId) {
                console.log("Analysis not found, creating new one...");
                try {
                    const createResult = await createAnalysis(appointment.donation.donationId, bloodCenterId);
                    console.log("Analysis created:", createResult);
                    // После создания, получаем анализ снова
                    analysis = await fetchAnalysis(appointment.donation.donationId);
                } catch (error) {
                    console.error("Failed to create analysis:", error);
                    alert("Failed to create analysis. Please try again.");
                    setAnalysisDialog(prev => ({ ...prev, isOpen: false, isLoading: false }));
                    return;
                }
            }

            if (analysis) {
                console.log("Analysis loaded:", analysis);
                setAnalysisDialog(prev => ({ ...prev, analysis, isLoading: false }));
                setAnalysisForm({
                    hiv: analysis.hiv,
                    brucellosis: analysis.brucellosis,
                    hepatitisB: analysis.hepatitisB,
                    hepatitisC: analysis.hepatitisC,
                    syphilis: analysis.syphilis,
                    altLevel: analysis.altLevel,
                    bloodGroup: analysis.bloodGroup,
                    rhesusFactor: analysis.rhesusFactor,
                    hemoglobin: analysis.hemoglobin,
                    technicianNotes: analysis.technicianNotes,
                });
            } else {
                console.error("Still no analysis after creation attempt");
                alert("Could not create or load analysis. Please check server logs.");
                setAnalysisDialog(prev => ({ ...prev, isLoading: false, isOpen: false }));
            }
        } else {
            console.warn("No donationId found for appointment:", appointment.appointmentId);
            alert("No donation record found. Please complete the donation first.");
            setAnalysisDialog(prev => ({ ...prev, isLoading: false, isOpen: false }));
        }
    };

    const handleSaveAnalysis = async () => {
        console.log("=== HANDLE SAVE ANALYSIS CALLED ===");

        if (!analysisDialog.analysis || !analysisDialog.analysis.analysisId) {
            console.error("No analysis found to save", analysisDialog.analysis);
            alert("No analysis found to save. Please try reopening the form.");
            return;
        }

        console.log("Saving analysis ID:", analysisDialog.analysis.analysisId);
        console.log("Current form data:", analysisForm);

        setAnalysisDialog(prev => ({ ...prev, isSaving: true }));

        try {
            const result = await saveAnalysis(analysisDialog.analysis.analysisId, analysisForm);

            if (result.isComplete) {
                if (result.isDonorEligible) {
                    alert("✅ Analysis completed! Donor is ELIGIBLE. Donation has been approved.");
                } else {
                    alert("⚠️ Analysis completed! Donor is NOT ELIGIBLE. Donation has been rejected.");
                }
            } else {
                alert("✅ Analysis saved successfully! You can continue filling later.");
            }

            await fetchAppointments();
            setAnalysisDialog(prev => ({ ...prev, isOpen: false }));
        } catch (error) {
            console.error("Error saving analysis:", error);
            alert(error instanceof Error ? error.message : "Failed to save analysis. Check console for details.");
        } finally {
            setAnalysisDialog(prev => ({ ...prev, isSaving: false }));
        }
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
        <div className="flex min-h-screen bg-gray-50">
            <BloodCenterSidebar userId={userId} />
            <main className="flex-1 p-6 lg:p-8 overflow-auto">
                <header className="flex items-start justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-800">Appointments</h1>
                        <p className="text-sm text-gray-500 mt-1">Manage donor appointments and track donations</p>
                    </div>
                    <CenterProfileCard name="City Blood Center" city="Almaty" />
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

                {isLoading ? (
                    <div className="text-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400 mb-2" />
                        <p className="text-gray-500 text-sm">Loading appointments...</p>
                    </div>
                ) : filteredAppointments.length === 0 ? (
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
                                                    className="h-8 text-xs bg-purple-600 hover:bg-purple-700 text-white"
                                                    onClick={() => openAnalysisDialog(apt)}
                                                    disabled={updatingStatus === apt.appointmentId}
                                                >
                                                    <FlaskConical className="w-3 h-3 mr-1" />
                                                    Fill Analysis
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
                            ⚠️ After completion, you will need to fill in the analysis results separately.
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

            {/* Analysis Form Dialog */}
            <Dialog
                open={analysisDialog.isOpen}
                onOpenChange={(open) => !open && setAnalysisDialog(prev => ({ ...prev, isOpen: false }))}
            >
                <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 bg-white">
                    {analysisDialog.isLoading ? (
                        <div className="text-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400 mb-2" />
                            <p className="text-gray-500">Loading analysis data...</p>
                        </div>
                    ) : (
                        <>
                            {/* Header */}
                            <div className="px-6 py-4 border-b bg-white rounded-t-lg">
                                <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2 text-xl">
                                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                                            <FlaskConical className="w-4 h-4 text-purple-600" />
                                        </div>
                                        Blood Analysis Report
                                    </DialogTitle>
                                </DialogHeader>

                                {/* Donor Info */}
                                <div className="mt-3">
                                    <div className="flex items-center justify-between flex-wrap gap-3">
                                        <div className="text-sm text-gray-600">
                                            Donor: <strong className="text-gray-900">{analysisDialog.donorName}</strong>
                                        </div>
                                        {analysisDialog.donorBloodGroup && (
                                            <div className="flex items-center gap-1 text-sm">
                                                <Droplet className="w-3 h-3 text-red-500" />
                                                <span className="text-gray-600">Known Blood Type:</span>
                                                <strong className="text-gray-900">
                                                    {formatBloodType(analysisDialog.donorBloodGroup, analysisDialog.donorRhesusFactor)}
                                                </strong>
                                            </div>
                                        )}
                                        {analysisDialog.analysis && (
                                            <Badge variant="outline" className={
                                                analysisDialog.analysis.status === "COMPLETED" ? "bg-green-100 text-green-800 border-green-200" :
                                                    analysisDialog.analysis.status === "IN_PROGRESS" ? "bg-yellow-100 text-yellow-800 border-yellow-200" :
                                                        "bg-gray-100 text-gray-600 border-gray-200"
                                            }>
                                                {analysisDialog.analysis.status} ANALYSIS
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Scrollable Content */}
                            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
                                {/* Section 1: Infectious Disease Screening */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 pb-2 border-b">
                                        <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
                                            <Microscope className="w-3 h-3 text-red-600" />
                                        </div>
                                        <h3 className="text-base font-semibold text-gray-900">Infectious Disease Screening</h3>
                                        <span className="text-xs text-gray-400 ml-auto">Required for all donations</span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        <div className="space-y-1.5">
                                            <Label className="text-sm font-medium text-gray-700">HIV</Label>
                                            <Select
                                                value={analysisForm.hiv || ""}
                                                onValueChange={(value) => setAnalysisForm(prev => ({ ...prev, hiv: value || null }))}
                                            >
                                                <SelectTrigger className="bg-white border-gray-200">
                                                    <SelectValue placeholder="Select result" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-white">
                                                    <SelectItem value="NEGATIVE" className="text-green-600">Negative</SelectItem>
                                                    <SelectItem value="POSITIVE" className="text-red-600">Positive</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label className="text-sm font-medium text-gray-700">Brucellosis</Label>
                                            <Select
                                                value={analysisForm.brucellosis || ""}
                                                onValueChange={(value) => setAnalysisForm(prev => ({ ...prev, brucellosis: value || null }))}
                                            >
                                                <SelectTrigger className="bg-white border-gray-200">
                                                    <SelectValue placeholder="Select result" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-white">
                                                    <SelectItem value="NEGATIVE" className="text-green-600">Negative</SelectItem>
                                                    <SelectItem value="POSITIVE" className="text-red-600">Positive</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label className="text-sm font-medium text-gray-700">Hepatitis B</Label>
                                            <Select
                                                value={analysisForm.hepatitisB || ""}
                                                onValueChange={(value) => setAnalysisForm(prev => ({ ...prev, hepatitisB: value || null }))}
                                            >
                                                <SelectTrigger className="bg-white border-gray-200">
                                                    <SelectValue placeholder="Select result" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-white">
                                                    <SelectItem value="NEGATIVE" className="text-green-600">Negative</SelectItem>
                                                    <SelectItem value="POSITIVE" className="text-red-600">Positive</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label className="text-sm font-medium text-gray-700">Hepatitis C</Label>
                                            <Select
                                                value={analysisForm.hepatitisC || ""}
                                                onValueChange={(value) => setAnalysisForm(prev => ({ ...prev, hepatitisC: value || null }))}
                                            >
                                                <SelectTrigger className="bg-white border-gray-200">
                                                    <SelectValue placeholder="Select result" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-white">
                                                    <SelectItem value="NEGATIVE" className="text-green-600">Negative</SelectItem>
                                                    <SelectItem value="POSITIVE" className="text-red-600">Positive</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label className="text-sm font-medium text-gray-700">Syphilis</Label>
                                            <Select
                                                value={analysisForm.syphilis || ""}
                                                onValueChange={(value) => setAnalysisForm(prev => ({ ...prev, syphilis: value || null }))}
                                            >
                                                <SelectTrigger className="bg-white border-gray-200">
                                                    <SelectValue placeholder="Select result" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-white">
                                                    <SelectItem value="NEGATIVE" className="text-green-600">Negative</SelectItem>
                                                    <SelectItem value="POSITIVE" className="text-red-600">Positive</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>

                                {/* Section 2: Blood Typing */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 pb-2 border-b">
                                        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                                            <Droplets className="w-3 h-3 text-blue-600" />
                                        </div>
                                        <h3 className="text-base font-semibold text-gray-900">Blood Typing</h3>
                                        <span className="text-xs text-gray-400 ml-auto">Confirm donor blood group</span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-1.5">
                                            <Label className="text-sm font-medium text-gray-700">Blood Group</Label>
                                            <Select
                                                value={analysisForm.bloodGroup || ""}
                                                onValueChange={(value) => setAnalysisForm(prev => ({ ...prev, bloodGroup: value || null }))}
                                            >
                                                <SelectTrigger className="bg-white border-gray-200">
                                                    <SelectValue placeholder="Select blood group" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-white">
                                                    <SelectItem value="A">A</SelectItem>
                                                    <SelectItem value="B">B</SelectItem>
                                                    <SelectItem value="AB">AB</SelectItem>
                                                    <SelectItem value="O">O</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label className="text-sm font-medium text-gray-700">Rhesus Factor</Label>
                                            <Select
                                                value={analysisForm.rhesusFactor || ""}
                                                onValueChange={(value) => setAnalysisForm(prev => ({ ...prev, rhesusFactor: value || null }))}
                                            >
                                                <SelectTrigger className="bg-white border-gray-200">
                                                    <SelectValue placeholder="Select rhesus factor" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-white">
                                                    <SelectItem value="POSITIVE">Positive (+)</SelectItem>
                                                    <SelectItem value="NEGATIVE">Negative (-)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>

                                {/* Section 3: Biochemical Analysis */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 pb-2 border-b">
                                        <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                                            <Stethoscope className="w-3 h-3 text-green-600" />
                                        </div>
                                        <h3 className="text-base font-semibold text-gray-900">Biochemical Analysis</h3>
                                        <span className="text-xs text-gray-400 ml-auto">Reference ranges shown</span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-1.5">
                                            <Label className="text-sm font-medium text-gray-700">
                                                ALT Level <span className="text-xs text-gray-400 font-normal">(normal: &lt;40 U/L)</span>
                                            </Label>
                                            <Input
                                                type="number"
                                                step="0.1"
                                                value={analysisForm.altLevel ?? ""}
                                                onChange={(e) => setAnalysisForm(prev => ({ ...prev, altLevel: e.target.value ? parseFloat(e.target.value) : null }))}
                                                placeholder="Enter ALT level"
                                                className="bg-white border-gray-200"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label className="text-sm font-medium text-gray-700">
                                                Hemoglobin <span className="text-xs text-gray-400 font-normal">(normal: &gt;125 g/L)</span>
                                            </Label>
                                            <Input
                                                type="number"
                                                step="0.1"
                                                value={analysisForm.hemoglobin ?? ""}
                                                onChange={(e) => setAnalysisForm(prev => ({ ...prev, hemoglobin: e.target.value ? parseFloat(e.target.value) : null }))}
                                                placeholder="Enter hemoglobin level"
                                                className="bg-white border-gray-200"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Section 4: Technician Notes */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 pb-2 border-b">
                                        <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                                            <FileText className="w-3 h-3 text-gray-600" />
                                        </div>
                                        <h3 className="text-base font-semibold text-gray-900">Additional Information</h3>
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="text-sm font-medium text-gray-700">Technician Notes</Label>
                                        <Textarea
                                            value={analysisForm.technicianNotes || ""}
                                            onChange={(e) => setAnalysisForm(prev => ({ ...prev, technicianNotes: e.target.value || null }))}
                                            placeholder="Enter any additional observations, test conditions, or relevant information about this analysis..."
                                            rows={3}
                                            className="bg-white border-gray-200 resize-none"
                                        />
                                    </div>
                                </div>

                                {/* Completion Status Indicator */}
                                {analysisDialog.analysis && (
                                    <div className={`p-4 rounded-lg border ${
                                        analysisDialog.analysis.isComplete
                                            ? (analysisDialog.analysis.isDonorEligible
                                                ? "bg-green-50 border-green-200"
                                                : "bg-red-50 border-red-200")
                                            : "bg-yellow-50 border-yellow-200"
                                    }`}>
                                        <div className="flex items-center gap-2">
                                            {analysisDialog.analysis.isComplete ? (
                                                analysisDialog.analysis.isDonorEligible ? (
                                                    <>
                                                        <CheckCircle className="w-5 h-5 text-green-600" />
                                                        <span className="text-sm font-medium text-green-800">All tests completed. Donor is ELIGIBLE for donation.</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <XCircle className="w-5 h-5 text-red-600" />
                                                        <span className="text-sm font-medium text-red-800">All tests completed. Donor is NOT ELIGIBLE for donation.</span>
                                                    </>
                                                )
                                            ) : (
                                                <>
                                                    <AlertTriangle className="w-5 h-5 text-yellow-600" />
                                                    <span className="text-sm font-medium text-yellow-800">Analysis incomplete. Some tests are pending.</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="px-6 py-4 border-t bg-white rounded-b-lg">
                                <div className="flex justify-end gap-3">
                                    <Button
                                        variant="outline"
                                        onClick={() => setAnalysisDialog(prev => ({ ...prev, isOpen: false }))}
                                        className="border-gray-300"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleSaveAnalysis}
                                        disabled={analysisDialog.isSaving || !analysisDialog.analysis}
                                        className="bg-purple-600 hover:bg-purple-700 text-white"
                                    >
                                        {analysisDialog.isSaving ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle className="w-4 h-4 mr-2" />
                                                Save Analysis
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}