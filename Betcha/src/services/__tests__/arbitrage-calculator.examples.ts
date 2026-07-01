/**
 * Example usage of the Arbitrage Calculator
 * Shows how to use each function in a real application
 */

import { OddsAPI } from '@/src/services/odds-api';
import { ArbitrageCalculator } from '@/src/services/arbitrage-calculator';
import { SPORTS } from '@/src/constants/sportsbooks';

/**
 * Example 1: Calculate implied probability
 */
export async function example1_ImpliedProbability() {
  console.log('\n=== Example 1: Calculate Implied Probability ===\n');

  const odds1 = -110;
  const odds2 = 150;

  const prob1 = ArbitrageCalculator.calculateImpliedProbability(odds1);
  const prob2 = ArbitrageCalculator.calculateImpliedProbability(odds2);

  console.log(`Odds: ${odds1} → Probability: ${(prob1 * 100).toFixed(2)}%`);
  console.log(`Odds: ${odds2} → Probability: ${(prob2 * 100).toFixed(2)}%`);
}

/**
 * Example 2: Calculate optimal stake distribution
 */
export function example2_StakeDistribution() {
  console.log('\n=== Example 2: Calculate Optimal Stake Distribution ===\n');

  const odds1 = -120;
  const odds2 = 130;
  const totalStake = 100;

  const distribution = ArbitrageCalculator.calculateOptimalStakeDistribution(
    odds1,
    odds2,
    totalStake
  );

  console.log(`Total Stake: $${totalStake}`);
  console.log(`Bet on ${odds1}: $${distribution.bet1.toFixed(2)}`);
  console.log(`Bet on ${odds2}: $${distribution.bet2.toFixed(2)}`);
  console.log(`Total: $${distribution.totalStake.toFixed(2)}`);
}

/**
 * Example 3: Calculate expected profit
 */
export function example3_ExpectedProfit() {
  console.log('\n=== Example 3: Calculate Expected Profit ===\n');

  const odds1 = -120;
  const odds2 = 130;
  const bet1 = 56.21;
  const bet2 = 43.79;

  const profit = ArbitrageCalculator.calculateExpectedProfit(
    odds1,
    odds2,
    bet1,
    bet2
  );

  console.log(`Bet 1 (${odds1}): $${bet1.toFixed(2)}`);
  console.log(`Bet 2 (${odds2}): $${bet2.toFixed(2)}`);
  console.log(`---`);
  console.log(`Guaranteed Return: $${profit.guaranteedReturn.toFixed(2)}`);
  console.log(`Total Stake: $${(bet1 + bet2).toFixed(2)}`);
  console.log(`Profit: $${profit.profit.toFixed(2)}`);
  console.log(`Profit Margin: ${profit.profitMargin.toFixed(2)}%`);
}

/**
 * Example 4: Find complete arbitrage opportunity
 */
export async function example4_FindArbitrage() {
  console.log('\n=== Example 4: Find Complete Arbitrage Opportunity ===\n');

  try {
    // Step 1: Get live odds
    console.log('📋 Step 1: Fetching live odds...');
    const sportsbooks = await OddsAPI.fetchOddsFromAllSportsbooks(SPORTS.NFL);
    console.log(`Found ${sportsbooks.length} sportsbooks\n`);

    // Step 2: Find opportunities
    console.log('📋 Step 2: Finding arbitrage opportunities...');
    const opportunities = ArbitrageCalculator.findArbitrageOpportunities(
      sportsbooks,
      'example_event',
      'Example Event',
      'Team A',
      'Team B'
    );
    console.log(`Found ${opportunities.length} opportunities\n`);

    // Step 3: Display results
    if (opportunities.length > 0) {
      console.log('📋 Step 3: Displaying best opportunity:\n');
      const bestOpp = opportunities[0];

      console.log(`Event: ${bestOpp.event}`);
      console.log(`Profit: $${bestOpp.profit.toFixed(2)} (${bestOpp.profitMargin.toFixed(2)}%)`);
      console.log(``);
      console.log(`Book 1: ${bestOpp.sportsbooks.book1.name.toUpperCase()}`);
      console.log(`  Odds: ${bestOpp.sportsbooks.book1.odds}`);
      console.log(`  Bet: $${bestOpp.sportsbooks.book1.bet.toFixed(2)}`);
      console.log(``);
      console.log(`Book 2: ${bestOpp.sportsbooks.book2.name.toUpperCase()}`);
      console.log(`  Odds: ${bestOpp.sportsbooks.book2.odds}`);
      console.log(`  Bet: $${bestOpp.sportsbooks.book2.bet.toFixed(2)}`);
      console.log(``);
      console.log(`Total Stake: $${bestOpp.totalStake.toFixed(2)}`);
    } else {
      console.log('No profitable opportunities found (market is efficient)');
    }
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
  }
}

/**
 * Example 5: Scale opportunity to different stake
 */
export function example5_ScaleOpportunity() {
  console.log('\n=== Example 5: Scale Opportunity to Different Stake ===\n');

  // Create a sample opportunity with $100 base
  const sampleOpportunity = {
    id: 'test_opp_1',
    sport: 'nfl',
    event: 'Test Game',
    homeTeam: 'Team A',
    awayTeam: 'Team B',
    sportsbooks: {
      book1: {
        name: 'draftkings' as const,
        odds: -120,
        bet: 56.21,
        profit: 2.50,
        potentialReturn: 103.50,
      },
      book2: {
        name: 'pinnacle' as const,
        odds: 130,
        bet: 43.79,
        profit: 2.50,
        potentialReturn: 103.50,
      },
    },
    totalStake: 100,
    profit: 2.50,
    profitMargin: 2.50,
    impliedProbability: 0.9803,
    odds: { home: -120, away: 130 },
    expiresAt: Date.now() + 300000,
    createdAt: Date.now(),
    lastUpdated: Date.now(),
  };

  // Scale to $500
  const scaled = ArbitrageCalculator.scaleOpportunityToStake(sampleOpportunity, 500);

  console.log('Original (base $100):');
  console.log(`  Stake: $${sampleOpportunity.totalStake}`);
  console.log(`  Profit: $${sampleOpportunity.profit.toFixed(2)}`);
  console.log(`  Book1 Bet: $${sampleOpportunity.sportsbooks.book1.bet.toFixed(2)}`);
  console.log(`  Book2 Bet: $${sampleOpportunity.sportsbooks.book2.bet.toFixed(2)}`);
  console.log(``);
  console.log('Scaled to $500:');
  console.log(`  Stake: $${scaled.totalStake}`);
  console.log(`  Profit: $${scaled.profit.toFixed(2)}`);
  console.log(`  Book1 Bet: $${scaled.sportsbooks.book1.bet.toFixed(2)}`);
  console.log(`  Book2 Bet: $${scaled.sportsbooks.book2.bet.toFixed(2)}`);
}

/**
 * Run all examples
 */
export async function runAllExamples() {
  console.log('\n\n╔════════════════════════════════════════════════════════╗');
  console.log('║  ARBITRAGE CALCULATOR - USAGE EXAMPLES                  ║');
  console.log('╚════════════════════════════════════════════════════════╝');

  example1_ImpliedProbability();
  example2_StakeDistribution();
  example3_ExpectedProfit();
  example5_ScaleOpportunity();

  // Async example
  await example4_FindArbitrage();

  console.log('\n\n✅ All examples completed!');
}

// Uncomment to run examples:
// runAllExamples().catch(console.error);
