
import React, { useMemo } from 'react';
import { useUser } from '../context/UserContext';
import { CloseIcon, StarIcon, AcademicCapIcon, ChatBubbleLeftRightIcon } from './icons';

interface ReviewsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RatingStars: React.FC<{ rating: number }> = ({ rating }) => (
  <div className="flex items-center">
    {[...Array(5)].map((_, i) => (
      <StarIcon key={i} className="w-4 h-4 text-yellow-400" filled={i < rating} />
    ))}
  </div>
);

const ReviewsModal: React.FC<ReviewsModalProps> = ({ isOpen, onClose }) => {
  const { workshops, drhopeData } = useUser();

  const allReviews = useMemo(() => {
    // 1. Try to use reviews from DrHope API (Global Reviews)
    if (drhopeData.reviews && drhopeData.reviews.length > 0) {
      
      return drhopeData.reviews.map(r => {
        // Parse "Name Date" format if possible
        let name = r.user_name_and_date || 'Unknown';
        let dateObj = new Date();

        if (r.user_name_and_date) {
          const lastSpaceIndex = r.user_name_and_date.lastIndexOf(' ');
          if (lastSpaceIndex !== -1) {
            name = r.user_name_and_date.substring(0, lastSpaceIndex);
            const dateStr = r.user_name_and_date.substring(lastSpaceIndex + 1);
            // Try DD/MM/YYYY
            const parts = dateStr.split('/');
            if (parts.length === 3) {
              dateObj = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
            }
          }
        }

        return {
          id: r.id.toString(),
          fullName: name,
          rating: r.rating,
          comment: r.review,
          date: dateObj.toISOString(),
          workshopTitle: r.workshop_title,
          workshopInstructor: r.workshop_teacher
        };
      }); // Return directly without filtering/sorting to trust API order
    }

    // 2. Fallback to extracting from workshops (Original Logic)
    
    return workshops
      .flatMap(w => (w.reviews || []).map(r => ({ ...r, workshopTitle: w.title, workshopInstructor: w.instructor })))
      .filter(r => !r.isDeleted)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [workshops, drhopeData.reviews]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50 p-4 transition-opacity"
      onClick={onClose}
    >
      <div
        className="bg-gradient-to-br from-[#2e0235] via-[#3b0764] to-[#4c1d95] text-slate-200 rounded-2xl shadow-2xl w-full max-w-4xl border border-fuchsia-500/30 flex flex-col h-[90vh]"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'fade-in-up 0.3s ease-out forwards' }}
      >
        <header className="p-5 flex justify-between items-center border-b border-fuchsia-500/20 flex-shrink-0 bg-black/20">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ChatBubbleLeftRightIcon className="w-6 h-6 text-fuchsia-400" />
            <span>آراء المشتركات</span>
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-300 hover:bg-white/20 transition-colors"
            aria-label="إغلاق"
          >
            <CloseIcon className="w-6 h-6" />
          </button>
        </header>

        <div className="flex-grow p-6 overflow-y-auto custom-scrollbar bg-black/10">
          {allReviews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {allReviews.map(review => (
                <div key={review.id} className="bg-slate-800/40 p-5 rounded-xl border border-fuchsia-500/10 hover:border-fuchsia-500/30 transition-all hover:bg-slate-800/60 shadow-md">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-fuchsia-600 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-inner">
                        {review.fullName.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-sm">{review.fullName}</h3>
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5">
                          <AcademicCapIcon className="w-3 h-3 text-fuchsia-400" />
                          <span className="truncate max-w-[150px]">{review.workshopTitle}</span>
                        </div>
                      </div>
                    </div>
                    <RatingStars rating={review.rating} />
                  </div>

                  <div className="relative">
                    <span className="absolute -top-2 -right-1 text-4xl text-fuchsia-500/20 font-serif leading-none">"</span>
                    <p className="text-slate-200 text-sm leading-relaxed px-2 py-1 italic relative z-10">{review.comment}</p>
                    <span className="absolute -bottom-4 left-0 text-4xl text-fuchsia-500/20 font-serif leading-none rotate-180">"</span>
                  </div>

                  <div className="text-left text-[10px] text-slate-500 mt-4 font-medium">
                    {new Date(review.date).toLocaleDateString('ar-EG-u-nu-latn')}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 opacity-60">
              <ChatBubbleLeftRightIcon className="w-16 h-16 mb-4 text-slate-500" />
              <p>لا توجد آراء متاحة حالياً.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReviewsModal;
