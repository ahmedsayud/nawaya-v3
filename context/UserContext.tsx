import React, { useState, useEffect, useMemo, createContext, useContext } from 'react';
import axios from 'axios';
import { API_BASE_URL, API_ENDPOINTS } from '../constants';
import { User, Workshop, DrhopeData, Notification, SubscriptionStatus, Subscription, Product, Order, OrderStatus, Partner, ConsultationRequest, Theme, ThemeColors, CreditTransaction, PendingGift, Expense, BroadcastCampaign, Review, Country, Cart, CartItem, OrderSummaryResponse, CreateOrderResponse, PaginationMeta, Package, SubscriptionCreateResponse, SubscriptionCreateInput, PaymentProcessResponse, PaymentProcessInput, CharityCreateResponse, CharityCreateInput, CharityProcessInput, EarliestWorkshopData, EarliestWorkshopResponse } from '../types';
import { normalizePhoneNumber, parseArabicDateRange } from '../utils';
import { trackEvent } from '../analytics';

// Initial Data (Simulated Database)
const initialWorkshops: Workshop[] = [];

const initialUsers: User[] = [];

const initialDrhopeData: Omit<DrhopeData, 'themes'> & { themes: Theme[], activeThemeId: string } = {
    videos: [],
    photos: [],
    instagramLinks: [],
    socialMediaLinks: { instagram: '', twitter: '', snapchat: '', tiktok: '', facebook: '' },
    whatsappNumber: '',
    backgroundMusicUrl: '',
    backgroundMusicName: '',
    introText: '',
    logoUrl: '',
    cvUrl: '',
    headerLinks: { drhope: 'دكتور هوب', reviews: 'آراء المشتركات', profile: 'ملفي الشخصي' },
    accountHolderName: '',
    bankName: '',
    ibanNumber: '',
    accountNumber: '',
    swiftCode: '',
    companyAddress: '',
    companyPhone: '',
    taxRegistrationNumber: '',
    liveWorkshopRefundPolicy: '',
    recordedWorkshopTerms: '',
    paymentSettings: {
        cardPaymentsEnabled: true,
        bankTransfersEnabled: true,
    },
    themes: [
        {
            id: 'theme-classic-violet-pink',
            name: 'السمة الأصلية (موف غامق)',
            colors: {
                background: { from: '#2e1065', to: '#4a044e', balance: 60 },
                button: { from: '#7c3aed', to: '#db2777', balance: 50 },
                card: { from: 'rgba(46, 16, 101, 0.6)', to: 'rgba(88, 28, 135, 0.4)', balance: 50 },
                text: { primary: '#e2e8f0', accent: '#e879f9', secondary_accent: '#fcd34d' },
                glow: { color: '#d946ef', intensity: 60 },
            }
        },
    ],
    activeThemeId: 'theme-classic-violet-pink',
    consultationSettings: {
        defaultDurationMinutes: 50,
        defaultFee: 450,
        consultationsEnabled: true,
    },
    payItForwardStats: {
        totalFund: 0,
        beneficiariesCount: 0
    }
};

const initialProducts: Product[] = [];

const initialPartners: Partner[] = [];

interface RegistrationAvailability {
    emailUser?: User;
    phoneUser?: User;
}

interface UserContextType {
    currentUser: User | null;
    users: User[];
    workshops: Workshop[];
    paginationMeta: PaginationMeta | null;
    fetchWorkshops: (options?: { page?: number; type?: string; search?: string }) => Promise<void>;
    fetchWorkshopDetails: (id: number) => Promise<Workshop | null>;
    earliestWorkshop: EarliestWorkshopData | null;
    fetchEarliestWorkshop: () => Promise<void>;
    products: Product[];
    partners: Partner[];
    countries: Country[];
    drhopeData: DrhopeData;
    activeTheme: ThemeColors;
    notifications: Notification[];
    globalCertificateTemplate: any | null;
    consultationRequests: ConsultationRequest[];
    pendingGifts: PendingGift[];
    expenses: Expense[];
    broadcastHistory: BroadcastCampaign[];
    countriesDebugInfo?: string;

    // Auth & User Actions
    login: (email: string, phone: string) => Promise<{ user?: User; error?: string }>;
    adminLogin: (userData: any) => void;
    logout: () => void;
    register: (fullName: string, email: string, phone: string, countryId: number) => Promise<{ user?: User; error?: string }>;
    checkRegistrationAvailability: (email: string, phone: string) => RegistrationAvailability;
    findUserByCredential: (type: 'email' | 'phone', value: string) => User | null;
    addUser: (fullName: string, email: string, phone: string) => User;
    updateUser: (userId: number, updates: Partial<User>) => void;
    deleteUser: (userId: number) => void;
    restoreUser: (userId: number) => void;
    permanentlyDeleteUser: (userId: number) => void;
    convertToInternalCredit: (userId: number, amount: number, description: string) => void;

    // Workshop Actions
    addWorkshop: (workshop: Omit<Workshop, 'id'>) => void;
    updateWorkshop: (workshop: Workshop) => void;
    deleteWorkshop: (id: number) => void;
    restoreWorkshop: (id: number) => void;
    permanentlyDeleteWorkshop: (id: number) => void;

    // Subscription Actions
    addSubscription: (userId: number, subscriptionData: Partial<Subscription>, isApproved: boolean, sendWhatsApp: boolean, creditToApply?: number) => void;
    updateSubscription: (userId: number, subscriptionId: string, updates: Partial<Subscription>) => void;
    deleteSubscription: (userId: number, subscriptionId: string) => void;
    restoreSubscription: (userId: number, subscriptionId: string) => void;
    permanentlyDeleteSubscription: (userId: number, subscriptionId: string) => void;
    transferSubscription: (userId: number, subscriptionId: string, toWorkshopId: number, notes?: string) => void;
    reactivateSubscription: (userId: number, subscriptionId: string) => void;

    // Store Actions
    placeOrder: (userId: number, order: Omit<Order, 'id' | 'userId' | 'status' | 'orderDate'>, initialStatus?: OrderStatus) => Order;
    confirmOrder: (userId: number, orderId: string) => void;

    // Review Actions
    addReview: (workshopId: number, review: { fullName: string; rating: number; comment: string }) => void;
    deleteReview: (workshopId: number, reviewId: string) => void;
    restoreReview: (workshopId: number, reviewId: string) => void;
    permanentlyDeleteReview: (workshopId: number, reviewId: string) => void;

    // Consultation Actions
    addConsultationRequest: (userId: number, subject: string) => Promise<{ success: boolean; message?: string }>;
    updateConsultationRequest: (requestId: string, updates: Partial<ConsultationRequest>) => void;

    // Gifting & Features
    addPendingGift: (giftData: Omit<PendingGift, 'id' | 'createdAt'>) => PendingGift;
    checkAndClaimPendingGifts: (user: User) => number;
    donateToPayItForward: (workshopId: number, amount: number, seats?: number, donorUserId?: number) => void;
    grantPayItForwardSeat: (userId: number, workshopId: number, amount: number, donorSubscriptionId: string, notes?: string) => void;
    updatePendingGift: (id: string, updates: Partial<PendingGift>) => void;
    deletePendingGift: (id: string) => void;
    restorePendingGift: (id: string) => void;
    permanentlyDeletePendingGift: (id: string) => void;
    adminManualClaimGift: (id: string, recipientData: { name: string, email: string, phone: string }) => { success: boolean; message: string };
    fetchProfile: () => Promise<any | null>;
    payForConsultation: (consultationId: number) => Promise<{ success: boolean; invoiceUrl?: string; message?: string }>;

    // General & Content
    markNotificationAsRead: (notificationId: string | number) => Promise<boolean>;
    deleteNotification: (notificationId: string | number) => Promise<boolean>;
    addNotificationForMultipleUsers: (userIds: number[], message: string) => void;
    updateDrhopeData: (data: Partial<DrhopeData>) => void;
    addPartner: (partner: Omit<Partner, 'id'>) => void;
    updatePartner: (partner: Partner) => void;
    deletePartner: (id: string) => void;
    addBroadcastToHistory: (campaign: Omit<BroadcastCampaign, 'id' | 'timestamp'>) => BroadcastCampaign;
    fetchDrHopeContent: () => Promise<void>;

