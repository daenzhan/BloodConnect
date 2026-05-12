"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, Loader2, Shield, UserX, UserCheck, MoreVertical, ChevronLeft, ChevronRight } from "lucide-react";

interface UserData {
    userId: number;
    email: string;
    role: string;
    phoneNumber: string;
    active: boolean;
    blockedReason?: string;
    createdAt: string;
    bloodCenterName?: string;
    medCenterName?: string;
    bloodCenterVerificationStatus?: string;
    medCenterVerificationStatus?: string;
}

interface UserTableProps {
    users: UserData[];
    isLoading: boolean;
    onRefresh: () => void;
}

const roleColors: Record<string, string> = {
    DONOR: "bg-blue-100 text-blue-700",
    BLOOD_CENTER: "bg-green-100 text-green-700",
    MEDICAL_CENTER: "bg-purple-100 text-purple-700",
    ADMIN: "bg-red-100 text-red-700",
};

const roleLabels: Record<string, string> = {
    DONOR: "Donor",
    BLOOD_CENTER: "Blood Center",
    MEDICAL_CENTER: "Medical Center",
    ADMIN: "Admin",
};

const verificationStatusColors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-700",
    APPROVED: "bg-green-100 text-green-700",
    REJECTED: "bg-red-100 text-red-700",
};

const verificationStatusLabels: Record<string, string> = {
    PENDING: "Pending",
    APPROVED: "Approved",
    REJECTED: "Rejected",
};

