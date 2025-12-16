import React, { useMemo, useState } from 'react';
import { useUser } from '../context/UserContext';
import { CloseIcon, BanknotesIcon, CreditCardIcon, LockClosedIcon, VisaIcon, MastercardIcon } from './icons';
import { User } from '../types';

interface ProductCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void; // For bank transfers
  onCardPaymentConfirm: () => void; // For successful card payments
  onRequestLogin: () => void;
  currentUser: User | null;
}

type PaymentMethod = 'CARD' | 'BANK_TRANSFER';

const ProductCheckoutModal: React.FC<ProductCheckoutModalProps> = ({ isOpen, onClose, onConfirm, onCardPaymentConfirm, onRequestLogin, currentUser }) => {
  const { products, drhopeData, cart } = useUser();
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('CARD');
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardError, setCardError] = useState('');

  const cartItems = useMemo(() => {
    return cart?.items || [];
  }, [cart]);

  const subtotal = useMemo(() => {
    if (!cart || !cart.items) return 0;
    return cart.items.reduce((sum, item) => {
      // Fallback to local product price if item.price not populated
      const price = item.price || item.product?.price || 0;
      return sum + (price * item.quantity);
    }, 0);
  }, [cart]);

  const taxAmount = subtotal * 0.05;
  const totalAmount = subtotal + taxAmount;

  if (!isOpen) return null;

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (cardExpiry.length > value.length && cardExpiry.includes(' / ')) {
      value = value.slice(0, 2);
    } else if (value.length > 2) {
      value = value.slice(0, 2) + ' / ' + value.slice(2, 4);
    }
    setCardExpiry(value);
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 16);
    const formattedValue = value.replace(/(.{4})/g, '$1 ').trim();
    setCardNumber(formattedValue);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCardError('');

    if (!currentUser) {
      onRequestLogin();
      return;
    }

    if (selectedMethod === 'BANK_TRANSFER') {
      onConfirm();
    } else if (selectedMethod === 'CARD') {
      if (!cardName.trim() || cardNumber.replace(/\s/g, '').length !== 16 || cardExpiry.length !== 7 || cardCvv.length < 3) {
        setCardError('يرجى ملء جميع بيانات البطاقة بشكل صحيح.');
        return;
      }
      setIsProcessing(true);
      setTimeout(() => {
        setIsProcessing(false);
        onCardPaymentConfirm();
      }, 1500);
    }
  };

  const methodButtonClass = (method: PaymentMethod) =>
    `flex-1 py-4 px-2 text-sm font-bold rounded-xl transition-all border flex items-center justify-center gap-x-2 relative overflow-hidden group ${selectedMethod === method
      ? 'bg-gradient-to-r from-purple-800 to-pink-600 border-pink-400 text-white shadow-lg shadow-purple-500/20'
      : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:border-white/20'
    }`;

  return (
    <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-[#2e0235] via-[#3b0764] to-[#4c1d95] text-slate-200 rounded-2xl shadow-2xl w-full max-w-lg border border-fuchsia-500/30 flex flex-col max-h-[90vh] animate-fade-in-up">
        <header className="p-5 flex justify-between items-center border-b border-fuchsia-500/20 flex-shrink-0 bg-black/20">
          <h2 className="text-xl font-bold text-white">تأكيد الطلب والدفع</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors"><CloseIcon className="w-6 h-6" /></button>
        </header>

        <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto p-6 space-y-6 custom-scrollbar">
          <div className="bg-white/5 p-5 rounded-xl border border-white/10">
            <h3 className="text-xs font-bold text-fuchsia-300 uppercase tracking-wider mb-4">ملخص الطلب</h3>
            <div className="space-y-3">
              {cartItems.map(({ product, quantity }) => (
                <div key={product!.id} className="flex justify-between items-center text-sm border-b border-white/5 pb-2 last:border-0">
                  <p className="text-white">{product!.name || product!.title} <span className="text-slate-400 font-mono text-xs ml-1">x{quantity}</span></p>
                  <p className="font-bold text-fuchsia-200">{(product!.price * quantity).toFixed(2)}</p>
                </div>
              ))}
              <div className="border-t border-white/10 pt-3 space-y-2 mt-2">
                <div className="flex justify-between text-sm text-slate-400"><p>المجموع الفرعي:</p><p>{subtotal.toFixed(2)}</p></div>
                <div className="flex justify-between text-sm text-slate-400"><p>الضريبة (5%):</p><p>{taxAmount.toFixed(2)}</p></div>
                <div className="flex justify-between font-bold text-lg text-white pt-2"><p>الإجمالي:</p><p>{totalAmount.toFixed(2)} <span className="text-xs font-normal text-yellow-400">درهم</span></p></div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-300 mb-3 px-1">اختر طريقة الدفع</h3>
            <div className="flex gap-4">
              <button type="button" onClick={() => setSelectedMethod('CARD')} className={methodButtonClass('CARD')}>
                <CreditCardIcon className="w-6 h-6" /> <span>بطاقة بنكية</span>
              </button>
              <button type="button" onClick={() => setSelectedMethod('BANK_TRANSFER')} className={methodButtonClass('BANK_TRANSFER')}>
                <BanknotesIcon className="w-6 h-6" /> <span>تحويل بنكي</span>
              </button>
            </div>
          </div>

          <div>
            {selectedMethod === 'CARD' ? (
              <div className="bg-black/20 p-5 rounded-2xl border border-fuchsia-500/20 space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-2">
                  <h3 className="font-bold text-white text-sm">بيانات البطاقة</h3>
                  <div className="flex items-center gap-x-2 opacity-80"><VisaIcon className="w-8" /><MastercardIcon className="w-8" /></div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 mb-1.5 block">رقم البطاقة</label>
                  <div className="relative">
                    <input type="tel" value={cardNumber} onChange={handleCardNumberChange} placeholder="0000 0000 0000 0000" className="w-full p-3 bg-white/5 border border-white/10 rounded-lg ltr-input focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all text-white placeholder-slate-600" maxLength={19} required={selectedMethod === 'CARD'} />
                    <LockClosedIcon className="w-4 h-4 text-slate-500 absolute right-3 top-3.5" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 mb-1.5 block">الاسم على البطاقة</label>
                  <input type="text" value={cardName} onChange={e => setCardName(e.target.value)} placeholder="Full Name" className="w-full p-3 bg-white/5 border border-white/10 rounded-lg focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all text-white placeholder-slate-600" required={selectedMethod === 'CARD'} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-400 mb-1.5 block">تاريخ الانتهاء</label>
                    <input type="text" value={cardExpiry} onChange={handleExpiryChange} placeholder="MM / YY" className="w-full p-3 bg-white/5 border border-white/10 rounded-lg ltr-input focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all text-white placeholder-slate-600" required={selectedMethod === 'CARD'} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 mb-1.5 block">CVV</label>
                    <input type="tel" value={cardCvv} onChange={e => setCardCvv(e.target.value.replace(/\D/g, ''))} placeholder="123" className="w-full p-3 bg-white/5 border border-white/10 rounded-lg ltr-input focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all text-white placeholder-slate-600" maxLength={4} required={selectedMethod === 'CARD'} />
                  </div>
                </div>
                {cardError && <p className="text-sm text-red-400 text-center bg-red-900/20 p-2 rounded border border-red-500/20">{cardError}</p>}
              </div>
            ) : (
              <div className="space-y-4 text-center">
                <h3 className="font-bold text-fuchsia-300 text-sm">تفاصيل الحساب البنكي للتحويل</h3>
                <div className="bg-white/5 p-5 rounded-2xl border border-white/10 space-y-3 text-right text-sm">
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-slate-400">اسم صاحب الحساب</span>
                    <span className="font-bold text-white">{drhopeData.accountHolderName || 'غير متوفر'}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-slate-400">اسم البنك</span>
                    <span className="font-bold text-white">{drhopeData.bankName || 'غير متوفر'}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-slate-400">رقم IBAN</span>
                    <span dir="ltr" className="font-mono text-fuchsia-300 select-all">{drhopeData.ibanNumber || 'غير متوفر'}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-slate-400">رقم الحساب</span>
                    <span dir="ltr" className="font-mono text-white select-all">{drhopeData.accountNumber || 'غير متوفر'}</span>
                  </div>
                </div>
                <div className="bg-amber-500/10 p-3 rounded-lg border border-amber-500/30 flex items-start gap-2 text-right">
                  <span className="text-amber-400 text-lg">⚠️</span>
                  <p className="text-xs font-bold text-amber-200/80 leading-relaxed">
                    ملاحظة هامة: بعد التحويل، يرجى إرسال صورة من إثبات التحويل إلى رقم الواتساب لتأكيد طلبك.
                  </p>
                </div>
              </div>
            )}
          </div>
        </form>

        <footer className="p-6 pt-2 flex-shrink-0 bg-black/20">
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isProcessing}
            className="w-full flex items-center justify-center gap-x-3 bg-gradient-to-r from-purple-800 to-pink-600 hover:from-purple-700 hover:to-pink-500 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 transform hover:scale-[1.02] shadow-lg shadow-purple-900/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none border border-white/10"
          >
            {isProcessing ? <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div> : (
              selectedMethod === 'CARD' ? (
                <><LockClosedIcon className="w-5 h-5" /><span>{currentUser ? `ادفع الآن ${totalAmount.toFixed(2)} درهم` : 'متابعة'}</span></>
              ) : (
                <span>{currentUser ? 'لقد قمت بالتحويل، تأكيد الطلب' : 'متابعة'}</span>
              )
            )}
          </button>
          {selectedMethod === 'CARD' && (
            <div className="flex justify-center items-center gap-2 mt-3 opacity-60">
              <LockClosedIcon className="w-3 h-3 text-slate-400" />
              <p className="text-[10px] text-slate-400">جميع المعاملات مشفرة ومحمية بتقنية SSL</p>
            </div>
          )}
        </footer>
      </div>
    </div>
  );
};

export default ProductCheckoutModal;
