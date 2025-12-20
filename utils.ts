import { Workshop, User, CertificateTemplate } from './types';

declare const jspdf: any;
declare const html2canvas: any;

/**
 * Formats a YYYY-MM-DD date string or a full ISO string into a localized Arabic date string.
 * e.g., "2024-08-25" -> "٢٥ أغسطس ٢٠٢٤"
 * e.g., "2024-08-25T10:00:00Z" -> "٢٥ أغسطس ٢٠٢٤"
 */
export const formatArabicDate = (dateString: string | undefined): string => {
  if (!dateString) return '';

  // new Date() can handle both "YYYY-MM-DD" (as UTC midnight) and full ISO strings.
  const date = new Date(dateString);

  // Check for validity. An invalid date string (e.g., from an empty field) results in `NaN`.
  if (isNaN(date.getTime())) {
    console.warn(`Invalid date string passed to formatArabicDate: "${dateString}"`);
    return ''; // Return empty string for invalid dates to prevent crashes.
  }

  return new Intl.DateTimeFormat('ar-u-nu-latn', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC' // Use UTC to ensure the date part is displayed consistently regardless of user's timezone.
  }).format(date);
};

/**
 * Formats a HH:mm time string (assumed to be in UTC) into a localized Arabic time string in UAE timezone with AM/PM.
 * e.g., "19:00" UTC -> "١١:٠٠ PM"
 */
export const formatArabicTime = (timeString: string | undefined): string => {
  if (!timeString) return '';
  const [hours, minutes] = timeString.split(':');
  // Create a dummy date assuming the input time is UTC, to convert to UAE time.
  const date = new Date(Date.UTC(2000, 0, 1, parseInt(hours, 10), parseInt(minutes, 10)));

  // Check for validity
  if (isNaN(date.getTime())) {
    console.warn(`Invalid time string passed to formatArabicTime: "${timeString}"`);
    return ''; // Return empty string for invalid times.
  }

  const timeFormatterAr = new Intl.DateTimeFormat('ar-u-nu-latn', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Dubai', // UAE timezone
  });
  const parts = timeFormatterAr.formatToParts(date);
  const hour = parts.find(p => p.type === 'hour')?.value;
  const minute = parts.find(p => p.type === 'minute')?.value;

  const timeFormatterEn = new Intl.DateTimeFormat('en-US', {
    hour12: true,
    hour: 'numeric', // We only need the period
    timeZone: 'Asia/Dubai',
  });
  const enParts = timeFormatterEn.formatToParts(date);
  const dayPeriod = enParts.find(p => p.type === 'dayPeriod')?.value; // "AM" or "PM"

  const timePart = `${hour}:${minute}`;

  return `${timePart} ${dayPeriod}`;
};


/**
 * Checks if a workshop's end date has passed.
 */
export const isWorkshopExpired = (workshop: Workshop): boolean => {
  if (workshop.isRecorded) {
    return false; // Recorded workshops don't expire from the main listing.
  }
  const expiryDateString = workshop.endDate || workshop.startDate;
  if (!expiryDateString) {
    return false; // If there's no date, it cannot be expired.
  }

  // Create a date object for the end of the expiry day in UTC to avoid timezone issues.
  const expiryDate = new Date(`${expiryDateString}T23:59:59.999Z`);
  if (isNaN(expiryDate.getTime())) {
    return false; // Invalid date string, assume not expired.
  }

  const now = new Date(); // This is mocked to UTC

  return expiryDate < now;
};

/**
 * Converts a string containing Arabic numerals to a string with English numerals.
 */
export const toEnglishDigits = (str: string): string => {
  if (!str) return '';
  return str.replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());
};

/**
 * Normalizes a phone number string by removing spaces, dashes, and leading '00' or '+',
 * and also handles the leading zero in the national number part for specific countries.
 * e.g., "+971 050-123-4567" -> "971501234567"
 * e.g., "00966501234567" -> "966501234567"
 */
