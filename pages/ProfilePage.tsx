
import React, { useState, useEffect, useRef, useMemo } from 'react';
import AudioPlayer from '../components/AudioPlayer';
import { Workshop, Subscription, User, NoteResource, Recording, ConsultationRequest, SubscriptionStatus } from '../types';
import { CloseIcon, VideoIcon, CalendarIcon, ChevronDownIcon, EyeIcon, AcademicCapIcon, UserCircleIcon, LightBulbIcon, DocumentTextIcon, StarIcon, ChatBubbleLeftRightIcon, CreditCardIcon, ShieldCheckIcon, TrashIcon, PencilIcon, GlobeAltIcon, ReceiptTaxIcon, CheckCircleIcon, InformationCircleIcon, EnvelopeIcon, PhoneIcon, MusicalNoteIcon, ClockIcon } from '../components/icons';
import { useUser } from '../context/UserContext';
import { API_BASE_URL, API_ENDPOINTS } from '../constants';
import { formatArabicDate, formatArabicTime, isWorkshopExpired, toEnglishDigits, parseArabicDateRange, parseWorkshopDateTime } from '../utils';
import { CertificateModal } from '../components/CertificateModal';
import { GoogleGenAI, Type } from '@google/genai';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { PledgeModal } from '../components/PledgeModal';
import { trackEvent } from '../analytics';
import RecordingStatsModal from '../components/RecordingStatsModal';


interface ProfilePageProps {
    isOpen: boolean;
    onClose: () => void;
    onPlayRecording: (workshop: Workshop, recording: Partial<Recording> & { name?: string, url: string }, index?: number) => void;
    onViewAttachment: (note: NoteResource) => void;
    onViewRecommendedWorkshop: (workshopId: number) => void;
    user?: User | null;
    showToast: (message: string, type?: 'success' | 'warning' | 'error') => void;
    onPayForConsultation: (consultation: ConsultationRequest) => void;
    onViewInvoice: (details: { user: User; subscription: Subscription }) => void;
    onViewCertificate: (details: { subscription: Subscription; workshop: Workshop }) => void;
    onOpenPayment: (url?: string) => void;
}

type RecordingStatus = 'AVAILABLE' | 'NOT_YET_AVAILABLE' | 'EXPIRED';
type ProfileView = 'my_workshops' | 'recommendations';

interface RecordingAccess {
    status: RecordingStatus;
    startDate?: string;
    endDate?: string;
}

const checkRecordingAccess = (recording: Recording, subscription: Subscription): RecordingAccess => {
    const now = new Date();

    const override = subscription.recordingAccessOverrides?.[recording.url];

    const startDateString = override?.accessStartDate || recording.accessStartDate;
    const endDateString = override?.accessEndDate || recording.accessEndDate;

    const startDate = startDateString ? new Date(startDateString) : null;
    const endDate = endDateString ? new Date(endDateString) : null;

    // Make sure to compare dates only, ignoring time, by setting hours to 0.
    if (startDate) startDate.setHours(0, 0, 0, 0);

    // Set end date to the very end of the day.
    if (endDate) endDate.setHours(23, 59, 59, 999);

    if (startDate && now < startDate) {
        return { status: 'NOT_YET_AVAILABLE', startDate: startDateString, endDate: endDateString };
    }
    if (endDate && now > endDate) {
        return { status: 'EXPIRED', startDate: startDateString, endDate: endDateString };
    }
    return { status: 'AVAILABLE', startDate: startDateString, endDate: endDateString };
};


type Recommendation = {
    workshop: Workshop;
    reason: string;
};

const AddReviewForm: React.FC<{ workshopId: number; subscriptionId: string; onReviewAdded: () => void }> = ({ workshopId, subscriptionId, onReviewAdded }) => {
    const { currentUser, addReview } = useUser();
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (rating === 0) {
            setError('يرجى اختيار تقييم (من 1 إلى 5 نجوم).');
            return;
        }
        if (!comment.trim()) {
            setError('يرجى كتابة تعليقك.');
            return;
        }
        setError('');
        setIsSubmitting(true);

        try {
            const token = localStorage.getItem('auth_token');
            if (!token) {
                setError('يرجى تسجيل الدخول أولاً');
                setIsSubmitting(false);
                return;
            }

            // Get the raw subscription ID (remove "sub-" prefix if present)
            const rawSubId = String(subscriptionId).startsWith('sub-')
                ? subscriptionId.replace('sub-', '')
                : subscriptionId;

            // Create form data
            const formData = new FormData();
            formData.append('subscription_id', rawSubId);
            formData.append('workshop_id', String(workshopId));
            formData.append('rating', String(rating));
            formData.append('review', comment);



            const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.PROFILE.ADD_REVIEW}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData
            });

            const data = await response.json();


            if (response.ok && data.key === 'success') {
                // Also update local state
                if (currentUser) {
                    addReview(workshopId, {
                        fullName: currentUser.fullName,
                        rating,
                        comment,
                    });
                    trackEvent('add_review', { workshopId, rating }, currentUser);
                }
                onReviewAdded();
                // Reset form
                setRating(0);
                setComment('');
            } else {
                setError(data.msg || 'حدث خطأ أثناء إرسال التقييم');
            }
        } catch (err) {

            setError('حدث خطأ أثناء إرسال التقييم');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="mt-4 pt-4 border-t border-white/20">
            <h5 className="font-bold text-fuchsia-300 mb-3">أضف تقييمك</h5>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">تقييمك:</label>
                    <div className="flex items-center gap-x-1" dir="ltr">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                onClick={() => setRating(star)}
                                className="focus:outline-none"
                                aria-label={`Rate ${star} stars`}
                                disabled={isSubmitting}
                            >
                                <StarIcon
                                    className={`w-8 h-8 transition-colors ${star <= rating ? 'text-yellow-400' : 'text-slate-500 hover:text-yellow-300'
                                        }`}
                                    filled={star <= rating}
                                />
                            </button>
                        ))}
                    </div>
                </div>
                <div>
                    <label htmlFor={`comment-${workshopId}`} className="block text-sm font-medium text-slate-300 mb-2">
                        تعليقك:
                    </label>
                    <textarea
                        id={`comment-${workshopId}`}
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        rows={3}
                        className="w-full p-2 bg-slate-900 border border-slate-600 rounded-md focus:ring-fuchsia-500 focus:border-fuchsia-500 text-sm"
                        placeholder="شاركنا رأيك في الورشة..."
                        disabled={isSubmitting}
                    />
                </div>
                {error && <p className="text-sm text-red-400">{error}</p>}
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-theme-gradient-btn text-white font-bold py-2 px-4 rounded-lg transition-transform transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? 'جاري الإرسال...' : 'إرسال التقييم'}
                </button>
            </form>
        </div>
    );
};


