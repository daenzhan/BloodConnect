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
import { Search, Calendar, User, CheckCircle, XCircle, Clock, Droplet, Loader2, AlertTriangle, FlaskConical, Database, Plus, Trash2, Eye, Shield, Mail } from "lucide-react";

// ============== ХЕЛПЕРЫ ==============
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

const formatBloodType = (bloodGroup?: string, rhesusFactor?: string): string => {
    if (!bloodGroup) return "Unknown";
    const rh = rhesusFactor?.toLowerCase().includes("positive") ? "+" : "-";
    return `${bloodGroup}${rh}`;
};

// ============== КОНСТАНТЫ ==============
const statusColors: Record<string, string> = {
    SCHEDULED: "bg-secondary text-secondary-foreground",
    IN_PROGRESS: "bg-accent text-accent-foreground",
    COMPLETED: "bg-muted text-muted-foreground",
    CANCELLED: "bg-destructive/10 text-destructive",
    QUALIFIED: "bg-primary/10 text-primary",
    REJECTED: "bg-destructive/10 text-destructive",
};

const statusLabels: Record<string, string> = {
    SCHEDULED: "Scheduled",
    IN_PROGRESS: "In Progress",
    COMPLETED: "Pending Analysis",
    CANCELLED: "Cancelled",
    QUALIFIED: "Qualified",
    REJECTED: "Rejected",
};

const componentLabels: Record<string, string> = {
    WHOLE_BLOOD: "Whole Blood",
    RED_BLOOD_CELLS: "Red Blood Cells",
    PLATELETS: "Platelets",
    PLASMA: "Plasma",
    CRYOPRECIPITATE: "Cryoprecipitate",
};

const componentColors: Record<string, string> = {
    WHOLE_BLOOD: "bg-primary/10 text-primary",
    RED_BLOOD_CELLS: "bg-primary/10 text-primary",
    PLATELETS: "bg-accent/10 text-accent-foreground",
    PLASMA: "bg-secondary/10 text-secondary-foreground",
    CRYOPRECIPITATE: "bg-muted text-muted-foreground",
};

const getDefaultQuantity = (componentType: string): number => {
    switch (componentType) {
        case "WHOLE_BLOOD": return 450;
        case "RED_BLOOD_CELLS": return 250;
        case "PLATELETS": return 200;
        case "PLASMA": return 250;
        case "CRYOPRECIPITATE": return 150;
        default: return 250;
    }
};

// ============== ИНТЕРФЕЙСЫ ==============
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
    bloodReserves?: BloodReserve[];
}

interface BloodReserve {
    reserveId: number;
    componentType: string;
    bloodGroup: string;
    rhesusFactor: string;
    inQuarantine: boolean;
    quarantineEndDate?: string;
    isAvailable: boolean;
    expirationDate: string;
    createdDate: string;
    donationId: number;
    notes?: string;
    isReady: boolean;
    daysUntilExpiration: number;
    quantity?: number;
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
    donationId: number;
    bloodCenterId: number;
    isComplete: boolean;
    isDonorEligible: boolean;
}

