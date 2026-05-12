"use client";

import { useState, useEffect } from "react";
import { UserTable } from "../components/user-table";

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

export default function AdminUsersPage() {
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchUsers = async () => {
        try {
            const headers = getAuthHeaders();
            if (!headers) {
                window.location.href = '/auth/login';
                return;
            }

            const response = await fetch('http://localhost:8080/admin/users', {
                headers: headers,
            });



            if (!response.ok) {
                throw new Error('Failed to fetch users');
            }

            const data = await response.json();
            setUsers(data);
        } catch (err) {
            console.error('Error fetching users:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/auth/login';
            return;
        }
        fetchUsers();
    }, []);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-foreground">User Management</h1>
                <p className="text-muted-foreground mt-1">Manage all users in the system</p>
            </div>

            <UserTable users={users} isLoading={isLoading} onRefresh={fetchUsers} />
        </div>
    );
}