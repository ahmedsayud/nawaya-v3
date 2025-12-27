```typescript
import React, { useState, useMemo, useEffect, useRef, ChangeEvent } from 'react';
import { CloseIcon, TrashIcon, UserAddIcon, UsersIcon, DownloadIcon, ArrowCircleUpIcon } from './icons';
import { User, Workshop } from '../types';
import { useUser } from '../context/UserContext';
import { normalizePhoneNumber } from '../utils';

declare const XLSX: any; // from sheetjs CDN

interface AudienceManagementModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (updatedRecipients: User[]) => void;
    channel: 'email' | 'notification' | 'whatsapp';
    showToast: (message: string, type?: 'success' | 'warning' | 'error') => void;
}

const AudienceManagementModal: React.FC<AudienceManagementModalProps> = ({ isOpen, onClose, onSave, channel, showToast }) => {
    const { users, workshops } = useUser();
    const [activeTab, setActiveTab] = useState<'internal' | 'external'>('internal');

    const [internalFilter, setInternalFilter] = useState('all');
    const [externalList, setExternalList] = useState('');

    const [recipients, setRecipients] = useState<User[]>([]);
    const [userSearch, setUserSearch] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const allCountries = [...countries].sort((a, b) => a.name.localeCompare(b.name, 'ar'));

    useEffect(() => {
        if (activeTab === 'internal') {
            let newRecipients: User[];
            if (internalFilter === 'all') {
                newRecipients = users.filter(u => !u.isDeleted);
            } else if (internalFilter.startsWith('country_')) {
                const countryCode = internalFilter.split('_')[1].replace('+', '');
                newRecipients = users.filter(u => !u.isDeleted && normalizePhoneNumber(u.phone).startsWith(countryCode));
            } else {
                const workshopId = parseInt(internalFilter, 10);
                newRecipients = users.filter(u => !u.isDeleted && u.subscriptions.some(s => s.workshopId === workshopId && s.isApproved !== false));
            }
            setRecipients(newRecipients);
        } else { // External
            const lines = externalList.split('\n').filter(line => line.trim() !== '');
            const newRecipients = lines.map((line, index): User | null => {
                if (channel === 'whatsapp') {
                    const parts = line.split(',');
                    const name = parts[0]?.trim();
                    const phone = parts[1]?.trim();
                    if (name && phone) {
                        return { id: -index, fullName: name, phone: phone, email: '', subscriptions: [], orders: [], notifications: [] };
                    }
                } else { // email or notification
                    const email = line.trim();
                    if (email) {
                        return { id: -index, fullName: email.split('@')[0], email: email, phone: '', subscriptions: [], orders: [], notifications: [] };
                    }
                }
                return null;
            }).filter((u): u is User => u !== null);
            setRecipients(newRecipients);
        }
    }, [internalFilter, externalList, activeTab, users, workshops, channel]);


    const searchedUsers = useMemo(() => {
        if (!userSearch) return [];
        const lowercasedSearch = userSearch.toLowerCase();
        const existingIds = new Set(recipients.map(u => u.id));
        return users.filter(u =>
            !u.isDeleted && !existingIds.has(u.id) && u.fullName.toLowerCase().includes(lowercasedSearch)
        ).slice(0, 5);
    }, [userSearch, users, recipients]);

    const addRecipient = (user: User) => {
        setRecipients(prev => [...prev, user]);
        setUserSearch('');
    };

    const removeRecipient = (userId: number) => {
        setRecipients(prev => prev.filter(u => u.id !== userId));
    };

    const handleSave = () => {
        onSave(recipients);
        onClose();
    };

    const handleDownloadTemplate = () => {
        const data = channel === 'whatsapp'
            ? [['الاسم', 'رقم الهاتف']]
            : [['البريد الإلكتروني']];

        const worksheet = XLSX.utils.aoa_to_sheet(data);
        worksheet['!cols'] = channel === 'whatsapp'
            ? [{ wch: 30 }, { wch: 20 }]
            : [{ wch: 40 }];

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');
        XLSX.writeFile(workbook, 'Nawaya_External_List_Template.xlsx');
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = new Uint8Array(event.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                if (jsonData.length < 2) {
                    showToast('الملف فارغ أو لا يحتوي على بيانات.', 'warning');
                    return;
                }

                const header = jsonData[0].map(String);
                // Smart column detection
                const nameIndex = header.findIndex(h => h.includes('اسم') || h.toLowerCase().includes('name'));
                const phoneIndex = header.findIndex(h => h.includes('هاتف') || h.includes('جوال') || h.toLowerCase().includes('phone'));
                const emailIndex = header.findIndex(h => h.includes('بريد') || h.toLowerCase().includes('email'));

                let newRecipients: User[] = [];
                let updatedExternalList = '';

                if (channel === 'whatsapp') {
                    if (nameIndex === -1 || phoneIndex === -1) {
                        showToast('لم يتم العثور على أعمدة "الاسم" و "رقم الهاتف" المطلوبة في الملف.', 'error');
                        return;
                    }
                    newRecipients = jsonData.slice(1).map((row, index): User | null => {
                        const name = row[nameIndex]?.toString().trim();
                        const phone = row[phoneIndex]?.toString().trim();
                        if (name && phone) {
                            updatedExternalList += `${ name },${ phone } \n`;
                            return { id: -index, fullName: name, phone: normalizePhoneNumber(phone), email: '', subscriptions: [], orders: [], notifications: [] };
                        }
                        return null;
                    }).filter((u): u is User => u !== null);
                } else { // email
                    if (emailIndex === -1) {
                        showToast('لم يتم العثور على عمود "البريد الإلكتروني" المطلوب في الملف.', 'error');
                        return;
                    }
                    newRecipients = jsonData.slice(1).map((row, index): User | null => {
                        const email = row[emailIndex]?.toString().trim();
                        if (email) {
                            updatedExternalList += `${ email } \n`;
                            return { id: -index, fullName: email.split('@')[0], email, phone: '', subscriptions: [], orders: [], notifications: [] };
                        }
                        return null;
                    }).filter((u): u is User => u !== null);
                }

                setExternalList(updatedExternalList);
                setRecipients(newRecipients);
                showToast(`تم استيراد ${ newRecipients.length } من جهات الاتصال بنجاح.`, 'success');

            } catch (err) {
                
                showToast('حدث خطأ أثناء قراءة ملف Excel.', 'error');
            } finally {
                if (e.target) e.target.value = ''; // Reset file input
            }
        };
        reader.readAsArrayBuffer(file);
    };

    return (
        <div className="fixed inset-0 bg-black/70 z-60 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-sky-500/50 rounded-lg shadow-xl w-full max-w-4xl h-[90vh] flex flex-col">
                <header className="p-4 flex justify-between items-center border-b border-sky-500/50">
                    <h3 className="text-lg font-bold text-sky-300 flex items-center gap-x-2"><UsersIcon className="w-6 h-6" /> إدارة قائمة المستلمين ({recipients.length})</h3>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10"><CloseIcon className="w-6 h-6" /></button>
                </header>

                <div className="flex-grow flex flex-col md:flex-row overflow-hidden">
                    <div className="w-full md:w-1/3 border-b md:border-b-0 md:border-l border-slate-700/50 p-4 space-y-4">
                        <div className="flex items-center gap-x-2 bg-slate-800/60 p-1 rounded-lg w-full">
                            <button onClick={() => setActiveTab('internal')} className={`flex - 1 text - center px - 3 py - 1.5 text - xs font - bold rounded - md ${ activeTab === 'internal' ? 'bg-sky-500/50' : 'hover:bg-slate-700/50' } `}>الجمهور الداخلي</button>
                            <button onClick={() => setActiveTab('external')} className={`flex - 1 text - center px - 3 py - 1.5 text - xs font - bold rounded - md ${ activeTab === 'external' ? 'bg-sky-500/50' : 'hover:bg-slate-700/50' } `}>قائمة خارجية</button>
                        </div>
                        {activeTab === 'internal' ? (
                            <div>
                                <label className="text-sm font-bold text-white mb-2 block">تحديد حسب</label>
                                    <select value={internalFilter} onChange={e => { setInternalFilter(e.target.value); }} className="w-full p-2 bg-slate-800/60 border border-slate-700 rounded-lg text-sm text-white">
                                        <option value="all" className="text-black bg-white" style={{ color: 'black', backgroundColor: 'white' }}>كل المستخدمين</option>
                                        <optgroup label="مشتركي الورش">{workshops.filter(w => !w.isDeleted).map(w => <option key={w.id} value={w.id.toString()} className="text-black bg-white" style={{ color: 'black', backgroundColor: 'white' }}>{w.title}</option>)}</optgroup>
                                        <optgroup label="حسب الدولة">{allCountries.map(c => <option key={c.code} value={`country_${ c.code } `} className="text-black bg-white" style={{ color: 'black', backgroundColor: 'white' }}>{c.name}</option>)}</optgroup>
                                    </select>
                            </div>
                        ) : (
                            <div>
                                <label className="text-sm font-bold text-white mb-2 block">لصق القائمة</label>
                                <textarea
                                    value={externalList}
                                    onChange={e => setExternalList(e.target.value)}
                                    placeholder={channel === 'whatsapp' ? 'الاسم,رقم الهاتف\nفاطمة,+971501234567' : 'email1@example.com\nemail2@example.com'}
                                    className="w-full p-2 bg-slate-800/60 border border-slate-700 rounded-lg text-sm h-48 ltr-input"
                                ></textarea>
                                <div className="flex items-center gap-x-4 mt-2">
                                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".xlsx" className="hidden" />
                                    <button type="button" onClick={() => fileInputRef.current?.click()} className="flex-1 flex items-center justify-center gap-x-2 bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-3 rounded-lg text-sm">
                                        <ArrowCircleUpIcon className="w-5 h-5" />
                                        <span>تحميل من ملف Excel</span>
                                    </button>
                                    <button type="button" onClick={handleDownloadTemplate} className="flex-1 flex items-center justify-center gap-x-2 bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-3 rounded-lg text-sm">
                                        <DownloadIcon className="w-5 h-5" />
                                        <span>تنزيل القالب</span>
                                    </button>
                                </div>
                            </div>
                        )}
                        <div className="relative mt-4">
                            <label className="text-sm font-bold text-white mb-2 block">إضافة مستلم بالبحث</label>
                            <input type="text" value={userSearch} onChange={e => setUserSearch(e.target.value)} placeholder="ابحث بالاسم..." className="w-full p-2 bg-slate-800/60 border border-slate-700 rounded-lg text-sm" />
                            {searchedUsers.length > 0 && <div className="absolute bottom-full left-0 right-0 bg-slate-800 border border-slate-600 rounded-t-lg z-10 max-h-40 overflow-y-auto">
                                {searchedUsers.map(u => <button key={u.id} type="button" onClick={() => addRecipient(u)} className="w-full text-right p-2 hover:bg-sky-500/20 text-sm flex items-center gap-x-2">
                                    <UserAddIcon className="w-5 h-5 text-sky-400" /><span>{u.fullName}</span><span className="text-xs text-slate-400">({u.phone})</span></button>
                                )}
                            </div>}
                        </div>
                    </div>
                    <div className="w-full md:w-2/3 p-4 flex flex-col">
                        <h4 className="text-base font-bold text-white mb-2 flex-shrink-0">القائمة النهائية ({recipients.length})</h4>
                        <div className="flex-grow overflow-y-auto bg-black/20 rounded-lg">
                            <table className="min-w-full text-xs text-white">
                                <thead className="bg-slate-800 sticky top-0"><tr>
                                    <th className="p-2 text-right">الاسم</th>
                                    <th className="p-2 text-right">البريد/الهاتف</th>
                                    <th className="p-2 text-center w-16">حذف</th>
                                </tr></thead>
                                <tbody className="divide-y divide-slate-800">
                                    {recipients.map(user => <tr key={user.id} className="hover:bg-slate-800/50">
                                        <td className="p-2">{user.fullName}</td>
                                        <td className="p-2">{channel === 'whatsapp' ? user.phone : user.email}</td>
                                        <td className="p-2 text-center"><button onClick={() => removeRecipient(user.id)} className="p-1 rounded-full text-red-400 hover:bg-red-500/20"><TrashIcon className="w-4 h-4" /></button></td>
                                    </tr>)}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <footer className="p-4 flex justify-end gap-x-4 border-t border-sky-500/50 bg-black/20">
                    <button onClick={onClose} className="py-2 px-4 rounded-md bg-slate-600 hover:bg-slate-500 font-bold text-sm">إلغاء</button>
                    <button onClick={handleSave} className="py-2 px-6 rounded-md bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm">حفظ القائمة</button>
                </footer>
            </div>
            <style>{`.z - 60 { z - index: 60; } `}</style>
        </div>
    );
};

export default AudienceManagementModal;
