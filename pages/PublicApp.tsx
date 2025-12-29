
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useUser } from '../context/UserContext';
import { Page, Workshop, Package, User, Subscription, ConsultationRequest, NoteResource, Recording, PaymentIntent, OrderStatus, SubscriptionCreateResponse, CharityCreateResponse } from '../types';
import Header from '../components/Header';
import Footer from '../components/Footer';
import IntroAnimation from '../components/IntroAnimation';
import Toast from '../components/Toast';
import WhatsAppButton from '../components/WhatsAppButton';
import Chatbot from '../components/Chatbot';
import MusicPlayer from '../components/MusicPlayer';
import AuthModal from '../components/AuthModal';
import PaymentModal from '../components/PaymentModal';
import WorkshopDetailsModal from '../components/WorkshopDetailsModal';
import UnifiedGiftModal from '../components/UnifiedGiftModal';
import AttachmentViewerModal from '../components/AttachmentViewerModal';
import VideoModal from '../components/VideoModal';
import PhotoAlbumModal from '../components/PhotoAlbumModal';
import InstagramModal from '../components/InstagramModal';
import CvModal from '../components/CvModal';
import NavigationHubModal from '../components/NavigationHubModal';
import WorkshopsPage from '../pages/WorkshopsPage';
import ProfilePage from '../pages/ProfilePage';
import WatchPage from '../pages/WatchPage';
import { InvoiceModal } from '../components/InvoiceModal';
import { CertificateModal } from '../components/CertificateModal';
import ConsultationRequestModal from '../components/ConsultationRequestModal';
import ReviewsModal from '../components/ReviewsModal';
import PartnersModal from '../components/PartnersModal';
import BoutiqueModal from '../components/BoutiqueModal';
import ProductCheckoutModal from '../components/ProductCheckoutModal';
import PaymentFrameModal from '../components/PaymentFrameModal';
import LegalModal from '../components/LegalModal';
import { PrivacyPolicyContent, TermsContent, ShippingPolicyContent, AboutContent } from '../components/LegalContent';
import { isWorkshopExpired } from '../utils';

