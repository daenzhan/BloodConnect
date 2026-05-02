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
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Search, Calendar as CalendarIcon, User, CheckCircle, XCircle, Clock, Droplet, Loader2, AlertTriangle } from "lucide-react";

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
            alert("✅ Donation completed successfully!");

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
                                            <Badge variant="outline" className="bg-green-100 text-green-800">
                                                <CheckCircle className="w-3 h-3 mr-1" />
                                                Donation Recorded
                                            </Badge>
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
                        <DialogDescription className="pt-4">
                            Are you sure you want to complete the donation for <strong>{confirmDialog.donorName}</strong>?
                        </DialogDescription>
                    </DialogHeader>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 my-2">
                        <p className="text-sm text-yellow-800">
                            ⚠️ This action cannot be undone. Once completed:
                        </p>
                        <ul className="text-sm text-yellow-700 mt-2 space-y-1 list-disc list-inside">
                            <li>The donation will be recorded in the system</li>
                            <li>The donor's statistics will be updated</li>
                            <li>The appointment status will become "Completed"</li>
                            <li>You cannot modify this donation afterwards</li>
                        </ul>
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
        </div>
    );
}