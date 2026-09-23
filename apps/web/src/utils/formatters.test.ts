import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  formatDate,
  calculatePercentageChange,
  getReasonLabel,
} from './formatters';

describe('Frontend Formatter Utilities', () => {
  describe('formatCurrency', () => {
    it('formats USD currency correctly', () => {
      const formatted = formatCurrency(145000, 'USD');
      expect(formatted).toContain('145,000');
      expect(formatted).toContain('$');
    });

    it('formats EUR currency correctly', () => {
      const formatted = formatCurrency(92000, 'EUR');
      expect(formatted).toContain('92,000');
    });

    it('returns fallback dash for null/undefined', () => {
      expect(formatCurrency(null)).toBe('—');
      expect(formatCurrency(undefined)).toBe('—');
    });
  });

  describe('calculatePercentageChange', () => {
    it('calculates positive percentage raises', () => {
      expect(calculatePercentageChange(100000, 115000)).toBe('+15.0%');
      expect(calculatePercentageChange(50000, 56000)).toBe('+12.0%');
    });

    it('handles zero base gracefully', () => {
      expect(calculatePercentageChange(0, 50000)).toBe('+0%');
    });
  });

  describe('getReasonLabel', () => {
    it('returns human-readable labels for salary reasons', () => {
      expect(getReasonLabel('NEW_HIRE')).toBe('Initial Hire');
      expect(getReasonLabel('ANNUAL_REVIEW')).toBe('Annual Merit Review');
      expect(getReasonLabel('PROMOTION')).toBe('Promotion');
      expect(getReasonLabel('MARKET_ADJUSTMENT')).toBe('Market Adjustment');
    });
  });

  describe('formatDate', () => {
    it('formats ISO dates nicely', () => {
      const formatted = formatDate('2024-05-15T00:00:00.000Z');
      expect(formatted).toContain('May');
      expect(formatted).toContain('2024');
    });

    it('returns Present for null', () => {
      expect(formatDate(null)).toBe('Present');
    });
  });
});
