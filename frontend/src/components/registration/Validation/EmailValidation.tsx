"use client"

import { Check, X } from "lucide-react"

interface EmailValidationProps {
    email: string
}

export function EmailValidation({ email }: EmailValidationProps) {
    const isValid = /^[A-Za-z0-9+_.-]+@(.+)$/.test(email)
    const hasAtSymbol = email.includes('@')
    const hasDomain = email.includes('.') && email.split('@')[1]?.length > 3
    const isNotEmpty = email.length > 0

    if (!email) return null

    return (
        <div className="mt-2 space-y-1">
            <div className="flex items-center gap-2">
                {isValid ? (
                    <Check className="h-3 w-3 text-green-500" />
                ) : (
                    <X className="h-3 w-3 text-red-500" />
                )}
                <span className={`text-xs ${isValid ? "text-green-500" : "text-muted-foreground"}`}>
                    {isValid ? "Email is valid" : "Email requirements:"}
                </span>
            </div>

            {!isValid && isNotEmpty && (
                <div className="pl-5 space-y-1">
                    <div className="flex items-center gap-2">
                        {hasAtSymbol ? (
                            <Check className="h-3 w-3 text-green-500" />
                        ) : (
                            <X className="h-3 w-3 text-red-500" />
                        )}
                        <span className={`text-xs ${hasAtSymbol ? "text-green-500" : "text-muted-foreground"}`}>
                            Contains @ symbol
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        {hasDomain ? (
                            <Check className="h-3 w-3 text-green-500" />
                        ) : (
                            <X className="h-3 w-3 text-red-500" />
                        )}
                        <span className={`text-xs ${hasDomain ? "text-green-500" : "text-muted-foreground"}`}>
                            Has domain (e.g., gmail.com)
                        </span>
                    </div>
                </div>
            )}
        </div>
    )
}