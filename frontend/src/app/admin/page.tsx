"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminIndexPage() {
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/auth/login');
            return;
        }

        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                if (user.role !== 'ADMIN') {
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
            } catch (e) {
                console.error("Error parsing user", e);
            }
        }

        router.push('/admin/dashboard');
    }, [router]);

    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
    );
}