    // Expenses
    addExpense: (expense: Omit<Expense, 'id'>) => void;
    updateExpense: (expense: Expense) => void;
    deleteExpense: (id: string) => void;
    restoreExpense: (id: string) => void;
    permanentlyDeleteExpense: (id: string) => void;

    // Products
    addProduct: (product: Omit<Product, 'id'>) => void;
    updateProduct: (product: Product) => void;
    deleteProduct: (id: number) => void;
    restoreProduct: (id: number) => void;
    permanentlyDeleteProduct: (id: number) => void;

    // Credit Transactions
    deleteCreditTransaction: (userId: number, transactionId: string) => void;
    restoreCreditTransaction: (userId: number, transactionId: string) => void;
    permanentlyDeleteCreditTransaction: (userId: number, transactionId: string) => void;

    // Cart Actions (Server-Side)
    cart: Cart | null;
    fetchCart: () => Promise<void>;
    addToCart: (productId: number, quantity?: number) => Promise<boolean>;
    updateCartItem: (cartItemId: number, quantity: number) => Promise<boolean>;
    removeFromCart: (cartItemId: number) => Promise<boolean>;
    fetchOrderSummary: () => Promise<OrderSummaryResponse | null>;
    createOrder: (paymentMethod: 'online' | 'bank_transfer') => Promise<CreateOrderResponse>;

    // New Subscription Actions
    createSubscription: (input: SubscriptionCreateInput) => Promise<SubscriptionCreateResponse | null>;
    processSubscriptionPayment: (input: PaymentProcessInput) => Promise<PaymentProcessResponse | null>;

    // Charity Actions
    buyCharitySeats: (input: CharityCreateInput) => Promise<CharityCreateResponse | null>;
    processCharityPayment: (input: CharityProcessInput) => Promise<PaymentProcessResponse | null>;
}



