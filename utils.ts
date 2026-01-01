import { Workshop, User, CertificateTemplate } from './types';

export const TIMEZONE_LABEL_AR = '(بتوقيت دولة الإمارات العربية المتحدة)';

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

  const cleanTime = timeString.toLowerCase().trim();
  let isPM = cleanTime.includes('pm') || cleanTime.includes('مساءً');
  let isAM = cleanTime.includes('am') || cleanTime.includes('صباحاً');

  const match = cleanTime.match(/(\d{1,2}):(\d{2})/);
  if (!match) return timeString;

  let hours = parseInt(match[1], 10);
  const minutes = match[2];

  // If no AM/PM indicator, infer from hours (24h format input)
  if (!isPM && !isAM) {
    if (hours >= 12) {
      isPM = true;
      if (hours > 12) hours -= 12;
    } else {
      isAM = true;
      if (hours === 0) hours = 12;
    }
  } else {
    // Normalize hours to 12-hour format if needed
    if (hours > 12) hours -= 12;
    else if (hours === 0) hours = 12;
  }

  const period = isPM ? 'مساءً' : 'صباحاً';
  return `${hours.toString().padStart(2, '0')}:${minutes} ${period}`;
};


/**
 * Checks if a workshop has started or ended (should be hidden from upcoming listings).
 */
export const isWorkshopExpired = (workshop: Workshop): boolean => {
  if (workshop.isRecorded) {
    return false; // Recorded workshops don't expire from the main listing.
  }

  const startDateString = workshop.startDate;
  if (!startDateString) {
    return false; // If there's no date, it cannot be expired.
  }

  // Parse the full start date and time
  const startDateTime = parseWorkshopDateTime(workshop.startDate, workshop.startTime);
  if (isNaN(startDateTime.getTime())) {
    return false;
  }

  const now = new Date();

  // If there's an end date, use it for expiration
  if (workshop.endDate) {
    const endDateTime = parseWorkshopDateTime(workshop.endDate, workshop.endTime || '23:59');
    if (!isNaN(endDateTime.getTime())) {
      return now > endDateTime;
    }
  }

  // Fallback: If no end date, allow it to show for 24 hours after it starts
  // This ensures a "Live" workshop doesn't disappear the second it begins.
  const twentyFourHoursAfterStart = new Date(startDateTime.getTime() + (24 * 60 * 60 * 1000));
  return now > twentyFourHoursAfterStart;
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

  }

  return fallback;
};

/**
 * Parses a date and time string into a valid Date object.
 * Handles Various formats and assumes UAE timezone.
 */
export const parseWorkshopDateTime = (dateStr: string, timeStr?: string): Date => {
  // Return early if no date
  if (!dateStr) return new Date(0);

  const cleanTime = (timeStr || '00:00').toLowerCase().trim();
  const isPM = cleanTime.includes('pm') || cleanTime.includes('مساءً');
  const isAM = cleanTime.includes('am') || cleanTime.includes('صباحاً');

  const timeMatch = cleanTime.match(/(\d{1,2}):(\d{2})/);
  let hours = 0;
  let minutes = 0;

  if (timeMatch) {
    hours = parseInt(timeMatch[1], 10);
    minutes = parseInt(timeMatch[2], 10);
    if (isPM && hours !== 12) hours += 12;
    else if (isAM && hours === 12) hours = 0;
  }

  // workshop.startDate is YYYY-MM-DD
  const [year, month, day] = dateStr.split('-').map(Number);

  // Create Date in local context (browser/server timezone)
  // To be truly precise about UAE, we'd need more logic, but this is better than what was there.
  return new Date(year, month - 1, day, hours, minutes);
};

/**
 * Converts common video platform links (YouTube, Vimeo) into their embeddable iframe counterparts.
 */
export const getEmbedUrl = (url: string | undefined): string => {
  if (!url) return '';

  let embedUrl = url;

  // YouTube
  if (url.includes('youtube.com/watch?v=')) {
    embedUrl = url.replace('youtube.com/watch?v=', 'youtube.com/embed/');
  } else if (url.includes('youtu.be/')) {
    embedUrl = url.replace('youtu.be/', 'youtube.com/embed/');
  }

  // Vimeo
  if (url.includes('vimeo.com/') && !url.includes('player.vimeo.com')) {
    const vimeoId = url.split('/').pop();
    embedUrl = `https://player.vimeo.com/video/${vimeoId}`;
  }

  // Handle YouTube Shorts
  if (url.includes('youtube.com/shorts/')) {
    embedUrl = url.replace('youtube.com/shorts/', 'youtube.com/embed/');
  }

  return embedUrl;
};
