
'use client';

import { useState, useMemo } from 'react';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Send, User, Bot, X, Search, ChevronLeft, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Broker } from '@/lib/types';

interface ChatWindowProps {
    isOpen: boolean;
    onClose: () => void;
}

export function ChatWindow({ isOpen, onClose }: ChatWindowProps) {
    const { user, brokers, chatMessages, addChatMessage } = useStore();
    const [message, setMessage] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUser, setSelectedUser] = useState<Broker | 'bot' | null>(null);

    const filteredBrokers = useMemo(() => {
        if (!searchQuery.trim()) return [];
        return brokers.filter(b =>
            (b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                b.id.toLowerCase().includes(searchQuery.toLowerCase())) &&
            b.id !== user?.id
        );
    }, [brokers, searchQuery, user]);

    const activeMessages = useMemo(() => {
        if (!selectedUser) return [];
        const targetId = selectedUser === 'bot' ? 'bot' : selectedUser.id;
        return chatMessages.filter(msg =>
            (msg.senderId === user?.id && msg.receiverId === targetId) ||
            (msg.senderId === targetId && msg.receiverId === user?.id)
        );
    }, [chatMessages, selectedUser, user]);

    const handleSend = () => {
        if (!message.trim() || !selectedUser) return;

        const targetId = selectedUser === 'bot' ? 'bot' : selectedUser.id;
        const newMsg = {
            id: `msg-${Date.now()}`,
            senderId: user?.id || 'anonymous',
            receiverId: targetId,
            text: message,
            timestamp: new Date().toISOString(),
        };

        addChatMessage(newMsg);
        setMessage('');

        // Bot Logic
        if (targetId === 'bot') {
            const lowerMsg = message.toLowerCase();
            let botReply = "I'm still learning! How can I help you today?";

            if (lowerMsg.includes('hello') || lowerMsg.includes('hi')) {
                botReply = `Hello ${(user as any)?.name || 'there'}! I am your Property Dosti Assistant.`;
            } else if (lowerMsg.includes('qr') || lowerMsg.includes('code') || lowerMsg.includes('pay')) {
                botReply = 'You can find the payment QR code in your Dashboard under the "Membership & Rewards" section. Just scan it to pay the ₹100 fee!';
            } else if (lowerMsg.includes('subscription') || lowerMsg.includes('fee')) {
                botReply = 'Our subscription is ₹100/month after a 45-day free trial. You can pay via QR code in your dashboard!';
            } else if (lowerMsg.includes('renew') || lowerMsg.includes('extend')) {
                botReply = 'To renew your subscription: 1. Scan the QR code in your dashboard. 2. Pay ₹100. 3. Click the "Confirm Payment on WhatsApp" button to notify our admin!';
            } else if (lowerMsg.includes('referral') || lowerMsg.includes('earn')) {
                botReply = 'Invite friends using your unique code to earn 1 month of free subscription for every successful signup!';
            }

            setTimeout(() => {
                addChatMessage({
                    id: `msg-bot-${Date.now()}`,
                    senderId: 'bot',
                    receiverId: user?.id || 'anonymous',
                    text: botReply,
                    timestamp: new Date().toISOString(),
                });
            }, 800);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: 100, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 100, scale: 0.9 }}
                    className="fixed bottom-6 right-6 z-50 w-80 sm:w-96 shadow-2xl"
                >
                    <Card className="border-primary/20 bg-background/95 backdrop-blur overflow-hidden flex flex-col max-h-[500px]">
                        <CardHeader className="flex flex-row items-center justify-between py-3 border-b bg-primary/5 shrink-0">
                            <div className="flex items-center gap-2">
                                {selectedUser && (
                                    <Button variant={"ghost" as any} size={"sm" as any} className="h-8 w-8 p-0" onClick={() => setSelectedUser(null)}>
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                )}
                                {selectedUser === 'bot' ? (
                                    <Bot className="h-5 w-5 text-primary" />
                                ) : selectedUser ? (
                                    <User className="h-5 w-5 text-primary" />
                                ) : (
                                    <MessageSquare className="h-5 w-5 text-primary" />
                                )}
                                <CardTitle className="text-sm font-bold">
                                    {selectedUser === 'bot' ? 'Property Assistant' : (selectedUser as any)?.name || 'Select Contact'}
                                </CardTitle>
                            </div>
                            <Button variant={"ghost" as any} size={"sm" as any} className="h-8 w-8 p-0" onClick={onClose}>
                                <X className="h-4 w-4" />
                            </Button>
                        </CardHeader>
                        <CardContent className="p-0 flex-1 flex flex-col overflow-hidden">
                            {!selectedUser ? (
                                <div className="p-4 flex flex-col h-full space-y-4">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Search by Name or User ID..."
                                            className="pl-9"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                    </div>

                                    <div className="flex-1 overflow-y-auto space-y-1">
                                        {/* Default Bot option */}
                                        <div
                                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted cursor-pointer transition-colors border border-transparent hover:border-primary/20"
                                            onClick={() => setSelectedUser('bot')}
                                        >
                                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                <Bot className="h-6 w-6 text-primary" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm">Property Assistant</p>
                                                <p className="text-xs text-muted-foreground">Always active</p>
                                            </div>
                                        </div>

                                        <div className="border-t my-2 pt-2">
                                            <p className="text-[10px] uppercase font-bold text-muted-foreground px-2 mb-2">Brokers</p>
                                            {filteredBrokers.map(broker => (
                                                <div
                                                    key={broker.id}
                                                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted cursor-pointer transition-colors"
                                                    onClick={() => setSelectedUser(broker)}
                                                >
                                                    <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
                                                        <User className="h-6 w-6 text-secondary-foreground" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-sm">{broker.name}</p>
                                                        <p className="text-[10px] font-mono text-muted-foreground">{broker.id}</p>
                                                    </div>
                                                </div>
                                            ))}
                                            {searchQuery && filteredBrokers.length === 0 && (
                                                <p className="text-center text-xs text-muted-foreground py-4">No users found.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[300px]">
                                        {activeMessages.length === 0 && (
                                            <div className="text-center mt-10 space-y-2">
                                                <p className="text-xs text-muted-foreground px-8">
                                                    Start a discussion. Records will be kept for future reference.
                                                </p>
                                            </div>
                                        )}
                                        {activeMessages.map((msg) => (
                                            <div
                                                key={msg.id}
                                                className={`flex ${msg.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
                                            >
                                                <div
                                                    className={`max-w-[85%] rounded-2xl p-3 text-sm shadow-sm ${msg.senderId === user?.id
                                                        ? 'bg-primary text-white rounded-br-none'
                                                        : 'bg-muted text-muted-foreground rounded-bl-none'
                                                        }`}
                                                >
                                                    {msg.text}
                                                    <div className={`text-[9px] mt-1 opacity-60 ${msg.senderId === user?.id ? 'text-right' : 'text-left'}`}>
                                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="p-3 border-t flex gap-2 bg-background shrink-0">
                                        <Input
                                            placeholder="Type a message..."
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                            className="flex-1"
                                        />
                                        <Button size={"icon" as any} onClick={handleSend} disabled={!message.trim()}>
                                            <Send className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
