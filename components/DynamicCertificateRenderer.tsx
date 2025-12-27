import React from 'react';
import ReactDOM from 'react-dom/client';
import { Workshop, User, CertificateTemplate, CertificateFieldConfig, CustomCertificateField } from '../types';
import { formatArabicDate } from '../utils';

declare const jspdf: any;
declare const html2canvas: any;

interface DynamicCertificateRendererProps {
  template: CertificateTemplate;
  workshop: Workshop;
  user: User;
}

const TextField: React.FC<{ config: CertificateFieldConfig; text: string; imageWidth: number }> = ({ config, text, imageWidth }) => {
  const style: React.CSSProperties = {
    position: 'absolute',
    top: `${config.y}px`,
    fontFamily: config.fontFamily,
    fontSize: `${config.fontSize}px`,
    color: config.color,
    textAlign: config.textAlign,
    whiteSpace: 'pre-wrap',
    wordWrap: 'break-word',
    direction: 'rtl',
    padding: '0 5px', // Add slight padding
    lineHeight: 1.3,
  };
  
  // Position the block so its center is at config.x, and let the `textAlign` property handle alignment within the block.
  style.left = `${config.x}px`;
  style.transform = 'translateX(-50%)';
  style.width = `${config.maxWidth}px`;

  return <div style={style}>{text}</div>;
};

const DynamicCertificateRenderer: React.FC<DynamicCertificateRendererProps> = ({ template, workshop, user }) => {
  const workshopDate = workshop.endDate 
    ? `من ${formatArabicDate(workshop.startDate)} إلى ${formatArabicDate(workshop.endDate)}`
    : formatArabicDate(workshop.startDate);
    
  let workshopLocation = workshop.location === 'حضوري' && workshop.city
    ? `${workshop.city}, ${workshop.country}`
    : `${workshop.location}, ${workshop.country}`;

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

  const imageWidth = template.imageWidth || 2000;

  return (
    <div style={{
      width: `${imageWidth}px`,
      height: `${template.imageHeight || 1414}px`,
      position: 'relative',
      overflow: 'hidden', // Ensure text doesn't bleed out
    }}>
      <img 
        src={template.imageDataUrl} 
        alt="Certificate Background"
        style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }} 
      />
      {template.fields.map(field => (
          <TextField 
              key={field.id}
              config={field} 
              text={replacePlaceholders(field.text)}
              imageWidth={imageWidth} 
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

export default DynamicCertificateRenderer;
