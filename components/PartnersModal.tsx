
import React, { useState } from 'react';
import { useUser } from '../context/UserContext';
import { Partner } from '../types';
import { CloseIcon, ArrowLeftIcon, GlobeAltIcon, InstagramIcon, TwitterIcon } from './icons';
import { API_BASE_URL, API_ENDPOINTS } from '../constants';

interface PartnersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PartnersModal: React.FC<PartnersModalProps> = ({ isOpen, onClose }) => {
  const { partners } = useUser();
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  React.useEffect(() => {
    if (selectedPartner) {
      // Fetch details
      const fetchDetails = async () => {
        setIsLoadingDetails(true);
        setDetailsError(null);
        try {
          const token = localStorage.getItem('auth_token');
          const headers: HeadersInit = { 'Content-Type': 'application/json' };
          if (token) headers['Authorization'] = `Bearer ${token}`;

          const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.DRHOPE.PARTNERS}/${selectedPartner.id}`, { headers });
          const data = await res.json();

          if (data.key === 'success' && data.data) {
            const detail = data.data;
            setSelectedPartner(prev => prev ? ({
              ...prev,
              description: detail.description,
              websiteUrl: detail.link,
              instagramUrl: undefined,
              twitterUrl: undefined
            }) : null);
          } else if (data.msg) {
            setDetailsError(data.msg);
          }
        } catch (err) {
          
          setDetailsError("تعذر تحميل التفاصيل من الخادم");
        } finally {
          setIsLoadingDetails(false);
        }
      };

      // Only fetch if description is missing (optimization)
      if (!selectedPartner.description) {
        fetchDetails();
      }
    }
  }, [selectedPartner?.id]);

  if (!isOpen) return null;

  const handleClose = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedPartner(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4" onClick={handleClose}>
      <div
        className="bg-gradient-to-br from-[#2e0235] via-[#3b0764] to-[#4c1d95] text-slate-200 rounded-2xl shadow-2xl w-full max-w-4xl border border-fuchsia-500/30 flex flex-col h-[90vh]"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'fade-in-up 0.3s ease-out forwards' }}
      >
        <header className="flex-shrink-0 flex justify-between items-center p-5 border-b border-fuchsia-500/20 bg-black/20">
          <div className="flex items-center gap-x-3">
            {selectedPartner && (
              <button onClick={() => setSelectedPartner(null)} className="p-2 rounded-full hover:bg-white/10 transition-colors" aria-label="Back to partners list">
                <ArrowLeftIcon className="w-6 h-6" />
              </button>
            )}
            <h2 className="text-xl font-bold text-white tracking-wide">
              {selectedPartner ? selectedPartner.name : 'شركاء النجاح'}
            </h2>
          </div>
          <button onClick={() => handleClose()} className="p-2 rounded-full text-slate-300 hover:bg-white/20 transition-colors" aria-label="إغلاق">
            <CloseIcon className="w-6 h-6" />
          </button>
        </header>

        <div className="flex-grow overflow-y-auto p-6 custom-scrollbar">
          {!selectedPartner ? (
            // Grid View
            partners.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                {partners.map(partner => (
                  <button
                    key={partner.id}
                    onClick={() => setSelectedPartner(partner)}
                    className="group flex flex-col items-center text-center p-4 bg-black/20 rounded-xl border border-fuchsia-500/20 transition-all transform hover:-translate-y-1 hover:border-fuchsia-500/50 hover:shadow-lg hover:shadow-fuchsia-500/10 hover:bg-black/30"
                  >
                    <div className="w-24 h-24 rounded-full overflow-hidden mb-4 border-2 border-slate-600 group-hover:border-fuchsia-400 transition-colors shadow-lg">
                      <img src={partner.logo} alt={partner.name} className="w-full h-full object-cover" />
                    </div>
                    <p className="font-bold text-white text-sm group-hover:text-fuchsia-300 transition-colors">{partner.name}</p>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400">
                <p>لم يتم إضافة شركاء نجاح بعد.</p>
              </div>
            )
          ) : (
            // Detail View
            <div className="flex flex-col md:flex-row gap-8 items-start animate-fade-in-up">
              <div className="w-full md:w-1/3 text-center bg-black/20 p-6 rounded-xl border border-fuchsia-500/20">
                <img src={selectedPartner.logo} alt={selectedPartner.name} className="w-40 h-40 object-cover rounded-full mx-auto border-4 border-fuchsia-500/40 shadow-xl mb-4" />
                <h3 className="text-xl font-bold text-white mb-4">{selectedPartner.name}</h3>
                <div className="flex justify-center gap-x-4">
                  {selectedPartner.websiteUrl && (
                    <a href={selectedPartner.websiteUrl} target="_blank" rel="noopener noreferrer" className="p-3 rounded-full bg-slate-700/50 hover:bg-fuchsia-600/20 text-fuchsia-300 hover:text-fuchsia-200 transition-colors"><GlobeAltIcon className="w-6 h-6" /></a>
                  )}
                  {selectedPartner.instagramUrl && (
                    <a href={selectedPartner.instagramUrl} target="_blank" rel="noopener noreferrer" className="p-3 rounded-full bg-slate-700/50 hover:bg-fuchsia-600/20 text-fuchsia-300 hover:text-fuchsia-200 transition-colors"><InstagramIcon className="w-6 h-6" /></a>
                  )}
                  {selectedPartner.twitterUrl && (
                    <a href={selectedPartner.twitterUrl} target="_blank" rel="noopener noreferrer" className="p-3 rounded-full bg-slate-700/50 hover:bg-fuchsia-600/20 text-fuchsia-300 hover:text-fuchsia-200 transition-colors"><TwitterIcon className="w-6 h-6" /></a>
                  )}
                </div>
              </div>
              <div className="w-full md:w-2/3 bg-black/20 p-6 rounded-xl border border-fuchsia-500/20 min-h-[250px] relative">
                <h4 className="text-lg font-bold text-fuchsia-300 mb-3 border-b border-fuchsia-500/20 pb-2">نبذة عن الشريك</h4>

                {isLoadingDetails ? (
                  <div className="flex justify-center items-center h-40">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-fuchsia-500"></div>
                  </div>
                ) : detailsError ? (
                  <div className="text-red-400 text-center py-8 bg-red-900/10 rounded-lg">
                    <p>{detailsError}</p>
                    <p className="text-sm mt-2 text-red-300/70 opacity-70">Backend Error in /api/drhope/partners/{selectedPartner.id}</p>
                  </div>
                ) : (
                  <div className="prose prose-invert text-slate-200 whitespace-pre-wrap max-w-none leading-relaxed text-sm">
                    {selectedPartner.description || "لا يوجد وصف متاح."}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PartnersModal;
