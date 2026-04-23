"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMounted } from "@/hooks/useMounted"
import { Heart, Loader2, ArrowLeft, ArrowRight, Eye, EyeOff, Check, Mail, AlertCircle, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {sendVerificationCode, verifyCode, register, checkPhoneExists, checkEmailExists} from "@/app/auth/auth-api"
import type { Role, BaseRegistrationData, DonorData, BloodCenterData, MedicalCenterData } from "@/app/auth/auth-types"
import { DonorForm } from "@/components/registration/donor-form"
import { BloodCenterForm } from "@/components/registration/blood-center-form"
import { MedicalCenterForm } from "@/components/registration/medical-center-form"
import { PasswordStrength } from "@/components/registration/Validation/PasswordStrength"
import { PhoneValidation } from "@/components/registration/Validation/PhoneValidation"
import { EmailValidation } from "@/components/registration/Validation/EmailValidation"
import { validateStep1, validateDonorData } from "@/lib/validation"

const roleDescriptions: Record<Role, string> = {
    DONOR: "Become a blood donor and help save lives",
    BLOOD_CENTER: "Register your blood donation center",
    MEDICAL_CENTER: "Register your medical facility",
}

export default function RegisterPage() {
    const router = useRouter()
    const mounted = useMounted()
    const [step, setStep] = useState(1)
    const [isLoading, setIsLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)

    const [step1Valid, setStep1Valid] = useState(false)
    const [donorValid, setDonorValid] = useState(false)

    const [emailChecking, setEmailChecking] = useState(false)
    const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null)
    const [emailError, setEmailError] = useState<string | null>(null)
    const [phoneChecking, setPhoneChecking] = useState(false)
    const [phoneAvailable, setPhoneAvailable] = useState<boolean | null>(null)

    const [baseData, setBaseData] = useState<BaseRegistrationData>({
        email: "",
        password: "",
        phoneNumber: "",
        role: "DONOR",
    })

    const [verificationCode, setVerificationCode] = useState("")

    const [donorData, setDonorData] = useState<DonorData>({
        fullName: "",
        birthDate: "",
        iin: "",
        weight: 0,
        height: 0,
        bloodGroup: "A",
        rhesusFactor: "POSITIVE",
        address: "",
        city: "",
        gender: "MALE",
    })

    const [bloodCenterData, setBloodCenterData] = useState<BloodCenterData>({
        bloodCenterName: "",
        location: "",
        city: "",
        specialization: "",
        licenseFile: null,
        directorFullName: "",
        latitude: 0,
        longitude: 0,
    })

    const [medicalCenterData, setMedicalCenterData] = useState<MedicalCenterData>({
        medCenterName: "",
        location: "",
        phone: "",
        licenseFile: null,
        directorFullName: "",
        specialization: "",
    })

    useEffect(() => {
        const checkEmail = async () => {
            if (!baseData.email || !/^[A-Za-z0-9+_.-]+@(.+)$/.test(baseData.email)) {
                setEmailAvailable(null)
                setEmailError(null)
                return
            }

            setEmailChecking(true)
            try {
                const result = await checkEmailExists(baseData.email)
                if (result.exists) {
                    setEmailAvailable(false)
                    setEmailError("This email is already registered. Please use another email or login.")
                } else {
                    setEmailAvailable(true)
                    setEmailError(null)
                }
            } catch (error) {
                console.error("Error checking email:", error)
            } finally {
                setEmailChecking(false)
            }
        }

        const timeoutId = setTimeout(checkEmail, 500)
        return () => clearTimeout(timeoutId)
    }, [baseData.email])


    useEffect(() => {
        const checkPhone = async () => {
            if (!baseData.phoneNumber || !/^\+?[0-9]{10,15}$/.test(baseData.phoneNumber)) {
                setPhoneAvailable(null)
                return
            }

            setPhoneChecking(true)
            try {
                const result = await checkPhoneExists(baseData.phoneNumber)
                setPhoneAvailable(!result.exists)
            } catch (error) {
                console.error("Error checking phone:", error)
            } finally {
                setPhoneChecking(false)
            }
        }

        const timeoutId = setTimeout(checkPhone, 500)
        return () => clearTimeout(timeoutId)
    }, [baseData.phoneNumber])

    useEffect(() => {
        const errors = validateStep1(baseData)
        const isEmailValid = emailAvailable === true
        const isPhoneValid = phoneAvailable === true
        const isFormatValid = Object.keys(errors).length === 0
        setStep1Valid(isFormatValid && isEmailValid && isPhoneValid)
    }, [baseData, emailAvailable, phoneAvailable])

    useEffect(() => {
        if (baseData.role === "DONOR") {
            const errors = validateDonorData(donorData)
            setDonorValid(Object.keys(errors).length === 0)
        } else {
            setDonorValid(true)
        }
    }, [donorData, baseData.role])

    const handleSendVerificationCode = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!step1Valid) {
            if (emailAvailable === false) {
                setError("This email is already registered. Please use another email or login.")
            } else if (phoneAvailable === false) {
                setError("This phone number is already registered.")
            } else {
                setError("Please fill in all fields correctly")
            }
            return
        }

        setError(null)
        setIsLoading(true)

        try {
            await sendVerificationCode(baseData.email)
            setSuccess(`Verification code sent to ${baseData.email}`)
            setStep(2)
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || "Failed to send verification code")
        } finally {
            setIsLoading(false)
        }
    }

    const handleFinalSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (baseData.role === "DONOR" && !donorValid) {
            setError("Please fill in all donor information correctly")
            return
        }

        setError(null)
        setIsLoading(true)

        try {
            const requestData = {
                ...baseData,
                ...(baseData.role === "DONOR" && { donorData }),
                ...(baseData.role === "BLOOD_CENTER" && { bloodCenterData }),
                ...(baseData.role === "MEDICAL_CENTER" && { medicalCenterData }),
            }

            const response = await register(requestData)
            const role = response.role

            if (role === "DONOR") router.push("/dashboard/for-donor")
            else if (role === "BLOOD_CENTER") router.push("/dashboard/for-bloodcenter")
            else if (role === "MEDICAL_CENTER") router.push("/dashboard/for-medcenter")
            else router.push("/dashboard")
        } catch (err: any) {
            setError(err.response?.data?.error || err.message || "Registration failed")
        } finally {
            setIsLoading(false)
        }
    }

    const handleVerifyCode = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setIsLoading(true)

        if (!verificationCode || verificationCode.length !== 6) {
            setError("Please enter a valid 6-digit code")
            setIsLoading(false)
            return
        }

        try {
            await verifyCode(baseData.email, verificationCode)
            setSuccess("Email verified successfully!")
            setStep(3)
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || "Invalid or expired verification code")
        } finally {
            setIsLoading(false)
        }
    }

    const handleBaseDataChange = (field: keyof BaseRegistrationData, value: any) => {
        setBaseData({ ...baseData, [field]: value })
        setError(null)
        if (field === "email") {
            setEmailAvailable(null)
            setEmailError(null)
        }
        if (field === "phoneNumber") {
            setPhoneAvailable(null)
        }
    }

    if (!mounted) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-pulse">
                    <Heart className="h-12 w-12 text-primary" />
                </div>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen flex-col bg-background">
            <header className="border-b border-border bg-card">
                <div className="container mx-auto flex h-16 items-center justify-between px-4">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary">
                            <Heart className="h-5 w-5 text-primary-foreground" fill="currentColor" />
                        </div>
                        <span className="text-xl font-bold text-foreground">BloodConnect</span>
                    </Link>
                    <nav className="flex items-center gap-4">
                        <Link href="/auth/login" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                            Log In
                        </Link>
                        <Link href="/auth/register" className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
                            Register
                        </Link>
                    </nav>
                </div>
            </header>

            <main className="flex flex-1 items-center justify-center p-4 py-8">
                <Card className="w-full max-w-2xl rounded-xl border border-border">
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                            <Heart className="h-6 w-6 text-primary" fill="currentColor" />
                        </div>
                        <CardTitle className="text-2xl font-bold text-foreground">
                            {step === 1 && "Create Account"}
                            {step === 2 && "Verify Your Email"}
                            {step === 3 && "Complete Your Profile"}
                        </CardTitle>
                        <CardDescription className="text-muted-foreground">
                            {step === 1 && "Join BloodConnect and start saving lives"}
                            {step === 2 && `Enter the code sent to ${baseData.email}`}
                            {step === 3 && roleDescriptions[baseData.role]}
                        </CardDescription>

                        <div className="mt-6 flex items-center justify-center gap-3">
                            <div className="flex items-center gap-2">
                                <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                                    step >= 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                                }`}>
                                    {step > 1 ? <Check className="h-4 w-4" /> : "1"}
                                </div>
                                <span className="text-sm font-medium text-foreground">Account</span>
                            </div>
                            <div className="h-px w-12 bg-border" />
                            <div className="flex items-center gap-2">
                                <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                                    step >= 2 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                                }`}>
                                    {step > 2 ? <Check className="h-4 w-4" /> : "2"}
                                </div>
                                <span className="text-sm font-medium text-foreground">Verify</span>
                            </div>
                            <div className="h-px w-12 bg-border" />
                            <div className="flex items-center gap-2">
                                <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                                    step >= 3 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                                }`}>
                                    3
                                </div>
                                <span className="text-sm font-medium text-foreground">Profile</span>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent>
                        {error && (
                            <div className="mb-4 flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
                                <AlertCircle className="h-4 w-4 shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        {success && (
                            <div className="mb-4 rounded-xl border border-green-500/20 bg-green-500/5 p-3 text-sm text-green-500">
                                {success}
                            </div>
                        )}

                        {step === 1 && (
                            <form onSubmit={handleSendVerificationCode} className="flex flex-col gap-4">
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="email" className="flex items-center gap-2">
                                        Email
                                        {emailChecking && <Loader2 className="h-3 w-3 animate-spin" />}
                                        {emailAvailable === true && !emailChecking && (
                                            <span className="text-xs text-green-500">✓ Email available</span>
                                        )}
                                        {emailAvailable === false && !emailChecking && (
                                            <span className="text-xs text-red-500">✗ Email already registered</span>
                                        )}
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="Enter your email"
                                            value={baseData.email}
                                            onChange={(e) => handleBaseDataChange("email", e.target.value)}
                                            className={`transition-all pr-10 ${
                                                emailAvailable === true ? "border-green-500 focus:border-green-500" :
                                                    emailAvailable === false ? "border-red-500 focus:border-red-500" :
                                                        baseData.email ? "border-yellow-500" : ""
                                            }`}
                                            required
                                        />
                                        {emailAvailable === true && (
                                            <Check className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-green-500" />
                                        )}
                                        {emailAvailable === false && (
                                            <X className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-red-500" />
                                        )}
                                    </div>
                                    <EmailValidation email={baseData.email} />
                                    {emailError && (
                                        <p className="text-xs text-red-500 flex items-center gap-1">
                                            <AlertCircle className="h-3 w-3" />
                                            {emailError}
                                        </p>
                                    )}
                                </div>

                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="password" className="flex items-center gap-2">
                                        Password
                                        {baseData.password && (
                                            <span className={`text-xs ${
                                                baseData.password.length >= 6 && /[A-Z]/.test(baseData.password) && /[0-9]/.test(baseData.password)
                                                    ? "text-green-500" : "text-red-500"
                                            }`}>
                                                {baseData.password.length >= 6 && /[A-Z]/.test(baseData.password) && /[0-9]/.test(baseData.password)
                                                    ? "✓ Strong" : "✗ Weak"}
                                            </span>
                                        )}
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="password"
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Create a password"
                                            value={baseData.password}
                                            onChange={(e) => handleBaseDataChange("password", e.target.value)}
                                            className={`pr-10 transition-all ${
                                                baseData.password && baseData.password.length >= 6 && /[A-Z]/.test(baseData.password) && /[0-9]/.test(baseData.password)
                                                    ? "border-green-500"
                                                    : baseData.password ? "border-red-500" : ""
                                            }`}
                                            required
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 p-0"
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                    <PasswordStrength password={baseData.password} />
                                </div>

                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="phone" className="flex items-center gap-2">
                                        Phone Number
                                        {phoneChecking && <Loader2 className="h-3 w-3 animate-spin" />}
                                        {phoneAvailable === true && !phoneChecking && baseData.phoneNumber && (
                                            <span className="text-xs text-green-500">✓ Phone available</span>
                                        )}
                                        {phoneAvailable === false && !phoneChecking && baseData.phoneNumber && (
                                            <span className="text-xs text-red-500">✗ Phone already registered</span>
                                        )}
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="phone"
                                            type="tel"
                                            placeholder="+7 (777) 123-4567"
                                            value={baseData.phoneNumber}
                                            onChange={(e) => handleBaseDataChange("phoneNumber", e.target.value)}
                                            className={`transition-all pr-10 ${
                                                phoneAvailable === true ? "border-green-500" :
                                                    phoneAvailable === false ? "border-red-500" :
                                                        baseData.phoneNumber ? "border-yellow-500" : ""
                                            }`}
                                            required
                                        />
                                        {phoneAvailable === true && (
                                            <Check className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-green-500" />
                                        )}
                                        {phoneAvailable === false && (
                                            <X className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-red-500" />
                                        )}
                                    </div>
                                    <PhoneValidation phone={baseData.phoneNumber} />
                                </div>


                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="role">I am registering as</Label>
                                    <Select
                                        value={baseData.role}
                                        onValueChange={(value: Role) => handleBaseDataChange("role", value)}
                                    >
                                        <SelectTrigger id="role" className="w-full">
                                            <SelectValue placeholder="Select your role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="DONOR"> Blood Donor</SelectItem>
                                            <SelectItem value="BLOOD_CENTER">Blood Center</SelectItem>
                                            <SelectItem value="MEDICAL_CENTER"> Medical Center</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <Button
                                    type="submit"
                                    className="mt-2 w-full rounded-xl transition-all"
                                    disabled={isLoading || !step1Valid}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Sending code...
                                        </>
                                    ) : (
                                        <>
                                            Continue
                                            <ArrowRight className="h-4 w-4" />
                                        </>
                                    )}
                                </Button>

                                {!step1Valid && baseData.email && baseData.password && baseData.phoneNumber && (
                                    <p className="text-center text-xs text-yellow-500">
                                         Please check the requirements above
                                    </p>
                                )}

                                <p className="text-center text-sm text-muted-foreground">
                                    Already have an account?{" "}
                                    <Link href="/auth/login" className="text-primary hover:underline">
                                        Sign In
                                    </Link>
                                </p>
                            </form>
                        )}

                        {step === 2 && (
                            <form onSubmit={handleVerifyCode} className="flex flex-col gap-4">
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="code">Verification Code</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            id="code"
                                            type="text"
                                            placeholder="Enter 6-digit code"
                                            value={verificationCode}
                                            onChange={(e) => setVerificationCode(e.target.value)}
                                            maxLength={6}
                                            className="pl-10 text-center text-lg tracking-widest"
                                            required
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Check your email for the verification code
                                    </p>
                                </div>

                                <div className="flex gap-3">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setStep(1)}
                                        disabled={isLoading}
                                        className="flex-1 rounded-xl"
                                    >
                                        <ArrowLeft className="h-4 w-4" />
                                        Back
                                    </Button>
                                    <Button type="submit" disabled={isLoading || verificationCode.length !== 6} className="flex-1 rounded-xl">
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Verifying...
                                            </>
                                        ) : (
                                            "Verify Code"
                                        )}
                                    </Button>
                                </div>
                            </form>
                        )}


                        {step === 3 && (
                            <form onSubmit={handleFinalSubmit} className="flex flex-col gap-4">
                                {baseData.role === "DONOR" && (
                                    <DonorForm
                                        data={donorData}
                                        onChange={setDonorData}
                                        onValidChange={setDonorValid}
                                    />
                                )}
                                {baseData.role === "BLOOD_CENTER" && (
                                    <BloodCenterForm data={bloodCenterData} onChange={setBloodCenterData} />
                                )}
                                {baseData.role === "MEDICAL_CENTER" && (
                                    <MedicalCenterForm data={medicalCenterData} onChange={setMedicalCenterData} />
                                )}

                                <div className="mt-4 flex gap-3">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setStep(2)}
                                        disabled={isLoading}
                                        className="flex-1 rounded-xl"
                                    >
                                        <ArrowLeft className="h-4 w-4" />
                                        Back
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={isLoading || (baseData.role === "DONOR" && !donorValid)}
                                        className="flex-1 rounded-xl"
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Creating account...
                                            </>
                                        ) : (
                                            "Create Account"
                                        )}
                                    </Button>
                                </div>
                            </form>
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
    )
}