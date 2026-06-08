"use client";

import { useState, useEffect, useRef } from "react";
import { MessageSquare, X, Send, Loader2, Trash2, History, Download } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Message {
    id: string;
    text: string;
    isUser: boolean;
    timestamp: Date;
}

interface ChatSession {
    id: string;
    title: string;
    messages: Message[];
    createdAt: Date;
    updatedAt: Date;
}

interface AiChatBotProps {
    userId: string | null;
    donorContext?: any;
}

const STORAGE_KEY_PREFIX = "bloodconnect_chat_sessions_";
const CURRENT_SESSION_KEY = "bloodconnect_current_session";

export function AiChatBot({ userId, donorContext }: AiChatBotProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputMessage, setInputMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (userId) {
            loadSessions();
        }
    }, [userId]);

    useEffect(() => {
        if (currentSessionId && messages.length > 0) {
            saveCurrentSession();
        }
    }, [messages, currentSessionId]);

    useEffect(() => {
        if (isOpen && messages.length === 0 && !currentSessionId) {
            startNewSession();
        }
    }, [isOpen, messages.length, currentSessionId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    const loadSessions = () => {
        const storageKey = `${STORAGE_KEY_PREFIX}${userId}`;
        const savedSessions = localStorage.getItem(storageKey);
        const savedCurrentSessionId = localStorage.getItem(`${CURRENT_SESSION_KEY}_${userId}`);

        if (savedSessions) {
            const parsedSessions = JSON.parse(savedSessions);
            const sessionsWithDates = parsedSessions.map((session: any) => ({
                ...session,
                createdAt: new Date(session.createdAt),
                updatedAt: new Date(session.updatedAt),
                messages: session.messages.map((msg: any) => ({
                    ...msg,
                    timestamp: new Date(msg.timestamp)
                }))
            }));
            setSessions(sessionsWithDates);

            if (savedCurrentSessionId) {
                const lastSession = sessionsWithDates.find((s: ChatSession) => s.id === savedCurrentSessionId);
                if (lastSession) {
                    setCurrentSessionId(lastSession.id);
                    setMessages(lastSession.messages);
                    return;
                }
            }

            if (sessionsWithDates.length > 0) {
                const lastSession = sessionsWithDates.sort((a: ChatSession, b: ChatSession) =>
                    b.updatedAt.getTime() - a.updatedAt.getTime()
                )[0];
                setCurrentSessionId(lastSession.id);
                setMessages(lastSession.messages);
            }
        }
    };

    const saveCurrentSession = () => {
        if (!currentSessionId || messages.length === 0) return;

        const existingSessionIndex = sessions.findIndex(s => s.id === currentSessionId);
        const updatedSession: ChatSession = {
            id: currentSessionId,
            title: messages[0]?.text?.slice(0, 50) || "New Conversation",
            messages: messages,
            createdAt: existingSessionIndex !== -1 ? sessions[existingSessionIndex].createdAt : new Date(),
            updatedAt: new Date()
        };

        let updatedSessions: ChatSession[];
        if (existingSessionIndex !== -1) {
            updatedSessions = [...sessions];
            updatedSessions[existingSessionIndex] = updatedSession;
        } else {
            updatedSessions = [...sessions, updatedSession];
        }

        updatedSessions.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

        setSessions(updatedSessions);
        localStorage.setItem(`${STORAGE_KEY_PREFIX}${userId}`, JSON.stringify(updatedSessions));
        localStorage.setItem(`${CURRENT_SESSION_KEY}_${userId}`, currentSessionId);
    };

    const startNewSession = () => {
        const newSessionId = Date.now().toString();
        const welcomeMessage: Message = {
            id: "welcome",
            text: "Hi!\n\nI'm your BloodConnect assistant. \n\nAsk me anything about blood donation - prep, eligibility, recovery, or your donor stats. I'm here to help! ",
            isUser: false,
            timestamp: new Date(),
        };

        setCurrentSessionId(newSessionId);
        setMessages([welcomeMessage]);
    };

    const loadSession = (sessionId: string) => {
        const session = sessions.find(s => s.id === sessionId);
        if (session) {
            setCurrentSessionId(session.id);
            setMessages(session.messages);
            setIsOpen(true);
        }
    };

    const deleteSession = (sessionId: string) => {
        const updatedSessions = sessions.filter(s => s.id !== sessionId);
        setSessions(updatedSessions);
        localStorage.setItem(`${STORAGE_KEY_PREFIX}${userId}`, JSON.stringify(updatedSessions));

        if (currentSessionId === sessionId) {
            if (updatedSessions.length > 0) {
                loadSession(updatedSessions[0].id);
            } else {
                startNewSession();
            }
        }

        setSessionToDelete(null);
        setIsDeleteDialogOpen(false);
    };

    const deleteAllSessions = () => {
        setSessions([]);
        setCurrentSessionId(null);
        setMessages([]);
        localStorage.removeItem(`${STORAGE_KEY_PREFIX}${userId}`);
        localStorage.removeItem(`${CURRENT_SESSION_KEY}_${userId}`);
        startNewSession();
    };

    const exportChatHistory = () => {
        const exportData = {
            userId: userId,
            exportDate: new Date().toISOString(),
            sessions: sessions.map(session => ({
                title: session.title,
                createdAt: session.createdAt,
                updatedAt: session.updatedAt,
                messages: session.messages.map(msg => ({
                    text: msg.text,
                    isUser: msg.isUser,
                    timestamp: msg.timestamp
                }))
            }))
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `bloodconnect_chat_history_${userId}_${new Date().toISOString().split("T")[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const sendMessage = async () => {
        if (!inputMessage.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            text: inputMessage,
            isUser: true,
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInputMessage("");
        setIsLoading(true);

        try {
            const contextString = donorContext ? `
 **DONOR INFORMATION:**
- Name: ${donorContext.fullName || 'Not specified'}
- Blood Type: ${donorContext.bloodType || 'Not specified'}
- Total Donations: ${donorContext.totalDonations || 0}
- Last Donation: ${donorContext.lastDonationDate ? new Date(donorContext.lastDonationDate).toLocaleDateString() : 'No data'}
- Next Eligible Donation: ${donorContext.nextEligibleDate ? new Date(donorContext.nextEligibleDate).toLocaleDateString() : 'Not calculated'}
- Donor Level: ${donorContext.donorLevel || 'Newcomer'}
- Status: ${donorContext.donorStatus || 'ACTIVE'}
- City: ${donorContext.city || 'Not specified'}
            ` : null;

            const response = await fetch("/api/gemini", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    message: inputMessage,
                    donorContext: contextString,
                    chatHistory: messages.slice(-5).map(m => ({
                        role: m.isUser ? "user" : "assistant",
                        content: m.text
                    }))
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to get response");
            }

            const data = await response.json();

            const botMessage: Message = {
                id: (Date.now() + 1).toString(),
                text: data.response,
                isUser: false,
                timestamp: new Date(),
            };

            setMessages(prev => [...prev, botMessage]);
        } catch (error) {
            console.error("Error sending message:", error);
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                text: "Sorry, something went wrong. Please try again in a moment.",
                isUser: false,
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const formatDate = (date: Date) => {
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return "Today";
        if (diffDays === 1) return "Yesterday";
        if (diffDays < 7) return `${diffDays} days ago`;
        return date.toLocaleDateString();
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary/80 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 flex items-center justify-center group"
            >
                <MessageSquare className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                <span className="absolute inset-0 rounded-full bg-primary animate-ping opacity-20" />
            </button>
        );
    }

    return (
        <>
            <div className="fixed z-50 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-border bottom-6 right-6 w-[500px] h-[700px] flex flex-col">
                <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-primary to-primary/80 rounded-t-2xl">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                            <MessageSquare className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-white">BloodConnect Assistant</h3>
                            <p className="text-xs text-white/80">AI • Remembers our conversations</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="p-1.5 hover:bg-white/20 rounded-lg transition-colors">
                                    <History className="w-4 h-4 text-white" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-64 max-h-80 overflow-y-auto">
                                {sessions.length === 0 ? (
                                    <div className="px-3 py-2 text-sm text-muted-foreground">
                                        No saved conversations
                                    </div>
                                ) : (
                                    <>
                                        <DropdownMenuItem onClick={startNewSession} className="cursor-pointer">
                                            <MessageSquare className="w-4 h-4 mr-2" />
                                            New Conversation
                                        </DropdownMenuItem>
                                        <div className="border-t my-1" />
                                        {sessions.map((session) => (
                                            <div key={session.id} className="flex items-center justify-between group">
                                                <button
                                                    onClick={() => loadSession(session.id)}
                                                    className={`flex-1 text-left px-3 py-2 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 ${
                                                        currentSessionId === session.id ? "bg-primary/10 text-primary" : ""
                                                    }`}
                                                >
                                                    <div className="truncate max-w-[180px]">{session.title}</div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {formatDate(new Date(session.updatedAt))}
                                                    </div>
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setSessionToDelete(session.id);
                                                        setIsDeleteDialogOpen(true);
                                                    }}
                                                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded-lg transition-all"
                                                >
                                                    <Trash2 className="w-3 h-3 text-red-500" />
                                                </button>
                                            </div>
                                        ))}
                                        <div className="border-t my-1" />
                                        <DropdownMenuItem onClick={exportChatHistory} className="cursor-pointer">
                                            <Download className="w-4 h-4 mr-2" />
                                            Export All History
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => {
                                                setSessionToDelete("ALL");
                                                setIsDeleteDialogOpen(true);
                                            }}
                                            className="cursor-pointer text-red-600"
                                        >
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Delete All Conversations
                                        </DropdownMenuItem>
                                    </>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsOpen(false);
                            }}
                            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                        >
                            <X className="w-4 h-4 text-white" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-900">
                    {messages.map((message) => (
                        <div
                            key={message.id}
                            className={`flex ${message.isUser ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-200`}
                        >
                            <div
                                className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                                    message.isUser
                                        ? "bg-gradient-to-br from-primary to-primary/80 text-white"
                                        : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                }`}
                            >
                                {message.isUser ? (
                                    <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                                ) : (
                                    <div className="text-sm prose prose-sm dark:prose-invert max-w-none">
                                        <ReactMarkdown>{message.text}</ReactMarkdown>
                                    </div>
                                )}
                                <p className="text-[10px] opacity-70 mt-1.5 text-right">
                                    {new Date(message.timestamp).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })}
                                </p>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-2.5">
                                <div className="flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                    <span className="text-sm text-gray-500">Thinking...</span>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div className="p-4 border-t border-border bg-white dark:bg-gray-900 rounded-b-2xl">
                    <div className="flex gap-2">
                        <input
                            ref={inputRef}
                            type="text"
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Ask me anything..."
                            className="flex-1 px-4 py-2.5 text-sm rounded-xl border border-border bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground placeholder:text-muted-foreground"
                            disabled={isLoading}
                        />
                        <button
                            onClick={sendMessage}
                            disabled={!inputMessage.trim() || isLoading}
                            className="p-2.5 rounded-xl bg-gradient-to-br from-primary to-primary/80 text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                    <p className="text-[10px] text-muted-foreground text-center mt-2">
                         Your conversations are saved locally • You can delete them anytime
                    </p>
                </div>
            </div>

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Conversation{sessionToDelete === "ALL" ? "s" : ""}?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {sessionToDelete === "ALL"
                                ? "This will permanently delete ALL your chat history. This action cannot be undone."
                                : "This will permanently delete this conversation. The messages cannot be recovered."
                            }
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                if (sessionToDelete === "ALL") {
                                    deleteAllSessions();
                                } else if (sessionToDelete) {
                                    deleteSession(sessionToDelete);
                                }
                            }}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}