const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(() => {
        try {
            const stored = localStorage.getItem('currentUser');
            return stored ? JSON.parse(stored) : null;
        } catch (e) {

            localStorage.removeItem('currentUser'); // Clear corrupted data
            return null;
        }
    });
    const [users, setUsers] = useState<User[]>(initialUsers);
    const [workshops, setWorkshops] = useState<Workshop[]>(initialWorkshops);
    const [earliestWorkshop, setEarliestWorkshop] = useState<EarliestWorkshopData | null>(null);
    const [paginationMeta, setPaginationMeta] = useState<PaginationMeta | null>(null);
    const [products, setProducts] = useState<Product[]>(initialProducts);
    const [partners, setPartners] = useState<Partner[]>(initialPartners);
    const [pendingGifts, setPendingGifts] = useState<PendingGift[]>([]);
    const [drhopeData, setDrhopeData] = useState<DrhopeData>(initialDrhopeData);
    const [consultationRequests, setConsultationRequests] = useState<ConsultationRequest[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [broadcastHistory, setBroadcastHistory] = useState<BroadcastCampaign[]>([]);

    // Server-Side Cart State
    const [cart, setCart] = useState<Cart | null>(null);

    useEffect(() => { localStorage.setItem('currentUser', JSON.stringify(currentUser)); }, [currentUser]);
    // Removed localStorage caching for other data types as requested

    const [countries, setCountries] = useState<Country[]>([]);
    const [countriesDebugInfo, setCountriesDebugInfo] = useState<string>('');

    // Moved useEffects to bottom to fix hosting issues

    const fetchWorkshops = async (options?: { page?: number; type?: string; search?: string }) => {
        try {
            const queryParams = new URLSearchParams();
            queryParams.append('per_page', '10');
            if (options?.page) queryParams.append('page', options.page.toString());
            if (options?.type) queryParams.append('type', options.type);
            if (options?.search) queryParams.append('search', options.search);

            const url = `${API_BASE_URL}${API_ENDPOINTS.GENERAL.WORKSHOPS}?${queryParams.toString()}`;
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP Error ${response.status}`);

            const data = await response.json();
            if (data.key === 'success' && data.data) {
                const { live_workshops = [], recorded_workshops = [] } = data.data;

                // Helper to map API workshop to our Workshop type
                const mapWorkshop = (w: any, isRecorded: boolean): Workshop => {
                    const { startDate, endDate } = parseArabicDateRange(w.date_range);
                    return {
                        id: w.id,
                        title: w.title,
                        instructor: w.teacher || '',
                        teacher: w.teacher,
                        startDate: startDate || w.start_time || '', // Use parsed date or fallback
                        startTime: w.start_time || '',
                        start_time: w.start_time,
                        endTime: w.end_time || '',
                        end_time: w.end_time,
                        date_range: w.date_range,
                        endDate: endDate,
                        location: w.type_label === 'أونلاين و حضوري' ? 'أونلاين وحضوري' :
                            (w.type_label === 'أونلاين' ? 'أونلاين' :
                                (w.type_label === 'حضوري' ? 'حضوري' :
                                    (isRecorded ? 'مسجلة' : 'أونلاين'))),
                        type_label: w.type_label,
                        country: 'المملكة العربية السعودية', // Defaults as API only sends address for Riyadh/Saudi items currently
                        city: w.address || '',
                        address: w.address,
                        isRecorded: isRecorded,
                        zoomLink: '',
                        isVisible: true,
                        has_multiple_packages: w.has_multiple_packages,
                        price: w.price || 0,
                        packages: [],
                        reviews: [],
                        certificatesIssued: true,
                    };
                };

                const mappedLive = live_workshops.map((w: any) => mapWorkshop(w, false));
                const mappedRecorded = recorded_workshops.map((w: any) => mapWorkshop(w, true));

                setWorkshops([...mappedLive, ...mappedRecorded]);
                // Robust pagination extraction
                const pagination = data.data.pagination || data.pagination;
                if (pagination) {
                    setPaginationMeta(pagination);
                }
            }
        } catch (error) {

        }
    };

    const fetchWorkshopDetails = async (id: number): Promise<Workshop | null> => {
        try {
            const url = `${API_BASE_URL}${API_ENDPOINTS.GENERAL.WORKSHOPS}/${id}`;
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP Error ${response.status}`);

            const data = await response.json();
            if (data.key === 'success' && data.data) {
                const w = data.data;
                const existing = workshops.find(wk => wk.id === id);

                // Map packages from details
                const packages: Package[] = w.packages?.map((p: any) => ({
                    id: p.id,
                    name: p.title,
                    price: p.price,
                    discountPrice: p.is_offer ? p.offer_price : undefined,
                    features: p.features, // Can be string (HTML) or array
                    isActive: p.is_active,
                    attendanceType: existing?.location === 'حضوري' ? 'حضوري' : 'أونلاين', // Infer or default
                    availability: p.offer_expiry_date ? { endDate: p.offer_expiry_date } : undefined
                })) || existing?.packages || [];

                const details: Workshop = {
                    ...(existing || {}), // Start with existing data if available
                    id: w.id, // Ensure ID matches
                    title: w.title || existing?.title || '',
                    description: w.description,
                    subject_of_discussion: w.subject_of_discussion,
                    workshop_returning_policy: w.workshop_returning_policy,
                    date_range: w.date_range,
                    packages: packages,
                    // Ensure required fields are present if 'existing' was null
                    instructor: existing?.instructor || w.teacher || '',
                    startDate: existing?.startDate || '',
                    startTime: existing?.startTime || '',
                    location: existing?.location || 'أونلاين',
                    country: existing?.country || '',
                    isRecorded: w.type_label === 'مسجلة' || existing?.isRecorded || false,
                    price: w.price || packages[0]?.discountPrice || packages[0]?.price || existing?.price || 0,
                    zoomLink: existing?.zoomLink || '',
                    isVisible: true,
                } as Workshop;

                return details;
            }
            return null;
        } catch (error) {

            return null;
        }
    };

    const fetchEarliestWorkshop = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            const headers: HeadersInit = {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.GENERAL.EARLIEST_WORKSHOP}`, { headers });
            if (!response.ok) {

                return;
            }

            const data: EarliestWorkshopResponse = await response.json();


            if (data.key === 'success' && data.data) {
                const w = data.data as any;


                // Normalize data to avoid static fallbacks in UI
                const normalized: EarliestWorkshopData = {
                    id: w.id,
                    title: w.title,
                    type: w.type || 'online',
                    online_link: w.online_link || w.zoomLink || null,
                    start_date: w.start_date || w.startDate || w.date || "",
                    start_time: w.start_time || w.startTime || w.time || "00:00",
                    is_subscribed: w.is_subscribed ?? w.isSubscribed ?? false,
                    requires_authentication: w.requires_authentication ?? w.requiresAuthentication ?? false,
                    instructor: w.instructor || w.teacher || w.teacher_name || "",
                };


                setEarliestWorkshop(normalized);
            }
        } catch (error) {

        }
    };

    const fetchDrHopeContent = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            const headers: HeadersInit = {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            // Helper for fetching
            const fetchData = async (endpoint: string) => {
                const res = await fetch(`${API_BASE_URL}${endpoint}`, { headers });
                if (!res.ok) throw new Error(`HTTP ${res.status} for ${endpoint}`);
                return res.json();
            };

            // 1. Fetch Products (Boutique)
            try {
                const productData = await fetchData(API_ENDPOINTS.DRHOPE.PRODUCTS);

                if (productData.key === 'success' && Array.isArray(productData.data)) {
                    const mappedProducts: Product[] = productData.data.map((p: any) => ({
                        id: p.id,
                        name: p.title,
                        price: Number(p.price),
                        imageUrl: p.image, // Map 'image' to 'imageUrl'
                        description: p.description
                    }));
                    setProducts(mappedProducts);

                } else {

                }
            } catch (e) {

            }

            // 2. Fetch Partners
            try {
                const partnerData = await fetchData(API_ENDPOINTS.DRHOPE.PARTNERS);
                if (partnerData.key === 'success' && Array.isArray(partnerData.data)) {
                    const mappedPartners: Partner[] = partnerData.data.map((p: any) => ({
                        id: p.id,
                        name: p.title || p.name, // Map 'title' (from API) to 'name'
                        logo: p.image || p.logo, // Map 'image' (from API) to 'logo'
                        description: p.description,
                        websiteUrl: p.website_url,
                        instagramUrl: p.instagram_url,
                        twitterUrl: p.twitter_url
                    }));
                    setPartners(mappedPartners);
                }
            } catch (e) { }

            // 3. Fetch Dr Hope Specifics (Videos, Gallery, Insta, Reviews)
            const results = await Promise.allSettled([
                fetchData(API_ENDPOINTS.DRHOPE.VIDEOS),
                fetchData(API_ENDPOINTS.DRHOPE.GALLERY),
                fetchData(API_ENDPOINTS.DRHOPE.INSTAGRAM_LIVES),
                fetchData(API_ENDPOINTS.DRHOPE.REVIEWS)
            ]);

            setDrhopeData(prev => {
                let newData = { ...prev };

                const videosData = results[0];
                const galleryData = results[1];
                const instaData = results[2];

                // Videos
                if (videosData.status === 'fulfilled' && videosData.value.key === 'success') {
                    newData.videos = videosData.value.data.map((v: any) => ({
                        id: v.id,
                        title: v.title,
                        url: v.link || v.url // Prioritize 'link' as per API response
                    }));
                }

                // Photos (Gallery)
                if (galleryData.status === 'fulfilled' && galleryData.value.key === 'success') {
                    // Assuming gallery returns objects with 'image' property
                    // If it returns strings directly, adjust. Based on products, likely objects.
                    // Let's assume structure: [{id, image}, ...]
                    newData.photos = galleryData.value.data.map((item: any) => item.image || item.url || item);
                }

                // Instagram Lives
                if (instaData.status === 'fulfilled' && instaData.value.key === 'success') {
                    newData.instagramLinks = instaData.value.data.map((l: any) => ({
                        id: l.id,
                        title: l.title,
                        url: l.link || l.url // Prioritize 'link' as per API response
                    }));
                }

                // Reviews
                // Note: reviewsData is now the 4th element in the promise array (index 3)
                const reviewsData = results[3];
                if (reviewsData.status === 'fulfilled' && reviewsData.value.key === 'success') {
                    newData.reviews = reviewsData.value.data;
                }

                return newData;
            });

        } catch (error) {

        }
    };

    const fetchSettings = async () => {
        try {
            const url = `${API_BASE_URL}${API_ENDPOINTS.GENERAL.SETTINGS}`;

            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP Error ${response.status}`);

            const data = await response.json();
            if (data.key === 'success' && data.data) {
                const settings = data.data;


                setDrhopeData(prev => ({
                    ...prev,
                    introText: settings.welcome_message || prev.introText,
                    logoUrl: settings.logo || prev.logoUrl,
                    whatsappNumber: settings.whatsapp || prev.whatsappNumber,
                    socialMediaLinks: {
                        ...prev.socialMediaLinks,
                        facebook: settings.facebook || prev.socialMediaLinks.facebook,
                        instagram: settings.instagram || prev.socialMediaLinks.instagram,
                        twitter: settings.twitter || prev.socialMediaLinks.twitter,
                        snapchat: settings.snapchat || prev.socialMediaLinks.snapchat,
                        tiktok: settings.tiktok || prev.socialMediaLinks.tiktok,
                    }
                }));
            }
        } catch (error) {

        }
    };

    // Removed synchronizing effect that cleared currentUser on refresh

    // Fetch profile data when user logs in
    useEffect(() => {
        if (currentUser && currentUser.token) {

            fetchProfile();
        }
    }, [currentUser?.id]); // Only trigger when user ID changes (login/logout)

    // Fetch Cart when user logs in
    useEffect(() => {
        if (currentUser) {
            fetchCart();
        } else {
            setCart(null);
        }
    }, [currentUser?.id]);

    const fetchCart = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            if (!token) return;

            const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.CART.SUMMARY}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.key === 'success') {
                    setCart(data.data);
                }
            }
        } catch (error) {

        }
    };

    const addToCart = async (productId: number, quantity: number = 1) => {
        if (!currentUser) return false;
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.CART.ADD}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ product_id: productId, quantity })
            });

            const data = await response.json();
            if (response.ok && data.key === 'success') {
                setCart(data.data);
                return true;
            }
            return false;
        } catch (error) {

            return false;
        }
    };

    const updateCartItem = async (cartItemId: number, quantity: number) => {


        // Optimistic Update
        const previousCart = cart;
        if (cart) {

            setCart({
                ...cart,
                items: cart.items.map(item =>
                    item.id === cartItemId ? {
                        ...item,
                        quantity: quantity,
                        item_total: item.price * quantity
                    } : item
                )
            });
        }

        try {
            const token = localStorage.getItem('auth_token');
            const body = new URLSearchParams();
            body.append('items[0][cart_item_id]', cartItemId.toString());
            body.append('items[0][quantity]', quantity.toString());



            const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.CART.UPDATE}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': `Bearer ${token}`
                },
                body: body.toString()
            });



            if (response.ok) {

                fetchCart();
                return true;
            } else {

                if (previousCart) setCart(previousCart);
                return false;
            }
        } catch (error) {

            if (previousCart) setCart(previousCart);
            return false;
        }
    };

    const removeFromCart = async (cartItemId: number) => {


        // Optimistic Update
        const previousCart = cart;
        if (cart) {
            setCart({
                ...cart,
                items: cart.items.filter(item => item.id !== cartItemId)
            });
        }

        try {
            const token = localStorage.getItem('auth_token');
            const body = new URLSearchParams();
            body.append('cart_item_id', cartItemId.toString()); // Postman confirmed key



            const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.CART.REMOVE_ITEM}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': `Bearer ${token}`
                },
                body: body.toString()
            });



            if (response.ok) {
                fetchCart();
                return true;
            } else {

                if (previousCart) setCart(previousCart);
                return false;
            }
        } catch (error) {

            if (previousCart) setCart(previousCart);
            return false;
        }
    };

    const fetchOrderSummary = async (): Promise<OrderSummaryResponse | null> => {
        try {
            const token = localStorage.getItem('auth_token');
            if (!token) return null;

            const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ORDERS.SUMMARY}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                return data;
            }
            return null;
        } catch (error) {

            return null;
        }
    };

    const createOrder = async (paymentMethod: 'online' | 'bank_transfer'): Promise<CreateOrderResponse> => {
        try {
            const token = localStorage.getItem('auth_token');
            if (!token) throw new Error('No auth token');

            const formData = new FormData();
            formData.append('payment_type', paymentMethod);

            const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ORDERS.CREATE}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const data = await response.json();

            if (data.key === 'success' || data.status === 'success') {
                // Refresh cart state to ensure it's empty
                await fetchCart();
            }

            return data;
        } catch (error) {

            return {
                key: 'failure',
                msg: 'حدث خطأ غير متوقع أثناء إنشاء الطلب',
                data: []
            };
        }
    };





    const notifications = useMemo(() => currentUser?.notifications || [], [currentUser]);

    const activeTheme = useMemo(() => {
        const themes = drhopeData.themes || [];
        const activeId = drhopeData.activeThemeId;
        const defaultTheme: ThemeColors = {
            background: { from: '#2e1065', to: '#4a044e', balance: 60 },
            button: { from: '#7c3aed', to: '#db2777', balance: 50 },
            card: { from: 'rgba(46, 16, 101, 0.6)', to: 'rgba(88, 28, 135, 0.4)', balance: 50 },
            text: { primary: '#e2e8f0', accent: '#e879f9' },
            glow: { color: '#d946ef', intensity: 50 },
        };
        const foundTheme = themes.find(t => t.id === activeId);
        return foundTheme ? foundTheme.colors : defaultTheme;
    }, [drhopeData.themes, drhopeData.activeThemeId]);

    // --- User Actions ---
    const addUser = (fullName: string, email: string, phone: string): User => {
        const newUser: User = {
            id: Date.now(),
            fullName,
            email,
            phone,
            subscriptions: [],
            orders: [],
            notifications: [],
            creditTransactions: []
        };
        setUsers(prev => [...prev, newUser]);
        return newUser;
    };

    const updateUser = (userId: number, updates: Partial<User>) => setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updates } : u));
    const deleteUser = (userId: number) => updateUser(userId, { isDeleted: true });
    const restoreUser = (userId: number) => updateUser(userId, { isDeleted: false });
    const permanentlyDeleteUser = (userId: number) => setUsers(prev => prev.filter(u => u.id !== userId));
    const convertToInternalCredit = (userId: number, amount: number, description: string) => {
        setUsers(prev => prev.map(user => {
            if (user.id !== userId) return user;
            const newTransaction: CreditTransaction = {
                id: `tx-${Date.now()}`,
                date: new Date().toISOString(),
                type: 'addition',
                amount: amount,
                description: description,
            };
            return {
                ...user,
                internalCredit: (user.internalCredit || 0) + amount,
                creditTransactions: [...(user.creditTransactions || []), newTransaction]
            };
        }));
    };

    // --- Workshop Actions ---
    const addWorkshop = (workshop: Omit<Workshop, 'id'>) => {
        const newWorkshop: Workshop = { ...workshop, id: Date.now() };
        setWorkshops(prev => [...prev, newWorkshop]);
    };
    const updateWorkshop = (workshop: Workshop) => setWorkshops(prev => prev.map(w => w.id === workshop.id ? workshop : w));
    const deleteWorkshop = (id: number) => setWorkshops(prev => prev.map(w => w.id === id ? { ...w, isDeleted: true } : w));
    const restoreWorkshop = (id: number) => setWorkshops(prev => prev.map(w => w.id === id ? { ...w, isDeleted: false } : w));
    const permanentlyDeleteWorkshop = (id: number) => setWorkshops(prev => prev.filter(w => w.id !== id));

    // --- Subscription Actions ---
    const addSubscription = (userId: number, subData: Partial<Subscription>, isApproved: boolean, sendWhatsApp: boolean, creditToApply = 0) => {
        const workshop = workshops.find(w => w.id === subData.workshopId);
        if (!workshop) return;
        const activationDate = new Date();
        let expiryDate = new Date();
        expiryDate.setFullYear(2099);

        const newSubscription: Subscription = {
            id: `sub-${Date.now()}`,
            workshopId: subData.workshopId as number,
            status: SubscriptionStatus.ACTIVE,
            isApproved,
            activationDate: activationDate.toISOString().split('T')[0],
            expiryDate: expiryDate.toISOString().split('T')[0],
            creditApplied: creditToApply > 0 ? creditToApply : undefined,
            ...subData,
        };

        setUsers(prev => prev.map(user => {
            if (user.id === userId) {
                const updatedCredit = (user.internalCredit || 0) - creditToApply;
                const creditTransactions = [...(user.creditTransactions || [])];
                if (creditToApply > 0) {
                    const newTransaction: CreditTransaction = {
                        id: `tx-${Date.now()}`,
                        date: new Date().toISOString(),
                        type: 'subtraction',
                        amount: creditToApply,
                        description: `استخدام رصيد في ورشة: "${workshop.title}"`,
                    };
                    creditTransactions.push(newTransaction);
                }
                const updatedUser = {
                    ...user,
                    internalCredit: updatedCredit > 0 ? updatedCredit : 0,
                    subscriptions: [...user.subscriptions, newSubscription],
                    creditTransactions,
                };
                if (sendWhatsApp) {
                    const newNotification: Notification = {
                        id: `notif-${Date.now()}`,
                        message: `تم تأكيد اشتراكك في ورشة "${workshop.title}".`,
                        timestamp: new Date().toISOString(),
                        read: false,
                        workshopId: workshop.id,
                    };
                    if (newSubscription.isApproved) {
                        updatedUser.notifications = [newNotification, ...user.notifications];
                    }
                }
                return updatedUser;
            }
            return user;
        }));
    };

    const updateSubscription = (userId: number, subscriptionId: string, updates: Partial<Subscription>) => {
        setUsers(prev => prev.map(user => {
            if (user.id !== userId) return user;
            return {
                ...user,
                subscriptions: user.subscriptions.map(sub => sub.id === subscriptionId ? { ...sub, ...updates } : sub)
            };
        }));
    };

    const deleteSubscription = (userId: number, subscriptionId: string) => updateSubscription(userId, subscriptionId, { isDeleted: true });
    const restoreSubscription = (userId: number, subscriptionId: string) => updateSubscription(userId, subscriptionId, { isDeleted: false });
    const permanentlyDeleteSubscription = (userId: number, subscriptionId: string) => {
        setUsers(prev => prev.map(user => {
            if (user.id !== userId) return user;
            return {
                ...user,
                subscriptions: user.subscriptions.filter(sub => sub.id !== subscriptionId)
            };
        }));
    };

    const transferSubscription = (userId: number, subscriptionId: string, toWorkshopId: number, notes?: string) => {
        const user = users.find(u => u.id === userId);
        const sub = user?.subscriptions.find(s => s.id === subscriptionId);
        const toWorkshop = workshops.find(w => w.id === toWorkshopId);
        if (!user || !sub || !toWorkshop) return;

        // Mark old as TRANSFERRED
        updateSubscription(userId, subscriptionId, {
            status: SubscriptionStatus.TRANSFERRED,
            transferDate: new Date().toISOString(),
            notes: notes ? (sub.notes ? sub.notes + '\n' + notes : notes) : sub.notes
        });

        // Create new subscription
        const newSubData: Partial<Subscription> = {
            workshopId: toWorkshopId,
            packageId: undefined, // Reset package
            pricePaid: toWorkshop.price || 0, // Simplified: assumes paying full price of new workshop
            paymentMethod: sub.paymentMethod,
            transferrerName: sub.transferrerName,
            notes: `Transferred from workshop ${sub.workshopId}`,
        };
        addSubscription(userId, newSubData, true, false);
    };

    const reactivateSubscription = (userId: number, subscriptionId: string) => {
        updateSubscription(userId, subscriptionId, { status: SubscriptionStatus.ACTIVE, refundDate: undefined, refundMethod: undefined });
    };

    // --- Gift Actions ---
    const addPendingGift = (giftData: Omit<PendingGift, 'id' | 'createdAt'>) => {
        const newGift: PendingGift = { ...giftData, id: `gift-${Date.now()}`, createdAt: new Date().toISOString() };
        setPendingGifts(prev => [newGift, ...prev]);
        return newGift;
    };

    const checkAndClaimPendingGifts = (user: User) => {
        const userPhoneNormalized = normalizePhoneNumber(user.phone);
        const giftsToClaim = pendingGifts.filter(g =>
            !g.claimedByUserId &&
            !g.isDeleted &&
            normalizePhoneNumber(g.recipientWhatsapp) === userPhoneNormalized
        );

        if (giftsToClaim.length === 0) return 0;

        let claimedCount = 0;
        setPendingGifts(prev => prev.map(g => {
            if (normalizePhoneNumber(g.recipientWhatsapp) === userPhoneNormalized && !g.claimedByUserId && !g.isDeleted) {
                claimedCount++;
                return { ...g, claimedByUserId: user.id, claimedAt: new Date().toISOString() };
            }
            return g;
        }));

        giftsToClaim.forEach(gift => {
            addSubscription(
                user.id,
                {
                    workshopId: gift.workshopId,
                    packageId: gift.packageId,
                    attendanceType: gift.attendanceType,
                    paymentMethod: 'GIFT',
                    pricePaid: gift.pricePaid,
                    isGift: true,
                    gifterName: gift.gifterName,
                    gifterPhone: gift.gifterPhone,
                    gifterUserId: gift.gifterUserId,
                    giftMessage: gift.giftMessage,
                },
                true, true
            );
        });

        return claimedCount;
    };

    const donateToPayItForward = (workshopId: number, amount: number, seats: number = 0, donorUserId?: number) => {
        setWorkshops(prev => prev.map(w =>
            w.id === workshopId
                ? { ...w, payItForwardBalance: (w.payItForwardBalance || 0) + amount }
                : w
        ));

        if (donorUserId) {
            addSubscription(donorUserId, {
                workshopId: workshopId,
                paymentMethod: 'GIFT',
                pricePaid: amount,
                donationRemaining: amount,
                isPayItForwardDonation: true,
                notes: `دعم لغير القادرين (${seats} مقاعد).`,
                isApproved: true,
                status: SubscriptionStatus.COMPLETED
            } as any, true, true);
        }
    };

    const grantPayItForwardSeat = (userId: number, workshopId: number, amount: number, donorSubscriptionId: string, notes?: string) => {
        const donorUser = users.find(u => u.subscriptions.some(s => s.id === donorSubscriptionId));
        if (!donorUser) return;
        const donorSub = donorUser.subscriptions.find(s => s.id === donorSubscriptionId);
        if (!donorSub) return;

        // Deduct from donor
        updateSubscription(donorUser.id, donorSubscriptionId, {
            donationRemaining: (donorSub.donationRemaining || 0) - amount
        });

        // Grant to recipient
        addSubscription(userId, {
            workshopId,
            paymentMethod: 'GIFT',
            pricePaid: 0, // Free for recipient
            isGift: true,
            gifterName: donorUser.fullName,
            notes: notes
        }, true, true);
    };

    const updatePendingGift = (id: string, updates: Partial<PendingGift>) => setPendingGifts(prev => prev.map(g => g.id === id ? { ...g, ...updates } : g));
    const deletePendingGift = (id: string) => updatePendingGift(id, { isDeleted: true });
    const restorePendingGift = (id: string) => updatePendingGift(id, { isDeleted: false });
    const permanentlyDeletePendingGift = (id: string) => setPendingGifts(prev => prev.filter(g => g.id !== id));

    const adminManualClaimGift = (id: string, recipientData: { name: string, email: string, phone: string }) => {
        const gift = pendingGifts.find(g => g.id === id);
        if (!gift) return { success: false, message: 'الهدية غير موجودة' };
        if (gift.claimedByUserId) return { success: false, message: 'الهدية مفعلة مسبقاً' };

        let user = findUserByCredential('phone', recipientData.phone) || findUserByCredential('email', recipientData.email);
        if (!user) {
            user = addUser(recipientData.name, recipientData.email, recipientData.phone);
        }

        updatePendingGift(id, {
            recipientName: recipientData.name,
            recipientWhatsapp: recipientData.phone,
            claimedByUserId: user.id,
            claimedAt: new Date().toISOString()
        });

        addSubscription(
            user.id,
            {
                workshopId: gift.workshopId,
                packageId: gift.packageId,
                attendanceType: gift.attendanceType,
                paymentMethod: 'GIFT',
                pricePaid: gift.pricePaid,
                isGift: true,
                gifterName: gift.gifterName,
                gifterPhone: gift.gifterPhone,
                gifterUserId: gift.gifterUserId,
                giftMessage: gift.giftMessage,
            },
            true, true
        );

        return { success: true, message: `تم تفعيل الهدية للمستخدم ${user.fullName} بنجاح` };
    };

    // --- Expense Actions ---
    const addExpense = (expense: Omit<Expense, 'id'>) => {
        const newExpense: Expense = { ...expense, id: `exp-${Date.now()}` };
        setExpenses(prev => [newExpense, ...prev]);
    };
    const updateExpense = (expense: Expense) => setExpenses(prev => prev.map(e => e.id === expense.id ? expense : e));
    const deleteExpense = (id: string) => setExpenses(prev => prev.map(e => e.id === id ? { ...e, isDeleted: true } : e));
    const restoreExpense = (id: string) => setExpenses(prev => prev.map(e => e.id === id ? { ...e, isDeleted: false } : e));
    const permanentlyDeleteExpense = (id: string) => setExpenses(prev => prev.filter(e => e.id !== id));

    // --- Product Actions ---
    const addProduct = (product: Omit<Product, 'id'>) => {
        const newProduct: Product = { ...product, id: Date.now() };
        setProducts(prev => [...prev, newProduct]);
    };
    const updateProduct = (product: Product) => setProducts(prev => prev.map(p => p.id === product.id ? product : p));
    const deleteProduct = (id: number) => setProducts(prev => prev.map(p => p.id === id ? { ...p, isDeleted: true } : p));
    const restoreProduct = (id: number) => setProducts(prev => prev.map(p => p.id === id ? { ...p, isDeleted: false } : p));
    const permanentlyDeleteProduct = (id: number) => setProducts(prev => prev.filter(p => p.id !== id));

    // --- Store Actions ---
    const placeOrder = (userId: number, orderData: any, initialStatus?: OrderStatus) => {
        const newOrder: Order = { ...orderData, id: `ord-${Date.now()}`, userId, status: initialStatus || OrderStatus.PENDING, orderDate: new Date().toISOString() };
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, orders: [...u.orders, newOrder] } : u));
        return newOrder;
    };
    const confirmOrder = (userId: number, orderId: string) => {
        setUsers(prev => prev.map(u => {
            if (u.id !== userId) return u;
            return {
                ...u,
                orders: u.orders.map(o => o.id === orderId ? { ...o, status: OrderStatus.COMPLETED } : o),
                notifications: [{ id: `notif-${Date.now()}`, message: `تم تأكيد طلبك رقم #${orderId.substring(0, 8)}`, timestamp: new Date().toISOString(), read: false }, ...u.notifications]
            };
        }));
    };

    // --- Reviews ---
    const addReview = (workshopId: number, reviewData: any) => setWorkshops(prev => prev.map(w => w.id === workshopId ? { ...w, reviews: [...(w.reviews || []), { ...reviewData, id: `rev-${Date.now()}`, workshopId, date: new Date().toISOString() }] } : w));
    const deleteReview = (workshopId: number, reviewId: string) => setWorkshops(prev => prev.map(w => w.id === workshopId ? { ...w, reviews: (w.reviews || []).map(r => r.id === reviewId ? { ...r, isDeleted: true } : r) } : w));
    const restoreReview = (workshopId: number, reviewId: string) => setWorkshops(prev => prev.map(w => w.id === workshopId ? { ...w, reviews: (w.reviews || []).map(r => r.id === reviewId ? { ...r, isDeleted: false } : r) } : w));
    const permanentlyDeleteReview = (workshopId: number, reviewId: string) => setWorkshops(prev => prev.map(w => w.id === workshopId ? { ...w, reviews: (w.reviews || []).filter(r => r.id !== reviewId) } : w));

    // --- Consultations ---
    const addConsultationRequest = async (userId: number, subject: string): Promise<{ success: boolean; message?: string }> => {
        try {
            const token = localStorage.getItem('auth_token');
            if (!token) return { success: false, message: 'يرجى تسجيل الدخول أولاً' };

            const formData = new FormData();
            formData.append('message', subject); // 'subject' from UI maps to 'message' in API

            const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.DRHOPE.SUPPORT}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const data = await response.json();

            if (response.ok && data.key === 'success') {
                // Optimistic update (optional, but keeps local history in sync if we use it)
                setConsultationRequests(prev => [{ id: `consult-${Date.now()}`, userId, subject, status: 'NEW', requestedAt: new Date().toISOString() }, ...prev]);
                return { success: true, message: data.msg || 'تم إرسال طلبك بنجاح' };
            } else {
                return { success: false, message: data.msg || 'فشل إرسال الطلب' };
            }
        } catch (error) {

            return { success: false, message: 'حدث خطأ في الاتصال بالخادم' };
        }
    };
    const updateConsultationRequest = (requestId: string, updates: Partial<ConsultationRequest>) => setConsultationRequests(prev => prev.map(r => r.id === requestId ? { ...r, ...updates } : r));

    // --- Broadcast ---
    const addBroadcastToHistory = (campaign: Omit<BroadcastCampaign, 'id' | 'timestamp'>) => {
        const newCampaign: BroadcastCampaign = { ...campaign, id: `bc-${Date.now()}`, timestamp: new Date().toISOString() };
        setBroadcastHistory(prev => [newCampaign, ...prev]);
        return newCampaign;
    };
    const addNotificationForMultipleUsers = (userIds: number[], message: string) => {
        setUsers(prev => prev.map(u => {
            if (userIds.includes(u.id)) {
                return {
                    ...u,
                    notifications: [{ id: `notif-bc-${Date.now()}`, message, timestamp: new Date().toISOString(), read: false }, ...u.notifications]
                };
            }
            return u;
        }));
    };

    // --- Content ---
    const updateDrhopeData = (data: Partial<DrhopeData>) => setDrhopeData(prev => ({ ...prev, ...data }));
    const addPartner = (partner: Omit<Partner, 'id'>) => setPartners(prev => [...prev, { ...partner, id: `p-${Date.now()}` }]);
    const updatePartner = (partner: Partner) => setPartners(prev => prev.map(p => p.id === partner.id ? partner : p));
    const deletePartner = (id: string) => setPartners(prev => prev.filter(p => p.id !== id));

    // --- Credit Transactions (Manage) ---
    const deleteCreditTransaction = (userId: number, transactionId: string) => {
        setUsers(prev => prev.map(u => {
            if (u.id !== userId) return u;
            const tx = u.creditTransactions?.find(t => t.id === transactionId);
            if (!tx || tx.isDeleted) return u;
            // Reverse impact
            const newBalance = (u.internalCredit || 0) + (tx.type === 'addition' ? -tx.amount : tx.amount);
            return {
                ...u,
                internalCredit: newBalance,
                creditTransactions: u.creditTransactions?.map(t => t.id === transactionId ? { ...t, isDeleted: true } : t)
            };
        }));
    };
    const restoreCreditTransaction = (userId: number, transactionId: string) => {
        setUsers(prev => prev.map(u => {
            if (u.id !== userId) return u;
            const tx = u.creditTransactions?.find(t => t.id === transactionId);
            if (!tx || !tx.isDeleted) return u;
            // Re-apply impact
            const newBalance = (u.internalCredit || 0) + (tx.type === 'addition' ? tx.amount : -tx.amount);
            return {
                ...u,
                internalCredit: newBalance,
                creditTransactions: u.creditTransactions?.map(t => t.id === transactionId ? { ...t, isDeleted: false } : t)
            };
        }));
    };
    const permanentlyDeleteCreditTransaction = (userId: number, transactionId: string) => {
        setUsers(prev => prev.map(u => {
            if (u.id !== userId) return u;
            return {
                ...u,
                creditTransactions: u.creditTransactions?.filter(t => t.id !== transactionId)
            };
        }));
    };

    // --- Helpers ---
    const login = async (email: string, phone: string) => {
        try {
            const formData = new FormData();
            formData.append('email', email);
            // Sanitize phone number
            let cleanPhone = phone.replace(/^\+/, '').trim();

            // Special handling for common repetition issues (e.g. user typed 2010... while 20 was selected)
            // Egypt Case: 202010... -> 2010...
            if (cleanPhone.startsWith('2020')) cleanPhone = cleanPhone.substring(2);
            // Egypt Case: 20010... -> 2010...
            if (cleanPhone.startsWith('200')) cleanPhone = '20' + cleanPhone.substring(3);

            // Generic check for other double codes if needed, but Egypt is the current reported issue.
            // Ensure no '+' remains
            cleanPhone = cleanPhone.replace('+', '');

            formData.append('phone', cleanPhone);

            const response = await fetch(`${API_BASE_URL}/api/login`, {
                method: 'POST',
                body: formData, // Sending FormData as per request
            });

            const data = await response.json();

            if (response.ok && data.key === 'success' && data.data) {
                const apiUser = data.data;
                const token = apiUser.token;

                // Map API user to our User type
                const user: User = {
                    id: apiUser.id,
                    fullName: apiUser.name,
                    email: apiUser.email,
                    phone: phone, // Phone from input as API response might not have it or formatted differently
                    token: token,
                    // Initialize empty arrays for app-specific local state
                    subscriptions: [],
                    orders: [],
                    notifications: [],
                    creditTransactions: [],
                    isDeleted: false
                };

                // Trust API user data completely
                // We still check if user exists in state to update them, but we overwrite with API data
                const existingUserIndex = users.findIndex(u => u.id === apiUser.id);

                // Store token
                localStorage.setItem('auth_token', token);

                setCurrentUser(user);

                if (existingUserIndex === -1) {
                    setUsers(prev => [...prev, user]);
                } else {
                    setUsers(prev => prev.map(u => u.id === user.id ? user : u));
                }

                trackEvent('login', { method: 'api' }, user);

                return { user: user };
            } else {
                // Handle API errors

                return { error: data.msg || 'فشل تسجيل الدخول' };
            }
        } catch (error) {

            return { error: 'حدث خطأ في الاتصال بالخادم' };
        }
    };

    const adminLogin = (userData: any) => {
        const { token, user } = userData;
        if (!token || !user) return;

        const newUser: User = {
            id: user.id,
            fullName: user.name,
            email: user.email,
            phone: user.phone || '', // Admin link payload might not have phone
            token: token,
            subscriptions: [],
            orders: [],
            notifications: [],
            creditTransactions: [],
            isDeleted: false
        };

        localStorage.setItem('auth_token', token);
        setCurrentUser(newUser);

        // Check if user exists in local state to update or add
        const existingUserIndex = users.findIndex(u => u.id === newUser.id);
        if (existingUserIndex === -1) {
            setUsers(prev => [...prev, newUser]);
        } else {
            setUsers(prev => prev.map(u => u.id === newUser.id ? newUser : u));
        }

        trackEvent('login', { method: 'admin_link' }, newUser);
    };

    const findUserByCredential = (type: 'email' | 'phone', value: string) => {
        const normalizedValue = type === 'phone' ? normalizePhoneNumber(value) : value.toLowerCase();
        return users.find(u => !u.isDeleted && (type === 'phone' ? normalizePhoneNumber(u.phone) === normalizedValue : u.email.toLowerCase() === normalizedValue)) || null;
    };

    const checkRegistrationAvailability = (email: string, phone: string) => {
        const lowercasedEmail = email.toLowerCase();
        const normalizedPhone = normalizePhoneNumber(phone);
        return {
            emailUser: users.find(u => u.email.toLowerCase() === lowercasedEmail && !u.isDeleted),
            phoneUser: users.find(u => normalizePhoneNumber(u.phone) === normalizedPhone && !u.isDeleted)
        };
    };

    const register = async (fullName: string, email: string, phone: string, countryId: number): Promise<{ user?: User; error?: string }> => {
        try {
            const formData = new FormData();
            formData.append('full_name', fullName);
            formData.append('email', email);
            formData.append('phone', phone);
            formData.append('country_id', countryId.toString());

            const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH.REGISTER}`, {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (response.ok && data.key === 'success' && data.data) {
                const apiUser = data.data;
                const token = apiUser.token;

                // Map API user to our User type
                const user: User = {
                    id: apiUser.id,
                    fullName: apiUser.name,
                    email: apiUser.email,
                    phone: phone,
                    token: token,
                    subscriptions: [],
                    orders: [],
                    notifications: [],
                    creditTransactions: [],
                    isDeleted: false
                };

                // Store token
                localStorage.setItem('auth_token', token);

                setCurrentUser(user);
                setUsers(prev => [...prev, user]);

                trackEvent('register', { method: 'api' }, user);
                return { user: user };
            } else {

                return { error: data.msg || 'فشل إنشاء الحساب' };
            }
        } catch (error) {

            return { error: 'حدث خطأ في الاتصال بالخادم' };
        }
    };

    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem('auth_token');



            if (!token || !currentUser) {

                return;
            }


            const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.PROFILE.DETAILS}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();


            if (response.ok && data.key === 'success' && data.data) {
                const profileData = data.data;


                // Extract workshops from API subscriptions and add to workshops state
                const apiWorkshops: Workshop[] = (profileData.active_subscriptions || [])
                    .map((sub: any) => {
                        if (!sub || !sub.workshop) {
                            // If workshop object is missing, try to find it in existing workshops
                            const workshopId = Number(sub?.workshop_id || sub?.workshop?.id);
                            const existing = workshops.find(w => Number(w.id) === workshopId);
                            if (existing) {
                                return { ...existing, zoomLink: sub.online_link || existing.zoomLink };
                            }
                            return null;
                        }

                        // Parse date_range if available
                        const { startDate, endDate } = parseArabicDateRange(sub.workshop.date_range);

                        return {
                            id: Number(sub.workshop.id),
                            title: sub.workshop.title,
                            instructor: sub.workshop.teacher || 'غير محدد',
                            startDate: startDate,
                            endDate: endDate,
                            startTime: sub.workshop.start_time || '09:00',
                            endTime: sub.workshop.end_time || '17:00',
                            location: sub.workshop.type_label === 'أونلاين' ? 'أونلاين' :
                                sub.workshop.type_label === 'حضوري' ? 'حضوري' :
                                    sub.workshop.type_label === 'مسجلة' ? 'مسجلة' : 'أونلاين وحضوري',
                            isRecorded: sub.workshop.type_label === 'مسجلة',
                            zoomLink: sub.online_link || undefined,
                            city: sub.workshop.address || undefined,
                            notes: sub.files?.map((f: any) => ({ type: 'file' as const, name: f.title, value: f.file })) || [],
                            recordings: sub.recordings?.filter((r: any) => r.is_available).map((r: any) => ({
                                name: r.title,
                                url: r.link,
                                accessStartDate: undefined,
                                accessEndDate: undefined
                            })) || [],
                            mediaFiles: sub.attachments?.map((a: any) => ({
                                type: a.type as 'audio' | 'video',
                                name: a.title,
                                value: a.file
                            })) || [],
                            certificatesIssued: sub.can_install_certificate || false,
                            isVisible: true,
                            isDeleted: false,
                            topics: [],
                            reviews: []
                        };
                    })
                    .filter(Boolean) as Workshop[];



                // Add API workshops to workshops state (merge, don't duplicate)
                setWorkshops(prev => {
                    const merged = [...prev];
                    apiWorkshops.forEach(apiWs => {
                        if (!merged.find(w => w.id === apiWs.id)) {
                            merged.push(apiWs);
                        }
                    });
                    return merged;
                });

                // Map API subscriptions to our Subscription type
                const subscriptions: Subscription[] = (profileData.active_subscriptions || [])
                    .filter((sub: any) => sub && sub.workshop) // Filter out incomplete subscriptions
                    .map((sub: any) => ({
                        id: `sub-${sub.id}`,
                        workshopId: sub.workshop.id,
                        activationDate: new Date().toISOString(),
                        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
                        status: SubscriptionStatus.ACTIVE,
                        isApproved: true,
                        paymentMethod: 'LINK' as const,
                    }));



                // Extract and map consultations from support_messages
                const consultations: ConsultationRequest[] = (profileData.support_messages || []).map((msg: any) => ({
                    id: msg.id,
                    userId: currentUser.id, // Ensure userId is set for filtering in ProfilePage
                    message: msg.message,
                    status: msg.status,
                    price: msg.price,
                    date: msg.date,
                    time: msg.time,
                    duration_minutes: msg.duration_minutes,
                    created_at: msg.created_at,
                    // Map to legacy fields for backward compatibility
                    subject: msg.message,
                    requestedAt: msg.created_at,
                    consultationDate: msg.date !== 'غير محدد' ? msg.date : undefined,
                    consultationTime: msg.time !== 'غير محدد' ? msg.time : undefined,
                    durationMinutes: typeof msg.duration_minutes === 'number' ? msg.duration_minutes : undefined,
                    fee: typeof msg.price === 'number' ? msg.price : undefined,
                }));



                // Update consultation requests state
                setConsultationRequests(consultations);

                // Update current user with fetched subscriptions
                setCurrentUser(prev => {

                    return prev ? {
                        ...prev,
                        subscriptions: subscriptions
                    } : null;
                });



                // Fetch notifications after profile is loaded
                fetchNotifications();

                return profileData;
            } else {

                return null;
            }
        } catch (error) {

            return null;
        }
    };

    const fetchNotifications = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            if (!token || !currentUser) return;

            const response = await fetch(`${API_BASE_URL}/api/notifications`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {

                return;
            }

            const result = await response.json();

            if (result.key === 'success' && result.data && Array.isArray(result.data) && result.data[0]) {
                const apiNotifications = result.data[0];

                // Map API notifications to our Notification type
                const mappedNotifications: Notification[] = apiNotifications.map((notif: any) => ({
                    id: notif.id,
                    title: notif.title,
                    body: notif.body,
                    message: notif.title || notif.body || '', // Fallback for display
                    timestamp: new Date().toISOString(), // API doesn't provide timestamp
                    read: false
                }));

                // Update current user's notifications
                setCurrentUser(prev => {
                    if (!prev) return null;
                    return {
                        ...prev,
                        notifications: mappedNotifications
                    };
                });
            }
        } catch (error) {

        }
    };

    const markNotificationAsRead = async (notificationId: string | number): Promise<boolean> => {
        try {
            const token = localStorage.getItem('auth_token');
            if (!token || !currentUser) return false;

            const url = `${API_BASE_URL}${API_ENDPOINTS.NOTIFICATIONS.MARK_AS_READ(notificationId)}`;


            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {

                return false;
            }

            const result = await response.json();

            if (result.key === 'success') {
                // Update local state to mark notification as read
                setCurrentUser(prev => {
                    if (!prev) return null;
                    return {
                        ...prev,
                        notifications: prev.notifications?.map(n =>
                            String(n.id) === String(notificationId) ? { ...n, read: true } : n
                        ) || []
                    };
                });
                return true;
            }

            return false;
        } catch (error) {

            return false;
        }
    };

    const deleteNotification = async (notificationId: string | number): Promise<boolean> => {
        try {
            const token = localStorage.getItem('auth_token');
            if (!token || !currentUser) return false;

            // Optimistic update: Remove from UI immediately
            setCurrentUser(prev => {
                if (!prev) return null;
                return {
                    ...prev,
                    notifications: prev.notifications?.filter(n =>
                        String(n.id) !== String(notificationId)
                    ) || []
                };
            });

            // Use 'mark as read' API since it effectively removes the notification from view
            // as confirmed by user ("when marked as read, it doesn't show here")
            const url = `${API_BASE_URL}${API_ENDPOINTS.NOTIFICATIONS.MARK_AS_READ(notificationId)}`;


            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {

                // If API fails, revert the change
                await fetchProfile();
                return false;
            }

            return true;
        } catch (error) {

            await fetchProfile();
            return false;
        }
    };


    const payForConsultation = async (consultationId: number): Promise<{ success: boolean; invoiceUrl?: string; message?: string }> => {
        try {
            const token = localStorage.getItem('auth_token');
            if (!token) return { success: false, message: 'يرجى تسجيل الدخول أولاً' };



            const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.PROFILE.PAY_CONSULTATION(consultationId)}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });

            const data = await response.json();


            if (response.ok && data.key === 'success' && data.data?.invoice_url) {
                return {
                    success: true,
                    invoiceUrl: data.data.invoice_url
                };
            }

            // Handle session expiration or throttle explicitly if possible
            if (response.status === 401) {
                return { success: false, message: 'انتهت الجلسة، يرجى إعادة تسجيل الدخول' };
            }

            return {
                success: false,
                message: data.msg || 'حدث خطأ أثناء معالجة الدفع'
            };
        } catch (error) {

            return {
                success: false,
                message: 'حدث خطأ في الاتصال بالخادم'
            };
        }
    };

    const logout = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            if (token) {
                await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH.LOGOUT}`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
            }
        } catch (error) {

        } finally {
            if (currentUser) trackEvent('logout', {}, currentUser);
            setCurrentUser(null);
            localStorage.removeItem('auth_token');
            // Remove currentUser from localStorage as well since we set it in useEffect
            localStorage.removeItem('currentUser');
        }
    };

    const createSubscription = async (input: SubscriptionCreateInput): Promise<SubscriptionCreateResponse | null> => {
        try {
            const token = localStorage.getItem('auth_token');
            if (!token) return null;

            const formData = new FormData();
            formData.append('package_id', input.package_id.toString());
            formData.append('subscription_type', input.subscription_type);

            if (input.recipient_name) {
                input.recipient_name.forEach((name, i) => formData.append(`recipient_name[${i}]`, name));
            }
            if (input.recipient_phone) {
                input.recipient_phone.forEach((phone, i) => formData.append(`recipient_phone[${i}]`, phone));
            }
            if (input.country_id) {
                input.country_id.forEach((id, i) => formData.append(`country_id[${i}]`, id.toString()));
            }

            const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.SUBSCRIPTIONS.CREATE}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            const data = await response.json();
            if (response.ok && data.key === 'success') {
                const rawData = data.data;
                // Normalize response: if it's 'myself', the API returns subscription_id directly.
                // We wrap it in a subscriptions array to maintain a consistent structure across the app.
                if (rawData.subscription_id && !rawData.subscriptions) {
                    return {
                        ...rawData,
                        subscriptions: [{
                            subscription_id: rawData.subscription_id,
                            subscription_details: rawData.subscription_details
                        }]
                    };
                }
                return rawData;
            }
            return null;
        } catch (error) {

            return null;
        }
    };

    const processSubscriptionPayment = async (input: PaymentProcessInput): Promise<PaymentProcessResponse | null> => {
        try {
            const token = localStorage.getItem('auth_token');
            if (!token) return null;

            const formData = new FormData();
            if (Array.isArray(input.subscription_id)) {
                input.subscription_id.forEach((id, i) => formData.append(`subscription_ids[${i}]`, id.toString()));
            } else {
                formData.append('subscription_id', input.subscription_id.toString());
            }
            formData.append('payment_type', input.payment_type);

            const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.SUBSCRIPTIONS.PROCESS}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            const data = await response.json();
            if (response.ok && data.key === 'success') {
                return data;
            }
            return data;
        } catch (error) {

            return null;
        }
    };

    const buyCharitySeats = async (input: CharityCreateInput): Promise<CharityCreateResponse | null> => {
        try {
            const token = localStorage.getItem('auth_token');
            if (!token) return null;

            const formData = new FormData();
            formData.append('package_id', input.package_id.toString());
            formData.append('number_of_seats', input.number_of_seats.toString());

            const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.SUBSCRIPTIONS.BUY_CHARITY}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            const data = await response.json();
            if (response.ok && data.key === 'success') {
                return data.data;
            }
            return null;
        } catch (error) {

            return null;
        }
    };

    const processCharityPayment = async (input: CharityProcessInput): Promise<PaymentProcessResponse | null> => {
        try {
            const token = localStorage.getItem('auth_token');
            if (!token) return null;

            const formData = new FormData();
            formData.append('charity_id', input.charity_id.toString());
            formData.append('payment_type', input.payment_type);

            const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.SUBSCRIPTIONS.PROCESS_CHARITY}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            const data = await response.json();
            if (response.ok && data.key === 'success') {
                return data;
            }
            return data;
        } catch (error) {

            return null;
        }
    };

    // Initial Data Fetching
    useEffect(() => {
        const fetchCountries = async () => {
            try {
                const url = `${API_BASE_URL}${API_ENDPOINTS.GENERAL.COUNTRIES}`;


                const response = await axios.get(url);
                const data = response.data;


                if (data.key === 'success' && Array.isArray(data.data)) {
                    setCountries(data.data);
                    setCountriesDebugInfo(`Success (${data.data.length})`);

                } else {
                    setCountriesDebugInfo(`Invalid Data Key: ${data.key}`);

                }
            } catch (error: any) {
                setCountriesDebugInfo(`Fetch Error: ${error.message}`);

            }
        };
        fetchCountries();
        fetchSettings();
        fetchWorkshops(); // Fetch workshops from API
        fetchDrHopeContent();
    }, []);

    // Re-fetch earliest workshop when auth state might have changed
    useEffect(() => {
        fetchEarliestWorkshop();
    }, [currentUser]);

    // Session Security: Monitor active session
    useEffect(() => {
        const checkSession = async () => {
            const token = localStorage.getItem('auth_token');
            if (!token || !currentUser) return;

            try {
                // Verify token validity by calling a lightweight protected endpoint (e.g., profile or notifications)
                const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.PROFILE.DETAILS}`, {
                    headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
                });

                if (response.status === 401) {

                    await logout();
                    // Optionally force reload to clear all states cleanly
                    window.location.href = '/';
                }
            } catch (error) {

            }
        };

        // Check on mount, then every 60 seconds, and on window focus
        checkSession();
        const interval = setInterval(checkSession, 60000);

        const handleFocus = () => checkSession();
        window.addEventListener('focus', handleFocus);

        return () => {
            clearInterval(interval);
            window.removeEventListener('focus', handleFocus);
        };
    }, [currentUser, logout]); // Dependencies ensure it runs when user logs in

    const value: UserContextType = useMemo(() => ({
        currentUser, users, workshops, products, partners, drhopeData, activeTheme, notifications, consultationRequests, globalCertificateTemplate: null, pendingGifts, expenses,
        broadcastHistory,
        countries,
        countriesDebugInfo,

        // Auth & User Actions
        login, logout, register, fetchProfile, payForConsultation, adminLogin,
        addUser, updateUser, deleteUser, restoreUser, permanentlyDeleteUser, convertToInternalCredit,
        findUserByCredential, checkRegistrationAvailability,

        addWorkshop, updateWorkshop, deleteWorkshop, restoreWorkshop, permanentlyDeleteWorkshop, fetchWorkshops, fetchWorkshopDetails, earliestWorkshop, fetchEarliestWorkshop, paginationMeta,

        addSubscription, updateSubscription, deleteSubscription, restoreSubscription, permanentlyDeleteSubscription, transferSubscription, reactivateSubscription,

        placeOrder, confirmOrder,
        addReview, deleteReview, restoreReview, permanentlyDeleteReview,
        addConsultationRequest, updateConsultationRequest,

        addPendingGift, checkAndClaimPendingGifts, donateToPayItForward, grantPayItForwardSeat, updatePendingGift, deletePendingGift, restorePendingGift, permanentlyDeletePendingGift, adminManualClaimGift,

        markNotificationAsRead, deleteNotification, addNotificationForMultipleUsers, updateDrhopeData, addPartner, updatePartner, deletePartner, addBroadcastToHistory, fetchDrHopeContent,

        addExpense, updateExpense, deleteExpense, restoreExpense, permanentlyDeleteExpense,

        addProduct, updateProduct, deleteProduct, restoreProduct, permanentlyDeleteProduct,

        deleteCreditTransaction, restoreCreditTransaction, permanentlyDeleteCreditTransaction,

        // Cart (Server-Side)
        cart,
        fetchCart,
        addToCart,
        updateCartItem,
        removeFromCart,
        fetchOrderSummary,
        createOrder,

        // New Subscription Actions
        createSubscription,
        processSubscriptionPayment,

        // Charity Actions
        buyCharitySeats,
        processCharityPayment
    }), [currentUser, users, workshops, products, partners, drhopeData, activeTheme, notifications, consultationRequests, pendingGifts, expenses, broadcastHistory, cart, paginationMeta, countries, countriesDebugInfo, createSubscription, processSubscriptionPayment, buyCharitySeats, processCharityPayment, earliestWorkshop, fetchEarliestWorkshop, fetchDrHopeContent]);

    return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = (): UserContextType => {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};
