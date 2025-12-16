import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { CloseIcon, DownloadIcon, ChevronDownIcon, PrintIcon } from './icons';
// FIX: Replaced non-existent 'printHtml' with 'downloadHtmlAsPdf' utility function.
import { formatArabicDate, downloadHtmlAsPdf } from '../utils';

declare const XLSX: any;

interface CollectedTaxReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CollectedTaxReportModal: React.FC<CollectedTaxReportModalProps> = ({ isOpen, onClose }) => {
    const { expenses, workshops } = useUser();
    const [workshopFilter, setWorkshopFilter] = useState('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const { totals, htmlSrcDoc } = useMemo(() => {
        let filteredExpenses = expenses.filter(exp => !exp.isDeleted && exp.includesVat !== false);

        if (workshopFilter !== 'all') {
            if (workshopFilter === 'general') {
                filteredExpenses = filteredExpenses.filter(exp => exp.workshopId === undefined);
            } else {
                const workshopIdNum = parseInt(workshopFilter, 10);
                filteredExpenses = filteredExpenses.filter(exp => exp.workshopId === workshopIdNum);
            }
        }

        if (startDate) {
            filteredExpenses = filteredExpenses.filter(exp => new Date(exp.date) >= new Date(startDate));
        }

        if (endDate) {
            filteredExpenses = filteredExpenses.filter(exp => new Date(exp.date) <= new Date(endDate));
        }

        const data = filteredExpenses.map(exp => {
            const workshop = workshops.find(w => w.id === exp.workshopId);
            const amount = parseFloat(String(exp.amount)) || 0;
            const taxAmount = amount - (amount / 1.05); // Correct VAT calculation
            const netAmount = amount / 1.05;

            return {
                date: exp.date, title: exp.title, workshopTitle: workshop?.title || 'مصروف عام', supplier: exp.supplier, amount, taxAmount, netAmount,
            };
        });

        const calcTotals = data.reduce((acc, item) => {
            acc.totalAmount += item.amount;
            acc.totalTaxAmount += item.taxAmount;
            acc.totalNetAmount += item.netAmount;
            return acc;
        }, { totalAmount: 0, totalTaxAmount: 0, totalNetAmount: 0 });

        const tableRows = data.map(item => `
            <tr><td>${formatArabicDate(item.date)}</td><td>${item.title}</td><td>${item.workshopTitle}</td><td>${item.supplier}</td><td>${item.amount.toFixed(2)}</td><td>${item.taxAmount.toFixed(2)}</td><td>${item.netAmount.toFixed(2)}</td></tr>
        `).join('');

        const totalRow = `
            <tfoot>
                <tr><td colspan="4">الإجمالي</td><td>${calcTotals.totalAmount.toFixed(2)}</td><td>${calcTotals.totalTaxAmount.toFixed(2)}</td><td>${calcTotals.totalNetAmount.toFixed(2)}</td></tr>
            </tfoot>
        `;
        
        const srcDoc = `
            <html>
                <head>
                    <title>Collected Tax Report</title>
                    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;700&display=swap" rel="stylesheet">
                    <style>
                        body { font-family: 'Noto Sans Arabic', sans-serif; direction: rtl; background-color: #f8fafc; margin: 0; padding: 20px; }
                        .report-container { width: 100%; margin: auto; }
                        .report-header { padding: 20px; background: linear-gradient(135deg, #4c1d95 0%, #5b21b6 50%, #c026d3 100%); color: white; border-radius: 8px 8px 0 0; text-align: right; }
                        .report-header h1 { margin: 0; font-size: 24px; }
                        .report-header p, .report-header h2, .report-header h3 { margin: 5px 0 0; font-size: 14px; opacity: 0.9; }
                        table { width: 100%; border-collapse: collapse; font-size: 11px; background-color: white; }
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
                            <h1>تقرير الضريبة المستردة على المصروفات</h1>
                            <h3>الشركة: نوايا للفعاليات</h3>
                            <p>الفترة: من ${startDate ? formatArabicDate(startDate) : 'البداية'} إلى ${endDate ? formatArabicDate(endDate) : 'النهاية'}</p>
                            <h2>اجمالي ما يجب استرداده: ${calcTotals.totalTaxAmount.toFixed(2)}</h2>
                        </div>
                        <table>
                            <thead><tr><th>التاريخ</th><th>العنوان</th><th>الورشة</th><th>المورد</th><th>المبلغ</th><th>قيمة الضريبة (5%)</th><th>المبلغ الصافي</th></tr></thead>
                            <tbody>${tableRows}</tbody>
                            ${totalRow}
                        </table>
                    </div>
                </body>
            </html>
        `;

        return { totals: calcTotals, htmlSrcDoc: srcDoc };
    }, [expenses, workshops, workshopFilter, startDate, endDate]);


    if (!isOpen) return null;
    
    const handlePrint = () => {
        // FIX: Replaced non-existent 'printHtml' with 'downloadHtmlAsPdf' and set a dynamic filename.
        downloadHtmlAsPdf(htmlSrcDoc, `Collected_Tax_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    };
    
    const inputClass = "w-full p-2 bg-indigo-900/40 border border-slate-600 rounded-md focus:ring-fuchsia-500 focus:border-fuchsia-500 text-sm text-white font-bold placeholder:text-white/70";
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-70 p-4">
            <div className="bg-indigo-900/90 backdrop-blur-lg text-white rounded-lg shadow-2xl w-full max-w-4xl border border-fuchsia-500/80 max-h-[90vh] flex flex-col">
                <header className="p-4 flex justify-between items-center border-b border-fuchsia-500/50 flex-shrink-0">
                    <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-400">تقرير الضريبة المستردة على المصروفات</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10"><CloseIcon className="w-6 h-6" /></button>
                </header>
                <div className="p-6 flex-shrink-0">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end bg-black/20 p-4 rounded-lg">
                        <div>
                            <label className="block mb-1 text-sm font-bold text-fuchsia-300">فلتر حسب الورشة</label>
                            <select value={workshopFilter} onChange={e => setWorkshopFilter(e.target.value)} className={inputClass}>
                                <option value="all">الإجمالي</option><option value="general">المصروفات العامة فقط</option>{workshops.filter(w => !w.isDeleted).map(w => (<option key={w.id} value={w.id}>{w.title}</option>))}
                            </select>
                        </div>
                        <div><label className="block mb-1 text-sm font-bold text-fuchsia-300">من تاريخ</label><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={inputClass + " text-center"} /></div>
                        <div><label className="block mb-1 text-sm font-bold text-fuchsia-300">إلى تاريخ</label><input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className={inputClass + " text-center"} min={startDate} /></div>
                    </div>
                </div>
                 <div className="p-6 pt-0 text-center bg-black/20 rounded-lg mx-6 mb-4">
                    <p className="text-sm font-bold text-fuchsia-300">اجمالي الضريبة المستردة للفترة المحددة</p>
                    <p className="text-3xl font-bold text-white">{totals.totalTaxAmount.toFixed(2)}</p>
                </div>
                <footer className="p-4 flex justify-end gap-4 border-t border-fuchsia-500/50 flex-shrink-0">
                    <button onClick={onClose} className="py-2 px-4 rounded-md bg-slate-600 hover:bg-slate-500 font-bold text-sm">إغلاق</button>
                    <button onClick={handlePrint} className="py-2 px-4 rounded-md bg-purple-600 hover:bg-purple-500 font-bold text-sm flex items-center gap-x-2"><PrintIcon className="w-5 h-5"/> طباعة / حفظ PDF</button>
                </footer>
            </div>
            <style>{`.z-70 { z-index: 70; }`}</style>
        </div>
    );
};

export default CollectedTaxReportModal;
