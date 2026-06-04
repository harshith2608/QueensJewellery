import { useState, useEffect, useRef } from 'react'
import { X, Phone, Shield, RefreshCw } from 'lucide-react'
import { RecaptchaVerifier } from 'firebase/auth'
import { auth } from '../../firebase/config.js'
import { useAuth } from '../../contexts/AuthContext.jsx'

const RESEND_TIMEOUT = 30

/**
 * OTP authentication modal using Firebase Phone Auth.
 * Props: isOpen, onClose, onSuccess
 */
export default function OTPModal({ isOpen, onClose, onSuccess }) {
  const { signInWithPhone, verifyOTP } = useAuth()

  const [step, setStep] = useState(1) // 1 = phone input, 2 = OTP input
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resendCountdown, setResendCountdown] = useState(0)

  const inputRefs = useRef([])
  const appVerifierRef = useRef(null)
  const countdownRef = useRef(null)

  // Setup invisible reCAPTCHA on open; teardown on close
  useEffect(() => {
    if (!isOpen) {
      // Reset state after close animation
      const timer = setTimeout(() => {
        setStep(1)
        setPhone('')
        setOtp(['', '', '', '', '', ''])
        setError('')
        setResendCountdown(0)
      }, 300)
      clearInterval(countdownRef.current)
      if (appVerifierRef.current) {
        try { appVerifierRef.current.clear() } catch (clearErr) { console.debug('recaptcha clear:', clearErr) }
        appVerifierRef.current = null
      }
      return () => clearTimeout(timer)
    }

    // Mount: create recaptcha
    if (!appVerifierRef.current) {
      try {
        appVerifierRef.current = new RecaptchaVerifier(auth, 'recaptcha-container-otp', {
          size: 'invisible',
          callback: () => {},
          'expired-callback': () => {
            appVerifierRef.current = null
          },
        })
      } catch (err) {
        console.error('RecaptchaVerifier setup error:', err)
      }
    }

    return () => { clearInterval(countdownRef.current) }
  }, [isOpen])

  // Lock body scroll
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  // Auto-focus first OTP box on step 2
  useEffect(() => {
    if (step === 2) {
      setTimeout(() => inputRefs.current[0]?.focus(), 100)
    }
  }, [step])

  const startCountdown = () => {
    setResendCountdown(RESEND_TIMEOUT)
    clearInterval(countdownRef.current)
    countdownRef.current = setInterval(() => {
      setResendCountdown((n) => {
        if (n <= 1) { clearInterval(countdownRef.current); return 0 }
        return n - 1
      })
    }, 1000)
  }

  const ensureVerifier = () => {
    if (!appVerifierRef.current) {
      appVerifierRef.current = new RecaptchaVerifier(auth, 'recaptcha-container-otp', {
        size: 'invisible',
        callback: () => {},
      })
    }
    return appVerifierRef.current
  }

  const handleSendOTP = async (e) => {
    e.preventDefault()
    setError('')
    const digits = phone.replace(/\D/g, '')
    if (digits.length !== 10) {
      setError('Please enter a valid 10-digit mobile number.')
      return
    }
    setLoading(true)
    try {
      await signInWithPhone(`+91${digits}`, ensureVerifier())
      setStep(2)
      startCountdown()
    } catch (err) {
      console.error('Send OTP error:', err)
      setError(getFriendlyError(err.code))
      if (appVerifierRef.current) {
        try { appVerifierRef.current.clear() } catch (clearErr) { console.debug('recaptcha clear:', clearErr) }
        appVerifierRef.current = null
      }
    } finally {
      setLoading(false)
    }
  }

  const handleOTPChange = (index, value) => {
    if (!/^\d*$/.test(value)) return
    const next = [...otp]
    next[index] = value.slice(-1)
    setOtp(next)
    if (value && index < 5) inputRefs.current[index + 1]?.focus()
  }

  const handleOTPKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleVerifyOTP = async (e) => {
    e.preventDefault()
    setError('')
    const code = otp.join('')
    if (code.length !== 6) {
      setError('Please enter the complete 6-digit OTP.')
      return
    }
    setLoading(true)
    try {
      await verifyOTP(code)
      onSuccess?.()
      onClose()
    } catch (err) {
      console.error('Verify OTP error:', err)
      setError(getFriendlyError(err.code))
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (resendCountdown > 0) return
    setError('')
    setOtp(['', '', '', '', '', ''])
    setLoading(true)
    try {
      await signInWithPhone(`+91${phone.replace(/\D/g, '')}`, ensureVerifier())
      startCountdown()
    } catch (err) {
      setError(getFriendlyError(err.code))
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-jewel-dark/60"
        onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-label={step === 1 ? 'Sign in with phone' : 'Verify OTP'}
          className="w-full max-w-sm bg-ivory rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-blush">
            <div className="flex items-center gap-2">
              {step === 1
                ? <Phone size={18} className="text-rose-gold" />
                : <Shield size={18} className="text-rose-gold" />
              }
              <h2 className="font-serif text-lg text-jewel-dark">
                {step === 1 ? 'Sign In' : 'Verify OTP'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-blush text-jewel-muted hover:text-jewel-dark transition-colors"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="px-5 py-6">
            {step === 1 ? (
              <form onSubmit={handleSendOTP} className="space-y-4">
                <p className="text-jewel-muted text-sm">
                  Enter your mobile number to receive a one-time password.
                </p>

                <div>
                  <label className="text-xs text-jewel-muted font-medium block mb-1">
                    Mobile Number
                  </label>
                  <div className="flex items-center border border-blush rounded-xl overflow-hidden focus-within:border-rose-gold transition-colors bg-white">
                    <span className="bg-blush text-jewel-muted text-sm px-3 py-3 border-r border-blush select-none font-medium">
                      +91
                    </span>
                    <input
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={10}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="9876543210"
                      autoFocus
                      autoComplete="tel"
                      className="flex-1 px-3 py-3 text-sm text-jewel-dark outline-none bg-transparent placeholder-jewel-muted"
                      aria-label="Mobile number"
                    />
                  </div>
                </div>

                {error && (
                  <p className="text-red-500 text-xs bg-red-50 px-3 py-2 rounded-lg">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading || phone.replace(/\D/g, '').length !== 10}
                  className="w-full bg-rose-gold text-ivory py-3 rounded-full text-sm font-medium hover:bg-jewel-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-ivory/30 border-t-ivory rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : 'Send OTP'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOTP} className="space-y-4">
                <p className="text-jewel-muted text-sm">
                  OTP sent to{' '}
                  <span className="text-jewel-dark font-medium">+91 {phone}</span>.{' '}
                  <button
                    type="button"
                    onClick={() => { setStep(1); setError('') }}
                    className="text-rose-gold underline text-sm"
                  >
                    Change
                  </button>
                </p>

                <div>
                  <label className="text-xs text-jewel-muted font-medium block mb-2">
                    Enter 6-digit OTP
                  </label>
                  <div className="flex justify-center gap-2">
                    {otp.map((digit, i) => (
                      <input
                        key={i}
                        ref={(el) => (inputRefs.current[i] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOTPChange(i, e.target.value)}
                        onKeyDown={(e) => handleOTPKeyDown(i, e)}
                        className="w-10 h-12 text-center border border-blush rounded-xl text-jewel-dark font-semibold text-lg focus:outline-none focus:border-rose-gold bg-white transition-colors"
                        aria-label={`OTP digit ${i + 1}`}
                        autoComplete="one-time-code"
                      />
                    ))}
                  </div>
                </div>

                {error && (
                  <p className="text-red-500 text-xs bg-red-50 px-3 py-2 rounded-lg">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading || otp.join('').length !== 6}
                  className="w-full bg-rose-gold text-ivory py-3 rounded-full text-sm font-medium hover:bg-jewel-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-ivory/30 border-t-ivory rounded-full animate-spin" />
                      Verifying...
                    </>
                  ) : 'Verify & Sign In'}
                </button>

                <div className="text-center">
                  {resendCountdown > 0 ? (
                    <p className="text-jewel-muted text-xs">
                      Resend OTP in{' '}
                      <span className="text-rose-gold font-medium">{resendCountdown}s</span>
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={loading}
                      className="inline-flex items-center gap-1.5 text-rose-gold text-xs hover:underline disabled:opacity-50"
                    >
                      <RefreshCw size={12} />
                      Resend OTP
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Invisible reCAPTCHA mount point */}
      <div id="recaptcha-container-otp" />
    </>
  )
}

function getFriendlyError(code) {
  const map = {
    'auth/invalid-phone-number': 'Invalid phone number. Please check and try again.',
    'auth/too-many-requests': 'Too many attempts. Please try again later.',
    'auth/invalid-verification-code': 'Incorrect OTP. Please try again.',
    'auth/code-expired': 'OTP has expired. Please request a new one.',
    'auth/quota-exceeded': 'SMS quota exceeded. Please try again later.',
    'auth/captcha-check-failed': 'reCAPTCHA check failed. Please refresh and try again.',
    'auth/network-request-failed': 'Network error. Please check your connection.',
  }
  return map[code] || 'Something went wrong. Please try again.'
}
