'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface DropdownMenuProps {
    trigger: React.ReactNode;
    children: React.ReactNode;
    align?: 'left' | 'right';
}

export function DropdownMenu({ trigger, children, align = 'right' }: DropdownMenuProps) {
    const [isOpen, setIsOpen] = React.useState(false);
    const containerRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    return (
        <div className="relative" ref={containerRef}>
            <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
                {trigger}
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        transition={{ duration: 0.1 }}
                        className={cn(
                            "absolute z-50 mt-2 w-48 rounded-md bg-white dark:bg-gray-900 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none overflow-hidden",
                            align === 'right' ? "right-0" : "left-0"
                        )}
                    >
                        <div className="py-1" onClick={() => setIsOpen(false)}>
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

interface DropdownMenuItemProps {
    onClick?: () => void;
    children: React.ReactNode;
    className?: string;
    variant?: 'default' | 'danger';
}

export function DropdownMenuItem({ onClick, children, className, variant = 'default' }: DropdownMenuItemProps) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "w-full text-left px-4 py-2 text-sm transition-colors flex items-center gap-2",
                variant === 'default'
                    ? "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                    : "text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20",
                className
            )}
        >
            {children}
        </button>
    );
}
