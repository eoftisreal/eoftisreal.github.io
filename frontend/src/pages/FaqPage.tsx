import SEO from '@/components/SEO';

export default function FaqPage() {
  return (
    <div className="space-y-6">
      <SEO
        title="FAQ"
        description="Frequently asked questions about orders, shipping, and support at Kapda Kraft."
        url="https://kapdakraft.live/faq"
        canonical="https://kapdakraft.live/faq"
      />
      <h1 className="text-3xl font-black">Frequently Asked Questions</h1>

      <div className="space-y-4 rounded-md border border-secondary-bg bg-white p-6">
        <section>
          <h2 className="text-lg font-bold">How long does shipping take?</h2>
          <p className="text-secondary-text mt-1">Delivery timelines vary by product and are shown on each product page.</p>
        </section>
        <section>
          <h2 className="text-lg font-bold">Can I track my order?</h2>
          <p className="text-secondary-text mt-1">Yes. After checkout, you can track order status from your account orders page.</p>
        </section>
        <section>
          <h2 className="text-lg font-bold">How can I contact support?</h2>
          <p className="text-secondary-text mt-1">Use the contact page and we will help with any order, product, or payment query.</p>
        </section>
      </div>
    </div>
  );
}
