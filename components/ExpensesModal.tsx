
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useUser } from '../context/UserContext';
import { CloseIcon, DownloadIcon, TrashIcon, RestoreIcon, PencilIcon, ChevronDownIcon, PrintIcon } from './icons';
import { Expense } from '../types';
// FIX: Changed default import of ConfirmationModal to a named import.
import { ConfirmationModal } from './ConfirmationModal';
import { formatArabicDate, toEnglishDigits } from '../utils';

declare const XLSX: any;

interface ExpensesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// FIX: Changed to a named export
export const ExpensesModal: React.FC<ExpensesModalProps> = ({ isOpen, onClose }) => {
    const { workshops, expenses, addExpense, updateExpense, deleteExpense, restoreExpense, permanentlyDeleteExpense } = useUser();
    
    // Form state
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
    const [title, setTitle] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [workshopId, setWorkshopId] = useState(''); // Empty string for 'General'
    const [supplier, setSupplier] = useState('');
    const [amount, setAmount] = useState('');
    const [invoiceImage, setInvoiceImage] = useState<string | null>(null);
    const [notes, setNotes] = useState('');
    const [includesVat, setIncludesVat] = useState(true);
    const [expenseFilter, setExpenseFilter] = useState<string>('all');
    const [isExportMenuOpen, setIsExpenseExportMenuOpen] = useState(false);
    const [pdfPreviewHtml, setPdfPreviewHtml] = useState<string | null>(null);

    const [confirmation, setConfirmation] = useState({ 
        isOpen: false, 
        expenseId: '', 
        title: '', 
        action: 'soft-delete' as 'soft-delete' | 'permanent-delete'
    });
    const [activeExpenseTab, setActiveExpenseTab] = useState<'active' | 'trash'>('active');
    const expenseFormRef = useRef<HTMLDivElement>(null);
    const expenseExportMenuRef = useRef<HTMLDivElement>(null);
    const pdfIframeRef = useRef<HTMLIFrameElement>(null);

     useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (expenseExportMenuRef.current && !expenseExportMenuRef.current.contains(event.target as Node)) {
                setIsExpenseExportMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (editingExpense) {
            setTitle(editingExpense.title);
            setDate(editingExpense.date.split('T')[0]);
            setInvoiceNumber(editingExpense.invoiceNumber || '');
            setWorkshopId(editingExpense.workshopId?.toString() || '');
            setSupplier(editingExpense.supplier);
            setAmount(editingExpense.amount.toString());
            setInvoiceImage(editingExpense.invoiceImageUrl || null);
            setNotes(editingExpense.notes || '');
            setIncludesVat(editingExpense.includesVat ?? true);
        } else {
            resetForm();
        }
    }, [editingExpense]);

    const activeExpenses = expenses.filter(exp => !exp.isDeleted);
    const trashedExpenses = expenses.filter(exp => exp.isDeleted);
    
    const filteredActiveExpenses = useMemo(() => {
        if (expenseFilter === 'all') return activeExpenses;
        if (expenseFilter === 'general') return activeExpenses.filter(exp => !exp.workshopId);
        return activeExpenses.filter(exp => exp.workshopId === parseInt(expenseFilter));
    }, [activeExpenses, expenseFilter]);

    const filteredTrashedExpenses = useMemo(() => {
        if (expenseFilter === 'all') return trashedExpenses;
        if (expenseFilter === 'general') return trashedExpenses.filter(exp => !exp.workshopId);
        return trashedExpenses.filter(exp => exp.workshopId === parseInt(expenseFilter));
    }, [trashedExpenses, expenseFilter]);

    const totalAmount = useMemo(() => {
        const source = activeExpenseTab === 'active' ? filteredActiveExpenses : filteredTrashedExpenses;
        return source.reduce((sum, exp) => sum + exp.amount, 0);
    }, [activeExpenseTab, filteredActiveExpenses, filteredTrashedExpenses]);


    if (!isOpen) return null;

    const getExpenseFilterName = () => {
        if (expenseFilter === 'all') return 'كل المصروفات';
        if (expenseFilter === 'general') return 'مصروفات عامة';
        return workshops.find(w => w.id === parseInt(expenseFilter, 10))?.title || 'فلتر غير معروف';
    };

    const handleExpenseExcelExport = () => {
        setIsExpenseExportMenuOpen(false);
        const filterName = getExpenseFilterName();
        const filename = `Expenses_${filterName.replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;

        const dataRows = filteredActiveExpenses.map(expense => ({
            'التاريخ': formatArabicDate(expense.date),
            'العنوان': expense.title,
            'رقم الفاتورة': expense.invoiceNumber || '-',
            'الورشة / عام': workshops.find(w => w.id === expense.workshopId)?.title || 'مصروف عام',
            'المورد': expense.supplier,
            'المبلغ': expense.amount.toFixed(2),
            'تشمل الضريبة': expense.includesVat !== false ? 'نعم' : 'لا',
            'الملاحظات': expense.notes || '-',
        }));

        const totalRow = {
            'التاريخ': 'الإجمالي',
            'المبلغ': totalAmount.toFixed(2),
        };
        
        const worksheet = XLSX.utils.json_to_sheet(dataRows);
        XLSX.utils.sheet_add_json(worksheet, [totalRow], { skipHeader: true, origin: -1 });

        worksheet['!cols'] = [ { wch: 20 }, { wch: 30 }, { wch: 15 }, { wch: 30 }, { wch: 20 }, { wch: 10 }, { wch: 15 }, { wch: 40 } ];
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'المصروفات');

        XLSX.writeFile(workbook, filename);
    };

    const handleExpensePdfExport = () => {
        setIsExpenseExportMenuOpen(false);
        const filterName = getExpenseFilterName();
        const tableRows = filteredActiveExpenses.map(expense => `
            <tr>
                <td>${formatArabicDate(expense.date)}</td>
                <td>${expense.title}</td>
                <td>${workshops.find(w => w.id === expense.workshopId)?.title || 'مصروف عام'}</td>
                <td>${expense.supplier}</td>
                <td>${expense.amount.toFixed(2)}</td>
                <td>${expense.includesVat !== false ? 'نعم' : 'لا'}</td>
            </tr>
        `).join('');
        
        const totalRow = `<tfoot><tr><td colspan="4">الإجمالي</td><td>${totalAmount.toFixed(2)}</td><td></td></tr></tfoot>`;

        const htmlContent = `
            <html><head><title>تقرير المصروفات</title>
                <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;700&display=swap" rel="stylesheet">
                <style>
                    body { font-family: 'Noto Sans Arabic', sans-serif; direction: rtl; background-color: #f8fafc; margin: 20px; }
                    .report-header { text-align: right; margin-bottom: 20px; padding: 20px; background-color: #111827; color: #fcd34d; border-radius: 8px 8px 0 0; border-bottom: 2px solid #fcd34d; }
                    h1 { margin:0; font-size: 24px; }
                    p { margin: 5px 0 0; font-size: 12px; color: #d1d5db; }
                    table { width: 100%; border-collapse: collapse; font-size: 11px; background-color: white; color: #1f2937; }
                    th, td { border: 1px solid #e5e7eb; padding: 8px; text-align: right; }
                    thead tr { background-color: #fefce8; font-weight: bold; color: #713f12; }
                    tbody tr:nth-child(even) { background-color: #f9fafb; }
                    tfoot tr { background-color: #fefce8; font-weight: bold; color: #713f12; }
                    @page { size: A4 landscape; margin: 15mm; }
                </style>
            </head><body>
                <div class="report-header">
                    <h1>تقرير المصروفات</h1>
                    <p>التصنيف: ${filterName}</p>
                </div>
                <table>
                    <thead><tr><th>التاريخ</th><th>العنوان</th><th>الورشة / عام</th><th>المورد</th><th>المبلغ</th><th>تشمل الضريبة</th></tr></thead>
                    <tbody>${tableRows}</tbody>${totalRow}
                </table>
            </body></html>`;

        setPdfPreviewHtml(htmlContent);
    };
    
    const handlePrintPdf = () => {
        if(pdfIframeRef.current?.contentWindow) {
            pdfIframeRef.current.contentWindow.focus();
            pdfIframeRef.current.contentWindow.print();
        }
    };


    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setInvoiceImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const resetForm = () => {
        setTitle('');
        setDate(new Date().toISOString().split('T')[0]);
        setInvoiceNumber('');
        setWorkshopId('');
        setSupplier('');
        setAmount('');
        setInvoiceImage(null);
        setNotes('');
        setIncludesVat(true);
        // Also reset the file input visually
        const fileInput = document.getElementById('invoice-image-input') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !supplier || !amount) {
            alert('يجب إدخال عنوان الفاتورة، اسم المورد، والمبلغ.');
            return;
        }
        
        const expenseData = {
            title,
            date: new Date(date).toISOString(),
            invoiceNumber: invoiceNumber || undefined,
            workshopId: workshopId ? parseInt(workshopId) : undefined,
            supplier,
            amount: parseFloat(amount),
            invoiceImageUrl: invoiceImage || undefined,
            notes: notes || undefined,
            includesVat: includesVat,
        };

        if (editingExpense) {
            updateExpense({
                ...editingExpense,
                ...expenseData,
            });
            setEditingExpense(null);
        } else {
            addExpense(expenseData);
            resetForm();
        }
    };
    
    const handleEditClick = (expense: Expense) => {
        setEditingExpense(expense);
        expenseFormRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleDeleteClick = (expense: Expense) => {
        setConfirmation({ isOpen: true, expenseId: expense.id, title: expense.title, action: 'soft-delete' });
    };

    const handlePermanentDeleteClick = (expense: Expense) => {
        setConfirmation({ isOpen: true, expenseId: expense.id, title: expense.title, action: 'permanent-delete' });
    };

    const handleConfirmDelete = () => {
        if (confirmation.action === 'soft-delete') {
            deleteExpense(confirmation.expenseId);
        } else {
            permanentlyDeleteExpense(confirmation.expenseId);
        }
        setConfirmation({ isOpen: false, expenseId: '', title: '', action: 'soft-delete' });
    };

    const labelClass = "block mb-1 text-sm font-bold text-yellow-300 tracking-wide";
    const inputClass = "w-full p-2 bg-slate-800 border border-slate-700 rounded-md focus:ring-yellow-500 focus:border-yellow-500 text-sm text-white font-bold placeholder:text-slate-400/70";
    
    const expenseTabButtonClasses = (tabName: 'active' | 'trash') => 
        `px-4 py-2 text-sm font-bold rounded-t-lg transition-colors flex items-center gap-x-2 ${
        activeExpenseTab === tabName 
            ? 'bg-black/20 text-white border-b-2 border-yellow-500' 
            : 'text-white hover:bg-white/5'
        }`;

    return (
        <>
        {pdfPreviewHtml && (
             <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-80 p-4">
                <div className="bg-slate-900 text-white rounded-lg shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col border border-yellow-500/50">
                    <header className="p-4 flex justify-between items-center border-b border-yellow-500/50 flex-shrink-0">
                        <h2 className="text-lg font-bold text-yellow-300">معاينة التقرير</h2>
                        <button onClick={() => setPdfPreviewHtml(null)} className="p-2 rounded-full hover:bg-white/10"><CloseIcon className="w-6 h-6" /></button>
                    </header>
                    <div className="flex-grow p-4 bg-slate-800"><iframe ref={pdfIframeRef} srcDoc={pdfPreviewHtml} title="PDF Preview" className="w-full h-full border-0 bg-white"/></div>
                    <footer className="p-4 flex justify-end gap-4 border-t border-yellow-500/50 flex-shrink-0">
                        <button onClick={() => setPdfPreviewHtml(null)} className="py-2 px-4 rounded-md bg-slate-600 hover:bg-slate-500 font-bold text-sm">إغلاق</button>
                        <button onClick={handlePrintPdf} className="py-2 px-4 rounded-md bg-yellow-600 hover:bg-yellow-500 font-bold text-sm flex items-center gap-x-2"><PrintIcon className="w-5 h-5"/> طباعة / حفظ PDF</button>
                    </footer>
                </div>
             </div>
        )}
        <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-70 p-4">
            <div className="bg-slate-900 text-white rounded-lg shadow-2xl w-full max-w-6xl border border-yellow-500/50 max-h-[90vh] flex flex-col">
                <header className="p-4 flex justify-between items-center border-b border-yellow-500/50 flex-shrink-0">
                    <h2 className="text-xl font-bold text-yellow-300">إدارة المصروفات</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10"><CloseIcon className="w-6 h-6" /></button>
                </header>
                
                <div className="flex-grow p-6 overflow-y-auto">
                    <div className="bg-black/20 p-4 rounded-lg mb-6" ref={expenseFormRef}>
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-bold text-yellow-300">{editingExpense ? 'تعديل المصروف' : 'إضافة مصروف جديد'}</h3>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                <div className="space-y-4">
                                    <div><label className={labelClass}>عنوان الفاتورة</label><input type="text" value={title} onChange={e => setTitle(e.target.value)} className={inputClass} required /></div>
                                    <div><label className={labelClass}>التاريخ</label><input type="date" value={date} onChange={e => setDate(e.target.value)} className={inputClass} required /></div>
                                    <div><label className={labelClass}>رقم الفاتورة (اختياري)</label><input type="text" value={invoiceNumber} onChange={e => setInvoiceNumber(toEnglishDigits(e.target.value))} className={inputClass} /></div>
                                    <div><label className={labelClass}>الشركة الموردة</label><input type="text" value={supplier} onChange={e => setSupplier(e.target.value)} className={inputClass} required /></div>
                                    <div>
                                        <label className={labelClass}>مبلغ الفاتورة</label>
                                        <input type="number" step="0.01" value={amount} onChange={e => setAmount(toEnglishDigits(e.target.value))} className={inputClass} required />
                                    </div>
                                    <div className="flex items-center gap-x-2 pt-2">
                                        <input type="checkbox" id="includesVat" checked={includesVat} onChange={e => setIncludesVat(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-yellow-600 focus:ring-yellow-500" />
                                        <label htmlFor="includesVat" className="text-sm font-bold text-white">الفاتورة تشمل الضريبة</label>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div><label className={labelClass}>خاص بورشة (أو اتركه فارغاً لمصروف عام)</label><select value={workshopId} onChange={e => setWorkshopId(e.target.value)} className={inputClass}><option value="">-- مصروف عام --</option>{workshops.filter(w => !w.isDeleted).map(w => (<option key={w.id} value={w.id}>{w.title}</option>))}</select></div>
                                    <div><label className={labelClass}>صورة الفاتورة (اختياري)</label><input id="invoice-image-input" type="file" onChange={handleFileChange} accept="image/*" className={`${inputClass} file:mr-4 file:py-1.5 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-yellow-100 file:text-yellow-700 hover:file:bg-yellow-200`} /></div>
                                    <div className="flex-grow flex flex-col"><label className={labelClass}>ملاحظات</label><textarea value={notes} onChange={e => setNotes(e.target.value)} className={`${inputClass} flex-grow`} rows={4}></textarea></div>
                                </div>
                            </div>
                            <div className="text-right pt-4 border-t border-slate-700/50 flex justify-end gap-x-4">
                                {editingExpense && (
                                    <button type="button" onClick={() => setEditingExpense(null)} className="py-2 px-4 rounded-md bg-slate-600 hover:bg-slate-500 text-white font-bold text-sm">
                                        إلغاء التعديل
                                    </button>
                                )}
                                <button type="submit" className="py-2 px-4 rounded-md bg-yellow-600 hover:bg-yellow-500 text-white font-bold text-sm">
                                    {editingExpense ? 'حفظ التعديلات' : 'إضافة المصروف'}
                                </button>
                            </div>
                        </form>
                    </div>

                    <div className="flex justify-between items-center border-b border-slate-700 mt-6 mb-4">
                        <nav className="-mb-px flex space-x-4">
                            <button onClick={() => setActiveExpenseTab('active')} className={expenseTabButtonClasses('active')}>المصروفات النشطة</button>
                            <button onClick={() => setActiveExpenseTab('trash')} className={expenseTabButtonClasses('trash')}><TrashIcon className="w-4 h-4" />سلة المهملات</button>
                        </nav>
                        <div className="flex items-center gap-x-4">
                            <div className="flex items-center gap-x-2">
                                <label htmlFor="expenseFilter" className="text-sm font-bold text-white">تصنيف:</label>
                                <select
                                    id="expenseFilter"
                                    value={expenseFilter}
                                    onChange={e => setExpenseFilter(e.target.value)}
                                    className={inputClass + " w-60"}
                                >
                                    <option value="all">كل المصروفات</option>
                                    <option value="general">مصروفات عامة</option>
                                    {workshops.filter(w => !w.isDeleted).map(w => (
                                        <option key={w.id} value={w.id}>{w.title}</option>
                                    ))}
                                </select>
                            </div>
                            {activeExpenseTab === 'active' && (
                                <div className="relative" ref={expenseExportMenuRef}>
                                    <button
                                        onClick={() => setIsExpenseExportMenuOpen(prev => !prev)}
                                        className="flex items-center gap-x-2 bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded-md transition-transform hover:scale-105 text-sm"
                                    >
                                        <span>تصدير</span>
                                        <ChevronDownIcon className="w-4 h-4" />
                                    </button>
                                    {isExportMenuOpen && (
                                        <div className="absolute left-0 mt-2 w-48 bg-slate-800 border border-slate-600 rounded-md shadow-lg z-10">
                                            <ul>
                                                <li><button onClick={handleExpenseExcelExport} className="w-full text-right px-4 py-2 text-sm font-bold hover:bg-yellow-500/20 flex items-center gap-x-2"><DownloadIcon className="w-4 h-4" /><span>EXCEL</span></button></li>
                                                <li><button onClick={handleExpensePdfExport} className="w-full text-right px-4 py-2 text-sm font-bold hover:bg-yellow-500/20 flex items-center gap-x-2"><PrintIcon className="w-4 h-4" /><span>PDF</span></button></li>
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                     <div className="text-xs text-slate-400 my-2 px-1">
                        إجمالي {activeExpenseTab === 'active' ? filteredActiveExpenses.length : filteredTrashedExpenses.length} مصروف | إجمالي المبلغ: <span className="font-bold text-white">{totalAmount.toFixed(2)}</span>
                    </div>
                    <div className="overflow-x-auto">
                        {activeExpenseTab === 'active' ? (
                            <table className="min-w-full text-sm text-center text-white">
                              <thead className="text-yellow-300 uppercase tracking-wider font-bold text-sm"><tr className="bg-black/20"><th className="py-4 px-3 text-right">العنوان</th><th className="py-4 px-3 text-right">الورشة / عام</th><th className="py-4 px-3 text-center">المورد</th><th className="py-4 px-3 text-center">المبلغ</th><th className="py-4 px-3 text-center">التاريخ</th><th className="py-4 px-3 text-center">الإجراءات</th></tr></thead>
                              <tbody className="divide-y divide-slate-800">
                                {filteredActiveExpenses.map(exp => (
                                  <tr key={exp.id} className="hover:bg-yellow-500/10">
                                    <td className="py-3 px-3 text-right font-semibold">{exp.title}</td>
                                    <td className="py-3 px-3 text-right">{workshops.find(w => w.id === exp.workshopId)?.title || 'عام'}</td>
                                    <td className="py-3 px-3 text-center">{exp.supplier}</td>
                                    <td className="py-3 px-3 text-center font-bold">{exp.amount.toFixed(2)}</td>
                                    <td className="py-3 px-3 text-center">{formatArabicDate(exp.date)}</td>
                                    <td className="py-3 px-3">
                                      <div className="flex items-center justify-center gap-x-2">
                                        <button onClick={() => handleEditClick(exp)} className="p-2 rounded-md text-white hover:bg-yellow-500/20"><PencilIcon className="w-5 h-5"/></button>
                                        <button onClick={() => handleDeleteClick(exp)} className="p-2 rounded-md text-white hover:bg-pink-500/20"><TrashIcon className="w-5 h-5"/></button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                                {filteredActiveExpenses.length === 0 && (
                                  <tr><td colSpan={6} className="p-8 text-center text-slate-400">لا توجد مصروفات نشطة.</td></tr>
                                )}
                              </tbody>
                            </table>
                        ) : (
                           <table className="min-w-full text-sm text-center text-white">
                              <thead className="text-pink-300 uppercase tracking-wider font-bold text-sm"><tr className="bg-black/20"><th className="py-4 px-3 text-right">العنوان</th><th className="py-4 px-3 text-center">المبلغ</th><th className="py-4 px-3 text-center">التاريخ</th><th className="py-4 px-3 text-center">الإجراءات</th></tr></thead>
                              <tbody className="divide-y divide-slate-800">
                                {filteredTrashedExpenses.map(exp => (
                                  <tr key={exp.id} className="hover:bg-pink-500/10 opacity-60">
                                    <td className="py-3 px-3 text-right font-semibold">{exp.title}</td>
                                    <td className="py-3 px-3 text-center font-bold">{exp.amount.toFixed(2)}</td>
                                    <td className="py-3 px-3 text-center">{formatArabicDate(exp.date)}</td>
                                    <td className="py-3 px-3">
                                      <div className="flex items-center justify-center gap-x-2">
                                        <button onClick={() => restoreExpense(exp.id)} className="p-2 rounded-md text-white hover:bg-green-500/20"><RestoreIcon className="w-5 h-5"/></button>
                                        <button onClick={() => handlePermanentDeleteClick(exp)} className="p-2 rounded-md text-white hover:bg-red-500/20"><TrashIcon className="w-5 h-5"/></button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                                {filteredTrashedExpenses.length === 0 && (
                                  <tr><td colSpan={4} className="p-8 text-center text-slate-400">سلة المهملات فارغة.</td></tr>
                                )}
                              </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
            <style>{`.z-70 { z-index: 70; } .z-80 { z-index: 80; }`}</style>
        </div>
        
        <ConfirmationModal 
          isOpen={confirmation.isOpen}
          onClose={() => setConfirmation(prev => ({ ...prev, isOpen: false }))}
          onConfirm={handleConfirmDelete}
          title={confirmation.action === 'soft-delete' ? 'نقل إلى سلة المهملات' : 'حذف نهائي'}
          message={`هل أنت متأكد من ${confirmation.action === 'soft-delete' ? 'نقل' : 'حذف'} مصروف "${confirmation.title}"؟`}
        />
        </>
    );
};
