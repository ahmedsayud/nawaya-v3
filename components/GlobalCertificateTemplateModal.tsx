import React, { useState, useEffect, useRef, MouseEvent as ReactMouseEvent } from 'react';
import { CertificateTemplate, CustomCertificateField, User, Workshop } from '../types';
import { CloseIcon, ResizeHandleIcon, TrashIcon, DuplicateIcon, PlusCircleIcon } from './icons';
import { useUser } from '../context/UserContext';
import DynamicCertificateRenderer from './DynamicCertificateRenderer';

// Mock data for preview
// FIX: Add missing 'orders' property to satisfy the User type.
const MOCK_USER: User = { id: 1, fullName: 'ريان عبد العزيز', email: 'user@example.com', phone: '123456789', subscriptions: [], orders: [], notifications: [] };
const MOCK_WORKSHOP: Workshop = {
    id: 1, title: 'ورشة الذكاء العاطفي المتقدم', instructor: 'DRHOPE', startDate: '2024-01-01', endDate: '2024-01-03',
    startTime: '10:00', location: 'حضوري', country: 'المملكة العربية السعودية', city: 'الرياض', isRecorded: false,
    zoomLink: '', description: '', topics: [], isVisible: true
};

const FONT_FAMILIES = ["'Noto Sans Arabic'"];

interface GlobalCertificateTemplateModalProps {
  onClose: () => void;
  onSave: (template: CertificateTemplate) => void;
}

type DragAction = {
  type: 'drag' | 'resize';
  fieldId: string;
  startX: number;
  startY: number;
  startFieldX: number;
  startFieldY: number;
  startFieldWidth: number;
};

