export const API_BASE_URL = 'https://tan-bison-374038.hostingersite.com';

export const API_ENDPOINTS = {
    AUTH: {
        LOGIN: '/api/login',
        LOGOUT: '/api/logout',
        REGISTER: '/api/register',
    },
    GENERAL: {
        COUNTRIES: '/api/countries',
        PROFILE: '/api/profile/details',
        SETTINGS: '/api/home/settings',
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
    }
};


