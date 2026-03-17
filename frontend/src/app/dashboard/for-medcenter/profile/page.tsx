"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { User, Building2, MapPin, Phone, FileText, Save, Edit2, Calendar } from "lucide-react"

// Matches MedCenter.java entity
interface MedCenterProfile {
    medCenterId: number
    name: string
    location: string
    phone: string
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
    const [editedProfile, setEditedProfile] = useState<Partial<MedCenterProfile>>({})

    // TODO: Get medCenterId from session/JWT token
    const medCenterId = 1

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                // Fetch med center profile from backend
                const response = await fetch(`http://localhost:8080/medcenter/${medCenterId}/info`)
                if (response.ok) {
                    const data: MedCenterProfile = await response.json()
                    setProfile(data)
                    setEditedProfile(data)
                }
            } catch (error) {
                console.error("Error fetching profile:", error)
                // Fallback to mock data matching MedCenter.java entity
                const mockProfile: MedCenterProfile = {
                    medCenterId: 1,
                    name: "City General Hospital",
                    location: "123 Medical Center Dr, Almaty",
                    phone: "+7 (727) 123-4567",
                    licenseFile: "license_12345.pdf",
                    directorFullName: "Dr. Sarah Johnson",
                    specialization: "General Medicine",
                    createdAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()
                }
                setProfile(mockProfile)
                setEditedProfile(mockProfile)
            } finally {
                setIsLoading(false)
            }
        }

        fetchProfile()
    }, [medCenterId])

    const handleSave = async () => {
        setIsSaving(true)
        try {
            // PUT to update med center profile
            const response = await fetch(`http://localhost:8080/medcenter/${medCenterId}/update`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                    // TODO: Add Authorization header with JWT token
                },
                body: JSON.stringify({
                    name: editedProfile.name,
                    location: editedProfile.location,
                    phone: editedProfile.phone,
                    directorFullName: editedProfile.directorFullName,
                    specialization: editedProfile.specialization
                })
            })

            if (response.ok) {
                const updatedData = await response.json()
                setProfile(updatedData)
                setIsEditing(false)
            } else {
                throw new Error("Failed to update profile")
            }
        } catch (error) {
            console.error("Error saving profile:", error)
            // For demo, just update locally
            setProfile(editedProfile as MedCenterProfile)
            setIsEditing(false)
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

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading profile...</p>
                </div>
            </div>
        )
    }

    if (!profile) {
        return (
            <div className="p-8 text-destructive">Error loading profile</div>
        )
    }

    return (
        <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                        <User className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Profile</h1>
                        <p className="text-muted-foreground">Manage your medical center information</p>
                    </div>
                </div>
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
                                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <Save className="w-4 h-4" />
                            )}
                            Save Changes
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
                        <Label htmlFor="name">Center Name</Label>
                        {isEditing ? (
                            <Input
                                id="name"
                                value={editedProfile.name || ""}
                                onChange={(e) => setEditedProfile({ ...editedProfile, name: e.target.value })}
                                className="rounded-xl"
                            />
                        ) : (
                            <p className="text-foreground p-3 bg-muted/50 rounded-xl">{profile.name}</p>
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
                            <p className="text-foreground p-3 bg-muted/50 rounded-xl">{profile.location}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="phone" className="flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            Phone Number
                        </Label>
                        {isEditing ? (
                            <Input
                                id="phone"
                                value={editedProfile.phone || ""}
                                onChange={(e) => setEditedProfile({ ...editedProfile, phone: e.target.value })}
                                className="rounded-xl"
                            />
                        ) : (
                            <p className="text-foreground p-3 bg-muted/50 rounded-xl">{profile.phone}</p>
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
                            <p className="text-foreground p-3 bg-muted/50 rounded-xl">
                                {profile.specialization || "Not specified"}
                            </p>
                        )}
                    </div>
                </div>
            </Card>

            <Card className="p-6 rounded-2xl border border-border">
                <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    Additional Details
                </h2>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="directorFullName">Director Full Name</Label>
                        {isEditing ? (
                            <Input
                                id="directorFullName"
                                value={editedProfile.directorFullName || ""}
                                onChange={(e) => setEditedProfile({ ...editedProfile, directorFullName: e.target.value })}
                                className="rounded-xl"
                            />
                        ) : (
                            <p className="text-foreground p-3 bg-muted/50 rounded-xl">
                                {profile.directorFullName || "Not specified"}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label>License File</Label>
                        <p className="text-foreground p-3 bg-muted/50 rounded-xl">
                            {profile.licenseFile || "No license file uploaded"}
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            Member Since
                        </Label>
                        <p className="text-foreground p-3 bg-muted/50 rounded-xl">
                            {formatDate(profile.createdAt)}
                        </p>
                    </div>
                </div>
            </Card>
        </div>
    )
}
