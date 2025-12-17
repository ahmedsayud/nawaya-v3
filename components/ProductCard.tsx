
import React, { useState } from 'react';
import { Product } from '../types';
import { ShoppingCartIcon } from './icons';

interface ProductCardProps {
  product: Product;
  onAddToCart: () => Promise<boolean>;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const handleAddToCart = async () => {
    setIsAdding(true);
    try {
      const success = await onAddToCart();
      if (success) {
        setJustAdded(true);
        setTimeout(() => setJustAdded(false), 2000);
      }
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="bg-theme-gradient backdrop-blur-sm rounded-xl shadow-lg transform hover:-translate-y-2 hover:scale-105 transition-all duration-300 flex flex-col h-full hover:shadow-2xl hover:shadow-violet-500/20 group card-animated-border">
      <div className="relative aspect-square w-full">
        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
      </div>
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-lg font-bold text-white flex-grow">{product.name}</h3>
        <div className="flex justify-between items-center mt-4">
          <p className="text-xl font-bold text-fuchsia-400">{product.price.toFixed(2)} <span className="text-sm">درهم</span></p>
          <button
            onClick={handleAddToCart}
            disabled={isAdding || justAdded}
            className={`flex items-center gap-x-2 font-bold py-2 px-4 rounded-lg transition-all duration-300 transform shadow-lg text-sm border ${justAdded
                ? 'bg-green-600 border-green-400 text-white'
                : 'bg-gradient-to-r from-purple-800 to-pink-600 hover:from-purple-700 hover:to-pink-500 text-white hover:scale-110 shadow-purple-900/30 hover:shadow-pink-500/50 border-fuchsia-500/20'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            aria-label={`إضافة ${product.name} إلى السلة`}
          >
            {isAdding ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>جاري الإضافة...</span>
              </>
            ) : justAdded ? (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>تمت الإضافة!</span>
              </>
            ) : (
              <>
                <ShoppingCartIcon className="w-5 h-5" />
                <span>أضف للسلة</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
