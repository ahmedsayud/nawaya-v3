
import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { CloseIcon, DownloadIcon, ChevronDownIcon, PrintIcon, TagIcon, CreditCardIcon } from './icons';
import { SubscriptionStatus, Package } from '../types';

declare const XLSX: any;

interface DetailedStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface StatRow {
  id: string;
  label: string;
  subscribers: number;
  revenue: number;
}

const DetailedStatsModal: React.FC<DetailedStatsModalProps> = ({ isOpen, onClose }) => {
  const { users, workshops } = useUser();
  
  // State
  const [selectedWorkshopId, setSelectedWorkshopId] = useState('');
  const [activeTab, setActiveTab] = useState<'packages' | 'payments'>('packages'); // New Tab State

  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
            setIsExportMenuOpen(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  useEffect(() => {
      if(isOpen) {
          setSelectedWorkshopId('');
          setActiveTab('packages');
      }
  }, [isOpen]);

  const selectedWorkshop = useMemo(() => 
    workshops.find(w => w.id === parseInt(selectedWorkshopId)), 
  [selectedWorkshopId, workshops]);

  // Main calculation logic
  const stats = useMemo(() => {
    if (!selectedWorkshop) return null;

    let totalSubscribers = 0;
    let totalRevenue = 0;
    
    // Dictionary to hold aggregated rows
    const rowsMap: { [key: string]: StatRow } = {};

    // Helper to init row if not exists
    const ensureRow = (id: string, label: string) => {
        if (!rowsMap[id]) {
            rowsMap[id] = { id, label, subscribers: 0, revenue: 0 };
        }
    };

    // If viewing Packages, pre-fill all available packages (even if 0 sales)
    if (activeTab === 'packages') {
        selectedWorkshop.packages?.forEach(pkg => {
            ensureRow(pkg.id.toString(), pkg.name);
        });
        ensureRow('none', 'بدون باقة (سعر أساسي/مسجلة)');
    } else {
        // Pre-fill known payment methods
        ensureRow('LINK', 'رابط دفع (LINK)');
        ensureRow('BANK', 'تحويل بنكي (BANK)');
        ensureRow('GIFT', 'هدية (GIFT)');
        ensureRow('CREDIT', 'رصيد (CREDIT)');
    }

    users.forEach(user => {
      if (user.isDeleted) return;

      user.subscriptions.forEach(sub => {
        // 1. Basic Check: Workshop ID and Active Status
        if (sub.workshopId !== selectedWorkshop.id) return;
        const isActive = (sub.status === SubscriptionStatus.ACTIVE || sub.status === SubscriptionStatus.TRANSFERRED) && sub.isApproved !== false;
        if (!isActive) return;

        // 2. Aggregation Logic
        let key = '';
        let label = '';

        if (activeTab === 'packages') {
            key = sub.packageId ? sub.packageId.toString() : 'none';
            // We rely on pre-filled labels, but if a package was deleted or not found:
            if (!rowsMap[key]) label = 'باقة غير معروفة';
        } else {
            // Payments
            key = sub.paymentMethod || 'UNKNOWN';
            // Mapping codes to labels if they weren't pre-filled (e.g. legacy data)
            if (!rowsMap[key]) label = key; 
        }

        // Initialize if dynamic key (unlikely with pre-fill but safe)
        if (!rowsMap[key]) {
             // Try to find label if we are in package mode and it wasn't prefilled
             if (activeTab === 'packages' && sub.packageId) {
                 const pkgName = selectedWorkshop.packages?.find(p => p.id === sub.packageId)?.name;
                 label = pkgName || 'باقة محذوفة';
             }
             ensureRow(key, label);
        }

        // Add Data
        const price = sub.pricePaid || 0;
        rowsMap[key].subscribers += 1;
        rowsMap[key].revenue += price;

        totalSubscribers += 1;
        totalRevenue += price;
      });
    });

    // Convert map to array and sort
    const rows = Object.values(rowsMap).sort((a, b) => b.revenue - a.revenue);

    return {
        workshopTitle: selectedWorkshop.title,
        totalSubscribers,
        totalRevenue,
        rows
    };
  }, [users, selectedWorkshop, activeTab]);
  
  const handleExport = (format: 'excel' | 'pdf') => {
      setIsExportMenuOpen(false);
      if (!stats) return;

      const workshopTitle = stats.workshopTitle.replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, '_');
      const typeLabel = activeTab === 'packages' ? 'Packages' : 'PaymentMethods';
      const filename = `Stats_${workshopTitle}_${typeLabel}_${new Date().toISOString().split('T')[0]}`;

      if (format === 'excel') {
          handleExcelExport(filename);
      } else {
          handlePdfExport(filename);
      }
  };

  const handleExcelExport = (filename: string) => {
    if (!stats) return;
    
    const firstColName = activeTab === 'packages' ? 'الباقة' : 'طريقة الدفع';

    const dataToExport: any[] = [];
    
    stats.rows.forEach((row) => {
        if (row.subscribers === 0) return; // Optional: skip empty
        dataToExport.push({ 
            [firstColName]: row.label, 
            'عدد المشتركين': row.subscribers, 
            'الإيرادات': row.revenue 
        });
    });

    dataToExport.push({ [firstColName]: 'الإجمالي', 'عدد المشتركين': stats.totalSubscribers, 'الإيرادات': stats.totalRevenue });
    
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Statistics');
    
    worksheet['!cols'] = [{ wch: 30 }, { wch: 15 }, { wch: 15 }];
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  };

  const handlePdfExport = (filename: string) => {
    if (!stats) return;

    const firstColName = activeTab === 'packages' ? 'الباقة' : 'طريقة الدفع';

    const rowsHtml = stats.rows.map((row) => {
        if (row.subscribers === 0) return '';
        return `<tr><td>${row.label}</td><td style="text-align: center;">${row.subscribers}</td><td style="text-align: center;">${row.revenue.toFixed(2)}</td></tr>`;
    }).join('');
    
    const totalRow = `<tr style="font-weight: bold; background-color: #f2f2f2; color: black;"><td>الإجمالي</td><td style="text-align: center;">${stats.totalSubscribers}</td><td style="text-align: center;">${stats.totalRevenue.toFixed(2)}</td></tr>`;
    
    const printWindow = window.open('', '', 'height=600,width=800');
    if (printWindow) {
        printWindow.document.write(`<html><head><title>${filename}</title><style>body { font-family: 'Noto Sans Arabic', sans-serif; direction: rtl; } table { width: 100%; border-collapse: collapse; font-size: 12px; } th, td { border: 1px solid #ddd; padding: 8px; text-align: right; } th { background-color: #f2f2f2; color: black; } h1, h2 { text-align: right; }</style></head><body><h1>إحصائيات ورشة: ${stats.workshopTitle}</h1><h2>تحليل حسب: ${firstColName}</h2><h2>إجمالي الإيرادات: ${stats.totalRevenue.toFixed(2)}</h2><table><thead><tr><th>${firstColName}</th><th style="text-align: center;">عدد المشتركين</th><th style="text-align: center;">الإيرادات</th></tr></thead><tbody>${rowsHtml}${totalRow}</tbody></table></body></html>`);
        printWindow.document.close();
        printWindow.focus();
    }
  };

  if (!isOpen) return null;

  const numberClass = "text-white font-bold text-lg";
  const selectClass = "p-2 bg-slate-800 border border-slate-700 rounded-md focus:ring-yellow-500 focus:border-yellow-500 text-sm font-bold text-white w-full";
  const tabButtonClass = (tab: typeof activeTab) => 
    `flex-1 py-2 px-4 text-sm font-bold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${
        activeTab === tab 
        ? 'bg-yellow-600 text-white shadow-lg shadow-yellow-900/50' 
        : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-white'
    }`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-70 p-4">
      <div className="bg-slate-900 text-white rounded-lg shadow-2xl w-full max-w-5xl border border-yellow-500/50 max-h-[90vh] flex flex-col">
        <header className="p-4 flex justify-between items-center border-b border-yellow-500/50 flex-shrink-0">
          <h2 className="text-xl font-bold text-yellow-300 tracking-wider">إحصائيات تفصيلية</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10"><CloseIcon className="w-6 h-6" /></button>
        </header>
        
        <div className="p-6 overflow-y-auto space-y-6">
            
            {/* Top Controls: Workshop Selection + Tab Switcher */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-black/20 p-4 rounded-lg border border-slate-700">
                
                {/* 1. Workshop Selector */}
                <div>
                    <label className="block text-xs font-bold text-slate-400 mb-2">اختر الورشة لعرض الإحصائيات</label>
                    <select 
                        value={selectedWorkshopId} 
                        onChange={e => setSelectedWorkshopId(e.target.value)}
                        className={selectClass}
                    >
                        <option value="">-- اختر ورشة --</option>
                        {workshops.filter(w => !w.isDeleted).map(w => (
                            <option key={w.id} value={w.id}>{w.title}</option>
                        ))}
                    </select>
                </div>

                {/* 2. Tabs Switcher */}
                <div className={!selectedWorkshopId ? 'opacity-50 pointer-events-none' : ''}>
                    <label className="block text-xs font-bold text-slate-400 mb-2">طريقة عرض البيانات</label>
                    <div className="flex bg-slate-800/50 p-1 rounded-lg">
                        <button onClick={() => setActiveTab('packages')} className={tabButtonClass('packages')}>
                            <TagIcon className="w-4 h-4" />
                            <span>تحليل الباقات</span>
                        </button>
                        <button onClick={() => setActiveTab('payments')} className={tabButtonClass('payments')}>
                            <CreditCardIcon className="w-4 h-4" />
                            <span>تحليل طرق الدفع</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Actions Row */}
            <div className="flex justify-end">
                <div className="relative" ref={exportMenuRef}>
                    <button onClick={() => setIsExportMenuOpen(prev => !prev)} disabled={!stats} className="flex items-center gap-x-2 bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded-md transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                        <span>تصدير النتائج</span><ChevronDownIcon className="w-4 h-4" />
                    </button>
                    {isExportMenuOpen && (<div className="absolute left-0 mt-2 w-40 bg-slate-800 border border-slate-600 rounded-md shadow-lg z-10"><ul><li><button onClick={() => handleExport('excel')} className="w-full text-right px-4 py-2 text-sm font-bold hover:bg-yellow-500/20 flex items-center gap-x-2"><DownloadIcon className="w-4 h-4" /> <span>EXCEL</span></button></li><li><button onClick={() => handleExport('pdf')} className="w-full text-right px-4 py-2 text-sm font-bold hover:bg-yellow-500/20 flex items-center gap-x-2"><PrintIcon className="w-4 h-4" /> <span>PDF</span></button></li></ul></div>)}
                </div>
            </div>

            {/* Results Section */}
            {stats ? (
              <div className="bg-black/20 p-4 rounded-lg border border-slate-700/50 animate-fade-in-up">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-yellow-500/30 pb-4 mb-4 gap-4">
                  <div>
                      <h4 className="text-lg font-bold text-yellow-300">{stats.workshopTitle}</h4>
                      <div className="flex gap-2 text-xs text-slate-400 mt-1">
                          <span className="bg-slate-800 px-2 py-1 rounded">عرض حسب: {activeTab === 'packages' ? 'الباقات' : 'طرق الدفع'}</span>
                      </div>
                  </div>
                  <div className="text-right text-sm flex gap-6 bg-slate-800/50 p-3 rounded-lg">
                    <div>
                        <p className="text-slate-400 text-xs">إجمالي الإيرادات</p>
                        <span className={`${numberClass} text-green-400`}>{stats.totalRevenue.toFixed(2)}</span>
                    </div>
                    <div>
                        <p className="text-slate-400 text-xs">عدد المشتركين</p>
                        <span className={`${numberClass} text-sky-400`}>{stats.totalSubscribers}</span>
                    </div>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm text-center">
                      <thead>
                          <tr className="bg-slate-800/50 text-yellow-300">
                              <th className="py-3 px-4 font-bold text-right rounded-r-lg">
                                  {activeTab === 'packages' ? 'اسم الباقة' : 'طريقة الدفع'}
                              </th>
                              <th className="py-3 px-4 font-bold">عدد المشتركين</th>
                              <th className="py-3 px-4 font-bold rounded-l-lg">الإيرادات</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700/50">
                          {stats.rows.map((row, idx) => {
                              // Skip rows with 0 subscribers if preferred, or keep them for complete view
                              // Keeping them makes it clear no one used that method/package
                              return (
                                  <tr key={idx} className="hover:bg-yellow-500/5 transition-colors">
                                      <td className="py-3 px-4 font-bold text-white text-sm text-right">{row.label}</td>
                                      <td className={`py-3 px-4 ${numberClass}`}>{row.subscribers}</td>
                                      <td className={`py-3 px-4 ${numberClass}`}>{row.revenue.toFixed(2)}</td>
                                  </tr>
                              );
                          })}
                      </tbody>
                  </table>
                </div>
              </div>
            ) : ( 
                <div className="text-center p-12 bg-black/20 rounded-lg border border-dashed border-slate-700">
                    <p className="font-bold text-slate-400">{selectedWorkshopId === '' ? 'يرجى اختيار ورشة لعرض بياناتها.' : 'لا توجد بيانات لهذه الورشة.'}</p>
                </div> 
            )}
        </div>
      </div>
      <style>{`.z-70 { z-index: 70; }`}</style>
    </div>
  );
};

export default DetailedStatsModal;
