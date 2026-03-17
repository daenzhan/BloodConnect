import { Card } from "@/components/ui/card"
import { Trophy, Medal } from "lucide-react"

const topDonors = [
    { name: "Sarah Johnson", donations: 45, avatar: "SJ", rank: 1 },
    { name: "Michael Chen", donations: 42, avatar: "MC", rank: 2 },
    { name: "Emily Davis", donations: 38, avatar: "ED", rank: 3 },
    { name: "James Wilson", donations: 35, avatar: "JW", rank: 4 },
    { name: "Anna Smith", donations: 32, avatar: "AS", rank: 5 },
]

const rankColors: Record<number, string> = {
    1: "bg-chart-4 text-foreground",
    2: "bg-gray-300 text-foreground",
    3: "bg-chart-5 text-foreground",
}

export function TopDonors() {
    return (
        <Card className="p-4 rounded-2xl border border-border">
            <div className="flex items-center gap-2 mb-4">
                <Trophy className="w-5 h-5 text-chart-4" />
                <h3 className="font-semibold text-foreground">Top Donors</h3>
            </div>

            <div className="space-y-3">
                {topDonors.map((donor) => (
                    <div
                        key={donor.rank}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
                    >
                        {/* Rank */}
                        <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                rankColors[donor.rank] || "bg-muted text-muted-foreground"
                            }`}
                        >
                            {donor.rank <= 3 ? (
                                <Medal className="w-3.5 h-3.5" />
                            ) : (
                                donor.rank
                            )}
                        </div>

                        {/* Avatar */}
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-xs font-semibold text-primary">
                {donor.avatar}
              </span>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                                {donor.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {donor.donations} donations
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            <button className="w-full mt-4 text-sm text-primary hover:text-primary/80 transition-colors font-medium">
                View All Rankings
            </button>
        </Card>
    )
}