export function UserTable({ users, isLoading, onRefresh }: UserTableProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [blockDialogOpen, setBlockDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
    const [blockReason, setBlockReason] = useState("");
    const [isBlocking, setIsBlocking] = useState(false);
    const [roleDialogOpen, setRoleDialogOpen] = useState(false);
    const [newRole, setNewRole] = useState("");

    const getAuthHeaders = () => {
        const token = localStorage.getItem('token');
        if (!token) return null;
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };
    };

    // Фильтрация пользователей
    const filteredUsers = users.filter(user =>
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.bloodCenterName && user.bloodCenterName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.medCenterName && user.medCenterName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        user.phoneNumber.includes(searchTerm)
    );

    // Пагинация
    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
    const paginatedUsers = filteredUsers.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handleBlockUser = async () => {
        if (!selectedUser) return;

        setIsBlocking(true);
        try {
            const headers = getAuthHeaders();
            if (!headers) {
                window.location.href = '/auth/login';
                return;
            }

            const response = await fetch('http://localhost:8080/admin/users/block', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                    userId: selectedUser.userId,
                    block: true,
                    reason: blockReason,
                }),
            });

            if (response.ok) {
                onRefresh();
                setBlockDialogOpen(false);
                setSelectedUser(null);
                setBlockReason("");
            }
        } catch (err) {
            console.error('Error blocking user:', err);
        } finally {
            setIsBlocking(false);
        }
    };

    const handleUnblockUser = async (user: UserData) => {
        try {
            const headers = getAuthHeaders();
            if (!headers) {
                window.location.href = '/auth/login';
                return;
            }

            const response = await fetch('http://localhost:8080/admin/users/block', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                    userId: user.userId,
                    block: false,
                    reason: null,
                }),
            });

            if (response.ok) {
                onRefresh();
            }
        } catch (err) {
            console.error('Error unblocking user:', err);
        }
    };

    const handleChangeRole = async () => {
        if (!selectedUser || !newRole) return;

        try {
            const headers = getAuthHeaders();
            if (!headers) {
                window.location.href = '/auth/login';
                return;
            }

            const response = await fetch(`http://localhost:8080/admin/users/${selectedUser.userId}/role?role=${newRole}`, {
                method: 'PUT',
                headers: headers,
            });

            if (response.ok) {
                onRefresh();
                setRoleDialogOpen(false);
                setSelectedUser(null);
                setNewRole("");
            }
        } catch (err) {
            console.error('Error changing role:', err);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Search */}
            <Card className="p-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by email, center name, or phone..."
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="pl-10"
                    />
                </div>
            </Card>

            {/* Users Table */}
            <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-muted/50">
                        <tr>
                            <th className="text-left p-4 text-sm font-medium text-muted-foreground">User</th>
                            <th className="text-left p-4 text-sm font-medium text-muted-foreground">Role</th>
                            <th className="text-left p-4 text-sm font-medium text-muted-foreground">Verification</th>
                            <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                            <th className="text-left p-4 text-sm font-medium text-muted-foreground">Joined</th>
                            <th className="text-left p-4 text-sm font-medium text-muted-foreground">Actions</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                        {paginatedUsers.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="p-8 text-center text-muted-foreground">
                                    No users found
                                </td>
                            </tr>
                        ) : (
                            paginatedUsers.map((user) => (
                                <tr key={user.userId} className="hover:bg-muted/30 transition-colors">
                                    <td className="p-4">
                                        <div>
                                            <p className="font-medium text-foreground">{user.email}</p>
                                            <p className="text-sm text-muted-foreground">{user.phoneNumber}</p>
                                            {user.bloodCenterName && (
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    🏥 {user.bloodCenterName}
                                                </p>
                                            )}
                                            {user.medCenterName && (
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    🏥 {user.medCenterName}
                                                </p>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <Badge className={roleColors[user.role]}>
                                            {roleLabels[user.role]}
                                        </Badge>
                                    </td>
                                    <td className="p-4">
                                        {user.bloodCenterVerificationStatus && (
                                            <Badge className={verificationStatusColors[user.bloodCenterVerificationStatus]}>
                                                {verificationStatusLabels[user.bloodCenterVerificationStatus]}
                                            </Badge>
                                        )}
                                        {user.medCenterVerificationStatus && (
                                            <Badge className={verificationStatusColors[user.medCenterVerificationStatus]}>
                                                {verificationStatusLabels[user.medCenterVerificationStatus]}
                                            </Badge>
                                        )}
                                        {user.role === "DONOR" && (
                                            <span className="text-sm text-muted-foreground">N/A</span>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        {user.active ? (
                                            <Badge className="bg-green-100 text-green-700">Active</Badge>
                                        ) : (
                                            <div>
                                                <Badge className="bg-red-100 text-red-700">Blocked</Badge>
                                                {user.blockedReason && (
                                                    <p className="text-xs text-red-600 mt-1 max-w-xs">
                                                        Reason: {user.blockedReason}
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </td>
                                    <td className="p-4 text-sm text-muted-foreground">
                                        {formatDate(user.createdAt)}
                                    </td>
                                    <td className="p-4">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreVertical className="w-4 h-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                {user.active ? (
                                                    <DropdownMenuItem
                                                        onClick={() => {
                                                            setSelectedUser(user);
                                                            setBlockDialogOpen(true);
                                                        }}
                                                        className="text-red-600"
                                                    >
                                                        <UserX className="w-4 h-4 mr-2" />
                                                        Block User
                                                    </DropdownMenuItem>
                                                ) : (
                                                    <DropdownMenuItem
                                                        onClick={() => handleUnblockUser(user)}
                                                        className="text-green-600"
                                                    >
                                                        <UserCheck className="w-4 h-4 mr-2" />
                                                        Unblock User
                                                    </DropdownMenuItem>
                                                )}
                                                <DropdownMenuItem
                                                    onClick={() => {
                                                        setSelectedUser(user);
                                                        setNewRole(user.role);
                                                        setRoleDialogOpen(true);
                                                    }}
                                                >
                                                    <Shield className="w-4 h-4 mr-2" />
                                                    Change Role
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </td>
                                </tr>
                            ))
                        )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between gap-4">
                    <p className="text-sm text-muted-foreground">
                        Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredUsers.length)} of {filteredUsers.length} users
                    </p>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                        >
                            <ChevronLeft className="w-4 h-4" />
                            Previous
                        </Button>
                        <div className="flex gap-1">
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                let pageNum;
                                if (totalPages <= 5) {
                                    pageNum = i + 1;
                                } else if (currentPage <= 3) {
                                    pageNum = i + 1;
                                } else if (currentPage >= totalPages - 2) {
                                    pageNum = totalPages - 4 + i;
                                } else {
                                    pageNum = currentPage - 2 + i;
                                }
                                return (
                                    <Button
                                        key={pageNum}
                                        variant={currentPage === pageNum ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setCurrentPage(pageNum)}
                                        className={currentPage === pageNum ? "bg-primary" : ""}
                                    >
                                        {pageNum}
                                    </Button>
                                );
                            })}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                        >
                            Next
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Block Dialog */}
            <Dialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Block User</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="p-3 bg-red-50 rounded-lg">
                            <p className="text-sm text-red-600">
                                Are you sure you want to block <strong>{selectedUser?.email}</strong>?
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="reason">Reason (Optional)</Label>
                            <Textarea
                                id="reason"
                                placeholder="Enter reason for blocking..."
                                value={blockReason}
                                onChange={(e) => setBlockReason(e.target.value)}
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setBlockDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleBlockUser} disabled={isBlocking} className="bg-red-600 hover:bg-red-700">
                            {isBlocking && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                            Block User
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Change Role Dialog */}
            <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Change User Role</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="p-3 bg-yellow-50 rounded-lg">
                            <p className="text-sm text-yellow-600">
                                Changing role for <strong>{selectedUser?.email}</strong>
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="role">New Role</Label>
                            <Select value={newRole} onValueChange={setNewRole}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="DONOR">Donor</SelectItem>
                                    <SelectItem value="BLOOD_CENTER">Blood Center</SelectItem>
                                    <SelectItem value="MEDICAL_CENTER">Medical Center</SelectItem>
                                    <SelectItem value="ADMIN">Admin</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleChangeRole} className="bg-primary hover:bg-primary/90">
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}