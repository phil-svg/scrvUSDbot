import Web3 from 'web3';
import { Contract } from 'web3-eth-contract';

interface BlockNumber {
  block: string | number;
}

export function getWeb3WsProvider(): Web3 {
  let web3WsProvider: Web3 | null = null;
  const wsProvider = new Web3.providers.WebsocketProvider(process.env.WEB_WS_MAINNET!);

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

export async function getWeb3HttpProvider(): Promise<Web3> {
  let web3HttpProvider: Web3 | null = null;

  const MAX_RETRIES = 5; // Maximum number of retries
  const RETRY_DELAY = 5000; // Delay between retries in milliseconds
  let retries = 0;

  while (retries < MAX_RETRIES) {
    try {
      web3HttpProvider = new Web3(new Web3.providers.HttpProvider(process.env.WEB3_HTTP_MAINNET!));
      await web3HttpProvider.eth.net.isListening(); // This will throw an error if it can't connect
      return web3HttpProvider;
    } catch (error: unknown) {
      if (error instanceof Error) {
        const err = error as any;
        if (err.code === 'ECONNABORTED') {
          console.log(
            `HTTP Provider connection timed out. Attempt ${retries + 1} of ${MAX_RETRIES}. Retrying in ${
              RETRY_DELAY / 1000
            } seconds.`
          );
        } else if (err.message && err.message.includes('CONNECTION ERROR')) {
          console.log(
            `HTTP Provider connection error. Attempt ${retries + 1} of ${MAX_RETRIES}. Retrying in ${
              RETRY_DELAY / 1000
            } seconds.`
          );
        } else {
          // console.log(
          //   `Failed to connect to Ethereum node. Attempt ${retries + 1} of ${MAX_RETRIES}. Retrying in ${RETRY_DELAY / 1000} seconds.`
          // );
        }
        retries++;
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
      }
    }
  }

  throw new Error(
    'Failed to connect to Ethereum node after several attempts. Please check your connection and the status of the Ethereum node.'
  );
}

export async function getPastEvents(
  CONTRACT: any,
  eventName: string,
  fromBlock: number | null,
  toBlock: number | null
): Promise<Array<object> | { start: number; end: number } | null> {
  if (fromBlock === null || toBlock === null) {
    return null;
  }

  let retries = 0;
  const maxRetries = 12;
  let EVENT_ARRAY: Array<object> = [];

  while (retries < maxRetries) {
    try {
      const events = await CONTRACT.getPastEvents(eventName, { fromBlock, toBlock });
      for (const DATA of events) {
        EVENT_ARRAY.push(DATA);
      }
      break;
    } catch (error) {
      console.log('Error in getPastEvents:', error);
    }
    retries++;
  }

  return EVENT_ARRAY;
}

function isCupsErr(err: Error): boolean {
  return err.message.includes('compute units per second capacity');
}

function isError(err: unknown): err is Error {
  return err instanceof Error;
}

async function delay(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 280));
}

async function randomDelay(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, Math.floor(Math.random() * (400 - 200 + 1) + 200)));
}

export async function web3Call(
  CONTRACT: any,
  method: string,
  params: any[],
  blockNumber: BlockNumber | number = { block: 'latest' }
): Promise<any> {
  let shouldContinue = true;
  let retries = 0;
  while (shouldContinue && retries < 12) {
    try {
      return await CONTRACT.methods[method](...params).call(blockNumber);
    } catch (error) {
      if (isError(error) && !isCupsErr(error)) {
        console.log(
          `${error} | Contract: ${CONTRACT.options.address} | method: ${method} | params: ${params} | blockNumber: ${blockNumber}`
        );
        shouldContinue = false;
      } else {
        await randomDelay();
      }
    }
    retries++;
    if (shouldContinue) {
      await delay();
    }
  }
}
