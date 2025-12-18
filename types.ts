
// FIX: Populating the entire content of types.ts with type definitions
// inferred from their usage across all application files. This will resolve
// numerous 'Cannot find name' and 'is not a module' errors.

export enum Page {
    WORKSHOPS = 'WORKSHOPS',
    PROFILE = 'PROFILE',
    REVIEWS = 'REVIEWS',
    PARTNERS = 'PARTNERS',
    BOUTIQUE = 'BOUTIQUE',
}

export enum SubscriptionStatus {
    ACTIVE = 'ACTIVE',
    REFUNDED = 'REFUNDED',
    TRANSFERRED = 'TRANSFERRED',
    PENDING = 'PENDING',
    COMPLETED = 'COMPLETED',
}

export enum OrderStatus {
    PENDING = 'PENDING',
    COMPLETED = 'COMPLETED',
}

export interface Country {
    id: number;
    name: string;
    code: string;
}

export interface Product {
    id: number;
    name: string;
    price: number;
    imageUrl: string;
    isDeleted?: boolean;
    ownerId?: number;
    ownerPercentage?: number;
    // Cart API specific fields
    title?: string;
    image?: string;
}

export interface Order {
    id: string;
    userId: number;
    products: { productId: number; quantity: number; price: number }[];
    totalAmount: number;
    taxAmount: number;
    status: OrderStatus;
    orderDate: string;
}

export interface Notification {
    id: string;
    message: string;
    timestamp: string;
    read: boolean;
    workshopId?: number;
}

export interface CreditTransaction {
    id: string;
    date: string;
    type: 'addition' | 'subtraction';
    amount: number;
    description: string;
    isDeleted?: boolean;
}

export interface User {
    id: number;
    fullName: string;
    email: string;
    phone: string;
    subscriptions: Subscription[];
    orders: Order[];
    notifications: Notification[];
    isDeleted?: boolean;
    sessionId?: string;
    internalCredit?: number;
    creditTransactions?: CreditTransaction[];
    token?: string;
    countriesDebugInfo?: string;
}

export interface Package {
    id: number;
    name: string;
    price: number;
    discountPrice?: number;
    features: string[] | string;
    paymentLink?: string;
    availability?: {
        endDate?: string;
    };
    attendanceType?: 'أونلاين' | 'حضوري';
}

export interface NoteResource {
    type: 'link' | 'file';
    name: string;
    value: string;
}

export interface Recording {
    name: string;
    url: string;
    accessStartDate?: string;
    accessEndDate?: string;
}

export interface MediaResource {
    type: 'audio' | 'video';
    name: string;
    value: string; // data URL for the file
    notes?: string;
}

// FIX: Add RecordingStats interface
export interface RecordingStats {
    progress: number;
    playCount: number;
    lastTimestamp: number;
    firstWatched?: string;
    lastWatched?: string;
}

export interface Review {
    id: string;
    workshopId: number;
    fullName: string;
    rating: number;
    comment: string;
    date: string;
    isDeleted?: boolean;
}

export interface Payment {
    id: string;
    amount: number;
    date: string;
    notes?: string;
}

export interface Workshop {
    id: number;
    isNew?: boolean;
    title: string;
    instructor: string;
    teacher?: string; // API field
    startDate: string;
    endDate?: string;
    date_range?: string; // API field
    startTime: string;
    start_time?: string; // API field
    endTime?: string;
    end_time?: string; // API field
    location: 'أونلاين' | 'حضوري' | 'مسجلة' | 'أونلاين وحضوري';
    type_label?: string; // API field
    country: string;
    city?: string;
    address?: string; // API field
    hotelName?: string;
    hallName?: string;
    application?: string;
    isRecorded: boolean;
    zoomLink: string;
    subject_of_discussion?: string;
    workshop_returning_policy?: string;
    description?: string;
    topics?: string[];
    isVisible: boolean;
    isDeleted?: boolean;
    packages?: Package[];
    has_multiple_packages?: boolean; // API field
    price?: number;
    paymentLink?: string;
    recordings?: Recording[];
    notes?: NoteResource[];
    mediaFiles?: MediaResource[];
    reviews?: Review[];
    certificatesIssued?: boolean;
    trainerPercentage?: number;
    trainerPayments?: Payment[];
    payItForwardBalance?: number; // Balance specific to this workshop
}



