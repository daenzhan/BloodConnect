"use client";

import { useState, useEffect, useRef } from "react";
import { MessageSquare, X, Send, Minimize2, Maximize2, Loader2, Trash2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface Message {
    id: string;
    text: string;
    isUser: boolean;
    timestamp: Date;
}

interface AiChatBotProps {
    userId: string | null;
    donorContext?: any;
}

export function AiChatBot({ userId, donorContext }: AiChatBotProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputMessage, setInputMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Ключ для localStorage (уникальный для каждого пользователя)
    const storageKey = `chat_history_${userId || "guest"}`;

    // Загрузка истории чата при монтировании
    useEffect(() => {
        if (userId) {
            try {
                const savedHistory = localStorage.getItem(storageKey);
                if (savedHistory) {
                    const parsedHistory = JSON.parse(savedHistory);
                    // Восстанавливаем даты (JSON превращает их в строки)
                    const restoredMessages = parsedHistory.map((msg: any) => ({
                        ...msg,
                        timestamp: new Date(msg.timestamp),
                    }));
                    setMessages(restoredMessages);
                }
            } catch (error) {
                console.error("Error loading chat history:", error);
            }
        }
    }, [userId, storageKey]);

    // Сохранение истории чата при изменениях
    useEffect(() => {
        if (userId && messages.length > 0) {
            try {
                localStorage.setItem(storageKey, JSON.stringify(messages));
            } catch (error) {
                console.error("Error saving chat history:", error);
            }
        }
    }, [messages, userId, storageKey]);

    // Приветственное сообщение только если нет истории
    useEffect(() => {
        if (isOpen && messages.length === 0) {
            const welcomeMessage: Message = {
                id: "welcome",
                text: "👋 Hello! I'm your AI blood donation assistant. Ask me anything about the donation process, preparation, or recovery!\n\n💉 **I can help you with:**\n- Preparation for donation\n- Nutrition before and after\n- Recovery process\n- Health-related questions\n- Information about your donor status",
                isUser: false,
                timestamp: new Date(),
            };
            setMessages([welcomeMessage]);
        }
    }, [isOpen, messages.length]);

    // Очистка истории чата
    const clearChatHistory = () => {
        if (confirm("Are you sure you want to clear your chat history?")) {
            localStorage.removeItem(storageKey);
            const welcomeMessage: Message = {
                id: "welcome",
                text: "👋 Hello! I'm your AI blood donation assistant. Ask me anything about the donation process, preparation, or recovery!\n\n💉 **I can help you with:**\n- Preparation for donation\n- Nutrition before and after\n- Recovery process\n- Health-related questions\n- Information about your donor status",
                isUser: false,
                timestamp: new Date(),
            };
            setMessages([welcomeMessage]);
        }
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
        if (isOpen && !isMinimized && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen, isMinimized]);

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
📋 **DONOR INFORMATION:**
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
                text: "😔 Sorry, an error occurred. Please check your internet connection and try again later.\n\nIf the error persists, please contact support.",
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
        <div
            className={`fixed z-50 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-border transition-all duration-300 ${
                isMinimized
                    ? "bottom-6 right-6 w-80 h-14"
                    : "bottom-6 right-6 w-[450px] h-[650px]"
            }`}
        >
            <div
                className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-primary to-primary/80 rounded-t-2xl cursor-pointer"
                onClick={() => !isMinimized && setIsMinimized(true)}
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                        <MessageSquare className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-white">AI Health Assistant</h3>
                        <p className="text-xs text-white/80">Gemini AI • Personal Assistant</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            clearChatHistory();
                        }}
                        className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                        title="Clear chat history"
                    >
                        <Trash2 className="w-4 h-4 text-white" />
                    </button>
                    {!isMinimized && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsMinimized(true);
                            }}
                            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                        >
                            <Minimize2 className="w-4 h-4 text-white" />
                        </button>
                    )}
                    {isMinimized && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsMinimized(false);
                            }}
                            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                        >
                            <Maximize2 className="w-4 h-4 text-white" />
                        </button>
                    )}
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

            {!isMinimized && (
                <>
                    <div className="flex-1 h-[calc(100%-130px)] overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-900">
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
                                        {message.timestamp.toLocaleTimeString([], {
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
                                        <span className="text-sm text-gray-500">Typing...</span>
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
                                placeholder="Ask a question about donation..."
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
                        <div className="flex justify-between items-center mt-2">
                            <p className="text-[10px] text-muted-foreground">
                                💡 AI assistant analyzes your donor profile
                            </p>
                            {messages.length > 1 && (
                                <button
                                    onClick={clearChatHistory}
                                    className="text-[10px] text-muted-foreground hover:text-red-500 transition-colors"
                                >
                                    Clear history
                                </button>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}