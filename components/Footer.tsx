
import React from 'react';
import { InstagramIcon, TwitterIcon, FacebookIcon, SnapchatIcon, TikTokIcon, PhoneIcon, EnvelopeIcon } from './icons';
import { useUser } from '../context/UserContext';
import { SocialMediaLinks } from '../types';

interface FooterProps {
  onShippingClick: () => void;
  onTermsClick: () => void;
  onAboutClick: () => void;
  onPrivacyClick: () => void;
}

const socialPlatforms: { key: keyof SocialMediaLinks; icon: React.FC<{ className?: string }>; hoverClasses: string; ariaLabel: string }[] = [
  { key: 'instagram', icon: InstagramIcon, hoverClasses: 'hover:bg-pink-600 hover:shadow-[0_0_15px_rgba(219,39,119,0.6)]', ariaLabel: 'Instagram' },
  { key: 'snapchat', icon: SnapchatIcon, hoverClasses: 'hover:bg-yellow-400 hover:text-black hover:shadow-[0_0_15px_rgba(250,204,21,0.6)]', ariaLabel: 'Snapchat' },
  { key: 'twitter', icon: TwitterIcon, hoverClasses: 'hover:bg-sky-500 hover:shadow-[0_0_15px_rgba(14,165,233,0.6)]', ariaLabel: 'Twitter' },
  { key: 'facebook', icon: FacebookIcon, hoverClasses: 'hover:bg-blue-600 hover:shadow-[0_0_15px_rgba(37,99,235,0.6)]', ariaLabel: 'Facebook' },
  { key: 'tiktok', icon: TikTokIcon, hoverClasses: 'hover:bg-[#00f2ea] hover:text-black hover:shadow-[0_0_15px_rgba(0,242,234,0.6)]', ariaLabel: 'TikTok' },
];

const Footer: React.FC<FooterProps> = ({ onShippingClick, onTermsClick, onAboutClick, onPrivacyClick }) => {
  const { drhopeData } = useUser();
  const { socialMediaLinks } = drhopeData;

  return (
    <footer className="relative mt-10 pt-6 pb-3 bg-theme-header-gradient text-slate-300 overflow-hidden border-t border-fuchsia-500/30">

      {/* Top Glow Effect */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-fuchsia-400 to-transparent shadow-[0_0_20px_rgba(232,121,249,0.8)]"></div>

      {/* Ambient Background Glows */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-pink-600/10 blur-[80px] rounded-full pointer-events-none mix-blend-screen"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-600/10 blur-[80px] rounded-full pointer-events-none mix-blend-screen"></div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-12 gap-x-4 gap-y-6 mb-4">

          {/* Column 1: Brand Info (Full width on mobile, 5 cols on desktop) */}
          <div className="col-span-2 md:col-span-5 space-y-2 flex flex-col items-center md:items-start text-center md:text-right">
            <div className="flex flex-col items-center md:items-start">
              {drhopeData.logoUrl ? (
                <img src={drhopeData.logoUrl} alt="Nawaya Logo" className="h-10 w-auto mb-1.5 opacity-100 drop-shadow-xl filter brightness-110" />
              ) : (
                <h2 className="text-lg font-black text-white tracking-widest mb-1 bg-clip-text text-transparent bg-gradient-to-r from-white to-fuchsia-300">NAWAYA</h2>
              )}
              <p className="text-[10px] leading-relaxed text-slate-300 font-medium max-w-sm opacity-90">
                منصة رائدة لإدارة الندوات والفعاليات وورش العمل التطويرية.
              </p>
            </div>
            <div className="flex gap-2 pt-1 justify-center md:justify-start">
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
                      className={`w-6 h-6 rounded-full flex items-center justify-center bg-white/5 text-white backdrop-blur-sm transition-all duration-300 border border-white/10 hover:-translate-y-1 ${platform.hoverClasses}`}
                    >
                      <Icon className="w-3 h-3" />
                    </a>
                  );
                }
                return null;
              })}
            </div>
          </div>

          {/* Column 2: Quick Links (1 col on mobile, 3 cols on desktop) */}
          <div className="col-span-1 md:col-span-3 pt-1">
            <h3 className="text-white font-bold mb-2 text-xs relative inline-block">
              روابط تهمك
              <span className="absolute -bottom-1 right-0 w-4 h-0.5 bg-fuchsia-500 rounded-full"></span>
            </h3>
            {/* Grid layout for links */}
            <ul className="grid grid-cols-2 gap-y-1 gap-x-2 text-[10px]">
              <li><button onClick={onAboutClick} className="hover:text-fuchsia-300 transition-all duration-200 hover:translate-x-[-2px] transform inline-flex items-center gap-1 font-medium"><span>من نحن</span></button></li>
              <li><button onClick={onShippingClick} className="hover:text-fuchsia-300 transition-all duration-200 hover:translate-x-[-2px] transform inline-flex items-center gap-1 font-medium"><span>سياسة الشحن</span></button></li>
              <li><button onClick={onTermsClick} className="hover:text-fuchsia-300 transition-all duration-200 hover:translate-x-[-2px] transform inline-flex items-center gap-1 font-medium"><span>الشروط والأحكام</span></button></li>
              <li><button onClick={onPrivacyClick} className="hover:text-fuchsia-300 transition-all duration-200 hover:translate-x-[-2px] transform inline-flex items-center gap-1 font-medium"><span>الخصوصية</span></button></li>
            </ul>
          </div>

          {/* Column 3: Contact Info (1 col on mobile, 4 cols on desktop) */}
          <div className="col-span-1 md:col-span-4 pt-1">
            <h3 className="text-white font-bold mb-2 text-xs relative inline-block">
              تواصل معنا
              <span className="absolute -bottom-1 right-0 w-4 h-0.5 bg-fuchsia-500 rounded-full"></span>
            </h3>
            <div className="space-y-1.5">
              <a href={`tel:${(drhopeData.companyPhone || drhopeData.whatsappNumber || '').replace(/[^0-9]/g, '')}`} className="flex items-center gap-2 group p-1 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 hover:border-fuchsia-500/30 transition-all">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-fuchsia-600 to-purple-600 flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform flex-shrink-0">
                  <PhoneIcon className="w-3 h-3" />
                </div>
                <div className="overflow-hidden">
                  <p className="text-[9px] text-fuchsia-300 font-bold">هاتف</p>
                  <p dir="ltr" className="text-white font-mono font-bold tracking-wide text-[9px] truncate">{drhopeData.companyPhone || drhopeData.whatsappNumber}</p>
                </div>
              </a>

              <a href="mailto:info@nawayaevent.com" className="flex items-center gap-2 group p-1 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 hover:border-fuchsia-500/30 transition-all">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-fuchsia-600 to-purple-600 flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform flex-shrink-0">
                  <EnvelopeIcon className="w-3 h-3" />
                </div>
                <div className="overflow-hidden">
                  <p className="text-[9px] text-fuchsia-300 font-bold">البريد</p>
                  <p className="text-white font-sans font-bold tracking-wide text-[9px] truncate">info@nawayaevent.com</p>
                </div>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar - Centered Content */}
        <div className="border-t border-white/10 pt-3 pb-2 flex flex-col items-center justify-center relative">
          <p dir="ltr" className="text-[9px] text-slate-400 font-medium opacity-60 text-center">
            &copy; {new Date().getFullYear()} <span className="text-white">Nawaya</span>. All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
