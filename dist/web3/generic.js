import Web3 from 'web3';
export function getWeb3WsProvider() {
    let web3WsProvider = null;
    const wsProvider = new Web3.providers.WebsocketProvider(process.env.WEB_WS_MAINNET);
    // Attach 'end' event listener
    wsProvider.on('end', () => {
        web3WsProvider = null; // Clear instance so that it can be recreated.
        getWeb3WsProvider(); // Recursive call to recreate the provider.
    });
    wsProvider.on('error', () => {
        console.error('WS encountered an error');
    });
    web3WsProvider = new Web3(wsProvider);
    return web3WsProvider;
}
export async function getWeb3HttpProvider() {
    let web3HttpProvider = null;
    const MAX_RETRIES = 5; // Maximum number of retries
    const RETRY_DELAY = 5000; // Delay between retries in milliseconds
    let retries = 0;
    while (retries < MAX_RETRIES) {
        try {
            web3HttpProvider = new Web3(new Web3.providers.HttpProvider(process.env.WEB3_HTTP_MAINNET));
            await web3HttpProvider.eth.net.isListening(); // This will throw an error if it can't connect
            return web3HttpProvider;
        }
        catch (error) {
            if (error instanceof Error) {
                const err = error;
                if (err.code === 'ECONNABORTED') {
                    console.log(`HTTP Provider connection timed out. Attempt ${retries + 1} of ${MAX_RETRIES}. Retrying in ${RETRY_DELAY / 1000} seconds.`);
                }
                else if (err.message && err.message.includes('CONNECTION ERROR')) {
                    console.log(`HTTP Provider connection error. Attempt ${retries + 1} of ${MAX_RETRIES}. Retrying in ${RETRY_DELAY / 1000} seconds.`);
                }
                else {
                    // console.log(
                    //   `Failed to connect to Ethereum node. Attempt ${retries + 1} of ${MAX_RETRIES}. Retrying in ${RETRY_DELAY / 1000} seconds.`
                    // );
                }
                retries++;
                await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
            }
        }
    }
    throw new Error('Failed to connect to Ethereum node after several attempts. Please check your connection and the status of the Ethereum node.');
}
export async function getPastEvents(CONTRACT, eventName, fromBlock, toBlock) {
    if (fromBlock === null || toBlock === null) {
        return null;
    }
    let retries = 0;
    const maxRetries = 12;
    let EVENT_ARRAY = [];
    while (retries < maxRetries) {
        try {
            const events = await CONTRACT.getPastEvents(eventName, { fromBlock, toBlock });
            for (const DATA of events) {
                EVENT_ARRAY.push(DATA);
            }
            break;
        }
        catch (error) {
            console.log('Error in getPastEvents:', error);
        }
        retries++;
    }
    return EVENT_ARRAY;
}
function isCupsErr(err) {
    return err.message.includes('compute units per second capacity');
}
function isError(err) {
    return err instanceof Error;
}
async function delay() {
    await new Promise((resolve) => setTimeout(resolve, 280));
}
async function randomDelay() {
    await new Promise((resolve) => setTimeout(resolve, Math.floor(Math.random() * (400 - 200 + 1) + 200)));
}
export async function web3Call(CONTRACT, method, params, blockNumber = { block: 'latest' }) {
    let shouldContinue = true;
    let retries = 0;
    while (shouldContinue && retries < 12) {
        try {
            return await CONTRACT.methods[method](...params).call(blockNumber);
        }
        catch (error) {
            if (isError(error) && !isCupsErr(error)) {
                console.log(`${error} | Contract: ${CONTRACT.options.address} | method: ${method} | params: ${params} | blockNumber: ${blockNumber}`);
                shouldContinue = false;
            }
            else {
                await randomDelay();
            }
        }
        retries++;
        if (shouldContinue) {
            await delay();
        }
    }
}
//# sourceMappingURL=generic.js.map