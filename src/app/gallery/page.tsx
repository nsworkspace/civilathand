"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import type React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  Share2,
  Download,
  Check,
} from "lucide-react";

// Small inline icons not present in this project's lucide-react build —
// same pattern as the DownloadIcon on the home page.
const ImagesIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18.75 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0z" />
  </svg>
);

const LayoutGridIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}>
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);

// ============================================================
// HOW TO ADD MORE IMAGES (Zero coding needed):
// 1. Put image files inside: public/gallery/
// 2. Copy the format below and change the details
// 3. The "category" can be anything: Construction, Design, Team, Events...
// ============================================================

interface GalleryImage {
  id: number;
  src: string;
  title: string;
  category: string;
  description?: string;
}

const galleryImages: GalleryImage[] = [
  {
    id: 1,
    src: "/gallery/construction1.jpg",
    title: "Bridge Construction",
    category: "Construction",
    description: "Highway overpass project in progress",
  },
  {
    id: 2,
    src: "/gallery/construction2.jpg",
    title: "Building Site",
    category: "Construction",
    description: "Commercial complex development",
  },
  // ADD MORE IMAGES HERE — JUST COPY THE FORMAT ABOVE
];

// Auto-generates filter buttons (with live counts) from your categories
const categories = ["All", ...Array.from(new Set(galleryImages.map((img) => img.category)))];

export default function GalleryPage() {
  const [filter, setFilter] = useState("All");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const filteredImages = useMemo(
    () => (filter === "All" ? galleryImages : galleryImages.filter((img) => img.category === filter)),
    [filter]
  );

  const counts = useMemo(() => {
    const map: Record<string, number> = { All: galleryImages.length };
    for (const cat of categories.slice(1)) {
      map[cat] = galleryImages.filter((img) => img.category === cat).length;
    }
    return map;
  }, []);

  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);

  const goPrev = useCallback(() => {
    if (lightboxIndex === null) return;
    setLightboxIndex(lightboxIndex === 0 ? filteredImages.length - 1 : lightboxIndex - 1);
  }, [lightboxIndex, filteredImages.length]);

  const goNext = useCallback(() => {
    if (lightboxIndex === null) return;
    setLightboxIndex(lightboxIndex === filteredImages.length - 1 ? 0 : lightboxIndex + 1);
  }, [lightboxIndex, filteredImages.length]);

  // Keyboard support: ESC to close, Arrow keys to navigate
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxIndex === null) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxIndex, goPrev, goNext]);

  // Lock page scroll while lightbox is open
  useEffect(() => {
    document.body.style.overflow = lightboxIndex !== null ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [lightboxIndex]);

  const activeImage = lightboxIndex !== null ? filteredImages[lightboxIndex] : null;

  const handleShare = useCallback(async (img: GalleryImage) => {
    const url = `${window.location.origin}${window.location.pathname}#${img.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: img.title, text: img.description, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // user cancelled share sheet — ignore
    }
  }, []);

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-orange-700 py-24 px-4">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />
        <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-orange-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl" />

        <div className="relative max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest text-orange-300 backdrop-blur-sm"
          >
            <ImagesIcon className="h-3.5 w-3.5" />
            {galleryImages.length} Photos · {categories.length - 1} Categories
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-6xl font-extrabold text-white mb-4 font-display tracking-tight"
          >
            Our Work Gallery
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg text-slate-300 max-w-2xl mx-auto"
          >
            A closer look at our civil engineering projects, design work, site visits and milestones —
            captured across construction, design and field operations.
          </motion.p>
        </div>
      </section>

      {/* Filter Buttons */}
      <section className="py-6 px-4 bg-white/90 backdrop-blur-md border-b sticky top-0 z-30 shadow-sm">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-center gap-2.5">
          <LayoutGridIcon className="hidden sm:block h-4 w-4 text-gray-400 mr-1" />
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`inline-flex items-center gap-1.5 px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 cursor-pointer ${
                filter === cat
                  ? "bg-orange-600 text-white shadow-lg shadow-orange-600/25 scale-105"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {cat}
              <span
                className={`text-[10px] font-bold rounded-full px-1.5 py-0.5 ${
                  filter === cat ? "bg-white/20 text-white" : "bg-white text-gray-500"
                }`}
              >
                {counts[cat]}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Gallery Grid */}
      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredImages.map((image, index) => (
                <motion.div
                  key={image.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.35 }}
                  className="group relative aspect-[4/3] overflow-hidden rounded-2xl bg-gray-200 cursor-pointer shadow-md ring-1 ring-black/5 hover:shadow-2xl hover:ring-orange-500/30 transition-all"
                  onClick={() => openLightbox(index)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image.src}
                    alt={image.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                  />
                  {/* Category chip */}
                  <div className="absolute top-3 left-3 rounded-full bg-black/50 backdrop-blur-sm px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white/90">
                    {image.category}
                  </div>
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-5">
                    <p className="text-white font-semibold text-lg leading-tight">{image.title}</p>
                    {image.description && (
                      <p className="text-gray-300 text-xs mt-1 line-clamp-2">{image.description}</p>
                    )}
                  </div>
                  {/* Zoom Icon */}
                  <div className="absolute top-3 right-3 bg-white/20 backdrop-blur-sm p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <ZoomIn className="w-4 h-4 text-white" />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          {filteredImages.length === 0 && (
            <div className="text-center py-20 text-gray-500">
              <ImagesIcon className="mx-auto h-10 w-10 text-gray-300 mb-3" />
              <p className="text-xl">No images in this category yet.</p>
              <p className="text-sm mt-2">Add some images above in the code!</p>
            </div>
          )}
        </div>
      </section>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {activeImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center"
            onClick={closeLightbox}
          >
            {/* Top-right action cluster */}
            <div className="absolute top-5 right-5 z-50 flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleShare(activeImage);
                }}
                title="Share this photo"
                className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Share2 className="w-5 h-5" />}
              </button>
              <a
                href={activeImage.src}
                download
                onClick={(e) => e.stopPropagation()}
                title="Download photo"
                className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors cursor-pointer"
              >
                <Download className="w-5 h-5" />
              </a>
              <button
                onClick={closeLightbox}
                title="Close"
                className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Prev Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                goPrev();
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-50 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors hidden sm:block cursor-pointer"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            {/* Next Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                goNext();
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-50 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors hidden sm:block cursor-pointer"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* Image + Info */}
            <div
              className="relative max-w-5xl max-h-[90vh] mx-4 flex flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.img
                key={activeImage.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                src={activeImage.src}
                alt={activeImage.title}
                className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-2xl"
              />
              <div className="mt-4 text-center">
                <span className="inline-block mb-2 rounded-full bg-orange-500/15 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-orange-400">
                  {activeImage.category}
                </span>
                <p className="text-white text-xl font-semibold">{activeImage.title}</p>
                {activeImage.description && (
                  <p className="text-gray-400 mt-1 max-w-lg mx-auto">{activeImage.description}</p>
                )}
                <p className="text-gray-500 text-sm mt-2">
                  {(lightboxIndex ?? 0) + 1} / {filteredImages.length}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
