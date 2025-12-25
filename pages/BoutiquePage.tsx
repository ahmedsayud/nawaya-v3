
import React from 'react';
import { useUser } from '../context/UserContext';
import ProductCard from '../components/ProductCard';
import { ShoppingCartIcon } from '../components/icons';

interface BoutiquePageProps {
  showToast: (message: string, type?: 'success' | 'warning' | 'error') => void;
  onLoginRequest: () => void;
  cart: Map<number, number>;
  onAddToCart: (productId: number) => void;
  onOpenCart: () => void;
}

const BoutiquePage: React.FC<BoutiquePageProps> = ({ showToast, onLoginRequest, cart, onAddToCart, onOpenCart }) => {
  const { products, fetchDrHopeContent } = useUser();
  const visibleProducts = products.filter(p => !p.isDeleted);

  React.useEffect(() => {
    if (visibleProducts.length === 0) {
      console.log('[BoutiquePage] Products list empty, triggering re-fetch...');
      fetchDrHopeContent();
    }
  }, [visibleProducts.length, fetchDrHopeContent]);

  const cartItemCount = (Array.from(cart.values()) as number[]).reduce((sum: number, qty: number) => sum + qty, 0);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8 bg-black/20 p-4 rounded-2xl border border-fuchsia-500/20 backdrop-blur-md">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-wide">بوتيك دكتور هوب</h2>
          <p className="text-fuchsia-300 text-sm font-medium mt-1">منتجات مختارة لدعم رحلتك التطويرية</p>
        </div>
        <button
          onClick={onOpenCart}
          className="relative p-3 rounded-full text-white hover:bg-white/10 transition-all duration-300 border border-white/10 hover:border-fuchsia-500/50 shadow-lg"
          aria-label="عرض السلة"
        >
          <ShoppingCartIcon className="w-7 h-7" />
          {cartItemCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-fuchsia-600 to-purple-600 text-[10px] font-bold ring-2 ring-[#2e0235] shadow-lg animate-bounce">
              {cartItemCount}
            </span>
          )}
        </button>
      </div>

      {visibleProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {visibleProducts.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={() => onAddToCart(product.id)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center text-slate-400 py-20 bg-black/20 rounded-2xl border border-dashed border-slate-700">
          <p className="text-lg font-medium">البوتيك فارغ حالياً. ترقبوا منتجاتنا قريباً!</p>
        </div>
      )}
    </div>
  );
};

export default BoutiquePage;
