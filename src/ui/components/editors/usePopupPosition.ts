import { useState, useEffect, useRef } from 'react';

/**
 * Hook that calculates a viewport-safe position for a popup editor.
 * Returns an anchor ref to place in the cell, a container ref for the popup,
 * and the computed { top, left } position for fixed positioning.
 */
export function usePopupPosition(popupWidth: number, popupMaxHeight: number) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!anchorRef.current) return;

    const updatePosition = () => {
      const rect = anchorRef.current!.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      // Vertical: prefer below the cell, flip above if not enough space
      let top = rect.bottom + 4;
      if (top + popupMaxHeight > vh && rect.top - popupMaxHeight - 4 > 0) {
        top = rect.top - popupMaxHeight - 4;
      }
      top = Math.max(8, Math.min(top, vh - popupMaxHeight - 8));

      // Horizontal: align to cell left, push left if it overflows right edge
      let left = rect.left;
      if (left + popupWidth > vw - 8) {
        left = vw - popupWidth - 8;
      }
      left = Math.max(8, left);

      setPosition({ top, left });
    };

    updatePosition();

    // Reposition on scroll/resize since the cell may move
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [popupWidth, popupMaxHeight]);

  return { anchorRef, containerRef, position };
}
