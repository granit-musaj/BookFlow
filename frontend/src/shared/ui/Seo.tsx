import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { BUSINESS, SITE_URL } from '../config/business';

type Meta = { title: string; description: string };

const DEFAULT: Meta = {
  title: 'BookFlow · Rezervime për studio',
  description: 'Rezervo masazh, jogë ose seanca studioje pa dy persona në të njëjtën orë.',
};

function metaFor(pathname: string, slug?: string): Meta {
  if (pathname === '/') {
    return DEFAULT;
  }
  if (pathname.startsWith('/b/')) {
    return {
      title: `Rezervo te ${BUSINESS.name} · BookFlow`,
      description: `Zgjidh shërbimin dhe orën te ${slug ?? BUSINESS.slug}.`,
    };
  }
  if (pathname === '/login') {
    return { title: 'Hyr · BookFlow', description: 'Hyr në panelin e studios.' };
  }
  if (pathname === '/register') {
    return { title: 'Hap studio · BookFlow', description: 'Krijo llogarinë e studios në BookFlow.' };
  }
  if (pathname === '/forgot-password' || pathname === '/reset-password') {
    return { title: 'Fjalëkalimi · BookFlow', description: 'Rivendos fjalëkalimin e llogarisë BookFlow.' };
  }
  if (pathname === '/app') {
    return { title: 'Përmbledhje · BookFlow', description: 'Statistikat dhe rezervimet e ditës.' };
  }
  if (pathname === '/app/bookings') {
    return { title: 'Rezervim i ri · BookFlow', description: 'Krijo ose menaxho rezervimet e studios.' };
  }
  if (pathname === '/app/clients') {
    return { title: 'Klientët · BookFlow', description: 'Lista e klientëve të studios.' };
  }
  if (pathname === '/app/staff') {
    return { title: 'Stafi · BookFlow', description: 'Stafi, shërbimet dhe oraret.' };
  }
  if (pathname === '/app/services') {
    return { title: 'Shërbimet · BookFlow', description: 'Shërbimet dhe çmimet e studios.' };
  }
  if (pathname === '/app/notifications') {
    return { title: 'Njoftime · BookFlow', description: 'Kërkesat dhe kujtesat e rezervimeve.' };
  }
  return DEFAULT;
}

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  let node = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!node) {
    node = document.createElement('meta');
    node.setAttribute(attr, key);
    document.head.appendChild(node);
  }
  node.setAttribute('content', content);
}

export function Seo() {
  const { pathname } = useLocation();
  const slug = pathname.startsWith('/b/') ? pathname.slice(3).split('/')[0] : undefined;
  const meta = metaFor(pathname, slug);

  useEffect(() => {
    document.title = meta.title;
    upsertMeta('name', 'description', meta.description);
    upsertMeta('property', 'og:title', meta.title);
    upsertMeta('property', 'og:description', meta.description);
    upsertMeta('property', 'og:type', 'website');
    upsertMeta('property', 'og:image', BUSINESS.ogImage);
    upsertMeta('property', 'og:url', `${SITE_URL}${pathname === '/' ? '' : pathname}`);
    upsertMeta('name', 'twitter:card', 'summary_large_image');
    upsertMeta('name', 'twitter:title', meta.title);
    upsertMeta('name', 'twitter:description', meta.description);
    upsertMeta('name', 'twitter:image', BUSINESS.ogImage);
  }, [meta.title, meta.description]);

  return null;
}
