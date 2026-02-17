'use client';

import { Building2, ShieldCheck, Lock, Eye, FileText, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function PrivacyPolicy() {
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
                            <ShieldCheck className="h-8 w-8 text-primary" />
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black tracking-tight">Privacy Policy</h1>
                    </div>

                    <p className="text-muted-foreground mb-8 font-medium">Last Updated: February 17, 2026</p>

                    <div className="space-y-10 prose prose-gray dark:prose-invert max-w-none">
                        <section>
                            <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
                                <span className="w-8 h-1 bg-primary rounded-full"></span>
                                1. Introduction & Data Fiduciary Role
                            </h2>
                            <p className="leading-relaxed">
                                Welcome to Property Dosti. We are committed to protecting your personal data and respecting your privacy.
                                In accordance with the <strong>Digital Personal Data Protection Act (DPDPA), 2023</strong>,
                                Property Dosti acts as a <strong>"Data Fiduciary"</strong> for the personal data collected through our platform.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
                                <span className="w-8 h-1 bg-primary rounded-full"></span>
                                2. Information We Collect
                            </h2>
                            <p className="mb-4">We collect and process personal data that is necessary for the provision of our services:</p>
                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 list-none p-0">
                                <li className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border flex items-center gap-3">
                                    <Lock className="h-4 w-4 text-primary" />
                                    <span className="text-sm">Name, Email, and Phone Number</span>
                                </li>
                                <li className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border flex items-center gap-3">
                                    <FileText className="h-4 w-4 text-primary" />
                                    <span className="text-sm">Broker RERA Numbers & Codes</span>
                                </li>
                                <li className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border flex items-center gap-3">
                                    <Building2 className="h-4 w-4 text-primary" />
                                    <span className="text-sm">Property Listing Details & Images</span>
                                </li>
                                <li className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border flex items-center gap-3">
                                    <Eye className="h-4 w-4 text-primary" />
                                    <span className="text-sm">Usage data and search preferences</span>
                                </li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
                                <span className="w-8 h-1 bg-primary rounded-full"></span>
                                3. Purpose of Processing (Lawful Basis)
                            </h2>
                            <p className="leading-relaxed">
                                Your data is processed only with your explicit consent and for specific purposes:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 mt-4 text-muted-foreground">
                                <li>Verifying broker registrations to ensure a trusted network.</li>
                                <li>Enabling property search and contact between users and brokers.</li>
                                <li>Communicating service updates and platform notices.</li>
                                <li>Maintaining secure and efficient platform functionality.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
                                <span className="w-8 h-1 bg-primary rounded-full"></span>
                                4. Data Security & Retention
                            </h2>
                            <p className="leading-relaxed">
                                We implement robust technical and organizational measures to prevent unauthorized access, alteration,
                                disclosure, or destruction of your personal data. Your data is retained only for as long as necessary
                                to fulfill the purposes outlined or as required by law.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
                                <span className="w-8 h-1 bg-primary rounded-full"></span>
                                5. Your Rights
                            </h2>
                            <p className="leading-relaxed">
                                Under DPDPA 2023, you have the right to request access, correction, or erasure of your personal data.
                                You also have the right to withdraw consent at any time, which may impact your ability to use certain
                                platform features.
                            </p>
                        </section>

                        <section className="pt-8 border-t">
                            <h2 className="text-xl font-bold mb-4">6. Contact Us</h2>
                            <p className="text-muted-foreground">
                                For any privacy-related queries or to exercise your rights, please contact our Data Protection Officer at:
                            </p>
                            <div className="mt-4 p-4 bg-primary/5 rounded-2xl border border-primary/10">
                                <p className="font-bold">Email: support@propertydosti.com</p>
                                <p className="text-sm">Subject: Privacy/DPDPA Query</p>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}
