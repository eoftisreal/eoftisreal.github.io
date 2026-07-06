import SEO from '@/components/SEO';

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-4xl py-12 px-4 sm:px-6 lg:px-8">
      <SEO title="Contact Us" description="Get in touch with Kapda Kraft for support, order inquiries, or general questions." />
      <h1 className="text-4xl font-black mb-8 text-foreground">Contact Us</h1>
      <div className="prose prose-slate max-w-none space-y-6 text-secondary-text leading-relaxed">
        <p className="text-lg">
          We'd love to hear from you! Whether you have a question about our products, need assistance with an order, or just want to share some feedback, please feel free to reach out.
        </p>

        <div className="bg-card border border-border p-6 rounded-lg mt-8 space-y-4 shadow-sm">
          <div>
            <h3 className="text-xl font-bold text-foreground mb-2">Email</h3>
            <p>
              <a href="mailto:thecoinrx@gmail.com" className="text-blue-600 hover:underline">
                thecoinrx@gmail.com
              </a>
            </p>
          </div>

          <div>
            <h3 className="text-xl font-bold text-foreground mb-2">Instagram</h3>
            <p>
              <a
                href="https://instagram.com/kapdakraft01"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                @kapdakraft01
              </a>
            </p>
          </div>

          <div>
            <h3 className="text-xl font-bold text-foreground mb-2">Office Hours</h3>
            <p>Mon - Sat : 10AM - 7PM</p>
            <p>Sunday : Closed</p>
          </div>
        </div>
      </div>
    </div>
  );
}
