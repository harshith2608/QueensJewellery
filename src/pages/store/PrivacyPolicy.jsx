import PolicyLayout, { Section } from '../../components/store/PolicyLayout.jsx'

export default function PrivacyPolicy() {
  return (
    <PolicyLayout title="Privacy Policy" lastUpdated="June 2026">
      <p className="text-sm text-jewel-muted leading-relaxed">
        Queens Jewellery ("we", "us", "our") is committed to protecting your privacy. This policy
        explains what information we collect, how we use it, and how we keep it safe.
      </p>

      <Section title="Information We Collect">
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Phone number</strong> — for OTP login and order updates</li>
          <li><strong>Name and delivery address</strong> — to process and deliver your orders</li>
          <li><strong>Payment information</strong> — processed securely by Razorpay; we do not store card details</li>
          <li><strong>Order history</strong> — to provide order tracking and support</li>
          <li><strong>Device and browser info</strong> — for analytics and improving our website</li>
        </ul>
      </Section>

      <Section title="How We Use Your Information">
        <ul className="list-disc pl-5 space-y-1">
          <li>To process and deliver your orders</li>
          <li>To send order confirmations and shipping updates via WhatsApp</li>
          <li>To respond to customer queries and support requests</li>
          <li>To improve our website, products, and services</li>
          <li>To send promotional offers (only if you have opted in)</li>
        </ul>
      </Section>

      <Section title="Information Sharing">
        <p>
          We do not sell, rent, or trade your personal information to third parties. We may share
          your information with:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Razorpay</strong> — for payment processing</li>
          <li><strong>Shipping partners</strong> — to deliver your orders</li>
          <li><strong>Firebase (Google)</strong> — for secure data storage and authentication</li>
        </ul>
        <p className="mt-2">
          These third parties are bound by their own privacy policies and are not permitted to use
          your data for any other purpose.
        </p>
      </Section>

      <Section title="Data Security">
        <p>
          Your data is stored securely on Firebase (Google Cloud), protected by industry-standard
          encryption. Payments are handled entirely by Razorpay — we never see or store your card
          or UPI details.
        </p>
      </Section>

      <Section title="Your Rights">
        <p>You have the right to:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Request access to your personal data</li>
          <li>Request correction or deletion of your data</li>
          <li>Opt out of promotional communications</li>
        </ul>
        <p className="mt-2">
          To exercise any of these rights, contact us at{' '}
          <a href="mailto:polarani1978@gmail.com" className="text-rose-gold underline">
            polarani1978@gmail.com
          </a>
        </p>
      </Section>

      <Section title="Cookies">
        <p>
          Our website uses minimal cookies and local storage to maintain your shopping cart and
          login session. We do not use tracking cookies for advertising purposes.
        </p>
      </Section>

      <Section title="Changes to This Policy">
        <p>
          We may update this policy from time to time. Changes will be posted on this page with
          an updated date. Continued use of our website after changes constitutes acceptance of
          the updated policy.
        </p>
      </Section>

      <Section title="Contact">
        <p>For privacy-related queries:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Email: <a href="mailto:polarani1978@gmail.com" className="text-rose-gold underline">polarani1978@gmail.com</a></li>
          <li>Address: 30-45/468, Street-4, Indus Valley, Peerancheruvu, Bandlaguda Jagir, Hyderabad, Telangana – 500091</li>
        </ul>
      </Section>
    </PolicyLayout>
  )
}