const ProfilePage: React.FC<ProfilePageProps> = ({ isOpen, onClose, user, onZoomRedirect, onPlayRecording, onViewAttachment, onViewRecommendedWorkshop, showToast, onPayForConsultation, onViewInvoice, onViewCertificate, onOpenPayment }) => {
    // REMOVED updateSubscription from destructuring as it's no longer available in UserContextType
    const { workshops, currentUser: loggedInUser, addReview, consultationRequests, globalCertificateTemplate, fetchProfile, payForConsultation } = useUser();

    const [activeView, setActiveView] = useState<ProfileView>('my_workshops');
    const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
    const [isLoadingRecs, setIsLoadingRecs] = useState(false);
    const hasAutoGeneratedRef = useRef(false); // Ref to track if we've already tried auto-generating in this session
    const [expandedId, setExpandedId] = useState<string | number | null>(null);
    const [isCreditHistoryVisible, setIsCreditHistoryVisible] = useState(false);
    const [comingSoonModalWorkshop, setComingSoonModalWorkshop] = useState<Workshop | null>(null);
    const [pendingRecording, setPendingRecording] = useState<{ workshop: Workshop; recording: Recording; index: number } | null>(null);

    // Profile API state
    const [profileData, setProfileData] = useState<any>(null);
    const [isLoadingProfile, setIsLoadingProfile] = useState(false);
    const [isPaying, setIsPaying] = useState<number | null>(null);

    // Fetch profile data from API
    useEffect(() => {
        const fetchProfileData = async () => {
            if (!isOpen) return;

            const token = localStorage.getItem('auth_token');
            if (!token) return;

            setIsLoadingProfile(true);
            setIsLoadingRecs(true);
            try {
                // 1. Fetch suggested workshops (this is specific to this view)
                const suggestedResponse = await fetch(`${API_BASE_URL}${API_ENDPOINTS.PROFILE.SUGGEST_WORKSHOPS}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (suggestedResponse.ok) {
                    const suggestedData = await suggestedResponse.json();
                    if (suggestedData.key === 'success' && Array.isArray(suggestedData.data)) {
                        const suggestedWorkshops = suggestedData.data.map((ws: any) => ({
                            workshop: {
                                id: ws.id,
                                title: ws.title,
                                instructor: ws.teacher || ws.instructor || 'مدرب نوايا',
                                startDate: ws.start_date || new Date().toISOString(),
                                endDate: ws.end_date || undefined,
                                startTime: ws.start_time || '09:00',
                                endTime: ws.end_time || '17:00',
                                location: ws.type_label === 'أونلاين' ? 'أونلاين' :
                                    ws.type_label === 'حضوري' ? 'حضوري' :
                                        ws.type_label === 'مسجلة' ? 'مسجلة' : (ws.type || 'أونلاين'),
                                isRecorded: ws.type_label === 'مسجلة' || ws.type === 'recorded',
                                city: ws.address || ws.city || undefined,
                                isVisible: true,
                                isDeleted: false,
                                topics: ws.topics || [],
                                reviews: [],
                                notes: [],
                                recordings: [],
                                mediaFiles: [],
                                certificatesIssued: false,
                                packages: ws.packages || []
                            },
                            reason: ws.recommendation_reason || 'ورشة مقترحة بناءً على اهتماماتك'
                        }));
                        setRecommendations(suggestedWorkshops);
                    }
                }

                // 2. Fetch the full profile details via the global context method
                const updatedProfile = await fetchProfile();
                if (updatedProfile) {
                    setProfileData(updatedProfile);
                }

            } catch (error) {
                console.error('Error fetching profile data:', error);
            } finally {
                setIsLoadingProfile(false);
                setIsLoadingRecs(false);
            }
        };

        fetchProfileData();
    }, [isOpen]); // Depend ONLY on isOpen to avoid the infinite loop

    const subscriptions = useMemo(() => {
        if (!profileData?.active_subscriptions || !Array.isArray(profileData.active_subscriptions)) return [];

        // Map API subscriptions to our format
        return profileData.active_subscriptions
            .map((sub: any) => {
                if (!sub) return null;
                return {
                    id: `sub-${sub.id}`,
                    workshopId: Number(sub.workshop?.id || sub.workshop_id),
                    activationDate: new Date().toISOString(),
                    expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
                    status: SubscriptionStatus.ACTIVE,
                    isApproved: true,
                    paymentMethod: 'LINK' as const,
                    // Store API data for later use
                    apiData: sub
                };
            })
            .filter(Boolean) as Subscription[];
    }, [profileData]);

    // Create workshops from API data
    const apiWorkshops = useMemo(() => {
        if (!profileData?.active_subscriptions || !Array.isArray(profileData.active_subscriptions)) return [];

        return profileData.active_subscriptions
            .map((sub: any) => {
                if (!sub || !sub.workshop) return null;

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
                    country: sub.workshop.type_label === 'مسجلة' ? (sub.workshop.country || '') : 'المملكة العربية السعودية',
                    notes: sub.files?.map((f: any) => ({ type: 'file' as const, name: f.title, value: f.file })) || [],
                    recordings: sub.recordings?.filter((r: any) => r.is_available).map((r: any) => ({
                        name: r.title,
                        url: r.link,
                        accessStartDate: undefined,
                        accessEndDate: undefined,
                        availability: r.availability
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
    }, [profileData]);

    const availableWorkshops = useMemo(() => {
        return workshops.filter(w => w.isVisible && !w.isDeleted && !subscriptions.some(sub => sub.workshopId === w.id));
    }, [workshops, subscriptions]);

    const isSubscribedToAll = useMemo(() => {
        return workshops.length > 0 && availableWorkshops.length === 0;
    }, [workshops.length, availableWorkshops.length]);

    const userConsultations = useMemo(() => {
        return consultationRequests
            .filter(req => req.userId === user?.id)
            .sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
    }, [consultationRequests, user]);

    const nextLiveSub = useMemo(() => {
        const now = new Date();
        return subscriptions
            .map(sub => ({ sub, workshop: apiWorkshops.find(wk => wk.id === sub.workshopId) }))
            .filter(({ workshop }) => workshop && !workshop.isRecorded)
            .filter(({ workshop }) => {
                const w = workshop!;
                if (w.zoomLink) return true; // Keep if it has a link

                const start = parseWorkshopDateTime(w.startDate, w.startTime);
                const isPassed = isWorkshopExpired(w) || (start.getTime() + 4 * 60 * 60 * 1000 < now.getTime());
                return !isPassed;
            })
            .sort((a, b) => {
                const startA = parseWorkshopDateTime(a.workshop!.startDate, a.workshop!.startTime);
                const startB = parseWorkshopDateTime(b.workshop!.startDate, b.workshop!.startTime);
                return startA.getTime() - startB.getTime();
            })[0]?.sub;
    }, [subscriptions, apiWorkshops]);

    const nextLiveWorkshop = useMemo(() => {
        return nextLiveSub ? apiWorkshops.find(w => w.id === nextLiveSub.workshopId) : null;
    }, [nextLiveSub, apiWorkshops]);

    const sortedSubscriptions = subscriptions;

    const handleGenerateRecs = async () => {
        if (!process.env.API_KEY) {
            showToast('خدمة الاقتراحات الذكية غير مفعلة حالياً.', 'warning');
            return;
        }

        setIsLoadingRecs(true);
        setRecommendations([]);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

            const subscribedWorkshopTitles = subscriptions.map((sub: any) => workshops.find(w => w.id === sub.workshopId)?.title).filter(Boolean);

            if (isSubscribedToAll) {
                setIsLoadingRecs(false);
                return;
            }

            const prompt = `بناءً على الورشات التي اشترك بها المستخدم سابقاً: [${subscribedWorkshopTitles.join(', ')}], رشح له 3 ورشات من القائمة التالية فقط: ${JSON.stringify(availableWorkshops.map(w => ({ id: w.id, title: w.title, topics: w.topics })))}. قدم الاقتراحات كقائمة JSON فقط, بدون أي نص إضافي.`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                workshop_id: { type: Type.NUMBER },
                                reason: { type: Type.STRING }
                            }
                        }
                    }
                }
            });

            const resultJson = JSON.parse(response.text);
            const recs: Recommendation[] = resultJson.map((item: any) => ({
                workshop: workshops.find(w => w.id === item.workshop_id),
                reason: item.reason,
            })).filter((r: any) => r.workshop);

            setRecommendations(recs);
        } catch (error) {
            console.error('Error generating AI recs:', error);
            showToast('حدث خطأ أثناء توليد الاقتراحات.', 'error');
        } finally {
            setIsLoadingRecs(false);
        }
    };

    // Auto-expand the first upcoming live workshop
    useEffect(() => {
        if (isOpen && nextLiveSub) {
            setExpandedId(nextLiveSub.id);
        }
    }, [isOpen, nextLiveSub]);

    useEffect(() => {
        // Reset view when modal is opened for a new user
        if (isOpen) {
            setActiveView('my_workshops');
            hasAutoGeneratedRef.current = false; // Reset auto-gen ref when modal re-opens
            // Removed redundant setRecommendations([]) to prevent clearing fetched data
        }
    }, [user, isOpen]);

    // Automatic AI Recommendation generation
    useEffect(() => {
        if (
            isOpen &&
            activeView === 'recommendations' &&
            recommendations.length === 0 &&
            !isSubscribedToAll &&
            !isLoadingRecs &&
            !hasAutoGeneratedRef.current
        ) {
            hasAutoGeneratedRef.current = true;
            handleGenerateRecs();
        }
    }, [isOpen, activeView, recommendations.length, isLoadingRecs, isSubscribedToAll]);

    const handleReviewAdded = () => {
        showToast('تمت إضافة تقييمك بنجاح!', 'success');
    };

    const handleDownloadCertificate = (workshop: Workshop, sub: Subscription) => {
        onViewCertificate({ subscription: sub, workshop });
    };

    const handleLiveStreamClick = (workshop: Workshop, e?: React.MouseEvent) => {
        e?.stopPropagation(); // Prevent toggling accordion
        if (workshop.zoomLink) {
            onPlayRecording(workshop, { name: 'بث مباشر', url: workshop.zoomLink } as Recording);
        } else {
            setComingSoonModalWorkshop(workshop);
        }
    };

    const handleConsultationPayment = async (consultation: ConsultationRequest) => {
        setIsPaying(consultation.id);

        // Open modal immediately
        onOpenPayment();

        try {
            const result = await payForConsultation(consultation.id);
            if (result.success && result.invoiceUrl) {
                // Update with URL
                onOpenPayment(result.invoiceUrl);
            } else {
                showToast(result.message || 'حدث خطأ أثناء معالجة الدفع', 'error');
            }
        } catch (error) {

            showToast('حدث خطأ غير متوقع', 'error');
        } finally {
            setIsPaying(null);
        }
    };

    if (!isOpen || !user) {
        return null;
    }

    const tabClass = (view: ProfileView) => `py-3 px-4 text-sm font-bold border-b-2 flex items-center gap-x-2 ${activeView === view ? 'text-white border-fuchsia-500' : 'text-slate-400 border-transparent hover:text-white'}`;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-[60] p-4 transition-opacity duration-300" onClick={onClose}>
            <div className="bg-theme-gradient text-slate-200 rounded-lg shadow-2xl w-full max-w-4xl border border-violet-500/50 max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                <header className="p-4 flex justify-between items-center border-b border-violet-500/30 flex-shrink-0">
                    <h2 className="text-xl font-bold text-white">الملف الشخصي</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10"><CloseIcon className="w-6 h-6" /></button>
                </header>

                <div className="p-4 flex items-center gap-x-4 bg-black/10">
                    <UserCircleIcon className="w-12 h-12 text-fuchsia-400 flex-shrink-0" />
                    <div>
                        <h3 className="text-lg font-bold text-white">{user.fullName}</h3>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-x-6 mt-1 text-sm text-slate-300">
                            <div className="flex items-center gap-x-2">
                                <EnvelopeIcon className="w-4 h-4 text-slate-400" />
                                <span>{user.email}</span>
                            </div>
                            {user.phone && (
                                <div className="flex items-center gap-x-2">
                                    <PhoneIcon className="w-4 h-4 text-slate-400" />
                                    <span>{user.phone}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="border-b border-slate-700/50 flex-shrink-0">
                    <nav className="flex space-x-4 px-6">
                        <button onClick={() => setActiveView('my_workshops')} className={tabClass('my_workshops')}><AcademicCapIcon className="w-5 h-5" /><span>ورشاتي واستشاراتي</span></button>
                        <button onClick={() => setActiveView('recommendations')} className={tabClass('recommendations')}><LightBulbIcon className="w-5 h-5" /><span>ورشات مقترحة لك</span></button>
                    </nav>
                </div>

                <div className="flex-grow overflow-y-auto p-6 space-y-8">
                    {activeView === 'my_workshops' ? (
                        <>
                            {/* Hero Section: Next Live Workshop */}
                            {nextLiveWorkshop && (
                                <div className="mb-6 p-6 bg-gradient-to-r from-purple-900 to-fuchsia-900 rounded-2xl border border-fuchsia-500 shadow-[0_0_30px_rgba(219,39,119,0.3)] relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-fuchsia-500/20 rounded-full blur-3xl -z-10 group-hover:bg-fuchsia-500/30 transition-all duration-700"></div>

                                    <div className="flex flex-col md:flex-row justify-between items-center gap-6 relative z-10">
                                        <div className="text-center md:text-right">
                                            <div className="inline-flex items-center gap-2 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold mb-3 animate-pulse shadow-lg">
                                                <span className="w-2 h-2 bg-white rounded-full"></span>
                                                بث مباشر قادم
                                            </div>
                                            <h3 className="text-2xl font-black text-white mb-2">{nextLiveWorkshop.title}</h3>
                                            <div className="text-fuchsia-200 text-sm mb-4 space-y-1">
                                                <div className="flex items-center justify-center md:justify-start gap-2 font-bold">
                                                    <CalendarIcon className="w-4 h-4" />
                                                    <span>
                                                        {formatArabicTime(nextLiveWorkshop.startTime)} | {formatArabicDate(nextLiveWorkshop.startDate)}
                                                    </span>
                                                </div>
                                                <p className="text-xs font-black text-fuchsia-400 text-center md:text-right">
                                                    (بتوقيت دولة الإمارات العربية المتحدة)
                                                </p>
                                            </div>
                                        </div>

                                        {nextLiveWorkshop && (
                                            <button
                                                onClick={(e) => handleLiveStreamClick(nextLiveWorkshop, e)}
                                                className="w-full md:w-auto bg-white text-fuchsia-800 font-black py-3 px-8 rounded-xl hover:bg-fuchsia-50 transition-all transform hover:scale-105 shadow-xl flex items-center justify-center gap-2"
                                            >
                                                <VideoIcon className="w-6 h-6" />
                                                دخول البث الآن
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Coming Soon Modal - Shared Alert */}
                            {comingSoonModalWorkshop && (
                                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-[100] p-4" onClick={() => setComingSoonModalWorkshop(null)}>
                                    <div className="bg-gradient-to-br from-[#270e4f] to-[#5b21b6] border border-white/20 rounded-2xl w-full max-w-sm p-6 text-center shadow-2xl transform transition-all" onClick={e => e.stopPropagation()}>
                                        <div className="flex justify-between items-center mb-6">
                                            <span className="text-white font-bold opacity-60">تنبيه</span>
                                            <button onClick={() => setComingSoonModalWorkshop(null)} className="text-white/60 hover:text-white"><CloseIcon className="w-5 h-5" /></button>
                                        </div>
                                        <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
                                            <InformationCircleIcon className="w-10 h-10 text-white" />
                                        </div>
                                        <h3 className="text-xl font-bold text-white mb-2">رابط البث المباشر سيظهر هنا قريباً</h3>
                                        <p className="text-sm text-slate-300 mb-6 font-bold leading-relaxed">
                                            سيتم تفعيل رابط البث قبل موعد الورشة
                                        </p>
                                        <div className="flex flex-col items-center gap-1 mt-4">
                                            <span className="text-white font-bold">{formatArabicDate(comingSoonModalWorkshop.startDate)} الساعة {formatArabicTime(comingSoonModalWorkshop.startTime)}</span>
                                            <p className="text-xs text-fuchsia-400 font-black">
                                                (بتوقيت دولة الإمارات العربية المتحدة)
                                            </p>
                                        </div>

                                        <button
                                            onClick={() => setComingSoonModalWorkshop(null)}
                                            className="w-full bg-sky-500 hover:bg-sky-400 text-white font-bold py-2 rounded-lg transition-colors"
                                        >
                                            حسناً
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Subscribed Workshops List */}
                            {sortedSubscriptions.length > 0 && (
                                <section>
                                    <h3 className="text-base font-bold text-fuchsia-300 mb-4">كل الورش ({sortedSubscriptions.length})</h3>
                                    <div className="flex flex-col space-y-4">
                                        {sortedSubscriptions.map((sub, index) => {
                                            const workshop = apiWorkshops.find(w => w.id === sub.workshopId);
                                            if (!workshop) return null;

                                            const hasReview = workshop.reviews?.some(r => r.fullName === user.fullName);
                                            // Allow review if user hasn't reviewed yet, regardless of expiry for now
                                            const canAddReview = !hasReview;
                                            const isExpanded = expandedId === sub.id;

                                            let dateValue;
                                            if (workshop.isRecorded) {
                                                dateValue = null;
                                            } else {
                                                dateValue = workshop.endDate
                                                    ? `من ${formatArabicDate(workshop.startDate)} إلى ${formatArabicDate(workshop.endDate)}`
                                                    : formatArabicDate(workshop.startDate);
                                            }

                                            let locationValue: string;
                                            if (workshop.location === 'حضوري' || workshop.location === 'أونلاين وحضوري') {
                                                locationValue = [workshop.hotelName, workshop.city, workshop.country].filter(Boolean).join(', ');
                                            } else if (workshop.location === 'أونلاين') {
                                                locationValue = workshop.application ? `أونلاين عبر ${workshop.application}` : 'أونلاين';
                                            } else { // مسجلة
                                                locationValue = workshop.location;
                                            }

                                            const showLiveStreamButton = !isWorkshopExpired(workshop) && (
                                                workshop.location === 'أونلاين' ||
                                                (workshop.location === 'أونلاين وحضوري' && sub.attendanceType === 'أونلاين')
                                            );

                                            return (
                                                <div key={sub.id} className={`bg-black/20 rounded-xl overflow-hidden border-2 transition-all duration-300 ${isExpanded ? 'border-fuchsia-500/50 shadow-lg shadow-fuchsia-500/10' : 'border-slate-700/50 hover:border-fuchsia-500/30'}`}>
                                                    {/* Header Row */}
                                                    <div className="w-full p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:bg-fuchsia-500/10 transition-colors cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : sub.id)}>
                                                        <div className="flex flex-col gap-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-bold text-white text-lg">{workshop.title}</span>
                                                                {/* Date Next to Title (if available) - Requested */}
                                                                {/* Date removed as requested to avoid duplication */}
                                                                {showLiveStreamButton && (
                                                                    <span className="inline-flex items-center gap-1 bg-red-600 text-white text-[10px] px-2 py-0.5 rounded-full animate-pulse">LIVE</span>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-2 text-xs text-slate-400">
                                                                <CalendarIcon className="w-3 h-3" />
                                                                <span>
                                                                    {workshop.isRecorded ? 'ورشة مسجلة' : (
                                                                        <>
                                                                            من: {formatArabicDate(workshop.startDate)}
                                                                            {workshop.endDate && ` - إلى: ${formatArabicDate(workshop.endDate)}`}
                                                                        </>
                                                                    )}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                                                            {/* Direct Live Button - Visible when collapsed too! */}
                                                            {showLiveStreamButton && (
                                                                <button
                                                                    onClick={(e) => handleLiveStreamClick(workshop, e)}
                                                                    className="flex items-center gap-1.5 bg-gradient-to-r from-purple-700 to-pink-600 hover:from-purple-600 hover:to-pink-500 text-white font-bold py-1.5 px-4 rounded-lg shadow-lg text-xs transition-transform transform hover:scale-105 border border-white/20"
                                                                >
                                                                    <VideoIcon className="w-4 h-4" />
                                                                    <span>دخول البث</span>
                                                                </button>
                                                            )}

                                                            {sub.attended && (
                                                                <span className="flex items-center gap-x-1 text-green-400 text-xs font-bold" title="تم الحضور">
                                                                    <CheckCircleIcon className="w-5 h-5" />
                                                                </span>
                                                            )}
                                                            <ChevronDownIcon className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                                                        </div>
                                                    </div>

                                                    <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isExpanded ? 'max-h-[1500px]' : 'max-h-0'}`}>
                                                        <div className="p-4 space-y-6 border-t-2 border-slate-700/50">
                                                            <div>
                                                                <h4 className="text-sm font-bold text-fuchsia-300 mb-3 text-right">تفاصيل الورشة</h4>
                                                                <div className="space-y-3 text-sm text-slate-300 bg-black/20 p-3 rounded-md">
                                                                    {!workshop.isRecorded && dateValue && (
                                                                        <div className="flex items-center justify-start gap-x-3">
                                                                            <CalendarIcon className="w-5 h-5 text-fuchsia-400 flex-shrink-0" />
                                                                            <p className="font-semibold text-white">{dateValue}</p>
                                                                        </div>
                                                                    )}
                                                                    <div className="flex items-center justify-start gap-x-3">
                                                                        <GlobeAltIcon className="w-5 h-5 text-fuchsia-400 flex-shrink-0" />
                                                                        <p className="font-semibold text-white">{locationValue}</p>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div>
                                                                <h4 className="text-sm font-bold text-fuchsia-300 mb-3 text-right">محتويات الورشة</h4>
                                                                <div className="space-y-4">
                                                                    {showLiveStreamButton && (
                                                                        <div>
                                                                            <button
                                                                                onClick={(e) => handleLiveStreamClick(workshop, e)}
                                                                                className="w-full flex items-center gap-x-4 p-4 text-right rounded-lg bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-800 hover:to-slate-800 border border-fuchsia-500/30 hover:border-fuchsia-500 transition-all duration-300 transform hover:scale-[1.01] group shadow-lg"
                                                                            >
                                                                                <div className="w-12 h-12 flex items-center justify-center rounded-full bg-red-500/20 text-red-400 flex-shrink-0 group-hover:bg-red-500/30 transition-colors animate-pulse">
                                                                                    <VideoIcon className="w-6 h-6" />
                                                                                </div>
                                                                                <div className="flex-grow">
                                                                                    <span className="font-bold text-white text-base group-hover:text-fuchsia-300 transition-colors">
                                                                                        الدخول إلى البث المباشر عبر ZOOM
                                                                                    </span>
                                                                                    <p className="text-xs text-slate-400 mt-1">اضغط هنا للانضمام للقاعة</p>
                                                                                </div>
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                    {workshop.recordings?.map((rec, index) => {
                                                                        const access = checkRecordingAccess(rec, sub);
                                                                        const disabled = access.status !== 'AVAILABLE';

                                                                        let dateString = '';
                                                                        if (rec.availability) {
                                                                            dateString = rec.availability;
                                                                        } else if (access.status === 'NOT_YET_AVAILABLE' && access.startDate) {
                                                                            dateString = `سيكون متاحاً في: ${formatArabicDate(access.startDate)}`;
                                                                        } else if (access.status === 'EXPIRED' && access.endDate) {
                                                                            dateString = `انتهت صلاحية المشاهدة في: ${formatArabicDate(access.endDate)}`;
                                                                        } else if (access.status === 'AVAILABLE') {
                                                                            if (access.startDate && access.endDate) {
                                                                                dateString = `متاح من ${formatArabicDate(access.startDate)} إلى ${formatArabicDate(access.endDate)}`;
                                                                            } else if (access.endDate) {
                                                                                dateString = `متاح حتى: ${formatArabicDate(access.endDate)}`;
                                                                            } else {
                                                                                dateString = "متاح للمشاهدة";
                                                                            }
                                                                        }

                                                                        return (
                                                                            <div key={index} className="w-full">
                                                                                <button
                                                                                    onClick={() => setPendingRecording({ workshop, recording: rec, index })}
                                                                                    disabled={disabled}
                                                                                    className="w-full flex items-center gap-x-4 p-4 text-right rounded-lg bg-slate-800/70 hover:bg-slate-800 border border-transparent hover:border-purple-500/50 transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed group shadow-lg"
                                                                                >
                                                                                    <div className="w-12 h-12 flex items-center justify-center rounded-full bg-purple-500/10 text-purple-400 flex-shrink-0 group-hover:bg-purple-500/20 transition-colors">
                                                                                        <VideoIcon className="w-6 h-6" />
                                                                                    </div>
                                                                                    <div className="flex-grow flex flex-col items-start text-right">
                                                                                        <span className="font-bold text-white text-base group-hover:text-purple-300 transition-colors">
                                                                                            مشاهدة: {rec.name}
                                                                                        </span>
                                                                                        {dateString && (
                                                                                            <div className="mt-1.5 text-[11px] text-yellow-400/90 flex items-center gap-x-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                                                                                                <CalendarIcon className="w-3.5 h-3.5 flex-shrink-0" />
                                                                                                <span className="font-medium">{dateString}</span>
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                </button>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                    {workshop.notes?.map((note, index) => (
                                                                        <button
                                                                            key={index}
                                                                            onClick={() => {
                                                                                const isPdf = /\.pdf$/i.test(note.name) || note.name.toLowerCase().includes('pdf');
                                                                                if (isPdf) {
                                                                                    const link = document.createElement('a');
                                                                                    link.href = note.value;
                                                                                    link.download = note.name;
                                                                                    document.body.appendChild(link);
                                                                                    link.click();
                                                                                    document.body.removeChild(link);
                                                                                } else {
                                                                                    onViewAttachment(note);
                                                                                }
                                                                            }}
                                                                            className="w-full flex items-center gap-x-4 p-4 text-right rounded-lg bg-slate-800/70 hover:bg-slate-800 border border-transparent hover:border-green-500/50 transition-all duration-300 transform hover:scale-[1.02] group"
                                                                        >
                                                                            <div className="w-12 h-12 flex items-center justify-center rounded-full bg-green-500/10 text-green-400 flex-shrink-0 group-hover:bg-green-500/20 transition-colors"><DocumentTextIcon className="w-6 h-6" /></div>
                                                                            <div className="flex-grow"><span className="font-bold text-white text-base group-hover:text-green-300 transition-colors">{note.name}</span></div>
                                                                        </button>
                                                                    ))}
                                                                    {workshop.mediaFiles && workshop.mediaFiles.length > 0 && workshop.mediaFiles.map((media, index) => (
                                                                        <div key={index} className="p-4 rounded-lg bg-slate-800/70 border border-transparent hover:border-teal-500/50 transition-colors duration-300">
                                                                            <div className="w-full flex items-center gap-x-4 text-right">
                                                                                <div className="w-12 h-12 flex items-center justify-center rounded-full bg-teal-500/10 text-teal-400 flex-shrink-0">
                                                                                    {media.type === 'audio' ? <MusicalNoteIcon className="w-6 h-6" /> : <VideoIcon className="w-6 h-6" />}
                                                                                </div>
                                                                                <div className="flex-grow"><span className="font-bold text-white text-base">{media.name}</span></div>
                                                                            </div>
                                                                            <div className="mt-3 px-1">
                                                                                {(media.type === 'audio' || media.value?.toLowerCase().endsWith('.mp3') || media.value?.toLowerCase().endsWith('.m4a') || media.value?.toLowerCase().endsWith('.wav')) ? (
                                                                                    <AudioPlayer key={index} src={media.value} className="w-full" />
                                                                                ) : (
                                                                                    <video controls controlsList="nodownload" onContextMenu={(e: React.MouseEvent) => e.preventDefault()} src={media.value} className="w-full rounded-md">متصفحك لا يدعم تشغيل الفيديو.</video>
                                                                                )}
                                                                            </div>
                                                                            {media.notes && (
                                                                                <p className="mt-2 text-sm text-slate-400 whitespace-pre-wrap px-1">{media.notes}</p>
                                                                            )}
                                                                        </div>
                                                                    ))}
                                                                    {workshop.certificatesIssued && (
                                                                        <button onClick={() => handleDownloadCertificate(workshop, sub)} className="w-full flex items-center gap-x-4 p-4 text-right rounded-lg bg-slate-800/70 hover:bg-slate-800 border border-transparent hover:border-yellow-500/50 transition-all duration-300 transform hover:scale-[1.02] group">
                                                                            <div className="w-12 h-12 flex items-center justify-center rounded-full bg-yellow-500/10 text-yellow-400 flex-shrink-0 group-hover:bg-yellow-500/20 transition-colors"><AcademicCapIcon className="w-6 h-6" /></div>
                                                                            <div className="flex-grow"><span className="font-bold text-white text-base group-hover:text-yellow-300 transition-colors">الحصول على شهادة إتمام الورشة</span></div>
                                                                        </button>
                                                                    )}
                                                                    <button onClick={() => onViewInvoice({ user, subscription: sub })} className="w-full flex items-center gap-x-4 p-4 text-right rounded-lg bg-slate-800/70 hover:bg-slate-800 border border-transparent hover:border-teal-500/50 transition-all duration-300 transform hover:scale-[1.02] group">
                                                                        <div className="w-12 h-12 flex items-center justify-center rounded-full bg-teal-500/10 text-teal-400 flex-shrink-0 group-hover:bg-teal-500/20 transition-colors"><ReceiptTaxIcon className="w-6 h-6" /></div>
                                                                        <div className="flex-grow"><span className="font-bold text-white text-base group-hover:text-teal-300 transition-colors">عرض الفاتورة الضريبية</span></div>
                                                                    </button>
                                                                </div>
                                                            </div>

                                                            {canAddReview && <AddReviewForm workshopId={workshop.id} subscriptionId={sub.id} onReviewAdded={handleReviewAdded} />}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </section>
                            )}

                            {userConsultations.length > 0 && (
                                <section>
                                    <h3 className="text-base font-bold text-fuchsia-300 mb-4">طلبات الاستشارة ({userConsultations.length})</h3>
                                    <div className="space-y-3">
                                        {userConsultations.map(req => {
                                            const statusClasses: Record<string, string> = {
                                                'جديد': 'bg-yellow-500/20 text-yellow-300',
                                                'بانتظار الدفع': 'bg-sky-500/20 text-sky-300',
                                                'بإنتظار الدفع': 'bg-sky-500/20 text-sky-300',
                                                'بانتظار التأكيد': 'bg-amber-500/20 text-amber-300',
                                                'بإنتظار التأكيد': 'bg-amber-500/20 text-amber-300',
                                                'مدفوع': 'bg-teal-500/20 text-teal-300',
                                                'مكتمل': 'bg-green-500/20 text-green-300',
                                                // Legacy mapping
                                                'NEW': 'bg-yellow-500/20 text-yellow-300',
                                                'APPROVED': 'bg-sky-500/20 text-sky-300',
                                                'PENDING_PAYMENT': 'bg-amber-500/20 text-amber-300',
                                                'PAID': 'bg-teal-500/20 text-teal-300',
                                                'COMPLETED': 'bg-green-500/20 text-green-300',
                                            };
                                            const statusNames: Record<string, string> = {
                                                'جديد': 'جديد',
                                                'بانتظار الدفع': 'بانتظار الدفع',
                                                'بإنتظار الدفع': 'بانتظار الدفع',
                                                'بانتظار التأكيد': 'بانتظار التأكيد',
                                                'بإنتظار التأكيد': 'بانتظار التأكيد',
                                                'مدفوع': 'مدفوع',
                                                'مكتمل': 'مكتمل',
                                                // Legacy mapping
                                                'NEW': 'جديد',
                                                'APPROVED': 'بانتظار الدفع',
                                                'PENDING_PAYMENT': 'بانتظار التأكيد',
                                                'PAID': 'مدفوع',
                                                'COMPLETED': 'مكتمل',
                                            };
                                            return (
                                                <div key={req.id} className="bg-black/20 p-4 rounded-lg border border-slate-700/50">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <p className="font-bold text-white truncate max-w-sm">موضوع: {req.message || req.subject}</p>
                                                            <p className="text-xs text-slate-400">تاريخ الطلب: {formatArabicDate(req.requestedAt)}</p>
                                                        </div>
                                                        <span className={`px-2 py-1 text-xs font-bold rounded-full ${statusClasses[req.status] || 'bg-slate-500/20 text-slate-300'}`}>{statusNames[req.status] || req.status}</span>
                                                    </div>
                                                    {
                                                        (req.status === 'APPROVED' || req.status === 'PAID' || req.status === 'بانتظار الدفع' || req.status === 'بإنتظار الدفع' || req.status === 'مدفوع') && req.consultationDate && req.consultationTime && (
                                                            <div className="mt-3 pt-3 border-t border-slate-700 text-sm">
                                                                <p className="font-bold">موعدك المحدد:</p>
                                                                <div className="flex items-center justify-start gap-2 text-slate-300">
                                                                    <span className="font-semibold">{formatArabicDate(req.consultationDate)} - الساعة {formatArabicTime(req.consultationTime)}</span>
                                                                    <div className="flex items-center gap-2 bg-white/10 px-2.5 py-1.5 rounded-lg border border-white/20">
                                                                        <span className="text-sm">🇦🇪</span>
                                                                        <span className="text-xs font-black text-slate-300">UAE</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )
                                                    }
                                                    {
                                                        (req.status === 'APPROVED' || req.status === 'بانتظار الدفع' || req.status === 'بإنتظار الدفع') && (
                                                            <div className="mt-4 text-center">
                                                                <button
                                                                    onClick={() => handleConsultationPayment(req)}
                                                                    disabled={isPaying === req.id}
                                                                    className="bg-theme-gradient-btn text-white font-bold py-2 px-6 rounded-lg text-sm disabled:opacity-50 flex items-center justify-center gap-2 mx-auto"
                                                                >
                                                                    {isPaying === req.id ? 'جاري التحويل...' : `إتمام الدفع (رسوم ${req.fee} درهم)`}
                                                                </button>
                                                            </div>
                                                        )
                                                    }
                                                </div>
                                            );
                                        })}
                                    </div>
                                </section>
                            )}

                        </>
                    ) : (
                        <section>
                            {isLoadingRecs ? (
                                <div className="flex flex-col items-center justify-center p-12 space-y-4">
                                    <div className="w-12 h-12 border-4 border-fuchsia-500/30 border-t-fuchsia-500 rounded-full animate-spin"></div>
                                    <p className="text-slate-400 font-bold">جاري البحث عن أفضل الورشات لك...</p>
                                </div>
                            ) : recommendations.length > 0 ? (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center mb-2">
                                        <h3 className="text-lg font-bold text-white">اقترحات ذكية مخصصة</h3>
                                        <button
                                            onClick={handleGenerateRecs}
                                            disabled={isLoadingRecs}
                                            className="text-xs bg-white/5 hover:bg-white/10 px-3 py-1 rounded-full border border-white/10 transition-colors text-slate-300"
                                        >
                                            تحديث الاقتراحات
                                        </button>
                                    </div>
                                    {recommendations.map((rec, index) => (
                                        <div key={index} className="bg-black/20 p-4 rounded-lg border border-slate-700/50 hover:border-fuchsia-500/50 transition-all group">
                                            <div className="flex justify-between items-start">
                                                <h4 className="font-bold text-white group-hover:text-fuchsia-400 transition-colors">{rec.workshop.title}</h4>
                                                <span className="text-[10px] bg-fuchsia-500/20 text-fuchsia-300 px-2 py-0.5 rounded-full font-bold">مقترح</span>
                                            </div>
                                            <p className="text-sm text-slate-400 mt-1 flex items-center gap-2">
                                                <UserCircleIcon className="w-4 h-4 opacity-70" />
                                                المدرب: {rec.workshop.instructor}
                                            </p>
                                            <p className="text-sm text-slate-400 flex items-center gap-2">
                                                <GlobeAltIcon className="w-4 h-4 opacity-70" />
                                                النوع: {rec.workshop.location}
                                            </p>
                                            <blockquote className="mt-3 border-r-4 border-fuchsia-500/50 pr-4 text-xs italic text-slate-400 leading-relaxed">
                                                {rec.reason}
                                            </blockquote>
                                            <div className="text-left mt-4">
                                                <button
                                                    onClick={() => onViewRecommendedWorkshop(rec.workshop.id)}
                                                    className="bg-theme-gradient-btn text-white text-xs font-bold py-1.5 px-4 rounded-full shadow-lg shadow-fuchsia-500/20 transform hover:scale-105 transition-all"
                                                >
                                                    عرض التفاصيل والاشتراك
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : isSubscribedToAll ? (
                                <div className="text-center p-12 bg-gradient-to-br from-fuchsia-900/40 to-purple-900/40 rounded-2xl border border-fuchsia-500/30 shadow-xl shadow-fuchsia-500/10 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-fuchsia-500/10 rounded-full blur-3xl -z-10"></div>
                                    <div className="w-20 h-20 bg-theme-gradient-btn rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-fuchsia-500/40">
                                        <CheckCircleIcon className="w-10 h-10 text-white" />
                                    </div>
                                    <h3 className="text-2xl font-black text-white mb-3 tracking-tight">أنت بطل شغوف بالعلم!</h3>
                                    <p className="text-slate-300 max-w-sm mx-auto leading-relaxed font-medium">
                                        لقد أتممت الاشتراك في جميع الورش المتاحة حالياً. بصمتك التعليمية تكتمل، ونحن الآن نجهز لك حزمة جديدة من المعرفة والمهارات.
                                    </p>
                                    <div className="mt-8 flex justify-center">
                                        <span className="px-4 py-2 bg-white/5 rounded-full border border-white/10 text-fuchsia-300 text-xs font-bold animate-pulse">
                                            ترقّب الورش القادمة قريباً
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center p-12 bg-black/20 rounded-2xl border border-dashed border-slate-700/50">
                                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <LightBulbIcon className="w-8 h-8 text-fuchsia-400/50" />
                                    </div>
                                    <h3 className="text-lg font-bold text-white">ورشات مقترحة لك</h3>
                                    <p className="text-sm text-slate-400 my-4 max-w-xs mx-auto">لم نجد حالياً أي ورشات مقترحة لك من النظام. هل تود استخدام الذكاء الاصطناعي لتوليد اقتراحات مخصصة؟</p>
                                    <button
                                        onClick={handleGenerateRecs}
                                        disabled={isLoadingRecs}
                                        className="bg-theme-gradient-btn text-white font-bold py-2.5 px-8 rounded-xl shadow-xl shadow-fuchsia-500/30 transform hover:scale-105 transition-all flex items-center gap-2 mx-auto"
                                    >
                                        <LightBulbIcon className="w-5 h-5" />
                                        توليد اقتراحات ذكية الآن
                                    </button>
                                </div>
                            )}
                        </section>
                    )}

                </div>
            </div>

            {
                comingSoonModalWorkshop && (
                    <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-[70] p-4" onClick={() => setComingSoonModalWorkshop(null)}>
                        <div
                            className="bg-theme-gradient text-slate-200 rounded-lg shadow-2xl w-full max-w-md border border-sky-500/50 relative flex flex-col text-center animate-chatbot-in"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <header className="p-4 flex justify-between items-center border-b border-sky-500/30">
                                <h2 className="text-lg font-bold text-sky-300">تنبيه</h2>
                                <button onClick={() => setComingSoonModalWorkshop(null)} className="p-2 rounded-full hover:bg-white/10"><CloseIcon className="w-6 h-6" /></button>
                            </header>
                            <div className="p-8 space-y-4">
                                <InformationCircleIcon className="w-16 h-16 mx-auto text-theme-secondary-accent" />
                                <h3 className="text-xl font-bold text-white">رابط البث المباشر سيظهر هنا قريباً</h3>
                                <p className="text-sm text-slate-300 mb-6 font-bold leading-relaxed">
                                    سيتم تفعيل رابط البث قبل موعد الورشة
                                </p>
                                <p className="text-sm text-slate-300 mb-6 font-bold leading-relaxed">
                                    <div className="flex items-center justify-center gap-2">
                                        <span>{formatArabicDate(comingSoonModalWorkshop.startDate)} الساعة {formatArabicTime(comingSoonModalWorkshop.startTime)}</span>
                                        <div className="flex items-center gap-2 bg-white/10 px-2.5 py-1.5 rounded-lg border border-white/20">
                                            <span className="text-sm">🇦🇪</span>
                                            <span className="text-xs font-black text-slate-300">UAE</span>
                                        </div>
                                    </div>
                                </p>
                                <button onClick={() => setComingSoonModalWorkshop(null)} className="mt-4 bg-sky-600 hover:bg-sky-500 text-white font-bold py-2 px-6 rounded-lg text-sm">
                                    حسناً
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {
                pendingRecording && (
                    <PledgeModal
                        isOpen={!!pendingRecording}
                        onClose={() => setPendingRecording(null)}
                        onAccept={() => {
                            onPlayRecording(pendingRecording.workshop, pendingRecording.recording, pendingRecording.index);
                            setPendingRecording(null);
                            onClose(); // Close the profile page so the video player is visible
                        }}
                        workshopTitle={pendingRecording.workshop.title}
                    />
                )
            }

            <style>{`.z-70 { z-index: 70; }`}</style>
        </div >
    );
};

export default ProfilePage;
