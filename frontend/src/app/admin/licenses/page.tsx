"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Eye, CheckCircle, XCircle, Building2, FileText } from "lucide-react";

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

interface License {
    id: number;
    type: string;
    name: string;
    location: string;
    directorFullName: string;
    licenseFile: string;
    verificationStatus: string;
    rejectionReason: string;
    createdAt: string;
    userId: number;
    userEmail: string;
}

export default function AdminLicensesPage() {
    const [licenses, setLicenses] = useState<License[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedLicense, setSelectedLicense] = useState<License | null>(null);
    const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
    const [rejectionReason, setRejectionReason] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/auth/login';
            return;
        }
        fetchLicenses();
    }, []);

    const fetchLicenses = async () => {
        try {
            const headers = getAuthHeaders();
            if (!headers) {
                window.location.href = '/auth/login';
                return;
            }

            const response = await fetch('http://localhost:8080/admin/licenses/pending', {
                headers: headers,
            });

            if (response.status === 401 || response.status === 403) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/auth/login';
                return;
            }

            if (!response.ok) {
                throw new Error('Failed to fetch licenses');
            }

            const data = await response.json();
            setLicenses(data);
        } catch (err) {
            console.error('Error fetching licenses:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyLicense = async (status: string) => {
        if (!selectedLicense) return;

        setIsProcessing(true);
        try {
            const headers = getAuthHeaders();
            if (!headers) {
                window.location.href = '/auth/login';
                return;
            }

            const response = await fetch('http://localhost:8080/admin/licenses/verify', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                    type: selectedLicense.type,
                    id: selectedLicense.id,
                    status: status,
                    rejectionReason: status === 'REJECTED' ? rejectionReason : null,
                }),
            });

            if (response.ok) {
                await fetchLicenses();
                setReviewDialogOpen(false);
                setSelectedLicense(null);
                setRejectionReason("");
            }
        } catch (err) {
            console.error('Error verifying license:', err);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleViewLicense = (license: License) => {
        if (license.licenseFile && license.licenseFile !== 'null') {
            window.open(`http://localhost:8080/api/files/download/${license.licenseFile}`, '_blank');
        } else {
            alert('No license file uploaded');
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-foreground">License Verification</h1>
                <p className="text-muted-foreground mt-1">Review and verify blood center and medical center licenses</p>
            </div>

            {licenses.length === 0 ? (
                <Card className="p-12 text-center">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">All Licenses Verified</h3>
                    <p className="text-muted-foreground">No pending license verifications at this time</p>
                </Card>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {licenses.map((license) => (
                        <Card key={`${license.type}-${license.id}`} className="p-6 hover:shadow-md transition-shadow">
                            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Building2 className="w-5 h-5 text-primary" />
                                        <h3 className="text-lg font-semibold text-foreground">{license.name}</h3>
                                        <Badge className="bg-yellow-100 text-yellow-700">
                                            {license.type === "BLOOD_CENTER" ? "Blood Center" : "Medical Center"}
                                        </Badge>
                                    </div>

                                    <div className="space-y-1 text-sm text-muted-foreground">
                                        <p>📍 {license.location}</p>
                                        <p>👤 Director: {license.directorFullName}</p>
                                        <p>📧 {license.userEmail}</p>
                                        <p>📅 Registered: {formatDate(license.createdAt)}</p>
                                    </div>

                                    <div className="mt-3 flex flex-wrap gap-2">
                                        <button
                                            onClick={() => handleViewLicense(license)}
                                            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                                        >
                                            <FileText className="w-4 h-4" />
                                            View License Document
                                        </button>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <Button
                                        onClick={() => {
                                            setSelectedLicense(license);
                                            setReviewDialogOpen(true);
                                            setRejectionReason("");
                                        }}
                                        className="bg-green-600 hover:bg-green-700"
                                    >
                                        <Eye className="w-4 h-4 mr-2" />
                                        Review
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Review License</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-600">
                                <strong>{selectedLicense?.name}</strong> is requesting to join as a{" "}
                                {selectedLicense?.type === "BLOOD_CENTER" ? "Blood Center" : "Medical Center"}
                            </p>
                        </div>

                        {rejectionReason && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Rejection Reason</label>
                                <Textarea
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    placeholder="Enter reason for rejection..."
                                    rows={3}
                                />
                            </div>
                        )}
                    </div>
                    <DialogFooter className="gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setReviewDialogOpen(false)}
                            disabled={isProcessing}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={() => handleVerifyLicense("APPROVED")}
                            disabled={isProcessing}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                            Approve
                        </Button>
                        <Button
                            onClick={() => handleVerifyLicense("REJECTED")}
                            disabled={isProcessing}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <XCircle className="w-4 h-4 mr-2" />}
                            Reject
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}