'use client';

import { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { ChatWindow } from './ChatWindow';
import { usePathname } from 'next/navigation';

export function GlobalChat() {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();

    // Don't show chat on auth pages if preferred, but user said "bottom of the app"
    // Usually we hide it on landing pages or login pages if it's for registered users.
    // However, the prompt says "bottom of the app", so let's keep it global.

    return (
        <>
            {/* Floating Chat Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 bg-primary text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-transform z-40 flex items-center justify-center animate-bounce"
                >
                    <MessageSquare className="h-6 w-6" />
                </button>
            )}

            <ChatWindow isOpen={isOpen} onClose={() => setIsOpen(false)} />
        </>
    );
}
