"use client";

import * as React from "react";

interface DialogContextType {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const DialogContext = React.createContext<DialogContextType | undefined>(undefined);

export function Dialog({ open, onOpenChange, children }: { open: boolean; onOpenChange: (open: boolean) => void; children: React.ReactNode }) {
    return (
        <DialogContext.Provider value={{ open, onOpenChange }}>
            {children}
        </DialogContext.Provider>
    );
}

export function DialogContent({ children, className }: { children: React.ReactNode; className?: string }) {
    const context = React.useContext(DialogContext);
    if (!context) throw new Error("DialogContent must be used within Dialog");

    if (!context.open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-black/50" onClick={() => context.onOpenChange(false)} />
            <div className={`relative z-50 bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 p-6 ${className || ''}`}>
                {children}
            </div>
        </div>
    );
}

export function DialogHeader({ children }: { children: React.ReactNode }) {
    return <div className="mb-4">{children}</div>;
}

export function DialogTitle({ children }: { children: React.ReactNode }) {
    return <h2 className="text-xl font-semibold">{children}</h2>;
}

// Добавьте этот компонент:
export function DialogDescription({ children, className }: { children: React.ReactNode; className?: string }) {
    return <p className={`text-sm text-gray-600 mt-1 ${className || ''}`}>{children}</p>;
}

export function DialogFooter({ children, className }: { children: React.ReactNode; className?: string }) {
    return <div className={`mt-6 flex justify-end gap-2 ${className || ''}`}>{children}</div>;
}

// Добавьте также DialogTrigger если нужно (опционально):
export function DialogTrigger({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) {
    const context = React.useContext(DialogContext);
    if (!context) throw new Error("DialogTrigger must be used within Dialog");

    const handleClick = () => context.onOpenChange(true);

    if (asChild && React.isValidElement(children)) {
        return React.cloneElement(children, { onClick: handleClick });
    }

    return <div onClick={handleClick}>{children}</div>;
}

// Добавьте DialogClose (опционально):
export function DialogClose({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) {
    const context = React.useContext(DialogContext);
    if (!context) throw new Error("DialogClose must be used within Dialog");

    const handleClick = () => context.onOpenChange(false);

    if (asChild && React.isValidElement(children)) {
        return React.cloneElement(children, { onClick: handleClick });
    }

    return <div onClick={handleClick}>{children}</div>;
}