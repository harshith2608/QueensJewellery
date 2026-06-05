import { Link } from 'react-router-dom'
import { MessageCircle } from 'lucide-react'

const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER

const NAV_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'Shop', to: '/shop' },
  { label: 'About Us', to: '/about' },
  { label: 'Contact Us', to: '/contact' },
]

const POLICY_LINKS = [
  { label: 'Refund Policy', to: '/refund-policy' },
  { label: 'Shipping Policy', to: '/shipping-policy' },
  { label: 'Privacy Policy', to: '/privacy-policy' },
  { label: 'Terms & Conditions', to: '/terms' },
]

function InstagramIcon({ size = 20 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  )
}


export default function Footer() {
  const whatsappLink = `https://wa.me/${(WHATSAPP_NUMBER || '919999999999').replace(/\D/g, '')}`

  return (
    <footer className="bg-jewel-dark text-ivory pb-16 md:pb-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8 mb-10">
          {/* Brand column */}
          <div className="flex flex-col gap-3">
            <span className="font-serif text-2xl text-rose-gold tracking-wide">
              Queens Jewellery
            </span>
            <p className="text-blush/80 text-sm leading-relaxed">
              Elegance in every piece
            </p>
            <p className="text-jewel-muted text-xs leading-relaxed mt-1">
              Handcrafted jewellery that celebrates your story. Each piece made with
              love, care, and the finest materials.
            </p>
          </div>

          {/* Navigation links */}
          <div>
            <h3 className="text-blush font-medium text-sm uppercase tracking-widest mb-4">
              Quick Links
            </h3>
            <ul className="space-y-2.5">
              {NAV_LINKS.map(({ label, to }) => (
                <li key={to}>
                  <Link to={to} className="text-ivory/70 hover:text-rose-gold text-sm transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
            <h3 className="text-blush font-medium text-sm uppercase tracking-widest mt-5 mb-3">
              Policies
            </h3>
            <ul className="space-y-2.5">
              {POLICY_LINKS.map(({ label, to }) => (
                <li key={to}>
                  <Link to={to} className="text-ivory/70 hover:text-rose-gold text-sm transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Social & contact */}
          <div>
            <h3 className="text-blush font-medium text-sm uppercase tracking-widest mb-4">
              Connect With Us
            </h3>
            <div className="flex items-center gap-3 mb-5">
              <a
                href="https://www.instagram.com/queensjewellery2026/"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-full border border-ivory/20 text-ivory/70 hover:text-rose-gold hover:border-rose-gold transition-colors"
                aria-label="Instagram"
              >
                <InstagramIcon size={18} />
              </a>
<a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-full border border-ivory/20 text-ivory/70 hover:text-rose-gold hover:border-rose-gold transition-colors"
                aria-label="WhatsApp"
              >
                <MessageCircle size={18} />
              </a>
            </div>
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-blush/80 hover:text-rose-gold transition-colors"
            >
              <MessageCircle size={16} />
              Chat with us on WhatsApp
            </a>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-ivory/10 pt-6">
          <p className="text-center text-ivory/40 text-xs">
            &copy; 2025 Queens Jewellery. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
