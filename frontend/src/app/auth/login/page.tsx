"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMounted } from "@/hooks/useMounted"
import { Heart, Loader2, Eye, EyeOff, AlertCircle, X, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { login } from "@/app/auth/auth-api"

export default function LoginPage() {
    const router = useRouter()
    const mounted = useMounted()
    const [isLoading, setIsLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({})
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    })

    const validateEmail = (email: string) => {
        if (!email) return "Email is required"
        if (!/^[A-Za-z0-9+_.-]+@(.+)$/.test(email)) return "Invalid email format"
        return null
    }

    const validatePassword = (password: string) => {
        if (!password) return "Password is required"
        if (password.length < 6) return "Password must be at least 6 characters"
        return null
    }

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newEmail = e.target.value
        setFormData({ ...formData, email: newEmail })
        const emailError = validateEmail(newEmail)
        setFieldErrors(prev => ({ ...prev, email: emailError || undefined }))
        setError(null)
    }

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newPassword = e.target.value
        setFormData({ ...formData, password: newPassword })
        const passwordError = validatePassword(newPassword)
        setFieldErrors(prev => ({ ...prev, password: passwordError || undefined }))
        setError(null)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        const emailError = validateEmail(formData.email)
        const passwordError = validatePassword(formData.password)

        if (emailError || passwordError) {
            setFieldErrors({
                email: emailError || undefined,
                password: passwordError || undefined
            })
            return
        }

        setError(null)
        setFieldErrors({})
        setIsLoading(true)

        try {
            const response = await login(formData.email, formData.password)
            const role = response.role

            if (role === "DONOR") router.push("/dashboard/for-donor")
            else if (role === "BLOOD_CENTER") router.push("/dashboard/for-bloodcenter")
            else if (role === "MEDICAL_CENTER") router.push("/dashboard/for-medcenter")
            else if (role === "ADMIN") router.push("/admin/dashboard")
            else router.push("/dashboard")
        } catch (err: any) {
            console.error("Login error:", err)
            const errorMessage = err.message || "Login failed"


            if (errorMessage.toLowerCase().includes("email not found")) {
                setFieldErrors({ email: errorMessage })
            } else if (errorMessage.toLowerCase().includes("incorrect password")) {
                setFieldErrors({ password: errorMessage })
            } else if (errorMessage.toLowerCase().includes("invalid email")) {
                setFieldErrors({ email: errorMessage })
            } else {
                setError(errorMessage)
            }
        } finally {
            setIsLoading(false)
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
        <div className="flex min-h-screen flex-col bg-gradient-to-br from-background to-secondary/20">
            <header className="border-b border-border bg-card/80 backdrop-blur-sm">
                <div className="container mx-auto flex h-16 items-center justify-between px-4">
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary transition-all group-hover:scale-105">
                            <Heart className="h-5 w-5 text-primary-foreground" fill="currentColor" />
                        </div>
                        <span className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                            BloodConnect
                        </span>
                    </Link>
                    <nav className="flex items-center gap-4">
                        <Link
                            href="/auth/login"
                            className="text-sm font-medium text-primary transition-colors hover:text-primary/80"
                        >
                            Log In
                        </Link>
                        <Link
                            href="/auth/register"
                            className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 hover:scale-105"
                        >
                            Register
                        </Link>
                    </nav>
                </div>
            </header>

            <main className="flex flex-1 items-center justify-center p-4">
                <Card className="w-full max-w-md rounded-2xl border-border bg-card/50 backdrop-blur-sm shadow-xl">
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 transition-all">
                            <Heart className="h-7 w-7 text-primary" fill="currentColor" />
                        </div>
                        <CardTitle className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                            Welcome Back
                        </CardTitle>
                        <CardDescription className="text-muted-foreground">
                            Sign in to your BloodConnect account
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                            {error && (
                                <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive flex items-center gap-2 animate-shake">
                                    <AlertCircle className="h-4 w-4 shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}


                            <div className="flex flex-col gap-2">
                                <Label htmlFor="email" className="text-sm font-medium flex items-center justify-between">
                                    <span>Email</span>
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="Enter your email"
                                        value={formData.email}
                                        onChange={handleEmailChange}
                                        required
                                        disabled={isLoading}
                                        className={`rounded-xl border-border bg-background/50 focus:bg-background transition-all pr-10 ${
                                            fieldErrors.email ? "border-red-500 focus:border-red-500" :
                                                formData.email && !fieldErrors.email ? "border-green-500" : ""
                                        }`}
                                    />
                                    {fieldErrors.email && (
                                        <X className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-red-500" />
                                    )}
                                    {formData.email && !fieldErrors.email && (
                                        <Check className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-green-500" />
                                    )}
                                </div>
                                {fieldErrors.email && (
                                    <p className="text-xs text-red-500 flex items-center gap-1 mt-1 animate-fade-in">
                                        <AlertCircle className="h-3 w-3" />
                                        {fieldErrors.email}
                                    </p>
                                )}
                            </div>

                            <div className="flex flex-col gap-2">
                                <Label htmlFor="password" className="text-sm font-medium flex items-center justify-between">
                                    <span>Password</span>
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Enter your password"
                                        value={formData.password}
                                        onChange={handlePasswordChange}
                                        required
                                        disabled={isLoading}
                                        className={`rounded-xl border-border bg-background/50 focus:bg-background transition-all pr-10 ${
                                            fieldErrors.password ? "border-red-500 focus:border-red-500" :
                                                formData.password && !fieldErrors.password ? "border-green-500" : ""
                                        }`}
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                        onClick={() => setShowPassword(!showPassword)}
                                        disabled={isLoading}
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                {fieldErrors.password && (
                                    <p className="text-xs text-red-500 flex items-center gap-1 mt-1 animate-fade-in">
                                        <AlertCircle className="h-3 w-3" />
                                        {fieldErrors.password}
                                    </p>
                                )}
                            </div>

                            <Button
                                type="submit"
                                className="w-full rounded-xl bg-primary hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                disabled={isLoading || !!fieldErrors.email || !!fieldErrors.password}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        Signing in...
                                    </>
                                ) : (
                                    "Sign In"
                                )}
                            </Button>

                            <p className="text-center text-sm text-muted-foreground">
                                {"Don't have an account? "}
                                <Link href="/auth/register" className="text-primary hover:underline font-medium">
                                    Register
                                </Link>
                            </p>
                        </form>
                    </CardContent>
                </Card>
            </main>
        </div>
    )
}