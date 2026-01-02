import React from 'react';
import { PhoneIcon } from './icons';
import { useUser } from '../context/UserContext';
import { trackEvent } from '../analytics';

const PhoneButton: React.FC = () => {
    const { drhopeData, currentUser } = useUser();
    const phoneNumber = drhopeData?.companyPhone || drhopeData?.whatsappNumber;

    if (!phoneNumber) {
        return null;
    }

    const handleClick = () => {
        trackEvent('contact_phone', {}, currentUser || undefined);
    };

    return (
        <a
            href={`tel:${phoneNumber}`}
            onClick={handleClick}
            className="fixed bottom-24 right-4 sm:bottom-28 sm:right-6 bg-blue-500 text-white w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center shadow-lg transform hover:scale-125 transition-transform duration-300 z-50"
            aria-label="Call us"
        >
            <PhoneIcon className="w-7 h-7 sm:w-8 sm:h-8" />
        </a>
    );
};

export default PhoneButton;
