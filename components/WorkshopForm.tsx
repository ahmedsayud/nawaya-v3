
import React, { useState, FormEvent, useEffect } from 'react';
import { Workshop, Package, NoteResource, Recording, MediaResource } from '../types';
import { useUser } from '../context/UserContext';
import { CloseIcon } from './icons';
import { toEnglishDigits, fileToDataUrl } from '../utils';
import { useEnglishOnlyInputV2 } from '../hooks/useEnglishOnlyInput';


interface WorkshopFormProps {
  workshop: Workshop;
  onClose: () => void;
}

const packageColors = [
  { border: 'border-fuchsia-500/30', bg: 'bg-fuchsia-500/10' },
  { border: 'border-purple-500/30', bg: 'bg-purple-500/10' },
  { border: 'border-pink-500/30', bg: 'bg-pink-500/10' },
  { border: 'border-violet-500/30', bg: 'bg-violet-500/10' },
];

export const WorkshopForm: React.FC<WorkshopFormProps> = ({ workshop, onClose }) => {
  const { addWorkshop, updateWorkshop, countries } = useUser();
  const [formData, setFormData] = useState<Partial<Workshop>>({
    ...workshop,
    isVisible: workshop.isVisible ?? true,
    topics: workshop.topics || [],
    recordings: workshop.recordings || [],
    notes: workshop.notes || [],
    mediaFiles: workshop.mediaFiles || [],
    packages: workshop.packages || [],
  });

  const [zoomLink, setZoomLink, zoomLinkWarning] = useEnglishOnlyInputV2(workshop.zoomLink || '');

  useEffect(() => {
    setFormData(prev => ({ ...prev, zoomLink }));
  }, [zoomLink]);

  const isNew = workshop.isNew;
  const today = new Date().toISOString().split('T')[0];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    setFormData(prev => {
      const newState: Partial<Workshop> = { ...prev };
      let processedValue: any = value;

      if (type === 'checkbox') {
        processedValue = (e.target as HTMLInputElement).checked;
        if (name === 'isRecorded') {
          newState.location = processedValue ? 'مسجلة' : 'أونلاين';
        }
      } else if (['price'].includes(name)) {
        processedValue = value ? parseInt(toEnglishDigits(value), 10) : undefined;
      }

      (newState as any)[name] = processedValue;

      if (name === 'startDate' && value) {
        const startDateObj = new Date(value);
        startDateObj.setMonth(startDateObj.getMonth() + 1);
        newState.endDate = startDateObj.toISOString().split('T')[0];
      }

      if (name === 'location') {
        if (processedValue === 'أونلاين') {
          newState.country = '';
          newState.city = '';
          newState.hotelName = '';
          newState.hallName = '';
        } else if (processedValue === 'حضوري' || processedValue === 'أونلاين وحضوري') {
          newState.application = '';
        }
      }

      return newState;
    });
  };

  // ... (Same logic for notes, recordings, media files, packages as before)
  const handleNoteChange = (index: number, field: keyof NoteResource, value: string) => {
    setFormData(prev => {
      const newNotes = [...(prev.notes || [])];
      newNotes[index] = { ...newNotes[index], [field]: value };
      return { ...prev, notes: newNotes };
    });
  };

  const handleNoteFileChange = async (index: number, file: File | null) => {
    if (!file) return;
    try {
      const dataUrl = await fileToDataUrl(file);
      setFormData(prev => {
        const newNotes = [...(prev.notes || [])];
        newNotes[index] = { type: 'file', name: file.name, value: dataUrl };
        return { ...prev, notes: newNotes };
      });
    } catch (error) {
      console.error("Error converting file to data URL:", error);
    }
  };

  const addNote = () => {
    setFormData(prev => ({
      ...prev,
      notes: [...(prev.notes || []), { type: 'file', name: '', value: '' }]
    }));
  };

  const removeNote = (index: number) => {
    setFormData(prev => ({
      ...prev,
      notes: (prev.notes || []).filter((_, i) => i !== index),
    }));
  };

  const handleRecordingChange = (index: number, field: keyof Recording, value: string) => {
    setFormData(prev => {
      const newRecordings = [...(prev.recordings || [])];
      newRecordings[index] = { ...newRecordings[index], [field]: value };
      return { ...prev, recordings: newRecordings };
    });
  };

  const addRecording = () => {
    setFormData(prev => ({
      ...prev,
      recordings: [...(prev.recordings || []), { name: '', url: '' }]
    }));
  };

  const removeRecording = (index: number) => {
    setFormData(prev => ({
      ...prev,
      recordings: (prev.recordings || []).filter((_, i) => i !== index),
    }));
  };

  const handleMediaFileChange = (index: number, field: keyof MediaResource, value: string) => {
    setFormData(prev => {
      const newMediaFiles = [...(prev.mediaFiles || [])];
      (newMediaFiles[index] as any)[field] = value;
      return { ...prev, mediaFiles: newMediaFiles };
    });
  };

  const handleMediaFileUpload = async (index: number, file: File | null) => {
    if (!file) return;
    try {
      const dataUrl = await fileToDataUrl(file);
      setFormData(prev => {
        const newMediaFiles = [...(prev.mediaFiles || [])];
        const currentItem = newMediaFiles[index];
        newMediaFiles[index] = {
          ...currentItem,
          name: currentItem.name || file.name,
          value: dataUrl,
          type: file.type.startsWith('audio/') ? 'audio' : 'video'
        };
        return { ...prev, mediaFiles: newMediaFiles };
      });
    } catch (error) {
      console.error("Error converting media file to data URL:", error);
    }
  };

  const addMediaFile = () => {
    setFormData(prev => ({
      ...prev,
      mediaFiles: [...(prev.mediaFiles || []), { type: 'audio', name: '', value: '', notes: '' }]
    }));
  };

  const removeMediaFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      mediaFiles: (prev.mediaFiles || []).filter((_, i) => i !== index),
    }));
  };

  const handlePackageChange = (index: number, field: keyof Package | 'features_text' | 'paymentLink', value: any) => {
    setFormData(prev => {
      const newPackages = [...(prev.packages || [])];
      if (field === 'features_text') {
        newPackages[index] = { ...newPackages[index], features: value.split('\n') };
      } else if (field === 'price' || field === 'discountPrice') {
        const numericValue = toEnglishDigits(String(value));
        newPackages[index] = { ...newPackages[index], [field]: numericValue ? parseFloat(numericValue) : (field === 'price' ? 0 : undefined) };
      }
      else {
        (newPackages[index] as any)[field] = value;
      }
      return { ...prev, packages: newPackages };
    });
  };

  const addPackage = () => {
    setFormData(prev => ({
      ...prev,
      packages: [...(prev.packages || []), { id: Date.now(), name: '', price: 0, features: [], paymentLink: '' }]
    }));
  };

  const removePackage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      packages: (prev.packages || []).filter((_, i) => i !== index),
    }));
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const finalData = {
      ...formData,
      topics: typeof formData.topics === 'string' ? (formData.topics as string).split('\n') : formData.topics,
    };

    if (isNew) {
      addWorkshop(finalData as Omit<Workshop, 'id'>);
    } else {
      updateWorkshop(finalData as Workshop);
    }
    onClose();
  };

  const inputClass = "w-full p-2.5 bg-black/30 border border-fuchsia-500/20 rounded-xl focus:ring-2 focus:ring-fuchsia-500/50 focus:border-transparent text-sm text-white placeholder:text-slate-400/60 transition-all";
  const labelClass = "block mb-1.5 text-xs font-bold text-fuchsia-300 tracking-wide";

  return (
    <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-60 p-4 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-[#2e0235] via-[#2c0838] to-[#1e0b2b] text-white rounded-2xl shadow-2xl w-full max-w-4xl border border-fuchsia-500/30 max-h-[90vh] flex flex-col">
        <header className="p-5 flex justify-between items-center border-b border-fuchsia-500/20 flex-shrink-0 bg-white/5">
          <h2 className="text-xl font-bold text-white">{isNew ? 'إضافة ورشة جديدة' : 'تعديل الورشة'}</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors"><CloseIcon className="w-6 h-6" /></button>
        </header>
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 custom-scrollbar">

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={labelClass}>عنوان الورشة</label>
              <input type="text" name="title" value={formData.title || ''} onChange={handleChange} className={inputClass} required />
            </div>
            <div>
              <label className={labelClass}>المدرب</label>
              <input type="text" name="instructor" value={formData.instructor || ''} onChange={handleChange} className={inputClass} required />
            </div>
          </div>

          <div>
            <label className={labelClass}>الوصف والتفاصيل</label>
            <textarea name="description" value={formData.description || ''} onChange={handleChange} className={inputClass} rows={4}></textarea>
          </div>

          {/* Type and Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={labelClass}>نوع الورشة</label>
              <select name="location" value={formData.location || 'أونلاين'} onChange={handleChange} className={inputClass}>
                <option value="أونلاين">أونلاين</option>
                <option value="حضوري">حضوري</option>
                <option value="أونلاين وحضوري">أونلاين وحضوري</option>
                <option value="مسجلة">مسجلة</option>
              </select>
            </div>

            {formData.location === 'أونلاين' && (
              <div>
                <label className={labelClass}>تطبيق</label>
                <input
                  type="text"
                  name="application"
                  value={formData.application || ''}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="مثال: Zoom"
                />
              </div>
            )}
          </div>

          {/* Physical Location Details (Conditional) */}
          {(formData.location === 'حضوري' || formData.location === 'أونلاين وحضوري') && (
            <div className="space-y-4 p-5 bg-white/5 rounded-xl border border-white/10">
              <h4 className="text-sm font-bold text-slate-300 border-b border-white/10 pb-2 mb-2">تفاصيل الموقع الحضوري</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className={labelClass}>المدينة</label>
                  <input type="text" name="city" value={formData.city || ''} onChange={handleChange} className={inputClass} placeholder="مثال: الرياض" required />
                </div>
                <div>
                  <label className={labelClass}>الدولة</label>
                  <select name="country" value={formData.country || ''} onChange={handleChange} className={inputClass} required>
                    <option value="" style={{ color: '#6b7280', backgroundColor: 'white' }}>اختر الدولة</option>
                    {countries.map(c => <option key={c.id} value={c.name} className="text-black bg-white" style={{ color: 'black', backgroundColor: 'white' }}>{c.name}</option>)}
                  </select>
                </div>
                <div /> {/* Spacer */}
                <div>
                  <label className={labelClass}>اسم الفندق</label>
                  <input type="text" name="hotelName" value={formData.hotelName || ''} onChange={handleChange} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>اسم القاعة</label>
                  <input type="text" name="hallName" value={formData.hallName || ''} onChange={handleChange} className={inputClass} />
                </div>
              </div>
            </div>
          )}

          {/* Date and Time (Conditional) */}
          {formData.location !== 'مسجلة' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className={labelClass}>تاريخ البدء</label>
                <input type="date" name="startDate" value={formData.startDate || ''} onChange={handleChange} className={`${inputClass} text-center`} min={today} />
              </div>
              <div>
                <label className={labelClass}>تاريخ الإنتهاء (اختياري)</label>
                <input type="date" name="endDate" value={formData.endDate || ''} onChange={handleChange} className={`${inputClass} text-center`} min={formData.startDate || today} />
              </div>
              <div>
                <label className={labelClass}>وقت البدء</label>
                <input type="time" name="startTime" value={formData.startTime || ''} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>وقت الانتهاء (اختياري)</label>
                <input type="time" name="endTime" value={formData.endTime || ''} onChange={handleChange} className={inputClass} />
              </div>
            </div>
          )}

          {/* Topics */}
          <div>
            <label className={labelClass}>محاور الورشة (كل محور في سطر)</label>
            <textarea name="topics" value={Array.isArray(formData.topics) ? formData.topics.join('\n') : formData.topics || ''} onChange={handleChange} className={inputClass} rows={4}></textarea>
          </div>

          {/* URLs */}
          <div className="space-y-6 p-5 bg-black/20 rounded-xl border border-white/5">
            {(formData.location === 'أونلاين' || formData.location === 'أونلاين وحضوري') && (
              <div>
                <label className={labelClass}>رابط زووم</label>
                <input type="url" name="zoomLink" value={zoomLink} onChange={(e) => setZoomLink(e.target.value)} className={`${inputClass} ltr-input ${zoomLinkWarning ? 'border-red-500' : ''}`} />
                {zoomLinkWarning && <p className="text-xs text-red-400 mt-1">الرجاء استخدام الأحرف الإنجليزية فقط في هذا الحقل.</p>}
              </div>
            )}

            {formData.location === 'مسجلة' && (
              <div>
                <label className={labelClass}>روابط التسجيل</label>
                {formData.recordings?.map((rec, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 mb-2">
                    <input type="text" placeholder="اسم التسجيل" value={rec.name} onChange={e => handleRecordingChange(index, 'name', e.target.value)} className={`${inputClass} col-span-5`} />
                    <input type="url" placeholder="الرابط" value={rec.url} onChange={e => handleRecordingChange(index, 'url', e.target.value)} className={`${inputClass} col-span-6 ltr-input`} />
                    <button type="button" onClick={() => removeRecording(index)} className="text-red-400 hover:text-red-300 font-bold p-1 col-span-1">حذف</button>
                  </div>
                ))}
                <button type="button" onClick={addRecording} className="text-xs text-fuchsia-400 font-bold mt-1 hover:underline">+ إضافة رابط تسجيل</button>
              </div>
            )}

            {/* Price and Notes */}
            {formData.location === 'مسجلة' && (
              <div>
                <label className={labelClass}>السعر (درهم)</label>
                <input type="number" name="price" value={formData.price || ''} onChange={handleChange} className={inputClass} />
              </div>
            )}

            <div>
              <label className={labelClass}>المذكرات والمرفقات</label>
              {formData.notes?.map((note, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 mb-2 items-center">
                  <input
                    type="text"
                    placeholder="اسم المرفق"
                    value={note.name}
                    onChange={e => handleNoteChange(index, 'name', e.target.value)}
                    className={`${inputClass} col-span-5`}
                  />
                  <div className="col-span-6">
                    <input
                      type="file"
                      id={`note-file-${index}`}
                      onChange={(e) => handleNoteFileChange(index, e.target.files?.[0] || null)}
                      className="hidden"
                    />
                    <label htmlFor={`note-file-${index}`} className={`${inputClass} cursor-pointer flex items-center justify-between hover:bg-white/5`}>
                      <span className="truncate text-slate-300 text-xs">
                        {note.value ? (note.name || 'تم الرفع') : 'اختر ملف...'}
                      </span>
                      <span className="bg-fuchsia-600 text-white text-[10px] font-bold px-2 py-1 rounded">
                        رفع
                      </span>
                    </label>
                  </div>
                  <button type="button" onClick={() => removeNote(index)} className="text-red-400 hover:text-red-300 font-bold p-1 col-span-1 justify-self-center">حذف</button>
                </div>
              ))}
              <button type="button" onClick={addNote} className="text-xs text-fuchsia-400 font-bold mt-1 hover:underline">+ إضافة مرفق</button>
            </div>

            {/* Media Files */}
            <div>
              <label className={labelClass}>ملفات الفيديو والصوت</label>
              {formData.mediaFiles?.map((media, index) => (
                <div key={index} className="p-3 bg-slate-800/50 rounded-lg space-y-3 mb-3 border border-slate-700/50">
                  <div className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-11 grid grid-cols-2 gap-2">
                      <select value={media.type} onChange={e => handleMediaFileChange(index, 'type', e.target.value)} className={inputClass}>
                        <option value="audio">ملف صوتي</option>
                        <option value="video">ملف فيديو</option>
                      </select>
                      <input type="text" placeholder="اسم الملف" value={media.name} onChange={e => handleMediaFileChange(index, 'name', e.target.value)} className={inputClass} />
                    </div>
                    <button type="button" onClick={() => removeMediaFile(index)} className="text-red-400 hover:text-red-300 font-bold p-1 col-span-1 justify-self-center">حذف</button>
                  </div>
                  <div className="col-span-full">
                    <input type="file" id={`media-file-${index}`} onChange={(e) => handleMediaFileUpload(index, e.target.files?.[0] || null)} className="hidden" accept="audio/*,video/*" />
                    <label htmlFor={`media-file-${index}`} className={`${inputClass} cursor-pointer flex items-center justify-between hover:bg-white/5`}>
                      <span className="truncate text-slate-300 text-xs">{media.value ? (media.name || 'تم الرفع') : 'اختر ملف...'}</span>
                      <span className="bg-fuchsia-600 text-white text-[10px] font-bold px-2 py-1 rounded">رفع ملف</span>
                    </label>
                  </div>
                  <div className="col-span-full">
                    <textarea placeholder="ملاحظات نصية (اختياري)" value={media.notes || ''} onChange={e => handleMediaFileChange(index, 'notes', e.target.value)} className={inputClass} rows={2}></textarea>
                  </div>
                </div>
              ))}
              <button type="button" onClick={addMediaFile} className="text-xs text-fuchsia-400 font-bold mt-1 hover:underline">+ إضافة ملف فيديو/صوت</button>
            </div>
          </div>

          {/* Packages */}
          {formData.location !== 'مسجلة' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white border-b border-fuchsia-500/30 pb-2">الباقات</h3>
              {formData.packages?.map((pkg, index) => (
                <div key={pkg.id || index} className={`p-4 rounded-xl border ${packageColors[index % packageColors.length].border} ${packageColors[index % packageColors.length].bg} space-y-3 relative`}>
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-bold text-fuchsia-300">الباقة #{index + 1}</h4>
                    <button type="button" onClick={() => removePackage(index)} className="text-red-400 hover:text-red-300 text-xs font-bold bg-red-500/10 px-2 py-1 rounded transition-colors">حذف</button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input type="text" placeholder="اسم الباقة" value={pkg.name} onChange={e => handlePackageChange(index, 'name', e.target.value)} className={inputClass} />
                    <input type="number" placeholder="السعر" value={pkg.price || ''} onChange={e => handlePackageChange(index, 'price', e.target.value)} className={inputClass} />
                    <input type="number" placeholder="سعر الخصم (اختياري)" value={pkg.discountPrice || ''} onChange={e => handlePackageChange(index, 'discountPrice', e.target.value)} className={inputClass} />
                  </div>
                  {formData.location === 'أونلاين وحضوري' && (
                    <div>
                      <label className="text-xs text-fuchsia-300/80 mb-1 block font-bold">نوع الحضور لهذه الباقة</label>
                      <select
                        value={pkg.attendanceType || ''}
                        onChange={e => handlePackageChange(index, 'attendanceType', e.target.value as 'أونلاين' | 'حضوري')}
                        className={inputClass}
                        required
                      >
                        <option value="" disabled>اختر نوع الحضور</option>
                        <option value="حضوري">حضوري</option>
                        <option value="أونلاين">أونلاين</option>
                      </select>
                    </div>
                  )}
                  <textarea placeholder="المميزات (كل ميزة في سطر)" value={pkg.features.join('\n')} onChange={e => handlePackageChange(index, 'features_text', e.target.value)} className={inputClass} rows={3}></textarea>
                  <div><label className="text-xs text-slate-400 mb-1 block">تاريخ انتهاء الخصم (اختياري)</label><input type="date" value={pkg.availability?.endDate || ''} onChange={e => handlePackageChange(index, 'availability', { endDate: e.target.value })} className={`${inputClass} text-center`} /></div>
                </div>
              ))}
              <button type="button" onClick={addPackage} className="w-full py-3 border-2 border-dashed border-slate-600 rounded-xl text-slate-400 hover:text-white hover:border-fuchsia-500 hover:bg-fuchsia-500/10 transition-all font-bold text-sm">+ إضافة باقة جديدة</button>
            </div>
          )}

          <footer className="pt-4 border-t border-fuchsia-500/20 flex justify-end items-center bg-black/20 p-4 rounded-b-xl -m-6 mt-0">
            <div className="flex justify-end gap-x-4 w-full">
              <button type="button" onClick={onClose} className="py-2.5 px-6 rounded-xl bg-slate-600 hover:bg-slate-500 text-white font-bold text-sm transition-colors">إلغاء</button>
              <button type="submit" className="py-2.5 px-8 rounded-xl bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white font-bold text-sm shadow-lg shadow-fuchsia-900/40 transition-transform transform hover:scale-105">
                {isNew ? 'إضافة الورشة' : 'حفظ التعديلات'}
              </button>
            </div>
          </footer>
        </form>
      </div>
    </div>
  );
};

export default WorkshopForm;
