'use client';

import { useStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
    Eye,
    MessageSquare,
    Image as ImageIcon,
    FileEdit,
    UserCheck,
    Shield,
    CheckCircle2,
    XCircle
} from 'lucide-react';

interface Responsibility {
    key: string;
    label: string;
    description: string;
    icon: React.ElementType;
    enabled: boolean;
}

export function ResponsibilitiesPanel() {
    const { user } = useStore();
    const broker = user && 'role' in user ? user : null;

    // Only show for Manager/Supervisor
    if (!broker || (broker.role !== 'manager' && broker.role !== 'supervisor')) {
        return null;
    }

    const permissions = broker.userPermissions;
    if (!permissions) return null;

    const responsibilities: Responsibility[] = [
        {
            key: 'can_view_leads',
            label: 'View & Check Leads',
            description: 'Access and review all incoming property leads and enquiries from buyers.',
            icon: Eye,
            enabled: permissions.can_view_leads,
        },
        {
            key: 'can_reply_chats',
            label: 'Reply to Chats',
            description: 'Respond to chat messages from users and brokers on the platform.',
            icon: MessageSquare,
            enabled: permissions.can_reply_chats,
        },
        {
            key: 'can_change_logo',
            label: 'Change App Logo',
            description: 'Update the application logo and branding across the platform.',
            icon: ImageIcon,
            enabled: permissions.can_change_logo,
        },
        {
            key: 'can_edit_footer',
            label: 'Edit Footer Details',
            description: 'Modify the footer content including contact info and links.',
            icon: FileEdit,
            enabled: permissions.can_edit_footer,
        },
        {
            key: 'can_approve_brokers',
            label: 'Approve / Reject Brokers',
            description: 'Review and approve or reject new broker registration requests.',
            icon: UserCheck,
            enabled: permissions.can_approve_brokers,
        },
    ];

    const enabledCount = responsibilities.filter(r => r.enabled).length;

    return (
        <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
                <Shield className="h-6 w-6 text-indigo-600" />
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        Assigned Responsibilities
                        <Badge variant="default" className="bg-indigo-600 text-white text-[10px]">
                            {broker.role.charAt(0).toUpperCase() + broker.role.slice(1)}
                        </Badge>
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        {enabledCount} of {responsibilities.length} responsibilities assigned to you
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {responsibilities.map((resp) => (
                    <Card
                        key={resp.key}
                        className={`transition-all ${resp.enabled
                                ? 'border-indigo-200 bg-indigo-50/50 dark:border-indigo-800 dark:bg-indigo-950/20 shadow-sm'
                                : 'opacity-50 border-gray-200 dark:border-gray-800'
                            }`}
                    >
                        <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                                <div className={`p-2 rounded-lg ${resp.enabled
                                        ? 'bg-indigo-100 dark:bg-indigo-900/30'
                                        : 'bg-gray-100 dark:bg-gray-800'
                                    }`}>
                                    <resp.icon className={`h-5 w-5 ${resp.enabled ? 'text-indigo-600' : 'text-gray-400'
                                        }`} />
                                </div>
                                {resp.enabled ? (
                                    <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-[9px] gap-1">
                                        <CheckCircle2 className="h-3 w-3" />
                                        Active
                                    </Badge>
                                ) : (
                                    <Badge variant="outline" className="text-gray-400 text-[9px] gap-1">
                                        <XCircle className="h-3 w-3" />
                                        Not Assigned
                                    </Badge>
                                )}
                            </div>
                            <CardTitle className="text-sm font-semibold mt-2">{resp.label}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <CardDescription className="text-xs leading-relaxed">
                                {resp.description}
                            </CardDescription>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
