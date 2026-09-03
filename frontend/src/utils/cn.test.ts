import { describe, it, expect } from 'vitest';
import { cn } from './cn';

describe('cn utility', () => {
  it('merges class names correctly', () => {
    expect(cn('btn', 'btn-primary')).toBe('btn btn-primary');
  });

  it('handles conditional classes', () => {
    const isActive = true;
    const isHidden = false;
    expect(cn('btn', isActive && 'btn-active', isHidden && 'btn-hidden')).toBe('btn btn-active');
  });

  it('merges tailwind classes correctly (twMerge)', () => {
    expect(cn('px-2 py-2', 'p-4')).toBe('p-4');
  });

  it('handles undefined and null', () => {
    expect(cn('btn', undefined, null, 'active')).toBe('btn active');
  });
});
