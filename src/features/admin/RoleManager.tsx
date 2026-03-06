'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { Shield, ShieldCheck, UserCog, Trash2, Save, ChevronDown } from 'lucide-react';

interface UserRole {
    id: string;
    user_id: string;
    role: 'manager' | 'supervisor';
    can_view_leads: boolean;
    can_reply_chats: boolean;
    can_change_logo: boolean;
    can_edit_footer: boolean;
    can_approve_brokers: boolean;
    // Joined fields
    user_name?: string;
    user_email?: string;
}

interface ProfileOption {
    id: string;
    name: string;
    email: string;
}

const PERMISSION_LABELS: Record<string, string> = {
    can_view_leads: 'Can view/check leads',
    can_reply_chats: 'Can reply to chats',
    can_change_logo: 'Can change the app logo',
    can_edit_footer: 'Can edit details in the footer',
    can_approve_brokers: 'Can approve/reject Broker registrations',
};

const PERMISSION_KEYS = Object.keys(PERMISSION_LABELS) as Array<keyof typeof PERMISSION_LABELS>;

export function RoleManager() {
    const [roles, setRoles] = useState<UserRole[]>([]);
    const [profiles, setProfiles] = useState<ProfileOption[]>([]);
    const [selectedUserId, setSelectedUserId] = useState('');
    const [selectedRole, setSelectedRole] = useState<'manager' | 'supervisor'>('manager');
    const [permissions, setPermissions] = useState<Record<string, boolean>>({
        can_view_leads: false,
        can_reply_chats: false,
        can_change_logo: false,
        can_edit_footer: false,
        can_approve_brokers: false,
    });
    const [loading, setLoading] = useState(false);
    const [editingRoleId, setEditingRoleId] = useState<string | null>(null);

    const fetchRoles = useCallback(async () => {
        const { data, error } = await supabase
            .from('user_roles')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching roles:', error);
            return;
        }

        // Fetch associated profile info
        if (data && data.length > 0) {
            const userIds = data.map((r: UserRole) => r.user_id);
            const { data: profileData } = await supabase
                .from('profiles')
                .select('id, name, email')
                .in('id', userIds);

            const enriched = data.map((r: UserRole) => {
                const profile = profileData?.find((p: ProfileOption) => p.id === r.user_id);
                return {
                    ...r,
                    user_name: profile?.name || 'Unknown',
                    user_email: profile?.email || '',
                };
            });
            setRoles(enriched);
        } else {
            setRoles([]);
        }
    }, []);

    const fetchProfiles = useCallback(async () => {
        const { data, error } = await supabase
            .from('profiles')
            .select('id, name, email')
            .eq('is_admin', false)
            .eq('status', 'approved')
            .order('name', { ascending: true });

        if (error) {
            console.error('Error fetching profiles:', error);
            return;
        }
        setProfiles(data || []);
    }, []);

    useEffect(() => {
        fetchRoles();
        fetchProfiles();
    }, [fetchRoles, fetchProfiles]);

    const handleAssignRole = async () => {
        if (!selectedUserId) {
            toast.error('Please select a user');
            return;
        }

        setLoading(true);
        try {
            const payload = {
                user_id: selectedUserId,
                role: selectedRole,
                ...permissions,
                updated_at: new Date().toISOString(),
            };

            if (editingRoleId) {
                // Update existing
                const { error } = await supabase
                    .from('user_roles')
                    .update(payload)
                    .eq('id', editingRoleId);

                if (error) throw error;
                toast.success('Role updated successfully');
            } else {
                // Insert new
                const { error } = await supabase
                    .from('user_roles')
                    .upsert(payload, { onConflict: 'user_id' });

                if (error) throw error;
                toast.success('Role assigned successfully');
            }

            resetForm();
            fetchRoles();
        } catch (err) {
            const error = err as Error;
            console.error('Error saving role:', error);
            toast.error(error.message || 'Failed to save role');
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveRole = async (roleId: string, userName: string) => {
        if (!confirm(`Remove role from ${userName}? This will strip all their privileges.`)) return;

        setLoading(true);
        try {
            const { error } = await supabase
                .from('user_roles')
                .delete()
                .eq('id', roleId);

            if (error) throw error;
            toast.success(`Role removed from ${userName}`);
            fetchRoles();
            if (editingRoleId === roleId) resetForm();
        } catch (err) {
            const error = err as Error;
            toast.error(error.message || 'Failed to remove role');
        } finally {
            setLoading(false);
        }
    };

    const handleEditRole = (role: UserRole) => {
        setEditingRoleId(role.id);
        setSelectedUserId(role.user_id);
        setSelectedRole(role.role);
        setPermissions({
            can_view_leads: role.can_view_leads,
            can_reply_chats: role.can_reply_chats,
            can_change_logo: role.can_change_logo,
            can_edit_footer: role.can_edit_footer,
            can_approve_brokers: role.can_approve_brokers,
        });
    };

    const resetForm = () => {
        setEditingRoleId(null);
        setSelectedUserId('');
        setSelectedRole('manager');
        setPermissions({
            can_view_leads: false,
            can_reply_chats: false,
            can_change_logo: false,
            can_edit_footer: false,
            can_approve_brokers: false,
        });
    };

    const togglePermission = (key: string) => {
        setPermissions((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    // Filter out users who already have a role (unless editing that user)
    const availableProfiles = profiles.filter(
        (p) => !roles.some((r) => r.user_id === p.id) || (editingRoleId && selectedUserId === p.id)
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
                <Shield className="h-6 w-6 text-primary" />
                <div>
                    <h2 className="text-2xl font-bold">Role Management</h2>
                    <p className="text-sm text-muted-foreground">Assign Manager or Supervisor roles and configure permissions</p>
                </div>
            </div>

            {/* Assignment Form */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <UserCog className="h-5 w-5" />
                        {editingRoleId ? 'Edit Role Assignment' : 'Assign New Role'}
                    </CardTitle>
                    <CardDescription>
                        {editingRoleId
                            ? 'Update role and permissions for the selected user'
                            : 'Select a user and assign them a Manager or Supervisor role'}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* User & Role Selection */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Select User</label>
                            <div className="relative">
                                <select
                                    value={selectedUserId}
                                    onChange={(e) => setSelectedUserId(e.target.value)}
                                    disabled={!!editingRoleId}
                                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring appearance-none pr-8"
                                >
                                    <option value="">-- Select a user --</option>
                                    {availableProfiles.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.name} ({p.email})
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Role</label>
                            <div className="relative">
                                <select
                                    value={selectedRole}
                                    onChange={(e) => setSelectedRole(e.target.value as 'manager' | 'supervisor')}
                                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring appearance-none pr-8"
                                >
                                    <option value="manager">Manager</option>
                                    <option value="supervisor">Supervisor</option>
                                </select>
                                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    {/* Permissions */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium">Permission Toggles</label>
                        <div className="grid gap-3">
                            {PERMISSION_KEYS.map((key) => (
                                <label
                                    key={key}
                                    className="flex items-center justify-between p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                                >
                                    <span className="text-sm">{PERMISSION_LABELS[key]}</span>
                                    <button
                                        type="button"
                                        role="switch"
                                        aria-checked={permissions[key]}
                                        onClick={() => togglePermission(key)}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${permissions[key] ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
                                            }`}
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${permissions[key] ? 'translate-x-6' : 'translate-x-1'
                                                }`}
                                        />
                                    </button>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 pt-2">
                        <Button onClick={handleAssignRole} disabled={loading || !selectedUserId} className="gap-2">
                            <Save className="h-4 w-4" />
                            {editingRoleId ? 'Update Role' : 'Assign Role'}
                        </Button>
                        {editingRoleId && (
                            <Button variant="outline" onClick={resetForm}>
                                Cancel
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Existing Roles List */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5" />
                        Assigned Roles ({roles.length})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {roles.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">
                            No roles have been assigned yet. Use the form above to assign a Manager or Supervisor role.
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {roles.map((role) => (
                                <div
                                    key={role.id}
                                    className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-lg border bg-muted/20 gap-4"
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-semibold text-sm">{role.user_name}</span>
                                            <Badge variant={role.role === 'manager' ? 'default' : 'secondary'} className="text-[10px]">
                                                {role.role.charAt(0).toUpperCase() + role.role.slice(1)}
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-0.5">{role.user_email}</p>
                                        <div className="flex flex-wrap gap-1.5 mt-2">
                                            {PERMISSION_KEYS.map((key) => (
                                                <Badge
                                                    key={key}
                                                    variant={role[key as keyof UserRole] ? 'default' : 'outline'}
                                                    className={`text-[9px] ${role[key as keyof UserRole]
                                                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                                            : 'opacity-40'
                                                        }`}
                                                >
                                                    {PERMISSION_LABELS[key]}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleEditRole(role)}
                                            className="text-xs"
                                        >
                                            Edit
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => handleRemoveRole(role.id, role.user_name || 'this user')}
                                            className="text-xs gap-1"
                                        >
                                            <Trash2 className="h-3 w-3" />
                                            Remove
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
