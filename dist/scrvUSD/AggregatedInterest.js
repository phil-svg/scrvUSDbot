import { getWeb3HttpProvider, web3Call } from '../web3/generic.js';
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
    let WEB3_HTTP_PROVIDER = await getWeb3HttpProvider();
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
    const AMM = new WEB3_HTTP_PROVIDER.eth.Contract(ABI_AMM, LLAMMA_ADDRESS);
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
    let WEB3_HTTP_PROVIDER = await getWeb3HttpProvider();
    const ABI_Controller = [
        {
            stateMutability: 'view',
            type: 'function',
            name: 'total_debt',
            inputs: [],
            outputs: [{ name: '', type: 'uint256' }],
        },
    ];
    const controller = new WEB3_HTTP_PROVIDER.eth.Contract(ABI_Controller, controllerAddress);
    const totalDebt = await web3Call(controller, 'total_debt', [], blockNumber);
    return Number(totalDebt / 1e18);
}
export async function getAggregatedInterestRateWeightedByMarketTotalBorrows(blockNumber) {
    const marketsResponse = await fetchMarkets();
    const markets = marketsResponse.data;
    let totalDebt = 0;
    let weightedAprSum = 0;
    for (const market of markets) {
        const marketApr = await getBorrowRateForProvidedLlamma(market.llamma, blockNumber);
        const totalBorrows = await getTotalMarketDebt(blockNumber, market.address);
        if (marketApr !== null) {
            totalDebt += totalBorrows;
            weightedAprSum += marketApr * totalBorrows;
        }
        console.log('market:', market.collateral_token, 'apr:', marketApr, 'debt:', totalBorrows);
    }
    const weightedAverageApr = weightedAprSum / totalDebt;
    return weightedAverageApr;
}
//# sourceMappingURL=AggregatedInterest.js.map