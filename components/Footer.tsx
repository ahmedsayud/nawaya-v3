
import React from 'react';
import { InstagramIcon, TwitterIcon, FacebookIcon, SnapchatIcon, TikTokIcon, PhoneIcon, EnvelopeIcon, GlobeAltIcon } from './icons';
import { useUser } from '../context/UserContext';
import { SocialMediaLinks } from '../types';

interface FooterProps {
  onShippingClick: () => void;
  onTermsClick: () => void;
  onAboutClick: () => void;
  onPrivacyClick: () => void;
}

const socialPlatforms: { key: keyof SocialMediaLinks; icon: React.FC<{ className?: string }>; hoverClasses: string; ariaLabel: string }[] = [
    { key: 'instagram', icon: InstagramIcon, hoverClasses: 'hover:text-pink-500', ariaLabel: 'Instagram' },
    { key: 'snapchat', icon: SnapchatIcon, hoverClasses: 'hover:text-yellow-400', ariaLabel: 'Snapchat' },
    { key: 'twitter', icon: TwitterIcon, hoverClasses: 'hover:text-sky-500', ariaLabel: 'Twitter' },
    { key: 'facebook', icon: FacebookIcon, hoverClasses: 'hover:text-blue-600', ariaLabel: 'Facebook' },
    { key: 'tiktok', icon: TikTokIcon, hoverClasses: 'hover:text-[#00f2ea]', ariaLabel: 'TikTok' },
];

const Footer: React.FC<FooterProps> = ({ onShippingClick, onTermsClick, onAboutClick, onPrivacyClick }) => {
  const { drhopeData } = useUser();
  const { socialMediaLinks } = drhopeData;

  return (
    <footer className="relative mt-auto bg-[#2e1065] text-slate-300 border-t border-white/5 text-sm">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start text-center md:text-right">
          
          {/* Column 1: Brand Info (4 Cols) */}
          <div className="md:col-span-4 space-y-3 flex flex-col items-center md:items-start">
            <div className="flex items-center gap-3">
               {drhopeData.logoUrl ? (
                  <img src={drhopeData.logoUrl} alt="Nawaya Logo" className="h-10 w-auto opacity-90" />
               ) : (
                  <h2 className="text-xl font-black text-white tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-white to-fuchsia-300">NAWAYA</h2>
               )}
            </div>
            <p className="text-xs leading-relaxed text-slate-400 font-medium max-w-sm mx-auto md:mx-0">
                 منصة رائدة لإدارة الندوات والفعاليات وورش العمل التطويرية، نسعى لتقديم محتوى يلهمك لتكون أفضل نسخة من نفسك.
            </p>
          </div>

          {/* Column 2: Quick Links (4 Cols) */}
          <div className="md:col-span-4 flex flex-col items-center md:items-start">
            <h3 className="text-white font-bold text-xs uppercase tracking-wider mb-4 border-b border-white/10 pb-2 w-fit">روابط هامة</h3>
            <ul className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs font-medium w-full max-w-xs md:max-w-none">
              <li className="flex justify-center md:justify-start">
                  <button onClick={onAboutClick} className="hover:text-fuchsia-400 transition-colors duration-200">
                      من نحن
                  </button>
              </li>
              <li className="flex justify-center md:justify-start">
                  <button onClick={onShippingClick} className="hover:text-fuchsia-400 transition-colors duration-200">
                      سياسة الشحن
                  </button>
              </li>
              <li className="flex justify-center md:justify-start">
                  <button onClick={onTermsClick} className="hover:text-fuchsia-400 transition-colors duration-200">
                      الشروط والأحكام
                  </button>
              </li>
              <li className="flex justify-center md:justify-start">
                  <button onClick={onPrivacyClick} className="hover:text-fuchsia-400 transition-colors duration-200">
                      سياسة الخصوصية
                  </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Contact Info (4 Cols) */}
          <div className="md:col-span-4 flex flex-col items-center md:items-start">
            <h3 className="text-white font-bold text-xs uppercase tracking-wider mb-4 border-b border-white/10 pb-2 w-fit">تواصل معنا</h3>
            <div className="space-y-3 text-xs w-full">
                <a href={`https://wa.me/${(drhopeData.whatsappNumber || '').replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 hover:text-white transition-colors group justify-center md:justify-start">
                    <div className="w-6 h-6 rounded bg-white/5 flex items-center justify-center text-fuchsia-400 group-hover:bg-fuchsia-500 group-hover:text-white transition-all">
                        <PhoneIcon className="w-3.5 h-3.5"/>
                    </div>
                    <span dir="ltr" className="font-mono">{drhopeData.whatsappNumber || drhopeData.companyPhone}</span>
                </a>
                
                <a href="mailto:info@nawayaevent.com" className="flex items-center gap-3 hover:text-white transition-colors group justify-center md:justify-start">
                    <div className="w-6 h-6 rounded bg-white/5 flex items-center justify-center text-fuchsia-400 group-hover:bg-fuchsia-500 group-hover:text-white transition-all">
                        <EnvelopeIcon className="w-3.5 h-3.5"/>
                    </div>
                    <span className="font-sans">info@nawayaevent.com</span>
                </a>

                {drhopeData.companyAddress && (
                    <div className="flex items-start gap-3 group justify-center md:justify-start">
                        <div className="w-6 h-6 rounded bg-white/5 flex-shrink-0 flex items-center justify-center text-fuchsia-400">
                            <GlobeAltIcon className="w-3.5 h-3.5"/>
                        </div>
                        <span className="leading-tight">{drhopeData.companyAddress}</span>
                    </div>
                )}
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Socials */}
        <div className="border-t border-white/5 mt-8 pt-4 flex flex-col-reverse md:flex-row items-center justify-between gap-4">
          <p dir="ltr" className="text-[10px] text-slate-500 font-medium text-center md:text-left w-full md:w-auto">
              &copy; {new Date().getFullYear()} <span className="text-slate-300">Nawaya Events</span>. All Rights Reserved.
          </p>
          
          <div className="flex items-center justify-center gap-4 w-full md:w-auto">
            {socialPlatforms.map(platform => {
                const link = socialMediaLinks?.[platform.key];
                if (link) {
                const Icon = platform.icon;
                return (
                    <a 
                    key={platform.key}
                    href={link} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    aria-label={platform.ariaLabel}
                    className={`text-slate-400 transition-colors duration-300 ${platform.hoverClasses}`}
                    >
                    <Icon className="w-4 h-4" />
                    </a>
                );
                }
                return null;
            })}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
