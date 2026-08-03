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
  title: '\u0411\u0418\u0422\u041e\u041a - \u041f\u0440\u043e\u0434\u0430\u0436\u0430 \u0438 \u043f\u043e\u043a\u0443\u043f\u043a\u0430 \u0431\u0438\u0442\u043e\u0432',
  description:
    '\u0411\u0418\u0422\u041e\u041a - \u0441\u0435\u0440\u0432\u0438\u0441 \u0434\u043b\u044f \u043f\u0440\u043e\u0434\u0430\u0436\u0438 \u0438 \u043f\u043e\u043a\u0443\u043f\u043a\u0438 \u0431\u0438\u0442\u043e\u0432 \u0432 \u0421\u041d\u0413.',
  keywords:
    '\u0431\u0438\u0442\u044b, \u0431\u0438\u0442\u043c\u0435\u0439\u043a\u0435\u0440\u044b, \u043a\u0443\u043f\u0438\u0442\u044c \u0431\u0438\u0442\u044b, \u0440\u044d\u043f, \u043c\u0443\u0437\u044b\u043a\u0430',
  image: 'https://beatokservice.ru/og-image.png',
  siteName: '\u0411\u0418\u0422\u041e\u041a',
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
  const canonicalUrl = canonical || (url ? `https://beatokservice.ru${url}` : 'https://beatokservice.ru/');

  const robots: string[] = [];
  if (noIndex) robots.push('noindex');
  else robots.push('index');
  if (noFollow) robots.push('nofollow');
  else robots.push('follow');

  useEffect(() => {
    document.title = fullTitle;

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

    updateMetaTag('title', fullTitle);
    updateMetaTag('description', description);
    updateMetaTag('keywords', keywords);
    updateMetaTag('robots', robots.join(', '));

    updateMetaTag('og:title', fullTitle, true);
    updateMetaTag('og:description', description, true);
    updateMetaTag('og:image', image, true);
    updateMetaTag('og:url', canonicalUrl, true);
    updateMetaTag('og:type', type, true);
    updateMetaTag('og:site_name', DEFAULT_SEO.siteName, true);
    updateMetaTag('og:locale', 'ru_RU', true);

    if (type === 'article') {
      if (publishedTime) updateMetaTag('article:published_time', publishedTime, true);
      if (author) updateMetaTag('article:author', author, true);
      if (section) updateMetaTag('article:section', section, true);
      if (tags && tags.length > 0) {
        tags.forEach((tag) => updateMetaTag('article:tag', tag, true));
      }
    }

    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', fullTitle);
    updateMetaTag('twitter:description', description);
    updateMetaTag('twitter:image', image);
    updateMetaTag('twitter:domain', 'beatokservice.ru');

    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.rel = 'canonical';
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.href = canonicalUrl;

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
  }, [author, canonicalUrl, description, fullTitle, image, keywords, noFollow, noIndex, publishedTime, robots, schema, section, tags, type]);

  return null;
};

export default SEO;

export const generateBreadcrumbSchema = (items: { name: string; url: string }[]) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `https://beatokservice.ru${item.url}`,
    })),
  };
};

export const generateOrganizationSchema = () => {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'BEATOK',
    url: 'https://beatokservice.ru',
    logo: 'https://beatokservice.ru/og-image.png',
    description: 'Marketplace for buying and selling beats.',
    sameAs: ['https://t.me/beatok_service', 'https://vk.com/beatok_service'],
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'beatok_service@mail.ru',
      contactType: 'customer service',
      availableLanguage: 'Russian',
    },
    founder: {
      '@type': 'Person',
      name: 'Evgeniy Repev',
    },
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Korolev',
      addressRegion: 'Moscow Oblast',
      addressCountry: 'RU',
    },
  };
};

export const generateWebsiteSchema = () => {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'BEATOK',
    url: 'https://beatokservice.ru',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://beatokservice.ru/beats?name={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  };
};

export const generateBeatProductSchema = (beat: {
  name: string;
  author: string;
  price?: number;
  bpm?: number;
  key?: string;
  genre?: string;
  image?: string;
}) => {
  const offers =
    beat.price !== undefined && beat.price > 0
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
    image: beat.image || 'https://beatokservice.ru/og-image.png',
    description: `${beat.name} by ${beat.author}${beat.bpm ? `, ${beat.bpm} BPM` : ''}${beat.key ? `, key ${beat.key}` : ''}${beat.genre ? `, genre ${beat.genre}` : ''}`,
    brand: {
      '@type': 'Brand',
      name: beat.author,
    },
    offers,
  };
};

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
    url: `https://beatokservice.ru/profile/${user.username}`,
    image: user.avatarUrl,
    description: user.description,
    worksCreated: user.beatCount
      ? {
          '@type': 'Collection',
          numberOfItems: user.beatCount,
        }
      : undefined,
  };
};

export const generateFAQSchema = (faqs: { question: string; answer: string }[]) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
};
