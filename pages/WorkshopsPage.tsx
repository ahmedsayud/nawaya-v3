
import React, { useState, useMemo } from 'react';
import { Workshop, Recording } from '../types';
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
  onPlayRecording: (workshop: Workshop, recording: Partial<Recording> & { name?: string, url: string }, index?: number) => void;
  showToast: (message: string, type?: 'success' | 'warning' | 'error') => void;
}

const WorkshopsPage: React.FC<WorkshopsPageProps> = ({
  onLiveStreamLoginRequest,
  onScrollToSection,
  onOpenWorkshopDetails,
  onPlayRecording,
  showToast
}) => {
  const { currentUser: user, workshops, fetchWorkshops, paginationMeta, earliestWorkshop } = useUser();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'أونلاين' | 'حضوري' | 'أونلاين وحضوري' | 'مسجلة'>('all');
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Map filters to API slugs
  const filterToType = {
    'all': '',
    'أونلاين': 'online',
    'حضوري': 'onsite',
    'أونلاين وحضوري': 'hybrid',
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


  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const visibleWorkshops = workshops.filter(w => w.isVisible);

  // Sorting logic (moved up for use in pagination)
  const upcomingSortedById = [...visibleWorkshops]
    .filter(w => !w.isRecorded)
    .sort((a, b) => {
      const dateA = parseWorkshopDateTime(a.startDate, a.startTime).getTime();
      const dateB = parseWorkshopDateTime(b.startDate, b.startTime).getTime();
      return dateB - dateA;
    });

  const recordedWorkshops = visibleWorkshops
    .filter(w => w.isRecorded)
    .sort((a, b) => {
      const dateA = parseWorkshopDateTime(a.startDate, a.startTime).getTime();
      const dateB = parseWorkshopDateTime(b.startDate, b.startTime).getTime();
      return dateA - dateB;
    });

  // Combine for total count but we might still display in sections
  const allSortedWorkshops = [...upcomingSortedById, ...recordedWorkshops];
  const totalItems = allSortedWorkshops.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  // Get current page items
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentItems = allSortedWorkshops.slice(startIndex, endIndex);

  // Split current items back into upcoming/recorded for sectional display
  const paginatedUpcoming = currentItems.filter(w => !w.isRecorded);
  const paginatedRecorded = currentItems.filter(w => w.isRecorded);

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    onScrollToSection('workshops_section');
  };

  // Sort by Date Ascending for "Next Up" Logic
  const upcomingSortedByDate = [...visibleWorkshops]
    .filter(w => !w.isRecorded && !isWorkshopExpired(w) && (w.location === 'أونلاين' || w.location === 'أونلاين وحضوري'))
    .sort((a, b) => {
      const dateA = parseWorkshopDateTime(a.startDate, a.startTime).getTime();
      const dateB = parseWorkshopDateTime(b.startDate, b.startTime).getTime();
      return dateA - dateB;
    });

  // Live stream card logic - Use the public upcoming workshop for everyone
  const liveStreamWorkshop = useMemo(() => {
    const now = new Date();
    // Use the first workshop from the sorted DATE list to find the actual next event
    const candidate = upcomingSortedByDate.find(w => {
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
  }, [upcomingSortedByDate, earliestWorkshop]);

  const filters: Array<'all' | 'أونلاين' | 'حضوري' | 'أونلاين وحضوري' | 'مسجلة'> = ['all', 'أونلاين', 'حضوري', 'أونلاين وحضوري', 'مسجلة'];
  const filterLabels = {
    'all': 'الكل',
    'أونلاين': 'أونلاين',
    'حضوري': 'حضوري',
    'أونلاين وحضوري': 'أونلاين وحضوري',
    'مسجلة': 'مسجلة'
  };


  return (
    <>
      <Hero
        onExploreClick={() => onScrollToSection('workshops_section')}
        onOpenWorkshopDetails={onOpenWorkshopDetails}
        onLoginRequest={onLiveStreamLoginRequest}
        onPlayRecording={onPlayRecording}
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
              onPlayLive={(link, id) => {
                // Open in-app player instead of redirecting
                if (link) onPlayRecording(liveStreamWorkshop!, { name: 'بث مباشر', url: link });
              }}
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
            {paginatedUpcoming.length > 0 && (
              <section id="live_events" className="text-right mb-12">
                <div className="relative mb-8">
                  <h2 className="text-xl font-bold text-slate-900 pb-2 tracking-wider inline-flex items-center gap-2">
                    <span className="w-1.5 h-8 bg-pink-600 rounded-full"></span>
                    الورش المباشرة
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                  {paginatedUpcoming.map(workshop => (
                    <WorkshopCard key={workshop.id} workshop={workshop} user={user} onEnroll={() => { }} onOpenDetails={onOpenWorkshopDetails} />
                  ))}
                </div>
              </section>
            )}

            {paginatedRecorded.length > 0 && (
              <section id="record_events" className="text-right">
                <div className="relative mb-8">
                  <h2 className="text-xl font-bold text-slate-900 pb-2 tracking-wider inline-flex items-center gap-2">
                    <span className="w-1.5 h-8 bg-violet-600 rounded-full"></span>
                    الورش المسجلة
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                  {paginatedRecorded.map(workshop => (
                    <WorkshopCard key={workshop.id} workshop={workshop} user={user} onEnroll={() => { }} onOpenDetails={onOpenWorkshopDetails} />
                  ))}
                </div>
              </section>
            )}

            {/* Pagination Controls - Updated for client-side */}
            {totalPages > 1 && (
              <div className="mt-16 flex flex-col items-center gap-6 p-6 bg-slate-50 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-center gap-4 flex-wrap">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1 || isLoading}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl border-2 border-slate-200 text-slate-700 hover:border-pink-500 hover:text-pink-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all font-bold text-sm bg-white shadow-sm"
                    aria-label="Previous Page"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span>السابق</span>
                  </button>

                  <div className="flex items-center gap-2">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        disabled={isLoading}
                        className={`w-12 h-12 rounded-xl text-sm font-black transition-all transform hover:scale-105 ${currentPage === page
                          ? 'bg-gradient-to-r from-purple-800 to-pink-600 text-white shadow-xl scale-110 ring-4 ring-pink-500/20'
                          : 'bg-white text-slate-600 hover:bg-slate-100 border-2 border-slate-100 hover:border-slate-300'
                          }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || isLoading}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl border-2 border-slate-200 text-slate-700 hover:border-pink-500 hover:text-pink-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all font-bold text-sm bg-white shadow-sm"
                    aria-label="Next Page"
                  >
                    <span>التالي</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <p className="text-slate-500 text-sm font-bold bg-white px-4 py-1.5 rounded-full border border-slate-100 shadow-inner">
                    عرض {currentItems.length} من {totalItems} ورشة
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium">الصفحة {currentPage} من {totalPages}</p>
                </div>
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