export interface Subscription {
    id: string;
    workshopId: number;
    activationDate: string;
    expiryDate: string;
    pricePaid?: number;
    packageId?: number;
    status: SubscriptionStatus;
    isApproved?: boolean;
    isDeleted?: boolean;
    paymentMethod?: 'BANK' | 'LINK' | 'GIFT' | 'CREDIT';
    transferrerName?: string;
    notes?: string;
    originalWorkshopId?: number;
    transferDate?: string;
    transferMethod?: string;
    refundDate?: string;
    refundMethod?: string;
    // FIX: Add recordingStats property to Subscription interface
    recordingStats?: { [key: string]: RecordingStats };
    creditApplied?: number;
    recordingAccessOverrides?: { [recordingUrl: string]: { accessStartDate?: string; accessEndDate?: string } };
    isGift?: boolean;
    isPayItForwardDonation?: boolean; // True if this subscription is just a donation record
    donationRemaining?: number; // Track how much of this donation is left to be used
    gifterName?: string;
    gifterUserId?: number;
    giftMessage?: string;
    gifterPhone?: string;
    attended?: boolean;
    attendanceType?: 'أونلاين' | 'حضوري';
}

export interface PendingGift {
    id: string; // Unique ID for the link
    workshopId: number;
    packageId?: number;
    attendanceType?: 'أونلاين' | 'حضوري';
    gifterName: string;
    gifterPhone: string;
    gifterEmail: string;
    gifterUserId?: number;
    giftMessage?: string;
    recipientName: string;
    recipientWhatsapp: string;
    pricePaid: number;
    createdAt: string;
    claimedByUserId?: number;
    claimedAt?: string;
    isDeleted?: boolean;
}

export interface SocialMediaLinks {
    instagram?: string;
    twitter?: string;
    facebook?: string;
    snapchat?: string;
    tiktok?: string;
}

export interface ThemeColors {
    background: { from: string; to: string; balance?: number; };
    button: { from: string; to: string; balance?: number; };
    card: { from: string; to: string; balance?: number; };
    text: { primary: string; accent: string; secondary_accent?: string; };
    glow: { color: string; intensity: number; borderWidth?: number; animationSpeed?: number; };
}

export interface Theme {
    id: string;
    name: string;
    colors: ThemeColors;
}

export interface ConsultationRequest {
    id: string;
    userId: number;
    subject: string;
    status: 'NEW' | 'APPROVED' | 'PENDING_PAYMENT' | 'PAID' | 'COMPLETED';
    requestedAt: string;
    consultationDate?: string;
    consultationTime?: string;
    durationMinutes?: number;
    fee?: number;
    paymentMethod?: 'CARD' | 'BANK_TRANSFER';
}


export interface DrhopeData {
    videos: { id: string; title: string; url: string }[];
    reviews?: {
        id: number;
        workshop_title: string;
        workshop_teacher: string;
        rating: number;
        review: string;
        user_name_and_date: string;
    }[];
    photos: string[];
    instagramLinks: { id: string; title: string; url: string }[];
    socialMediaLinks: SocialMediaLinks;
    whatsappNumber: string;
    backgroundMusicUrl: string;
    backgroundMusicName: string;
    introText: string;
    logoUrl: string;
    signature?: string;
    // FIX: Add missing cvUrl property to the DrhopeData interface.
    cvUrl: string;
    headerLinks: {
        drhope: string;
        reviews: string;
        profile: string;
    };
    accountHolderName?: string;
    bankName?: string;
    ibanNumber?: string;
    accountNumber?: string;
    swiftCode?: string;
    activeThemeId?: string;
    themes?: Theme[];
    consultationSettings?: {
        defaultDurationMinutes: number;
        defaultFee: number;
        consultationsEnabled?: boolean;
    };
    paymentSettings?: {
        cardPaymentsEnabled: boolean;
        bankTransfersEnabled: boolean;
    };
    companyAddress?: string;
    companyPhone?: string;
    taxRegistrationNumber?: string;
    liveWorkshopRefundPolicy?: string;
    recordedWorkshopTerms?: string;
    // Pay It Forward Global Stats (Optional now, as we track per workshop)
    payItForwardStats?: {
        totalFund: number;
        beneficiariesCount: number;
    };
}

export interface Expense {
    id: string;
    date: string;
    title: string;
    invoiceNumber?: string;
    workshopId?: number;
    supplier: string;
    amount: number;
    invoiceImageUrl?: string;
    notes?: string;
    isDeleted?: boolean;
    includesVat?: boolean;
}

