import { Helmet } from 'react-helmet-async';

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface ProductSchema {
  name: string;
  description: string;
  image: string[] | string;
  price: number;
  currency: string;
  availability: string;
  sku?: string;
  rating?: number;
  reviewCount?: number;
  brand?: string;
}

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'product' | 'article';
  keywords?: string[];
  breadcrumbs?: BreadcrumbItem[];
  product?: ProductSchema;
  twitterHandle?: string;
  noindex?: boolean;
  nofollow?: boolean;
  canonical?: string;
  author?: string;
  publishedDate?: string;
  modifiedDate?: string;
}

const DEFAULT_SITE_URL = 'https://kapdakraft.live';
const DEFAULT_SITE_NAME = 'Kapda Kraft';
const DEFAULT_DESCRIPTION = 'KapdaKraft - Your premium destination for high-quality clothing and accessories. Curated collections designed for the modern aesthetic.';
const DEFAULT_IMAGE = `${DEFAULT_SITE_URL}/logo.png`;

export default function SEO({
  title,
  description = DEFAULT_DESCRIPTION,
  image = DEFAULT_IMAGE,
  url,
  type = 'website',
  keywords = ['clothing', 'fashion', 'accessories', 'online shopping'],
  breadcrumbs,
  product,
  twitterHandle = '@kapdakraft',
  noindex = false,
  nofollow = false,
  canonical,
  author,
  publishedDate,
  modifiedDate,
}: SEOProps) {
  // Create full title
  const fullTitle = title
    ? title.includes(DEFAULT_SITE_NAME)
      ? title
      : `${title} - ${DEFAULT_SITE_NAME}`
    : DEFAULT_SITE_NAME;

  // Determine canonical URL
  const canonicalUrl = canonical || url || DEFAULT_SITE_URL;

  // Build robots content
  const robotsContent = [
    noindex ? 'noindex' : 'index',
    nofollow ? 'nofollow' : 'follow',
    'max-image-preview:large',
    'max-snippet:-1',
    'max-video-preview:-1',
  ].join(', ');

  // Generate breadcrumb schema
  const breadcrumbSchema = breadcrumbs
    ? {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: breadcrumbs.map((item, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: item.name,
          item: item.url,
        })),
      }
    : null;

  // Generate product schema
  const productSchema = product
    ? {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.name,
        description: product.description,
        image: Array.isArray(product.image) ? product.image : [product.image],
        url: canonicalUrl,
        sku: product.sku || undefined,
        brand: {
          '@type': 'Brand',
          name: product.brand || DEFAULT_SITE_NAME,
        },
        price: {
          '@type': 'PriceSpecification',
          priceCurrency: product.currency || 'INR',
          price: product.price,
        },
        availability: product.availability || 'InStock',
        ...(product.rating && product.reviewCount && {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: product.rating,
            reviewCount: product.reviewCount,
          },
        }),
      }
    : null;

  // Combine all structured data
  const structuredDataList = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: DEFAULT_SITE_NAME,
      url: DEFAULT_SITE_URL,
    },
    ...(breadcrumbSchema ? [breadcrumbSchema] : []),
    ...(productSchema ? [productSchema] : []),
  ];

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords.join(', ')} />
      <meta name="robots" content={robotsContent} />
      <meta name="author" content={author || DEFAULT_SITE_NAME} />

      {/* Canonical URL */}
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph Tags */}
      <meta property="og:type" content={type === 'product' ? 'product' : 'website'} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:site_name" content={DEFAULT_SITE_NAME} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={fullTitle} />

      {/* Product-specific OG tags */}
      {product && (
        <>
          <meta property="product:price:amount" content={product.price.toString()} />
          <meta property="product:price:currency" content={product.currency || 'INR'} />
          <meta property="product:availability" content={product.availability || 'in stock'} />
          {product.sku && <meta property="product:retailer_id" content={product.sku} />}
        </>
      )}

      {/* Twitter Card Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      {twitterHandle && <meta name="twitter:creator" content={twitterHandle} />}

      {/* Article Meta Tags (if applicable) */}
      {publishedDate && (
        <meta property="article:published_time" content={publishedDate} />
      )}
      {modifiedDate && (
        <meta property="article:modified_time" content={modifiedDate} />
      )}
      {author && <meta property="article:author" content={author} />}

      {/* Structured Data (JSON-LD) */}
      {structuredDataList.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(schema),
          }}
        />
      ))}
    </Helmet>
  );
}
