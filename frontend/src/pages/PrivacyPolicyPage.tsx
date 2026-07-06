import SEO from '@/components/SEO';

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-4xl py-12 px-4 sm:px-6 lg:px-8">
      <SEO title="Policies & Information" description="Read Kapda Kraft's privacy policy, terms of service, and shipping information." />
      <h1 className="text-4xl font-black mb-8 text-foreground">Policies & Information</h1>
      <div className="prose prose-slate max-w-none space-y-8 text-secondary-text leading-relaxed">

        <section>
          <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground">Order Tracking</h2>
          <p>
            Once your order is placed, a tracking link will be available through your website account page. Customers can use the tracking details to monitor their shipment status.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground">Delayed Deliveries</h2>
          <p>
            While we work with reliable courier partners, delays may occasionally occur due to factors beyond our control. Our company shall not be held responsible for delays caused by courier companies, natural disasters, strikes, public holidays, or other unforeseen events.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground">Lost or Undelivered Shipments</h2>
          <p>
            If your order has not been delivered within the expected timeframe, please contact us with your order number. We will coordinate with the courier partner and assist in resolving the issue.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground">Processing Time</h2>
          <p>
            Orders are typically processed within 1–3 business days after successful payment confirmation. During sales, new launches, festivals, or high-volume periods, processing times may be slightly longer.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground">Privacy Policy</h2>
          <p>
            We take your privacy seriously. We do not store or collect any personal data other than your name, contact information, and address for the sole purpose of ensuring the successful delivery of your order. We handle your information with care and ensure it is only used for fulfilling your requests on our site.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground">Cookie Policy</h2>
          <p>
            Our website uses basic cookies to enhance your browsing experience, keep you logged in, and remember your cart preferences. We do not use tracking cookies for third-party advertising. By continuing to use our site, you agree to our use of these essential cookies.
          </p>
        </section>

      </div>
    </div>
  );
}
