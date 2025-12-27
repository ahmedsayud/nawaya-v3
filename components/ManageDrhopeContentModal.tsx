import React, { useState, useEffect } from 'react';
import { CloseIcon, ArrowCircleUpIcon, TrashIcon } from './icons';
import { useUser } from '../context/UserContext';
import { DrhopeData } from '../types';

type DrhopeContentSection = 'video' | 'cv' | 'photos' | 'instagram';

interface ManageDrhopeContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  showToast: (message: string) => void;
  initialTab: DrhopeContentSection;
}

const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const ManageDrhopeContentModal: React.FC<ManageDrhopeContentModalProps> = ({ isOpen, onClose, showToast, initialTab }) => {
  const { drhopeData, updateDrhopeData } = useUser();
  const [activeTab, setActiveTab] = useState<DrhopeContentSection>(initialTab);

  // Form states
  const [videoUrl, setVideoUrl] = useState(drhopeData.videos?.[0]?.url || '');
  const [newInstaLink, setNewInstaLink] = useState({ title: '', url: '' });

  if (!isOpen) return null;

  const handleSaveVideo = () => {
    const currentVideos = drhopeData.videos || [];
    const newVideos = [...currentVideos];
    if (newVideos.length > 0) {
      newVideos[0] = { ...newVideos[0], url: videoUrl };
    } else if (videoUrl) {
      newVideos.push({ id: `video-${Date.now()}`, title: 'فيديو العرض', url: videoUrl });
    }
    updateDrhopeData({ videos: newVideos });
    showToast('تم تحديث رابط الفيديو بنجاح.');
  };

  const handleCvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      try {
        const cvUrl = await fileToDataUrl(file);
        updateDrhopeData({ cvUrl });
        showToast('تم رفع السيرة الذاتية بنجاح.');
      } catch (error) {
        showToast('فشل رفع الملف.');
      }
    } else {
      alert('يرجى اختيار ملف PDF فقط.');
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      try {
        const dataUrls = await Promise.all(Array.from(files).map(fileToDataUrl));
        updateDrhopeData({ photos: [...drhopeData.photos, ...dataUrls] });
        showToast(`تم إضافة ${files.length} صور بنجاح.`);
      } catch (error) {
        showToast('فشل رفع بعض الصور.');
      }
    }
  };
  
  const handleDeletePhoto = (indexToDelete: number) => {
    const newPhotos = drhopeData.photos.filter((_, index) => index !== indexToDelete);
    updateDrhopeData({ photos: newPhotos });
    showToast('تم حذف الصورة.');
  };
  
  const handleAddInstaLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (newInstaLink.title && newInstaLink.url) {
      const newLink = { ...newInstaLink, id: `insta-${Date.now()}` };
      updateDrhopeData({ instagramLinks: [...drhopeData.instagramLinks, newLink] });
      setNewInstaLink({ title: '', url: '' });
      showToast('تمت إضافة الرابط.');
    }
  };

  const handleDeleteInstaLink = (idToDelete: string) => {
    const newLinks = drhopeData.instagramLinks.filter(link => link.id !== idToDelete);
    updateDrhopeData({ instagramLinks: newLinks });
    showToast('تم حذف الرابط.');
  };

  const tabButtonClasses = (tabName: DrhopeContentSection) => 
    `px-4 py-2 text-sm font-bold rounded-t-lg transition-colors ${
      activeTab === tabName 
        ? 'bg-black/20 text-white' 
        : 'text-slate-400 hover:bg-slate-700/50'
    }`;
    
  const inputClass = "w-full p-2 bg-indigo-900/40 border border-slate-600 rounded-md focus:ring-fuchsia-500 focus:border-fuchsia-500 text-sm text-white font-bold placeholder:text-white/70";
  const labelClass = "block mb-1 text-sm font-bold text-fuchsia-300 tracking-wide";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-80 p-4">
      <div className="bg-indigo-900/90 backdrop-blur-lg text-white rounded-lg shadow-2xl w-full max-w-4xl border border-fuchsia-500/80 max-h-[90vh] flex flex-col">
        <header className="p-4 flex justify-between items-center border-b border-fuchsia-500/50 flex-shrink-0">
          <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-400">إدارة محتوى DRHOPE</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10"><CloseIcon className="w-6 h-6" /></button>
        </header>

        <nav className="p-2 border-b border-fuchsia-500/50 flex-shrink-0">
            <div className="bg-slate-800/50 p-1 rounded-lg flex items-center justify-around">
                <button onClick={() => setActiveTab('video')} className={tabButtonClasses('video')}>الفيديو</button>
                <button onClick={() => setActiveTab('cv')} className={tabButtonClasses('cv')}>السيرة الذاتية</button>
                <button onClick={() => setActiveTab('photos')} className={tabButtonClasses('photos')}>ألبوم الصور</button>
                <button onClick={() => setActiveTab('instagram')} className={tabButtonClasses('instagram')}>روابط انستجرام</button>
            </div>
        </nav>
        
        <div className="flex-grow p-6 overflow-y-auto">
            {activeTab === 'video' && (
                <div className="space-y-4">
                    <h3 className="text-lg font-bold">تعديل فيديو العرض</h3>
                    <div>
                        <label className={labelClass}>رابط الفيديو (Embed URL من يوتيوب)</label>
                        <input type="url" value={videoUrl} onChange={e => setVideoUrl(e.target.value)} className={inputClass} placeholder="https://www.youtube.com/embed/..." />
                    </div>
                    <button onClick={handleSaveVideo} className="py-2 px-6 rounded-md bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold text-sm">حفظ</button>
                </div>
            )}
            {activeTab === 'cv' && (
                <div className="space-y-4">
                    <h3 className="text-lg font-bold">إدارة السيرة الذاتية (CV)</h3>
                    <div>
                        <label className={labelClass}>رفع ملف جديد (PDF فقط)</label>
                        <input type="file" onChange={handleCvUpload} accept="application/pdf" className={`${inputClass} file:mr-4 file:py-1.5 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-fuchsia-100 file:text-fuchsia-700 hover:file:bg-fuchsia-200`} />
                    </div>
                    {drhopeData.cvUrl && (
                        <div className="bg-black/20 p-4 rounded-lg">
                            <h4 className="font-bold mb-2">الملف الحالي:</h4>
                            <p className="text-sm text-green-400">تم رفع السيرة الذاتية بنجاح.</p>
                            <a href={drhopeData.cvUrl} target="_blank" rel="noopener noreferrer" className="text-fuchsia-400 hover:underline text-sm">عرض الملف الحالي</a>
                        </div>
                    )}
                </div>
            )}
            {activeTab === 'photos' && (
                <div className="space-y-4">
                    <h3 className="text-lg font-bold">إدارة ألبوم الصور</h3>
                    <div>
                        <label className={labelClass}>إضافة صور جديدة</label>
                        <input type="file" onChange={handlePhotoUpload} accept="image/*" multiple className={`${inputClass} file:mr-4 file:py-1.5 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-fuchsia-100 file:text-fuchsia-700 hover:file:bg-fuchsia-200`} />
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                        {drhopeData.photos.map((src, index) => (
                            <div key={index} className="relative aspect-square group">
                                <img src={src} alt={`Photo ${index}`} className="w-full h-full object-cover rounded-lg" />
                                <button onClick={() => handleDeletePhoto(index)} className="absolute top-1 right-1 bg-red-600/80 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            {activeTab === 'instagram' && (
                <div className="space-y-4">
                    <h3 className="text-lg font-bold">إدارة روابط بثوث انستجرام</h3>
                    <form onSubmit={handleAddInstaLink} className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-black/20 p-3 rounded-lg">
                        <input type="text" value={newInstaLink.title} onChange={e => setNewInstaLink(p => ({...p, title: e.target.value}))} className={inputClass} placeholder="عنوان الرابط" required />
                        <input type="url" value={newInstaLink.url} onChange={e => setNewInstaLink(p => ({...p, url: e.target.value}))} className={inputClass} placeholder="https://instagram.com/..." required />
                        <button type="submit" className="py-2 px-4 rounded-md bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold text-sm">إضافة رابط</button>
                    </form>
                     <div className="space-y-2">
                        {drhopeData.instagramLinks.map(link => (
                            <div key={link.id} className="flex items-center justify-between p-2 bg-slate-700/50 rounded-md">
                                <div>
                                    <p className="font-bold">{link.title}</p>
                                    <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-xs text-sky-400 hover:underline truncate max-w-xs block">{link.url}</a>
                                </div>
                                <button onClick={() => handleDeleteInstaLink(link.id)} className="p-2 rounded-full hover:bg-red-500/20">
                                    <TrashIcon className="w-5 h-5 text-red-400" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
      </div>
       <style>{`.z-80 { z-index: 80; }`}</style>
    </div>
  );
};

export default ManageDrhopeContentModal;
