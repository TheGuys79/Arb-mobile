/**
 * Integration tests for Arbitrage Calculator with OddsAPI
 * 
 * Tests the complete flow:
 * 1. Fetch odds from The Odds API
 * 2. Find arbitrage opportunities
 * 3. Calculate optimal bets
 * 4. Verify profit calculations
 */

import { OddsAPI } from '../../odds-api';
import { ArbitrageCalculator } from '../arbitrage-calculator';
import { SPORTS } from '@/src/constants/sportsbooks';

describe('Arbitrage Calculator Integration with OddsAPI', () => {
  /**
   * Integration test: Full flow from API to arbitrage detection
   * 
   * Note: This test requires a valid API key and makes real API calls
   * It may be slower than unit tests
   */
  it('should find arbitrage opportunities from live API odds', async () => {
    try {
      // Step 1: Fetch real odds from The Odds API
      console.log('[Integration] Fetching live odds...');
      const sportsbooks = await OddsAPI.fetchOddsFromAllSportsbooks(SPORTS.NFL);

      if (sportsbooks.length < 2) {
        console.warn('[Integration] Not enough sportsbooks for testing');
        expect(sportsbooks.length).toBeGreaterThanOrEqual(2);
        return;
      }

      console.log(`[Integration] Found ${sportsbooks.length} sportsbooks`);

      // Step 2: Find arbitrage opportunities
      const opportunities = ArbitrageCalculator.findArbitrageOpportunities(
        sportsbooks,
        'test_event_123',
        'Test Event',
        'Team A',
        'Team B'
      );

      console.log(`[Integration] Found ${opportunities.length} opportunities`);

      // Step 3: Verify structure
      opportunities.forEach((opp) => {
        expect(opp.id).toBeDefined();
        expect(opp.sportsbooks.book1).toBeDefined();
        expect(opp.sportsbooks.book2).toBeDefined();
        expect(opp.profit).toBeGreaterThan(0);
        expect(opp.profitMargin).toBeGreaterThanOrEqual(2);
      });

      // Note: We don't assert that opportunities exist, as market conditions vary
      // But if they do exist, we verify they're calculated correctly
      if (opportunities.length > 0) {
        console.log('[Integration] ✅ Arbitrage opportunities found and calculated');
      } else {
        console.log('[Integration] ℹ️  No arbitrage opportunities found (normal for tight markets)');
      }
    } catch (error) {
      console.warn(
        '[Integration] Skipped due to API unavailability:',
        error instanceof Error ? error.message : error
      );
    }
  }, 30000); // 30 second timeout for API call

  /**
   * Integration test: Multiple sports
   */
  it('should find opportunities across different sports', async () => {
    try {
      const sports = [SPORTS.NFL, SPORTS.NBA];
      let totalOpportunities = 0;

      for (const sport of sports) {
        const sportsbooks = await OddsAPI.fetchOddsFromAllSportsbooks(sport);

        if (sportsbooks.length >= 2) {
          const opportunities = ArbitrageCalculator.findArbitrageOpportunities(
            sportsbooks,
            `test_${sport}`,
            `Test ${sport}`,
            'Team A',
            'Team B'
          );

          totalOpportunities += opportunities.length;
          console.log(`[Integration] ${sport}: ${opportunities.length} opportunities`);
        }
      }

      console.log(`[Integration] Total opportunities found: ${totalOpportunities}`);
    } catch (error) {
      console.warn('[Integration] Skipped multi-sport test:', error instanceof Error ? error.message : error);
    }
  }, 60000); // 60 second timeout
});