// ============== ОСНОВНОЙ КОМПОНЕНТ ==============
export default function AppointmentsPage() {
    const searchParams = useSearchParams();
    const userId = searchParams.get('userId');

    // Состояния
    const [bloodCenterId, setBloodCenterId] = useState<number | null>(null);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [isLoading, setIsLoading] = useState(true);
    const [updatingStatus, setUpdatingStatus] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [verificationStatus, setVerificationStatus] = useState<string | null>(null);
    const [rejectionReason, setRejectionReason] = useState<string | null>(null);

    // Analysis состояния
    const [analysisDialogOpen, setAnalysisDialogOpen] = useState(false);
    const [currentAnalysis, setCurrentAnalysis] = useState<Analysis | null>(null);
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

    // Reserve состояния
    const [reserveDialogOpen, setReserveDialogOpen] = useState(false);
    const [reserveComponents, setReserveComponents] = useState<Array<{
        id: string;
        componentType: string;
        quantity: number;
        inQuarantine: boolean;
        quarantineDays: number;
        notes: string;
    }>>([]);
    const [isCreatingReserve, setIsCreatingReserve] = useState(false);
    const [viewReservesDialogOpen, setViewReservesDialogOpen] = useState(false);
    const [selectedReserves, setSelectedReserves] = useState<BloodReserve[]>([]);
    const [deletingReserveId, setDeletingReserveId] = useState<number | null>(null);
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
    const [confirmAppointmentId, setConfirmAppointmentId] = useState<number | null>(null);
    const [confirmDonorName, setConfirmDonorName] = useState("");

    // ============== ПРОВЕРКА ВЕРИФИКАЦИИ ==============
    const checkVerification = useCallback(async () => {
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
                window.location.href = '/auth/login';
                return;
            }

            if (response.ok) {
                const data = await response.json();
                setVerificationStatus(data.verificationStatus || "APPROVED");
                setRejectionReason(data.rejectionReason || null);
            }
        } catch (error) {
            console.error("Error checking verification:", error);
        }
    }, [userId]);

    // ============== API ВЫЗОВЫ ==============
    const fetchBloodCenterId = useCallback(async () => {
        if (!userId || verificationStatus !== "APPROVED") return;
        setError(null);
        try {
            const headers = getAuthHeaders();
            if (!headers) { window.location.href = '/auth/login'; return; }

            const response = await fetch(`http://localhost:8080/blood-centers/by-user/${userId}`, { headers });
            if (checkAuthAndRedirect(response)) return;
            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const data = await response.json();
            if (!data.bloodCenterId || data.bloodCenterId <= 0) throw new Error("Invalid blood center ID");
            setBloodCenterId(data.bloodCenterId);
        } catch (error) {
            setError(error instanceof Error ? error.message : "Failed to load blood center");
        }
    }, [userId, verificationStatus]);

    const fetchAppointments = useCallback(async () => {
        if (!bloodCenterId || verificationStatus !== "APPROVED") return;
        setIsLoading(true);
        setError(null);

        try {
            const headers = getAuthHeaders();
            if (!headers) { window.location.href = '/auth/login'; return; }

            const response = await fetch(`http://localhost:8080/appointments/bloodcenter/${bloodCenterId}`, { headers });
            if (checkAuthAndRedirect(response)) return;
            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const data = await response.json();
            const appointmentsWithReserves = await Promise.all(
                data.map(async (apt: Appointment) => {
                    if (apt.donation?.donationId) {
                        try {
                            const reservesRes = await fetch(`http://localhost:8080/blood-reserves/donation/${apt.donation.donationId}`, { headers });
                            if (reservesRes.ok) {
                                return { ...apt, bloodReserves: await reservesRes.json() };
                            }
                        } catch (error) {
                            console.error(`Error fetching reserves:`, error);
                        }
                    }
                    return { ...apt, bloodReserves: [] };
                })
            );
            setAppointments(appointmentsWithReserves);
            setFilteredAppointments(appointmentsWithReserves);
        } catch (error) {
            setError(error instanceof Error ? error.message : "Failed to load appointments");
        } finally {
            setIsLoading(false);
        }
    }, [bloodCenterId, verificationStatus]);

    const fetchAnalysis = async (donationId: number) => {
        try {
            const headers = getAuthHeaders();
            if (!headers) return null;
            const response = await fetch(`http://localhost:8080/analyses/donation/${donationId}`, { headers });
            if (response.status === 404) return null;
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.json() as Analysis;
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
                method: "POST", headers
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.json() as Analysis;
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
                method: "PUT", headers, body: JSON.stringify(updates)
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error("Error updating analysis:", error);
            throw error;
        }
    };

    const createBloodReserve = async (analysisId: number, reserveData: any) => {
        try {
            const headers = getAuthHeaders();
            if (!headers) return null;
            const response = await fetch(`http://localhost:8080/blood-reserves/create-from-analysis/${analysisId}`, {
                method: "POST", headers, body: JSON.stringify(reserveData)
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to create reserve");
            }
            return await response.json();
        } catch (error) {
            console.error("Error creating blood reserve:", error);
            throw error;
        }
    };

    const deleteBloodReserve = async (reserveId: number) => {
        try {
            const headers = getAuthHeaders();
            if (!headers) return false;
            const response = await fetch(`http://localhost:8080/blood-reserves/${reserveId}`, { method: "DELETE", headers });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return true;
        } catch (error) {
            console.error("Error deleting blood reserve:", error);
            return false;
        }
    };

    const fetchReservesByDonation = async (donationId: number) => {
        try {
            const headers = getAuthHeaders();
            if (!headers) return [];
            const response = await fetch(`http://localhost:8080/blood-reserves/donation/${donationId}`, { headers });
            if (!response.ok) return [];
            return await response.json();
        } catch (error) {
            console.error("Error fetching reserves:", error);
            return [];
        }
    };

    const updateAppointmentStatus = async (appointmentId: number, newStatus: string) => {
        try {
            const headers = getAuthHeaders();
            if (!headers) return false;
            const response = await fetch(`http://localhost:8080/appointments/${appointmentId}/update-status`, {
                method: "PUT", headers, body: JSON.stringify({ status: newStatus })
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return true;
        } catch (error) {
            console.error("Error updating appointment status:", error);
            return false;
        }
    };

    // ============== ОБРАБОТЧИКИ СОБЫТИЙ ==============
    const handleAddAnalysis = async (appointment: Appointment) => {
        if (!appointment.donation?.donationId) {
            alert("Please complete the donation first");
            return;
        }

        setIsCreatingAnalysis(true);
        try {
            let analysis = await fetchAnalysis(appointment.donation.donationId);
            if (!analysis) {
                analysis = await createAnalysis(appointment.donation.donationId);
                if (!analysis) throw new Error("Failed to create analysis");
            }

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
            alert("Failed to load analysis data");
        } finally {
            setIsCreatingAnalysis(false);
        }
    };

    const handleSaveAnalysis = async () => {
        if (!currentAnalysis?.analysisId) {
            alert("No analysis record found");
            return;
        }
        if (!analysisFormData.bloodGroup || !analysisFormData.rhesusFactor) {
            alert("Please select blood group and rhesus factor");
            return;
        }

        setIsSavingAnalysis(true);
        try {
            const updates = {
                hiv: analysisFormData.hiv,
                brucellosis: analysisFormData.brucellosis,
                hepatitisB: analysisFormData.hepatitisB,
                hepatitisC: analysisFormData.hepatitisC,
                syphilis: analysisFormData.syphilis,
                bloodGroup: analysisFormData.bloodGroup,
                rhesusFactor: analysisFormData.rhesusFactor,
                technicianNotes: analysisFormData.technicianNotes || "",
                altLevel: analysisFormData.altLevel ? parseFloat(analysisFormData.altLevel) : null,
                hemoglobin: analysisFormData.hemoglobin ? parseFloat(analysisFormData.hemoglobin) : null
            };

            const result = await updateAnalysis(currentAnalysis.analysisId, updates);
            const appointmentToUpdate = appointments.find(apt => apt.donation?.donationId === currentAnalysis.donationId);

            if (appointmentToUpdate && result.isComplete) {
                await updateAppointmentStatus(appointmentToUpdate.appointmentId, result.isDonorEligible ? "QUALIFIED" : "REJECTED");
            }

            alert("Analysis saved successfully!");
            setAnalysisDialogOpen(false);
            await fetchAppointments();

            if (result.isComplete && result.isDonorEligible) {
                alert("Donor is eligible. You can now create blood reserves.");
            }
        } catch (error) {
            alert("Failed to save analysis");
        } finally {
            setIsSavingAnalysis(false);
        }
    };

    const openCreateReserveDialog = async (appointment: Appointment) => {
        if (!appointment.donation?.donationId) {
            alert("Donation not found");
            return;
        }

        try {
            const analysis = await fetchAnalysis(appointment.donation.donationId);
            if (!analysis || !analysis.isDonorEligible) {
                alert("Donor is not eligible for blood reserve");
                return;
            }

            setCurrentAnalysis(analysis);
            setReserveComponents([{
                id: Date.now().toString(),
                componentType: "WHOLE_BLOOD",
                quantity: getDefaultQuantity("WHOLE_BLOOD"),
                inQuarantine: false,
                quarantineDays: 0,
                notes: ""
            }]);
            setReserveDialogOpen(true);
        } catch (error) {
            alert("Failed to load data");
        }
    };

    const addReserveComponent = () => {
        setReserveComponents([...reserveComponents, {
            id: Date.now().toString(),
            componentType: "WHOLE_BLOOD",
            quantity: getDefaultQuantity("WHOLE_BLOOD"),
            inQuarantine: false,
            quarantineDays: 0,
            notes: ""
        }]);
    };

    const removeReserveComponent = (id: string) => {
        setReserveComponents(reserveComponents.filter(c => c.id !== id));
    };

    const updateReserveComponent = (id: string, field: string, value: any) => {
        setReserveComponents(reserveComponents.map(comp =>
            comp.id === id ? { ...comp, [field]: value } : comp
        ));
    };

    const handleComponentTypeChange = (id: string, value: string) => {
        setReserveComponents(prevComponents =>
            prevComponents.map(comp => {
                if (comp.id === id) {
                    let quantity = getDefaultQuantity(value);
                    let inQuarantine = false;
                    let quarantineDays = 0;

                    if (value === "PLASMA") {
                        inQuarantine = true;
                        quarantineDays = 90;
                    }

                    return {
                        ...comp,
                        componentType: value,
                        quantity: quantity,
                        inQuarantine: inQuarantine,
                        quarantineDays: quarantineDays
                    };
                }
                return comp;
            })
        );
    };

    const handleSaveReserves = async () => {
        if (!currentAnalysis?.analysisId) {
            alert("No analysis found");
            return;
        }
        if (reserveComponents.length === 0) {
            alert("Please add at least one component");
            return;
        }

        setIsCreatingReserve(true);
        try {
            let successCount = 0;
            for (const component of reserveComponents) {
                try {
                    await createBloodReserve(currentAnalysis.analysisId, {
                        componentType: component.componentType,
                        quantity: component.quantity,
                        inQuarantine: component.inQuarantine,
                        quarantineDays: component.inQuarantine ? component.quarantineDays : 0,
                        notes: component.notes
                    });
                    successCount++;
                } catch (error) {
                    console.error(`Failed to create ${component.componentType}:`, error);
                }
            }

            alert(`Created ${successCount} of ${reserveComponents.length} components`);
            setReserveDialogOpen(false);
            await fetchAppointments();
        } catch (error) {
            alert("Failed to create some components");
        } finally {
            setIsCreatingReserve(false);
        }
    };

    const handleViewReserves = async (appointment: Appointment) => {
        if (!appointment.donation?.donationId) return;
        try {
            const reserves = await fetchReservesByDonation(appointment.donation.donationId);
            setSelectedReserves(reserves);
            setViewReservesDialogOpen(true);
        } catch (error) {
            alert("Failed to load reserves");
        }
    };

    const handleDeleteReserve = async (reserveId: number) => {
        if (!confirm("Delete this component?")) return;
        setDeletingReserveId(reserveId);
        try {
            if (await deleteBloodReserve(reserveId)) {
                setSelectedReserves(prev => prev.filter(r => r.reserveId !== reserveId));
                await fetchAppointments();
                alert("Component deleted");
            }
        } catch (error) {
            alert("Failed to delete");
        } finally {
            setDeletingReserveId(null);
        }
    };

    const handleStartAppointment = async (appointmentId: number) => {
        setUpdatingStatus(appointmentId);
        try {
            const headers = getAuthHeaders();
            if (!headers) { window.location.href = '/auth/login'; return; }
            const response = await fetch(`http://localhost:8080/appointments/${appointmentId}/start`, { method: "PUT", headers });
            if (checkAuthAndRedirect(response)) return;
            if (!response.ok) throw new Error("Failed to start");
            await fetchAppointments();
            alert("Donation started!");
        } catch (error) {
            alert("Failed to start appointment");
        } finally {
            setUpdatingStatus(null);
        }
    };

    const handleCancelAppointment = async (appointmentId: number) => {
        setUpdatingStatus(appointmentId);
        try {
            const headers = getAuthHeaders();
            if (!headers) { window.location.href = '/auth/login'; return; }
            const response = await fetch(`http://localhost:8080/appointments/${appointmentId}/cancel`, { method: "PUT", headers });
            if (checkAuthAndRedirect(response)) return;
            if (!response.ok) throw new Error("Failed to cancel");
            await fetchAppointments();
            alert("Appointment cancelled");
        } catch (error) {
            alert("Failed to cancel");
        } finally {
            setUpdatingStatus(null);
        }
    };

    const handleCompleteDonation = async (appointmentId: number) => {
        setUpdatingStatus(appointmentId);
        try {
            const headers = getAuthHeaders();
            if (!headers) { window.location.href = '/auth/login'; return; }
            const response = await fetch(`http://localhost:8080/appointments/${appointmentId}/complete-donation`, { method: "PUT", headers });
            if (checkAuthAndRedirect(response)) return;
            if (!response.ok) throw new Error("Failed to complete");
            await fetchAppointments();
            alert("Donation completed! Add analysis results.");
        } catch (error) {
            alert("Failed to complete donation");
        } finally {
            setUpdatingStatus(null);
            setConfirmDialogOpen(false);
            setConfirmAppointmentId(null);
            setConfirmDonorName("");
        }
    };

    // ============== useEffect ХУКИ ==============
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) window.location.href = '/auth/login';
        else checkVerification();
    }, [checkVerification]);

    useEffect(() => {
        if (verificationStatus === "APPROVED") {
            fetchBloodCenterId();
        }
    }, [verificationStatus, fetchBloodCenterId]);

    useEffect(() => {
        if (bloodCenterId && verificationStatus === "APPROVED") {
            fetchAppointments();
        }
    }, [bloodCenterId, verificationStatus, fetchAppointments]);

    useEffect(() => {
        let result = [...appointments];
        if (searchTerm.trim()) {
            const searchLower = searchTerm.toLowerCase();
            result = result.filter(apt =>
                apt.donor?.firstName?.toLowerCase().includes(searchLower) ||
                apt.donor?.lastName?.toLowerCase().includes(searchLower)
            );
        }
        if (statusFilter !== "ALL") result = result.filter(apt => apt.status === statusFilter);
        setFilteredAppointments(result);
    }, [searchTerm, statusFilter, appointments]);

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
                                <li>• After approval, you can manage appointments</li>
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

    // ============== РЕНДЕР ==============
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
                <main className="flex-1 p-6">
                    <Card className="p-6 text-center">
                        <p className="text-destructive">Access Denied: User ID not found</p>
                    </Card>
                </main>
            </div>
        );
    }

    return (
        <>
            <BloodCenterSidebar userId={userId} />
            <main className="ml-20 lg:ml-64 p-6 lg:p-8 min-h-screen bg-background">
                <header className="flex items-start justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-bold">Appointments</h1>
                        <p className="text-sm text-muted-foreground mt-1">Manage donor appointments and track donations</p>
                    </div>
                    <CenterProfileCard userId={userId} />
                </header>


                {error && (
                    <Card className="p-4 mb-5 bg-destructive/10 border-destructive/20">
                        <p className="text-destructive text-sm">{error}</p>
                        <Button variant="outline" size="sm" className="mt-2" onClick={() => { setError(null); fetchAppointments(); }}>Retry</Button>
                    </Card>
                )}

                <Card className="p-3 mb-5">
                    <div className="flex flex-wrap gap-3">
                        <div className="flex-1 min-w-64 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input placeholder="Search by donor name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 h-9 text-sm" disabled={isLoading} />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter} disabled={isLoading}>
                            <SelectTrigger className="w-48 h-9 text-sm"><SelectValue placeholder="Filter by status" /></SelectTrigger>
                            <SelectContent className="bg-white dark:bg-card">
                                <SelectItem value="ALL">All Statuses</SelectItem>
                                <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                                <SelectItem value="COMPLETED">Pending Analysis</SelectItem>
                                <SelectItem value="QUALIFIED">Qualified</SelectItem>
                                <SelectItem value="REJECTED">Rejected</SelectItem>
                                <SelectItem value="CANCELLED">Cancelled</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </Card>

                {filteredAppointments.length === 0 ? (
                    <Card className="p-12 text-center">
                        <p className="text-muted-foreground">No appointments found</p>
                        {(searchTerm || statusFilter !== "ALL") && (
                            <Button variant="link" onClick={() => { setSearchTerm(""); setStatusFilter("ALL"); }} className="mt-2">Clear filters</Button>
                        )}
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {filteredAppointments.map((apt) => (
                            <Card key={apt.appointmentId} className="p-4 hover:shadow-md transition-shadow">
                                <div className="flex items-start justify-between flex-wrap gap-3">
                                    <div className="flex items-start gap-3 flex-1">
                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                            <User className="w-5 h-5 text-primary" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                <h3 className="font-medium">{apt.donor?.firstName || "Unknown"} {apt.donor?.lastName || ""}</h3>
                                                <Badge variant="outline" className={`text-xs ${statusColors[apt.status] || "bg-muted"}`}>
                                                    {statusLabels[apt.status] || apt.status}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap mb-2">
                                                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(apt.appointmentDate)}</span>
                                                {(apt.donor?.bloodGroup || apt.donor?.rhesusFactor) && (
                                                    <span className="flex items-center gap-1"><Droplet className="w-3 h-3 text-primary" />{formatBloodType(apt.donor?.bloodGroup, apt.donor?.rhesusFactor)}</span>
                                                )}
                                            </div>
                                            {apt.notes && <p className="text-xs text-muted-foreground mt-1 truncate max-w-md">Note: {apt.notes}</p>}
                                            {apt.bloodReserves && apt.bloodReserves.length > 0 && (
                                                <div className="flex items-center gap-2 mt-2 flex-wrap">
                                                    <span className="text-xs text-muted-foreground">Components:</span>
                                                    {apt.bloodReserves.map(reserve => (
                                                        <Badge key={reserve.reserveId} variant="outline" className={`text-xs ${componentColors[reserve.componentType] || "bg-muted"}`}>
                                                            {componentLabels[reserve.componentType]}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        {apt.status === "SCHEDULED" && (
                                            <>
                                                <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => handleStartAppointment(apt.appointmentId)} disabled={updatingStatus === apt.appointmentId}>
                                                    {updatingStatus === apt.appointmentId ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Clock className="w-3 h-3 mr-1" />} Start
                                                </Button>
                                                <Button size="sm" variant="outline" className="h-8 text-xs text-destructive hover:text-destructive" onClick={() => handleCancelAppointment(apt.appointmentId)} disabled={updatingStatus === apt.appointmentId}>
                                                    <XCircle className="w-3 h-3 mr-1" /> Cancel
                                                </Button>
                                            </>
                                        )}

                                        {apt.status === "IN_PROGRESS" && (
                                            <>
                                                <Button size="sm" className="h-8 text-xs bg-primary hover:bg-primary/90 text-primary-foreground" onClick={() => {
                                                    setConfirmAppointmentId(apt.appointmentId);
                                                    setConfirmDonorName(`${apt.donor?.firstName} ${apt.donor?.lastName}`);
                                                    setConfirmDialogOpen(true);
                                                }} disabled={updatingStatus === apt.appointmentId}>
                                                    {updatingStatus === apt.appointmentId ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <CheckCircle className="w-3 h-3 mr-1" />} Complete
                                                </Button>
                                                <Button size="sm" variant="outline" className="h-8 text-xs text-destructive hover:text-destructive" onClick={() => handleCancelAppointment(apt.appointmentId)} disabled={updatingStatus === apt.appointmentId}>
                                                    <XCircle className="w-3 h-3 mr-1" /> Cancel
                                                </Button>
                                            </>
                                        )}

                                        {apt.status === "COMPLETED" && (
                                            <div className="flex gap-2">
                                                <Button size="sm" className="h-8 text-xs bg-primary hover:bg-primary/90 text-primary-foreground" onClick={() => handleAddAnalysis(apt)} disabled={isCreatingAnalysis}>
                                                    {isCreatingAnalysis ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <FlaskConical className="w-3 h-3 mr-1" />} Add Analysis
                                                </Button>
                                                <Badge variant="outline" className="bg-muted text-muted-foreground"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>
                                            </div>
                                        )}

                                        {apt.status === "QUALIFIED" && (
                                            <div className="flex gap-2">
                                                <Button size="sm" className="h-8 text-xs bg-primary hover:bg-primary/90 text-primary-foreground" onClick={() => openCreateReserveDialog(apt)} disabled={isCreatingReserve}>
                                                    <Plus className="w-3 h-3 mr-1" /> Add Components
                                                </Button>
                                                {apt.bloodReserves && apt.bloodReserves.length > 0 && (
                                                    <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => handleViewReserves(apt)}>
                                                        <Eye className="w-3 h-3 mr-1" /> View ({apt.bloodReserves.length})
                                                    </Button>
                                                )}
                                                <Badge variant="outline" className="bg-primary/10 text-primary"><CheckCircle className="w-3 h-3 mr-1" /> Approved</Badge>
                                            </div>
                                        )}

                                        {apt.status === "REJECTED" && (
                                            <Badge variant="outline" className="bg-destructive/10 text-destructive"><XCircle className="w-3 h-3 mr-1" /> Not Eligible</Badge>
                                        )}

                                        {apt.status === "CANCELLED" && (
                                            <Badge variant="outline" className="bg-destructive/10 text-destructive"><XCircle className="w-3 h-3 mr-1" /> Cancelled</Badge>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </main>

            <Dialog open={analysisDialogOpen} onOpenChange={setAnalysisDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader><DialogTitle className="flex items-center gap-2"><FlaskConical className="w-5 h-5 text-primary" /> Blood Analysis Results</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-3">
                            <h3 className="font-semibold text-sm">Infectious Disease Markers</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs text-muted-foreground">HIV</label>
                                    <Select value={analysisFormData.hiv} onValueChange={(v) => setAnalysisFormData({...analysisFormData, hiv: v})}>
                                        <SelectTrigger><SelectValue placeholder="Select result" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="NEGATIVE">Negative</SelectItem>
                                            <SelectItem value="POSITIVE">Positive</SelectItem>
                                            <SelectItem value="PENDING">Pending</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground">Brucellosis</label>
                                    <Select value={analysisFormData.brucellosis} onValueChange={(v) => setAnalysisFormData({...analysisFormData, brucellosis: v})}>
                                        <SelectTrigger><SelectValue placeholder="Select result" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="NEGATIVE">Negative</SelectItem>
                                            <SelectItem value="POSITIVE">Positive</SelectItem>
                                            <SelectItem value="PENDING">Pending</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground">Hepatitis B</label>
                                    <Select value={analysisFormData.hepatitisB} onValueChange={(v) => setAnalysisFormData({...analysisFormData, hepatitisB: v})}>
                                        <SelectTrigger><SelectValue placeholder="Select result" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="NEGATIVE">Negative</SelectItem>
                                            <SelectItem value="POSITIVE">Positive</SelectItem>
                                            <SelectItem value="PENDING">Pending</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground">Hepatitis C</label>
                                    <Select value={analysisFormData.hepatitisC} onValueChange={(v) => setAnalysisFormData({...analysisFormData, hepatitisC: v})}>
                                        <SelectTrigger><SelectValue placeholder="Select result" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="NEGATIVE">Negative</SelectItem>
                                            <SelectItem value="POSITIVE">Positive</SelectItem>
                                            <SelectItem value="PENDING">Pending</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground">Syphilis</label>
                                    <Select value={analysisFormData.syphilis} onValueChange={(v) => setAnalysisFormData({...analysisFormData, syphilis: v})}>
                                        <SelectTrigger><SelectValue placeholder="Select result" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="NEGATIVE">Negative</SelectItem>
                                            <SelectItem value="POSITIVE">Positive</SelectItem>
                                            <SelectItem value="PENDING">Pending</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <h3 className="font-semibold text-sm">Blood Typing</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs text-muted-foreground">Blood Group *</label>
                                    <Select value={analysisFormData.bloodGroup} onValueChange={(v) => setAnalysisFormData({...analysisFormData, bloodGroup: v})}>
                                        <SelectTrigger><SelectValue placeholder="Select blood group" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="A">A</SelectItem>
                                            <SelectItem value="B">B</SelectItem>
                                            <SelectItem value="AB">AB</SelectItem>
                                            <SelectItem value="O">O</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground">Rhesus Factor *</label>
                                    <Select value={analysisFormData.rhesusFactor} onValueChange={(v) => setAnalysisFormData({...analysisFormData, rhesusFactor: v})}>
                                        <SelectTrigger><SelectValue placeholder="Select rhesus factor" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="POSITIVE">Positive (+)</SelectItem>
                                            <SelectItem value="NEGATIVE">Negative (-)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <h3 className="font-semibold text-sm">Biochemistry</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <div><label className="text-xs text-muted-foreground">ALT Level (U/L)</label><Input type="number" step="0.1" value={analysisFormData.altLevel} onChange={(e) => setAnalysisFormData({...analysisFormData, altLevel: e.target.value})} placeholder="Normal: < 40" /></div>
                                <div><label className="text-xs text-muted-foreground">Hemoglobin (g/L)</label><Input type="number" step="0.1" value={analysisFormData.hemoglobin} onChange={(e) => setAnalysisFormData({...analysisFormData, hemoglobin: e.target.value})} placeholder="Women: >125, Men: >135" /></div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs text-muted-foreground">Technician Notes</label>
                            <textarea className="w-full border rounded-md p-2 text-sm" rows={3} value={analysisFormData.technicianNotes} onChange={(e) => setAnalysisFormData({...analysisFormData, technicianNotes: e.target.value})} placeholder="Additional notes..." />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAnalysisDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveAnalysis} disabled={isSavingAnalysis} className="bg-primary hover:bg-primary/90">{isSavingAnalysis ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : "Save Analysis"}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={reserveDialogOpen} onOpenChange={setReserveDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader><DialogTitle className="flex items-center gap-2"><Database className="w-5 h-5 text-primary" /> Create Blood Components</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
                            <p className="text-sm text-primary"><strong>Donor Blood Type:</strong> {currentAnalysis?.bloodGroup}{currentAnalysis?.rhesusFactor === "POSITIVE" ? "+" : "-"}</p>
                            <p className="text-xs text-muted-foreground mt-1">Created date and expiration date will be calculated automatically</p>
                        </div>
                        <div className="space-y-4">
                            {reserveComponents.map((component, index) => (
                                <Card key={component.id} className="p-4">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="font-semibold">Component #{index + 1}</h3>
                                        <Button variant="ghost" size="sm" onClick={() => removeReserveComponent(component.id)} className="text-destructive h-8 w-8 p-0"><Trash2 className="w-4 h-4" /></Button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-medium mb-1 block">Component Type *</label>
                                            <Select value={component.componentType} onValueChange={(value) => handleComponentTypeChange(component.id, value)}>
                                                <SelectTrigger><SelectValue placeholder="Select component type" /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="WHOLE_BLOOD">Whole Blood</SelectItem>
                                                    <SelectItem value="RED_BLOOD_CELLS">Red Blood Cells</SelectItem>
                                                    <SelectItem value="PLATELETS">Platelets</SelectItem>
                                                    <SelectItem value="PLASMA">Plasma</SelectItem>
                                                    <SelectItem value="CRYOPRECIPITATE">Cryoprecipitate</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium mb-1 block">Quantity (ml) *</label>
                                            <Input type="number" value={component.quantity} onChange={(e) => updateReserveComponent(component.id, "quantity", parseInt(e.target.value) || 0)} min="1" placeholder="Enter quantity in ml" />
                                        </div>
                                    </div>
                                    {component.componentType === "PLASMA" && (
                                        <div className="mt-4 p-3 bg-muted/30 rounded-lg">
                                            <div className="flex items-center space-x-2">
                                                <input type="checkbox" id={`quarantine-${component.id}`} checked={component.inQuarantine} onChange={(e) => updateReserveComponent(component.id, "inQuarantine", e.target.checked)} className="w-4 h-4 rounded" />
                                                <label htmlFor={`quarantine-${component.id}`} className="text-sm font-medium">Place in quarantine (90 days required for plasma)</label>
                                            </div>
                                        </div>
                                    )}
                                    {component.componentType !== "PLASMA" && (
                                        <div className="mt-4 p-3 bg-green-50 rounded-lg">
                                            <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-600" /><span className="text-sm text-green-700">This component is ready for immediate use</span></div>
                                        </div>
                                    )}
                                    <div className="mt-4">
                                        <label className="text-sm font-medium mb-1 block">Notes</label>
                                        <textarea className="w-full border rounded-md p-2 text-sm" rows={2} value={component.notes} onChange={(e) => updateReserveComponent(component.id, "notes", e.target.value)} placeholder={`Additional notes...`} />
                                    </div>
                                </Card>
                            ))}
                        </div>
                        <Button variant="outline" onClick={addReserveComponent} className="w-full border-dashed"><Plus className="w-4 h-4 mr-2" /> Add Component</Button>
                        <div className="bg-muted/30 rounded-lg p-3">
                            <p className="text-xs text-muted-foreground"><strong>Storage & Expiration:</strong><br/>• Whole Blood: 35 days at 2-6°C<br/>• Red Blood Cells: 42 days at 2-6°C<br/>• Platelets: 5 days at 20-24°C with agitation<br/>• Plasma: 3 years at -18°C (after 90-day quarantine)<br/>• Cryoprecipitate: 2 years at -18°C</p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setReserveDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveReserves} disabled={isCreatingReserve || reserveComponents.length === 0} className="bg-primary hover:bg-primary/90">
                            {isCreatingReserve ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...</> : <>Create {reserveComponents.length} Component{reserveComponents.length !== 1 ? 's' : ''}</>}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>


            <Dialog open={viewReservesDialogOpen} onOpenChange={setViewReservesDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader><DialogTitle className="flex items-center gap-2"><Database className="w-5 h-5 text-primary" /> Blood Components</DialogTitle></DialogHeader>
                    <div className="space-y-3 py-4">
                        {selectedReserves.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground"><Database className="w-12 h-12 mx-auto mb-2 opacity-30" /><p>No components created yet</p></div>
                        ) : (
                            selectedReserves.map((reserve) => (
                                <Card key={reserve.reserveId} className="p-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-semibold text-lg">{componentLabels[reserve.componentType]}</h3>
                                            <p className="text-sm text-muted-foreground">Blood Type: {reserve.bloodGroup}{reserve.rhesusFactor === "POSITIVE" ? "+" : "-"}</p>
                                            {reserve.quantity && <p className="text-xs text-muted-foreground">Quantity: {reserve.quantity} ml</p>}
                                        </div>
                                        <div className="flex gap-2">
                                            <Badge className={reserve.isReady ? "bg-primary/10 text-primary" : reserve.inQuarantine ? "bg-accent/10 text-accent-foreground" : "bg-muted"}>{reserve.isReady ? "Available" : reserve.inQuarantine ? "Quarantine" : "Processing"}</Badge>
                                            <Button variant="ghost" size="sm" onClick={() => handleDeleteReserve(reserve.reserveId)} disabled={deletingReserveId === reserve.reserveId} className="text-destructive h-8 w-8 p-0">
                                                {deletingReserveId === reserve.reserveId ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
                                        <div><p className="text-muted-foreground">Created:</p><p>{new Date(reserve.createdDate).toLocaleDateString()}</p></div>
                                        <div><p className="text-muted-foreground">Expires:</p><p className={reserve.daysUntilExpiration <= 7 ? "text-destructive font-semibold" : ""}>{new Date(reserve.expirationDate).toLocaleDateString()}{reserve.daysUntilExpiration <= 7 && ` (${reserve.daysUntilExpiration} days left)`}</p></div>
                                        {reserve.inQuarantine && reserve.quarantineEndDate && (<div><p className="text-muted-foreground">Quarantine until:</p><p>{new Date(reserve.quarantineEndDate).toLocaleDateString()}</p></div>)}
                                        {reserve.notes && (<div className="col-span-2"><p className="text-muted-foreground">Notes:</p><p className="text-sm">{reserve.notes}</p></div>)}
                                    </div>
                                </Card>
                            ))
                        )}
                    </div>
                    <DialogFooter><Button variant="outline" onClick={() => setViewReservesDialogOpen(false)}>Close</Button></DialogFooter>
                </DialogContent>
            </Dialog>


            <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader><DialogTitle className="flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-destructive" /> Confirm Donation</DialogTitle></DialogHeader>
                    <p className="text-sm">Complete donation for <strong>{confirmDonorName}</strong>?</p>
                    <div className="bg-muted/30 rounded-lg p-3"><p className="text-sm">You'll be able to add analysis results afterward.</p></div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
                        <Button onClick={() => confirmAppointmentId && handleCompleteDonation(confirmAppointmentId)} className="bg-primary hover:bg-primary/90"><CheckCircle className="w-4 h-4 mr-2" /> Complete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}