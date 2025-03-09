import { getAggregatedInterestRateWeightedByMarketTotalBorrows } from '../../scrvUSD/AggregatedInterest.js';
import { web3Call } from '../../web3/generic.js';
import { getContractCrvUsdControllerFactory, getContractCrvUsdPriceAggregatorHttp, getContractSavingsCrvUSDHttp, getContractStablecoinLensHttp, } from '../../scrvUSD/Helper.js';
import fs from 'fs/promises';
export async function crvUSDSupplyVsRates() {
    const stablecoinLens = await getContractStablecoinLensHttp();
    const scrvUSD = await getContractSavingsCrvUSDHttp();
    const crvUsdControllerFactory = await getContractCrvUsdControllerFactory();
    const crvUsdPriceAggregator = await getContractCrvUsdPriceAggregatorHttp();
    const endBlock = 21682250;
    const startBlock = endBlock - 5 * 60 * 24 * 30 * 2.5; // Adjusted range
    // const startBlock = endBlock - 5 * 60 * 24 * 30 * 2; // Adjusted range
    // const startBlock = 21682250;
    const blockStep = 1500; // Gap of 500 blocks
    const results = [];
    for (let blockNumber = startBlock; blockNumber <= endBlock; blockNumber += blockStep) {
        try {
            const rate = Number((await getAggregatedInterestRateWeightedByMarketTotalBorrows(blockNumber)).toFixed(2));
            const supply = Number((Number(await web3Call(stablecoinLens, 'circulating_supply', [], blockNumber)) / 1e18).toFixed(0));
            const debt = Number((Number(await web3Call(crvUsdControllerFactory, 'total_debt', [], blockNumber)) / 1e18).toFixed(0));
            const scrvUSD_Supply = Number((Number(await web3Call(scrvUSD, 'totalSupply', [], blockNumber)) / 1e18).toFixed(0));
            const profitUnlockingRate = Number(await web3Call(scrvUSD, 'profitUnlockingRate', [], blockNumber)) / 1e18;
            const scrvUSD_Rate = Number((((profitUnlockingRate / 1e12) * 31536000 * 100) / scrvUSD_Supply).toFixed(2));
            const priceCrvUSD = Number((Number(await web3Call(crvUsdPriceAggregator, 'price', [], blockNumber)) / 1e18).toFixed(5));
            results.push({ blockNumber, supply, debt, rate, priceCrvUSD, scrvUSD_Supply, scrvUSD_Rate });
            const progress = (((blockNumber - startBlock) / (endBlock - startBlock)) * 100).toFixed(1);
            console.log(`Fetched data for block ${blockNumber} (${progress}%):`, {
                supply,
                debt,
                rate,
                priceCrvUSD,
                scrvUSD_Supply,
                scrvUSD_Rate,
            });
        }
        catch (error) {
            console.error(`Error fetching data for block ${blockNumber}:`, error);
        }
    }
    // Save the results to a JSON file
    const filePath = './crvUSDSupplyVsRates.json';
    try {
        await fs.writeFile(filePath, JSON.stringify(results, null, 2));
        console.log(`Results saved to ${filePath}`);
    }
    catch (error) {
        console.error('Error saving results to file:', error);
    }
}
//# sourceMappingURL=crvUSDSupplyVsRates.js.map