
import React, { useState, useEffect, useMemo } from 'react';
import { Workshop, Package, SubscriptionStatus } from '../types';
import { CloseIcon, EyeIcon, AcademicCapIcon, GiftIcon, CalendarIcon, HeartIcon } from './icons';
import { useUser } from '../context/UserContext';
import { formatArabicDate, isWorkshopExpired } from '../utils';
import { trackEvent } from '../analytics';

interface WorkshopDetailsModalProps {
    workshop: Workshop;
    onClose: () => void;
    onEnrollRequest: (workshop: Workshop, selectedPackage: Package | null) => void;
    onGiftRequest: (workshop: Workshop, selectedPackage: Package | null) => void;
    // onPayItForwardRequest removed as it's merged into onGiftRequest
    showToast: (message: string, type?: 'success' | 'warning' | 'error') => void;
}

const WorkshopDetailsModal: React.FC<WorkshopDetailsModalProps> = ({ workshop, onClose, onEnrollRequest, onGiftRequest, showToast }) => {
    const { currentUser, drhopeData, fetchWorkshopDetails } = useUser();
    const [details, setDetails] = useState<Workshop | null>(null);

    const activeWorkshop = details || workshop;
    const allPackages = activeWorkshop.packages || [];
    const activePackages = useMemo(() => {
        return allPackages.filter(pkg => pkg.isActive !== false);
    }, [allPackages]);

    // Update selected package when activePackages change
    useEffect(() => {
        if (activePackages.length > 0) {
            // Find currently selected package in new packages list to preserve selection if possible
            const currentId = selectedPackage?.id;
            const isCurrentActive = activePackages.some(p => p.id === currentId);

            if (!isCurrentActive) {
                setSelectedPackage(activePackages[0]);
            }
        } else if (allPackages.length > 0) {
            // If none are active, maybe select the first one but it will be disabled
            setSelectedPackage(null);
        }
    }, [activePackages, allPackages]);

    const [selectedPackage, setSelectedPackage] = useState<Package | null>(() => {
        const initialActive = allPackages.filter(pkg => pkg.isActive !== false);
        return initialActive[0] || null;
    });

    useEffect(() => {
        trackEvent('view_workshop_details', { workshopId: workshop.id, workshopTitle: workshop.title }, currentUser || undefined);

        // Fetch full details
        fetchWorkshopDetails(workshop.id).then(data => {
            if (data) setDetails(data);
        });
    }, [workshop.id]);

    const handleEnrollClick = () => {
        if (!selectedPackage || selectedPackage.isActive === false) {
            showToast('نعتذر، انتهت فترة التسجيل في هذه الباقة.', 'error');
            return;
        }

        // FIX: Ensure donation records don't block user from subscribing for themselves
        const isSubscribed = currentUser?.subscriptions.some(
            sub => sub.workshopId === workshop.id &&
                sub.status !== SubscriptionStatus.REFUNDED &&
                !sub.isPayItForwardDonation
        );

        if (isSubscribed) {
            showToast('أنت مشترك بالفعل في هذه الورشة.', 'warning');
            return;
        }

        onEnrollRequest(activeWorkshop, selectedPackage);
    };

    const handleGiftClick = () => {
        if (!selectedPackage || selectedPackage.isActive === false) {
            showToast('نعتذر، انتهت فترة التسجيل في هذه الباقة.', 'error');
            return;
        }
        onGiftRequest(activeWorkshop, selectedPackage);
    };

    const handlePackageSelect = (pkg: Package) => {
        if (pkg.isActive === false) {
            showToast('نعتذر، انتهت فترة التسجيل في هذه الباقة.', 'error');
            return;
        }
        setSelectedPackage(pkg);
    }

    const dateDisplay = activeWorkshop.date_range || (activeWorkshop.endDate
        ? `من ${formatArabicDate(activeWorkshop.startDate)} إلى ${formatArabicDate(activeWorkshop.endDate)}`
        : formatArabicDate(activeWorkshop.startDate));

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4">
            <div
                className="bg-theme-gradient text-slate-200 rounded-2xl shadow-2xl w-full max-w-2xl border border-violet-500/50 max-h-[90vh] flex flex-col relative card-animated-border"
                style={{ '--glow-color': 'var(--color-text-accent)' } as React.CSSProperties}
            >
                <header className="p-4 flex justify-between items-center border-b border-violet-500/30 flex-shrink-0">
                    <h2 className="text-lg font-bold text-white truncate pr-4">{activeWorkshop.title}</h2>
                    <button
                        onClick={onClose}
                        aria-label="إغلاق النافذة"
                        className="text-slate-300 bg-slate-800/70 hover:bg-fuchsia-500/80 hover:text-white rounded-full p-2 transition-all duration-300 transform hover:scale-110 shadow-lg border border-slate-600 hover:border-fuchsia-400 flex-shrink-0">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </header>

                <div className="flex-grow overflow-y-auto p-3 sm:p-6">
                    <div className="mb-6 p-4 bg-black/20 rounded-lg flex items-center gap-x-6 border border-slate-700">
                        <CalendarIcon className="w-12 h-12 text-fuchsia-400 flex-shrink-0" />
                        <div>
                            <h3 className="text-sm font-bold text-slate-400">تاريخ الورشة</h3>
                            <p className="text-lg font-bold text-white">{dateDisplay}</p>
                        </div>
                    </div>

                    {activeWorkshop.subject_of_discussion && (
                        <div className="my-6 p-4 bg-black/20 rounded-lg prose prose-invert max-w-none">
                            <h3 className="text-sm font-bold mb-3 text-fuchsia-400 flex items-center gap-x-2"><AcademicCapIcon className="w-5 h-5" /> موضوع النقاش</h3>
                            <div className="text-slate-200 text-sm sm:text-base" dangerouslySetInnerHTML={{ __html: activeWorkshop.subject_of_discussion }} />
                        </div>
                    )}

                    {activeWorkshop.description && (
                        <div className="my-6 p-4 bg-black/20 rounded-lg">
                            <h3 className="text-sm font-bold mb-3 text-fuchsia-400 flex items-center gap-x-2"><AcademicCapIcon className="w-5 h-5" /> عن الورشة</h3>
                            <p className="text-slate-200 whitespace-pre-wrap text-sm sm:text-base">{activeWorkshop.description}</p>
                        </div>
                    )}

                    {activeWorkshop.location !== 'مسجلة' && (activeWorkshop.hotelName || activeWorkshop.hallName) && (
                        <div className="my-6 p-4 bg-black/20 rounded-lg text-center">
                            <h3 className="text-sm font-bold mb-3 text-fuchsia-400">مكان الإنعقاد</h3>
                            {activeWorkshop.hotelName && <p className="text-slate-200 text-sm">الفندق: <span className="font-semibold text-white">{activeWorkshop.hotelName}</span></p>}
                            {activeWorkshop.hallName && <p className="text-slate-200 text-sm">القاعة: <span className="font-semibold text-white">{activeWorkshop.hallName}</span></p>}
                        </div>
                    )}

                    {activeWorkshop.topics && activeWorkshop.topics.length > 0 && (
                        <div className="my-6">
                            <h3 className="text-sm font-bold mb-6 text-center text-white">محاور الورشة</h3>
                            <ul className="list-disc list-inside space-y-2 text-slate-200 px-4 text-sm sm:text-base">
                                {activeWorkshop.topics.map((topic, index) => (
                                    <li key={index}>{topic}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {activeWorkshop.isRecorded ? (
                        <>
                            <div className="mt-6 text-center border-t border-white/20 pt-4">
                                <p className="text-sm text-slate-400">السعر</p>
                                <span className="block text-3xl sm:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-300 to-fuchsia-400 my-2">{activeWorkshop.price}</span>
                                <p className="text-xs sm:text-sm text-slate-400">درهم / وما يعادله من عملات اخري</p>
                            </div>
                            <div className="mt-8 text-right p-4 bg-black/20 rounded-lg border border-white/10 text-xs sm:text-sm">
                                <h4 className="font-bold text-fuchsia-400 mb-3">شروط عامة :</h4>
                                <ul className="list-decimal list-inside space-y-2 text-slate-300">
                                    {drhopeData.recordedWorkshopTerms?.split('\n').map((line, index) => (
                                        <li key={index}>{line}</li>
                                    ))}
                                </ul>
                            </div>
                        </>
                    ) : (
                        <div className="mt-6 border-t border-white/20 pt-6 sm:pt-10">
                            <h3 className="text-sm font-bold mb-6 sm:mb-10 text-center text-white">اختر الباقة المناسبة</h3>
                            <div className="space-y-4">
                                {allPackages.map(pkg => {
                                    const isSelected = selectedPackage?.id === pkg.id;
                                    const isInactive = pkg.isActive === false;

                                    return (
                                        <div
                                            key={pkg.id}
                                            onClick={() => handlePackageSelect(pkg)}
                                            className={`relative rounded-lg p-4 border-2 transition-all duration-300 cursor-pointer ${isInactive ? 'opacity-50 grayscale border-slate-800' : isSelected ? 'border-fuchsia-400 bg-fuchsia-500/20 shadow-lg shadow-fuchsia-500/20' : 'border-slate-700 hover:border-slate-500 bg-white/5'}`}
                                        >
                                            {isInactive && (
                                                <div className="absolute -top-4 left-4 bg-white text-red-600 text-sm px-4 py-1.5 rounded-full font-bold shadow-xl z-20 border-2 border-red-600 animate-pulse">
                                                    SOLD OUT / انتهى
                                                </div>
                                            )}
                                            {pkg.availability && !isInactive && (
                                                <div className="absolute -top-3 right-3 bg-fuchsia-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                                                    عرض خاص
                                                </div>
                                            )}
                                            <div className="flex items-center justify-between gap-x-4">
                                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${isSelected ? 'border-fuchsia-400' : 'border-slate-500'}`}>
                                                    {isSelected && <div className="w-2.5 h-2.5 bg-fuchsia-400 rounded-full"></div>}
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className={`font-bold text-sm text-slate-100 text-center ${isInactive ? 'line-through' : ''}`}>{pkg.name}</h4>
                                                </div>
                                                <div className="text-left">
                                                    <div className={isInactive ? 'line-through opacity-60' : ''}>
                                                        {pkg.discountPrice ? (
                                                            <div className="flex items-center gap-x-2">
                                                                <span className="font-bold text-xl sm:text-2xl text-fuchsia-300">{pkg.discountPrice}</span>
                                                                <span className="text-sm text-slate-400 line-through">{pkg.price}</span>
                                                            </div>
                                                        ) : (
                                                            <span className="font-bold text-xl sm:text-2xl text-fuchsia-300">{pkg.price}</span>
                                                        )}
                                                        <span className="text-sm text-slate-400"> درهم</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-3 pr-8">
                                                {Array.isArray(pkg.features) ? (
                                                    <ul className="space-y-1 text-slate-300 text-sm">
                                                        {pkg.features.map(f =>
                                                            <li key={f} className="flex items-center gap-x-2">
                                                                <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                                                <span>{f}</span>
                                                            </li>
                                                        )}
                                                    </ul>
                                                ) : (
                                                    <div className="text-slate-300 text-sm" dangerouslySetInnerHTML={{ __html: pkg.features }} />
                                                )}

                                                {pkg.availability && pkg.availability.endDate && (
                                                    <p className="text-xs text-fuchsia-300 mt-2 text-center">
                                                        متاح حتى: {formatArabicDate(pkg.availability.endDate)}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {!activeWorkshop.isRecorded && (
                        <div className="mt-8 text-right p-4 bg-black/20 rounded-lg border border-white/10 text-xs sm:text-sm">
                            <h4 className="text-sm font-bold text-white mb-3">سياسة الإسترجاع :</h4>
                            {activeWorkshop.workshop_returning_policy ? (
                                <div className="text-slate-300 space-y-2" dangerouslySetInnerHTML={{ __html: activeWorkshop.workshop_returning_policy }} />
                            ) : (
                                <ul className="list-decimal list-inside space-y-2 text-slate-300">
                                    {drhopeData.liveWorkshopRefundPolicy?.split('\n').map((line, index) => (
                                        <li key={index}>{line}</li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}
                </div>
                <footer className="p-4 border-t border-violet-500/30 flex-shrink-0 bg-black/10 grid grid-cols-2 gap-4">
                    <button
                        onClick={handleGiftClick}
                        className="flex items-center justify-center gap-x-2 bg-fuchsia-900/30 hover:bg-fuchsia-500/30 border border-fuchsia-500/50 text-fuchsia-300 font-bold py-3 rounded-xl transition-all duration-300 transform hover:scale-[1.02]"
                    >
                        <GiftIcon className="w-5 h-5" />
                        <span>إهداء مقعد</span>
                    </button>
                    <button
                        onClick={handleEnrollClick}
                        className="bg-gradient-to-r from-purple-800 to-pink-600 hover:from-purple-700 hover:to-pink-500 text-white font-bold py-3 rounded-xl transition-all duration-300 transform hover:scale-[1.02] shadow-lg shadow-purple-900/30 hover:shadow-pink-500/50 text-sm border border-fuchsia-500/20"
                    >
                        إهداء الورشة لنفسي
                    </button>
                </footer>
            </div>
        </div>
    );
}

export default WorkshopDetailsModal;
