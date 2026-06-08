"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Loader2,
    CheckCircle,
    XCircle,
    Clock,
    Building2,
    FileText,
    Search,
    TrendingUp,
    Calendar,
    Filter,
    Download
} from "lucide-react";

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

export default function LicenseHistoryPage() {
    const [licenses, setLicenses] = useState<License[]>([]);
    const [filteredLicenses, setFilteredLicenses] = useState<License[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [stats, setStats] = useState<any>(null);
    const [activeTab, setActiveTab] = useState("all");

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/auth/login';
            return;
        }
        fetchAllLicenses();
        fetchStats();
    }, []);

    const fetchAllLicenses = async () => {
        try {
            const headers = getAuthHeaders();
            if (!headers) {
                window.location.href = '/auth/login';
                return;
            }

            const response = await fetch('http://localhost:8080/admin/licenses/all', {
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
            setFilteredLicenses(data);
        } catch (err) {
            console.error('Error fetching licenses:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const headers = getAuthHeaders();
            if (!headers) return;

            const response = await fetch('http://localhost:8080/admin/licenses/stats', {
                headers: headers,
            });

            if (response.ok) {
                const data = await response.json();
                setStats(data);
            }
        } catch (err) {
            console.error('Error fetching stats:', err);
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
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "APPROVED":
                return <Badge className="bg-green-100 text-green-700 border-green-200"><CheckCircle className="w-3 h-3 mr-1" /> Approved</Badge>;
            case "REJECTED":
                return <Badge className="bg-red-100 text-red-700 border-red-200"><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>;
            default:
                return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
        }
    };

    useEffect(() => {
        let filtered = licenses;

        if (activeTab !== "all") {
            filtered = filtered.filter(l =>
                activeTab === "approved" ? l.verificationStatus === "APPROVED" :
                    activeTab === "rejected" ? l.verificationStatus === "REJECTED" :
                        l.verificationStatus === "PENDING"
            );
        }

        if (searchTerm) {
            filtered = filtered.filter(l =>
                l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                l.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                l.location.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        setFilteredLicenses(filtered);
    }, [searchTerm, activeTab, licenses]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-foreground">License History</h1>
                <p className="text-muted-foreground mt-1">View all license verification requests and their status</p>
            </div>

            {/* Statistics Cards */}
            {stats && (
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-blue-600">Total Requests</p>
                                <p className="text-2xl font-bold text-blue-700">{stats.total}</p>
                            </div>
                            <FileText className="w-8 h-8 text-blue-500 opacity-50" />
                        </div>
                    </Card>
                    <Card className="p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-yellow-600">Pending</p>
                                <p className="text-2xl font-bold text-yellow-700">{stats.pending}</p>
                            </div>
                            <Clock className="w-8 h-8 text-yellow-500 opacity-50" />
                        </div>
                    </Card>
                    <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-green-600">Approved</p>
                                <p className="text-2xl font-bold text-green-700">{stats.approved}</p>
                            </div>
                            <CheckCircle className="w-8 h-8 text-green-500 opacity-50" />
                        </div>
                    </Card>
                    <Card className="p-4 bg-gradient-to-br from-red-50 to-red-100 border-red-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-red-600">Rejected</p>
                                <p className="text-2xl font-bold text-red-700">{stats.rejected}</p>
                            </div>
                            <XCircle className="w-8 h-8 text-red-500 opacity-50" />
                        </div>
                    </Card>
                </div>
            )}

            {/* Search and Filter */}
            <Card className="p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by center name, email or location..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div>
            </Card>

            {/* Tabs */}
            <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full max-w-md grid-cols-3">
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="approved">Approved</TabsTrigger>
                    <TabsTrigger value="rejected">Rejected</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="mt-6">
                    <LicenseList licenses={filteredLicenses} onViewLicense={handleViewLicense} formatDate={formatDate} getStatusBadge={getStatusBadge} />
                </TabsContent>
                <TabsContent value="approved" className="mt-6">
                    <LicenseList licenses={filteredLicenses} onViewLicense={handleViewLicense} formatDate={formatDate} getStatusBadge={getStatusBadge} />
                </TabsContent>
                <TabsContent value="rejected" className="mt-6">
                    <LicenseList licenses={filteredLicenses} onViewLicense={handleViewLicense} formatDate={formatDate} getStatusBadge={getStatusBadge} />
                </TabsContent>
            </Tabs>
        </div>
    );
}

// Компонент списка лицензий
function LicenseList({ licenses, onViewLicense, formatDate, getStatusBadge }: any) {
    if (licenses.length === 0) {
        return (
            <Card className="p-12 text-center">
                <FileText className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-30" />
                <p className="text-muted-foreground">No licenses found</p>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {licenses.map((license: License) => (
                <Card key={`${license.type}-${license.id}`} className="p-6 hover:shadow-md transition-all">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <Building2 className="w-5 h-5 text-primary" />
                                <h3 className="text-lg font-semibold text-foreground">{license.name}</h3>
                                <Badge variant="outline" className={
                                    license.type === "BLOOD_CENTER"
                                        ? "bg-green-100 text-green-700"
                                        : "bg-purple-100 text-purple-700"
                                }>
                                    {license.type === "BLOOD_CENTER" ? "Blood Center" : "Medical Center"}
                                </Badge>
                                {getStatusBadge(license.verificationStatus)}
                            </div>

                            <div className="space-y-1 text-sm text-muted-foreground">
                                <p>📍 {license.location}</p>
                                <p>👤 Director: {license.directorFullName}</p>
                                <p>📧 {license.userEmail}</p>
                                <div className="flex items-center gap-4 mt-2">
                                    <span className="flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        Registered: {formatDate(license.createdAt)}
                                    </span>
                                </div>
                            </div>

                            {license.rejectionReason && license.verificationStatus === "REJECTED" && (
                                <div className="mt-3 p-2 bg-red-50 rounded-lg border border-red-200">
                                    <p className="text-xs text-red-600">
                                        <strong>Rejection Reason:</strong> {license.rejectionReason}
                                    </p>
                                </div>
                            )}

                            <div className="mt-3 flex flex-wrap gap-2">
                                <button
                                    onClick={() => onViewLicense(license)}
                                    className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                                >
                                    <FileText className="w-4 h-4" />
                                    View License Document
                                </button>
                            </div>
                        </div>
                    </div>
                </Card>
            ))}
        </div>
    );
}