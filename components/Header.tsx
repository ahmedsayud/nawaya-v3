
import React, { useState, useEffect, useRef } from 'react';
import { Page } from '../types';
import { CloseIcon, BellIcon, ChevronDownIcon, ShoppingCartIcon, GlobeAltIcon, ArrowLeftOnRectangleIcon, VideoIcon, CollectionIcon, InstagramIcon, ChatBubbleIcon, ChatBubbleLeftRightIcon, UsersIcon, UserIcon, InformationCircleIcon, LightBulbIcon, LoginIcon } from './icons';
import { useUser } from '../context/UserContext';
import NotificationsPanel from './NotificationsPanel';

interface HeaderProps {
  onLoginClick: (hideRegister?: boolean) => void;
  onRegisterClick: () => void; // Kept for interface compatibility
  onNavigate: (target: Page | string) => void;
  onScrollToSection: (sectionId: string) => void;
  onShowVideo: () => void;
  onShowPhotoAlbum: () => void;
  onShowInstagram: () => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (isOpen: boolean) => void;
  onBoutiqueClick: () => void;
  onRequestConsultationClick: () => void;
  onOpenNavigationHub: () => void;
  isHomePage?: boolean;
  isVisible?: boolean;
}

const LogoButton: React.FC<{ logoUrl?: string; onClick: () => void; isMobile?: boolean }> = ({ logoUrl, onClick, isMobile }) => {
  const sizeClasses = isMobile ? 'w-16 h-16' : 'w-16 h-16 md:w-20 md:h-20';
  const btnClasses = `group ${sizeClasses} flex items-center justify-center rounded-full transition-all duration-500 transform hover:scale-105 focus:outline-none shadow-[0_0_20px_rgba(236,72,153,0.3)] hover:shadow-[0_0_30px_rgba(236,72,153,0.6)] bg-white border-2 border-pink-400/30 hover:border-pink-400/50 overflow-hidden`;

  return (
    <button
      onClick={onClick}
      className={btnClasses}
      aria-label="الصفحة الرئيسية"
    >
      {logoUrl ? (
        <div className="w-full h-full flex items-center justify-center rounded-full overflow-hidden">
          <img
            src={logoUrl}
            alt="Nawaya Logo"
            className="w-full h-full object-contain transition-all duration-500 group-hover:scale-110 drop-shadow-md"
          />
        </div>
      ) : (
        <span className="text-xl font-bold tracking-wider text-pink-400">NAWAYA</span>
      )}
    </button>
  );
};

