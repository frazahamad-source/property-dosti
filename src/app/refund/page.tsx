'use client';

import { RefreshCw, ArrowLeft, Clock, CreditCard, Ban } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function RefundPolicy() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
            <div className="container px-4 py-12 md:py-20 max-w-4xl">
                <div className="mb-8">
                    <Button variant="ghost" size="sm" asChild className="-ml-2 hover:bg-transparent hover:text-primary transition-colors">
                        <Link href="/"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Home</Link>
                    </Button>
                </div>

                <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 md:p-12 border shadow-sm ring-1 ring-black/5">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="bg-primary/10 p-3 rounded-2xl">
                            <RefreshCw className="h-8 w-8 text-primary" />
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black tracking-tight">Refund & Cancellation</h1>
                    </div>

                    <p className="text-muted-foreground mb-8 font-medium">Last Updated: February 17, 2026</p>

                    <div className="space-y-10 prose prose-gray dark:prose-invert max-w-none">
                        <section>
                            <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
                                <span className="w-8 h-1 bg-primary rounded-full"></span>
                                1. Membership Subscriptions
                            </h2>
                            <p className="leading-relaxed">
                                Property Dosti offers premium membership plans for brokers. By subscribing to a premium plan,
                                you agree to the billing terms presented at the time of purchase.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
                                <span className="w-8 h-1 bg-primary rounded-full"></span>
                                2. Cancellation Policy
                            </h2>
                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-2xl border">
                                    <div className="flex items-center gap-2 mb-3 font-bold">
                                        <Ban className="h-5 w-5 text-red-500" />
                                        <span>How to Cancel</span>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        You can cancel your subscription at any time through your Dashboard settings.
                                        Cancellation will stop future billing cycles.
                                    </p>
                                </div>
                                <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-2xl border">
                                    <div className="flex items-center gap-2 mb-3 font-bold">
                                        <Clock className="h-5 w-5 text-primary" />
                                        <span>Effective Date</span>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Your premium features will remain active until the end of your current paid billing period.
                                    </p>
                                </div>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
                                <span className="w-8 h-1 bg-primary rounded-full"></span>
                                3. Refund Policy
                            </h2>
                            <div className="p-6 bg-primary/5 rounded-2xl border border-primary/20">
                                <div className="flex items-center gap-2 mb-4 font-bold text-primary">
                                    <CreditCard className="h-6 w-6" />
                                    <span>General Rule: No Refunds</span>
                                </div>
                                <p className="leading-relaxed text-gray-700 dark:text-gray-300">
                                    Since our platform provides immediate access to leads and network visibility,
                                    <strong> subscriptions are generally non-refundable</strong>. However, exceptions may be
                                    made in cases of technical failures or billing errors at our discretion.
                                </p>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
                                <span className="w-8 h-1 bg-primary rounded-full"></span>
                                4. Contact for Billing Issues
                            </h2>
                            <p className="leading-relaxed">
                                If you believe you have been charged in error, please contact us within 7 days of the transaction.
                            </p>
                            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border">
                                <p className="font-bold">Email: support@propertydosti.com</p>
                                <p className="text-sm">Subject: Billing Inquiry</p>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}
