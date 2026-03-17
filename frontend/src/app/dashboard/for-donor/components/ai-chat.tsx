"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MessageSquare, Send } from "lucide-react"
import { useState } from "react"

export function AiChat() {
    const [message, setMessage] = useState("")

    return (
        <Card className="p-4 rounded-2xl border border-border">
            <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <MessageSquare className="w-4 h-4 text-primary" />
                </div>
                <div>
                    <h3 className="font-semibold text-foreground text-sm">AI Assistant</h3>
                    <p className="text-xs text-muted-foreground">Ask me anything</p>
                </div>
            </div>

            <div className="h-32 bg-muted/50 rounded-lg mb-3 p-3 flex items-center justify-center">
                <p className="text-sm text-muted-foreground text-center">
                    Ask questions about blood donation, eligibility, or schedule an appointment.
                </p>
            </div>

            <div className="flex gap-2">
                <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground placeholder:text-muted-foreground"
                />
                <Button size="icon" className="bg-primary hover:bg-primary/90">
                    <Send className="w-4 h-4" />
                </Button>
            </div>
        </Card>
    )
}
