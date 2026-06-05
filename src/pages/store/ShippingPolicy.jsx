import PolicyLayout, { Section, Highlight } from '../../components/store/PolicyLayout.jsx'

export default function ShippingPolicy() {
  return (
    <PolicyLayout title="Shipping Policy" lastUpdated="June 2026">

      <Highlight>
        🚚 We ship across India. Standard delivery takes <strong>7–8 business days</strong> from
        the date of order confirmation.
      </Highlight>

      <Section title="Shipping Charges">
        <ul className="list-disc pl-5 space-y-1">
          <li>Orders above ₹2,000 — <strong>Free Shipping</strong></li>
          <li>Orders below ₹2,000 — Flat ₹150 shipping charge</li>
        </ul>
      </Section>

      <Section title="Delivery Timeline">
        <ul className="list-disc pl-5 space-y-1">
          <li>Order processing: 1–2 business days</li>
          <li>Delivery: 5–6 business days after dispatch</li>
          <li>Total estimated time: <strong>7–8 business days</strong></li>
          <li>Remote/rural areas may take an additional 2–3 days</li>
        </ul>
        <p className="mt-2">
          Business days exclude Sundays and public holidays.
        </p>
      </Section>

      <Section title="Order Tracking">
        <p>
          Once your order is dispatched, you will receive the tracking details via WhatsApp on
          your registered mobile number. You can also track your order under{' '}
          <strong>My Orders</strong> on our website.
        </p>
      </Section>

      <Section title="Shipping Coverage">
        <p>
          We currently ship to all major cities and towns across India. We do not ship
          internationally at this time.
        </p>
      </Section>

      <Section title="Packaging">
        <p>
          All orders are carefully packed to ensure they reach you in perfect condition. We use
          secure packaging to protect jewellery during transit.
        </p>
      </Section>

      <Section title="Delays">
        <p>
          Delivery timelines are estimates and may be affected by:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Public holidays or festive season volumes</li>
          <li>Extreme weather conditions</li>
          <li>Remote delivery locations</li>
          <li>Incorrect or incomplete delivery address</li>
        </ul>
        <p className="mt-2">
          If your order is significantly delayed, please contact us and we'll investigate
          immediately.
        </p>
      </Section>

      <Section title="Failed Delivery">
        <p>
          If delivery fails due to an incorrect address or the package is unclaimed, it will be
          returned to us. Please ensure your delivery address and phone number are correct at the
          time of ordering. Re-delivery charges may apply.
        </p>
      </Section>

      <Section title="Contact Us">
        <p>For shipping queries:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>WhatsApp: <a href="https://wa.me/916302903510" className="text-rose-gold underline" target="_blank" rel="noopener noreferrer">+91 6302903510</a></li>
          <li>Email: <a href="mailto:polarani1978@gmail.com" className="text-rose-gold underline">polarani1978@gmail.com</a></li>
        </ul>
      </Section>
    </PolicyLayout>
  )
}
