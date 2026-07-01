/**
 * Arbitrage Calculator Service - Phase 1.2
 * 
 * Core arbitrage detection engine that identifies profitable opportunities
 * across multiple sportsbooks using American odds format.
 */

import { SportsBook, ArbitrageOpportunity } from '@/src/types/odds';
import { ARBITRAGE_THRESHOLDS } from '@/src/constants/sportsbooks';

interface ArbitrageCheckResult {
  isArbitrage: boolean;
  impliedProbability: number;
  profitMargin: number;
  message: string;
}

interface BetDistribution {
  bet1: number;
  bet2: number;
  totalStake: number;
}

interface ProfitCalculation {
  profit: number;
  profitMargin: number;
  guaranteedReturn: number;
}

/**
 * Arbitrage Calculation Engine
 * All calculations use American odds format
 */
class ArbitrageCalculatorService {
  /**
   * Convert American odds to decimal odds
   * 
   * @param americanOdds - American odds (e.g., -110, +150)
   * @returns Decimal odds (e.g., 1.909, 2.5)
   * 
   * Formula:
   *   If positive: (odds / 100) + 1
   *   If negative: (100 / |odds|) + 1
   */
  private americanToDecimal(americanOdds: number): number {
    if (americanOdds === 0) {
      throw new Error('American odds cannot be zero');
    }

    if (americanOdds > 0) {
      // Positive odds: +150 → (150/100) + 1 = 2.5
      return americanOdds / 100 + 1;
    } else {
      // Negative odds: -110 → (100/110) + 1 = 1.909
      return 100 / Math.abs(americanOdds) + 1;
    }
  }

  /**
   * Calculate implied probability from American odds
   * 
   * @param americanOdds - American odds
   * @returns Probability between 0 and 1
   * 
   * Formula:
   *   If positive: 100 / (odds + 100)
   *   If negative: |odds| / (|odds| + 100)
   * 
   * Example:
   *   -110 → 110 / (110 + 100) = 110/210 = 0.5238 (52.38%)
   *   +150 → 100 / (150 + 100) = 100/250 = 0.40 (40%)
   */
  calculateImpliedProbability(americanOdds: number): number {
    if (americanOdds === 0) {
      throw new Error('American odds cannot be zero');
    }

    if (americanOdds > 0) {
      return 100 / (americanOdds + 100);
    } else {
      return Math.abs(americanOdds) / (Math.abs(americanOdds) + 100);
    }
  }

  /**
   * Check if two odds create an arbitrage opportunity
   * 
   * @param odds1 - First odds
   * @param odds2 - Second odds
   * @returns Arbitrage check result
   * 
   * Key Formula:
   *   If (prob1 + prob2) < 1.0, arbitrage exists
   */
  private checkArbitrageOpportunity(
    odds1: number,
    odds2: number
  ): ArbitrageCheckResult {
    const prob1 = this.calculateImpliedProbability(odds1);
    const prob2 = this.calculateImpliedProbability(odds2);
    const totalProb = prob1 + prob2;

    if (totalProb >= 1.0) {
      return {
        isArbitrage: false,
        impliedProbability: totalProb,
        profitMargin: 0,
        message: `No arbitrage: total probability ${(totalProb * 100).toFixed(2)}% >= 100%`,
      };
    }

    const profitMargin = ((1 / totalProb - 1) * 100);

    return {
      isArbitrage: profitMargin >= ARBITRAGE_THRESHOLDS.MIN_PROFIT_MARGIN,
      impliedProbability: totalProb,
      profitMargin,
      message: profitMargin >= ARBITRAGE_THRESHOLDS.MIN_PROFIT_MARGIN
        ? `Arbitrage found: ${profitMargin.toFixed(2)}% profit`
        : `Arbitrage below threshold: ${profitMargin.toFixed(2)}% < ${ARBITRAGE_THRESHOLDS.MIN_PROFIT_MARGIN}%`,
    };
  }

