import React, { useState, useMemo } from 'react';
import { useUser } from '../context/UserContext';
import { Product } from '../types';
import { CloseIcon, ShoppingCartIcon, TrashIcon, ArrowRightIcon } from './icons';
import ProductCard from './ProductCard';

interface BoutiqueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckout: () => void;
  onRequestLogin: () => void;
  initialView?: 'products' | 'cart';
}

const BoutiqueModal: React.FC<BoutiqueModalProps> = ({
  isOpen, onClose, onCheckout, onRequestLogin, initialView = 'products'
}) => {
  const [view, setView] = useState<'products' | 'cart'>(initialView);
  const { products, cart, addToCart, updateCartItem, removeFromCart, currentUser, fetchDrHopeContent, drhopeData } = useUser();
  const visibleProducts = products.filter(p => !p.isDeleted);

  React.useEffect(() => {
    if (isOpen && visibleProducts.length === 0) {

      fetchDrHopeContent();
    }
  }, [isOpen, visibleProducts.length, fetchDrHopeContent]);

  const cartItemCount = useMemo(() => {
    if (!cart || !cart.items) return 0;
    return cart.items.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const cartItems = useMemo(() => {
    return cart?.items || [];
  }, [cart]);

  const subtotal = useMemo(() => {
    // Use cart.total_price from backend if available and reliable, otherwise calculate
    // Backend sent "total_price" for the whole cart. Let's use it or calculate.
    // Calculation is safer if backend total logic differs (e.g. tax included or not).
    // But server side usually authoritative.
    // Let's calculate for consistent UI updates (optimistic).
    // Actually backend response has item_total.
    if (!cart || !cart.items) return 0;
    return cart.items.reduce((sum, item) => {
      // Fallback to local product price if item.price not populated (unlikely)
      const price = item.price || item.product?.price || 0;
      return sum + (price * item.quantity);
    }, 0);
  }, [cart]);

  const taxAmount = subtotal * 0.05;
  const totalAmount = subtotal + taxAmount;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50 p-4">
      <div
        className="bg-gradient-to-br from-[#2e0235] via-[#3b0764] to-[#4c1d95] text-slate-200 rounded-2xl shadow-2xl w-full max-w-5xl border border-fuchsia-500/30 flex flex-col h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'fade-in-up 0.3s ease-out forwards' }}
      >
        {/* Header */}
        <header className="flex-shrink-0 flex justify-between items-center p-5 border-b border-fuchsia-500/20 bg-black/20">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-3">
              {drhopeData.logoUrl ? (
                <div className="bg-white/90 p-1 rounded-lg shadow-sm">
                  <img src={drhopeData.logoUrl} alt="Nawaya Logo" className="h-6 w-auto object-contain" />
                </div>
              ) : (
                <span className="text-fuchsia-400">🛍️</span>
              )}
              {view === 'products' ? 'بوتيك دكتور هوب' : 'سلة المشتريات'}
            </h2>
            {view === 'products' && <p className="text-xs text-fuchsia-300 mt-0.5">منتجات مختارة لدعم رحلتك</p>}
          </div>
          <div className="flex items-center gap-x-4">
            <button
              onClick={() => setView(v => v === 'products' ? 'cart' : 'products')}
              className="relative p-2.5 rounded-full text-white hover:bg-white/10 transition-colors border border-white/10 hover:border-fuchsia-500/50"
              aria-label="عرض السلة"
            >
              <ShoppingCartIcon className="w-6 h-6" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-purple-800 to-pink-600 text-[10px] font-bold ring-2 ring-[#2e0235] shadow-lg animate-bounce">
                  {cartItemCount}
                </span>
              )}
            </button>
            {view === 'cart' ? (
              <button onClick={() => setView('products')} className="p-2 rounded-full hover:bg-white/10 text-slate-300 transition-colors transform hover:-translate-x-1" aria-label="رجوع">
                <ArrowRightIcon className="w-6 h-6" />
              </button>
            ) : (
              <button onClick={onClose} className="p-2 rounded-full text-slate-300 hover:bg-white/20 transition-colors" aria-label="إغلاق">
                <CloseIcon className="w-6 h-6" />
              </button>
            )}
          </div>
        </header>

        {/* Content */}
        <div className="flex-grow overflow-y-auto p-6 custom-scrollbar bg-black/10">
          {view === 'products' ? (
            visibleProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {visibleProducts.map(product => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    isInCart={cartItems.some(item => Number(item.product.id) === Number(product.id))}
                    onAddToCart={async () => {
                      const success = await addToCart(product.id);
                      if (!success && !currentUser) {
                        onRequestLogin();
                      }
                      return success;
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 opacity-60">
                <div className="w-20 h-20 border-2 border-dashed border-slate-500 rounded-full flex items-center justify-center mb-4">
                  <span className="text-3xl">📭</span>
                </div>
                <p>البوتيك فارغ حالياً. ترقبوا منتجاتنا قريباً!</p>
              </div>
            )
          ) : ( // Cart View
            cartItems.length > 0 ? (
              <div className="space-y-4 max-w-3xl mx-auto">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-x-4 bg-slate-800/60 p-4 rounded-xl border border-slate-700/50 hover:border-fuchsia-500/30 transition-colors">
                    <img src={item.product.imageUrl || item.product.image} alt={item.product.name || item.product.title} className="w-20 h-20 object-cover rounded-lg flex-shrink-0 shadow-md" />
                    <div className="flex-grow min-w-0">
                      <p className="font-bold text-white text-lg mb-1">{item.product.name || item.product.title}</p>
                      <p className="text-sm text-fuchsia-300 font-mono">{item.product.price.toFixed(2)} درهم</p>
                    </div>
                    <div className="flex items-center gap-x-3 flex-shrink-0 bg-black/20 p-1.5 rounded-lg border border-slate-700">
                      <div className="flex items-center gap-x-1">
                        <button
                          onClick={() => updateCartItem(item.id, item.quantity + 1)}
                          className="w-7 h-7 flex items-center justify-center rounded bg-white/10 hover:bg-white/20 text-white transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                            <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                          </svg>
                        </button>
                        <span className="w-8 text-center text-white font-bold">{item.quantity}</span>
                        <button
                          onClick={() => {
                            if (item.quantity > 1) updateCartItem(item.id, item.quantity - 1);
                          }}
                          className={`w-7 h-7 flex items-center justify-center rounded bg-white/10 text-white transition-colors ${item.quantity <= 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white/20'}`}
                          disabled={item.quantity <= 1}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                            <path fillRule="evenodd" d="M4 10a.75.75 0 01.75-.75h10.5a.75.75 0 010 1.5H4.75A.75.75 0 014 10z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                      <div className="w-px h-6 bg-slate-600"></div>
                      <button onClick={() => removeFromCart(item.id)} className="p-1.5 rounded-md text-red-400 hover:bg-red-500/20 transition-colors">
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 opacity-60">
                <ShoppingCartIcon className="w-16 h-16 mb-4 text-slate-500" />
                <p className="text-lg">سلة مشترياتك فارغة.</p>
                <button
                  onClick={() => setView('products')}
                  className="mt-6 bg-gradient-to-r from-purple-800 to-pink-600 hover:from-purple-700 hover:to-pink-500 text-white font-bold py-2 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg shadow-purple-500/30 border border-fuchsia-500/20"
                >
                  تصفح المنتجات
                </button>
              </div>
            )
          )}
        </div>

        {/* Footer (Cart View Only) */}
        {
          view === 'cart' && cartItems.length > 0 && (
            <footer className="flex-shrink-0 p-5 border-t border-fuchsia-500/20 bg-black/30 backdrop-blur-md">
              <div className="max-w-3xl mx-auto">
                <div className="space-y-2 text-sm mb-4">
                  <div className="flex justify-between text-slate-300"><p>المجموع الفرعي:</p><p className="font-mono">{subtotal.toFixed(2)}</p></div>
                  <div className="flex justify-between text-slate-300"><p>ضريبة القيمة المضافة (5%):</p><p className="font-mono">{taxAmount.toFixed(2)}</p></div>
                  <div className="h-px bg-white/10 my-2"></div>
                  <div className="flex justify-between text-white font-bold text-xl"><p>الإجمالي:</p><p className="font-mono text-fuchsia-300">{totalAmount.toFixed(2)} <span className="text-sm font-normal text-slate-400">درهم</span></p></div>
                </div>
                <button
                  onClick={onCheckout}
                  className="w-full bg-gradient-to-r from-purple-800 to-pink-600 hover:from-purple-700 hover:to-pink-500 text-white font-bold py-3.5 rounded-xl transition-all duration-300 shadow-lg shadow-purple-900/30 transform hover:scale-[1.01] border border-fuchsia-500/20"
                >
                  الانتقال إلى الدفع الآمن
                </button>
              </div>
            </footer>
          )
        }
      </div >
    </div >
  );
};

export default BoutiqueModal;
