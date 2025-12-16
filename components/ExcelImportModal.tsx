
import React, { useState, useMemo, ChangeEvent, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { User, Workshop, Package, SubscriptionStatus } from '../types';
import { CloseIcon, ArrowCircleUpIcon, DownloadIcon, CheckCircleIcon, ExclamationCircleIcon } from '../components/icons';
import { normalizePhoneNumber } from '../utils';

declare const XLSX: any;

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ParsedRow {
  name: string;
  email: string;
  phone: string;
  rowNumber: number;
}

type ValidationStatus = 
  | 'valid_new' 
  | 'valid_existing'
  | 'error_missing_data'
  | 'error_invalid_email'
  | 'error_invalid_phone'
  | 'error_duplicate_in_file'
  | 'error_email_exists'
  | 'error_phone_exists'
  | 'error_conflict'
  | 'error_already_subscribed';

interface ValidatedRow {
  data: ParsedRow;
  status: ValidationStatus;
  message: string;
  user?: User;
  isSelected: boolean;
}

const getStatusInfo = (status: ValidationStatus): { text: string; color: string; icon: React.FC<{className?:string}> } => {
    switch(status) {
        case 'valid_new': return { text: 'صالح (مستخدم جديد)', color: 'text-sky-400', icon: CheckCircleIcon };
        case 'valid_existing': return { text: 'صالح (مستخدم حالي)', color: 'text-green-400', icon: CheckCircleIcon };
        case 'error_missing_data': return { text: 'خطأ: بيانات ناقصة', color: 'text-red-400', icon: ExclamationCircleIcon };
        case 'error_invalid_email': return { text: 'خطأ: بريد إلكتروني غير صالح', color: 'text-red-400', icon: ExclamationCircleIcon };
        case 'error_invalid_phone': return { text: 'خطأ: رقم هاتف غير صالح', color: 'text-red-400', icon: ExclamationCircleIcon };
        case 'error_duplicate_in_file': return { text: 'خطأ: بيانات مكررة في الملف', color: 'text-red-400', icon: ExclamationCircleIcon };
        case 'error_email_exists': return { text: 'خطأ: البريد الإلكتروني مسجل لمستخدم آخر', color: 'text-red-400', icon: ExclamationCircleIcon };
        case 'error_phone_exists': return { text: 'خطأ: الهاتف مسجل لمستخدم آخر', color: 'text-red-400', icon: ExclamationCircleIcon };
        case 'error_conflict': return { text: 'خطأ: البريد والهاتف مسجلان لمستخدمين مختلفين', color: 'text-red-400', icon: ExclamationCircleIcon };
        case 'error_already_subscribed': return { text: 'خطأ: مشترك بالفعل في هذه الورشة', color: 'text-red-400', icon: ExclamationCircleIcon };
        default: return { text: 'غير معروف', color: 'text-slate-400', icon: ExclamationCircleIcon };
    }
};

const ExcelImportModal: React.FC<ExcelImportModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { workshops, addUser, addSubscription, checkRegistrationAvailability } = useUser();
  
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [validatedRows, setValidatedRows] = useState<ValidatedRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  const [selectedWorkshopId, setSelectedWorkshopId] = useState('');
  const [selectedPackageId, setSelectedPackageId] = useState('');
  const [pricePaid, setPricePaid] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'BANK' | 'LINK' | 'GIFT' | 'CREDIT' | ''>('');

  const selectedWorkshop = useMemo(() => workshops.find(w => w.id.toString() === selectedWorkshopId), [workshops, selectedWorkshopId]);

  const resetState = () => {
    setFile(null);
    setParsedRows([]);
    setValidatedRows([]);
    setIsProcessing(false);
    setError('');
    setSelectedWorkshopId('');
    setSelectedPackageId('');
    setPricePaid('');
    setPaymentMethod('');
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
        setFile(selectedFile);
        parseAndValidateFile(selectedFile);
    }
  };

  const parseAndValidateFile = (fileToParse: File) => {
    setIsProcessing(true);
    setError('');
    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
            
            const header = jsonData[0].map((h:any) => h.toString().trim());
            const nameIndex = header.findIndex((h:string) => h.includes('اسم المستخدم'));
            const emailIndex = header.findIndex((h:string) => h.includes('البريد الإلكتروني'));
            const phoneIndex = header.findIndex((h:string) => h.includes('رقم الهاتف'));

            if (nameIndex === -1 || emailIndex === -1 || phoneIndex === -1) {
                setError('الملف يجب أن يحتوي على أعمدة "اسم المستخدم", "البريد الإلكتروني", و "رقم الهاتف".');
                setIsProcessing(false);
                return;
            }

            const rows: ParsedRow[] = jsonData.slice(1).map((row, index) => ({
                name: row[nameIndex]?.toString().trim() || '',
                email: row[emailIndex]?.toString().trim() || '',
                phone: normalizePhoneNumber(row[phoneIndex]?.toString().trim() || ''),
                rowNumber: index + 2,
            })).filter(r => r.name || r.email || r.phone);

            setParsedRows(rows);
        } catch (err) {
            setError('حدث خطأ أثناء قراءة الملف. تأكد من أنه ملف Excel صالح.');
        } finally {
            setIsProcessing(false);
        }
    };
    reader.readAsArrayBuffer(fileToParse);
  };
  
  useEffect(() => {
    if (parsedRows.length > 0) {
        const validate = async () => {
            setIsProcessing(true);
            const newValidatedRows: ValidatedRow[] = [];
            const seenEmails = new Set<string>();
            const seenPhones = new Set<string>();
            
            for (const row of parsedRows) {
                let status: ValidationStatus = 'valid_new';
                let message = '';
                let user: User | undefined;

                if (!row.name || !row.email || !row.phone) {
                    status = 'error_missing_data';
                } else if (!/\S+@\S+\.\S+/.test(row.email)) {
                    status = 'error_invalid_email';
                } else if (!/^\d{8,}$/.test(row.phone)) {
                    status = 'error_invalid_phone';
                } else if (seenEmails.has(row.email.toLowerCase()) || seenPhones.has(row.phone)) {
                    status = 'error_duplicate_in_file';
                } else {
                    seenEmails.add(row.email.toLowerCase());
                    seenPhones.add(row.phone);

                    const { emailUser, phoneUser } = checkRegistrationAvailability(row.email, row.phone);
                    
                    if (emailUser && phoneUser) {
                        if (emailUser.id !== phoneUser.id) status = 'error_conflict';
                        else { status = 'valid_existing'; user = emailUser; }
                    } else if (emailUser) {
                        status = 'error_email_exists';
                    } else if (phoneUser) {
                        status = 'error_phone_exists';
                    }

                    if (user && selectedWorkshopId) {
                        const isSubscribed = user.subscriptions.some(s => s.workshopId === parseInt(selectedWorkshopId) && s.status !== SubscriptionStatus.REFUNDED);
                        if (isSubscribed) status = 'error_already_subscribed';
                    }
                }
                
                newValidatedRows.push({ data: row, status, message, user, isSelected: status.startsWith('valid') });
            }
            setValidatedRows(newValidatedRows);
            setIsProcessing(false);
        };
        validate();
    }
  }, [parsedRows, selectedWorkshopId, checkRegistrationAvailability]);

  const handleToggleSelect = (index: number) => {
    setValidatedRows(prev => {
      const newRows = [...prev];
      if (newRows[index].status.startsWith('valid')) {
        newRows[index].isSelected = !newRows[index].isSelected;
      }
      return newRows;
    });
  };

  const handleSelectAll = (e: ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    setValidatedRows(prev => prev.map(r => r.status.startsWith('valid') ? { ...r, isSelected: isChecked } : r));
  };
  
  const handleImport = () => {
      if (!selectedWorkshopId || !pricePaid || !paymentMethod) {
          setError('يرجى تحديد الورشة، المبلغ المدفوع، وطريقة الدفع.');
          return;
      }
      
      const rowsToImport = validatedRows.filter(r => r.isSelected && r.status.startsWith('valid'));
      if (rowsToImport.length === 0) {
          setError('لم يتم تحديد أي مستخدمين صالحين للاستيراد.');
          return;
      }

      setIsProcessing(true);
      
      rowsToImport.forEach(row => {
          let userToSubscribe: User;
          if (row.status === 'valid_new') {
              userToSubscribe = addUser(row.data.name, row.data.email, row.data.phone);
          } else {
              userToSubscribe = row.user!;
          }

          addSubscription(
              userToSubscribe.id,
              {
                  workshopId: parseInt(selectedWorkshopId),
                  packageId: selectedPackageId ? parseInt(selectedPackageId) : undefined,
                  pricePaid: parseFloat(pricePaid),
                  paymentMethod: paymentMethod,
                  notes: 'Imported via Excel (Advanced)',
              },
              true, // Auto-approve
              false // Don't send WhatsApp
          );
      });
      
      onSuccess();
      onClose();
      resetState();
  };
  
  const handleDownloadTemplate = () => {
    const data = [['اسم المستخدم', 'البريد الإلكتروني', 'رقم الهاتف']];
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    worksheet['!cols'] = [{ wch: 30 }, { wch: 30 }, { wch: 20 }];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');
    XLSX.writeFile(workbook, 'Nawaya_Users_Full_Import_Template.xlsx');
  };

  const selectedCount = validatedRows.filter(r => r.isSelected).length;
  const totalValidCount = validatedRows.filter(r => r.status.startsWith('valid')).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 z-80 flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-slate-900 text-white border border-fuchsia-500/50 rounded-lg shadow-xl w-full max-w-5xl h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="p-4 flex justify-between items-center border-b border-fuchsia-500/50">
          <h3 className="text-lg font-bold text-fuchsia-300">استيراد الاشتراكات من Excel</h3>
          <button onClick={onClose} className="p-2 rounded-full text-slate-400 hover:bg-white/10 hover:text-white transition-colors"><CloseIcon className="w-6 h-6" /></button>
        </header>

        <div className="p-6 overflow-y-auto space-y-6">
          <div className="bg-black/20 p-4 rounded-lg border border-slate-700 space-y-4">
            <div>
                <h4 className="font-bold text-white mb-2">1. تحميل قائمة المستخدمين</h4>
                <p className="text-sm text-slate-400 mb-2">ارفع ملف Excel يحتوي على أعمدة "اسم المستخدم", "البريد الإلكتروني", و "رقم الهاتف".</p>
                <div className="flex items-center gap-x-4">
                    <input type="file" id="excel-upload-users" onChange={handleFileChange} accept=".xlsx" className="hidden" />
                    <label htmlFor="excel-upload-users" className="cursor-pointer flex items-center gap-x-2 bg-sky-600 hover:bg-sky-500 text-white font-bold py-2 px-4 rounded-lg text-sm">
                        <ArrowCircleUpIcon className="w-5 h-5"/> <span>اختر ملف...</span>
                    </label>
                    <button type="button" onClick={handleDownloadTemplate} className="text-sm text-slate-300 hover:underline">تحميل القالب</button>
                    {file && <span className="text-sm text-slate-300 font-semibold">{file.name}</span>}
                </div>
            </div>
          </div>
          
          {(parsedRows.length > 0 || isProcessing) && (
            <div className="bg-black/20 p-4 rounded-lg border border-slate-700 space-y-4">
              <h4 className="font-bold text-white mb-2">2. تحديد تفاصيل الاشتراك</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div><label className="text-xs text-fuchsia-300">الورشة</label><select value={selectedWorkshopId} onChange={e => setSelectedWorkshopId(e.target.value)} className="w-full p-2 bg-slate-800/60 border border-slate-700 rounded-md text-sm"><option value="" disabled>اختر ورشة</option>{workshops.map(w => <option key={w.id} value={w.id}>{w.title}</option>)}</select></div>
                  <div><label className="text-xs text-fuchsia-300">الباقة (اختياري)</label><select value={selectedPackageId} onChange={e => setSelectedPackageId(e.target.value)} className="w-full p-2 bg-slate-800/60 border border-slate-700 rounded-md text-sm" disabled={!selectedWorkshop?.packages?.length}><option value="">بدون باقة</option>{selectedWorkshop?.packages?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
                  <div><label className="text-xs text-fuchsia-300">المبلغ المدفوع</label><input type="number" value={pricePaid} onChange={e => setPricePaid(e.target.value)} className="w-full p-2 bg-slate-800/60 border border-slate-700 rounded-md text-sm"/></div>
                  <div><label className="text-xs text-fuchsia-300">طريقة الدفع</label><select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as any)} className="w-full p-2 bg-slate-800/60 border border-slate-700 rounded-md text-sm"><option value="" disabled>اختر طريقة</option><option value="BANK">تحويل بنكي</option><option value="LINK">رابط دفع</option><option value="GIFT">هدية</option><option value="CREDIT">ائتمان</option></select></div>
              </div>
            </div>
          )}

          {validatedRows.length > 0 && (
            <div className="bg-black/20 p-4 rounded-lg border border-slate-700">
              <h4 className="font-bold text-white mb-4">3. معاينة وتحديد المستخدمين</h4>
              <div className="max-h-60 overflow-y-auto">
                <table className="min-w-full text-xs text-white">
                  <thead className="bg-slate-800 sticky top-0"><tr>
                    <th className="p-2 text-right w-10"><input type="checkbox" checked={selectedCount > 0 && selectedCount === totalValidCount} onChange={handleSelectAll} /></th>
                    <th className="p-2 text-right">#</th><th className="p-2 text-right">الاسم</th><th className="p-2 text-right">البريد الإلكتروني</th><th className="p-2 text-right">الهاتف</th><th className="p-2 text-right">الحالة</th>
                  </tr></thead>
                  <tbody className="divide-y divide-slate-700">
                    {validatedRows.map((row, index) => {
                      const { text, color, icon: Icon } = getStatusInfo(row.status);
                      return (
                        <tr key={index} className={`${!row.status.startsWith('valid') ? 'opacity-50' : 'hover:bg-slate-800/50'}`}>
                          <td className="p-2"><input type="checkbox" checked={row.isSelected} onChange={() => handleToggleSelect(index)} disabled={!row.status.startsWith('valid')} /></td>
                          <td className="p-2 text-slate-400">{row.data.rowNumber}</td>
                          <td className="p-2">{row.data.name}</td>
                          <td className="p-2">{row.data.email}</td>
                          <td className="p-2 font-mono">{row.data.phone}</td>
                          <td className={`p-2 font-semibold ${color} flex items-center gap-x-1`}><Icon className="w-4 h-4"/> {text}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {(isProcessing && parsedRows.length === 0) && <div className="text-center text-slate-300">جاري معالجة الملف...</div>}
          {error && <p className="text-red-400 text-sm text-center font-bold">{error}</p>}
        </div>
        
        <footer className="p-4 flex justify-between items-center border-t border-fuchsia-500/50">
          <p className="text-sm text-slate-300">سيتم استيراد {selectedCount} من أصل {validatedRows.length} مستخدم.</p>
          <button onClick={handleImport} disabled={isProcessing || selectedCount === 0} className="py-2 px-6 rounded-md bg-green-600 hover:bg-green-500 text-white font-bold text-sm disabled:opacity-50">
            {isProcessing ? 'جاري الاستيراد...' : `تأكيد استيراد (${selectedCount})`}
          </button>
        </footer>
      </div>
       <style>{`.z-80 { z-index: 80; }`}</style>
    </div>
  );
};

export default ExcelImportModal;
