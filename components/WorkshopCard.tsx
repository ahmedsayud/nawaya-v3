import React from 'react';
import { Workshop, User, SubscriptionStatus } from '../types';
import { formatArabicDate, formatArabicTime } from '../utils';
import { CalendarIcon, GlobeAltIcon, TagIcon, AcademicCapIcon, CheckCircleIcon, VideoIcon, ClockIcon } from './icons';

interface WorkshopCardProps {
  workshop: Workshop;
  user: User | null;
  onEnroll: (workshopId: number, selectedPackageId?: number) => void;
  onOpenDetails: (workshopId: number) => void;
}

const WorkshopCard: React.FC<WorkshopCardProps> = ({ workshop, user, onEnroll, onOpenDetails }) => {

  const handleOpenDetails = () => {
    onOpenDetails(workshop.id);
  }

  const dateDisplay = workshop.endDate
    ? `من ${formatArabicDate(workshop.startDate)} إلى ${formatArabicDate(workshop.endDate)} `
    : formatArabicDate(workshop.startDate);

  let locationDisplay;
  if (workshop.location === 'حضوري' || workshop.location === 'أونلاين وحضوري') {
    locationDisplay = [workshop.hotelName, workshop.city, workshop.country].filter(Boolean).join(', ');
  } else if (workshop.location === 'أونلاين') {
    locationDisplay = workshop.application ? `أونلاين عبر ${workshop.application} ` : 'أونلاين';
  } else { // مسجلة
    locationDisplay = `${workshop.location}, ${workshop.country} `;
  }

  const isSubscribed = user?.subscriptions.some(sub =>
    sub.workshopId === workshop.id &&
    sub.status !== SubscriptionStatus.REFUNDED &&
    !sub.isPayItForwardDonation
  );

  // Theme Harmonized Colors for Badges
  // We use Indigo instead of Sky Blue to blend better with Purple
  // We use Amber (Gold) as it is the complementary luxury color to Purple
  const locationTypeClasses = {
    'أونلاين': 'bg-indigo-50 text-indigo-700 border-indigo-200',
    'حضوري': 'bg-amber-50 text-amber-700 border-amber-200',
    'مسجلة': 'bg-rose-50 text-rose-700 border-rose-200',
    'أونلاين وحضوري': 'bg-purple-50 text-purple-700 border-purple-200',
  };

  const priceToDisplay = workshop.has_multiple_packages
    ? null
    : (workshop.packages?.[0]?.price ?? workshop.price);

  // Common Icon Color - Pink-600 matches the site's accent #db2777
  const iconColorClass = "text-pink-600";

  return (
    <div
      className="bg-white rounded-2xl border border-slate-200 flex flex-col h-full transition-all duration-500 transform hover:-translate-y-2 hover:shadow-[0_0_20px_rgba(219,39,119,0.4)] hover:border-pink-400 group overflow-hidden shadow-[0_0_10px_rgba(0,0,0,0.05)]"
    >
      {/* Card Header - Light Background */}
      <div className="p-4 sm:p-5 border-b border-slate-100 bg-gradient-to-b from-slate-50 to-white">
        <div className="flex justify-start mb-2">
          <span className={`px-3 py-1 text-[10px] sm:text-xs font-bold rounded-full border ${locationTypeClasses[workshop.location]} `}>
            {workshop.location}
          </span>
        </div>
        <div className="text-center min-h-[4.5rem] sm:min-h-[5.5rem] flex flex-col justify-center items-center">
          {/* Title Text: Dark Slate for readability on white */}
          <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug group-hover:text-pink-700 transition-colors">{workshop.title}</h3>
          <div className="flex items-center justify-center gap-x-2 text-slate-500 text-xs sm:text-sm mt-3 sm:mt-4 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
            <AcademicCapIcon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${iconColorClass} `} />
            <span className="font-semibold">{workshop.teacher || workshop.instructor}</span>
          </div>
        </div>
      </div>

      {/* Card Body - White Background */}
      <div className="p-4 sm:p-5 flex-grow bg-white">
        <div className="space-y-3 text-xs sm:text-sm">
          <div className="flex items-start gap-x-3 text-slate-600">
            <GlobeAltIcon className={`w-4 h-4 sm:w-5 sm:h-5 ${iconColorClass} flex-shrink-0 mt-0.5`} />
            <span className="font-medium leading-tight">{workshop.address || locationDisplay}</span>
          </div>
          {!workshop.isRecorded && (
            <>
              <div className="flex items-start gap-x-3 text-slate-600">
                <CalendarIcon className={`w-4 h-4 sm:w-5 sm:h-5 ${iconColorClass} flex-shrink-0 mt-0.5`} />
                <span className="font-medium leading-tight">{workshop.date_range || dateDisplay}</span>
              </div>
              <div className="flex flex-col gap-1 text-slate-600">
                <div className="flex items-start gap-x-3">
                  <ClockIcon className={`w-4 h-4 sm:w-5 sm:h-5 ${iconColorClass} flex-shrink-0 mt-0.5`} />
                  <span className="font-medium leading-tight" dir="ltr">
                    {workshop.start_time ?
                      `${formatArabicTime(workshop.start_time)}${workshop.end_time ? ` - ${formatArabicTime(workshop.end_time)}` : ''}` :
                      `${formatArabicTime(workshop.startTime)}${workshop.endTime ? ` - ${formatArabicTime(workshop.endTime)}` : ''}`
                    }
                  </span>
                </div>
                <div className="pr-7 sm:pr-8">
                  <p className="text-[10px] sm:text-xs font-semibold text-slate-500">
                    (بتوقيت دولة الإمارات العربية المتحدة)
                  </p>
                </div>
              </div>
            </>
          )}
          {workshop.isRecorded && (
            <div className="flex items-start gap-x-3 text-slate-600">
              <VideoIcon className={`w-4 h-4 sm:w-5 sm:h-5 ${iconColorClass} flex-shrink-0 mt-0.5`} />
              <span className="font-medium leading-tight">متاحة للمشاهدة فور الاشتراك</span>
            </div>
          )}
        </div>
      </div>

      {/* Card Footer - Slightly Off-White Background */}
      <div className="p-4 sm:p-5 border-t border-slate-100 mt-auto bg-slate-50">
        {isSubscribed ? (
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-x-2 text-emerald-600 font-bold text-xs sm:text-sm bg-emerald-50 px-2 sm:px-3 py-1.5 rounded-full border border-emerald-200 shadow-sm">
              <CheckCircleIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>أنت مشترك</span>
            </div>
            <button
              onClick={handleOpenDetails}
              className="bg-white border-2 border-pink-600 text-pink-600 font-bold py-1.5 px-4 sm:py-2 sm:px-5 rounded-xl transition-all duration-300 hover:bg-pink-600 hover:text-white text-xs sm:text-sm shadow-sm"
            >
              عرض التفاصيل
            </button>
          </div>
        ) : (
          <div className="flex justify-between items-center">
            {workshop.has_multiple_packages ? (
              <div className="text-xs sm:text-sm text-pink-800 font-bold bg-pink-50 px-3 py-1.5 rounded-lg border border-pink-200">باقات متعددة</div>
            ) : (workshop.isFree) ? (
              <div className="flex items-center gap-x-1">
                <TagIcon className={`w-4 h-4 sm:w-5 sm:h-5 ${iconColorClass} flex-shrink-0`} />
                <span className="text-xl sm:text-2xl font-black text-slate-800">مجاناً</span>
              </div>
            ) : (priceToDisplay && priceToDisplay > 0) ? (
              <div className="flex items-center gap-x-1">
                <TagIcon className={`w-4 h-4 sm:w-5 sm:h-5 ${iconColorClass} flex-shrink-0`} />
                <span className="text-xl sm:text-2xl font-black text-slate-800">{priceToDisplay}</span>
                <span className="text-[10px] sm:text-xs text-slate-500 font-bold mt-1">درهم</span>
              </div>
            ) : (
              <div className="text-xs sm:text-sm text-slate-500 font-medium">التفاصيل بالداخل</div>
            )}
            <button
              onClick={handleOpenDetails}
              className="bg-gradient-to-r from-purple-800 to-pink-600 hover:from-purple-700 hover:to-pink-500 text-white font-bold py-2 px-5 sm:py-2.5 sm:px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg shadow-purple-900/20 hover:shadow-pink-500/30 text-xs sm:text-sm"
            >
              التفاصيل
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkshopCard;
