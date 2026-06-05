import PolicyLayout, { Section } from '../../components/store/PolicyLayout.jsx'

export default function Terms() {
  return (
    <PolicyLayout title="Terms & Conditions" lastUpdated="June 2026">
      <p className="text-sm text-jewel-muted leading-relaxed">
        By using the Queens Jewellery website and placing an order, you agree to the following
        terms and conditions. Please read them carefully.
      </p>

      <Section title="1. General">
        <p>
          Queens Jewellery operates this website to sell imitation jewellery online. These terms
          apply to all visitors, users, and customers. We reserve the right to update these terms
          at any time without prior notice.
        </p>
      </Section>

      <Section title="2. Products">
        <ul className="list-disc pl-5 space-y-1">
          <li>All products sold are imitation/fashion jewellery — not gold, silver, or precious stone jewellery</li>
          <li>Product images are for reference; slight colour variations may exist due to screen settings</li>
          <li>We reserve the right to discontinue any product without notice</li>
          <li>Prices are in Indian Rupees (₹) and inclusive of all applicable taxes</li>
        </ul>
      </Section>

      <Section title="3. Orders & Payments">
        <ul className="list-disc pl-5 space-y-1">
          <li>Placing an order constitutes an offer to purchase. We reserve the right to cancel any order</li>
          <li>Payments are processed securely through Razorpay</li>
          <li>Orders are confirmed only after successful payment</li>
          <li>WhatsApp orders are subject to manual confirmation from our team</li>
          <li>We are not responsible for failed transactions due to bank or network issues</li>
        </ul>
      </Section>

      <Section title="4. Shipping">
        <p>
          Please refer to our{' '}
          <a href="/shipping-policy" className="text-rose-gold underline">Shipping Policy</a>{' '}
          for complete details on delivery timelines and charges.
        </p>
      </Section>

      <Section title="5. Returns & Refunds">
        <p>
          Refunds are accepted <strong>only for damaged items</strong> and require an unboxing
          video as proof. Please refer to our{' '}
          <a href="/refund-policy" className="text-rose-gold underline">Refund Policy</a>{' '}
          for full details.
        </p>
      </Section>

      <Section title="6. Intellectual Property">
        <p>
          All content on this website — including images, text, logos, and designs — is the
          property of Queens Jewellery. You may not reproduce, copy, or use any content without
          our prior written consent.
        </p>
      </Section>

      <Section title="7. Limitation of Liability">
        <p>
          Queens Jewellery shall not be liable for any indirect, incidental, or consequential
          damages arising from the use of our website or products. Our liability is limited to
          the value of the order in question.
        </p>
      </Section>

      <Section title="8. Governing Law">
        <p>
          These terms are governed by the laws of India. Any disputes shall be subject to the
          exclusive jurisdiction of the courts in Hyderabad, Telangana.
        </p>
      </Section>

      <Section title="9. Contact">
        <p>For any queries regarding these terms:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Email: <a href="mailto:polarani1978@gmail.com" className="text-rose-gold underline">polarani1978@gmail.com</a></li>
          <li>WhatsApp: <a href="https://wa.me/916302903510" className="text-rose-gold underline" target="_blank" rel="noopener noreferrer">+91 6302903510</a></li>
        </ul>
      </Section>
    </PolicyLayout>
  )
}
