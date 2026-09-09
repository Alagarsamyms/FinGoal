import { describe, it, expect } from 'vitest';
import {
  calculateNetWorth,
  calculateFinancialHealth,
  calculateFireProjection,
  calculateEmi,
  calculateFutureValue
} from './calculations';

describe('Financial Calculations', () => {

  describe('calculateNetWorth', () => {
    it('calculates correctly with valid assets and liabilities', () => {
      const assets = [{ currentValue: 100000 }, { value: 50000 }];
      const liabilities = [{ value: 20000 }, { value: 5000 }];
      expect(calculateNetWorth(assets, liabilities)).toBe(125000);
    });

    it('returns 0 for empty arrays', () => {
      expect(calculateNetWorth([], [])).toBe(0);
    });

    it('handles negative asset values', () => {
      const assets = [{ currentValue: -5000 }];
      const liabilities = [{ value: 1000 }];
      expect(calculateNetWorth(assets, liabilities)).toBe(-6000);
    });

    it('handles invalid inputs gracefully', () => {
      expect(calculateNetWorth(null, undefined)).toBe(0);
      expect(calculateNetWorth([{}], [{}])).toBe(0);
    });
  });

  describe('calculateFinancialHealth', () => {
    it('returns 0 if hasData is false', () => {
      expect(calculateFinancialHealth(10000, 5000, 1000, 50000, 50000, false)).toBe(0);
    });

    it('returns 100 for perfect health', () => {
      // High savings rate (50%), no debt, fully funded emergency
      expect(calculateFinancialHealth(100000, 50000, 0, 300000, 300000, true)).toBe(100);
    });

    it('penalizes high DTI', () => {
      // DTI = 45% (> 40), expects -30 penalty
      expect(calculateFinancialHealth(100000, 20000, 45000, 300000, 300000, true)).toBe(70);
    });

    it('penalizes low savings rate', () => {
      // Savings rate = 5% (< 10%), expects -30 penalty
      expect(calculateFinancialHealth(100000, 90000, 5000, 300000, 300000, true)).toBe(70);
    });

    it('penalizes insufficient emergency fund', () => {
      // Emergency < 50% of target, expects -20 penalty
      expect(calculateFinancialHealth(100000, 50000, 0, 300000, 100000, true)).toBe(80);
    });

    it('safely calculates worst-case health score', () => {
      // DTI > 40 (-30), Savings < 10% (-30), No Emergency (-20) = 20
      expect(calculateFinancialHealth(100000, 95000, 50000, 300000, 0, true)).toBe(20);
    });
  });

  describe('calculateFireProjection', () => {
    it('returns empty if SWR is 0', () => {
      const res = calculateFireProjection(30, 1000000, 10000, 50000, 6, 12, 0, 50);
      expect(res.data).toEqual([]);
      expect(res.fireAge).toBeNull();
    });

    it('calculates initial target correctly', () => {
      // Expenses = 50k/mo = 600k/yr. SWR = 4% -> Target = 1.5 Cr
      const res = calculateFireProjection(30, 0, 0, 50000, 0, 0, 4, 50);
      expect(res.initialTarget).toBe(15000000);
    });

    it('projects growth correctly for 1 year with 0 inflation and 0 ROI', () => {
      const res = calculateFireProjection(30, 1000000, 10000, 50000, 0, 0, 4, 50);
      // year 1: corpus + (surplus * 12) = 1M + 120k = 1,120,000
      expect(res.data[1].corpus).toBe(1120000);
    });

    it('finds fire age when corpus crosses target', () => {
      // 1Cr corpus, adding 1L/mo. Expenses = 50k/mo (1.5Cr target). 
      // Should reach fire very quickly.
      const res = calculateFireProjection(30, 10000000, 100000, 50000, 0, 10, 4, 50);
      expect(res.fireAge).toBeDefined();
      expect(res.fireAge).toBeGreaterThan(30);
    });

    it('stops investing after investmentStopAge', () => {
      const res = calculateFireProjection(30, 1000000, 10000, 50000, 0, 0, 4, 31);
      // Age 31: contributes 120k
      expect(res.data[1].corpus).toBe(1120000);
      // Age 32: contributes 0
      expect(res.data[2].corpus).toBe(1120000);
    });
  });

  describe('calculateEmi', () => {
    it('calculates standard EMI correctly', () => {
      const emi = calculateEmi(1000000, 10, 120); // 10L at 10% for 10 years
      expect(Math.round(emi)).toBe(13215); // standard mathematical EMI
    });

    it('handles 0% interest rate', () => {
      const emi = calculateEmi(120000, 0, 12);
      expect(emi).toBe(10000);
    });

    it('returns 0 for invalid inputs', () => {
      expect(calculateEmi(-1000, 10, 12)).toBe(0);
      expect(calculateEmi(1000, 10, 0)).toBe(0);
    });
  });

  describe('calculateFutureValue', () => {
    it('calculates lump sum + sip correctly', () => {
      // 100k lump sum, 10k sip, 12% roi, 12 months
      const fv = calculateFutureValue(100000, 10000, 12, 12);
      expect(Math.round(fv)).toBe(240776);
    });

    it('handles 0% ROI', () => {
      const fv = calculateFutureValue(100000, 10000, 0, 12);
      expect(fv).toBe(220000); // 100k + (10k * 12)
    });
  });

});
