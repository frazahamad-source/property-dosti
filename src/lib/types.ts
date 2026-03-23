
export interface Broker {
    id: string;
    name: string;
    email: string;
    phone: string;

    broker_code: string; // Legacy Unique, auto-generated
    uniqueBrokerId: string; // PD-XXXXXX
    reraNumber?: string;
    districts: string[]; // Dakshina Kannada, Moodbidri, Puttur, Udupi
    city?: string;
    village?: string;
    companyName?: string;
    designation?: string;
    role: 'broker' | 'manager' | 'supervisor';
    userPermissions?: {
        can_view_leads: boolean;
        can_reply_chats: boolean;
        can_change_logo: boolean;
        can_edit_footer: boolean;
        can_approve_brokers: boolean;
    };
    status: 'pending' | 'approved' | 'rejected';
    password?: string; // In real app, this would be hashed
    registeredAt: string; // ISO date
    subscriptionExpiry: string; // ISO date
    referralCode: string;
    referredBy?: string;
    referralCount: number;
    referral_count?: number; // DB compatibility
    referralEarnings: number;
    whatsappNumber?: string;
    isAdmin?: boolean;
    avatarUrl?: string;
}

export interface ChatMessage {
    id: string;
    senderId: string;
    receiverId: string; // 'bot' or unique user ID
    text: string;
    timestamp: string;
}

export interface Banner {
    slides: BannerSlide[];
}

export interface BannerSlide {
    id: string;
    title: string;
    description: string;
    buttonText: string;
    buttonLink: string;
    backgroundImage: string;
    backgroundPosition?: string; // e.g. "50% 50%"
}

export interface PromoBanner {
    text: string;
    buttonText: string;
    buttonLink: string;
    backgroundImage?: string;
    isVisible: boolean;
}

export interface LogoConfig {
    type: 'text' | 'image';
    text: string;
    fontSize?: number;
    color?: string;
    tagline?: string;
    taglineFontSize?: number;
    taglineColor?: string;
    imageUrl?: string;
}

export interface IconConfig {
    type: 'default' | 'image';
    imageUrl?: string;
}

export interface SiteConfig {
    heroTitle: string;
    heroDescription: string;
    heroBackgroundImage: string;
    logo?: LogoConfig;
    icon?: IconConfig;
    footerText: string;
    socialLinks: {
        facebook?: string;
        twitter?: string;
        instagram?: string;
        linkedin?: string;
    };
    contactPhone: string;
    contactEmail: string;
    officeAddress?: string;
    promoBanner?: PromoBanner;
}

export interface Property {
    id: string;
    brokerId: string;
    title: string;
    description: string;
    price: number;
    district: string;
    location: string; // City/Area
    village?: string;
    type: 'sale' | 'rent' | 'lease' | 'joint_venture';
    hidePrice?: boolean;
    category: 'residential' | 'commercial' | 'land' | 'villa' | 'apartment' | 'offices' | 'farmhouse' | 'godown' | 'both';
    structureType?: string; // Villa, Apartment, Farmhouse, Land, Godown, Office, etc.
    areaOfVilla?: number;
    villaType?: string;
    anyStructure?: boolean;
    structureCategory?: string;
    structureArea?: number;
    structureSpecification?: string;
    advanceAmount?: number;
    sharingRatio?: string;
    goodwillAmount?: number;
    landArea?: number;
    landAreaUnit?: 'Cents' | 'Acres' | 'Gunta' | 'Ankanam' | 'Hectare';
    floorNumber?: number;
    floorDetail?: string;
    parkingSpaces?: number;
    parkingType?: 'Covered' | 'Open' | 'Open but Covered' | 'Common Parking';
    parkingAllocated?: string;
    facilities?: string[];
    googleMapLink?: string;
    images: string[];
    profiles?: {
        name: string;
        company_name?: string;
        phone?: string;
        whatsapp_number?: string;
        verified?: boolean;
    };
    amenities: string[];
    createdAt: string;
    updatedAt: string; // ISO date
    expiresAt: string; // ISO date (45 days validity)
    isActive: boolean;
    is_sold?: boolean;
    likes: number;
    leadsCount: number;
    brokerPhone?: string;
}

export interface PropertyLead {
    id: string;
    propertyId: string;
    property_id?: string; // DB compatibility
    brokerId: string;
    name: string;
    phone: string;
    message: string;
    status: 'new' | 'read' | 'contacted';
    timestamp: string;
}

export interface Admin {
    id: string;
    email: string;
    password: string;
    name?: string;
    avatarUrl?: string;
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

export interface AmenityConfig {
    id: string;
    name: string;
    property_types: string[]; // Association with Apartment, Villa, etc.
    created_at?: string;
    updated_at?: string;
}

export interface VillaTypeConfig {
    id: string;
    name: string;
    created_at?: string;
    updated_at?: string;
}

export interface Referral {
    id: string;
    referring_broker_id: string;
    referred_broker_id?: string;
    referred_person_name: string;
    referred_contact: string;
    status: 'pending' | 'completed';
    referral_code: string;
    admin_approval_status: 'pending' | 'approved' | 'rejected';
    reward_status: 'pending' | 'sent' | 'none' | 'applied';
    reward_value: number;
    created_at: string;
}
