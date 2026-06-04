import { useState } from 'react'
import { ChevronLeft, ChevronRight, ZoomIn, Play } from 'lucide-react'

const PLACEHOLDER = '/placeholder-jewellery.jpg'

/**
 * Product media gallery with thumbnails.
 * Props: media = [{ url, type: 'image'|'video' }]
 */
export default function MediaViewer({ media = [] }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [zoomed, setZoomed] = useState(false)

  // Normalize: treat missing type as image
  const items = media.length > 0
    ? media.map((m) => ({ ...m, type: m.type || 'image' }))
    : [{ url: PLACEHOLDER, type: 'image' }]

  const active = items[activeIndex]
  const total = items.length

  const prev = () => setActiveIndex((i) => (i - 1 + total) % total)
  const next = () => setActiveIndex((i) => (i + 1) % total)

  return (
    <div className="space-y-3">
      {/* Main media display */}
      <div className="relative aspect-square rounded-2xl overflow-hidden bg-blush">
        {active.type === 'video' ? (
          <video
            key={active.url}
            controls
            className="w-full h-full object-cover"
            playsInline
            preload="metadata"
          >
            {/* Explicit type helps browser decide quickly if it can play */}
            <source
              src={active.url}
              type={
                active.url?.toLowerCase().includes('.mov')
                  ? 'video/quicktime'
                  : active.url?.toLowerCase().includes('.webm')
                  ? 'video/webm'
                  : 'video/mp4'
              }
            />
            {/* Fallback message for unsupported formats (e.g. .mov on Chrome) */}
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-blush/60 p-4 text-center">
              <p className="text-jewel-dark text-sm font-medium">Video can't be played in this browser.</p>
              <a href={active.url} target="_blank" rel="noopener noreferrer"
                className="mt-2 text-xs text-rose-gold underline">
                Open video directly
              </a>
            </div>
          </video>
        ) : (
          <>
            <img
              key={active.url}
              src={active.url || PLACEHOLDER}
              alt="Product"
              className={`w-full h-full object-cover transition-transform duration-300 ${
                zoomed ? 'scale-150 cursor-zoom-out' : 'cursor-zoom-in'
              }`}
              onClick={() => setZoomed((z) => !z)}
              onError={(e) => { e.currentTarget.src = PLACEHOLDER }}
            />
            {/* Zoom hint */}
            {!zoomed && (
              <button
                onClick={() => setZoomed(true)}
                className="absolute bottom-3 right-3 bg-ivory/80 backdrop-blur-sm rounded-full p-2 text-jewel-muted hover:text-jewel-dark transition-colors"
                aria-label="Zoom in"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            )}
          </>
        )}

        {/* Prev / Next arrows */}
        {total > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-ivory/80 backdrop-blur-sm rounded-full p-2 text-jewel-dark hover:bg-ivory transition-colors shadow"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={next}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-ivory/80 backdrop-blur-sm rounded-full p-2 text-jewel-dark hover:bg-ivory transition-colors shadow"
              aria-label="Next image"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Slide counter */}
        {total > 1 && (
          <div className="absolute top-3 left-3 bg-jewel-dark/60 text-ivory text-xs rounded-full px-2.5 py-1">
            {activeIndex + 1} / {total}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {total > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {items.map((item, i) => (
            <button
              key={i}
              onClick={() => { setActiveIndex(i); setZoomed(false) }}
              className={`relative flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-colors ${
                i === activeIndex ? 'border-rose-gold' : 'border-transparent hover:border-blush'
              }`}
              aria-label={`View media ${i + 1}`}
            >
              {item.type === 'video' ? (
                <div className="w-full h-full bg-blush flex items-center justify-center">
                  <Play className="w-5 h-5 text-rose-gold fill-rose-gold" />
                </div>
              ) : (
                <img
                  src={item.url || PLACEHOLDER}
                  alt={`Thumbnail ${i + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.currentTarget.src = PLACEHOLDER }}
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
