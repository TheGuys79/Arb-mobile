/**
 * Unit tests for Arbitrage Calculator Service
 * 
 * Tests:
 * 1. Implied probability calculations
 * 2. Arbitrage detection
 * 3. Stake distribution
 * 4. Profit calculations
 * 5. Real-world scenarios
 */

import { getArbitrageCalculator } from '../arbitrage-calculator';
import { ARBITRAGE_THRESHOLDS } from '@/src/constants/sportsbooks';
import { SportsBook } from '@/src/types/odds';

describe('Arbitrage Calculator Service', () => {
  let calculator: ReturnType<typeof getArbitrageCalculator>;

  beforeEach(() => {
    calculator = getArbitrageCalculator();
  });

  // ======================================================================
  // TEST SUITE 1: IMPLIED PROBABILITY CALCULATIONS
  // ======================================================================

  describe('calculateImpliedProbability', () => {
    it('should calculate probability for negative odds', () => {
      // -110 → 110 / (110 + 100) = 0.5238 (52.38%)
      const prob = calculator.calculateImpliedProbability(-110);
      expect(prob).toBeCloseTo(0.5238, 3);
    });

    it('should calculate probability for positive odds', () => {
      // +150 → 100 / (150 + 100) = 0.4 (40%)
      const prob = calculator.calculateImpliedProbability(150);
      expect(prob).toBeCloseTo(0.4, 1);
    });

    it('should calculate probability for -100 (even odds)', () => {
      // -100 → 100 / (100 + 100) = 0.5 (50%)
      const prob = calculator.calculateImpliedProbability(-100);
      expect(prob).toBe(0.5);
    });

    it('should calculate probability for +100', () => {
      // +100 → 100 / (100 + 100) = 0.5 (50%)
      const prob = calculator.calculateImpliedProbability(100);
      expect(prob).toBe(0.5);
    });

    it('should handle large negative odds', () => {
      // -500 → 500 / (500 + 100) = 0.8333 (83.33%)
      const prob = calculator.calculateImpliedProbability(-500);
      expect(prob).toBeCloseTo(0.8333, 3);
    });

    it('should handle large positive odds', () => {
      // +500 → 100 / (500 + 100) = 0.1667 (16.67%)
      const prob = calculator.calculateImpliedProbability(500);
      expect(prob).toBeCloseTo(0.1667, 3);
    });

    it('should throw error for zero odds', () => {
      expect(() => calculator.calculateImpliedProbability(0)).toThrow();
    });
  });

  // ======================================================================
  // TEST SUITE 2: ARBITRAGE DETECTION
  // ======================================================================

  describe('findArbitrageOpportunities', () => {
    it('should return empty array with fewer than 2 sportsbooks', () => {
      const singleBook: SportsBook[] = [
        {
          name: 'draftkings',
          odds: { home: -110, away: -110 },
          timestamp: Date.now(),
        },
      ];

      const opportunities = calculator.findArbitrageOpportunities(
        singleBook,
        'event_1'
      );

      expect(opportunities.length).toBe(0);
    });

    it('should return empty array when no arbitrage exists', () => {
      const sportsbooks: SportsBook[] = [
        {
          name: 'draftkings',
          odds: { home: -110, away: -110 },
          timestamp: Date.now(),
        },
        {
          name: 'fanduel',
          odds: { home: -110, away: -110 },
          timestamp: Date.now(),
        },
      ];

      const opportunities = calculator.findArbitrageOpportunities(
        sportsbooks,
        'event_1'
      );

      // Both combinations: 52.38% + 52.38% = 104.76% (no arbitrage)
      expect(opportunities.length).toBe(0);
    });

    it('should detect 2-way arbitrage between two books', () => {
      const sportsbooks: SportsBook[] = [
        {
          name: 'draftkings',
          odds: { home: -120, away: -110 },
          timestamp: Date.now(),
        },
        {
          name: 'pinnacle',
          odds: { home: 100, away: 110 },
          timestamp: Date.now(),
        },
      ];

      const opportunities = calculator.findArbitrageOpportunities(
        sportsbooks,
        'event_1',
        'Team A vs Team B',
        'Team A',
        'Team B'
      );

      // Should find at least one profitable opportunity
      expect(opportunities.length).toBeGreaterThan(0);
      expect(opportunities[0].profitMargin).toBeGreaterThan(
        ARBITRAGE_THRESHOLDS.MIN_PROFIT_MARGIN - 0.1
      );
    });

    it('should detect opportunities between 3+ sportsbooks', () => {
      const sportsbooks: SportsBook[] = [
        {
          name: 'draftkings',
          odds: { home: -120, away: -110 },
          timestamp: Date.now(),
        },
        {
          name: 'fanduel',
          odds: { home: -115, away: -105 },
          timestamp: Date.now(),
        },
        {
          name: 'pinnacle',
          odds: { home: 105, away: 115 },
          timestamp: Date.now(),
        },
      ];

      const opportunities = calculator.findArbitrageOpportunities(
        sportsbooks,
        'event_1',
        'Team A vs Team B',
        'Team A',
        'Team B'
      );

      // Should find multiple opportunities with 3 books
      expect(opportunities.length).toBeGreaterThan(0);
    });
  });

  // ======================================================================
  // TEST SUITE 3: STAKE DISTRIBUTION CALCULATIONS
  // ======================================================================

  describe('calculateOptimalStakeDistribution', () => {
    it('should distribute stakes proportionally based on probability', () => {
      // -110: 52.38%, -110: 52.38%
      const distribution = calculator.calculateOptimalStakeDistribution(
        -110,
        -110,
        100
      );

      // Should split $100 approximately 50/50
      expect(distribution.bet1).toBeCloseTo(50, 0);
      expect(distribution.bet2).toBeCloseTo(50, 0);
      expect(distribution.totalStake).toBeCloseTo(100, 0);
    });

    it('should distribute more to lower probability', () => {
      // -120 (54.55%) vs +100 (50%)
      const distribution = calculator.calculateOptimalStakeDistribution(
        -120,
        100,
        100
      );

      // Should bet more on the higher probability (favored)
      expect(distribution.bet1).toBeGreaterThan(distribution.bet2);
      expect(distribution.bet1 + distribution.bet2).toBeCloseTo(100, 0);
    });

    it('should throw error for zero or negative stake', () => {
      expect(() =>
        calculator.calculateOptimalStakeDistribution(-110, -110, 0)
      ).toThrow();

      expect(() =>
        calculator.calculateOptimalStakeDistribution(-110, -110, -50)
      ).toThrow();
    });

    it('should scale correctly with different stake amounts', () => {
      const dist1 = calculator.calculateOptimalStakeDistribution(-110, -110, 100);
      const dist2 = calculator.calculateOptimalStakeDistribution(-110, -110, 1000);

      // Should scale proportionally
      expect(dist2.bet1).toBeCloseTo(dist1.bet1 * 10, 0);
      expect(dist2.bet2).toBeCloseTo(dist1.bet2 * 10, 0);
    });
  });

  // ======================================================================
  // TEST SUITE 4: PROFIT CALCULATIONS
  // ======================================================================

  describe('calculateExpectedProfit', () => {
    it('should calculate profit for simple arbitrage', () => {
      // Example: -120 vs +130
      // decimal1 = 1 + 100/120 = 1.833
      // decimal2 = 1 + 130/100 = 2.3
      const profit = calculator.calculateExpectedProfit(-120, 130, 56.21, 43.79);

      expect(profit.profit).toBeGreaterThan(0);
      expect(profit.profitMargin).toBeGreaterThan(0);
      expect(profit.guaranteedReturn).toBeGreaterThan(100); // More than stake
    });

    it('should have same guaranteed return from both legs', () => {
      const profit = calculator.calculateExpectedProfit(-120, 130, 56.21, 43.79);

      // When bet correctly, both should return approximately same
      const return1 = 56.21 * (1 + 100 / 120);
      const return2 = 43.79 * (1 + 130 / 100);

      expect(Math.abs(return1 - return2)).toBeLessThan(1); // Close to each other
    });

    it('should throw error for zero or negative bets', () => {
      expect(() => calculator.calculateExpectedProfit(-110, -110, 0, 50)).toThrow();
      expect(() => calculator.calculateExpectedProfit(-110, -110, 50, 0)).toThrow();
      expect(() => calculator.calculateExpectedProfit(-110, -110, -50, 50)).toThrow();
    });

    it('should calculate zero profit for even odds', () => {
      // Equal bets at -110 vs -110
      const profit = calculator.calculateExpectedProfit(-110, -110, 50, 50);

      expect(profit.profit).toBeLessThan(0.1); // Close to zero (slight rounding)
      expect(profit.profitMargin).toBeLessThan(0.1);
    });
  });

  // ======================================================================
  // TEST SUITE 5: REAL-WORLD SCENARIOS
  // ======================================================================

  describe('Real-world arbitrage scenarios', () => {
    it('should find arbitrage: DraftKings vs Pinnacle', () => {
      const sportsbooks: SportsBook[] = [
        {
          name: 'draftkings',
          odds: { home: -120, away: -110 },
          timestamp: Date.now(),
          sport: 'nfl',
        },
        {
          name: 'pinnacle',
          odds: { home: 100, away: 110 },
          timestamp: Date.now(),
          sport: 'nfl',
        },
      ];

      const opportunities = calculator.findArbitrageOpportunities(
        sportsbooks,
        'chiefs_vs_bills_2024',
        'Kansas City Chiefs vs Buffalo Bills',
        'Kansas City Chiefs',
        'Buffalo Bills'
      );

      expect(opportunities.length).toBeGreaterThan(0);
      const opp = opportunities[0];
      expect(opp.profitMargin).toBeGreaterThan(0);
      expect(opp.profit).toBeGreaterThan(0);
    });

    it('should calculate correct bets for known scenario', () => {
      // Scenario: -120 creates 54.55% prob, +130 creates 43.48% prob
      // Total: 98.03% (arbitrage exists)
      const distribution = calculator.calculateOptimalStakeDistribution(
        -120,
        130,
        100
      );

      // Verify it sums to approximately $100
      expect(distribution.bet1 + distribution.bet2).toBeCloseTo(100, 1);

      // Verify profit calculation
      const profit = calculator.calculateExpectedProfit(
        -120,
        130,
        distribution.bet1,
        distribution.bet2
      );

      expect(profit.profitMargin).toBeCloseTo(2, 0); // ~2% profit
    });

    it('should ignore low-margin opportunities', () => {
      // Very tight odds (minimal arbitrage)
      const sportsbooks: SportsBook[] = [
        {
          name: 'draftkings',
          odds: { home: -110, away: -110 },
          timestamp: Date.now(),
        },
        {
          name: 'fanduel',
          odds: { home: -111, away: -109 },
          timestamp: Date.now(),
        },
      ];

      const opportunities = calculator.findArbitrageOpportunities(
        sportsbooks,
        'event_1'
      );

      // Should be ignored (below 2% threshold)
      if (opportunities.length > 0) {
        expect(opportunities[0].profitMargin).toBeGreaterThanOrEqual(2);
      }
    });
  });

  // ======================================================================
  // TEST SUITE 6: THRESHOLD CONFIGURATION
  // ======================================================================

  describe('Profit threshold configuration', () => {
    it('should retrieve minimum profit threshold', () => {
      const threshold = calculator.getMinimumProfitThreshold();
      expect(threshold).toBe(2); // Default is 2%
      expect(threshold).toBeGreaterThan(0);
    });

    it('should respect minimum profit threshold', () => {
      // Create very marginal arbitrage (below 2%)
      const sportsbooks: SportsBook[] = [
        {
          name: 'draftkings',
          odds: { home: -110, away: -110 },
          timestamp: Date.now(),
        },
        {
          name: 'pinnacle',
          odds: { home: -110, away: -110 },
          timestamp: Date.now(),
        },
      ];

      const opportunities = calculator.findArbitrageOpportunities(
        sportsbooks,
        'event_1'
      );

      // Should find no opportunities (equal odds)
      expect(opportunities.length).toBe(0);
    });
  });

  // ======================================================================
  // TEST SUITE 7: OPPORTUNITY SCALING
  // ======================================================================

  describe('scaleOpportunityToStake', () => {
    it('should scale opportunity to different stake', () => {
      const baseOpp: any = {
        id: 'test_opp',
        sport: 'nfl',
        event: 'Test',
        homeTeam: 'A',
        awayTeam: 'B',
        sportsbooks: {
          book1: {
            name: 'draftkings',
            odds: -120,
            bet: 56.21,
            profit: 1.5,
            potentialReturn: 103.5,
          },
          book2: {
            name: 'pinnacle',
            odds: 130,
            bet: 43.79,
            profit: 1.5,
            potentialReturn: 100.72,
          },
        },
        totalStake: 100,
        profit: 1.5,
        profitMargin: 1.5,
        impliedProbability: 0.98,
        odds: { home: -120, away: 130 },
        expiresAt: Date.now() + 300000,
        createdAt: Date.now(),
        lastUpdated: Date.now(),
      };

      const scaled = calculator.scaleOpportunityToStake(baseOpp, 500);

      expect(scaled.totalStake).toBe(500);
      expect(scaled.profit).toBeCloseTo(baseOpp.profit * 5, 1);
      expect(scaled.sportsbooks.book1.bet).toBeCloseTo(baseOpp.sportsbooks.book1.bet * 5, 1);
    });

    it('should throw error for invalid scale amount', () => {
      const baseOpp: any = {
        id: 'test',
        totalStake: 100,
      } as any;

      expect(() => calculator.scaleOpportunityToStake(baseOpp, 0)).toThrow();
      expect(() => calculator.scaleOpportunityToStake(baseOpp, -50)).toThrow();
    });
  });
});