  /**
   * Calculate optimal stake distribution for arbitrage
   * 
   * @param odds1 - First odds
   * @param odds2 - Second odds
   * @param totalStake - Total amount to wager
   * @returns Bet distribution {bet1, bet2, totalStake}
   * 
   * Formula:
   *   bet1 = (prob1 / totalProb) × totalStake
   *   bet2 = (prob2 / totalProb) × totalStake
   * 
   * This ensures both outcomes return approximately the same amount.
   */
  calculateOptimalStakeDistribution(
    odds1: number,
    odds2: number,
    totalStake: number = 100
  ): BetDistribution {
    if (totalStake <= 0) {
      throw new Error('Total stake must be positive');
    }

    const prob1 = this.calculateImpliedProbability(odds1);
    const prob2 = this.calculateImpliedProbability(odds2);
    const totalProb = prob1 + prob2;

    // Proportional allocation based on implied probability
    const bet1 = (prob1 / totalProb) * totalStake;
    const bet2 = (prob2 / totalProb) * totalStake;

    return {
      bet1,
      bet2,
      totalStake: bet1 + bet2,
    };
  }

  /**
   * Calculate expected profit from arbitrage
   * 
   * @param odds1 - First odds
   * @param odds2 - Second odds
   * @param bet1 - Amount wagered on first odds
   * @param bet2 - Amount wagered on second odds
   * @returns Profit calculation {profit, profitMargin, guaranteedReturn}
   * 
   * Formula:
   *   return1 = bet1 × decimal1
   *   return2 = bet2 × decimal2
   *   guaranteedReturn = min(return1, return2)
   *   profit = guaranteedReturn - (bet1 + bet2)
   *   profitMargin = (profit / totalStake) × 100
   */
  calculateExpectedProfit(
    odds1: number,
    odds2: number,
    bet1: number,
    bet2: number
  ): ProfitCalculation {
    if (bet1 <= 0 || bet2 <= 0) {
      throw new Error('Bets must be positive');
    }

    const decimal1 = this.americanToDecimal(odds1);
    const decimal2 = this.americanToDecimal(odds2);

    // Calculate total return if each leg wins
    const return1 = bet1 * decimal1;
    const return2 = bet2 * decimal2;

    // Guaranteed return is the minimum (worst case scenario)
    const guaranteedReturn = Math.min(return1, return2);

    // Total stakes
    const totalStake = bet1 + bet2;

    // Profit is return minus stakes
    const profit = guaranteedReturn - totalStake;

    // Profit margin as percentage
    const profitMargin = (profit / totalStake) * 100;

    return {
      profit,
      profitMargin,
      guaranteedReturn,
    };
  }

  /**
   * Find all arbitrage opportunities between sportsbooks
   * 
   * @param sportsbooks - Array of sportsbooks with odds
   * @param eventId - Event identifier
   * @param eventName - Human-readable event name
   * @param homeTeam - Home team name
   * @param awayTeam - Away team name
   * @returns Array of arbitrage opportunities
   * 
   * Algorithm:
   *   1. Iterate through all pairs of sportsbooks
   *   2. For each pair, check both possible combinations:
   *      a) Home from book1, Away from book2
   *      b) Away from book1, Home from book2
   *   3. For each profitable combination, calculate bets and profit
   *   4. Return opportunities above profit threshold
   */
  findArbitrageOpportunities(
    sportsbooks: SportsBook[],
    eventId: string,
    eventName: string = '',
    homeTeam: string = '',
    awayTeam: string = ''
  ): ArbitrageOpportunity[] {
    const opportunities: ArbitrageOpportunity[] = [];

    console.log(`[Arbitrage] 🔍 Searching for opportunities with ${sportsbooks.length} sportsbooks...`);

    // Need at least 2 sportsbooks to compare
    if (sportsbooks.length < ARBITRAGE_THRESHOLDS.MIN_SPORTSBOOKS) {
      console.warn(
        `[Arbitrage] ⚠️  Need at least ${ARBITRAGE_THRESHOLDS.MIN_SPORTSBOOKS} sportsbooks, found ${sportsbooks.length}`
      );
      return opportunities;
    }

    // Compare every pair of sportsbooks
    for (let i = 0; i < sportsbooks.length; i++) {
      for (let j = i + 1; j < sportsbooks.length; j++) {
        const book1 = sportsbooks[i];
        const book2 = sportsbooks[j];

        // 🔴 CHECK #1: Home from book1, Away from book2
        const arb1 = this.createArbitrageIfProfitable(
          book1,
          book2,
          book1.odds.home,
          book2.odds.away,
          eventId,
          eventName,
          homeTeam,
          awayTeam
        );
        if (arb1) {
          opportunities.push(arb1);
          console.log(`[Arbitrage] ✅ Found: ${book1.name} home vs ${book2.name} away`);
        }

        // 🔴 CHECK #2: Away from book1, Home from book2
        const arb2 = this.createArbitrageIfProfitable(
          book1,
          book2,
          book1.odds.away,
          book2.odds.home,
          eventId,
          eventName,
          homeTeam,
          awayTeam
        );
        if (arb2) {
          opportunities.push(arb2);
          console.log(`[Arbitrage] ✅ Found: ${book1.name} away vs ${book2.name} home`);
        }
      }
    }

    console.log(`[Arbitrage] Found ${opportunities.length} profitable opportunities`);
    return opportunities;
  }

