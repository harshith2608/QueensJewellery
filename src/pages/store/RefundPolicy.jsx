import PolicyLayout, { Section, Highlight } from '../../components/store/PolicyLayout.jsx'

export default function RefundPolicy() {
  return (
    <PolicyLayout title="Refund & Return Policy" lastUpdated="June 2026">

      <Highlight>
        📦 <strong>We accept refund requests only for items that arrive damaged.</strong> A clear,
        uninterrupted unboxing video is mandatory to process any refund claim. Please record the
        video before opening the package.
      </Highlight>

      <Section title="Eligibility for Refund">
        <p>A refund will be considered <strong>only</strong> if:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>The item received is physically damaged or broken</li>
          <li>You submit a clear, uninterrupted <strong>unboxing video</strong> as proof</li>
          <li>The refund request is raised within <strong>48 hours</strong> of delivery</li>
        </ul>
      </Section>

      <Section title="What is NOT Eligible for Refund">
        <ul className="list-disc pl-5 space-y-1">
          <li>Change of mind or incorrect size/colour selected at the time of ordering</li>
          <li>Minor colour variations due to screen display differences</li>
          <li>Damage caused after delivery</li>
          <li>Items without an unboxing video</li>
          <li>Requests raised after 48 hours of delivery</li>
        </ul>
      </Section>

      <Section title="How to Raise a Refund Request">
        <ol className="list-decimal pl-5 space-y-2">
          <li>
            <strong>Record an unboxing video</strong> — start recording before you open the
            package. The video must clearly show the sealed package, the unboxing process, and
            the damaged item.
          </li>
          <li>
            <strong>Contact us within 48 hours of delivery</strong> via WhatsApp at{' '}
            <a href="https://wa.me/916302903510" className="text-rose-gold underline" target="_blank" rel="noopener noreferrer">
              +91 6302903510
            </a>{' '}
            or email us at{' '}
            <a href="mailto:polarani1978@gmail.com" className="text-rose-gold underline">
              polarani1978@gmail.com
            </a>
          </li>
          <li>
            Share your <strong>Order ID</strong>, the unboxing video, and a brief description of
            the damage.
          </li>
          <li>
            Our team will review your request within <strong>2–3 business days</strong>.
          </li>
          <li>
            If approved, the refund will be processed to your original payment method within
            <strong> 7–8 business days</strong>.
          </li>
        </ol>
      </Section>

      <Section title="Refund Method">
        <ul className="list-disc pl-5 space-y-1">
          <li>Online payments (Razorpay): Refunded to your original payment method</li>
          <li>WhatsApp / COD orders: Refunded via UPI or bank transfer</li>
        </ul>
      </Section>

      <Section title="Exchange Policy">
        <p>
          We currently do not offer direct exchanges. If your refund is approved, you are welcome
          to place a new order for the item of your choice.
        </p>
      </Section>

      <Section title="Contact Us">
        <p>
          For any refund-related queries, reach us at:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>WhatsApp: <a href="https://wa.me/916302903510" className="text-rose-gold underline" target="_blank" rel="noopener noreferrer">+91 6302903510</a></li>
          <li>Email: <a href="mailto:polarani1978@gmail.com" className="text-rose-gold underline">polarani1978@gmail.com</a></li>
        </ul>
      </Section>
    </PolicyLayout>
  )
}
