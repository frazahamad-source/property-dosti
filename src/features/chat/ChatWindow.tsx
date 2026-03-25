
'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Send, Bot, X, Search, ChevronLeft, MessageSquare, CheckCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Broker, ChatMessage, Admin } from '@/lib/types';
import { supabase } from '@/lib/supabaseClient';

interface ChatWindowProps {
    isOpen: boolean;
    onClose: () => void;
}

export function ChatWindow({ isOpen, onClose }: ChatWindowProps) {
    const { user, brokers, chatMessages, addChatMessage, fetchChatMessages, markMessagesAsRead } = useStore();
    const [message, setMessage] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUser, setSelectedUser] = useState<Broker | 'bot' | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen && user?.id) {
            fetchChatMessages(user.id);
        }
    }, [isOpen, user?.id, fetchChatMessages]);

    // Mark as read when selectedUser changes or new messages arrive
    useEffect(() => {
        if (isOpen && selectedUser && user?.id) {
            const senderId = selectedUser === 'bot' ? 'bot' : selectedUser.id;
            const hasUnread = chatMessages.some(m => m.senderId === senderId && m.receiverId === user.id && !m.isRead);
            if (hasUnread) {
                markMessagesAsRead(senderId);
            }
        }
    }, [isOpen, selectedUser, chatMessages, user?.id, markMessagesAsRead]);

    useEffect(() => {
        if (!user?.id) return;

        const channel = supabase
            .channel('chat_realtime')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'chat_messages',
                filter: `receiver_id=eq.${user.id}`,
            }, (payload) => {
                const newMsg: ChatMessage = {
                    id: payload.new.id,
                    senderId: payload.new.sender_id,
                    receiverId: payload.new.receiver_id,
                    text: payload.new.text,
                    timestamp: payload.new.timestamp,
                    isRead: payload.new.is_read
                };
                // Only add if not already in state
                addChatMessage(newMsg);

                // Play notification sound
                const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
                audio.play().catch(e => console.log('Sound play blocked:', e));
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user?.id, addChatMessage]);

    useEffect(() => {
        scrollToBottom();
    }, [chatMessages, selectedUser]);

    const sortedBrokers = useMemo(() => {
        const lastMessageMap: Record<string, number> = {};
        const unreadSet = new Set<string>();

        chatMessages.forEach(msg => {
            const otherParty = msg.senderId === user?.id ? msg.receiverId : msg.senderId;
            if (otherParty !== 'bot' && otherParty !== 'anonymous') {
                const ts = new Date(msg.timestamp).getTime();
                if (!lastMessageMap[otherParty] || ts > lastMessageMap[otherParty]) {
                    lastMessageMap[otherParty] = ts;
                }
                if (msg.receiverId === user?.id && !msg.isRead) {
                    unreadSet.add(msg.senderId);
                }
            }
        });

        return [...brokers]
            .filter(b => b.id !== user?.id)
            .sort((a, b) => {
                const hasUnreadA = unreadSet.has(a.id);
                const hasUnreadB = unreadSet.has(b.id);

                if (hasUnreadA && !hasUnreadB) return -1;
                if (!hasUnreadA && hasUnreadB) return 1;

                const timeA = lastMessageMap[a.id] || 0;
                const timeB = lastMessageMap[b.id] || 0;
                return timeB - timeA;
            });
    }, [brokers, chatMessages, user?.id]);

    const filteredBrokers = useMemo(() => {
        if (!searchQuery.trim()) return sortedBrokers;
        return sortedBrokers.filter(b =>
            (b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                b.id.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    }, [sortedBrokers, searchQuery]);

    const handleSelectUser = (broker: Broker | 'bot') => {
        setSelectedUser(broker);
        if (broker !== 'bot') {
            markMessagesAsRead(broker.id);
        }
    };

    const activeMessages = useMemo(() => {
        if (!selectedUser) return [];
        const targetId = selectedUser === 'bot' ? 'bot' : selectedUser.id;
        const myId = user?.id || 'anonymous';
        return chatMessages.filter(msg =>
            (msg.senderId === myId && msg.receiverId === targetId) ||
            (msg.senderId === targetId && msg.receiverId === myId)
        );
    }, [chatMessages, selectedUser, user]);

    const handleSend = async () => {
        if (!message.trim() || !selectedUser) return;

        const targetId = selectedUser === 'bot' ? 'bot' : selectedUser.id;
        const newMsg: ChatMessage = {
            id: `msg-${Date.now()}`,
            senderId: user?.id || 'anonymous',
            receiverId: targetId,
            text: message,
            timestamp: new Date().toISOString(),
            isRead: false,
        };

        await addChatMessage(newMsg);
        setMessage('');

        // Bot Logic
        if (targetId === 'bot') {
            const lowerMsg = message.toLowerCase();
            let botReply = "I'm still learning! How can I help you today?";

            if (lowerMsg.includes('hello') || lowerMsg.includes('hi')) {
                botReply = `Hello ${(user as Broker | Admin | null)?.name || 'there'}! I am your Property Dosti Assistant.`;
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
                    isRead: false,
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
                    className="fixed inset-0 sm:inset-auto sm:bottom-6 sm:right-6 z-[60] sm:w-[400px] sm:max-w-[calc(100vw-3rem)]"
                >
                    <Card className="border-primary/20 bg-background/95 backdrop-blur overflow-hidden flex flex-col h-full sm:h-[600px] sm:max-h-[calc(100vh-10rem)] shadow-2xl sm:rounded-2xl rounded-none">
                        <CardHeader className="flex flex-row items-center justify-between py-4 border-b bg-primary/10 shrink-0 px-4">
                            <div className="flex items-center gap-3">
                                {selectedUser && (
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => setSelectedUser(null)}>
                                        <ChevronLeft className="h-5 w-5" />
                                    </Button>
                                )}
                                <div className="relative">
                                    <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/20">
                                        {selectedUser === 'bot' ? (
                                            <Bot className="h-6 w-6 text-primary" />
                                        ) : selectedUser ? (
                                            <span className="font-bold text-primary">{(selectedUser as Broker).name[0].toUpperCase()}</span>
                                        ) : (
                                            <MessageSquare className="h-6 w-6 text-primary" />
                                        )}
                                    </div>
                                    {selectedUser === 'bot' && (
                                        <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 bg-green-500 rounded-full border-2 border-white dark:border-gray-900" />
                                    )}
                                </div>
                                <div className="flex flex-col">
                                    <CardTitle className="text-sm font-bold leading-none">
                                        {selectedUser === 'bot' ? 'Property Assistant' : (selectedUser as Broker | null)?.name || 'Property Dosti Chat'}
                                    </CardTitle>
                                    <span className="text-[10px] text-muted-foreground mt-1">
                                        {selectedUser === 'bot' ? 'Online' : selectedUser ? 'Broker' : 'Connect with others'}
                                    </span>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground" onClick={onClose}>
                                <X className="h-5 w-5" />
                            </Button>
                        </CardHeader>

                        <CardContent className="p-0 flex-1 flex flex-col overflow-hidden bg-[url('https://w0.peakpx.com/wallpaper/580/650/HD-wallpaper-whatsapp-bg-cool-whatsapp-original.jpg')] bg-repeat bg-[length:400px]">
                            <div className="absolute inset-0 bg-white/90 dark:bg-black/80 pointer-events-none" />

                            {!selectedUser ? (
                                <div className="relative p-4 flex flex-col h-full space-y-4 z-10">
                                    <div className="relative group">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                                        <Input
                                            placeholder="Search by Name or User ID..."
                                            className="pl-10 h-11 bg-background/50 border-primary/10 rounded-xl focus-visible:ring-primary/20 transition-all font-medium"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                    </div>

                                    <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                                        <div
                                            className="flex items-center gap-4 p-3 rounded-2xl hover:bg-primary/5 cursor-pointer transition-all border border-transparent hover:border-primary/10 bg-background/40"
                                            onClick={() => handleSelectUser('bot')}
                                        >
                                            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center border border-primary/10">
                                                <Bot className="h-7 w-7 text-primary" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-sm">Property Assistant</p>
                                                <p className="text-xs text-muted-foreground truncate">I can help with subscriptions and renewals</p>
                                            </div>
                                            <div className="h-2 w-2 rounded-full bg-green-500" />
                                        </div>

                                        <div className="space-y-2">
                                            <p className="text-[10px] uppercase font-bold text-primary tracking-widest px-2 opacity-70">Active Brokers</p>
                                            {filteredBrokers.map(broker => {
                                                const brokerUnreadCount = chatMessages.filter(m => m.senderId === broker.id && m.receiverId === user?.id && !m.isRead).length;

                                                return (
                                                    <div
                                                        key={broker.id}
                                                        className={`flex items-center gap-4 p-3 rounded-2xl hover:bg-primary/5 cursor-pointer transition-all border bg-background/40 ${brokerUnreadCount > 0
                                                            ? 'border-red-500/50 bg-red-50/10 dark:bg-red-900/10 shadow-sm'
                                                            : 'border-transparent hover:border-primary/10'
                                                            }`}
                                                        onClick={() => handleSelectUser(broker)}
                                                    >
                                                        <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center font-bold text-secondary-foreground">
                                                            {broker.name[0]}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-bold text-sm truncate">{broker.name}</p>
                                                            <p className="text-[10px] font-mono text-muted-foreground truncate">{broker.id}</p>
                                                        </div>
                                                        {brokerUnreadCount > 0 && (
                                                            <div className="h-5 w-5 rounded-full bg-red-600 text-white text-[10px] flex items-center justify-center font-bold animate-pulse">
                                                                {brokerUnreadCount}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                            {searchQuery && filteredBrokers.length === 0 && (
                                                <div className="text-center py-10 opacity-50">
                                                    <Search className="h-10 w-10 mx-auto mb-2" />
                                                    <p className="text-xs">No users found.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="relative flex-1 flex flex-col overflow-hidden z-10">
                                    <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                                        {activeMessages.length === 0 && (
                                            <div className="text-center mt-10 space-y-2 px-8">
                                                <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10 inline-block mb-4">
                                                    <MessageSquare className="h-8 w-8 text-primary mx-auto mb-2" />
                                                    <p className="text-xs font-medium text-primary">Encryption & Privacy</p>
                                                </div>
                                                <p className="text-[11px] text-muted-foreground leading-relaxed">
                                                    Messages are stored securely in our database. Start a conversation with {selectedUser === 'bot' ? 'our AI Assistant' : (selectedUser as Broker).name}.
                                                </p>
                                            </div>
                                        )}
                                        {activeMessages.map((msg) => {
                                            const isMe = user ? msg.senderId === user.id : msg.senderId === 'anonymous';
                                            return (
                                                <div
                                                    key={msg.id}
                                                    className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                                                >
                                                    <div
                                                        className={`relative max-w-[85%] px-3 py-2 text-sm shadow-sm ${isMe
                                                            ? 'bg-primary text-white rounded-2xl rounded-tr-none'
                                                            : 'bg-background text-foreground rounded-2xl rounded-tl-none border border-border'
                                                            }`}
                                                    >
                                                        <p className="leading-relaxed">{msg.text}</p>
                                                        <div className={`flex items-center gap-1 mt-1 justify-end opacity-70 text-[9px]`}>
                                                            <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                            {isMe && <CheckCheck className="h-3 w-3" />}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        <div ref={messagesEndRef} />
                                    </div>

                                    <div className="p-4 border-t bg-background/80 backdrop-blur-md shrink-0">
                                        <div className="flex gap-2 items-center">
                                            <Input
                                                placeholder="Type a message..."
                                                value={message}
                                                onChange={(e) => setMessage(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                                className="flex-1 h-11 bg-muted/30 border-none rounded-2xl focus-visible:ring-primary/20 transition-all font-medium"
                                            />
                                            <Button
                                                size="icon"
                                                onClick={handleSend}
                                                disabled={!message.trim()}
                                                className="h-11 w-11 rounded-full bg-primary hover:bg-primary/90 text-white shadow-lg active:scale-95 transition-all shrink-0"
                                            >
                                                <Send className="h-5 w-5" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
