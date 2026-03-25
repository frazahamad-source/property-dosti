'use client';

import { useState, useMemo } from 'react';
import { MessageSquare } from 'lucide-react';
import { ChatWindow } from './ChatWindow';
import { useStore } from '@/lib/store';

export function GlobalChat() {
    const [isOpen, setIsOpen] = useState(false);
    const { user, chatMessages } = useStore();

    const unreadCount = useMemo(() => {
        if (!user?.id) return 0;
        return chatMessages.filter(msg =>
            msg.receiverId === user.id && !msg.isRead
        ).length;
    }, [chatMessages, user]);

    return (
        <>
            {/* Floating Chat Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className={`fixed bottom-6 right-6 p-4 rounded-full shadow-2xl hover:scale-110 transition-all z-40 flex items-center justify-center animate-bounce ${unreadCount > 0
                        ? 'bg-red-600 text-white ring-4 ring-red-600/20 shadow-red-600/40'
                        : 'bg-primary text-white'
                        }`}
                >
                    <MessageSquare className="h-6 w-6" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-white text-red-600 text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center shadow-lg border-2 border-red-600 animate-pulse">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    )}
                </button>
            )}

            <ChatWindow isOpen={isOpen} onClose={() => setIsOpen(false)} />
        </>
    );
}
