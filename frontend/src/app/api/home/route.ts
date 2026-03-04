import { NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8080"

export async function GET() {
    try {
        const response = await fetch(`${BACKEND_URL}/home`, {
            headers: {
                "Content-Type": "application/json",
            },
        })

        if (!response.ok) {
            return NextResponse.json(
                { error: "Failed to fetch data from backend" },
                { status: response.status }
            )
        }

        const data = await response.json()
        return NextResponse.json(data)
    } catch {
        return NextResponse.json(
            { error: "Backend service is unavailable" },
            { status: 503 }
        )
    }
}
