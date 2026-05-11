import { Sidebar } from "./components/sidebar"

export default function MedCenterLayout({
                                            children,
                                        }: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-background">
            <Sidebar />
            <main className="ml-16 lg:ml-64 transition-all duration-300">
                {children}
            </main>
        </div>
    )
}