export interface BroadcastCampaign {
    id: string;
    timestamp: string;
    subject: string;
    messageHtml: string;
    targetAudience: string;
    recipients: BroadcastRecipient[];
    attachments: any[];
    channel: 'email' | 'notification' | 'whatsapp';
}

export interface BroadcastRecipient {
    userId: number;
    fullName: string;
    email: string;
    phone?: string;
    status: 'Sent' | 'Failed' | 'Bounced (Invalid Email)' | 'Failed (No WhatsApp)';
}

export interface CertificateFieldConfig {
    id: string;
    text: string;
    x: number;
    y: number;
    fontSize: number;
    color: string;
    textAlign: 'left' | 'center' | 'right';
    fontFamily: string;
    maxWidth: number;
}

export type CustomCertificateField = CertificateFieldConfig;

export interface CertificateTemplate {
    imageDataUrl: string;
    imageWidth: number;
    imageHeight: number;
    fields: CustomCertificateField[];
}

export interface Partner {
    id: string;
    name: string;
    logo: string;
    description: string;
    websiteUrl?: string;
    instagramUrl?: string;
    twitterUrl?: string;
}

export interface PaymentIntent {
    type: 'workshop' | 'consultation' | 'gift' | 'payItForward';
    item: any; // Workshop or ConsultationRequest
    pkg?: Package;
    amount?: number;
    recipientDetails?: any;
}

export interface CartItem {
    id: number;
    product_id: number;
    quantity: number;
    price: number;
    item_total: number;
    product: Product;
}

export interface Cart {
    id: number;
    items: CartItem[];
    total_price: number;
}

export interface OrderSummaryResponse {
    key: string;
    msg: string;
    data: {
        products: any[];
        prices: {
            products_price: number;
            tax: number;
            total_price: number;
        };
        payment_options: {
            online_payment: boolean;
            bank_transfer: boolean;
        };
        bank_account?: {
            account_name: string;
            bank_name: string;
            IBAN_number: string;
            account_number: string;
            swift: string;
        };
    };
}

export interface CreateOrderResponse {
    key: string;
    msg: string;
    data: {
        order_id: number;
        invoice_url?: string;
        invoice_id?: string;
        message?: string;
    } | any[];
}

export interface PaginationMeta {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

export interface PaginatedWorkshopsResponse {
    key: string;
    msg: string;
    data: {
        live_workshops: any[];
        recorded_workshops: any[];
        pagination?: PaginationMeta;
    };
}

export interface SubscriptionCreateResponse {
    payment_options: {
        online_payment: boolean;
        bank_transfer: boolean;
    };
    subscriptions: {
        subscription_id: number;
        subscription_details: {
            workshop_id: number;
            workshop_title: string;
            package_id: string | number;
            package_title: string;
            price: number;
        };
    }[];
    bank_account?: {
        account_name: string;
        bank_name: string;
        IBAN_number: string;
        account_number: string;
        swift: string;
    };
}

export interface SubscriptionCreateInput {
    package_id: number;
    subscription_type: 'myself' | 'gift';
    recipient_name?: string[];
    recipient_phone?: string[];
    country_id?: number[];
}

export interface PaymentProcessResponse {
    key: string;
    msg: string;
    data: {
        invoice_url?: string;
        invoice_id?: string;
        subscription_id: number;
        message?: string;
    };
}

export interface PaymentProcessInput {
    subscription_id: number;
    payment_type: 'online' | 'bank_transfer';
}

export interface CharityCreateResponse {
    payment_options: {
        online_payment: boolean;
        bank_transfer: boolean;
    };
    charity_id: number;
    charity_details: {
        workshop_id: number;
        workshop_title: string;
        package_id: string | number;
        package_title: string;
        number_of_seats: number;
        price: number;
    };
    bank_account?: {
        account_name: string;
        bank_name: string;
        IBAN_number: string;
        account_number: string;
        swift: string;
    };
}

export interface CharityCreateInput {
    package_id: number;
    number_of_seats: number;
}

export interface CharityProcessInput {
    charity_id: number;
    payment_type: 'online' | 'bank_transfer';
}

export interface EarliestWorkshopData {
    id: number;
    title: string;
    type: string;
    online_link: string | null;
    start_date: string;
    start_time: string;
    is_subscribed: boolean;
    requires_authentication: boolean;
    instructor?: string;
}

export interface EarliestWorkshopResponse {
    key: string;
    msg: string;
    data: EarliestWorkshopData | null;
}

