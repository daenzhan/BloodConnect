"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminSidebar } from "./components/admin-sidebar";
import { Loader2 } from "lucide-react";

export default function AdminLayout({
                                        children,
                                    }: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');

        if (!token) {
            router.push('/auth/login');
            return;
        }

        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                if (user.role !== 'ADMIN') {
                    // Редирект на соответствующий дашборд
                    if (user.role === 'DONOR') {
                        router.push(`/dashboard/for-donor?userId=${user.userId}`);
                    } else if (user.role === 'BLOOD_CENTER') {
                        router.push(`/dashboard/for-bloodcenter?userId=${user.userId}`);
                    } else if (user.role === 'MEDICAL_CENTER') {
                        router.push(`/dashboard/for-medcenter?userId=${user.userId}`);
                    } else {
                        router.push('/');
                    }
                    return;
                }
                setIsAuthorized(true);
            } catch (e) {
                router.push('/auth/login');
            }
        } else {
            router.push('/auth/login');
        }
    }, [router]);

    if (!isAuthorized) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <AdminSidebar />
            <main className="ml-16 lg:ml-64 transition-all duration-300">
                <div className="p-6 lg:p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}