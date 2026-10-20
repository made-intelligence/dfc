"use client";

import { useEffect, useRef, useState } from "react";
import { X, ZoomIn, ZoomOut } from "lucide-react";

/**
 * Event flyer with an in-page viewer: tap to open full screen, tap again (or
 * the zoom button) to zoom to 2.5x and pan by scrolling/dragging. Stays on the
 * page instead of opening the raw image URL.
 */
export function EventImageViewer({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  const [open, setOpen] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; left: number; top: number; moved: boolean } | null>(null);

  const close = () => {
    setOpen(false);
    setZoomed(false);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Zoom towards the point that was tapped.
  const toggleZoom = (clientX?: number, clientY?: number) => {
    const el = scrollRef.current;
    if (!zoomed && el && clientX !== undefined && clientY !== undefined) {
      const rect = el.getBoundingClientRect();
      const fx = (clientX - rect.left) / rect.width;
      const fy = (clientY - rect.top) / rect.height;
      setZoomed(true);
      requestAnimationFrame(() => {
        el.scrollLeft = fx * el.scrollWidth - rect.width / 2;
        el.scrollTop = fy * el.scrollHeight - rect.height / 2;
      });
      return;
    }
    setZoomed((z) => !z);
  };

  // Mouse drag-to-pan while zoomed (touch devices pan natively by scrolling).
  const onPointerDown = (e: React.PointerEvent) => {
    if (!zoomed || e.pointerType !== "mouse" || !scrollRef.current) return;
    drag.current = {
      x: e.clientX,
      y: e.clientY,
      left: scrollRef.current.scrollLeft,
      top: scrollRef.current.scrollTop,
      moved: false,
    };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || !scrollRef.current) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (Math.abs(dx) + Math.abs(dy) > 4) d.moved = true;
    scrollRef.current.scrollLeft = d.left - dx;
    scrollRef.current.scrollTop = d.top - dy;
  };
  const onPointerUp = () => {
    // Keep `moved` readable by the click handler that fires right after.
    setTimeout(() => (drag.current = null), 0);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`block w-full cursor-zoom-in overflow-hidden rounded-xl bg-gray-100 ring-1 ring-gray-200 ${className}`}
        aria-label={`View ${alt} full screen`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} className="mx-auto h-auto max-h-[70vh] w-full object-contain lg:max-h-[calc(100vh-9rem)]" />
      </button>

      {open && (
        <div role="dialog" aria-modal="true" aria-label={alt} className="fixed inset-0 z-[70] bg-black/90">
          <div className="absolute right-3 top-3 z-10 flex gap-2">
            <button
              type="button"
              onClick={() => toggleZoom()}
              aria-label={zoomed ? "Zoom out" : "Zoom in"}
              className="rounded-full bg-white/10 p-2.5 text-white hover:bg-white/20"
            >
              {zoomed ? <ZoomOut className="h-5 w-5" /> : <ZoomIn className="h-5 w-5" />}
            </button>
            <button
              type="button"
              onClick={close}
              aria-label="Close"
              autoFocus
              className="rounded-full bg-white/10 p-2.5 text-white hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div
            ref={scrollRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
            onClick={(e) => {
              if (drag.current?.moved) return;
              // Tapping the dark backdrop (not the image) closes when not zoomed.
              if (!zoomed && e.target === e.currentTarget) return close();
              toggleZoom(e.clientX, e.clientY);
            }}
            className={`h-full w-full ${
              zoomed ? "cursor-grab overflow-auto active:cursor-grabbing" : "flex cursor-zoom-in items-center justify-center p-4 sm:p-10"
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={alt}
              draggable={false}
              className={
                zoomed
                  ? "max-w-none select-none"
                  : "max-h-full max-w-full select-none object-contain"
              }
              style={zoomed ? { width: "250%", maxWidth: "none" } : undefined}
            />
          </div>

          {!zoomed && (
            <p className="pointer-events-none absolute inset-x-0 bottom-4 text-center text-xs text-white/60">
              Tap the image to zoom · Esc or ✕ to close
            </p>
          )}
        </div>
      )}
    </>
  );
}
