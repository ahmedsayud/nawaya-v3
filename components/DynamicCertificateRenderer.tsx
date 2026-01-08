import React from 'react';
import ReactDOM from 'react-dom/client';
import { Workshop, User, CertificateTemplate, CertificateFieldConfig } from '../types';
import { formatArabicDate } from '../utils';

declare const jspdf: any;
declare const html2canvas: any;

/**
 * DEFAULT CERTIFICATE TEMPLATE (Dr. Hope Design)
 */
export const NEW_CERTIFICATE_TEMPLATE: CertificateTemplate = {
  imageDataUrl: '/الشهادة-01 (2).jpg',
  imageWidth: 2000,
  imageHeight: 1414,
  fields: [
    { id: 'main_title', text: 'شهادة حضور', x: 1000, y: 390, fontSize: 105, fontWeight: 700, color: '#FFFFFF', textAlign: 'center', fontFamily: "'Noto Sans Arabic'", maxWidth: 1600 },
    { id: 'user_congrats', text: 'نبارك لـ {{USER_NAME}}', x: 1000, y: 670, fontSize: 52, fontWeight: 700, color: '#FFFFFF', textAlign: 'center', fontFamily: "'Noto Sans Arabic'", maxWidth: 1600 },
    { id: 'workshop_participation', text: 'حضورها ورشة {{WORKSHOP_TITLE}}', x: 1000, y: 760, fontSize: 45, fontWeight: 700, color: '#FFFFFF', textAlign: 'center', fontFamily: "'Noto Sans Arabic'", maxWidth: 1600 },
    { id: 'instructor_info', text: 'تقديم {{INSTRUCTOR_NAME}}', x: 1000, y: 840, fontSize: 40, fontWeight: 700, color: '#FFFFFF', textAlign: 'center', fontFamily: "'Noto Sans Arabic'", maxWidth: 1600 },
    { id: 'instructor_title', text: 'مستشار فن إدارة الذات والحياة', x: 1000, y: 910, fontSize: 34, fontWeight: 400, color: '#FFFFFF', textAlign: 'center', fontFamily: "'Noto Sans Arabic'", maxWidth: 1600 },
    { id: 'date_location', text: '{{WORKSHOP_DATE}}\n{{WORKSHOP_LOCATION}}', x: 1000, y: 1100, fontSize: 34, fontWeight: 700, color: '#FFFFFF', textAlign: 'center', fontFamily: "'Noto Sans Arabic'", maxWidth: 1000 },
  ],
};

/**
 * Normalizes instructor name and processes template placeholders.
 */
export const getProcessedCertificateTemplate = (workshop: Workshop) => {
  let instructorName = workshop.instructor || 'أمل بنت فلاح العتيبي';

  // Normalize "د." to "الدكتورة" if it's Dr. Hope (handling with/without hamza)
  const isHope = instructorName.includes('أمل') || instructorName.includes('امل') || instructorName.toLowerCase().includes('hope');

  if (isHope) {
    // Remove existing "د." variations first
    instructorName = instructorName.replace(/^د[\.\s]+/, '');
    // Then prepend "الدكتورة"
    if (!instructorName.includes('الدكتورة')) {
      instructorName = 'الدكتورة ' + instructorName;
    }
  }

  return {
    ...NEW_CERTIFICATE_TEMPLATE,
    fields: NEW_CERTIFICATE_TEMPLATE.fields.map(field => {
      if (field.text.includes('{{INSTRUCTOR_NAME}}')) {
        return { ...field, text: field.text.replace('{{INSTRUCTOR_NAME}}', instructorName) };
      }
      return field;
    })
  };
};

interface DynamicCertificateRendererProps {
  template: CertificateTemplate;
  workshop: Workshop;
  user: User;
}

const TextField: React.FC<{ config: CertificateFieldConfig; text: string; template: CertificateTemplate }> = ({ config, text, template }) => {
  const style: React.CSSProperties = {
    position: 'absolute',
    top: `${(config.y / template.imageHeight) * 100}%`,
    left: `${(config.x / template.imageWidth) * 100}%`,
    transform: 'translateX(-50%)',
    width: `${(config.maxWidth / template.imageWidth) * 100}%`,
    // Use container query units (cqw) to make font size responsive to the container width
    fontSize: `calc((${config.fontSize} / ${template.imageWidth}) * 100cqw)`,
    fontFamily: config.fontFamily,
    fontWeight: config.fontWeight,
    color: config.color,
    textAlign: config.textAlign,
    whiteSpace: 'pre-wrap',
    wordWrap: 'break-word',
    direction: 'rtl',
    padding: '0 5px',
    lineHeight: 1.3,
  };

  return <div style={style}>{text}</div>;
};