const Header: React.FC<HeaderProps> = ({
  onLoginClick, onRegisterClick, onNavigate, onScrollToSection, onShowVideo, onShowPhotoAlbum, onShowInstagram,
  isMobileMenuOpen, setIsMobileMenuOpen, onBoutiqueClick, onRequestConsultationClick, onOpenNavigationHub, isHomePage = false,
  isVisible = true
}) => {
  const { currentUser: user, logout: onLogout, notifications, drhopeData } = useUser();
  const [isNotificationsPanelOpen, setIsNotificationsPanelOpen] = useState(false);
  const [isMobileNotificationsOpen, setIsMobileNotificationsOpen] = useState(false);
  const [showGuestNotificationMessage, setShowGuestNotificationMessage] = useState(false);
  const desktopNotificationContainerRef = useRef<HTMLDivElement>(null);
  const mobileNotificationContainerRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const unreadCount = user ? notifications.filter(n => !n.read).length : 0;


  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Close desktop panel
      if (window.innerWidth >= 768 && desktopNotificationContainerRef.current && !desktopNotificationContainerRef.current.contains(event.target as Node)) {
        setIsNotificationsPanelOpen(false);
        setShowGuestNotificationMessage(false);
      }
      // Close mobile guest message
      if (window.innerWidth < 768 && mobileNotificationContainerRef.current && !mobileNotificationContainerRef.current.contains(event.target as Node)) {
        setShowGuestNotificationMessage(false);
      }
      // Close mobile menu if clicked outside
      if (isMobileMenuOpen && mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node) && !(event.target as Element).closest('.mobile-menu-trigger')) {
        setIsMobileMenuOpen(false);
      }
    };

    if (isNotificationsPanelOpen || showGuestNotificationMessage || isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isNotificationsPanelOpen, showGuestNotificationMessage, isMobileMenuOpen]);

  const handleCloseMobileMenu = () => setIsMobileMenuOpen(false);

  const handleMobileLinkClick = (action: () => void) => {
    action();
    handleCloseMobileMenu();
  }

  const handleNotificationsToggle = () => {
    if (!user) {
      setShowGuestNotificationMessage(!showGuestNotificationMessage);
      return;
    }
    handleCloseMobileMenu();
    const willOpen = !isNotificationsPanelOpen;
    if (willOpen && unreadCount > 0) {
      // Mark as read logic is now handled individually
    }
    setIsNotificationsPanelOpen(willOpen);
    setShowGuestNotificationMessage(false);
  }

  const handleMobileNotificationsToggle = () => {
    if (!user) {
      setShowGuestNotificationMessage(!showGuestNotificationMessage);
      return;
    }
    handleCloseMobileMenu();
    const willOpen = !isMobileNotificationsOpen;
    if (willOpen && unreadCount > 0) {
      // Mark as read logic is now handled individually
    }
    setIsMobileNotificationsOpen(willOpen);
    setShowGuestNotificationMessage(false);
  }

  const handleDrHopeMenuToggle = () => {
    setIsNotificationsPanelOpen(false);
    setIsMobileNotificationsOpen(false);
    setIsMobileMenuOpen(!isMobileMenuOpen);
    setShowGuestNotificationMessage(false);
  }

  const handleProfileClick = () => {
    if (user) {
      onNavigate(Page.PROFILE);
    } else {
      // Hide registration when clicking profile
      onLoginClick(true);
    }
  };

  const navLinkClasses = `py-2 px-4 rounded-md font-semibold transition-all duration-300 text-slate-200 hover:text-white hover:bg-white/10 text-base`;
  const iconButtonClasses = `p-2 rounded-full transition-all duration-300 transform hover:scale-110 text-slate-200 hover:bg-white/10 hover:text-pink-400`;
  const mobileIconButtonClasses = `p-2 rounded-lg bg-white/5 border border-white/5 text-slate-200 hover:bg-white/10 active:scale-95 transition-all`;
  const primaryButtonClasses = "bg-gradient-to-r from-purple-800 to-pink-600 hover:from-purple-700 hover:to-pink-500 text-white font-bold py-2.5 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg shadow-purple-900/30 hover:shadow-pink-500/30 border border-white/10 text-sm";

  const headerLinks = drhopeData.headerLinks || {
    drhope: 'دكتور هوب',
    reviews: 'آراء المشتركات',
    profile: 'ملفي الشخصي',
  };

  const headerBgClass = 'bg-theme-header-gradient shadow-xl border-b border-white/10';

  // Component for Guest Notification Message
  const GuestNotificationMessage = () => (
    <div className="absolute top-full left-0 mt-3 w-72 bg-slate-900/95 backdrop-blur-xl border border-fuchsia-500/30 rounded-xl shadow-2xl p-4 z-50 text-right animate-fade-in-up">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-fuchsia-500/20 rounded-full text-fuchsia-400 flex-shrink-0">
          <InformationCircleIcon className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-white font-bold text-sm mb-1">خاص بالمشتركين</h4>
          <p className="text-slate-300 text-xs leading-relaxed">
            هذه الميزة متاحة فقط للأعضاء المسجلين لمتابعة تحديثات الورش.
          </p>
        </div>
      </div>
      {/* Arrow */}
      <div className="absolute -top-2 left-4 w-4 h-4 bg-slate-900 border-t border-l border-fuchsia-500/30 transform rotate-45"></div>
    </div>
  );

  return (
    <>
      {/* 
        HEADER STRUCTURE:
        Mobile: Vertical Flex (Row 1: Icons, Row 2: Profile)
        Desktop: Horizontal Flex
      */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-1000 ease-in-out ${headerBgClass} ${isVisible ? 'translate-y-0' : '-translate-y-full'}`}>

        {/* MOBILE HEADER LAYOUT (Two Rows) */}
        <div className="md:hidden flex flex-col p-3 gap-3">
          {/* Row 1: Logo & Actions */}
          <div className="flex items-center justify-between">

            {/* Right: Logo */}
            <div className="flex-shrink-0">
              <LogoButton logoUrl={drhopeData.logoUrl} onClick={() => onNavigate(Page.WORKSHOPS)} isMobile={true} />
            </div>

            {/* Left: Action Icons Row */}
            <div className="flex items-center gap-2">

              {/* Dr Hope Menu Trigger */}
              <button
                onClick={handleDrHopeMenuToggle}
                className={`mobile-menu-trigger flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full py-1.5 px-3 transition-all duration-300 ${isMobileMenuOpen ? 'bg-fuchsia-500/20 border-fuchsia-500/50 text-white' : 'text-slate-200'}`}
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-fuchsia-500 to-purple-600 flex items-center justify-center shadow-md">
                  <LightBulbIcon className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-[10px] font-bold">دكتور هوب</span>
                <ChevronDownIcon className={`w-3 h-3 transition-transform duration-300 ${isMobileMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Navigation Hub */}
              <button onClick={onOpenNavigationHub} className={mobileIconButtonClasses} title="إلى أين تود الذهاب؟">
                <GlobeAltIcon className="w-5 h-5" />
              </button>

              {/* Notifications */}
              <div className="relative" ref={mobileNotificationContainerRef}>
                <button onClick={handleMobileNotificationsToggle} className={`${mobileIconButtonClasses} relative`}>
                  <BellIcon className="w-5 h-5" />
                  {user && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-3.5 w-3.5 bg-fuchsia-600 rounded-full text-[9px] flex items-center justify-center text-white font-bold animate-pulse shadow-lg shadow-fuchsia-500/50">
                      {unreadCount}
                    </span>
                  )}
                </button>
                {!user && showGuestNotificationMessage && <GuestNotificationMessage />}
              </div>

              {/* Login/Logout */}
              {user ? (
                <button
                  onClick={onLogout}
                  className={`${mobileIconButtonClasses} text-red-400 hover:bg-red-500/10 hover:border-red-500/30`}
                  title="تسجيل الخروج"
                >
                  <ArrowLeftOnRectangleIcon className="w-5 h-5" />
                </button>
              ) : (
                <button
                  onClick={() => onLoginClick(false)}
                  className={mobileIconButtonClasses}
                  title="تسجيل الدخول"
                >
                  <LoginIcon className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Row 2: Large Profile Button */}
          <div className="w-full">
            <button
              onClick={handleProfileClick}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-800 to-fuchsia-700 hover:from-purple-700 hover:to-fuchsia-600 text-white font-bold py-2.5 rounded-xl shadow-lg border border-white/10 active:scale-[0.99] transition-all"
            >
              <UserIcon className="w-5 h-5" />
              <span>{user ? 'الملف الشخصي' : 'تسجيل الدخول للملف الشخصي'}</span>
            </button>
          </div>
        </div>


        {/* DESKTOP HEADER LAYOUT (Original) */}
        <nav className="hidden md:flex container mx-auto px-6 h-24 items-center justify-between">
          <div className="flex justify-start items-center gap-3 flex-1">
            <LogoButton logoUrl={drhopeData.logoUrl} onClick={() => onNavigate(Page.WORKSHOPS)} />
          </div>

          <div className="flex items-center justify-center gap-x-6">
            <div className="relative group">
              <button className={`${navLinkClasses} flex items-center gap-x-1`}>
                <span>دكتور هوب</span>
                <ChevronDownIcon className="w-4 h-4 transition-transform group-hover:rotate-180" />
              </button>
              {/* Desktop Dropdown */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transform transition-all duration-300 ease-in-out group-hover:translate-y-2 translate-y-4 bg-theme-header-gradient backdrop-blur-2xl rounded-xl shadow-2xl mt-2 p-2 w-[550px] border border-white/10 z-10 ring-1 ring-black/20">
                <div className="grid grid-cols-2 gap-2 text-slate-200">
                  <a onClick={onShowVideo} className="group flex items-center gap-x-4 p-3 rounded-lg hover:bg-white/10 cursor-pointer transition-colors duration-200">
                    <VideoIcon className="w-6 h-6 text-pink-400 flex-shrink-0 transition-transform duration-300 group-hover:scale-110" />
                    <div><span className="font-bold text-white text-base">من هي دكتور هوب</span><span className="text-xs text-slate-400 block">تعرفي على مسيرتها</span></div>
                  </a>
                  <a onClick={() => onNavigate(Page.REVIEWS)} className="group flex items-center gap-x-4 p-3 rounded-lg hover:bg-white/10 cursor-pointer transition-colors duration-200">
                    <ChatBubbleLeftRightIcon className="w-6 h-6 text-pink-400 flex-shrink-0 transition-transform duration-300 group-hover:scale-110" />
                    <div><span className="font-bold text-white text-sm">{headerLinks.reviews}</span><span className="text-xs text-slate-400 block">تجارب حقيقية</span></div>
                  </a>
                  <a onClick={onShowPhotoAlbum} className="group flex items-center gap-x-4 p-3 rounded-lg hover:bg-white/10 cursor-pointer transition-colors duration-200">
                    <CollectionIcon className="w-6 h-6 text-pink-400 flex-shrink-0 transition-transform duration-300 group-hover:scale-110" />
                    <div><span className="font-bold text-white text-sm">ألبوم الصور</span><span className="text-xs text-slate-400 block">لحظات من ورشاتنا</span></div>
                  </a>
                  <a onClick={() => onNavigate(Page.PARTNERS)} className="group flex items-center gap-x-4 p-3 rounded-lg hover:bg-white/10 cursor-pointer transition-colors duration-200">
                    <UsersIcon className="w-6 h-6 text-pink-400 flex-shrink-0 transition-transform duration-300 group-hover:scale-110" />
                    <div><span className="font-bold text-white text-sm">شركاء النجاح</span><span className="text-xs text-slate-400 block">شركاؤنا في الرحلة</span></div>
                  </a>
                  <a onClick={onShowInstagram} className="group flex items-center gap-x-4 p-3 rounded-lg hover:bg-white/10 cursor-pointer transition-colors duration-200">
                    <InstagramIcon className="w-6 h-6 text-pink-400 flex-shrink-0 transition-transform duration-300 group-hover:scale-110" />
                    <div><span className="font-bold text-white text-sm">بثوث انستجرام</span><span className="text-xs text-slate-400 block">البثوث المباشرة</span></div>
                  </a>
                  <a onClick={onBoutiqueClick} className="group flex items-center gap-x-4 p-3 rounded-lg hover:bg-white/10 cursor-pointer transition-colors duration-200">
                    <ShoppingCartIcon className="w-6 h-6 text-pink-400 flex-shrink-0 transition-transform duration-300 group-hover:scale-110" />
                    <div><span className="font-bold text-white text-sm">البوتيك</span><span className="text-xs text-slate-400 block">منتجات مختارة لك</span></div>
                  </a>
                  <a onClick={onRequestConsultationClick} className="group flex items-center gap-x-4 p-3 rounded-lg hover:bg-white/10 cursor-pointer transition-colors duration-200 col-span-2 border-t border-white/5 mt-1">
                    <ChatBubbleIcon className="w-6 h-6 text-pink-400 flex-shrink-0 transition-transform duration-300 group-hover:scale-110" />
                    <div><span className="font-bold text-white text-sm">طلب استشارة خاصة</span><span className="text-xs text-slate-400 block">تحدثي مباشرة مع المختصين</span></div>
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end items-center gap-3 flex-1">
            <div className="relative" ref={desktopNotificationContainerRef}>
              <button onClick={handleNotificationsToggle} className={`${iconButtonClasses} relative`}>
                <BellIcon className="w-6 h-6" />
                {user && unreadCount > 0 && (
                  <span className="absolute top-0 right-0 h-4 w-4 bg-fuchsia-600 rounded-full text-[10px] flex items-center justify-center text-white font-bold animate-pulse shadow-lg shadow-fuchsia-500/50">
                    {unreadCount}
                  </span>
                )}
              </button>
              {user && isNotificationsPanelOpen && <NotificationsPanel onClose={() => setIsNotificationsPanelOpen(false)} />}
              {!user && showGuestNotificationMessage && <GuestNotificationMessage />}
            </div>

            <button onClick={handleProfileClick} className={`hidden md:flex items-center gap-x-2 ${navLinkClasses}`}>
              <UserIcon className="w-5 h-5" />
              <span>الملف الشخصي</span>
            </button>

            <button onClick={onOpenNavigationHub} className={iconButtonClasses} title="إلى أين تود الذهاب؟">
              <GlobeAltIcon className="w-6 h-6" />
            </button>

            {user ? (
              <button
                onClick={onLogout}
                className={`hidden md:flex items-center gap-x-2 text-red-400 hover:text-red-300 font-bold transition-colors py-2 px-3 hover:bg-white/5 rounded-md`}
                title="تسجيل الخروج"
              >
                <ArrowLeftOnRectangleIcon className="w-5 h-5" />
                <span>خروج</span>
              </button>
            ) : (
              <div className="hidden md:flex gap-3">
                <button onClick={() => onLoginClick(false)} className={primaryButtonClasses}>
                  تسجيل دخول / انشاء حساب
                </button>
              </div>
            )}
          </div>
        </nav>

        {/* Mobile Dropdown Menu (Replacing Sidebar) */}
        {isMobileMenuOpen && (
          <div
            ref={mobileMenuRef}
            className="absolute top-full left-0 right-0 bg-theme-header-gradient border-b border-white/10 shadow-2xl overflow-hidden md:hidden z-40 animate-slide-down"
          >
            <div className="p-4 space-y-2 max-h-[80vh] overflow-y-auto custom-scrollbar">
              <h3 className="text-xs font-bold text-fuchsia-300 uppercase tracking-widest px-2 mb-2">عالم دكتور هوب</h3>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => handleMobileLinkClick(onShowVideo)} className="bg-white/5 hover:bg-white/10 p-3 rounded-lg text-right flex flex-col gap-2 group transition-colors">
                  <VideoIcon className="w-6 h-6 text-fuchsia-500 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold text-slate-200">من هي دكتور هوب</span>
                </button>
                <button onClick={() => handleMobileLinkClick(onShowPhotoAlbum)} className="bg-white/5 hover:bg-white/10 p-3 rounded-lg text-right flex flex-col gap-2 group transition-colors">
                  <CollectionIcon className="w-6 h-6 text-fuchsia-500 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold text-slate-200">ألبوم الصور</span>
                </button>
                <button onClick={() => handleMobileLinkClick(onShowInstagram)} className="bg-white/5 hover:bg-white/10 p-3 rounded-lg text-right flex flex-col gap-2 group transition-colors">
                  <InstagramIcon className="w-6 h-6 text-fuchsia-500 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold text-slate-200">بثوث انستجرام</span>
                </button>
                <button onClick={() => handleMobileLinkClick(onBoutiqueClick)} className="bg-white/5 hover:bg-white/10 p-3 rounded-lg text-right flex flex-col gap-2 group transition-colors">
                  <ShoppingCartIcon className="w-6 h-6 text-fuchsia-500 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold text-slate-200">البوتيك</span>
                </button>
              </div>

              <div className="space-y-1 mt-2">
                <button onClick={() => handleMobileLinkClick(onRequestConsultationClick)} className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors text-slate-200">
                  <ChatBubbleIcon className="w-5 h-5 text-fuchsia-400" />
                  <span className="text-sm font-semibold">طلب استشارة خاصة</span>
                </button>
                <button onClick={() => handleMobileLinkClick(() => onNavigate(Page.REVIEWS))} className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors text-slate-200">
                  <ChatBubbleLeftRightIcon className="w-5 h-5 text-fuchsia-400" />
                  <span className="text-sm font-semibold">آراء المشتركات</span>
                </button>
                <button onClick={() => handleMobileLinkClick(() => onNavigate(Page.PARTNERS))} className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors text-slate-200">
                  <UsersIcon className="w-5 h-5 text-fuchsia-400" />
                  <span className="text-sm font-semibold">شركاء النجاح</span>
                </button>
              </div>
              <div className="h-1 bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500 mt-2"></div>
            </div>
          </div>
        )}
      </header>

      {/* Mobile Notifications Fullscreen Overlay */}
      {isMobileNotificationsOpen && (
        <div className="fixed inset-0 z-[60] bg-theme-header-gradient md:hidden flex flex-col">
          <NotificationsPanel onClose={() => setIsMobileNotificationsOpen(false)} isMobile={true} />
        </div>
      )}

      {/* Animation Style */}
      <style>{`
        @keyframes slide-down {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-down {
            animation: slide-down 0.3s ease-out forwards;
        }
      `}</style>
    </>
  );
};

export default Header;