export const normalizePhoneNumber = (phone: string): string => {
  if (!phone) return '';
  // Remove spaces, dashes, parentheses to get a clean string of digits and maybe a leading +
  let normalized = phone.replace(/[\s-()]/g, '');

  // Remove leading '00' or '+' to get just the digits
  if (normalized.startsWith('+')) {
    normalized = normalized.substring(1);
  } else if (normalized.startsWith('00')) {
    normalized = normalized.substring(2);
  }

  // Now `normalized` is a string of digits, e.g., '9710501234567' or '971501234567'

  // Heuristic for Gulf countries: if number starts with country code + 0, remove the 0.
  const prefixes = ['971', '966', '974', '965', '973', '968'];
  for (const prefix of prefixes) {
    if (normalized.startsWith(prefix + '0')) {
      return prefix + normalized.substring(prefix.length + 1);
    }
  }

  return normalized;
};

/**
 * Converts a file to a Base64 data URL.
 */
export const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Calculates a human-readable "time since" string.
 */
export const timeSince = (dateString: string): string => {
  const date = new Date(dateString);
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return `قبل ${Math.floor(interval)} سنة`;
  interval = seconds / 2592000;
  if (interval > 1) return `قبل ${Math.floor(interval)} شهر`;
  interval = seconds / 86400;
  if (interval > 1) return `قبل ${Math.floor(interval)} يوم`;
  interval = seconds / 3600;
  if (interval > 1) return `قبل ${Math.floor(interval)} ساعة`;
  interval = seconds / 60;
  if (interval > 1) return `قبل ${Math.floor(interval)} دقيقة`;
  return 'الآن';
};

/**
 * Generates a PDF from an HTML string and triggers a direct download.
 * @param htmlContent The full HTML string to convert.
 * @param filename The desired filename for the downloaded PDF.
 * @param orientation The page orientation.
 */
export const downloadHtmlAsPdf = async (htmlContent: string, filename: string = 'report.pdf', orientation: 'portrait' | 'landscape' = 'landscape') => {
  if (typeof jspdf === 'undefined' || typeof html2canvas === 'undefined') {
    alert('مكتبات إنشاء الشهادة غير متاحة. يرجى المحاولة مرة أخرى أو تحديث الصفحة.');
    console.error('jsPDF or html2canvas not loaded');
    return;
  }

  // Render element invisibly WITHIN the viewport to force browser rendering
  const tempContainer = document.createElement('div');
  tempContainer.style.position = 'fixed';
  tempContainer.style.top = '0';
  tempContainer.style.left = '0';
  tempContainer.style.width = orientation === 'landscape' ? '297mm' : '210mm'; // A4 size
  tempContainer.style.zIndex = '-1';
  tempContainer.style.opacity = '0';
  tempContainer.style.background = 'white';
  document.body.appendChild(tempContainer);
  tempContainer.innerHTML = htmlContent;

  const contentElement = tempContainer.firstElementChild as HTMLElement;
  if (!contentElement) {
    document.body.removeChild(tempContainer);
    return;
  }

  try {
    // Wait for all images to be fully decoded
    const images = Array.from(contentElement.getElementsByTagName('img'));
    const imageLoadPromises = images.map(img => {
      if (img.complete && img.decode) {
        return img.decode().catch(() => { }); // Already loaded, just decode. Catch errors.
      }
      return new Promise<void>((resolve) => {
        img.onload = () => {
          if (img.decode) {
            img.decode().then(resolve).catch(resolve); // Decode after load
          } else {
            resolve();
          }
        };
        img.onerror = () => resolve(); // Don't block on broken images
      });
    });

    // Also wait for fonts to be ready
    const fontPromise = (document as any).fonts ? (document as any).fonts.ready : Promise.resolve();

    await Promise.all([...imageLoadPromises, fontPromise]);

    // Force a reflow. This can sometimes help ensure layout is calculated.
    contentElement.getBoundingClientRect();

    // Wait for two animation frames. This gives the browser more time to paint complex elements like SVGs
    // after images have loaded and decoded. It's a more robust way to wait than a fixed timeout.
    await new Promise(resolve => requestAnimationFrame(resolve));
    await new Promise(resolve => requestAnimationFrame(resolve));

    const canvas = await html2canvas(contentElement, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });
    const imgData = canvas.toDataURL('image/png');

    const { jsPDF } = jspdf;
    const pdf = new jsPDF({ orientation, unit: 'px', format: 'a4', hotfixes: ['px_scaling'] });

    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const pageHeight = pdf.internal.pageSize.height;
    const pageWidth = pdf.internal.pageSize.width;

    const ratio = pageWidth / imgWidth;
    const scaledImgHeight = imgHeight * ratio;

    let heightLeft = scaledImgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, pageWidth, scaledImgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position -= pageHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, pageWidth, scaledImgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(filename);
  } catch (error) {
    console.error("Error generating PDF:", error);
    alert("حدث خطأ أثناء إنشاء ملف PDF. قد يكون بسبب صورة معطوبة أو مشكلة في الشبكة. يرجى المحاولة مرة أخرى.");
  } finally {
    document.body.removeChild(tempContainer);
  }
};