  /**
   * Internal helper: Create arbitrage opportunity if profitable
   */
  private createArbitrageIfProfitable(
    book1: SportsBook,
    book2: SportsBook,
    odds1: number,
    odds2: number,
    eventId: string,
    eventName: string,
    homeTeam: string,
    awayTeam: string
  ): ArbitrageOpportunity | null {
    // Check if this combination creates an arbitrage
    const check = this.checkArbitrageOpportunity(odds1, odds2);

    if (!check.isArbitrage) {
      console.log(
        `[Arbitrage] ↩️  ${book1.name} (${odds1}) vs ${book2.name} (${odds2}): ${check.message}`
      );
      return null;
    }

    // Calculate optimal stake distribution
    const baseTotalStake = 100; // $100 base
    const stakeDistribution = this.calculateOptimalStakeDistribution(
      odds1,
      odds2,
      baseTotalStake
    );

    // Calculate profit
    const profitCalc = this.calculateExpectedProfit(
      odds1,
      odds2,
      stakeDistribution.bet1,
      stakeDistribution.bet2
    );

    // Create and return the opportunity
    return {
      id: `${eventId}_${book1.name}_${book2.name}_${Date.now()}`,
      sport: book1.sport || 'unknown',
      event: eventName,
      homeTeam,
      awayTeam,
      sportsbooks: {
        book1: {
          name: book1.name,
          odds: odds1,
          bet: stakeDistribution.bet1,
          profit: profitCalc.profit,
          potentialReturn: stakeDistribution.bet1 * this.americanToDecimal(odds1),
        },
        book2: {
          name: book2.name,
          odds: odds2,
          bet: stakeDistribution.bet2,
          profit: profitCalc.profit,
          potentialReturn: stakeDistribution.bet2 * this.americanToDecimal(odds2),
        },
      },
      totalStake: baseTotalStake,
      profit: profitCalc.profit,
      profitMargin: profitCalc.profitMargin,
      impliedProbability: check.impliedProbability,
      odds: {
        home: odds1,
        away: odds2,
      },
      expiresAt: Date.now() + 300000, // 5 minutes
      createdAt: Date.now(),
      lastUpdated: Date.now(),
    };
  }

  /**
   * Scale arbitrage opportunity to a different stake
   * 
   * @param opportunity - Original opportunity with $100 base
   * @param newTotalStake - New total stake amount
   * @returns Opportunity with scaled bets and profits
   */
  scaleOpportunityToStake(
    opportunity: ArbitrageOpportunity,
    newTotalStake: number
  ): ArbitrageOpportunity {
    if (newTotalStake <= 0) {
      throw new Error('New stake must be positive');
    }

    const scaleFactor = newTotalStake / opportunity.totalStake;

    return {
      ...opportunity,
      totalStake: newTotalStake,
      profit: opportunity.profit * scaleFactor,
      sportsbooks: {
        book1: {
          ...opportunity.sportsbooks.book1,
          bet: opportunity.sportsbooks.book1.bet * scaleFactor,
          profit: opportunity.sportsbooks.book1.profit * scaleFactor,
          potentialReturn: opportunity.sportsbooks.book1.potentialReturn * scaleFactor,
        },
        book2: {
          ...opportunity.sportsbooks.book2,
          bet: opportunity.sportsbooks.book2.bet * scaleFactor,
          profit: opportunity.sportsbooks.book2.profit * scaleFactor,
          potentialReturn: opportunity.sportsbooks.book2.potentialReturn * scaleFactor,
        },
      },
      lastUpdated: Date.now(),
    };
  }

  /**
   * Get current minimum profit threshold
   */
  getMinimumProfitThreshold(): number {
    return ARBITRAGE_THRESHOLDS.MIN_PROFIT_MARGIN;
  }
}

// Singleton instance
let instance: ArbitrageCalculatorService | null = null;

export const getArbitrageCalculator = (): ArbitrageCalculatorService => {
  if (!instance) {
    instance = new ArbitrageCalculatorService();
  }
  return instance;
};

export const ArbitrageCalculator = getArbitrageCalculator();

export default ArbitrageCalculator;
