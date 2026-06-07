"use client";

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    User,
    Building2,
    MapPin,
    FileText,
    Save,
    Edit2,
    Calendar,
    ArrowLeft,
    Loader2,
    Shield,
    CheckCircle,
    XCircle,
    Clock,
    AlertTriangle, Mail
} from "lucide-react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ProfileCard } from "@/app/dashboard/for-medcenter/components/profile-card"

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

interface MedCenterProfile {
    medCenterId: number
    name: string
    location: string
    licenseFile?: string
    directorFullName?: string
    specialization?: string
    createdAt?: string
    verificationStatus?: string
    rejectionReason?: string
}

export default function ProfilePage() {
    const [profile, setProfile] = useState<MedCenterProfile | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isEditing, setIsEditing] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [editedProfile, setEditedProfile] = useState<Partial<MedCenterProfile>>({})
    const [verificationStatus, setVerificationStatus] = useState<string | null>(null)
    const [rejectionReason, setRejectionReason] = useState<string | null>(null)

    const searchParams = useSearchParams()
    const router = useRouter()
    const userId = searchParams.get('userId')

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/auth/login';
            return;
        }
    }, []);

    useEffect(() => {
        if (!userId) {
            setError("User ID not provided in URL")
            setIsLoading(false)
            return
        }

        const fetchProfile = async () => {
            try {
                const headers = getAuthHeaders();
                if (!headers) {
                    window.location.href = '/auth/login';
                    return;
                }
                console.log("Fetching profile for user ID:", userId)

                const response = await fetch(`http://localhost:8080/medcenter/user/${userId}`, {
                    headers: headers
                })
                console.log("Response status:", response.status)

                if (response.status === 403) {
                    setVerificationStatus("PENDING")
                    setIsLoading(false)
                    return
                }

                if (response.status === 401) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    window.location.href = '/auth/login';
                    return;
                }

                if (response.ok) {
                    const data: MedCenterProfile = await response.json()
                    console.log("Profile data received:", data)
                    setProfile(data)
                    setEditedProfile(data)
                    setVerificationStatus(data.verificationStatus || "APPROVED")
                    setRejectionReason(data.rejectionReason || null)
                    setError(null)
                } else if (response.status === 404) {
                    setError(`Medical center for user ID ${userId} not found`)
                }else {
                    setError(`Failed to fetch profile: ${response.status}`)
                }
            } catch (error) {
                console.error("Error fetching profile:", error)
                setError("Network error. Please check if backend is running.")
            } finally {
                setIsLoading(false)
            }
        }

        if (userId) {
            fetchProfile()
        }
    }, [userId])

    const handleSave = async () => {
        if (!profile) return

        setIsSaving(true)
        setError(null)

        try {
            const headers = getAuthHeaders();
            if (!headers) {
                window.location.href = '/auth/login';
                return;
            }

            console.log("Updating profile for user ID:", userId)

            const response = await fetch(`http://localhost:8080/medcenter/update/${profile.medCenterId}`, {
                method: "PUT",
                headers: headers,
                body: JSON.stringify({
                    name: editedProfile.name,
                    location: editedProfile.location,
                    directorFullName: editedProfile.directorFullName,
                    specialization: editedProfile.specialization
                })
            })

            if (response.status === 401 || response.status === 403) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/auth/login';
                return;
            }

            if (response.ok) {
                const updatedData = await response.json()
                console.log("Updated data:", updatedData)
                setProfile(updatedData)
                setIsEditing(false)
                setError(null)
            } else {
                throw new Error(`Failed to update profile: ${response.status}`)
            }
        } catch (error) {
            console.error("Error saving profile:", error)
            setError("Failed to save changes. Please try again.")
        } finally {
            setIsSaving(false)
        }
    }

    const formatDate = (dateString?: string) => {
        if (!dateString) return "Not available"
        return new Date(dateString).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric"
        })
    }

    const handleViewLicense = () => {
        if (profile?.licenseFile && profile.licenseFile !== 'null') {
            window.open(`http://localhost:8080/api/files/download/${profile.licenseFile}`, '_blank');
        } else {
            alert('No license file uploaded');
        }
    };

    const renderVerificationStatus = () => {
        const status = profile?.verificationStatus;

        if (!status) return null;

        if (status === 'APPROVED') {
            return (
                <div className="p-4 rounded-xl bg-gradient-to-r from-green-50 to-green-100 border border-green-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <span className="font-semibold text-green-700">✓ Verified Account</span>
                            <p className="text-sm text-green-600">
                                Your account has been verified. You have full access to all features.
                            </p>
                        </div>
                    </div>
                </div>
            );
        }

        if (status === 'REJECTED') {
            return (
                <div className="p-4 rounded-xl bg-gradient-to-r from-red-50 to-red-100 border border-red-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
                            <XCircle className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                            <span className="font-semibold text-red-700"> Verification Rejected</span>
                            {profile?.rejectionReason && (
                                <p className="text-sm text-red-600 mt-1">
                                    <span className="font-medium">Reason:</span> {profile.rejectionReason}
                                </p>
                            )}
                            <p className="text-sm text-red-600 mt-1">
                                Please contact support for more information.
                            </p>
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div className="p-4 rounded-xl bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-200">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center animate-pulse">
                        <Clock className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                        <span className="font-semibold text-amber-700"> Pending Verification</span>
                        <p className="text-sm text-amber-600 mt-1">
                            Your account is awaiting admin approval. You will receive an email once your license is verified.
                        </p>
                        <p className="text-xs text-amber-500 mt-2">
                            While pending, you cannot create blood requests or access certain features.
                        </p>
                    </div>
                </div>
            </div>
        );
    };

    const renderPendingScreen = () => (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-amber-50 to-amber-100/30 p-4">
            <Card className="max-w-md w-full p-8 text-center shadow-xl border-0 bg-white">
                <div className="relative">
                    <div className="w-24 h-24 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                        <Clock className="w-12 h-12 text-white animate-pulse" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center shadow-md">
                        <span className="text-white text-xs font-bold">!</span>
                    </div>
                </div>

                <h2 className="text-2xl font-bold text-amber-800 mb-3">Account Pending Verification</h2>

                <div className="h-1 w-20 bg-gradient-to-r from-amber-400 to-amber-600 rounded-full mx-auto mb-6"></div>

                <p className="text-gray-600 mb-6">
                    Your medical center account is awaiting approval from the administrator.
                </p>

                <div className="bg-amber-50 rounded-xl p-4 mb-6 text-left border border-amber-200">
                    <div className="flex items-start gap-3">
                        <Shield className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                        <div className="text-sm">
                            <p className="font-semibold text-amber-800 mb-1">Why is this happening?</p>
                            <p className="text-amber-700">All medical centers must have their license verified before accessing the system. This ensures compliance with medical regulations.</p>
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
                                <li>• After approval, you can access your profile</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3">
                    <Button
                        onClick={() => router.push('/dashboard/for-medcenter')}
                        variant="outline"
                        className="flex-1 border-amber-300 text-amber-700 hover:bg-amber-50"
                    >
                        Back to Dashboard
                    </Button>
                    <Button
                        onClick={() => window.location.reload()}
                        className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white"
                    >
                        Refresh
                    </Button>
                </div>

                <p className="text-xs text-gray-400 mt-6">
                    Need help? Contact support at support@bloodconnect.com
                </p>
            </Card>
        </div>
    );

    const renderRejectedScreen = () => (
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
                    Your medical center account could not be verified by the administrator.
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
                    <Button
                        onClick={() => router.push('/dashboard/for-medcenter')}
                        className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white"
                    >
                        Back to Dashboard
                    </Button>
                </div>

                <p className="text-xs text-gray-400 mt-6">
                    Contact support: support@bloodconnect.com
                </p>
            </Card>
        </div>
    );

    if (verificationStatus === "PENDING") {
        return renderPendingScreen();
    }

    if (verificationStatus === "REJECTED") {
        return renderRejectedScreen();
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="relative">
                        <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
                    </div>
                    <p className="text-muted-foreground animate-pulse">Loading profile...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-[60vh] p-4">
                <Card className="max-w-md w-full p-8 text-center shadow-xl">
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle className="w-10 h-10 text-red-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800 mb-2">Error</h2>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <Button
                        onClick={() => router.back()}
                        className="bg-primary hover:bg-primary/90"
                    >
                        Go Back
                    </Button>
                </Card>
            </div>
        )
    }

    if (!profile) {
        return (
            <div className="flex items-center justify-center min-h-[60vh] p-4">
                <Card className="max-w-md w-full p-8 text-center shadow-xl">
                    <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Shield className="w-10 h-10 text-yellow-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800 mb-2">Profile Not Found</h2>
                    <p className="text-gray-600 mb-6">Unable to load profile information.</p>
                    <Button
                        onClick={() => window.location.href = '/dashboard/for-medcenter'}
                        className="bg-primary hover:bg-primary/90"
                    >
                        Back to Dashboard
                    </Button>
                </Card>
            </div>
        )
    }

    return (
        <div className="w-full px-4 py-6 md:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-gray-100/50 min-h-screen">
            <div className="max-w-3xl mx-auto">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-14 h-14 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-lg">
                            <Building2 className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-foreground">Medical Center Profile</h1>
                            <p className="text-sm text-muted-foreground">View and manage your center information</p>
                        </div>
                    </div>
                    {profile.verificationStatus === 'APPROVED' && (
                        <ProfileCard
                            name={profile.name}
                            location={profile.location}
                            userId={userId || ""}
                        />
                    )}
                </div>


                <div className="mb-6 animate-in slide-in-from-top duration-500">
                    {renderVerificationStatus()}
                </div>

                {profile.verificationStatus === 'APPROVED' && (
                    <div className="flex justify-end mb-1">
                        {!isEditing ? (
                            <Button
                                variant="outline"
                                className="gap-2 rounded-xl border-2 hover:bg-primary/5 transition-all"
                                onClick={() => setIsEditing(true)}
                            >
                                <Edit2 className="w-4 h-4" />
                                Edit Profile
                            </Button>
                        ) : (
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    className="rounded-xl"
                                    onClick={() => {
                                        setIsEditing(false)
                                        setEditedProfile(profile)
                                        setError(null)
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    className="bg-primary hover:bg-primary/90 gap-2 rounded-xl"
                                    onClick={handleSave}
                                    disabled={isSaving}
                                >
                                    {isSaving ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4 mr-2" />
                                            Save Changes
                                        </>
                                    )}
                                </Button>
                            </div>
                        )}
                    </div>
                )}

                <Card className="p-6 rounded-2xl border border-border shadow-lg bg-white">
                    <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-primary" />
                        Center Information

                    </h2>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-sm font-medium">Name</Label>
                            {isEditing && profile.verificationStatus === 'APPROVED' ? (
                                <Input
                                    id="name"
                                    value={editedProfile.name || ""}
                                    onChange={(e) => setEditedProfile({ ...editedProfile, name: e.target.value })}
                                    className="rounded-xl"
                                />
                            ) : (
                                <div className="p-3 bg-muted/30 rounded-xl text-foreground border border-border">
                                    {profile.name}
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="location" className="flex items-center gap-2 text-sm font-medium">
                                <MapPin className="w-4 h-4" />
                                Location
                            </Label>
                            {isEditing && profile.verificationStatus === 'APPROVED' ? (
                                <Input
                                    id="location"
                                    value={editedProfile.location || ""}
                                    onChange={(e) => setEditedProfile({ ...editedProfile, location: e.target.value })}
                                    className="rounded-xl"
                                />
                            ) : (
                                <div className="p-3 bg-muted/30 rounded-xl text-foreground border border-border">
                                    {profile.location || "Not specified"}
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="specialization" className="text-sm font-medium">Specialization</Label>
                            {isEditing && profile.verificationStatus === 'APPROVED' ? (
                                <Input
                                    id="specialization"
                                    value={editedProfile.specialization || ""}
                                    onChange={(e) => setEditedProfile({ ...editedProfile, specialization: e.target.value })}
                                    className="rounded-xl"
                                />
                            ) : (
                                <div className="p-3 bg-muted/30 rounded-xl text-foreground border border-border">
                                    {profile.specialization || "Not specified"}
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="directorFullName" className="text-sm font-medium">Director's Full Name</Label>
                            {isEditing && profile.verificationStatus === 'APPROVED' ? (
                                <Input
                                    id="directorFullName"
                                    value={editedProfile.directorFullName || ""}
                                    onChange={(e) => setEditedProfile({ ...editedProfile, directorFullName: e.target.value })}
                                    className="rounded-xl"
                                />
                            ) : (
                                <div className="p-3 bg-muted/30 rounded-xl text-foreground border border-border">
                                    {profile.directorFullName || "Not specified"}
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label className="flex items-center gap-2 text-sm font-medium">
                                <FileText className="w-4 h-4" />
                                License Document
                            </Label>
                            <div className="p-3 bg-muted/30 rounded-xl text-foreground border border-border">
                                {profile.licenseFile && profile.licenseFile !== 'null' ? (
                                    <button
                                        onClick={handleViewLicense}
                                        className="text-primary hover:underline flex items-center gap-2"
                                    >
                                        <FileText className="w-4 h-4" />
                                        View License Document
                                    </button>
                                ) : (
                                    <span className="text-muted-foreground">No license file uploaded</span>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="flex items-center gap-2 text-sm font-medium">
                                <Calendar className="w-4 h-4" />
                                Member Since
                            </Label>
                            <div className="p-3 bg-muted/30 rounded-xl text-foreground border border-border">
                                {formatDate(profile.createdAt)}
                            </div>
                        </div>
                    </div>
                </Card>

                {profile.verificationStatus === 'PENDING' && (
                    <div className="mt-6 text-center">
                        <p className="text-sm text-muted-foreground">
                            Need help? Contact support at <a href="mailto:support@bloodconnect.com" className="text-primary hover:underline">support@bloodconnect.com</a>
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}