"use client";

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { User, Building2, MapPin, FileText, Save, Edit2, Calendar, ArrowLeft, Loader2 } from "lucide-react"
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
}

export default function ProfilePage() {
    const [profile, setProfile] = useState<MedCenterProfile | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isEditing, setIsEditing] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [editedProfile, setEditedProfile] = useState<Partial<MedCenterProfile>>({})

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

                if (response.status === 401 || response.status === 403) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    window.location.href = '/auth/login';
                    return;
                }

                console.log("Response status:", response.status)

                if (response.ok) {
                    const data: MedCenterProfile = await response.json()
                    console.log("Profile data received:", data)
                    setProfile(data)
                    setEditedProfile(data)
                    setError(null)
                } else if (response.status === 404) {
                    setError(`Medical center for user ID ${userId} not found`)
                } else {
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

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading profile...</p>
                </div>
            </div>
        )
    }

    if (error || !profile) {
        return (
            <div className="p-8 text-center">
                <p className="text-destructive mb-4">{error || "Profile not found"}</p>
                <Button
                    onClick={() => router.back()}
                    className="bg-primary hover:bg-primary/90 rounded-xl"
                >
                    Go back
                </Button>
            </div>
        )
    }

    return (
        <div className="w-full px-4 py-6 md:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                            <User className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-foreground">Medical Center Profile</h1>
                            <p className="text-sm text-muted-foreground">View and manage your center information</p>
                        </div>
                    </div>
                    <ProfileCard
                        name={profile.name}
                        location={profile.location}
                        userId={userId || ""}
                    />
                </div>

                <div className="flex justify-end mb-6">
                    {!isEditing ? (
                        <Button
                            variant="outline"
                            className="gap-2 rounded-xl"
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
                                        <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
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

                <Card className="p-6 rounded-2xl border border-border mb-6">
                    <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-primary" />
                        Center Information
                    </h2>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Name</Label>
                            {isEditing ? (
                                <Input
                                    id="name"
                                    value={editedProfile.name || ""}
                                    onChange={(e) => setEditedProfile({ ...editedProfile, name: e.target.value })}
                                    className="rounded-xl"
                                />
                            ) : (
                                <div className="p-3 bg-muted/50 rounded-xl text-foreground">
                                    {profile.name}
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="location" className="flex items-center gap-2">
                                <MapPin className="w-4 h-4" />
                                Location
                            </Label>
                            {isEditing ? (
                                <Input
                                    id="location"
                                    value={editedProfile.location || ""}
                                    onChange={(e) => setEditedProfile({ ...editedProfile, location: e.target.value })}
                                    className="rounded-xl"
                                />
                            ) : (
                                <div className="p-3 bg-muted/50 rounded-xl text-foreground">
                                    {profile.location}
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="specialization">Specialization</Label>
                            {isEditing ? (
                                <Input
                                    id="specialization"
                                    value={editedProfile.specialization || ""}
                                    onChange={(e) => setEditedProfile({ ...editedProfile, specialization: e.target.value })}
                                    className="rounded-xl"
                                />
                            ) : (
                                <div className="p-3 bg-muted/50 rounded-xl text-foreground">
                                    {profile.specialization || "Not specified"}
                                </div>
                            )}
                        </div>
                    </div>


                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="directorFullName">Director's Full Name</Label>
                            {isEditing ? (
                                <Input
                                    id="directorFullName"
                                    value={editedProfile.directorFullName || ""}
                                    onChange={(e) => setEditedProfile({ ...editedProfile, directorFullName: e.target.value })}
                                    className="rounded-xl"
                                />
                            ) : (
                                <div className="p-3 bg-muted/50 rounded-xl text-foreground">
                                    {profile.directorFullName || "Not specified"}
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                                <FileText className="w-4 h-4" />
                                License Document
                            </Label>
                            <div className="p-3 bg-muted/50 rounded-xl text-foreground">
                                {profile.licenseFile ? (
                                    <button
                                        onClick={handleViewLicense}
                                        className="text-primary hover:underline flex items-center gap-2"
                                    >
                                        <FileText className="w-4 h-4" />
                                        View License Document
                                    </button>
                                ) : (
                                    "No license file uploaded"
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                Member Since
                            </Label>
                            <div className="p-3 bg-muted/50 rounded-xl text-foreground">
                                {formatDate(profile.createdAt)}
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    )
}