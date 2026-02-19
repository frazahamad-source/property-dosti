'use client';

import { FileText, ArrowLeft, CheckCircle2, AlertCircle, Scale, Shield, Users } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function TermsOfService() {
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
                            <FileText className="h-8 w-8 text-primary" />
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black tracking-tight">Terms of Service</h1>
                    </div>

                    <p className="text-muted-foreground mb-8 font-medium">Last Updated: February 17, 2026</p>

                    {/* Key Highlights Section */}
                    <div className="bg-primary/5 rounded-2xl p-6 mb-12 border border-primary/10">
                        <h2 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
                            <Scale className="h-5 w-5" />
                            Key Terms at a Glance
                        </h2>
                        <div className="grid md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Shield className="h-4 w-4 text-primary" />
                                    Eligibility
                                </h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    You must be a verified broker with valid RERA registration (where applicable) to list properties.
                                </p>
                            </div>
                            <div className="space-y-2">
                                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Users className="h-4 w-4 text-primary" />
                                    Conduct
                                </h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    Zero tolerance for fraudulent listings, misleading information, or unprofessional behavior check.
                                </p>
                            </div>
                            <div className="space-y-2">
                                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4 text-primary" />
                                    No Liability
                                </h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    Property Dosti is a connector platform. We are not a party to real estate transactions or disputes.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-10 prose prose-gray dark:prose-invert max-w-none">
                        <section>
                            <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
                                <span className="w-8 h-1 bg-primary rounded-full"></span>
                                1. Agreement to Terms
                            </h2>
                            <p className="leading-relaxed">
                                By accessing or using Property Dosti, you agree to be bound by these Terms of Service.
                                If you do not agree with any part of these terms, you must not use our platform.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
                                <span className="w-8 h-1 bg-primary rounded-full"></span>
                                2. Broker Eligibility & Conduct
                            </h2>
                            <p className="mb-4">Brokers participating in the Property Dosti network must:</p>
                            <ul className="space-y-3 list-none p-0">
                                <li className="flex items-start gap-3 text-sm">
                                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                                    <span>Possess a valid RERA registration as required by Karnataka state laws.</span>
                                </li>
                                <li className="flex items-start gap-3 text-sm">
                                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                                    <span>Provide accurate and truthful information during registration and property listing.</span>
                                </li>
                                <li className="flex items-start gap-3 text-sm">
                                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                                    <span>Maintain professional conduct in all interactions via the platform.</span>
                                </li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
                                <span className="w-8 h-1 bg-primary rounded-full"></span>
                                3. Property Listings
                            </h2>
                            <p className="leading-relaxed">
                                Property Dosti is a platform connecting users with brokers. While we strive for accuracy, brokers are
                                solely responsible for the content of their listings. We reserve the right to remove any listing
                                that violates our quality standards or contains misleading information.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
                                <span className="w-8 h-1 bg-primary rounded-full"></span>
                                4. Intellectual Property
                            </h2>
                            <p className="leading-relaxed">
                                All content on this platform, including logos, designs, and software, is the property of Property Dosti
                                or its licensors and is protected by intellectual property laws.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
                                <span className="w-8 h-1 bg-primary rounded-full"></span>
                                5. Platform Role & Disclaimer
                            </h2>
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-2xl border border-blue-100 dark:border-blue-900/30 flex gap-4">
                                <AlertCircle className="h-6 w-6 text-blue-600 shrink-0" />
                                <div className="text-sm text-blue-900 dark:text-blue-200 leading-relaxed">
                                    <p className="font-bold mb-2 uppercase tracking-wide">Important Notice:</p>
                                    Property Dosti is strictly a <strong>service provider and platform support</strong> for real estate brokers.
                                    We provide the technology for brokers to list properties and for users to discover them.
                                    <strong> Property Dosti is NOT responsible</strong> for:
                                    <ul className="list-disc pl-5 mt-2 space-y-1">
                                        <li>Any fraudulent activity or misleading information provided by brokers.</li>
                                        <li>Any errors, omissions, or inaccuracies in property listings.</li>
                                        <li>Any actions, negotiations, or disputes resulting from interactions with brokers.</li>
                                        <li>Success or legality of any real estate transaction.</li>
                                    </ul>
                                </div>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
                                <span className="w-8 h-1 bg-primary rounded-full"></span>
                                6. Limitation of Liability
                            </h2>
                            <p className="text-sm leading-relaxed text-muted-foreground">
                                To the maximum extent permitted by law, Property Dosti shall not be liable for any indirect, incidental, special, or consequential damages
                                arising out of or in connection with your use of the platform.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
                                <span className="w-8 h-1 bg-primary rounded-full"></span>
                                7. Governing Law
                            </h2>
                            <p className="leading-relaxed">
                                These terms are governed by the laws of India. Any disputes shall be subject to the exclusive
                                jurisdiction of the courts in Mangaluru, Karnataka.
                            </p>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}
