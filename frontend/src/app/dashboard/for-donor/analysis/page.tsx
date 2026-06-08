"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
    Loader2,
    Droplet,
    Heart,
    Activity,
    Brain,
    AlertCircle,
    CheckCircle,
    Clock,
    Calendar,
    Shield,
    Sparkles,
    XCircle,
    ArrowLeft
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Sidebar } from "../components/sidebar";
import { ProfileCard } from "../components/profile-card";
import { AiChatBot } from "../components/AiChatBot";
import { DonorContextProvider, useDonorContext } from "../components/DonorContextProvider";

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

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
    isComplete: boolean;
    isDonorEligible?: boolean;
}

interface AiRecommendation {
    success: boolean;
    nextDonationDays: number;
    readySoon: boolean;
    readinessLevel: string;
    readinessText: string;
    healthAdvice: string;
    confidence: number;
    bmi: number;
    bmiCategory: string;
}

const getStatusColor = (status: string) => {
    switch(status?.toLowerCase()) {
        case 'positive': return "text-red-600 bg-red-50";
        case 'negative': return "text-green-600 bg-green-50";
        default: return "text-gray-600 bg-gray-50";
    }
};

const splitAdvice = (advice: string | null | undefined): string[] => {
    if (!advice) return [];
    return advice.split('. ').map(s => s.trim()).filter(Boolean)
                 .map(s => s.endsWith('.') ? s : s + '.');
};

const getReadinessColor = (level: string) => {
    switch(level) {
        case 'green': return "bg-green-100 text-green-700 border-green-200";
        case 'yellow': return "bg-yellow-100 text-yellow-700 border-yellow-200";
        case 'red': return "bg-red-100 text-red-700 border-red-200";
        default: return "bg-gray-100 text-gray-700";
    }
};

function AnalysisContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const userId = searchParams.get('userId');
    const [analysis, setAnalysis] = useState<Analysis | null>(null);
    const [donorId, setDonorId] = useState<number | null>(null);
    const [aiRecommendation, setAiRecommendation] = useState<AiRecommendation | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAiLoading, setIsAiLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { donorData } = useDonorContext();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/auth/login');
            return;
        }
        fetchDonorAndAnalysis();
    }, [userId, router]);

    const fetchDonorAndAnalysis = async () => {
        try {
            const headers = getAuthHeaders();
            if (!headers) {
                router.push('/auth/login');
                return;
            }

            const donorResponse = await fetch(`http://localhost:8080/donor/dashboard/${userId}`, {
                headers: headers
            });

            if (!donorResponse.ok) throw new Error("Failed to fetch donor data");
            const donorData = await donorResponse.json();

            const donorIdValue = donorData.donorId;
            // let donorIdValue = donorData.donorId;
            // if (!donorIdValue) {
            //     const donorByIdResponse = await fetch(`http://localhost:8080/donor/user/${userId}`, {
            //         headers: headers
            //     });
            //     if (donorByIdResponse.ok) {
            //         const donorByIdData = await donorByIdResponse.json();
            //         donorIdValue = donorByIdData.donorId;
            //     }
            // }

            if (!donorIdValue) {
                setError("Donor ID not found");
                setIsLoading(false);
                return;
            }

            setDonorId(donorIdValue);

            const analysisResponse = await fetch(`http://localhost:8080/analyses/by-user/${userId}/latest`, {
                headers: headers
            });

            if (analysisResponse.status === 404) {
                setError("No analysis results found yet");
                setIsLoading(false);
                return;
            }

            if (!analysisResponse.ok) throw new Error("Failed to fetch analysis");

            const data = await analysisResponse.json();
            setAnalysis(data);

            fetchAiRecommendation(donorIdValue);

        } catch (err) {
            console.error("Error fetching data:", err);
            setError("Failed to load analysis results");
            setIsLoading(false);
        }
    };

    const fetchAiRecommendation = async (donorIdValue: number) => {
        try {
            const headers = getAuthHeaders();
            if (!headers) return;

            const response = await fetch(`http://localhost:8080/analyses/by-user/${userId}/ai-recommendation`, {
                headers: headers
            });

            if (response.ok) {
                const data = await response.json();
                setAiRecommendation(data);
            }
        } catch (err) {
            console.error("Error fetching AI recommendation:", err);
        } finally {
            setIsAiLoading(false);
            setIsLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    const handleBackToDashboard = () => {
        router.push(`/dashboard/for-donor?userId=${userId}`);
    };

    if (isLoading) {
        return (
            <>
                <Sidebar />
                <main className="ml-20 lg:ml-64 p-6 lg:p-8">
                    <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-foreground">Blood Analysis Results</h1>
                            <p className="text-muted-foreground mt-1">Review your blood test results</p>
                        </div>
                        <div className="flex items-center gap-3">
                            {userId && <ProfileCard userId={userId} showBookButton={false} />}
                        </div>
                    </div>
                    <div className="flex items-center justify-center min-h-[400px]">
                        <div className="text-center">
                            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
                            <p className="text-muted-foreground">Loading analysis results...</p>
                        </div>
                    </div>
                </main>
            </>
        );
    }

    if (error || !analysis) {
        return (
            <>
                <Sidebar />
                <main className="ml-20 lg:ml-64 p-6 lg:p-8">
                    <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-foreground">Blood Analysis Results</h1>
                            <p className="text-muted-foreground mt-1">Review your blood test results</p>
                        </div>
                        <div className="flex items-center gap-3">
                            {userId && <ProfileCard userId={userId} showBookButton={false} />}
                        </div>
                    </div>
                    <Card className="p-12 text-center">
                        <AlertCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-xl font-semibold mb-2">No Analysis Results</h3>
                        <p className="text-muted-foreground mb-4">
                            {error || "Your blood analysis results will appear here after your next donation."}
                        </p>
                    </Card>
                </main>
            </>
        );
    }

    return (
        <>
            <Sidebar />
            <main className="ml-20 lg:ml-64 p-6 lg:p-8">
                {/* Fixed Header */}
                <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Blood Analysis Results</h1>
                        <p className="text-muted-foreground mt-1">
                            Analysis Date: {formatDate(analysis.analysisDate)}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        {userId && <ProfileCard userId={userId} showBookButton={false} />}
                    </div>
                </div>


                <div className="mb-6">
                    {analysis.isComplete && analysis.isDonorEligible ? (
                        <Badge className="bg-green-100 text-green-700 px-4 py-2">
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Eligible Donor
                        </Badge>
                    ) : analysis.isComplete ? (
                        <Badge className="bg-red-100 text-red-700 px-4 py-2">
                            <XCircle className="w-4 h-4 mr-2" />
                            Not Eligible
                        </Badge>
                    ) : (
                        <Badge className="bg-yellow-100 text-yellow-700 px-4 py-2">
                            <Clock className="w-4 h-4 mr-2" />
                            In Progress
                        </Badge>
                    )}
                </div>

                {!isAiLoading && aiRecommendation && aiRecommendation.success && (
                    <Card className="p-6 mb-6 bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                                <Brain className="w-6 h-6 text-purple-600" />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between flex-wrap gap-2">
                                    <h2 className="text-xl font-semibold text-purple-900">AI Health Recommendation</h2>
                                    <Badge className={getReadinessColor(aiRecommendation.readinessLevel)}>
                                        {aiRecommendation.readinessText}
                                    </Badge>
                                </div>
                                <ul className="mt-2 space-y-1">
                                    {splitAdvice(aiRecommendation.healthAdvice).map((tip, i) => (
                                        <li key={i} className="flex items-start gap-2 text-purple-700 text-sm">
                                            <span className="mt-1 shrink-0">•</span>
                                            <span>{tip}</span>
                                        </li>
                                    ))}
                                </ul>

                                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                                    <div className="bg-white/50 rounded-lg p-3 text-center">
                                        <p className="text-xs text-purple-600">Next Donation</p>
                                        <p className="text-lg font-bold text-purple-900">
                                            {aiRecommendation.nextDonationDays > 0
                                                ? `${aiRecommendation.nextDonationDays} days`
                                                : "Ready now"}
                                        </p>
                                    </div>
                                    <div className="bg-white/50 rounded-lg p-3 text-center">
                                        <p className="text-xs text-purple-600">BMI</p>
                                        <p className="text-lg font-bold text-purple-900">
                                            {aiRecommendation.bmi.toFixed(1)}
                                        </p>
                                        <p className="text-xs text-purple-600">{aiRecommendation.bmiCategory}</p>
                                    </div>
                                    <div className="bg-white/50 rounded-lg p-3 text-center">
                                        <p className="text-xs text-purple-600">Confidence</p>
                                        <p className="text-lg font-bold text-purple-900">
                                            {(aiRecommendation.confidence * 100).toFixed(0)}%
                                        </p>
                                    </div>
                                    <div className="bg-white/50 rounded-lg p-3 text-center">
                                        <p className="text-xs text-purple-600">Ready Soon</p>
                                        <p className={`text-lg font-bold ${aiRecommendation.readySoon ? 'text-green-600' : 'text-red-500'}`}>
                                            {aiRecommendation.readySoon ? 'Yes' : 'No'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>
                )}

                <Tabs defaultValue="infectious" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 mb-6">
                        <TabsTrigger value="infectious">Infectious Diseases</TabsTrigger>
                        <TabsTrigger value="biochemical">Biochemical</TabsTrigger>
                        <TabsTrigger value="summary">Summary</TabsTrigger>
                    </TabsList>

                    <TabsContent value="infectious">
                        <Card className="p-6">
                            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                <Activity className="w-5 h-5 text-primary" />
                                Infectious Disease Screening
                            </h3>
                            <div className="space-y-3">
                                {[
                                    { label: "HIV", value: analysis.hiv },
                                    { label: "Brucellosis", value: analysis.brucellosis },
                                    { label: "Hepatitis B", value: analysis.hepatitisB },
                                    { label: "Hepatitis C", value: analysis.hepatitisC },
                                    { label: "Syphilis", value: analysis.syphilis }
                                ].map((test) => (
                                    <div key={test.label} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <AlertCircle className="w-4 h-4 text-muted-foreground" />
                                            <span className="font-medium">{test.label}</span>
                                        </div>
                                        <Badge className={getStatusColor(test.value || "")}>
                                            {test.value || "Pending"}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </TabsContent>

                    <TabsContent value="biochemical">
                        <Card className="p-6">
                            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                <Droplet className="w-5 h-5 text-primary" />
                                Biochemical Analysis
                            </h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <Heart className="w-4 h-4 text-muted-foreground" />
                                        <span className="font-medium">Hemoglobin</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="font-bold">{analysis.hemoglobin || "—"} g/L</span>
                                        <span className="text-xs text-muted-foreground ml-2">(Normal: &gt;125)</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <Activity className="w-4 h-4 text-muted-foreground" />
                                        <span className="font-medium">ALT Level</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="font-bold">{analysis.altLevel || "—"} U/L</span>
                                        <span className="text-xs text-muted-foreground ml-2">(Normal: &lt;40)</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <Droplet className="w-4 h-4 text-muted-foreground" />
                                        <span className="font-medium">Blood Type</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="font-bold">
                                            {analysis.bloodGroup}{analysis.rhesusFactor === "POSITIVE" ? "+" : "-"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </TabsContent>

                    <TabsContent value="summary">
                        <Card className="p-6">
                            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                <Shield className="w-5 h-5 text-primary" />
                                Analysis Summary
                            </h3>

                            <div className="space-y-4">
                                <div className="p-4 bg-muted/30 rounded-lg">
                                    <div className="flex items-center gap-2 mb-2">
                                        {analysis.isComplete && analysis.isDonorEligible ? (
                                            <CheckCircle className="w-5 h-5 text-green-600" />
                                        ) : (
                                            <AlertCircle className="w-5 h-5 text-red-600" />
                                        )}
                                        <span className="font-semibold">
                                            {analysis.isComplete && analysis.isDonorEligible
                                                ? "You are eligible to donate blood"
                                                : "You are not eligible to donate blood at this time"}
                                        </span>
                                    </div>
                                    {analysis.technicianNotes && (
                                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                            <p className="text-sm text-muted-foreground">
                                                <span className="font-medium">Technician Notes:</span> {analysis.technicianNotes}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {aiRecommendation && aiRecommendation.bmi > 0 && (
                                    <div className="p-4 bg-muted/30 rounded-lg">
                                        <div className="flex justify-between mb-2">
                                            <span className="text-sm font-medium">BMI: {aiRecommendation.bmi.toFixed(1)}</span>
                                            <span className="text-sm text-muted-foreground">{aiRecommendation.bmiCategory}</span>
                                        </div>
                                        <Progress
                                            value={Math.min((aiRecommendation.bmi / 35) * 100, 100)}
                                            className="h-2"
                                        />
                                        <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                                            <span>Underweight</span>
                                            <span>Normal</span>
                                            <span>Overweight</span>
                                            <span>Obese</span>
                                        </div>
                                    </div>
                                )}

                                {!isAiLoading && aiRecommendation && aiRecommendation.success && (
                                    <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                                        <div className="flex items-start gap-3">
                                            <Sparkles className="w-5 h-5 text-purple-600 mt-0.5" />
                                            <div>
                                                <p className="font-medium text-purple-900">AI Health Assistant Suggests:</p>
                                                <ul className="mt-1 space-y-1">
                                                    {splitAdvice(aiRecommendation.healthAdvice).map((tip, i) => (
                                                        <li key={i} className="flex items-start gap-2 text-purple-700 text-sm">
                                                            <span className="mt-1 shrink-0">•</span>
                                                            <span>{tip}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                                {aiRecommendation.nextDonationDays > 0 && (
                                                    <p className="text-purple-600 text-sm mt-2">
                                                        <Calendar className="w-4 h-4 inline mr-1" />
                                                        You can donate again in {aiRecommendation.nextDonationDays} days
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Card>
                    </TabsContent>
                </Tabs>
            </main>
            <AiChatBot userId={userId} donorContext={donorData} />
        </>
    );
}


export default function AnalysisPage() {
    const searchParams = useSearchParams();
    const userId = searchParams.get('userId') || searchParams.get('id') || (typeof window !== 'undefined' ? localStorage.getItem('userId') : null);

    return (
        <div className="min-h-screen bg-background">
            <DonorContextProvider userId={userId}>
                <AnalysisContent />
            </DonorContextProvider>
        </div>
    );
}