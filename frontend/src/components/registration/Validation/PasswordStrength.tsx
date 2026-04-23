"use client"

import { Check, X } from "lucide-react"

interface PasswordRequirement {
    id: string
    label: string
    check: (password: string) => boolean
}

const requirements: PasswordRequirement[] = [
    {
        id: "length",
        label: "At least 6 characters",
        check: (pwd) => pwd.length >= 6
    },
    {
        id: "lowercase",
        label: "At least one lowercase letter",
        check: (pwd) => /[a-z]/.test(pwd)
    },
    {
        id: "uppercase",
        label: "At least one uppercase letter",
        check: (pwd) => /[A-Z]/.test(pwd)
    },
    {
        id: "number",
        label: "At least one number",
        check: (pwd) => /[0-9]/.test(pwd)
    },
    {
        id: "special",
        label: "At least one special character (@#$%^&+=)",
        check: (pwd) => /[@#$%^&+=]/.test(pwd)
    },
    {
        id: "no-spaces",
        label: "No spaces",
        check: (pwd) => !/\s/.test(pwd)
    }
]

interface PasswordStrengthProps {
    password: string
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
    const strength = requirements.filter(req => req.check(password)).length
    const percentage = (strength / requirements.length) * 100

    let strengthColor = "bg-red-500"
    let strengthText = "Weak"

    if (strength >= 6) {
        strengthColor = "bg-green-500"
        strengthText = "Strong"
    } else if (strength >= 4) {
        strengthColor = "bg-yellow-500"
        strengthText = "Medium"
    }

    return (
        <div className="mt-2 space-y-2">
            <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Password strength:</span>
                <span className={`text-xs font-medium ${
                    strength >= 6 ? "text-green-500" : strength >= 4 ? "text-yellow-500" : "text-red-500"
                }`}>
                    {strengthText}
                </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                    className={`h-full transition-all duration-300 ${strengthColor}`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
            <div className="space-y-1 mt-2">
                {requirements.map((req) => {
                    const isMet = req.check(password)
                    return (
                        <div key={req.id} className="flex items-center gap-2">
                            {isMet ? (
                                <Check className="h-3 w-3 text-green-500" />
                            ) : (
                                <X className="h-3 w-3 text-red-500" />
                            )}
                            <span className={`text-xs ${isMet ? "text-green-500" : "text-muted-foreground"}`}>
                                {req.label}
                            </span>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}