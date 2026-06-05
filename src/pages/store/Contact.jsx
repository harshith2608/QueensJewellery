import { Mail, Phone, MapPin, MessageCircle } from 'lucide-react'
import PolicyLayout from '../../components/store/PolicyLayout.jsx'

function InstagramIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  )
}

const WHATSAPP = '916302903510'

export default function Contact() {
  return (
    <PolicyLayout title="Contact Us">
      <p className="text-sm text-jewel-muted leading-relaxed">
        We're here to help! Reach out to us through any of the channels below and we'll get back
        to you as soon as possible.
      </p>

      <div className="grid sm:grid-cols-2 gap-4 mt-6">
        {/* WhatsApp */}
        <a
          href={`https://wa.me/${WHATSAPP}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-start gap-4 bg-white border border-blush/50 rounded-2xl p-4 hover:border-rose-gold transition-colors shadow-sm"
        >
          <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
            <MessageCircle size={20} className="text-green-600" />
          </div>
          <div>
            <p className="font-medium text-jewel-dark text-sm">WhatsApp</p>
            <p className="text-jewel-muted text-xs mt-0.5">+91 6302903510</p>
            <p className="text-xs text-green-600 mt-1">Fastest response</p>
          </div>
        </a>

        {/* Email */}
        <a
          href="mailto:polarani1978@gmail.com"
          className="flex items-start gap-4 bg-white border border-blush/50 rounded-2xl p-4 hover:border-rose-gold transition-colors shadow-sm"
        >
          <div className="w-10 h-10 rounded-full bg-blush flex items-center justify-center flex-shrink-0">
            <Mail size={20} className="text-rose-gold" />
          </div>
          <div>
            <p className="font-medium text-jewel-dark text-sm">Email</p>
            <p className="text-jewel-muted text-xs mt-0.5">polarani1978@gmail.com</p>
            <p className="text-xs text-jewel-muted mt-1">We reply within 24 hours</p>
          </div>
        </a>

        {/* Phone */}
        <a
          href="tel:+916302903510"
          className="flex items-start gap-4 bg-white border border-blush/50 rounded-2xl p-4 hover:border-rose-gold transition-colors shadow-sm"
        >
          <div className="w-10 h-10 rounded-full bg-blush flex items-center justify-center flex-shrink-0">
            <Phone size={20} className="text-rose-gold" />
          </div>
          <div>
            <p className="font-medium text-jewel-dark text-sm">Phone</p>
            <p className="text-jewel-muted text-xs mt-0.5">+91 6302903510</p>
            <p className="text-xs text-jewel-muted mt-1">Mon–Sat, 10 AM – 7 PM</p>
          </div>
        </a>

        {/* Instagram */}
        <a
          href="https://www.instagram.com/queensjewellery2026/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-start gap-4 bg-white border border-blush/50 rounded-2xl p-4 hover:border-rose-gold transition-colors shadow-sm"
        >
          <div className="w-10 h-10 rounded-full bg-blush flex items-center justify-center flex-shrink-0">
            <InstagramIcon size={20} />
          </div>
          <div>
            <p className="font-medium text-jewel-dark text-sm">Instagram</p>
            <p className="text-jewel-muted text-xs mt-0.5">@queensjewellery2026</p>
            <p className="text-xs text-jewel-muted mt-1">DMs welcome</p>
          </div>
        </a>
      </div>

      {/* Address */}
      <div className="mt-6 flex items-start gap-4 bg-white border border-blush/50 rounded-2xl p-4 shadow-sm">
        <div className="w-10 h-10 rounded-full bg-blush flex items-center justify-center flex-shrink-0">
          <MapPin size={20} className="text-rose-gold" />
        </div>
        <div>
          <p className="font-medium text-jewel-dark text-sm">Our Address</p>
          <p className="text-jewel-muted text-xs mt-0.5 leading-relaxed">
            30-45/468, Street-4, Indus Valley,<br />
            Peerancheruvu, Bandlaguda Jagir,<br />
            Hyderabad, Telangana – 500091<br />
            India
          </p>
        </div>
      </div>

      <p className="text-xs text-jewel-muted mt-6">
        For order-related queries, please have your Order ID ready. You can find it in your
        confirmation email or under <strong>My Orders</strong> in the app.
      </p>
    </PolicyLayout>
  )
}
