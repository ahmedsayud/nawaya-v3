import React, { useRef } from 'react';
import { CloseIcon, PrintIcon, DownloadIcon } from '../../components/icons';
import { formatArabicDate, downloadHtmlAsPdf } from '../../utils';

declare const XLSX: any;

interface AnnualTaxReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    workshopProfit: number;
    consultationProfit: number;
    boutiqueProfit: number;
}

const AnnualTaxReportModal: React.FC<AnnualTaxReportModalProps> = ({ isOpen, onClose, workshopProfit, consultationProfit, boutiqueProfit }) => {
    if (!isOpen) return null;

    const totalNetProfit = workshopProfit + consultationProfit + boutiqueProfit;
    const taxRate = 0.09;
    const totalTaxDue = totalNetProfit * taxRate;

    const handleExcelExport = () => {
        const dataToExport = [
            { Item: 'صافي أرباح الورش', Amount: workshopProfit.toFixed(2) },
            { Item: 'صافي إيرادات الاستشارات', Amount: consultationProfit.toFixed(2) },
            { Item: 'صافي أرباح البوتيك', Amount: boutiqueProfit.toFixed(2) },
            { Item: 'إجمالي صافي الربح', Amount: totalNetProfit.toFixed(2) },
            { Item: 'نسبة الضريبة', Amount: `${(taxRate * 100).toFixed(0)}%` },
            { Item: 'إجمالي الضريبة السنوية المستحقة', Amount: totalTaxDue.toFixed(2) },
        ];
        
        const worksheet = XLSX.utils.json_to_sheet(dataToExport, { skipHeader: true });
        XLSX.utils.sheet_add_aoa(worksheet, [['البند', 'المبلغ']], { origin: 'A1' });
        worksheet['!cols'] = [{ wch: 40 }, { wch: 20 }];
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Annual Tax Report');
        XLSX.writeFile(workbook, `Annual_Tax_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const getPdfHtml = () => {
        const tableRows = `
            <tr><td>صافي أرباح الورش</td><td>${workshopProfit.toFixed(2)}</td></tr>
            <tr><td>صافي إيرادات الاستشارات</td><td>${consultationProfit.toFixed(2)}</td></tr>
            <tr><td>صافي أرباح البوتيك</td><td>${boutiqueProfit.toFixed(2)}</td></tr>
            <tr style="font-weight: bold; background-color: #f3e8ff;"><td>إجمالي صافي الربح</td><td>${totalNetProfit.toFixed(2)}</td></tr>
        `;
        
        return `
            <html>
                <head>
                    <title>تقرير الضريبة السنوية</title>
                    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;700&display=swap" rel="stylesheet">
                    <style>
                        body { font-family: 'Noto Sans Arabic', sans-serif; direction: rtl; background-color: #f8fafc; margin: 0; padding: 20px; }
                        .report-container { width: 100%; max-width: 800px; margin: auto; }
                        .report-header { padding: 20px; background-color: #111827; color: #fcd34d; border-radius: 8px 8px 0 0; text-align: right; border-bottom: 2px solid #fcd34d; }
                        .report-header h1 { margin: 0; font-size: 24px; }
                        .report-header p { margin: 5px 0 0; font-size: 12px; color: #d1d5db; }
                        .summary { padding: 20px; background-color: #f0fdfa; border: 1px solid #ccfbf1; border-radius: 8px; margin-top: 20px; text-align: center; }
                        .summary h2 { margin: 0; font-size: 16px; color: #134e4a; }
                        .summary p { margin: 5px 0 0; font-size: 28px; font-weight: bold; color: #0f766e; }
                        table { width: 100%; border-collapse: collapse; font-size: 14px; background-color: white; margin-top: 20px; }
                        th, td { border: 1px solid #e2e8f0; padding: 12px; text-align: right; }
                        thead tr { background-color: #f3e8ff; color: #5b21b6; font-weight: bold; }
                        tbody tr:nth-child(even) { background-color: #f8fafc; }
                        @page { size: A4 portrait; margin: 20mm; }
                    </style>
                </head>
                <body>
                    <div class="report-container">
                        <div class="report-header">
                            <h1>تقرير الضريبة السنوية على صافي الربح</h1>
                            <p>تاريخ التقرير: ${new Date().toLocaleDateString('ar-EG-u-nu-latn')}</p>
                        </div>
                        <div class="summary">
                            <h2>إجمالي الضريبة السنوية المستحقة (9%)</h2>
                            <p>${totalTaxDue.toFixed(2)}</p>
                        </div>
                        <table>
                            <thead><tr><th>البند</th><th>المبلغ</th></tr></thead>
                            <tbody>${tableRows}</tbody>
                        </table>
                    </div>
                </body>
            </html>
        `;
    };

    const handlePrint = () => {
        const htmlContent = getPdfHtml();
        downloadHtmlAsPdf(htmlContent, `Annual_Tax_Report_${new Date().toISOString().split('T')[0]}.pdf`, 'portrait');
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-70 p-4">
            <div className="bg-theme-gradient backdrop-blur-lg text-white rounded-lg shadow-2xl w-full max-w-3xl border border-teal-500/80 max-h-[90vh] flex flex-col">
                <header className="p-4 flex justify-between items-center border-b border-teal-500/50 flex-shrink-0">
                    <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-cyan-400">تقرير الضريبة السنوية (9%)</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10"><CloseIcon className="w-6 h-6" /></button>
                </header>
                <div className="p-6 overflow-y-auto">
                    <div className="bg-black/20 p-6 rounded-lg mb-6 text-center border border-slate-700">
                        <p className="text-sm font-bold text-teal-300">إجمالي الضريبة السنوية المستحقة</p>
                        <p className="text-4xl font-extrabold text-white my-2">{totalTaxDue.toFixed(2)}</p>
                        <p className="text-sm text-slate-400">بناءً على إجمالي صافي ربح قدره {totalNetProfit.toFixed(2)}</p>
                    </div>
                    <div className="bg-black/20 p-4 rounded-lg">
                        <h3 className="font-bold text-base mb-3 text-white">تفصيل صافي الربح</h3>
                        <table className="min-w-full text-sm text-white">
                            <tbody className="divide-y divide-slate-700/50">
                                <tr className="hover:bg-slate-700/30"><td className="p-3 font-semibold">صافي أرباح الورش</td><td className="p-3 font-mono text-right">{workshopProfit.toFixed(2)}</td></tr>
                                <tr className="hover:bg-slate-700/30"><td className="p-3 font-semibold">صافي إيرادات الاستشارات</td><td className="p-3 font-mono text-right">{consultationProfit.toFixed(2)}</td></tr>
                                <tr className="hover:bg-slate-700/30"><td className="p-3 font-semibold">صافي أرباح البوتيك</td><td className="p-3 font-mono text-right">{boutiqueProfit.toFixed(2)}</td></tr>
                                <tr className="font-bold bg-slate-700/50"><td className="p-3">إجمالي صافي الربح</td><td className="p-3 font-mono text-right text-lg">{totalNetProfit.toFixed(2)}</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
                <footer className="p-4 flex justify-between items-center border-t border-teal-500/50 flex-shrink-0">
                    <button onClick={onClose} className="py-2 px-4 rounded-md bg-slate-600 hover:bg-slate-500 font-bold text-sm">إغلاق</button>
                    <div className="flex items-center gap-x-2">
                        <button onClick={handleExcelExport} className="py-2 px-4 rounded-md bg-teal-700 hover:bg-teal-600 font-bold text-sm flex items-center gap-x-2"><DownloadIcon className="w-5 h-5"/> تصدير Excel</button>
                        <button onClick={handlePrint} className="py-2 px-4 rounded-md bg-purple-600 hover:bg-purple-500 font-bold text-sm flex items-center gap-x-2"><PrintIcon className="w-5 h-5"/> طباعة / حفظ PDF</button>
                    </div>
                </footer>
            </div>
            <style>{`.z-70 { z-index: 70; }`}</style>
        </div>
    );
};

export default AnnualTaxReportModal;