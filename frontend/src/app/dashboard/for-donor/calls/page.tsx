"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Bell, MapPin, Clock, Droplet, CheckCircle, XCircle,
    AlertCircle, Loader2, Calendar, ExternalLink, Building2
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Sidebar } from "../components/sidebar";
import { ProfileCard } from "../components/profile-card";
import { AiChatBot } from "../components/AiChatBot";
import { DonorContextProvider, useDonorContext } from "../components/DonorContextProvider";

interface DonorCall {
    callId: number;
    bloodCenterName: string;
    bloodCenterCity: string;
    bloodCenterAddress?: string;  // Добавлено поле для адреса
    bloodCenterLocation?: string; // Альтернативное поле для адреса
    bloodType: string;
    componentType: string;
    message: string;
    expiresAt: string;
    createdAt: string;
}

// Внутренний компонент
function CallsContent() {
    const [calls, setCalls] = useState<DonorCall[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [respondingCallId, setRespondingCallId] = useState<number | null>(null);
    const [showResponseModal, setShowResponseModal] = useState(false);
    const [selectedCall, setSelectedCall] = useState<DonorCall | null>(null);
    const router = useRouter();
    const searchParams = useSearchParams();
    const userId = searchParams.get('userId') || searchParams.get('id');
    const { donorData } = useDonorContext();

    const getAuthHeaders = () => {
        const token = localStorage.getItem('token');
        console.log("Getting token from localStorage:", token ? `${token.substring(0, 30)}...` : "No token");

        if (!token) {
            console.error("No token found in localStorage");
            return null;
        }

        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const exp = payload.exp * 1000;
            if (Date.now() >= exp) {
                console.error("Token expired");
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                localStorage.removeItem('userId');
                return null;
            }
        } catch (e) {
            console.error("Error parsing token", e);
        }

        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/auth/login');
            return;
        }

        let finalUserId = userId;
        if (!finalUserId || finalUserId === 'null') {
            const storedId = localStorage.getItem('userId');
            if (storedId && storedId !== 'null') {
                finalUserId = storedId;
            }
        }

        if (finalUserId && finalUserId !== 'null') {
            localStorage.setItem('userId', finalUserId);
            fetchCalls(finalUserId);
        } else {
            setIsLoading(false);
            setError("No user ID found");
        }
    }, [userId, router]);

    const fetchCalls = async (id: string) => {
        try {
            setIsLoading(true);
            setError(null);
            const headers = getAuthHeaders();
            if (!headers) {
                router.push('/auth/login');
                return;
            }

            console.log(`Fetching calls for user ID: ${id}`);
            const response = await fetch(`http://localhost:8080/donor-calls/donor/${id}/pending`, {
                headers: headers
            });

            console.log(`Response status: ${response.status}`);

            if (response.status === 401 || response.status === 403) {
                console.log("Authentication failed, clearing storage...");
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                localStorage.removeItem('userId');
                router.push('/auth/login');
                return;
            }

            if (response.status === 404) {
                console.warn("Donor calls endpoint not found (404).");
                setCalls([]);
                setError(null);
                return;
            }

            if (response.status === 400) {
                console.warn("Bad request (400). User might not be a donor.");
                setCalls([]);
                setError(null);
                return;
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log("Response data:", data);

            if (data.success && data.calls) {
                setCalls(data.calls);
                if (data.donorId) {
                    localStorage.setItem('donorId', data.donorId.toString());
                }
            } else if (Array.isArray(data)) {
                setCalls(data);
            } else {
                setCalls([]);
            }
        } catch (error) {
            console.error("Error fetching calls:", error);
            setCalls([]);
            setError(null);
        } finally {
            setIsLoading(false);
        }
    };

    const respondToCall = async (callId: number, responseType: string) => {
        setRespondingCallId(callId);
        try {
            const headers = getAuthHeaders();
            console.log("Responding with headers:", headers);

            if (!headers) {
                console.log("No headers, redirecting to login...");
                router.push('/auth/login');
                return;
            }

            const url = `http://localhost:8080/donor-calls/${callId}/respond?userId=${userId}&response=${responseType}`;
            console.log("Calling URL:", url);

            const response = await fetch(url, {
                method: 'POST',
                headers: headers
            });

            console.log("Response status:", response.status);

            if (response.status === 401 || response.status === 403) {
                console.log("Authentication failed (403/401), redirecting to login...");
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                localStorage.removeItem('userId');
                alert("Session expired. Please login again.");
                router.push('/auth/login');
                return;
            }

            if (response.ok) {
                const data = await response.json();
                console.log("Response data:", data);

                if (data.success) {
                    setCalls(prev => prev.filter(call => call.callId !== callId));

                    alert(responseType === "ACCEPTED"
                        ? "Thank you! Your response has been recorded. Please come to the blood center at your earliest convenience."
                        : "We're sorry to hear that. Thank you for considering donation in the future.");
                } else {
                    alert(data.error || "Failed to record response");
                }
            } else {
                const errorData = await response.json().catch(() => ({}));
                console.error("Error response:", errorData);
                alert(errorData.error || "Failed to record response");
            }
        } catch (error) {
            console.error("Error responding to call:", error);
            alert("Network error. Please try again.");
        } finally {
            setRespondingCallId(null);
            setShowResponseModal(false);
            setSelectedCall(null);
        }
    };

    const openResponseModal = (call: DonorCall) => {
        setSelectedCall(call);
        setShowResponseModal(true);
    };

    const getComponentDisplay = (componentType: string) => {
        switch(componentType) {
            case "WHOLE_BLOOD": return "Whole Blood";
            case "RED_BLOOD_CELLS": return "Red Blood Cells";
            case "PLATELETS": return "Platelets";
            case "PLASMA": return "Plasma";
            case "CRYOPRECIPITATE": return "Cryoprecipitate";
            default: return componentType;
        }
    };

    const formatDate = (dateString: string) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return "Invalid date";
        }
    };

    const isExpiringSoon = (expiresAt: string) => {
        try {
            const expiryDate = new Date(expiresAt);
            const now = new Date();
            const hoursLeft = (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60);
            return hoursLeft < 12 && hoursLeft > 0;
        } catch {
            return false;
        }
    };

    // Функция для получения отображаемого адреса
    const getAddressDisplay = (call: DonorCall) => {
        return call.bloodCenterAddress || call.bloodCenterLocation || null;
    };

    if (isLoading) {
        return (
            <>
                <Sidebar />
                <main className="ml-20 lg:ml-64 p-6 flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
                        <p className="text-muted-foreground">Loading donation calls...</p>
                    </div>
                </main>
            </>
        );
    }

    if (error) {
        return (
            <>
                <Sidebar />
                <main className="ml-20 lg:ml-64 p-6">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-foreground">Donation Calls</h1>
                            <p className="text-muted-foreground mt-1">Urgent blood donation requests</p>
                        </div>
                        <ProfileCard userId={userId} showBookButton={false} />
                    </div>
                    <Card className="p-12 text-center">
                        <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
                        <h3 className="text-xl font-semibold mb-2">Error Loading Calls</h3>
                        <p className="text-muted-foreground mb-4">{error}</p>
                        <Button onClick={() => userId && fetchCalls(userId)}>
                            Try Again
                        </Button>
                    </Card>
                </main>
            </>
        );
    }

    if (!userId || userId === 'null') {
        return (
            <>
                <Sidebar />
                <main className="ml-20 lg:ml-64 p-6">
                    <Card className="p-6 text-center">
                        <p className="text-destructive">Access Denied: User ID not found</p>
                        <Button onClick={() => router.push('/auth/login')} className="mt-4">
                            Go to Login
                        </Button>
                    </Card>
                </main>
            </>
        );
    }

    return (
        <>
            <Sidebar />
            <main className="ml-20 lg:ml-64 p-6 lg:p-8 min-h-screen overflow-auto">
                <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Donation Calls</h1>
                        <p className="text-muted-foreground mt-1">Urgent blood donation requests from blood centers</p>
                    </div>
                    <ProfileCard userId={userId} showBookButton={false} />
                </div>

                {calls.length === 0 ? (
                    <Card className="p-12 text-center">
                        <Bell className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-xl font-semibold mb-2">No Active Calls</h3>
                        <p className="text-muted-foreground mb-4">
                            You don't have any active donation requests at the moment.
                        </p>

                    </Card>
                ) : (
                    <div className="space-y-4">
                        {calls.map((call) => {
                            const expiringSoon = isExpiringSoon(call.expiresAt);
                            const address = getAddressDisplay(call);
                            return (
                                <Card
                                    key={call.callId}
                                    className={`p-6 hover:shadow-md transition-all border-l-4 ${
                                        expiringSoon ? 'border-l-destructive' : 'border-l-primary'
                                    }`}
                                >
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-3">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                                    expiringSoon ? 'bg-destructive/10' : 'bg-primary/10'
                                                }`}>
                                                    <Droplet className={`w-4 h-4 ${expiringSoon ? 'text-destructive' : 'text-primary'}`} />
                                                </div>
                                                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                                                    expiringSoon
                                                        ? 'bg-destructive/10 text-destructive border border-destructive/20'
                                                        : 'bg-primary/10 text-primary border border-primary/20'
                                                }`}>
                                                    {expiringSoon ? 'Expiring Soon' : 'Active'}
                                                </span>
                                            </div>

                                            <h3 className="text-xl font-bold text-foreground mb-2">
                                                {call.bloodCenterName}
                                            </h3>

                                            <div className="space-y-2">
                                                {/* Город */}
                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                    <MapPin className="w-4 h-4" />
                                                    <span>{call.bloodCenterCity}</span>
                                                </div>

                                                {/* Адрес (если есть) */}
                                                {address && (
                                                    <div className="flex items-start gap-2 text-muted-foreground ml-1">
                                                        <Building2 className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                                                        <span className="text-sm">{address}</span>
                                                    </div>
                                                )}

                                                {/* Группа крови и компонент */}
                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                    <Droplet className="w-4 h-4" />
                                                    <span className="font-medium text-foreground">{call.bloodType}</span>
                                                    <span>•</span>
                                                    <span>{getComponentDisplay(call.componentType)}</span>
                                                </div>

                                                {/* Срок действия */}
                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                    <Clock className="w-4 h-4" />
                                                    <span>Expires: {formatDate(call.expiresAt)}</span>
                                                </div>

                                                {/* Сообщение */}
                                                {call.message && (
                                                    <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                                                        <p className="text-sm text-muted-foreground">📝 {call.message}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-2 w-full md:w-auto">
                                            <Button
                                                onClick={() => openResponseModal(call)}
                                                className="bg-primary hover:bg-primary/90 w-full md:w-32"
                                            >
                                                <CheckCircle className="w-4 h-4 mr-2" />
                                                Respond
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </main>

            {/* Модальное окно ответа */}
            {showResponseModal && selectedCall && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <Card className="max-w-md w-full p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-xl">
                        <h2 className="text-xl font-bold text-foreground mb-4">Respond to Donation Call</h2>

                        <div className="space-y-3 mb-6">
                            <p className="text-sm text-muted-foreground">
                                <strong className="text-foreground">{selectedCall.bloodCenterName}</strong> is urgently requesting blood donors.
                            </p>

                            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-100 dark:border-gray-700 space-y-2">
                                <p className="text-sm">
                                    <span className="font-medium text-foreground">Blood Type:</span>{' '}
                                    <span className="text-muted-foreground">{selectedCall.bloodType}</span>
                                </p>
                                <p className="text-sm">
                                    <span className="font-medium text-foreground">Component:</span>{' '}
                                    <span className="text-muted-foreground">{getComponentDisplay(selectedCall.componentType)}</span>
                                </p>
                                <p className="text-sm">
                                    <span className="font-medium text-foreground">City:</span>{' '}
                                    <span className="text-muted-foreground">{selectedCall.bloodCenterCity}</span>
                                </p>
                                {getAddressDisplay(selectedCall) && (
                                    <p className="text-sm">
                                        <span className="font-medium text-foreground">Address:</span>{' '}
                                        <span className="text-muted-foreground">{getAddressDisplay(selectedCall)}</span>
                                    </p>
                                )}
                            </div>

                            <p className="text-sm text-muted-foreground">
                                Please let us know if you can come to the blood center.
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <Button
                                onClick={() => respondToCall(selectedCall.callId, "ACCEPTED")}
                                disabled={respondingCallId === selectedCall.callId}
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                            >
                                {respondingCallId === selectedCall.callId ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <>
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        I Can Come
                                    </>
                                )}
                            </Button>
                            <Button
                                onClick={() => respondToCall(selectedCall.callId, "DECLINED")}
                                disabled={respondingCallId === selectedCall.callId}
                                variant="outline"
                                className="flex-1 border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                            >
                                {respondingCallId === selectedCall.callId ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <>
                                        <XCircle className="w-4 h-4 mr-2" />
                                        Cannot Come
                                    </>
                                )}
                            </Button>
                        </div>

                        <Button
                            variant="ghost"
                            onClick={() => {
                                setShowResponseModal(false);
                                setSelectedCall(null);
                            }}
                            className="w-full mt-3 text-muted-foreground hover:text-foreground"
                        >
                            Cancel
                        </Button>
                    </Card>
                </div>
            )}

            <AiChatBot userId={userId} donorContext={donorData} />
        </>
    );
}

// Основной компонент
export default function CallsPage() {
    const searchParams = useSearchParams();
    const userId = searchParams.get('userId') || searchParams.get('id') ||
        (typeof window !== 'undefined' ? localStorage.getItem('userId') : null);

    return (
        <div className="min-h-screen bg-background">
            <DonorContextProvider userId={userId}>
                <CallsContent />
            </DonorContextProvider>
        </div>
    );
}