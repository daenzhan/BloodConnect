"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface DonorContextType {
    donorData: any;
    isLoading: boolean;
    error: string | null;
}

const DonorContext = createContext<DonorContextType>({
    donorData: null,
    isLoading: false,
    error: null,
});

export function useDonorContext() {
    return useContext(DonorContext);
}

interface DonorContextProviderProps {
    children: ReactNode;
    userId: string | null;
}

export function DonorContextProvider({ children, userId }: DonorContextProviderProps) {
    const [donorData, setDonorData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const getAuthHeaders = () => {
        const token = localStorage.getItem("token");
        if (!token) return null;
        return {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        };
    };

    useEffect(() => {
        const fetchDonorData = async () => {
            if (!userId || userId === 'null') {
                setIsLoading(false);
                return;
            }

            try {
                const headers = getAuthHeaders();
                if (!headers) {
                    setIsLoading(false);
                    return;
                }

                const response = await fetch(`http://localhost:8080/donor/dashboard/${userId}`, {
                    headers,
                });

                if (response.ok) {
                    const data = await response.json();
                    setDonorData(data);
                } else if (response.status === 401 || response.status === 403) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    localStorage.removeItem('userId');
                }
            } catch (error) {
                console.error("Error fetching donor data for chat:", error);
                setError(error instanceof Error ? error.message : "Failed to fetch donor data");
            } finally {
                setIsLoading(false);
            }
        };

        fetchDonorData();
    }, [userId]);

    return (
        <DonorContext.Provider value={{ donorData, isLoading, error }}>
            {children}
        </DonorContext.Provider>
    );
}