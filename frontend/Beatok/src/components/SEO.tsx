import React, { useEffect } from 'react';

export interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'profile' | 'product' | 'music';
  noIndex?: boolean;
  noFollow?: boolean;
  canonical?: string;
  schema?: Record<string, unknown> | Record<string, unknown>[];
  publishedTime?: string;
  author?: string;
  section?: string;
  tags?: string[];
}

const DEFAULT_SEO = {
  title: 'БИТОК - Продажа и покупка битов',
  description: 'БИТОК - сервис для продажи и покупки битов в СНГ. Свежие биты для рэпа, роки, поп-музыки и других жанров. Скачивай бесплатные биты или покупай премиум.',
  keywords: 'биты, купить биты, продать биты, биты для рэпа, бесплатные биты, минуса, битмейкеры, рэп, музыка',
  image: 'https://beatok.ru/og-image.png',
  siteName: 'БИТОК',
};

const SEO: React.FC<SEOProps> = ({
  title,
  description = DEFAULT_SEO.description,
  keywords = DEFAULT_SEO.keywords,
  image = DEFAULT_SEO.image,
  url,
  type = 'website',
  noIndex = false,
  noFollow = false,
  canonical,
  schema,
  publishedTime,
  author,
  section,
  tags,
}) => {
  const fullTitle = title ? `${title} | ${DEFAULT_SEO.title}` : DEFAULT_SEO.title;
  const canonicalUrl = canonical || (url ? `https://beatok.ru${url}` : 'https://beatok.ru/');
  
  // Build robots meta
  const robots: string[] = [];
  if (noIndex) robots.push('noindex');
  else robots.push('index');
  if (noFollow) robots.push('nofollow');
  else robots.push('follow');

  useEffect(() => {
    // Update document title
    document.title = fullTitle;

    // Update or create meta tags
    const updateMetaTag = (name: string, content: string, isProperty = false) => {
      const selector = isProperty ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let element = document.querySelector(selector) as HTMLMetaElement | null;
      
      if (!element) {
        element = document.createElement('meta');
        if (isProperty) {
          element.setAttribute('property', name);
        } else {
          element.setAttribute('name', name);
        }
        document.head.appendChild(element);
      }
      element.content = content;
    };

    // Primary meta tags
    updateMetaTag('title', fullTitle);
    updateMetaTag('description', description);
    updateMetaTag('keywords', keywords);
    updateMetaTag('robots', robots.join(', '));

    // Open Graph
    updateMetaTag('og:title', fullTitle, true);
    updateMetaTag('og:description', description, true);
    updateMetaTag('og:image', image, true);
    updateMetaTag('og:url', canonicalUrl, true);
    updateMetaTag('og:type', type, true);
    updateMetaTag('og:site_name', DEFAULT_SEO.siteName, true);
    updateMetaTag('og:locale', 'ru_RU', true);

    // Article specific OG tags
    if (type === 'article') {
      if (publishedTime) updateMetaTag('article:published_time', publishedTime, true);
      if (author) updateMetaTag('article:author', author, true);
      if (section) updateMetaTag('article:section', section, true);
      if (tags && tags.length > 0) {
        tags.forEach(tag => updateMetaTag('article:tag', tag, true));
      }
    }

    // Twitter Card
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', fullTitle);
    updateMetaTag('twitter:description', description);
    updateMetaTag('twitter:image', image);
    updateMetaTag('twitter:domain', 'beatok.ru');

    // Canonical URL
    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.rel = 'canonical';
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.href = canonicalUrl;

    // Handle JSON-LD structured data
    const existingSchema = document.querySelector('script[type="application/ld+json"]');
    if (schema) {
      const schemaData = JSON.stringify(schema);
      if (existingSchema) {
        existingSchema.textContent = schemaData;
      } else {
        const schemaScript = document.createElement('script');
        schemaScript.type = 'application/ld+json';
        schemaScript.textContent = schemaData;
        document.head.appendChild(schemaScript);
      }
    } else if (existingSchema) {
      existingSchema.remove();
    }

  }, [fullTitle, description, keywords, image, canonicalUrl, type, schema, publishedTime, author, section, tags, robots]);

  // This component doesn't render anything visible
  return null;
};

export default SEO;

// Helper function to generate breadcrumb structured data
export const generateBreadcrumbSchema = (items: { name: string; url: string }[]) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `https://beatok.ru${item.url}`,
    })),
  };
};

// Helper function to generate organization structured data
export const generateOrganizationSchema = () => {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'БИТОК',
    url: 'https://beatok.ru',
    logo: 'https://beatok.ru/og-image.png',
    description: 'Сервис для продажи и покупки битов в СНГ',
    sameAs: [
      'https://t.me/beatok_service',
      'https://vk.com/beatok_service',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'beatok_service@mail.ru',
      contactType: 'customer service',
      availableLanguage: 'Russian',
    },
    founder: {
      '@type': 'Person',
      name: 'Евгений Репьев',
    },
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Королев',
      addressRegion: 'Московская область',
      addressCountry: 'RU',
    },
  };
};

// Helper function to generate website structured data with search
export const generateWebsiteSchema = () => {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'БИТОК',
    url: 'https://beatok.ru',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://beatok.ru/beats?name={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  };
};

// Helper function to generate product/beat structured data
export const generateBeatProductSchema = (beat: {
  name: string;
  author: string;
  price?: number;
  bpm?: number;
  key?: string;
  genre?: string;
  image?: string;
}) => {
  const offers = beat.price !== undefined && beat.price > 0
    ? {
        '@type': 'Offer',
        price: beat.price,
        priceCurrency: 'RUB',
        availability: 'https://schema.org/InStock',
      }
    : {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'RUB',
        availability: 'https://schema.org/FreeItem',
      };

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: beat.name,
    image: beat.image || 'https://beatok.ru/og-image.png',
    description: `Бит "${beat.name}" от ${beat.author}${beat.bpm ? `, ${beat.bpm} BPM` : ''}${beat.key ? `, ${beat.key} ключ` : ''}${beat.genre ? `, жанр ${beat.genre}` : ''}`,
    brand: {
      '@type': 'Brand',
      name: beat.author,
    },
    offers,
  };
};

// Helper function to generate person/beatmaker structured data
export const generateBeatmakerPersonSchema = (user: {
  username: string;
  description?: string;
  beatCount?: number;
  avatarUrl?: string;
}) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: user.username,
    url: `https://beatok.ru/profile/${user.username}`,
    image: user.avatarUrl,
    description: user.description,
    worksCreated: user.beatCount ? {
      '@type': 'Collection',
      numberOfItems: user.beatCount,
    } : undefined,
  };
};

// Helper function to generate FAQ structured data
export const generateFAQSchema = (faqs: { question: string; answer: string }[]) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
};