/**
 * Lexicon for Arabic months to their numeric representation (0-11 for Date constructor).
 */
const ARABIC_MONTHS: Record<string, number> = {
  'يناير': 0, 'فبراير': 1, 'مارس': 2, 'أبريل': 3, 'مايو': 4, 'يونيو': 5,
  'يوليو': 6, 'أغسطس': 7, 'سبتمبر': 8, 'أكتوبر': 9, 'نوفمبر': 10, 'ديسمبر': 11,
  'جانفي': 0, 'فيفري': 1, 'مارس_': 2, 'أفريل': 3, 'ماي': 4, 'جوان': 5,
  'جويلية': 6, 'أوت': 7, 'سبتمبر_': 8, 'أكتوبر_': 9, 'نوفمبر_': 10, 'ديسمبر_': 11
};

/**
 * Parses an Arabic date string like "23 ديسمبر 2025" into a Date object.
 */
const parseSingleArabicDate = (dateStr: string): Date | null => {
  if (!dateStr) return null;
  const parts = dateStr.trim().split(/\s+/);
  if (parts.length < 3) return null;

  const day = parseInt(toEnglishDigits(parts[0]), 10);
  const monthName = parts[1];
  const year = parseInt(toEnglishDigits(parts[2]), 10);

  const month = ARABIC_MONTHS[monthName];
  if (month === undefined || isNaN(day) || isNaN(year)) return null;

  return new Date(Date.UTC(year, month, day));
};

/**
 * Parses an Arabic date range string like "23 ديسمبر 2025 الى 24 يناير 2026"
 * into a pair of startDate and endDate.
 */
export const parseArabicDateRange = (range: string | undefined): { startDate: string; endDate?: string } => {
  const now = new Date();
  const fallbackDate = now.toISOString().split('T')[0];
  const fallback = { startDate: fallbackDate };
  if (!range) return fallback;

  try {
    const cleanedRange = range.replace(/ـ/g, '').replace(/[\u064B-\u065F]/g, ''); // Remove Tatweel and Harakat
    const separators = [' الى ', ' إلى ', ' - ', ' – '];
    let parts: string[] = [];

    for (const sep of separators) {
      if (cleanedRange.includes(sep)) {
        parts = cleanedRange.split(sep);
        break;
      }
    }

    if (parts.length === 2) {
      const startStr = parts[0].trim();
      const endStr = parts[1].trim();

      const startDate = parseSingleArabicDate(startStr);
      const endDate = parseSingleArabicDate(endStr);

      if (startDate && endDate) {
        return {
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0]
        };
      } else if (startDate) {
        return { startDate: startDate.toISOString().split('T')[0] };
      }
    } else {
      // Might be a single date
      const singleDate = parseSingleArabicDate(cleanedRange);
      if (singleDate) {
        return { startDate: singleDate.toISOString().split('T')[0] };
      }
    }
  } catch (error) {
    console.error('Error parsing Arabic date range:', range, error);
  }

  return fallback;
};
