import { useEffect, useState } from 'react'
import logo from '../../assets/logo.png'

const LAUNCH_DATE = new Date('2026-06-16T00:00:00+05:30')

function getTimeLeft() {
  const diff = LAUNCH_DATE - new Date()
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 }
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  }
}

function Pad({ value, label }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-2xl shadow-sm border border-blush flex items-center justify-center">
        <span className="font-serif text-2xl sm:text-3xl text-rose-gold font-semibold">
          {String(value).padStart(2, '0')}
        </span>
      </div>
      <span className="text-[10px] sm:text-xs text-jewel-muted uppercase tracking-widest font-medium">
        {label}
      </span>
    </div>
  )
}

export default function ComingSoon() {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft())

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(getTimeLeft()), 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="min-h-screen bg-ivory flex flex-col items-center justify-center px-6 py-16">
      {/* Logo + Brand */}
      <div className="flex flex-col items-center gap-3 mb-10">
        <img src={logo} alt="Queens Jewellery" className="h-24 w-auto" />
        <h1 className="font-serif text-3xl sm:text-4xl text-rose-gold tracking-wide">
          Queens Jewellery
        </h1>
      </div>

      {/* Coming Soon text */}
      <div className="text-center mb-10 space-y-3">
        <h2 className="font-serif text-4xl sm:text-5xl text-jewel-dark leading-tight">
          Coming Soon
        </h2>
        <p className="text-jewel-muted text-sm sm:text-base max-w-sm mx-auto leading-relaxed">
          We're putting the finishing touches on something beautiful.
          Our store launches on <span className="text-rose-gold font-semibold">June 16, 2026</span>.
        </p>
      </div>

      {/* Countdown */}
      <div className="flex items-start gap-3 sm:gap-5 mb-12">
        <Pad value={timeLeft.days} label="Days" />
        <span className="text-rose-gold text-3xl font-serif mt-3">:</span>
        <Pad value={timeLeft.hours} label="Hours" />
        <span className="text-rose-gold text-3xl font-serif mt-3">:</span>
        <Pad value={timeLeft.minutes} label="Minutes" />
        <span className="text-rose-gold text-3xl font-serif mt-3">:</span>
        <Pad value={timeLeft.seconds} label="Seconds" />
      </div>

      {/* Divider */}
      <div className="w-16 h-px bg-rose-gold/30 mb-8" />

      <p className="text-xs text-jewel-muted tracking-widest uppercase">
        Traditional &amp; Bridal Jewellery
      </p>
    </div>
  )
}
