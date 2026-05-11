import { Sidebar } from "./components/sidebar"

export default function DonorLayout({
                                        children,
                                    }: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-background">
            <Sidebar />
            <main >
                {children}
            </main>
        </div>
    )
}