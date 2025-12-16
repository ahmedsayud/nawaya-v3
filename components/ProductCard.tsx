
import React from 'react';
import { Product } from '../types';
import { ShoppingCartIcon } from './icons';

interface ProductCardProps {
  product: Product;
  onAddToCart: () => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => {
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
            onClick={onAddToCart}
            className="flex items-center gap-x-2 bg-gradient-to-r from-purple-800 to-pink-600 hover:from-purple-700 hover:to-pink-500 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300 transform hover:scale-110 shadow-lg shadow-purple-900/30 hover:shadow-pink-500/50 text-sm border border-fuchsia-500/20"
            aria-label={`إضافة ${product.name} إلى السلة`}
          >
            <ShoppingCartIcon className="w-5 h-5"/>
            <span>أضف للسلة</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