const DynamicCertificateRenderer: React.FC<DynamicCertificateRendererProps> = ({ template, workshop, user }) => {
  const workshopDate = workshop.endDate
    ? `من ${formatArabicDate(workshop.startDate)} إلى ${formatArabicDate(workshop.endDate)}`
    : formatArabicDate(workshop.startDate);

  let workshopLocation = workshop.location === 'حضوري' && workshop.city
    ? `${workshop.city}, ${workshop.country}`
    : `${workshop.location}`;

  if (workshop.hotelName) {
    workshopLocation = `${workshop.hotelName}, ${workshopLocation}`;
  }

  const replacePlaceholders = (text: string): string => {
    return text
      .replace(/\{\{USER_NAME\}\}/g, user.fullName)
      .replace(/\{\{WORKSHOP_TITLE\}\}/g, workshop.title)
      .replace(/\{\{WORKSHOP_DATE\}\}/g, workshopDate)
      .replace(/\{\{WORKSHOP_LOCATION\}\}/g, workshopLocation);
  };

  return (
    <div style={{
      width: '100%',
      aspectRatio: `${template.imageWidth} / ${template.imageHeight}`,
      position: 'relative',
      containerType: 'inline-size', // Enables container query units for children
    }}>
      <img
        src={template.imageDataUrl}
        alt="Certificate Background"
        style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, objectFit: 'fill' }}
      />
      {template.fields.map(field => (
        <TextField
          key={field.id}
          config={field}
          text={replacePlaceholders(field.text)}
          template={template}
        />
      ))}
    </div>
  );
};

export const generateCertificate = async (template: CertificateTemplate, workshop: Workshop, user: User) => {
  if (typeof jspdf === 'undefined' || typeof html2canvas === 'undefined') {
    alert('مكتبات إنشاء الشهادة غير متاحة. يرجى المحاولة مرة أخرى أو تحديث الصفحة.');
    return;
  }

  const certificateElement = document.createElement('div');
  // Render at the template's original size for best quality
  certificateElement.style.width = `${template.imageWidth}px`;
  certificateElement.style.height = `${template.imageHeight}px`;
  certificateElement.style.position = 'fixed';
  certificateElement.style.left = '-2000px'; // Render completely off-screen
  certificateElement.style.top = '0';
  document.body.appendChild(certificateElement);

  const root = ReactDOM.createRoot(certificateElement);
  root.render(React.createElement(DynamicCertificateRenderer, { template, workshop, user }));

  await new Promise(resolve => setTimeout(resolve, 500));

  try {
    const canvas = await html2canvas(certificateElement, {
      scale: 1, // Render 1:1 with the element size
      useCORS: true,
      backgroundColor: null,
      width: template.imageWidth,
      height: template.imageHeight,
    });
    const imgData = canvas.toDataURL('image/png');

    const { jsPDF } = jspdf;
    const isLandscape = template.imageWidth > template.imageHeight;
    const orientation = isLandscape ? 'landscape' : 'portrait';

    const pdf = new jsPDF({ orientation, unit: 'px', format: [template.imageWidth, template.imageHeight] });
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Certificate-${user.fullName.replace(/\s/g, '_')}.pdf`);

  } catch (error) {
    alert("حدث خطأ أثناء إنشاء ملف الشهادة. يرجى المحاولة مرة أخرى.");
  } finally {
    root.unmount();
    document.body.removeChild(certificateElement);
  }
};

/**
 * High-level helper to generate a certificate for a user and workshop.
 */
export const generateUserWorkshopCertificate = async (user: User, workshop: Workshop) => {
  // Create a modified workshop object
  const enhancedWorkshop = {
    ...workshop,
    location: workshop.location === 'حضوري' && workshop.city
      ? `${workshop.city}, ${workshop.country}`
      : workshop.location
  };

  const template = getProcessedCertificateTemplate(workshop);

  try {
    await generateCertificate(template, enhancedWorkshop as Workshop, user);
    return { success: true };
  } catch (error) {
    console.error('Error generating certificate:', error);
    return { success: false, error };
  }
};

export default DynamicCertificateRenderer;
