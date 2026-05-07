"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, Loader2, Mail, ArrowLeft, AlertCircle, Check, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { forgotPassword, resetPassword } from "@/app/auth/auth-api";

function PasswordStrength({ password }: { password: string }) {
    const getStrength = () => {
        let strength = 0;
        if (password.length >= 6) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[@#$%^&+=]/.test(password)) strength++;
        return strength;
    };

    const strength = getStrength();
    const getStrengthText = () => {
        if (strength === 0) return "";
        if (strength <= 2) return "Weak";
        if (strength === 3) return "Medium";
        return "Strong";
    };

    const getStrengthColor = () => {
        if (strength === 0) return "";
        if (strength <= 2) return "text-red-500";
        if (strength === 3) return "text-yellow-500";
        return "text-green-500";
    };

    if (!password) return null;

    return (
        <div className="mt-1">
            <p className={`text-xs ${getStrengthColor()}`}>
                Password strength: {getStrengthText()}
            </p>
            <div className="flex gap-1 mt-1">
                {[1, 2, 3, 4].map((level) => (
                    <div
                        key={level}
                        className={`h-1 flex-1 rounded-full ${
                            strength >= level
                                ? strength <= 2
                                    ? "bg-red-500"
                                    : strength === 3
                                        ? "bg-yellow-500"
                                        : "bg-green-500"
                                : "bg-gray-200"
                        }`}
                    />
                ))}
            </div>
        </div>
    );
}

function PasswordRequirements({ password }: { password: string }) {
    const requirements = [
        { label: "At least 6 characters", check: password.length >= 6 },
        { label: "At least one uppercase letter", check: /[A-Z]/.test(password) },
        { label: "At least one number", check: /[0-9]/.test(password) },
        { label: "At least one special character (@#$%^&+=)", check: /[@#$%^&+=]/.test(password) },
        { label: "No spaces", check: !/\s/.test(password) },
    ];

    return (
        <div className="mt-2 space-y-1">
            <p className="text-xs text-muted-foreground">Password requirements:</p>
            {requirements.map((req, index) => (
                <div key={index} className="flex items-center gap-2">
                    {req.check ? (
                        <Check className="h-3 w-3 text-green-500" />
                    ) : (
                        <div className="h-3 w-3 rounded-full border border-gray-300" />
                    )}
                    <span className={`text-xs ${req.check ? "text-green-600" : "text-muted-foreground"}`}>
                        {req.label}
                    </span>
                </div>
            ))}
        </div>
    );
}

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [code, setCode] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [passwordsMatch, setPasswordsMatch] = useState(true);
    const [passwordValid, setPasswordValid] = useState(false);

    const validateEmail = (email: string) => {
        if (!email) return "Email is required";
        if (!/^[A-Za-z0-9+_.-]+@(.+)$/.test(email)) return "Invalid email format";
        return null;
    };

    const validatePassword = (password: string) => {
        if (password.length < 6) return "Password must be at least 6 characters";
        if (!/[A-Z]/.test(password)) return "Password must contain at least one uppercase letter";
        if (!/[0-9]/.test(password)) return "Password must contain at least one number";
        if (!/[@#$%^&+=]/.test(password)) return "Password must contain at least one special character (@#$%^&+=)";
        if (/\s/.test(password)) return "Password cannot contain spaces";
        return null;
    };

    const checkPasswordValidity = (password: string) => {
        const isValid = password.length >= 6 &&
            /[A-Z]/.test(password) &&
            /[0-9]/.test(password) &&
            /[@#$%^&+=]/.test(password) &&
            !/\s/.test(password);
        setPasswordValid(isValid);
        return isValid;
    };

    const handleSendCode = async (e: React.FormEvent) => {
        e.preventDefault();

        const emailError = validateEmail(email);
        if (emailError) {
            setError(emailError);
            return;
        }

        setError(null);
        setIsLoading(true);

        try {
            await forgotPassword(email);
            setSuccess("Reset code sent to your email!");
            setStep(2);
        } catch (err: any) {
            setError(err.message || "Failed to send reset code");
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyAndReset = async (e: React.FormEvent) => {
        e.preventDefault();

        const passwordValidationError = validatePassword(newPassword);
        if (passwordValidationError) {
            setError(passwordValidationError);
            return;
        }

        if (newPassword !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (!code || code.length !== 6) {
            setError("Please enter a valid 6-digit code");
            return;
        }

        setError(null);
        setIsLoading(true);

        try {
            await resetPassword(email, code, newPassword);
            setSuccess("Password reset successfully! Redirecting to login...");
            setTimeout(() => {
                router.push("/auth/login");
            }, 2000);
        } catch (err: any) {
            setError(err.message || "Failed to reset password");
        } finally {
            setIsLoading(false);
        }
    };

    const checkPasswordsMatch = (pass: string, confirm: string) => {
        const match = pass === confirm;
        setPasswordsMatch(match);
        return match;
    };

    const handlePasswordChange = (value: string) => {
        setNewPassword(value);
        checkPasswordValidity(value);
        if (confirmPassword) {
            checkPasswordsMatch(value, confirmPassword);
        }
    };

    const handleConfirmPasswordChange = (value: string) => {
        setConfirmPassword(value);
        checkPasswordsMatch(newPassword, value);
    };

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
                </div>
            </header>

            <main className="flex flex-1 items-center justify-center p-4">
                <Card className="w-full max-w-md rounded-2xl border-border bg-card/50 backdrop-blur-sm shadow-xl">
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 transition-all">
                            <Heart className="h-7 w-7 text-primary" fill="currentColor" />
                        </div>
                        <CardTitle className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                            {step === 1 ? "Reset Password" : "Enter Reset Code"}
                        </CardTitle>
                        <CardDescription className="text-muted-foreground">
                            {step === 1
                                ? "Enter your email to receive a reset code"
                                : "Enter the 6-digit code sent to your email and create a new password"}
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        {error && (
                            <div className="mb-4 rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive flex items-center gap-2">
                                <AlertCircle className="h-4 w-4 shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        {success && (
                            <div className="mb-4 rounded-xl border border-green-500/20 bg-green-500/5 p-3 text-sm text-green-500 flex items-center gap-2">
                                <Check className="h-4 w-4 shrink-0" />
                                <span>{success}</span>
                            </div>
                        )}

                        {step === 1 && (
                            <form onSubmit={handleSendCode} className="flex flex-col gap-5">
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="email">Email Address</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="Enter your email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="pl-10"
                                            required
                                            disabled={isLoading}
                                        />
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full rounded-xl bg-primary hover:bg-primary/90"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                            Sending code...
                                        </>
                                    ) : (
                                        "Send Reset Code"
                                    )}
                                </Button>

                                <p className="text-center text-sm text-muted-foreground">
                                    <Link href="/auth/login" className="text-primary hover:underline flex items-center justify-center gap-1">
                                        <ArrowLeft className="w-3 h-3" />
                                        Back to Login
                                    </Link>
                                </p>
                            </form>
                        )}

                        {step === 2 && (
                            <form onSubmit={handleVerifyAndReset} className="flex flex-col gap-5">
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="code">Verification Code</Label>
                                    <Input
                                        id="code"
                                        type="text"
                                        placeholder="Enter 6-digit code"
                                        value={code}
                                        onChange={(e) => setCode(e.target.value)}
                                        maxLength={6}
                                        className="text-center text-lg tracking-widest"
                                        required
                                        disabled={isLoading}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Enter the 6-digit code sent to {email}
                                    </p>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="newPassword">New Password</Label>
                                    <div className="relative">
                                        <Input
                                            id="newPassword"
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Enter new password"
                                            value={newPassword}
                                            onChange={(e) => handlePasswordChange(e.target.value)}
                                            required
                                            disabled={isLoading}
                                            className={!passwordValid && newPassword ? "border-red-500" : ""}
                                        />
                                        <button
                                            type="button"
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                    <PasswordStrength password={newPassword} />
                                    <PasswordRequirements password={newPassword} />
                                </div>

                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                                    <Input
                                        id="confirmPassword"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Confirm new password"
                                        value={confirmPassword}
                                        onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                                        required
                                        disabled={isLoading}
                                        className={confirmPassword && !passwordsMatch ? "border-red-500" : ""}
                                    />
                                    {confirmPassword && !passwordsMatch && (
                                        <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                                            <AlertCircle className="h-3 w-3" />
                                            Passwords do not match
                                        </p>
                                    )}
                                </div>

                                <div className="flex gap-3">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setStep(1)}
                                        disabled={isLoading}
                                        className="flex-1 rounded-xl"
                                    >
                                        Back
                                    </Button>
                                    <Button
                                        type="submit"
                                        className="flex-1 rounded-xl bg-primary hover:bg-primary/90"
                                        disabled={isLoading || !passwordValid || !passwordsMatch || !code || code.length !== 6}
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                                Resetting...
                                            </>
                                        ) : (
                                            "Reset Password"
                                        )}
                                    </Button>
                                </div>
                            </form>
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}