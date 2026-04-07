import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, X } from 'lucide-react';

export default function FloatingActionButton() {
  const [isActive, setIsActive] = useState(false);

  return (
    <>
      {/* Camera Icon FAB */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsActive(!isActive)}
        className="fixed bottom-8 left-8 z-30
          w-14 h-14 rounded-full
          bg-gradient-to-r from-[#10b981] to-[#059669]
          text-white shadow-2xl
          flex items-center justify-center
          hover:shadow-3xl transition-all duration-300
          glow-emerald"
      >
        {isActive ? (
          <X className="w-6 h-6" />
        ) : (
          <Camera className="w-6 h-6" />
        )}
      </motion.button>

      {/* Action Menu - appears when FAB is active */}
      {isActive && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="fixed bottom-24 left-8 z-20 flex flex-col gap-3"
        >
          {/* Camera Upload */}
          <motion.button
            whileHover={{ scale: 1.1, x: -10 }}
            whileTap={{ scale: 0.95 }}
            className="px-4 py-2 rounded-full glass-effect-light
              text-white font-medium text-sm shadow-lg
              hover:shadow-xl transition-all duration-300
              flex items-center gap-2"
          >
            <Camera className="w-4 h-4" />
            Scan Material
          </motion.button>

          {/* File Upload */}
          <motion.button
            whileHover={{ scale: 1.1, x: -10 }}
            whileTap={{ scale: 0.95 }}
            className="px-4 py-2 rounded-full glass-effect-light
              text-white font-medium text-sm shadow-lg
              hover:shadow-xl transition-all duration-300
              flex items-center gap-2"
          >
            📷 Gallery
          </motion.button>

          {/* Analysis Option */}
          <motion.button
            whileHover={{ scale: 1.1, x: -10 }}
            whileTap={{ scale: 0.95 }}
            className="px-4 py-2 rounded-full glass-effect-light
              text-white font-medium text-sm shadow-lg
              hover:shadow-xl transition-all duration-300
              flex items-center gap-2"
          >
            🔍 Analyze
          </motion.button>
        </motion.div>
      )}

      {/* Hidden file input for camera/gallery */}
      <input
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        id="image-upload"
      />
    </>
  );
}
