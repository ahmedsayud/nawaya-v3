import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { CloseIcon, DownloadIcon, ChevronDownIcon, PrintIcon } from './icons';
// FIX: Replaced non-existent 'printHtml' with 'downloadHtmlAsPdf' utility function.
import { formatArabicDate, downloadHtmlAsPdf } from '../utils';
import { OrderStatus } from '../types';

declare const XLSX: any;

interface PaidTaxReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PaidTaxReportModal: React.FC<PaidTaxReportModalProps> = ({ isOpen, onClose }) => {
    const { users, workshops, consultationRequests, products } = useUser();
    const [workshopFilter, setWorkshopFilter] = useState('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
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
    

    const { filteredData, totals } = useMemo(() => {
        const subscriptionData = users.flatMap(user =>
            user.isDeleted ? [] : user.subscriptions.map(sub => ({ ...sub, user }))
        ).filter(sub => sub.isApproved !== false).map(sub => {
            const workshop = workshops.find(w => w.id === sub.workshopId);
            const amountPaid = parseFloat(String(sub.pricePaid)) || 0;
            const taxAmount = amountPaid - (amountPaid / 1.05); // Correct VAT calculation
            const netAmount = amountPaid / 1.05;

            return {
                type: 'اشتراك ورشة',
                workshopId: sub.workshopId,
                date: sub.activationDate,
                userName: sub.user.fullName,
                userEmail: sub.user.email,
                title: workshop?.title || 'ورشة غير معروفة',
                amountPaid,
                taxAmount,
                netAmount,
            };
        });

        const consultationData = consultationRequests.filter(req => req.status === 'PAID').map(req => {
            const user = users.find(u => u.id === req.userId);
            const amountPaid = req.fee || 0;
            const taxAmount = amountPaid - (amountPaid / 1.05);
            const netAmount = amountPaid / 1.05;

            return {
                type: 'استشارة',
                workshopId: undefined, // No workshop for consultations
                date: req.consultationDate || req.requestedAt,
                userName: user?.fullName || 'مستخدم غير معروف',
                userEmail: user?.email || '-',
                title: `استشارة: ${req.subject.substring(0, 30)}...`,
                amountPaid,
                taxAmount,
                netAmount,
            };
        });

        const completedOrders = users.flatMap(u => u.isDeleted ? [] : u.orders).filter(o => o.status === OrderStatus.COMPLETED);
        const boutiqueData = completedOrders.map(order => {
            const user = users.find(u => u.id === order.userId);
            return {
                type: 'شراء بوتيك',
                workshopId: undefined,
                date: order.orderDate,
                userName: user?.fullName || 'مستخدم غير معروف',
                userEmail: user?.email || '-',
                title: `طلب رقم #${order.id.substring(0, 8)}`,
                amountPaid: order.totalAmount,
                taxAmount: order.taxAmount,
                netAmount: order.totalAmount - order.taxAmount,
            };
        });


        let combinedData = [...subscriptionData, ...consultationData, ...boutiqueData];

        if (workshopFilter !== 'all') {
            const workshopIdNum = parseInt(workshopFilter, 10);
            combinedData = combinedData.filter(item => item.workshopId === workshopIdNum);
        }

        if (startDate) {
            combinedData = combinedData.filter(item => new Date(item.date) >= new Date(startDate));
        }

        if (endDate) {
            combinedData = combinedData.filter(item => new Date(item.date) <= new Date(endDate));
        }
        
        const calcTotals = combinedData.reduce((acc, item) => {
            acc.totalAmountPaid += item.amountPaid;
            acc.totalTaxAmount += item.taxAmount;
            acc.totalNetAmount += item.netAmount;
            return acc;
        }, { totalAmountPaid: 0, totalTaxAmount: 0, totalNetAmount: 0 });

        return { filteredData: combinedData, totals: calcTotals };
    }, [users, workshops, consultationRequests, products, workshopFilter, startDate, endDate]);


    if (!isOpen) return null;
    
    const handlePdfExport = () => {
        setIsExportMenuOpen(false);
        const tableRows = filteredData.map(item => `
            <tr>
                <td>${item.userName}</td>
                <td>${item.type}</td>
                <td>${item.title}</td>
                <td>${formatArabicDate(item.date)}</td>
                <td>${item.amountPaid.toFixed(2)}</td>
                <td>${item.taxAmount.toFixed(2)}</td>
                <td>${item.netAmount.toFixed(2)}</td>
            </tr>
        `).join('');

        const totalRow = `
            <tfoot>
                <tr>
                    <td colspan="4">الإجمالي</td>
                    <td>${totals.totalAmountPaid.toFixed(2)}</td>
                    <td>${totals.totalTaxAmount.toFixed(2)}</td>
                    <td>${totals.totalNetAmount.toFixed(2)}</td>
                </tr>
            </tfoot>
        `;
        
        const htmlContent = `
            <html>
                <head>
                    <title>Paid Tax Report</title>
                    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;700&display=swap" rel="stylesheet">
                    <style>
                        body { font-family: 'Noto Sans Arabic', sans-serif; direction: rtl; background-color: #f8fafc; margin: 0; padding: 20px; }
                        .report-container { width: 100%; margin: auto; }
                        .report-header { padding: 20px; background: linear-gradient(135deg, #4c1d95 0%, #5b21b6 50%, #c026d3 100%); color: white; border-radius: 8px 8px 0 0; text-align: right; }
                        .report-header h1 { margin: 0; font-size: 24px; }
                        .report-header p, .report-header h2, .report-header h3 { margin: 5px 0 0; font-size: 14px; opacity: 0.9; }
                        table { width: 100%; border-collapse: collapse; font-size: 11px; background-color: white; color: #1f2937; }
                        th, td { border: 1px solid #e2e8f0; padding: 10px; text-align: right; }
                        thead tr { background-color: #f3e8ff; color: #5b21b6; font-weight: bold; }
                        tbody tr:nth-child(even) { background-color: #f8fafc; }
                        tfoot tr { background-color: #ede9fe; font-weight: bold; color: #4c1d95; }
                        @page { size: A4 landscape; margin: 15mm; }
                    </style>
                </head>
                <body>
                    <div class="report-container">
                        <div class="report-header">
                            <h1>تقرير ضريبة القيمة المضافة من الإيرادات</h1>
                            <h3>الشركة: نوايا للفعاليات</h3>
                            <p>الفترة: من ${startDate ? formatArabicDate(startDate) : 'البداية'} إلى ${endDate ? formatArabicDate(endDate) : 'النهاية'}</p>
                            <h2>اجمالي ما يجب دفعه: ${totals.totalTaxAmount.toFixed(2)}</h2>
                        </div>
                        <table>
                            <thead><tr><th>اسم المشترك</th><th>النوع</th><th>العنوان</th><th>تاريخ الاشتراك</th><th>المبلغ المدفوع</th><th>قيمة الضريبة (5%)</th><th>المبلغ الصافي</th></tr></thead>
                            <tbody>${tableRows}</tbody>
                            ${totalRow}
                        </table>
                    </div>
                </body>
            </html>
        `;
        // FIX: Replaced non-existent 'printHtml' with 'downloadHtmlAsPdf' and set a dynamic filename.
        downloadHtmlAsPdf(htmlContent, `Paid_Tax_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    const handleExcelExport = () => {
        setIsExportMenuOpen(false);
        const dataToExport = filteredData.map(item => ({
            'اسم المشترك': item.userName,
            'النوع': item.type,
            'العنوان': item.title,
            'التاريخ': formatArabicDate(item.date),
            'المبلغ المدفوع': item.amountPaid.toFixed(2),
            'قيمة الضريبة': item.taxAmount.toFixed(2),
            'المبلغ الصافي': item.netAmount.toFixed(2),
        }));

        const totalRow = {
            'اسم المشترك': 'الإجمالي',
            'المبلغ المدفوع': totals.totalAmountPaid.toFixed(2),
            'قيمة الضريبة': totals.totalTaxAmount.toFixed(2),
            'المبلغ الصافي': totals.totalNetAmount.toFixed(2),
        };

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        XLSX.utils.sheet_add_json(worksheet, [totalRow], { skipHeader: true, origin: -1 });

        worksheet['!cols'] = [{wch: 25}, {wch: 15}, {wch: 40}, {wch: 20}, {wch: 15}, {wch: 15}, {wch: 15}];
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Paid Tax Report');
        XLSX.writeFile(workbook, `Paid_Tax_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const inputClass = "w-full p-2 bg-indigo-900/40 border border-slate-600 rounded-md focus:ring-fuchsia-500 focus:border-fuchsia-500 text-sm text-white font-bold placeholder:text-white/70";
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-70 p-4">
            <div className="bg-indigo-900/90 backdrop-blur-lg text-white rounded-lg shadow-2xl w-full max-w-6xl border border-fuchsia-500/80 max-h-[90vh] flex flex-col">
                <header className="p-4 flex justify-between items-center border-b border-fuchsia-500/50 flex-shrink-0">
                    <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-400">تقرير ضريبة القيمة المضافة من الإيرادات</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10"><CloseIcon className="w-6 h-6" /></button>
                </header>
                <div className="p-6 flex-shrink-0">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end bg-black/20 p-4 rounded-lg">
                        <div>
                            <label className="block mb-1 text-sm font-bold text-fuchsia-300">فلتر حسب الورشة</label>
                            <select value={workshopFilter} onChange={e => setWorkshopFilter(e.target.value)} className={inputClass}>
                                <option value="all">الإجمالي (يشمل الاستشارات والبوتيك)</option>
                                {workshops.filter(w => !w.isDeleted).map(w => (
                                    <option key={w.id} value={w.id}>{w.title}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block mb-1 text-sm font-bold text-fuchsia-300">من تاريخ</label>
                            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={inputClass + " text-center"} />
                        </div>
                        <div>
                            <label className="block mb-1 text-sm font-bold text-fuchsia-300">إلى تاريخ</label>
                            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className={inputClass + " text-center"} min={startDate} />
                        </div>
                    </div>
                </div>

                <div className="p-6 pt-0 text-center bg-black/20 rounded-lg mx-6 mb-4">
                    <p className="text-sm font-bold text-fuchsia-300">اجمالي الضريبة المحصلة للفترة المحددة</p>
                    <p className="text-3xl font-bold text-white">{totals.totalTaxAmount.toFixed(2)}</p>
                </div>

                <footer className="p-4 flex justify-between items-center border-t border-fuchsia-500/50 flex-shrink-0">
                    <button onClick={onClose} className="py-2 px-4 rounded-md bg-slate-600 hover:bg-slate-500 font-bold text-sm">إغلاق</button>
                    <div ref={exportMenuRef} className="relative">
                        <button onClick={() => setIsExportMenuOpen(p => !p)} className="py-2 px-4 rounded-md bg-purple-600 hover:bg-purple-500 font-bold text-sm flex items-center gap-x-2">
                            <DownloadIcon className="w-5 h-5"/><span>تصدير</span><ChevronDownIcon className="w-4 h-4"/>
                        </button>
                        {isExportMenuOpen && (
                            <div className="absolute bottom-full right-0 mb-2 w-48 bg-slate-800 border border-slate-600 rounded-lg shadow-lg z-20">
                                <button onClick={handleExcelExport} className="w-full text-right px-4 py-2 text-sm text-white hover:bg-fuchsia-500/20 flex items-center gap-x-2"><DownloadIcon className="w-4 h-4" /><span>Excel</span></button>
                                <button onClick={handlePdfExport} className="w-full text-right px-4 py-2 text-sm text-white hover:bg-fuchsia-500/20 flex items-center gap-x-2"><PrintIcon className="w-5 h-5" /><span>PDF</span></button>
                            </div>
                        )}
                    </div>
                </footer>
            </div>
            <style>{`.z-70 { z-index: 70; }`}</style>
        </div>
    );
};

export default PaidTaxReportModal;
