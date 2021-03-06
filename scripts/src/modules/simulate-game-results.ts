export type BinValue = number;
export type BinOutcoming = string;
export type OddsBin = {
  binValue: BinValue,
  binOutcome: BinOutcoming,
};
export type OddsBins = OddsBin[];
export const LOWER_RANKED_PLAYER_WINS = `LOWER_RANKED_PLAYER_WINS`
export const LOWER_RANKED_PLAYER_DRAWS = `LOWER_RANKED_PLAYER_DRAWS`
export const HIGHER_RANKED_PLAYER_WINS = `HIGHER_RANKED_PLAYER_WINS`

export const getTheAnswer = (rating1: number, rating2: number): OddsBins => {
  const oddBins: OddsBins = [];
  let binVal: number = 0;
  const diff: number = rating1 - rating2;
  const ave: number = (rating1 + rating2) / 2;
  const expectedScore: number = eloNormal(diff);
  const eloPerPawn: number = eloPerPawnAtElo(ave);
  const eloShift: number = eloPerPawn * 0.6;

  const playerOneWinProbability = eloNormal(diff - eloShift);
  binVal += playerOneWinProbability;
  oddBins.push({binValue: binVal, binOutcome: LOWER_RANKED_PLAYER_WINS});
  // console.log(`playerOneWinProbability: ` + playerOneWinProbability);

  const drawProbability = (expectedScore - playerOneWinProbability) * 2;
  binVal += drawProbability;
  oddBins.push({binValue: binVal, binOutcome: LOWER_RANKED_PLAYER_DRAWS});
  // console.log(`drawProbability: ` + drawProbability);

  const playerTwoWinProbability = 1 - (playerOneWinProbability + drawProbability);
  binVal += playerTwoWinProbability;
  oddBins.push({binValue: binVal, binOutcome: HIGHER_RANKED_PLAYER_WINS});
  // console.log(`playerTwoWinProbability: ` + playerTwoWinProbability);

  return oddBins;
};

/**
 * A FIDE function
 * @param {number} eloDiff - rating 1 - rating2, where rating 1 <= rating2
 * @returns :number
 */
export const eloNormal = (eloDiff: number): number => {
  return erfc(-eloDiff / ((2000.0 / 7) * Math.sqrt(2))) / 2;
};

/**
 * Estimate provided by the author
 * @param {number} elo - A estimate of the rating loss when donating a pawn
 * @returns :number
 *
 */
const eloPerPawnAtElo = (elo: number): number => {
  return Math.exp(elo / 1020) * 26.59;
};

/**
 * The erfc functions return the complementary Gauss error function of x.
 * The complementary Gauss error function is defined as 1 - erf(x).
 *
 * @param {number} x
 * @returns :number
 *
 * https://docs.microsoft.com/en-us/cpp/c-runtime-library/reference/erf-erff-erfl-erfc-erfcf-erfcl?view=msvc-160
 */
export const erfc = (x: number): number => {
  return 1 - erf(x);
};

/**
 * Gauss error function implementation for JavaScript
 *
 * @param {number} x
 * @returns :number
 *
 * Approximation from wikipedia
 * https://stackoverflow.com/questions/1906064/gauss-error-function-implementation-for-javascript
 */
export const erf = (x: number): number => {
  let z: number;
  const ERF_A = 0.147;
  let theSignOfX: number;
  if (0 === x) {
    theSignOfX = 0;
    return 0;
  } else if (x > 0) {
    theSignOfX = 1;
  } else {
    theSignOfX = -1;
  }

  const onePlusAxsqrd = 1 + ERF_A * x * x;
  const fourOvrPiEtc = 4 / Math.PI + ERF_A * x * x;
  let ratio = fourOvrPiEtc / onePlusAxsqrd;
  ratio *= x * -x;
  const expoFun = Math.exp(ratio);
  const radical = Math.sqrt(1 - expoFun);
  z = radical * theSignOfX;
  return z;
};

