
import React, { useState, useMemo } from 'react';
import { Workshop } from '../types';
import WorkshopCard from '../components/WorkshopCard';
import LiveStreamCard from '../components/LiveStreamCard';
import Hero from '../components/Hero';
import { useUser } from '../context/UserContext';
import { isWorkshopExpired, parseWorkshopDateTime } from '../utils';
import HowToAttendModal from '../components/HowToAttendModal';

interface WorkshopsPageProps {
  onLiveStreamLoginRequest: () => void;
  onScrollToSection: (sectionId: string) => void;
  onOpenWorkshopDetails: (workshopId: number | null) => void;
  onZoomRedirect: (zoomLink: string, workshopId: number) => void;
  showToast: (message: string, type?: 'success' | 'warning' | 'error') => void;
}

const WorkshopsPage: React.FC<WorkshopsPageProps> = ({
  onLiveStreamLoginRequest,
  onScrollToSection,
  onOpenWorkshopDetails,
  onZoomRedirect,
  showToast
}) => {
  const { currentUser: user, workshops, fetchWorkshops, paginationMeta, earliestWorkshop } = useUser();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'أونلاين' | 'حضوري' | 'مسجلة'>('all');
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Map filters to API slugs
  const filterToType = {
    'all': '',
    'أونلاين': 'online',
    'حضوري': 'onsite',
    'مسجلة': 'recorded'
  };

  // Immediate effect for filter changes
  React.useEffect(() => {
    handleFetch(1, searchTerm, activeFilter);
  }, [activeFilter]);

  // Debounced search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      handleFetch(1, searchTerm, activeFilter);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleFetch = async (page: number, search: string, filter: string) => {
    setIsLoading(true);
    await fetchWorkshops({
      page,
      search,
      type: filterToType[filter as keyof typeof filterToType]
    });
    setIsLoading(false);
  };

  const handlePageChange = (page: number) => {
    if (page < 1 || (paginationMeta && page > paginationMeta.last_page)) return;
    handleFetch(page, searchTerm, activeFilter);
    // Scroll to section after page change
    const section = document.getElementById('workshops_section');
    if (section) section.scrollIntoView({ behavior: 'smooth' });
  };

  const visibleWorkshops = workshops.filter(w => w.isVisible);

  // Still separate into sections manually from the current page's results
  // Sort by date to ensure chronological order for the countdown candidate
  const newWorkshops = visibleWorkshops
    .filter(w => !w.isRecorded && !isWorkshopExpired(w))
    .sort((a, b) => {
      const dateA = parseWorkshopDateTime(a.startDate, a.startTime).getTime();
      const dateB = parseWorkshopDateTime(b.startDate, b.startTime).getTime();
      return dateA - dateB;
    });
  const recordedWorkshops = visibleWorkshops.filter(w => w.isRecorded);

  // Live stream card logic - Use the public upcoming workshop for everyone
  const liveStreamWorkshop = useMemo(() => {
    const now = new Date();
    // Use the first workshop from the sorted newWorkshops list that hasn't started yet or is very recent
    const candidate = newWorkshops.find(w => {
      const target = parseWorkshopDateTime(w.startDate, w.startTime);
      const isFuture = target.getTime() > now.getTime();
      const isWithinLiveWindow = target.getTime() + (4 * 60 * 60 * 1000) > now.getTime();

      // If future, always a candidate.
      if (isFuture) return true;

      // If started (live), ONLY show if link exists.
      // If link is removed, we skip it (returning false), causing the find() to pick the NEXT workshop.
      const hasLink = !!w.zoomLink || !!w.online_link;
      return isWithinLiveWindow && hasLink;
    }) || null;

    if (candidate && earliestWorkshop && Number(earliestWorkshop.id) === Number(candidate.id)) {
      return {
        ...candidate,
        zoomLink: earliestWorkshop.online_link || candidate.zoomLink,
        startDate: earliestWorkshop.start_date || candidate.startDate,
        startTime: earliestWorkshop.start_time || candidate.startTime
      };
    }
    return candidate;
  }, [newWorkshops, earliestWorkshop]);

  const filters: Array<'all' | 'أونلاين' | 'حضوري' | 'مسجلة'> = ['all', 'أونلاين', 'حضوري', 'مسجلة'];
  const filterLabels = {
    'all': 'الكل',
    'أونلاين': 'أونلاين',
    'حضوري': 'حضوري',
    'مسجلة': 'مسجلة'
  };


  return (
    <>
      <Hero
        onExploreClick={() => onScrollToSection('workshops_section')}
        onOpenWorkshopDetails={onOpenWorkshopDetails}
        onLoginRequest={onLiveStreamLoginRequest}
        workshop={liveStreamWorkshop}
      />

      <div className="container mx-auto px-4 py-8">

        {liveStreamWorkshop && (
          <div id="live_stream_card">
            <LiveStreamCard
              workshopTitle={liveStreamWorkshop.title}
              workshopId={liveStreamWorkshop.id}
              zoomLink={liveStreamWorkshop.zoomLink}
              startDate={liveStreamWorkshop.startDate}
              startTime={liveStreamWorkshop.startTime}
              location={liveStreamWorkshop.location}
              address={liveStreamWorkshop.address || liveStreamWorkshop.city}
              user={user}
              onLoginRequest={onLiveStreamLoginRequest}
              onZoomRedirect={onZoomRedirect}
              onShowToast={showToast}
              onShowHelp={() => setIsHelpModalOpen(true)}
            />
          </div>
        )}

        {/* Search and Filter UI - Updated for Light Mode */}
        <div id="workshops_section" className="my-8 p-4 bg-white shadow-xl rounded-2xl border border-slate-200 relative overflow-hidden">
          <div className="flex flex-col md:flex-row gap-4 relative z-10">
            <div className="relative flex-grow">
              <input
                type="text"
                placeholder="ابحث عن ورشة أو مدرب..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-3 pr-10 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50 focus:border-fuchsia-500 transition-all shadow-inner"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="h-5 w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
              {filters.map(filter => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-4 py-2 text-sm font-bold rounded-md transition-all duration-300 ${activeFilter === filter ? 'bg-gradient-to-r from-purple-800 to-pink-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-200 hover:text-slate-800'}`}
                >
                  {filterLabels[filter]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {(visibleWorkshops.length === 0) ? (
          <div className="text-center text-lg sm:text-2xl text-slate-500 bg-slate-50 py-16 rounded-xl border border-slate-200">
            {searchTerm || activeFilter !== 'all'
              ? 'عفواً، لم نجد ورشات تطابق بحثك. حاول بكلمات أخرى.'
              : 'انتظرونا قريبا...'
            }
          </div>
        ) : (
          <>
            {newWorkshops.length > 0 && (
              <section id="live_events" className="text-right mb-12">
                <div className="relative mb-8">
                  <h2 className="text-xl font-bold text-slate-900 pb-2 tracking-wider inline-flex items-center gap-2">
                    <span className="w-1.5 h-8 bg-pink-600 rounded-full"></span>
                    الورش المباشرة
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                  {newWorkshops.map(workshop => (
                    <WorkshopCard key={workshop.id} workshop={workshop} user={user} onEnroll={() => { }} onOpenDetails={onOpenWorkshopDetails} />
                  ))}
                </div>
              </section>
            )}

            {recordedWorkshops.length > 0 && (
              <section id="record_events" className="text-right">
                <div className="relative mb-8">
                  <h2 className="text-xl font-bold text-slate-900 pb-2 tracking-wider inline-flex items-center gap-2">
                    <span className="w-1.5 h-8 bg-violet-600 rounded-full"></span>
                    الورش المسجلة
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                  {recordedWorkshops.map(workshop => (
                    <WorkshopCard key={workshop.id} workshop={workshop} user={user} onEnroll={() => { }} onOpenDetails={onOpenWorkshopDetails} />
                  ))}
                </div>
              </section>
            )}

            {/* Pagination Controls */}
            {paginationMeta && paginationMeta.last_page > 1 && (
              <div className="mt-12 flex flex-col items-center gap-4">
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => handlePageChange(paginationMeta.current_page - 1)}
                    disabled={paginationMeta.current_page === 1 || isLoading}
                    className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    aria-label="Previous Page"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: paginationMeta.last_page }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        disabled={isLoading}
                        className={`w-10 h-10 rounded-lg text-sm font-bold transition-all ${paginationMeta.current_page === page
                          ? 'bg-gradient-to-r from-purple-800 to-pink-600 text-white shadow-md'
                          : 'text-slate-600 hover:bg-slate-50 border border-transparent hover:border-slate-200'
                          }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => handlePageChange(paginationMeta.current_page + 1)}
                    disabled={paginationMeta.current_page === paginationMeta.last_page || isLoading}
                    className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    aria-label="Next Page"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                </div>
                <p className="text-slate-500 text-sm font-medium">
                  عرض {visibleWorkshops.length} من {paginationMeta.total} ورشة
                </p>
              </div>
            )}
          </>
        )}
      </div>
      <HowToAttendModal isOpen={isHelpModalOpen} onClose={() => setIsHelpModalOpen(false)} />
    </>
  );
};

export default WorkshopsPage;
