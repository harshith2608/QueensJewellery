import { useState, useEffect } from 'react'
import { getSettings } from '../../firebase/firestore.js'

// Module-level cache so all instances share one Firestore fetch per session
let cachedText = undefined

export default function AnnouncementBar() {
  const [text, setText] = useState(cachedText ?? '')

  useEffect(() => {
    if (cachedText !== undefined) return
    getSettings()
      .then((s) => {
        cachedText = s.announcement || ''
        setText(cachedText)
      })
      .catch(() => {})
  }, [])

  if (!text) return null

  return (
    <div className="bg-rose-gold text-white text-xs sm:text-sm py-2 overflow-hidden font-medium tracking-wide">
      <div className="whitespace-nowrap animate-marquee inline-block px-8">
        {text}
        <span className="mx-12">✦</span>
        {text}
        <span className="mx-12">✦</span>
        {text}
      </div>
    </div>
  )
}
