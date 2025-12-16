import React from 'react';
import { WhatsAppIcon } from './icons';
import { useUser } from '../context/UserContext';
import { trackEvent } from '../analytics';

const WhatsAppButton: React.FC = () => {
  const { drhopeData, currentUser } = useUser();
  const whatsappNumber = drhopeData?.whatsappNumber;

  if (!whatsappNumber) {
    return null;
  }

  const handleClick = () => {
    trackEvent('contact_whatsapp', {}, currentUser || undefined);
  };

  return (
    <a
      href={`https://wa.me/${whatsappNumber}`}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 bg-green-500 text-white w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center shadow-lg transform hover:scale-125 transition-transform duration-300 z-40"
      aria-label="Contact us on WhatsApp"
    >
      <WhatsAppIcon className="w-7 h-7 sm:w-8 sm:h-8" />
    </a>
  );
};

export default WhatsAppButton;