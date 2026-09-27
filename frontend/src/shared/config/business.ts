const FALLBACK_ORIGIN =
  typeof window !== 'undefined' && window.location?.origin
    ? window.location.origin
    : 'http://localhost:5173';

export const SITE_URL = String(import.meta.env.VITE_SITE_URL || FALLBACK_ORIGIN).replace(/\/$/, '');

export const BUSINESS = {
  name: 'Studio Aureel',
  slug: 'studio-aureel',
  city: 'Tiranë',
  tagline: 'Masazh & Jogë · Tiranë',
  email: 'hello@studio-aureel.com',
  phoneDisplay: '+355 69 400 1122',
  phoneHref: 'tel:+355694001122',
  whatsappHref: 'https://wa.me/355694001122',
  ogImage: `${SITE_URL}/og.jpg`,
} as const;
