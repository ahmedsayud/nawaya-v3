
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CloseIcon, ShieldCheckIcon, UserIcon, EnvelopeIcon, InformationCircleIcon, CheckIcon, ExclamationCircleIcon } from './icons';
import { User, Country } from '../types';
import { useUser } from '../context/UserContext';
import { useEnglishOnlyInputV2 } from '../hooks/useEnglishOnlyInput';
import { API_BASE_URL, API_ENDPOINTS } from '../constants';


interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User) => void;
  isClosable?: boolean;
  onBack?: () => void;
  showRegisterView?: boolean;
  loginOnlyTitle?: string;
  loginButtonText?: string;
  initialView?: 'login' | 'register'; // New prop
}

type AuthView = 'login' | 'register';

// Helper functions for masking
const maskEmail = (email: string): string => {
  const [localPart, domain] = email.split('@');
  if (!domain) return '***';
  const [domainName, tld] = domain.split('.');
  const maskedLocal = localPart.length > 2 ? `${localPart.substring(0, 2)}****` : `${localPart[0]}****`;
  const maskedDomain = domainName.length > 1 ? `${domainName[0]}****` : '****';
  return `${maskedLocal}@${maskedDomain}.${tld}`;
};

const maskPhoneNumber = (phone: string): string => {
  const match = phone.match(/^(\+\d{1,3})(.+)$/);
  if (match) {
    const [, countryCode, numberPart] = match;
    const cleanNumber = numberPart.replace(/\D/g, '');

    if (cleanNumber.length > 5) {
      const firstTwo = cleanNumber.substring(0, 2);
      const lastThree = cleanNumber.substring(cleanNumber.length - 3);
      const countryCodeNoPlus = countryCode.replace('+', '');
      return `(${countryCodeNoPlus}+) ${firstTwo}****${lastThree}`;
    }
  }
  if (phone.length > 7) {
    return `${phone.substring(0, phone.length - 7)}****${phone.substring(phone.length - 3)}`;
  }
  return '****';
};

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess, isClosable = true, onBack, showRegisterView = true, loginOnlyTitle, loginButtonText = 'دخول', initialView = 'login' }) => {
  const { login, register, checkRegistrationAvailability, findUserByCredential, checkAndClaimPendingGifts } = useUser();
  const [view, setView] = useState<AuthView>(initialView);

  // Local countries state
  const [countries, setCountries] = useState<Country[]>([]);
  const [countriesLoading, setCountriesLoading] = useState(true);

  // Form fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail, emailWarning] = useEnglishOnlyInputV2('');
  const [phone, setPhone] = useState('');
  const [selectedCountryCode, setSelectedCountryCode] = useState('');
  const [isVerified, setIsVerified] = useState(false);

  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loginHint, setLoginHint] = useState<{ type: 'email' | 'phone'; value: string } | null>(null);

  // Fetch countries using axios
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        setCountriesLoading(true);
        const response = await axios.get(`${API_BASE_URL}${API_ENDPOINTS.GENERAL.COUNTRIES}`);

        if (response.data.key === 'success' && Array.isArray(response.data.data)) {
          setCountries(response.data.data);
          console.log('Countries loaded successfully:', response.data.data.length);
        } else {
          console.error('Invalid countries response:', response.data);
        }
      } catch (error) {
        console.error('Failed to fetch countries:', error);
      } finally {
        setCountriesLoading(false);
      }
    };

    if (isOpen) {
      fetchCountries();
    }
  }, [isOpen]);


  useEffect(() => {
    // Reset state when modal is opened/closed
    if (isOpen) {
      setError('');
      setInfo('');
      setLoginHint(null);
      setIsVerified(false);
      setView(initialView); // Use the initialView prop
    }
  }, [isOpen, initialView]);

  if (!isOpen) return null;

  const fullPhoneNumber = selectedCountryCode === 'OTHER' ? phone : selectedCountryCode + phone;

  const handleCredentialBlur = (type: 'email' | 'phone', value: string) => {
    setLoginHint(null);
    if (view !== 'login' || !value) return;

    const user = findUserByCredential(type, value);
    if (user) {
      if (type === 'email') {
        setLoginHint({ type: 'phone', value: maskPhoneNumber(user.phone) });
      } else {
        setLoginHint({ type: 'email', value: maskEmail(user.email) });
      }
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');

    if (!isVerified) {
      setError('يرجى تأكيد أنك لست برنامج روبوت.');
      return;
    }

    const nameParts = fullName.trim().split(/\s+/);
    if (nameParts.length < 2) {
      setError('يرجى إدخال الاسم الثنائي على الأقل (الاسم الأول واسم العائلة).');
      return;
    }

    if (!selectedCountryCode) {
      setError('يرجى اختيار كود الدولة أولاً.');
      return;
    }

    // Simple length check - usually 8+ digits for most countries
    if (phone.length < 8) {
      setError('رقم الهاتف يبدو قصيراً جداً. يرجى التأكد من صحته.');
      return;
    }

    const { emailUser, phoneUser } = checkRegistrationAvailability(email, fullPhoneNumber);
    if (emailUser) {
      setError('هذا الايميل مسجل لدينا');
      return;
    }
    if (phoneUser) {
      setError('هذا الرقم مسجل لدينا');
      return;
    }

    // Find the selected country to get its ID
    const selectedCountry = countries.find(c => c.code === selectedCountryCode);
    if (!selectedCountry) {
      setError('يرجى اختيار دولة صحيحة.');
      return;
    }

    // Call register API
    const result = await register(fullName, email, fullPhoneNumber, selectedCountry.id);

    if (result.user) {
      // Auto-claim gifts on registration based on phone number
      const claimedCount = checkAndClaimPendingGifts(result.user);
      if (claimedCount > 0) {
        // Notification is handled by the caller or App.tsx via toast usually
      }
      onSuccess(result.user);
    } else {
      setError(result.error || 'فشل إنشاء الحساب');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');

    const result = await login(email, fullPhoneNumber);
    if (result.user) {
      // Auto-claim gifts on login based on phone number
      const claimedCount = checkAndClaimPendingGifts(result.user);
      onSuccess(result.user);
    } else {
      if (result.error === 'concurrent_session') {
        setError('هذا الحساب مسجل دخوله حالياً على جهاز آخر. يرجى تسجيل الخروج أولاً.');
      } else if (result.error === 'email') {
        setError('البريد الإلكتروني صحيح ولكن رقم الهاتف غير مطابق.');
      } else if (result.error === 'phone') {
        setError('رقم الهاتف صحيح ولكن البريد الإلكتروني غير مطابق.');
      } else {
        // Use the error message from the API if available, or fall back to generic
        setError(result.error || 'البريد الإلكتروني أو رقم الهاتف غير صحيح. يرجى المحاولة مرة أخرى أو إنشاء حساب جديد.');
      }
    }
  };

  const isPhoneDisabled = !selectedCountryCode;
  const isOtherCountrySelected = selectedCountryCode === 'OTHER';

  const phoneInputSection = (
    <div>
      <label className="block mb-2 text-sm font-medium">رقم الهاتف</label>
      <div className="space-y-2">
        <select
          value={selectedCountryCode}
          onChange={e => {
            const newCode = e.target.value;
            setSelectedCountryCode(newCode);
            setLoginHint(null); // Reset hint on country change
            const currentFullPhoneNumber = newCode === 'OTHER' ? phone : newCode + phone;
            handleCredentialBlur('phone', currentFullPhoneNumber);
          }}
          style={{ color: 'black', backgroundColor: 'white' }}
          className="w-full p-3 bg-white border border-slate-600 rounded-md text-black"
        >
          <option value="" disabled className="text-gray-500 bg-white" style={{ color: '#6b7280', backgroundColor: 'white' }}>
            {countriesLoading ? 'جاري التحميل...' : `اختر الدولة (${countries.length})`}
          </option>
          {countries.map(country => (
            <option key={country.id} value={country.code} className="text-black bg-white" style={{ color: 'black', backgroundColor: 'white' }}>
              {country.name} (+{country.code})
            </option>
          ))}
        </select>
        <input
          type="tel"
          value={phone}
          onChange={e => {
            setPhone(e.target.value.replace(/[^0-9]/g, ''));
            setLoginHint(null); // Reset hint while typing
          }}
          onBlur={() => handleCredentialBlur('phone', fullPhoneNumber)}
          className={`w-full p-3 bg-slate-700/50 border border-slate-600 rounded-md ltr-input disabled:cursor-not-allowed`}
          required
          disabled={isPhoneDisabled}
          placeholder={isPhoneDisabled ? "اختر الدولة أولاً" : (isOtherCountrySelected ? "2XXXXXX" : "5XXXXXXX")}
        />
      </div>
      {
        isOtherCountrySelected && (
          <p className="text-sm text-white font-bold mt-2 text-center">
            اكتب رقم التليفون مع الكود من غير + و 00
          </p>
        )
      }
    </div >
  );

  const renderLoginRegisterView = () => {
    const isRegister = view === 'register';
    return (
      <>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">{loginOnlyTitle ? loginOnlyTitle : (isRegister ? 'إنشاء حساب جديد' : 'تسجيل الدخول')}</h2>
          {isClosable && <button onClick={onClose} className="p-2 -m-2 rounded-full hover:bg-white/10"><CloseIcon className="w-6 h-6" /></button>}
        </div>

        <form onSubmit={isRegister ? handleRegister : handleLogin} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block mb-2 text-sm font-medium flex items-center gap-x-2"><UserIcon className="w-5 h-5" /> الاسم الكامل</label>
              <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} className="w-full p-3 bg-slate-700/50 border border-slate-600 rounded-md" required />
            </div>
          )}
          <div>
            <label className="block mb-2 text-sm font-medium flex items-center gap-x-2"><EnvelopeIcon className="w-5 h-5" /> البريد الإلكتروني</label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setLoginHint(null); // Reset hint while typing
              }}
              onBlur={() => handleCredentialBlur('email', email)}
              className={`w-full p-3 bg-slate-700/50 border border-slate-600 rounded-md ltr-input ${emailWarning ? 'border-red-500' : ''}`}
              required
            />
            {emailWarning && <p className="text-xs text-red-400 mt-1">الرجاء استخدام الأحرف الإنجليزية فقط في هذا الحقل.</p>}
            {loginHint?.type === 'phone' && (
              <div className="mt-2 p-2 bg-slate-800/50 rounded-md text-xs text-slate-300 flex items-center gap-x-2">
                <InformationCircleIcon className="w-4 h-4 text-theme-secondary-accent" />
                <span>هل رقم هاتفك هو: <strong className="font-mono text-theme-secondary-accent opacity-90">{loginHint.value}</strong>؟</span>
              </div>
            )}
          </div>

          {phoneInputSection}
          {loginHint?.type === 'email' && (
            <div className="mt-2 p-2 bg-slate-800/50 rounded-md text-xs text-slate-300 flex items-center gap-x-2">
              <InformationCircleIcon className="w-4 h-4 text-theme-secondary-accent" />
              <span>هل بريدك الإلكتروني هو: <strong className="font-mono text-theme-secondary-accent opacity-90">{loginHint.value}</strong>؟</span>
            </div>
          )}


          {isRegister && (
            <div className="pt-2">
              <label className="captcha-checkbox-container">
                <input type="checkbox" checked={isVerified} onChange={() => setIsVerified(!isVerified)} />
                <div className="checkbox-visual">
                  <CheckIcon className="check-icon w-4 h-4" />
                </div>
                <span className="checkbox-label">أنا لست برنامج روبوت</span>
              </label>
            </div>
          )}

          {error && <p className="text-pink-400 font-bold text-center mt-4 bg-pink-500/10 p-3 rounded-md border border-pink-500/30 flex items-center gap-x-2"><ExclamationCircleIcon className="w-5 h-5" /> {error}</p>}
          {info && <p className="text-sky-300 font-bold text-center mt-4 bg-sky-500/10 p-3 rounded-md border border-sky-500/30">{info}</p>}

          <button
            type="submit"
            className="w-full bg-theme-gradient-btn text-white font-bold py-3 rounded-lg transition-all transform hover:scale-105 shadow-lg shadow-theme-accent disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isRegister && !isVerified}
          >
            {isRegister ? 'إنشاء حساب' : loginButtonText}
          </button>
        </form>
        {isRegister ? (
          <p className="mt-6 text-center text-sm">
            لديك حساب بالفعل؟
            <button type="button" onClick={() => { setView('login'); setIsVerified(false); setLoginHint(null); }} className="font-bold text-fuchsia-400 hover:underline mx-2">
              سجل الدخول
            </button>
          </p>
        ) : showRegisterView && (
          <p className="mt-6 text-center text-sm">
            ليس لديك حساب؟
            <button type="button" onClick={() => { setView('register'); setIsVerified(false); setLoginHint(null); }} className="font-bold text-fuchsia-400 hover:underline mx-2">
              أنشئ حساباً
            </button>
          </p>
        )}
      </>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-[200] p-4">
      <div className="bg-theme-gradient backdrop-blur-2xl text-slate-200 rounded-lg shadow-2xl w-full max-w-md border border-violet-500/50 relative">
        <div className="p-8">
          {onBack && (
            <button onClick={onBack} className="absolute top-4 left-4 p-2 text-slate-400 hover:text-white">&larr; عودة</button>
          )}

          <div className="text-center mb-6">
            <ShieldCheckIcon className="w-12 h-12 text-fuchsia-400 mx-auto" />
          </div>

          {view === 'login' && renderLoginRegisterView()}
          {view === 'register' && renderLoginRegisterView()}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