const GlobalCertificateTemplateModal: React.FC<GlobalCertificateTemplateModalProps> = ({ onClose, onSave }) => {
  const { globalCertificateTemplate } = useUser();
  const [template, setTemplate] = useState<CertificateTemplate | null>(null);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [dragAction, setDragAction] = useState<DragAction | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const defaultTemplate: CertificateTemplate = {
      imageDataUrl: '',
      imageWidth: 2000,
      imageHeight: 1414,
      fields: [
        { id: 'user_name', text: '{{USER_NAME}}', x: 1000, y: 650, fontSize: 80, color: '#000000', textAlign: 'center', fontFamily: "'Noto Sans Arabic'", maxWidth: 1200 },
        { id: 'workshop_title', text: 'لإتمام ورشة عمل:\n{{WORKSHOP_TITLE}}', x: 1000, y: 850, fontSize: 50, color: '#000000', textAlign: 'center', fontFamily: "'Noto Sans Arabic'", maxWidth: 1000 },
      ],
    };
    setTemplate(globalCertificateTemplate || defaultTemplate);
    if(globalCertificateTemplate?.fields?.[0]?.id) {
        setSelectedFieldId(globalCertificateTemplate.fields[0].id);
    } else {
        setSelectedFieldId(defaultTemplate.fields[0].id);
    }
  }, [globalCertificateTemplate]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          setTemplate(prev => prev ? { ...prev, imageDataUrl: img.src, imageWidth: img.width, imageHeight: img.height } : null);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const updateField = (fieldId: string, updates: Partial<CustomCertificateField>) => {
    setTemplate(prev => {
      if (!prev) return null;
      const newFields = prev.fields.map(f => f.id === fieldId ? { ...f, ...updates } : f);
      return { ...prev, fields: newFields };
    });
  };

  const handleFieldMouseDown = (e: ReactMouseEvent<HTMLDivElement, MouseEvent>, fieldId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedFieldId(fieldId);
    const field = template?.fields.find(f => f.id === fieldId);
    if (!field || !previewRef.current || !template) return;
    
    const rect = previewRef.current.getBoundingClientRect();
    const scale = rect.width / template.imageWidth;

    setDragAction({
      type: 'drag',
      fieldId: field.id,
      startX: e.clientX / scale,
      startY: e.clientY / scale,
      startFieldX: field.x,
      startFieldY: field.y,
      startFieldWidth: field.maxWidth,
    });
  };
  
  const handleResizeMouseDown = (e: ReactMouseEvent<HTMLDivElement, MouseEvent>, fieldId: string) => {
      e.preventDefault();
      e.stopPropagation();
      setSelectedFieldId(fieldId);
      const field = template?.fields.find(f => f.id === fieldId);
      if (!field || !previewRef.current || !template) return;

      const rect = previewRef.current.getBoundingClientRect();
      const scale = rect.width / template.imageWidth;

      setDragAction({
          type: 'resize',
          fieldId: field.id,
          startX: e.clientX / scale,
          startY: e.clientY / scale,
          startFieldX: field.x,
          startFieldY: field.y,
          startFieldWidth: field.maxWidth,
      });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragAction || !previewRef.current || !template) return;

      const rect = previewRef.current.getBoundingClientRect();
      const scale = rect.width / template.imageWidth;

      const dx = (e.clientX / scale) - dragAction.startX;
      const dy = (e.clientY / scale) - dragAction.startY;
      
      if (dragAction.type === 'drag') {
        updateField(dragAction.fieldId, { x: dragAction.startFieldX + dx, y: dragAction.startFieldY + dy });
      } else if (dragAction.type === 'resize') {
          let newWidth = dragAction.startFieldWidth + dx * 2;
          if (newWidth < 50) newWidth = 50;
          updateField(dragAction.fieldId, { maxWidth: newWidth });
      }
    };
    
    const handleMouseUp = () => {
      setDragAction(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragAction, template]);


  const addField = () => {
      const newField: CustomCertificateField = {
          id: `custom_${Date.now()}`,
          text: 'نص جديد', x: 100, y: 100, fontSize: 40, color: '#000000',
          textAlign: 'right', fontFamily: "'Noto Sans Arabic'", maxWidth: 400
      };
      setTemplate(prev => prev ? { ...prev, fields: [...prev.fields, newField] } : null);
      setSelectedFieldId(newField.id);
  };
  
  const deleteField = (fieldId: string) => {
      setTemplate(prev => prev ? { ...prev, fields: prev.fields.filter(f => f.id !== fieldId) } : null);
      setSelectedFieldId(null);
  };

  const duplicateField = (fieldId: string) => {
      const fieldToCopy = template?.fields.find(f => f.id === fieldId);
      if (!fieldToCopy || !template) return;
      const newField: CustomCertificateField = {
          ...fieldToCopy,
          id: `custom_${Date.now()}`,
          y: fieldToCopy.y + 30
      };
      setTemplate({ ...template, fields: [...template.fields, newField]});
      setSelectedFieldId(newField.id);
  };
  
  const handleSave = () => {
      if(template) {
          onSave(template);
      }
  };
  
  if (!template) return null;
  const selectedField = template.fields.find(f => f.id === selectedFieldId);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-80 p-4">
      <div className="bg-slate-900 text-white rounded-lg shadow-2xl w-full h-full border border-yellow-500/50 flex flex-col">
        <header className="p-4 flex justify-between items-center border-b border-yellow-500/50 flex-shrink-0">
          <h2 className="text-xl font-bold text-yellow-300">إدارة قالب الشهادة الموحد</h2>
          <div className="flex items-center gap-x-4">
            <button onClick={handleSave} className="py-2 px-4 rounded-md bg-yellow-600 hover:bg-yellow-500 text-white font-bold text-sm">حفظ القالب</button>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10"><CloseIcon className="w-6 h-6" /></button>
          </div>
        </header>
        
        <div className="flex flex-grow overflow-hidden">
          {/* Preview Area */}
          <main className="flex-grow p-4 overflow-auto bg-slate-800/20 flex justify-center items-center">
              <div ref={previewRef} className="relative shadow-2xl" style={{ width: '100%', aspectRatio: `${template.imageWidth} / ${template.imageHeight}` }}>
                <DynamicCertificateRenderer template={template} workshop={MOCK_WORKSHOP} user={MOCK_USER} />
                {template.fields.map(field => (
                    <div
                        key={field.id}
                        onMouseDown={(e) => handleFieldMouseDown(e, field.id)}
                        className={`absolute cursor-move border-2 ${selectedFieldId === field.id ? 'border-yellow-500' : 'border-transparent hover:border-yellow-500/50'} transition-colors`}
                        style={{
                            left: `calc(${(field.x / template.imageWidth) * 100}% - ${(field.maxWidth / 2 / template.imageWidth) * 100}%)`,
                            top: `${field.y / template.imageHeight * 100}%`,
                            width: `${field.maxWidth / template.imageWidth * 100}%`,
                            minHeight: '20px',
                        }}
                    >
                        {selectedFieldId === field.id && (
                             <div 
                                onMouseDown={(e) => handleResizeMouseDown(e, field.id)}
                                className="absolute -right-2 -bottom-2 cursor-nwse-resize bg-white p-1 rounded-full border border-yellow-500"
                            >
                                <ResizeHandleIcon className="w-3 h-3 text-yellow-600"/>
                            </div>
                        )}
                    </div>
                ))}
              </div>
          </main>
          
          {/* Controls Sidebar */}
          <aside className="w-96 bg-black/20 p-4 border-l border-slate-700 flex-shrink-0 overflow-y-auto">
              <h3 className="font-bold text-white text-sm mb-4">التحكم بالقالب</h3>
              <div className="space-y-4">
                  <div>
                      <label className="block text-sm font-bold text-yellow-300">صورة الخلفية</label>
                      <input type="file" onChange={handleImageUpload} accept="image/*" className="mt-1 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-yellow-100 file:text-yellow-700 hover:file:bg-yellow-200" />
                      {template.imageDataUrl && <img src={template.imageDataUrl} alt="preview" className="mt-2 rounded-md w-full h-auto" />}
                  </div>

                  <div className="border-t border-slate-700 pt-4">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-bold text-white text-sm">الحقول النصية</h3>
                        <button onClick={addField} title="إضافة حقل جديد" className="p-1.5 rounded-md hover:bg-slate-700"><PlusCircleIcon className="w-6 h-6 text-yellow-400"/></button>
                      </div>
                      <div className="space-y-2">
                        {template.fields.map(f => (
                           <div key={f.id} onClick={() => setSelectedFieldId(f.id)} className={`p-2 rounded-md cursor-pointer border ${selectedFieldId === f.id ? 'bg-yellow-500/20 border-yellow-500' : 'bg-slate-700/50 border-transparent hover:border-slate-500'}`}>
                              <p className="text-sm font-bold truncate">{f.text.replace(/(\r\n|\n|\r)/gm," ")}</p>
                          </div>
                        ))}
                      </div>
                  </div>
                  
                  {selectedField && (
                      <div className="border-t border-slate-700 pt-4 space-y-3">
                          <div className="flex justify-between items-center">
                              <h4 className="font-bold text-white text-sm">تعديل الحقل المحدد</h4>
                              <div className="flex items-center gap-x-2">
                                  <button onClick={() => duplicateField(selectedField.id)} title="تكرار الحقل"><DuplicateIcon className="w-5 h-5 text-sky-400"/></button>
                                  <button onClick={() => deleteField(selectedField.id)} title="حذف الحقل"><TrashIcon className="w-5 h-5 text-pink-400"/></button>
                              </div>
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-yellow-300 mb-1">النص (استخدم {'{{PLACEHOLDER}}'})</label>
                              <textarea value={selectedField.text} onChange={e => updateField(selectedFieldId!, { text: e.target.value })} rows={3} className="w-full p-1.5 bg-slate-700 rounded-md text-sm font-mono"/>
                              <p className="text-xs text-slate-400 mt-1">المتاحة: {'{{USER_NAME}}'}, {'{{WORKSHOP_TITLE}}'}, {'{{WORKSHOP_DATE}}'}, {'{{WORKSHOP_LOCATION}}'}</p>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div><label className="block text-xs font-bold text-yellow-300 mb-1">X: {Math.round(selectedField.x)}</label><input type="range" min={0} max={template.imageWidth} value={selectedField.x} onChange={e => updateField(selectedFieldId!, { x: parseInt(e.target.value) })}/></div>
                            <div><label className="block text-xs font-bold text-yellow-300 mb-1">Y: {Math.round(selectedField.y)}</label><input type="range" min={0} max={template.imageHeight} value={selectedField.y} onChange={e => updateField(selectedFieldId!, { y: parseInt(e.target.value) })}/></div>
                            <div><label className="block text-xs font-bold text-yellow-300 mb-1">حجم الخط</label><input type="number" value={selectedField.fontSize} onChange={e => updateField(selectedFieldId!, { fontSize: parseInt(e.target.value) })} className="w-full p-1.5 bg-slate-700 rounded-md text-sm"/></div>
                            <div><label className="block text-xs font-bold text-yellow-300 mb-1">اللون</label><input type="color" value={selectedField.color} onChange={e => updateField(selectedFieldId!, { color: e.target.value })} className="w-full h-9 rounded-md"/></div>
                            <div><label className="block text-xs font-bold text-yellow-300 mb-1">نوع الخط</label><select value={selectedField.fontFamily} onChange={e => updateField(selectedFieldId!, { fontFamily: e.target.value })} className="w-full p-1.5 bg-slate-700 rounded-md text-sm"><option value="">Default</option>{FONT_FAMILIES.map(f => <option key={f} value={f}>{f}</option>)}</select></div>
                            <div><label className="block text-xs font-bold text-yellow-300 mb-1">المحاذاة</label><select value={selectedField.textAlign} onChange={e => updateField(selectedFieldId!, { textAlign: e.target.value as any })} className="w-full p-1.5 bg-slate-700 rounded-md text-sm"><option value="right">يمين</option><option value="center">وسط</option><option value="left">يسار</option></select></div>
                            <div className="col-span-2"><label className="block text-xs font-bold text-yellow-300 mb-1">أقصى عرض: {Math.round(selectedField.maxWidth)}</label><input type="range" min={50} max={template.imageWidth} value={selectedField.maxWidth} onChange={e => updateField(selectedFieldId!, { maxWidth: parseInt(e.target.value) })}/></div>
                          </div>
                      </div>
                  )}
              </div>
          </aside>
        </div>
      </div>
      <style>{`.z-80 { z-index: 80; }`}</style>
    </div>
  );
};

export default GlobalCertificateTemplateModal;