const PublicApp: React.FC = () => {
    const {
        currentUser, workshops, products, placeOrder, addSubscription, addPendingGift, donateToPayItForward, cart,
        createSubscription, processSubscriptionPayment, buyCharitySeats, processCharityPayment, earliestWorkshop,
        adminLogin, fetchProfile, isInitialLoading
    } = useUser();

    // Navigation State
    const [currentPage, setCurrentPage] = useState<Page>(Page.WORKSHOPS);

    // UI State
    const [introStage, setIntroStage] = useState<'loading' | 'welcome' | 'done'>('loading');
    const [toasts, setToasts] = useState<{ id: string, message: string, type: 'success' | 'warning' | 'error' }[]>([]);

    // Modals & Menus State
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [authModalInitialView, setAuthModalInitialView] = useState<'login' | 'register'>('login');
    const [authModalHideRegister, setAuthModalHideRegister] = useState(false);

    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isGiftModalOpen, setIsGiftModalOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isNavigationHubOpen, setIsNavigationHubOpen] = useState(false);
    const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
    const [isPhotoAlbumModalOpen, setIsPhotoAlbumModalOpen] = useState(false);
    const [isInstagramModalOpen, setIsInstagramModalOpen] = useState(false);
    const [isCvModalOpen, setIsCvModalOpen] = useState(false);
    const [isConsultationRequestModalOpen, setIsConsultationRequestModalOpen] = useState(false);
    const [isReviewsModalOpen, setIsReviewsModalOpen] = useState(false);
    const [isPartnersModalOpen, setIsPartnersModalOpen] = useState(false);
    const [legalModalContent, setLegalModalContent] = useState<{ title: string; content: React.ReactNode } | null>(null);
    const [isBoutiqueModalOpen, setIsBoutiqueModalOpen] = useState(false);
    const [boutiqueInitialView, setBoutiqueInitialView] = useState<'products' | 'cart'>('products');
    const [isProductCheckoutOpen, setIsProductCheckoutOpen] = useState(false);



    const [openedWorkshopId, setOpenedWorkshopId] = useState<number | null>(null);
    const [attachmentToView, setAttachmentToView] = useState<NoteResource | null>(null);
    const [invoiceToView, setInvoiceToView] = useState<{ user: User; subscription: Subscription } | null>(null);
    const [certificateToView, setCertificateToView] = useState<{ subscription: Subscription; workshop: Workshop } | null>(null);

    const [watchData, setWatchData] = useState<{ workshop: Workshop, recording: Recording } | null>(null);
    const [paymentModalIntent, setPaymentModalIntent] = useState<PaymentIntent | null>(null);
    const [giftModalIntent, setGiftModalIntent] = useState<{ workshop: Workshop, pkg: Package | null, initialData?: any } | null>(null);

    // Payment Frame State
    const [isPaymentFrameOpen, setIsPaymentFrameOpen] = useState(false);
    const [paymentFrameUrl, setPaymentFrameUrl] = useState('');

    // Dynamic Payment Info from Subscription API
    const [subscriptionApiResponse, setSubscriptionApiResponse] = useState<SubscriptionCreateResponse | null>(null);
    const [charityApiResponse, setCharityApiResponse] = useState<CharityCreateResponse | null>(null);
    const [isCreatingSubscription, setIsCreatingSubscription] = useState(false);

    // Authentication & Navigation Flow State
    const [postLoginPaymentIntent, setPostLoginPaymentIntent] = useState<PaymentIntent | null>(null);
    const [postLoginGiftIntent, setPostLoginGiftIntent] = useState<{ workshop: Workshop, pkg: Package | null, initialData?: any } | null>(null);

    // New state to handle Navigation Hub logic
    const [returnToHub, setReturnToHub] = useState(false);
    const [pendingHubAction, setPendingHubAction] = useState<'profile' | 'live' | null>(null);

    const initialHubOpenRef = useRef(false);

    // --- Effects ---

    // Intro Logic: loading -> welcome -> done
    useEffect(() => {
        if (!isInitialLoading && introStage === 'loading') {
            setIntroStage('welcome');
        }
    }, [isInitialLoading, introStage]);

    useEffect(() => {
        if (introStage === 'welcome') {
            const timer = setTimeout(() => {
                setIntroStage('done');
            }, 1500); // Show welcome message for 1.5 seconds

            return () => clearTimeout(timer);
        }
    }, [introStage]);

    useEffect(() => {
        if (introStage === 'done' && !initialHubOpenRef.current) {
            setIsNavigationHubOpen(true);
            initialHubOpenRef.current = true;
        }
    }, [introStage]);

    useEffect(() => {
        if (currentUser) {
            if (postLoginPaymentIntent) {
                if (postLoginPaymentIntent.type === 'workshop') {
                    // Re-trigger enroll request to create subscription and get real price
                    handleEnrollRequest(postLoginPaymentIntent.item as Workshop, postLoginPaymentIntent.pkg || null);
                } else {
                    setPaymentModalIntent(postLoginPaymentIntent);
                    setIsPaymentModalOpen(true);
                }
                setPostLoginPaymentIntent(null);
            }
            if (postLoginGiftIntent) { setGiftModalIntent(postLoginGiftIntent); setIsGiftModalOpen(true); setPostLoginGiftIntent(null); }
        }
    }, [currentUser, postLoginPaymentIntent, postLoginGiftIntent]);

    // Handle Admin Impersonation Link
    useEffect(() => {
        const searchParams = new URLSearchParams(window.location.search);
        const authParam = searchParams.get('auth');

        if (authParam) {
            try {
                // Decode Base64 with robust UTF-8 support for Arabic characters
                const binString = atob(authParam.replace(/-/g, '+').replace(/_/g, '/'));
                const decodedJson = decodeURIComponent(
                    binString.split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
                );
                const authData = JSON.parse(decodedJson);

                if (authData && authData.token && authData.user) {


                    // Call UserContext to set user
                    adminLogin(authData);

                    // Clean URL
                    const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
                    window.history.replaceState({ path: newUrl }, '', newUrl);

                    // Open Profile
                    setIsProfileOpen(true);
                    setIsNavigationHubOpen(false); // Close hub if open to focus on profile
                    showToast(`تم تسجيل الدخول كـ ${authData.user.name}`, 'success');
                }
            } catch (e) {

                showToast('رابط الدخول غير صالح', 'error');
            }
        }
    }, []);

    // Determine if there is an active live stream right now
    const activeLiveWorkshop = useMemo(() => {
        return workshops
            .filter(w => w.isVisible && !w.isRecorded && !isWorkshopExpired(w))
            .sort((a, b) => new Date(`${a.startDate}T${a.startTime}:00Z`).getTime() - new Date(`${b.startDate}T${b.startTime}:00Z`).getTime())[0];
    }, [workshops]);

    // --- Handlers ---

    const showToast = (message: string, type: 'success' | 'warning' | 'error' = 'success') => {
        const id = Date.now().toString();
        setToasts(prev => [...prev, { id, message, type }]);
    };

    const handleLoginClick = (hideRegister = false) => {
        setAuthModalInitialView('login');
        setAuthModalHideRegister(hideRegister);
        setIsAuthModalOpen(true);
    };

    const handleRegisterClick = () => {
        setAuthModalInitialView('register');
        setAuthModalHideRegister(false);
        setIsAuthModalOpen(true);
    };

    const handleOpenPayment = (url?: string) => {
        setPaymentFrameUrl(url || '');
        setIsPaymentFrameOpen(true);
    };

    // Helper to process Live Stream Access Logic
    const processLiveStreamAccess = (user: User) => {
        const nextLiveWorkshop = workshops
            .filter(w => w.isVisible && !w.isRecorded && !isWorkshopExpired(w))
            .sort((a, b) => new Date(`${a.startDate}T${a.startTime}:00Z`).getTime() - new Date(`${b.startDate}T${b.startTime}:00Z`).getTime())[0];

        if (!nextLiveWorkshop) {
            showToast('لا توجد ورش مباشرة متاحة حالياً', 'warning');
            return;
        }

        const isSubscribed = (user.subscriptions || []).some(
            sub => Number(sub.workshopId) === Number(nextLiveWorkshop.id) &&
                sub.status !== 'REFUNDED' &&
                !sub.isPayItForwardDonation
        );

        if (isSubscribed) {
            // Prioritize link from earliestWorkshop if IDs match
            const bestLink = (earliestWorkshop && earliestWorkshop.id === nextLiveWorkshop.id)
                ? earliestWorkshop.online_link
                : nextLiveWorkshop.zoomLink;

            if (bestLink) {
                if (earliestWorkshop && earliestWorkshop.online_link && earliestWorkshop.type === 'أونلاين') {
                    setWatchData({
                        workshop: { id: earliestWorkshop.id, title: earliestWorkshop.title } as Workshop,
                        recording: { name: 'بث مباشر', url: earliestWorkshop.online_link } as Recording
                    });
                } else {
                    setWatchData({
                        workshop: nextLiveWorkshop,
                        recording: { name: 'بث مباشر', url: bestLink } as Recording
                    });
                }
            } else {
                const sessionInfo = nextLiveWorkshop.startDate && nextLiveWorkshop.startTime
                    ? `ميعاد الجلسة القادمة في ${nextLiveWorkshop.startDate} الساعة ${nextLiveWorkshop.startTime} (UAE)`
                    : '';
                showToast(`رابط البث غير متوفر حالياً. ${sessionInfo}`, 'warning');
            }
        } else {
            showToast('يجب الاشتراك في الورشة للوصول إلى البث المباشر', 'warning');
            setCurrentPage(Page.WORKSHOPS);
            setTimeout(() => handleScrollToSection('live_stream_card'), 100);
        }
    };

    // Dedicated handler for clicking "Enter Broadcast" from the Card
    const handleLiveStreamCardLogin = () => {
        setPendingHubAction('live'); // Set intent to 'live'
        setReturnToHub(false); // Do not return to hub on cancel, just stay on page
        handleLoginClick(true);
    };

    // Handles Auth Modal Closing (X button)
    const handleAuthModalClose = () => {
        setIsAuthModalOpen(false);
        // If the user came from Navigation Hub and closed without logging in
        if (returnToHub) {
            setReturnToHub(false);
            setPendingHubAction(null);
            // Small delay to ensure smooth transition
            setTimeout(() => setIsNavigationHubOpen(true), 100);
        } else {
            // If simply closing modal and had a pending action (like from Card), clear it
            setPendingHubAction(null);
        }
    };

    // Handles Auth Modal Success (Login/Register)
    const handleAuthModalSuccess = (user: User, message?: string) => {
        setIsAuthModalOpen(false);
        showToast(message || `مرحباً ${user.fullName}`);

        // Check for pending actions (Shared between Hub and Card)
        if (pendingHubAction === 'profile') {
            setIsProfileOpen(true);
        } else if (pendingHubAction === 'live') {
            processLiveStreamAccess(user);
        }

        // Cleanup
        setReturnToHub(false);
        setPendingHubAction(null);
    };

    const handleNavigate = (target: Page | string) => {
        setIsMobileMenuOpen(false);
        if (target === Page.PROFILE) {
            if (currentUser) {
                fetchProfile(); // Sync profile data before opening
                setIsProfileOpen(true);
            } else {
                handleLoginClick(true);
            }
        }
        else if (target === Page.REVIEWS) setIsReviewsModalOpen(true);
        else if (target === Page.PARTNERS) setIsPartnersModalOpen(true);
        else if (target === Page.BOUTIQUE) { setBoutiqueInitialView('products'); setIsBoutiqueModalOpen(true); }
        else if (target === 'cart') { setBoutiqueInitialView('cart'); setIsBoutiqueModalOpen(true); }
        else if (target === Page.WORKSHOPS) setCurrentPage(Page.WORKSHOPS);
    };

    const handleScrollToSection = (sectionId: string) => {
        if (currentPage !== Page.WORKSHOPS) { setCurrentPage(Page.WORKSHOPS); setTimeout(() => { const element = document.getElementById(sectionId); if (element) element.scrollIntoView({ behavior: 'smooth' }); }, 100); }
        else { const element = document.getElementById(sectionId); if (element) element.scrollIntoView({ behavior: 'smooth' }); }
    };



    const handleCheckout = () => { if (currentUser) { setIsBoutiqueModalOpen(false); setIsProductCheckoutOpen(true); } else { setIsBoutiqueModalOpen(false); handleLoginClick(false); } };

    const handleProductOrderConfirm = (isCard: boolean) => {
        if (!currentUser || !cart || !cart.items) return;
        const cartItems = cart.items.map(item => ({ productId: item.product.id || item.product_id, quantity: item.quantity, price: item.price || item.product.price }));
        const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const taxAmount = subtotal * 0.05;
        const totalAmount = subtotal + taxAmount;
        placeOrder(currentUser.id, { products: cartItems, totalAmount, taxAmount }, isCard ? OrderStatus.COMPLETED : OrderStatus.PENDING);
        showToast(isCard ? 'تمت عملية الشراء بنجاح!' : 'تم استلام طلبك وهو قيد المراجعة.', 'success');
        setIsProductCheckoutOpen(false);
        // Cart clearing is handled by server or context refresh usually, but placeOrder mock might need update or we rely on backend.
        // For now assuming placeOrder handles it or we manually refresh cart.
        // Actually API placeOrder should clear cart on backend.
    };

    const handleEnrollRequest = async (workshop: Workshop, selectedPackage: Package | null) => {
        if (!selectedPackage) return;
        setOpenedWorkshopId(null);

        if (!currentUser) {
            setPostLoginPaymentIntent({
                type: 'workshop',
                item: workshop,
                pkg: selectedPackage,
                amount: selectedPackage.discountPrice ?? selectedPackage.price ?? 0
            });
            handleLoginClick(false);
            return;
        }

        setIsCreatingSubscription(true);
        const result = await createSubscription({
            package_id: selectedPackage.id,
            subscription_type: 'myself'
        });
        setIsCreatingSubscription(false);

        if (result) {
            setSubscriptionApiResponse(result);
            const apiPrice = result.subscriptions[0]?.subscription_details.price;

            // Prioritize package price (especially if discounted)
            const packagePrice = selectedPackage.discountPrice ?? selectedPackage.price;

            // Fix: handle 0 case strictly. If API says 0 OR package says 0 (free), use 0.
            // Also handle potential string '0' response
            const isApiFree = String(apiPrice) === '0';
            const isPackageFree = packagePrice === 0;
            const isWorkshopFree = workshop.isFree === true;

            const finalPrice = (isApiFree || isPackageFree || isWorkshopFree) ? 0 : packagePrice;

            if (finalPrice === 0) {
                showToast('تم الاشتراك في الورشة بنجاح!', 'success');
                // Ideally refresh user data here to reflect subscription
                fetchProfile();
                return;
            }

            const intent: PaymentIntent = {
                type: 'workshop',
                item: workshop,
                pkg: selectedPackage,
                amount: finalPrice
            };
            setPaymentModalIntent(intent);
            setIsPaymentModalOpen(true);
        } else {
            showToast('فشل إنشاء طلب الاشتراك، يرجى المحاولة لاحقاً.', 'error');
        }
    };

    const handleGiftRequest = (workshop: Workshop, selectedPackage: Package | null) => {
        setOpenedWorkshopId(null);
        setGiftModalIntent({ workshop, pkg: selectedPackage });
        setIsGiftModalOpen(true);
    };

    const handlePaymentSubmit = async (method: 'CARD' | 'BANK_TRANSFER') => {
        if (!paymentModalIntent || !currentUser || !subscriptionApiResponse) return;
        const { type, item, pkg, amount, recipientDetails } = paymentModalIntent;

        const subscriptionIds = subscriptionApiResponse.subscriptions.map(s => s.subscription_id);
        if (subscriptionIds.length === 0) {
            showToast('خطأ في بيانات الاشتراك.', 'error');
            return;
        }

        // Open modal immediately for better UX
        if (method === 'CARD') {
            handleOpenPayment();
        }

        const paymentResult = await processSubscriptionPayment({
            subscription_id: subscriptionIds.length === 1 ? subscriptionIds[0] : subscriptionIds,
            payment_type: method === 'CARD' ? 'online' : 'bank_transfer'
        });

        if (paymentResult?.key === 'success') {
            if (method === 'CARD' && paymentResult.data.invoice_url) {
                handleOpenPayment(paymentResult.data.invoice_url);
                return;
            }

            showToast(paymentResult.data?.message || paymentResult.msg || 'تم الاشتراك بنجاح!', 'success');
            setIsPaymentModalOpen(false);
            setPaymentModalIntent(null);
            setSubscriptionApiResponse(null);
        } else {
            // Close modal if it was opened for card
            if (method === 'CARD') setIsPaymentFrameOpen(false);
            showToast(paymentResult?.msg || 'فشل إتمام العملية لبدء الدفع.', 'error');
        }
    };

    const handleCharityPaymentSubmit = async (method: 'CARD' | 'BANK_TRANSFER') => {
        if (!paymentModalIntent || !currentUser || !charityApiResponse) return;

        const charityId = charityApiResponse.charity_id;

        // Open modal immediately for better UX
        if (method === 'CARD') {
            handleOpenPayment();
        }

        const paymentResult = await processCharityPayment({
            charity_id: charityId,
            payment_type: method === 'CARD' ? 'online' : 'bank_transfer'
        });

        if (paymentResult?.key === 'success') {
            if (method === 'CARD' && paymentResult.data.invoice_url) {
                handleOpenPayment(paymentResult.data.invoice_url);
                return;
            }

            showToast(paymentResult.data?.message || paymentResult.msg || 'تمت المساهمة بنجاح!', 'success');
            setIsPaymentModalOpen(false);
            setPaymentModalIntent(null);
            setCharityApiResponse(null);
        } else {
            // Close modal if it was opened for card
            if (method === 'CARD') setIsPaymentFrameOpen(false);
            showToast(paymentResult?.msg || 'فشل إتمام العملية.', 'error');
        }
    };

    const handleGiftProceed = async (data: { type: 'friend' | 'fund'; recipients?: any[]; giftMessage?: string; seats?: number; totalAmount: number }) => {
        setIsGiftModalOpen(false);
        if (!giftModalIntent) return;
        const { workshop, pkg } = giftModalIntent;

        if (!currentUser) {
            setPostLoginGiftIntent({ workshop, pkg, initialData: data });
            handleLoginClick(false);
            return;
        }

        if (!pkg) return;

        setIsCreatingSubscription(true);
        if (data.type === 'friend') {
            const createResult = await createSubscription({
                package_id: pkg.id,
                subscription_type: 'gift',
                recipient_name: data.recipients?.map(r => r.name),
                recipient_phone: data.recipients?.map(r => r.whatsapp),
                country_id: data.recipients?.map(r => 1) // Default for now
            });
            setIsCreatingSubscription(false);

            if (createResult) {
                setSubscriptionApiResponse(createResult);
                const intent: PaymentIntent = {
                    type: 'gift',
                    item: workshop,
                    pkg: pkg,
                    amount: createResult.subscriptions.reduce((sum, s) => sum + s.subscription_details.price, 0),
                    recipientDetails: data
                };
                setPaymentModalIntent(intent);
                setIsPaymentModalOpen(true);
            } else {
                showToast('فشل إنشاء طلب الإهداء.', 'error');
            }
        } else if (data.type === 'fund') {
            const createResult = await buyCharitySeats({
                package_id: pkg.id,
                number_of_seats: data.seats || 1
            });
            setIsCreatingSubscription(false);

            if (createResult) {
                setCharityApiResponse(createResult);
                const intent: PaymentIntent = {
                    type: 'payItForward',
                    item: workshop,
                    pkg: pkg,
                    amount: createResult.charity_details.price,
                    recipientDetails: data
                };
                setPaymentModalIntent(intent);
                setIsPaymentModalOpen(true);
            } else {
                showToast('فشل إنشاء طلب مساهمة خيرية.', 'error');
            }
        }
    };

    const isHomePage = currentPage === Page.WORKSHOPS;

    return (
        <div className={`min-h-screen font-sans selection:bg-fuchsia-500/30 ${isHomePage ? 'bg-white text-slate-900' : 'bg-theme-gradient text-slate-200'}`}>
            {introStage !== 'done' && <IntroAnimation stage={introStage === 'loading' ? 'loading' : 'welcome'} />}

            <Header
                onLoginClick={handleLoginClick}
                onRegisterClick={handleRegisterClick}
                onNavigate={handleNavigate}
                onScrollToSection={handleScrollToSection}
                onShowVideo={() => setIsVideoModalOpen(true)}
                onShowPhotoAlbum={() => setIsPhotoAlbumModalOpen(true)}
                onShowInstagram={() => setIsInstagramModalOpen(true)}
                isMobileMenuOpen={isMobileMenuOpen}
                setIsMobileMenuOpen={setIsMobileMenuOpen}
                onBoutiqueClick={() => { setIsBoutiqueModalOpen(true); setBoutiqueInitialView('products'); }}
                onRequestConsultationClick={() => setIsConsultationRequestModalOpen(true)}
                onOpenNavigationHub={() => setIsNavigationHubOpen(true)}
                isHomePage={isHomePage}
                isVisible={introStage === 'done'}
            />

            <main className="min-h-screen pt-24 pb-12">
                {currentPage === Page.WORKSHOPS && (
                    <WorkshopsPage
                        onLiveStreamLoginRequest={handleLiveStreamCardLogin}
                        onScrollToSection={handleScrollToSection}
                        onOpenWorkshopDetails={(id) => setOpenedWorkshopId(id)}
                        onPlayRecording={(w, r) => setWatchData({ workshop: w, recording: r as Recording })}
                        showToast={showToast}
                    />
                )}
            </main>

            <Footer
                onShippingClick={() => setLegalModalContent({ title: 'سياسة الشحن والتوصيل', content: <ShippingPolicyContent /> })}
                onTermsClick={() => setLegalModalContent({ title: 'الشروط والأحكام', content: <TermsContent /> })}
                onAboutClick={() => setLegalModalContent({ title: 'من نحن', content: <AboutContent /> })}
                onPrivacyClick={() => setLegalModalContent({ title: 'سياسة الخصوصية', content: <PrivacyPolicyContent /> })}
            />

            <AuthModal
                isOpen={isAuthModalOpen}
                onClose={handleAuthModalClose}
                onSuccess={handleAuthModalSuccess}
                initialView={authModalInitialView}
                showRegisterView={!authModalHideRegister}
            />
            {openedWorkshopId && <WorkshopDetailsModal workshop={workshops.find(w => w.id === openedWorkshopId)!} onClose={() => setOpenedWorkshopId(null)} onEnrollRequest={handleEnrollRequest} onGiftRequest={handleGiftRequest} showToast={showToast} />}
            {isPaymentModalOpen && paymentModalIntent && (
                <PaymentModal
                    isOpen={isPaymentModalOpen}
                    onClose={() => { setIsPaymentModalOpen(false); setSubscriptionApiResponse(null); setCharityApiResponse(null); }}
                    onCardPaymentSubmit={() => paymentModalIntent.type === 'payItForward' ? handleCharityPaymentSubmit('CARD') : handlePaymentSubmit('CARD')}
                    onBankPaymentSubmit={() => paymentModalIntent.type === 'payItForward' ? handleCharityPaymentSubmit('BANK_TRANSFER') : handlePaymentSubmit('BANK_TRANSFER')}
                    itemTitle={paymentModalIntent.item.title || paymentModalIntent.item.subject}
                    itemPackageName={paymentModalIntent.pkg?.name}
                    amount={paymentModalIntent.amount || 0}
                    currentUser={currentUser}
                    onRequestLogin={() => { setIsPaymentModalOpen(false); handleLoginClick(false); setPostLoginPaymentIntent(paymentModalIntent); }}
                    paymentType={paymentModalIntent.type}
                    paymentOptions={paymentModalIntent.type === 'payItForward' ? charityApiResponse?.payment_options : subscriptionApiResponse?.payment_options}
                    bankAccount={paymentModalIntent.type === 'payItForward' ? charityApiResponse?.bank_account : subscriptionApiResponse?.bank_account}
                    recipientDetails={paymentModalIntent.recipientDetails}
                    onBack={() => {
                        // Close payment modal
                        setIsPaymentModalOpen(false);
                        // Re-open previous modal based on paymentType
                        if (paymentModalIntent.type === 'workshop') {
                            setOpenedWorkshopId(paymentModalIntent.item.id);
                        } else if (paymentModalIntent.type === 'gift' || paymentModalIntent.type === 'payItForward') {
                            setGiftModalIntent({
                                workshop: paymentModalIntent.item as Workshop,
                                pkg: paymentModalIntent.pkg || (paymentModalIntent.item as Workshop).packages?.[0] || null
                            });
                            setIsGiftModalOpen(true);
                        }
                    }}
                />
            )}
            {isGiftModalOpen && giftModalIntent && (
                <UnifiedGiftModal
                    workshop={giftModalIntent.workshop}
                    selectedPackage={giftModalIntent.pkg}
                    onClose={() => setIsGiftModalOpen(false)}
                    onBack={() => {
                        setIsGiftModalOpen(false);
                        setOpenedWorkshopId(giftModalIntent.workshop.id);
                    }}
                    onProceed={handleGiftProceed}
                    initialData={giftModalIntent.initialData}
                />
            )}
            {isBoutiqueModalOpen && <BoutiqueModal isOpen={isBoutiqueModalOpen} onClose={() => setIsBoutiqueModalOpen(false)} onCheckout={handleCheckout} onRequestLogin={() => handleLoginClick(false)} initialView={boutiqueInitialView} />}
            {isProductCheckoutOpen && (
                <ProductCheckoutModal
                    isOpen={isProductCheckoutOpen}
                    onClose={() => setIsProductCheckoutOpen(false)}
                    onBack={() => {
                        setIsProductCheckoutOpen(false);
                        setBoutiqueInitialView('cart');
                        setIsBoutiqueModalOpen(true);
                    }}
                    onConfirm={() => handleProductOrderConfirm(false)}
                    onCardPaymentConfirm={() => handleProductOrderConfirm(true)}
                    onRequestLogin={() => { setIsProductCheckoutOpen(false); handleLoginClick(false); }}
                    currentUser={currentUser}
                    onOpenPayment={handleOpenPayment}
                />
            )}
            {isProfileOpen && <ProfilePage isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} user={currentUser} onPlayRecording={(w, r) => setWatchData({ workshop: w, recording: r as Recording })} onViewAttachment={(note) => setAttachmentToView(note)} onViewRecommendedWorkshop={(id) => { setIsProfileOpen(false); setOpenedWorkshopId(id); }} showToast={showToast} onPayForConsultation={() => { }} onViewInvoice={(details) => setInvoiceToView(details)} onViewCertificate={(details) => setCertificateToView(details)} onOpenPayment={handleOpenPayment} />}
            {isPaymentFrameOpen && <PaymentFrameModal isOpen={isPaymentFrameOpen} onClose={() => setIsPaymentFrameOpen(false)} url={paymentFrameUrl} />}

            {isVideoModalOpen && <VideoModal isOpen={isVideoModalOpen} onClose={() => setIsVideoModalOpen(false)} />}
            {isPhotoAlbumModalOpen && <PhotoAlbumModal isOpen={isPhotoAlbumModalOpen} onClose={() => setIsPhotoAlbumModalOpen(false)} />}
            {isInstagramModalOpen && <InstagramModal isOpen={isInstagramModalOpen} onClose={() => setIsInstagramModalOpen(false)} />}
            {isConsultationRequestModalOpen && <ConsultationRequestModal isOpen={isConsultationRequestModalOpen} onClose={() => setIsConsultationRequestModalOpen(false)} onSuccess={() => showToast('تم إرسال طلبك بنجاح', 'success')} />}
            {isReviewsModalOpen && <ReviewsModal isOpen={isReviewsModalOpen} onClose={() => setIsReviewsModalOpen(false)} />}
            {isPartnersModalOpen && <PartnersModal isOpen={isPartnersModalOpen} onClose={() => setIsPartnersModalOpen(false)} />}
            {attachmentToView && <AttachmentViewerModal note={attachmentToView} onClose={() => setAttachmentToView(null)} />}
            {/* Removed ZoomRedirectModal in favor of in-app player */}
            {invoiceToView && <InvoiceModal isOpen={!!invoiceToView} onClose={() => setInvoiceToView(null)} user={invoiceToView.user} subscription={invoiceToView.subscription} workshop={workshops.find(w => Number(w.id) === Number(invoiceToView.subscription.workshopId))!} />}
            {certificateToView && currentUser && <CertificateModal isOpen={!!certificateToView} onClose={() => setCertificateToView(null)} user={currentUser} subscription={certificateToView.subscription} workshop={certificateToView.workshop} />}
            {isCvModalOpen && <CvModal isOpen={isCvModalOpen} onClose={() => setIsCvModalOpen(false)} />}
            {isNavigationHubOpen && <NavigationHubModal
                isOpen={isNavigationHubOpen}
                userFullName={currentUser?.fullName}
                onNavigate={(target) => {
                    setIsNavigationHubOpen(false);
                    if (target === 'profile') {
                        if (currentUser) {
                            setIsProfileOpen(true);
                        } else {
                            setReturnToHub(true);
                            setPendingHubAction('profile');
                            handleLoginClick(true);
                        }
                    } else if (target === 'live') {
                        if (currentUser) {
                            processLiveStreamAccess(currentUser);
                        } else {
                            setReturnToHub(true);
                            setPendingHubAction('live');
                            handleLoginClick(true);
                        }
                    } else if (target === 'new') {
                        setCurrentPage(Page.WORKSHOPS);
                        setTimeout(() => handleScrollToSection('workshops_section'), 100);
                    }
                }}
                hasActiveLiveStream={!!activeLiveWorkshop && !!activeLiveWorkshop.zoomLink}
            />}
            {legalModalContent && <LegalModal isOpen={!!legalModalContent} onClose={() => setLegalModalContent(null)} title={legalModalContent.title} content={legalModalContent.content} />}
            <Chatbot />
            <WhatsAppButton />
            <MusicPlayer />
            {watchData && (
                <WatchPage
                    workshop={watchData.workshop}
                    recording={watchData.recording}
                    onBack={() => setWatchData(null)}
                />
            )}
            {toasts.map(t => <Toast key={t.id} message={t.message} type={t.type} onClose={() => setToasts(prev => prev.filter(item => item.id !== t.id))} />)}
        </div>
    );
};

export default PublicApp;
