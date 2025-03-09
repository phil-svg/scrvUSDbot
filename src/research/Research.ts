import { crvUSDSupplyVsRates } from './topics/crvUSDSupplyVsRates.js';

export async function research() {
  await crvUSDSupplyVsRates();
  console.log('reserch completed');
}
