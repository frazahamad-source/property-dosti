
export interface Broker {
    id: string;
    name: string;
    email: string;
    phone: string;
    brokerCode: string; // Unique, auto-generated
    reraNumber?: string;
    districts: string[]; // Dakshina Kannada, Moodbidri, Puttur, Udupi
    city?: string;
    village?: string;
    status: 'pending' | 'approved' | 'rejected';
    password?: string; // In real app, this would be hashed
    registeredAt: string; // ISO date
    subscriptionExpiry: string; // ISO date
    referralCode: string;
    referredBy?: string;
    referralsCount: number;
}

export interface ChatMessage {
    id: string;
    senderId: string;
    receiverId: string; // 'bot' or unique user ID
    text: string;
    timestamp: string;
}

export interface Banner {
    title: string;
    description: string;
    buttonText: string;
    buttonLink: string;
    backgroundImage?: string;
}

export interface Property {
    id: string;
    brokerId: string;
    title: string;
    description: string;
    price: number;
    district: string;
    location: string; // City/Area
    type: 'sale' | 'rent';
    category: 'residential' | 'commercial' | 'land';
    images: string[];
    createdAt: string; // ISO date
    updatedAt: string; // ISO date
    expiresAt: string; // ISO date (45 days validity)
    isActive: boolean;
    likes: number;
    leadsCount: number;
}

export interface PropertyLead {
    id: string;
    propertyId: string;
    brokerId: string;
    name: string;
    phone: string;
    message: string;
    timestamp: string;
}

export interface Admin {
    id: string;
    email: string;
    password: string;
}

export const DISTRICTS = [
    "Bagalkot",
    "Ballari",
    "Belagavi",
    "Bengaluru Rural",
    "Bengaluru Urban",
    "Bidar",
    "Chamarajanagar",
    "Chikkaballapur",
    "Chikkamagaluru",
    "Chitradurga",
    "Dakshina Kannada",
    "Davanagere",
    "Dharwad",
    "Gadag",
    "Hassan",
    "Haveri",
    "Kalaburagi",
    "Kodagu",
    "Kolar",
    "Koppal",
    "Mandya",
    "Mysuru",
    "Raichur",
    "Ramanagara",
    "Shivamogga",
    "Tumakuru",
    "Udupi",
    "Uttara Kannada",
    "Vijayapura",
    "Yadgir",
    "Vijayanagara"
] as const;
