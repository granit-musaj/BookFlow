import { describe, expect, it } from 'vitest';
import { slugify } from './slug';

describe('slugify', () => {
  it('normalizes names into URL-safe slugs', () => {
    expect(slugify('Studio Yoga Tirana')).toBe('studio-yoga-tirana');
  });

  it('falls back when the name has no latin characters', () => {
    expect(slugify('***')).toBe('business');
  });
});
