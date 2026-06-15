import { useEffect, useState } from 'react'
import { RotateCcw } from 'lucide-react'

const DEVICES = [
  { label: 'iPhone SE', width: 375, height: 667 },
  { label: 'iPhone 14', width: 390, height: 844 },
  { label: 'iPhone 14 Plus', width: 430, height: 932 },
]

export default function Preview() {
  const [device, setDevice] = useState(DEVICES[1])
  const [iframeKey, setIframeKey] = useState(0)

  // Set the admin preview flag so ComingSoonGuard lets the store through
  useEffect(() => {
    localStorage.setItem('adminPreview', 'true')
    return () => localStorage.removeItem('adminPreview')
  }, [])

  return (
    <div className="flex flex-col items-center gap-5 py-2">
      <div className="flex items-center gap-2 flex-wrap justify-center">
        {DEVICES.map((d) => (
          <button
            key={d.label}
            onClick={() => { setDevice(d); setIframeKey((k) => k + 1) }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              device.label === d.label
                ? 'border-rose-gold bg-rose-gold text-white'
                : 'border-blush text-jewel-muted hover:border-rose-gold hover:text-rose-gold'
            }`}
          >
            {d.label} <span className="opacity-60">{d.width}px</span>
          </button>
        ))}
        <button
          onClick={() => setIframeKey((k) => k + 1)}
          title="Refresh"
          className="p-2 rounded-full border border-blush text-jewel-muted hover:border-rose-gold hover:text-rose-gold transition-colors"
        >
          <RotateCcw size={13} />
        </button>
      </div>

      {/* Phone frame */}
      <div
        className="relative bg-gray-900 rounded-[3rem] shadow-2xl"
        style={{ width: device.width + 28, padding: '18px 14px', border: '6px solid #1f2937' }}
      >
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-7 bg-gray-900 rounded-b-2xl z-10" />

        {/* Screen */}
        <div
          className="overflow-hidden rounded-[2.2rem] bg-white"
          style={{ width: device.width, height: device.height }}
        >
          <iframe
            key={iframeKey}
            src="/"
            style={{ width: device.width, height: device.height, border: 'none', display: 'block' }}
            title="Store Preview"
          />
        </div>

        {/* Home indicator */}
        <div className="flex justify-center mt-3">
          <div className="w-24 h-1 bg-gray-600 rounded-full" />
        </div>
      </div>

      <p className="text-xs text-jewel-muted">
        Coming Soon is bypassed in this preview. Refresh if changes don't appear.
      </p>
    </div>
  )
}
