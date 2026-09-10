import React, { useEffect, useRef, useState, useCallback } from "react";
import { X } from "lucide-react";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: string; // e.g. "max-w-md", "max-w-lg"
  showCloseButton?: boolean;
}

export default function BottomSheet({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = "max-w-md",
  showCloseButton = true
}: BottomSheetProps) {
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startYRef = useRef(0);
  const currentYRef = useRef(0);
  const sheetRef = useRef<HTMLDivElement>(null);

  // ESC key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent background body scroll when open
  useEffect(() => {
    if (isOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [isOpen]);

  // Touch gesture handlers for swipe-to-dismiss on mobile
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    // Only allow drag if scrolled to top or started on drag handle
    const target = e.target as HTMLElement;
    const isHandle = target.closest(".drag-handle-area");
    const contentEl = sheetRef.current?.querySelector(".sheet-scroll-content");
    
    if (isHandle || !contentEl || contentEl.scrollTop <= 0) {
      startYRef.current = e.touches[0].clientY;
      currentYRef.current = e.touches[0].clientY;
      setIsDragging(true);
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return;
    currentYRef.current = e.touches[0].clientY;
    const delta = currentYRef.current - startYRef.current;
    
    // Only drag downwards (delta > 0) with a little elastic resistance if dragging up
    if (delta > 0) {
      setDragY(delta);
    } else {
      setDragY(delta * 0.15); // gentle rubber-band resistance
    }
  }, [isDragging]);

  const handleTouchEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    
    // If dragged down by 80px or more, close the sheet
    if (dragY > 80) {
      onClose();
    }
    // Snap back
    setDragY(0);
  }, [isDragging, dragY, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs transition-opacity duration-200 animate-fade-in"
      onClick={onClose}
    >
      <div
        ref={sheetRef}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: dragY !== 0 ? `translateY(${Math.max(0, dragY)}px)` : undefined,
          transition: isDragging ? "none" : "transform 0.22s cubic-bezier(0.16, 1, 0.3, 1)"
        }}
        className={`w-full ${maxWidth} bg-surface rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh] sm:max-h-[85vh] sm:m-4 text-left border-t sm:border border-line`}
      >
        {/* Mobile Drag Handle */}
        <div className="drag-handle-area sm:hidden pt-3 pb-1.5 flex justify-center cursor-grab active:cursor-grabbing select-none touch-none">
          <div className="w-11 h-1.5 rounded-full bg-ink-faint/30 hover:bg-ink-faint/50 transition-colors" />
        </div>

        {/* Optional Header */}
        {(title || showCloseButton) && (
          <div className="px-5 pt-3 pb-2.5 flex items-center justify-between border-b border-line/60">
            <div>
              {typeof title === "string" ? (
                <h3 className="font-serif text-lg font-bold text-ink">{title}</h3>
              ) : (
                title
              )}
              {subtitle && (
                <div className="text-xs text-ink-soft mt-0.5">{subtitle}</div>
              )}
            </div>

            {showCloseButton && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl text-ink-faint hover:text-ink hover:bg-sunken transition-colors cursor-pointer"
                aria-label="닫기"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* Content Area */}
        <div className="sheet-scroll-content p-5 overflow-y-auto space-y-4 pb-8 sm:pb-5 overscroll-contain">
          {children}
        </div>
      </div>
    </div>
  );
}
