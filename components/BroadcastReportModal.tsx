import React, { useState, useMemo } from 'react';
import { CloseIcon, DownloadIcon } from './icons';
import { BroadcastCampaign, BroadcastRecipient } from '../types';

declare const XLSX: any;

interface BroadcastReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaign: BroadcastCampaign | null;
}

const BroadcastReportModal: React.FC<BroadcastReportModalProps> = ({ isOpen, onClose, campaign }) => {
  const [filter, setFilter] = useState<'All' | 'Sent' | 'Failed'>('All');

  const filteredRecipients = useMemo(() => {
    if (!campaign) return [];
    if (filter === 'All') return campaign.recipients;
    if (filter === 'Sent') return campaign.recipients.filter(r => r.status === 'Sent');
    return campaign.recipients.filter(r => r.status !== 'Sent');
  }, [campaign, filter]);

  if (!isOpen || !campaign) return null;

  const handleExcelExport = () => {
    const dataToExport = filteredRecipients.map(r => ({
      'الاسم': r.fullName,
      'البريد الإلكتروني': r.email,
      'الهاتف': r.phone || '-',
      'الحالة': r.status,
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    worksheet['!cols'] = [{ wch: 30 }, { wch: 30 }, { wch: 20 }, { wch: 25 }];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
    XLSX.writeFile(workbook, `Broadcast_Report_${campaign.id.substring(0, 8)}.xlsx`);
  };

  const filterButtonClasses = (f: typeof filter) => `px-3 py-1.5 text-xs font-bold rounded-md ${filter === f ? 'bg-yellow-500/50 text-white' : 'hover:bg-slate-700/50'}`;
  
  return (
    <div className="fixed inset-0 bg-black/80 z-60 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-yellow-500/50 rounded-lg shadow-xl w-full max-w-4xl h-[90vh] flex flex-col">
        <header className="p-4 flex justify-between items-center border-b border-yellow-500/50">
          <div>
            <h3 className="text-lg font-bold text-yellow-300">تقرير الحملة التفصيلي</h3>
            <p className="text-sm text-slate-300">الموضوع: {campaign.subject}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10"><CloseIcon className="w-6 h-6" /></button>
        </header>

        <div className="p-4 flex justify-between items-center border-b border-slate-800">
          <div className="flex items-center gap-x-2 bg-slate-800/60 p-1 rounded-lg">
            <button onClick={() => setFilter('All')} className={filterButtonClasses('All')}>الكل ({campaign.recipients.length})</button>
            <button onClick={() => setFilter('Sent')} className={filterButtonClasses('Sent')}>الناجحة ({campaign.recipients.filter(r => r.status === 'Sent').length})</button>
            <button onClick={() => setFilter('Failed')} className={filterButtonClasses('Failed')}>الفاشلة ({campaign.recipients.filter(r => r.status !== 'Sent').length})</button>
          </div>
          <button onClick={handleExcelExport} className="flex items-center gap-x-2 bg-slate-700/70 hover:bg-slate-600/70 text-white font-bold py-2 px-3 rounded-lg text-sm">
            <DownloadIcon className="w-5 h-5"/> <span>تصدير القائمة المحددة</span>
          </button>
        </div>

        <div className="overflow-y-auto flex-grow">
          <table className="min-w-full text-sm text-white">
            <thead className="bg-slate-800 sticky top-0"><tr>
              <th className="p-2 text-right">الاسم</th>
              <th className="p-2 text-right">البريد/الهاتف</th>
              <th className="p-2 text-center">الحالة</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-800">
              {filteredRecipients.map((r, i) => (
                <tr key={`${r.userId}-${i}`} className="hover:bg-slate-800/50">
                  <td className="p-2">{r.fullName}</td>
                  <td className="p-2">{campaign.channel === 'whatsapp' ? r.phone : r.email}</td>
                  <td className="p-2 text-center">
                    <span className={`px-2 py-0.5 text-xs rounded-full font-semibold ${r.status === 'Sent' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>{r.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
       <style>{`.z-60 { z-index: 60; }`}</style>
    </div>
  );
};

export default BroadcastReportModal;