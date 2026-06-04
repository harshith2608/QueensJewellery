import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { getSettings } from '../../firebase/firestore.js'

// Module-level cache so all instances share one Firestore fetch per session
let cachedText = undefined

export default function AnnouncementBar() {
  const [text, setText] = useState(cachedText ?? '')
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (cachedText !== undefined) return   // already fetched
    getSettings()
      .then((s) => {
        cachedText = s.announcement || ''
        setText(cachedText)
      })
      .catch(() => {})
  }, [])

  if (!text || dismissed) return null

  return (
    <div className="relative bg-rose-gold text-ivory text-xs sm:text-sm text-center px-8 py-2 font-medium tracking-wide">
      {text}
      <button
        onClick={() => setDismissed(true)}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-white/20 transition-colors"
        aria-label="Dismiss announcement"
      >
        <X size={14} />
      </button>
    </div>
  )
}
