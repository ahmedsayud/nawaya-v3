export const API_BASE_URL = 'https://tan-bison-374038.hostingersite.com';

export const API_ENDPOINTS = {
    AUTH: {
        LOGIN: '/api/login',
        LOGOUT: '/api/logout',
        REGISTER: '/api/register',
    },
    PROFILE: {
        DETAILS: '/api/profile/details',
        SUGGEST_WORKSHOPS: '/api/profile/suggest-workshops',
        ADD_REVIEW: '/api/profile/review',
    },
    GENERAL: {
        COUNTRIES: '/api/countries',
        SETTINGS: '/api/home/settings',
        WORKSHOPS: '/api/workshops',
        EARLIEST_WORKSHOP: '/api/home/earliest-workshop',
    },
    DRHOPE: {
        VIDEOS: '/api/drhope/videos',
        GALLERY: '/api/drhope/gallery',
        INSTAGRAM_LIVES: '/api/drhope/instagram-lives',
        PARTNERS: '/api/drhope/partners',
        PRODUCTS: '/api/drhope/products',
        REVIEWS: '/api/drhope/reviews',
        SUPPORT: '/api/drhope/support',
    },
    CART: {
        ADD: '/api/cart/add',
        SUMMARY: '/api/cart/summary',
        UPDATE: '/api/cart/update',
        REMOVE_ITEM: '/api/cart/delete-item',
    },
    ORDERS: {
        SUMMARY: '/api/orders/summary',
        CREATE: '/api/orders/create',
    },
    SUBSCRIPTIONS: {
        CREATE: '/api/subscriptions/create',
        PROCESS: '/api/subscriptions/process-payment',
        BUY_CHARITY: '/api/subscriptions/buy-charity',
        PROCESS_CHARITY: '/api/subscriptions/process-charity-payment',
    }
};


