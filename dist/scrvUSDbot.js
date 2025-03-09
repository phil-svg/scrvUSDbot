import { EventEmitter } from 'events';
import { telegramBotMain } from './telegram/TelegramBot.js';
import { startSavingsCrvUSD } from './scrvUSD/main.js';
import { startListeningToAllEvents } from './web3/AllEvents.js';
console.clear();
// const ENV = 'prod';
const ENV = 'test';
// export const url = 'http://localhost:443';
export const url = 'wss://api.curvemonitor.com';
export const FILTER_MIN_AMOUNT_FOR_PRINT = 100000;
// export const FILTER_MIN_AMOUNT_FOR_PRINT = 0;
const eventEmitter = new EventEmitter();
async function main() {
    startListeningToAllEvents();
    await telegramBotMain(ENV, eventEmitter);
    await startSavingsCrvUSD(eventEmitter);
}
await main();
// await research();
//# sourceMappingURL=scrvUSDbot.js.map