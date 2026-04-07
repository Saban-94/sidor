'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Check } from 'lucide-react';
import { playChimeSound, playSuccessSound } from '@/lib/audio';

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  stock: number;
  imageUrl?: string;
  onAddToCart: (productId: string, productName: string, price: number) => void;
}

export default function ProductCard({
  id,
  name,
  price,
  stock,
  imageUrl,
  onAddToCart,
}: ProductCardProps) {
  const [isAdded, setIsAdded] = useState(false);

  const handleAddToCart = () => {
    playChimeSound();
    playSuccessSound();
    onAddToCart(id, name, price);
    setIsAdded(true);

    setTimeout(() => {
      setIsAdded(false);
    }, 2000);
  };

  const isOutOfStock = stock === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="glass-effect w-full rounded-2xl overflow-hidden p-4 mb-4"
    >
      {/* Product Image */}
      {imageUrl && (
        <div className="relative w-full h-40 rounded-xl overflow-hidden mb-3 bg-gradient-to-br from-[var(--color-surface)] to-[var(--color-surface-secondary)]">
          <img
            src={imageUrl}
            alt={name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      )}

      {/* Product Info */}
      <div className="space-y-2">
        <h3 className="font-bold text-base text-[var(--color-text-primary)]">{name}</h3>

        {/* Price and Stock */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-[var(--color-primary)]">
            {price.toLocaleString('he-IL')} ₪
          </span>
          <span
            className={`text-xs px-2 py-1 rounded-full font-medium ${
              isOutOfStock
                ? 'bg-red-500/20 text-red-400'
                : stock < 10
                  ? 'bg-yellow-500/20 text-yellow-400'
                  : 'bg-green-500/20 text-green-400'
            }`}
          >
            {isOutOfStock ? 'אין במלאי' : stock < 10 ? `${stock} במלאי` : 'במלאי'}
          </span>
        </div>

        {/* Add to Cart Button */}
        <motion.button
          onClick={handleAddToCart}
          disabled={isOutOfStock || isAdded}
          whileHover={!isOutOfStock && !isAdded ? { scale: 1.02 } : {}}
          whileTap={!isOutOfStock && !isAdded ? { scale: 0.98 } : {}}
          className={`w-full py-2 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
            isAdded
              ? 'bg-green-500 text-white'
              : isOutOfStock
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-light)] text-white hover:shadow-lg hover:shadow-emerald-500/30'
          }`}
        >
          <motion.div
            animate={{ scale: isAdded ? [1, 1.2, 1] : 1 }}
            transition={{ duration: 0.6 }}
          >
            {isAdded ? (
              <Check className="w-4 h-4" />
            ) : (
              <ShoppingCart className="w-4 h-4" />
            )}
          </motion.div>
          <span>{isAdded ? 'נוסף לעגלה' : 'הוסף לעגלה'}</span>
        </motion.button>
      </div>
    </motion.div>
  );
}
