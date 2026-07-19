"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export default function BottomSheet({ isOpen, onClose, children }: BottomSheetProps) {
  // Prevent body scrolling when sheet is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-background/40 backdrop-blur-[4px] z-40 cursor-pointer max-w-md mx-auto"
          />

          {/* Animated Sheet Container */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-surface-container-low/95 backdrop-blur-2xl rounded-t-[32px] border-t border-white/10 p-6 z-50 shadow-2xl overflow-y-auto max-h-[92vh] pb-10"
          >
            {/* Drag indicator handle */}
            <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-6 cursor-pointer" onClick={onClose} />

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface p-1"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
