import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title: string;
  description?: string;
}

export default function SEO({ title, description }: SEOProps) {
  const fullTitle = title.includes('Kapda Kraft') ? title : `${title} - Kapda Kraft`;
  const defaultDesc = "KapdaKraft - Your premium destination for high-quality clothing and accessories.";
  const finalDesc = description || defaultDesc;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={finalDesc} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={finalDesc} />
    </Helmet>
  );
}
