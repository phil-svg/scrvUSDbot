import { EventEmitter } from 'events';
import { telegramBotMain } from './telegram/TelegramBot.js';
import { startSavingsCrvUSD } from './scrvUSD/main.js';
console.clear();
const ENV = 'prod';
// const ENV = 'test';
// export const url = 'http://localhost:443';
export const url = 'wss://api.curvemonitor.com';
export const FILTER_VALUE_DEXDEX = 1000000;
// export const FILTER_VALUE_DEXDEX = 0;
const eventEmitter = new EventEmitter();
async function main() {
    await telegramBotMain(ENV, eventEmitter);
    await startSavingsCrvUSD(eventEmitter);
}
await main();
//# sourceMappingURL=scrvUSDbot.js.map