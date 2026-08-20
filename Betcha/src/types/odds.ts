export interface SportsBook {
  id: string;
  name: string;
  sport:string;
  odds: {
    home: number;
    away: number;
    draw?: number;
  };
}

export interface ArbitrageOpportunity {
  sportsbook: SportsBook;
  event: string;
  market: string;
  outcome: string;
  odds: number;
  impliedProbability: number;
  stake: number;
  potentialProfit: number;
}