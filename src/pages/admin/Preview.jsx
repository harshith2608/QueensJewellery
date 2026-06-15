import { useEffect, useState } from 'react'
import { RotateCcw } from 'lucide-react'

const DEVICE_GROUPS = [
  {
    os: 'iOS',
    devices: [
      { label: 'iPhone SE', width: 375, height: 667 },
      { label: 'iPhone 14', width: 390, height: 844 },
      { label: 'iPhone 14 Plus', width: 430, height: 932 },
    ],
  },
  {
    os: 'Android',
    devices: [
      { label: 'Galaxy S23', width: 360, height: 780 },
      { label: 'Galaxy S23 Ultra', width: 384, height: 824 },
      { label: 'Pixel 7', width: 412, height: 915 },
    ],
  },
]

const ALL_DEVICES = DEVICE_GROUPS.flatMap((g) => g.devices)

export default function Preview() {
  const [device, setDevice] = useState(ALL_DEVICES[1])
  const [iframeKey, setIframeKey] = useState(0)

  useEffect(() => {
    localStorage.setItem('adminPreview', 'true')
    return () => localStorage.removeItem('adminPreview')
  }, [])

  return (
    <div className="flex flex-col items-center gap-5 py-2">
      {/* Device selector */}
      <div className="flex flex-col items-center gap-3">
        {DEVICE_GROUPS.map((group) => (
          <div key={group.os} className="flex items-center gap-2 flex-wrap justify-center">
            <span className="text-xs font-semibold text-jewel-muted w-14 text-right">{group.os}</span>
            {group.devices.map((d) => (
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
          </div>
        ))}
        <button
          onClick={() => setIframeKey((k) => k + 1)}
          title="Refresh"
          className="p-2 rounded-full border border-blush text-jewel-muted hover:border-rose-gold hover:text-rose-gold transition-colors"
        >
          <RotateCcw size={13} />
        </button>
      </div>

      {/* Phone frame — actual size, page scrolls to show full phone */}
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
