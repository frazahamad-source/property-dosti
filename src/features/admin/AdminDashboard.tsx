
'use client';
import { useStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Users, Building2, CheckCircle2, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { BrokerManager } from './BrokerManager';
import { PropertyManager } from './PropertyManager';

interface AdminDashboardProps {
    view?: 'overview' | 'brokers' | 'properties';
}

export function AdminDashboard({ view = 'overview' }: AdminDashboardProps) {
    const { brokers, properties } = useStore();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    const pendingBrokers = brokers.filter(b => b.status === 'pending');
    const approvedBrokers = brokers.filter(b => b.status === 'approved');

    const stats = [
        {
            title: "Total Brokers",
            value: brokers.length,
            icon: Users,
            description: "Registered across all districts",
            color: "text-blue-600",
            bgColor: "bg-blue-50"
        },
        {
            title: "Approved Brokers",
            value: approvedBrokers.length,
            icon: CheckCircle2,
            description: "Active members",
            color: "text-green-600",
            bgColor: "bg-green-50"
        },
        {
            title: "Pending Approvals",
            value: pendingBrokers.length,
            icon: Clock,
            description: "Waiting for review",
            color: "text-amber-600",
            bgColor: "bg-amber-50"
        },
        {
            title: "Total Properties",
            value: properties.length,
            icon: Building2,
            description: "Live listings",
            color: "text-purple-600",
            bgColor: "bg-purple-50"
        }
    ];

    const renderContent = () => {
        switch (view) {
            case 'brokers':
                return <BrokerManager />;
            case 'properties':
                return <PropertyManager />;
            default:
                return (
                    <>
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                            {stats.map((stat) => (
                                <Card key={stat.title}>
                                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                        <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                                        <div className={`${stat.bgColor} p-2 rounded-lg`}>
                                            <stat.icon className={`h-4 w-4 ${stat.color}`} />
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{stat.value}</div>
                                        <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        <div className="mt-12 grid gap-8 md:grid-cols-2">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Recent Activity</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground">Recent actions will appear here.</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <CardTitle>System Health</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full bg-green-500"></div>
                                        <span className="text-sm font-medium">Database Connected</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-2">All systems operational.</p>
                                </CardContent>
                            </Card>
                        </div>
                    </>
                );
        }
    };

    return (
        <div className="container py-8 px-4">
            <h1 className="text-3xl font-bold mb-8">
                {view === 'overview' ? 'Admin Overview' :
                    view === 'brokers' ? 'Broker Management' :
                        'Property Management'}
            </h1>

            {renderContent()}
        </div>
    );
}
