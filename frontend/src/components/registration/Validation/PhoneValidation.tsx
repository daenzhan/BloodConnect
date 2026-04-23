"use client"

import { Check, X } from "lucide-react"

interface PhoneValidationProps {
    phone: string
}

export function PhoneValidation({ phone }: PhoneValidationProps) {
    const isValid = /^\+?[0-9]{10,15}$/.test(phone)
    const isLongEnough = phone.replace(/[^0-9]/g, '').length >= 10
    const isMaxDigits = phone.replace(/[^0-9]/g, '').length <= 15
    const hasOnlyDigits = /^[0-9+]+$/.test(phone)

    return (
        <div className="mt-2 space-y-1">
            <div className="flex items-center gap-2">
                {isValid ? (
                    <Check className="h-3 w-3 text-green-500" />
                ) : (
                    <X className="h-3 w-3 text-red-500" />
                )}
                <span className={`text-xs ${isValid ? "text-green-500" : "text-muted-foreground"}`}>
                    {isValid ? "Phone number is valid" : "Phone number requirements:"}
                </span>
            </div>

            {!isValid && (
                <div className="pl-5 space-y-1">
                    <div className="flex items-center gap-2">
                        {hasOnlyDigits ? (
                            <Check className="h-3 w-3 text-green-500" />
                        ) : (
                            <X className="h-3 w-3 text-red-500" />
                        )}
                        <span className={`text-xs ${hasOnlyDigits ? "text-green-500" : "text-muted-foreground"}`}>
                            Only numbers and optional + at start
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        {isLongEnough ? (
                            <Check className="h-3 w-3 text-green-500" />
                        ) : (
                            <X className="h-3 w-3 text-red-500" />
                        )}
                        <span className={`text-xs ${isLongEnough ? "text-green-500" : "text-muted-foreground"}`}>
                            At least 10 digits
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        {isMaxDigits ? (
                            <Check className="h-3 w-3 text-green-500" />
                        ) : (
                            <X className="h-3 w-3 text-red-500" />
                        )}
                        <span className={`text-xs ${isMaxDigits ? "text-green-500" : "text-muted-foreground"}`}>
                            No more than 15 digits
                        </span>
                    </div>
                </div>
            )}
        </div>
    )
}