
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function sanitizePhone(phone: string): string {
    if (!phone) return '';

    // 1. Remove all spaces and non-digit characters except the leading '+'
    let cleaned = phone.trim().replace(/[^\d+]/g, '');

    // 2. Handle '+' prefix
    if (cleaned.startsWith('+')) {
        return cleaned.substring(1); // Return just digits for wa.me/tel:
    }

    // 3. Handle '00' prefix (international format via 00)
    if (cleaned.startsWith('00')) {
        return cleaned.substring(2);
    }

    // 4. Handle leading '0' (often used for domestic roaming/trunk in some countries)
    if (cleaned.startsWith('0') && cleaned.length === 11) {
        // If 11 digits starting with 0, assume it's a 10-digit Indian number
        return '91' + cleaned.substring(1);
    }

    // 5. Handle standard 10-digit number (assume India +91 if not specified)
    if (cleaned.length === 10) {
        return '91' + cleaned;
    }

    // 6. Return as is if it doesn't match above patterns, but as digits only
    return cleaned.replace(/\D/g, '');
}
