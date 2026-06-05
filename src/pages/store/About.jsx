import PolicyLayout, { Section } from '../../components/store/PolicyLayout.jsx'

export default function About() {
  return (
    <PolicyLayout title="About Us">
      <Section title="Who We Are">
        <p>
          Queens Jewellery is a Hyderabad-based imitation jewellery brand passionate about bringing
          elegant, affordable, and handcrafted jewellery to every woman. From classic gold-finish
          necklaces to contemporary earrings and bangles, our collection is curated for the modern
          Indian woman who values style without compromise.
        </p>
      </Section>

      <Section title="Our Story">
        <p>
          Born out of a love for beautiful jewellery and a desire to make it accessible, Queens
          Jewellery started as a small collection shared among friends and family. The response was
          overwhelming — and so we decided to bring our collection to the world.
        </p>
        <p>
          Every piece in our collection is carefully selected for its quality, finish, and design.
          We believe that great jewellery shouldn't cost a fortune — it should make you feel like
          royalty every day.
        </p>
      </Section>

      <Section title="What We Offer">
        <p>
          We specialise in high-quality imitation jewellery including but not limited to:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Necklaces &amp; Haarams</li>
          <li>Earrings &amp; Jhumkas</li>
          <li>Bangles &amp; Bracelets</li>
          <li>Rings &amp; Maang Tikkas</li>
          <li>Bridal &amp; Occasion Sets</li>
        </ul>
      </Section>

      <Section title="Our Promise">
        <p>
          We are committed to delivering quality products with care. Each order is packed securely
          and shipped within 1–2 business days. We stand behind every product we sell — and if
          something arrives damaged, we'll make it right.
        </p>
      </Section>

      <Section title="Find Us">
        <p>
          Based in Hyderabad, Telangana, India. We ship across India.
        </p>
        <p>
          Follow us on Instagram{' '}
          <a
            href="https://www.instagram.com/queensjewellery2026/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-rose-gold underline"
          >
            @queensjewellery2026
          </a>{' '}
          for new arrivals, styling tips, and exclusive offers.
        </p>
      </Section>
    </PolicyLayout>
  )
}
