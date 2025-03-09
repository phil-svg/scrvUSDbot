import { web3Call, web3HttpProvider } from '../web3/Web3Basics.js';
function calculateInterest(rate) {
    rate = rate / 1e18;
    const SECONDS_IN_A_YEAR = 365 * 86400;
    const e = 2.718281828459;
    let percentageRate = (Math.pow(e, rate * SECONDS_IN_A_YEAR) - 1) * 100;
    return percentageRate;
}
function calculateAPYFromAPR(apr) {
    const rateAsDecimal = apr / 100;
    const e = Math.E;
    let apy = (Math.pow(e, rateAsDecimal) - 1) * 100;
    return apy;
}
async function getBorrowRateForProvidedLlamma(LLAMMA_ADDRESS, blockNumber) {
    const ABI_AMM = [
        {
            stateMutability: 'view',
            type: 'function',
            name: 'rate',
            inputs: [],
            outputs: [
                {
                    name: '',
                    type: 'uint256',
                },
            ],
        },
    ];
    const AMM = new web3HttpProvider.eth.Contract(ABI_AMM, LLAMMA_ADDRESS);
    try {
        let rate = await web3Call(AMM, 'rate', [], blockNumber);
        if (!rate)
            return null;
        return calculateInterest(Number(rate));
    }
    catch (err) {
        console.log(err);
        return null;
    }
}
async function fetchMarkets() {
    const url = 'https://prices.curve.fi/v1/crvusd/markets/ethereum?fetch_on_chain=false&page=1&per_page=100';
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                accept: 'application/json',
            },
        });
        if (!response.ok) {
            throw new Error(`Failed to fetch data: ${response.statusText}`);
        }
        const data = (await response.json());
        return data;
    }
    catch (error) {
        console.error('Error fetching market data:', error);
        throw error;
    }
}
async function getTotalMarketDebt(blockNumber, controllerAddress) {
    const ABI_Controller = [
        {
            stateMutability: 'view',
            type: 'function',
            name: 'total_debt',
            inputs: [],
            outputs: [{ name: '', type: 'uint256' }],
        },
    ];
    const controller = new web3HttpProvider.eth.Contract(ABI_Controller, controllerAddress);
    const totalDebt = await web3Call(controller, 'total_debt', [], blockNumber);
    return Number(totalDebt / 1e18);
}
export async function getAggregatedInterestRateWeightedByMarketTotalBorrows(blockNumber) {
    const marketsResponse = await fetchMarkets();
    const markets = marketsResponse.data;
    const marketsWithData = [];
    let totalDebt = 0;
    let weightedAprSum = 0;
    for (const market of markets) {
        const marketApr = await getBorrowRateForProvidedLlamma(market.llamma, blockNumber);
        let totalBorrows = await getTotalMarketDebt(blockNumber, market.address);
        // Retry up to 5 times if totalBorrows is NaN
        let retries = 0;
        while (isNaN(totalBorrows) && retries < 5) {
            await new Promise((resolve) => setTimeout(resolve, 1000)); // 1 second delay
            totalBorrows = await getTotalMarketDebt(blockNumber, market.address);
            retries++;
        }
        if (marketApr !== null && !isNaN(totalBorrows)) {
            totalDebt += totalBorrows;
            weightedAprSum += marketApr * totalBorrows;
            marketsWithData.push({
                collateral: market.collateral_token,
                apr: marketApr,
                totalBorrows: totalBorrows,
            });
        }
        // console.log('market:', market.collateral_token, 'apr:', marketApr, 'debt:', totalBorrows);
    }
    let netYield = 0;
    for (const market of marketsWithData) {
        // console.log(
        //   'market:',
        //   market.collateral,
        //   'apr:',
        //   market.apr,
        //   'debt:',
        //   market.totalBorrows,
        //   'num:',
        //   (market.apr / 100) * market.totalBorrows
        // );
        netYield += (market.apr / 100) * market.totalBorrows;
    }
    // console.log('netYield', netYield);
    // console.log('totalDebt', totalDebt);
    const weightedAverageApr = 100 * (netYield / totalDebt);
    return weightedAverageApr;
}
//# sourceMappingURL=AggregatedInterest.js.map