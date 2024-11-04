import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import { EventEmitter } from 'events';

dotenv.config({ path: '../.env' });

export function getTokenURL(tokenAddress: string): string {
  return 'https://etherscan.io/token/' + tokenAddress;
}

export function getBlockUrlEtherscan(blockNumber: number): string {
  return 'https://etherscan.io/block/' + blockNumber;
}

export function getBlockUrlPayload(blockNumber: number): string {
  return 'https://payload.de/data/' + blockNumber;
}

export function getBlockLinkEtherscan(blockNumber: number): string {
  const url = getBlockUrlEtherscan(blockNumber);
  const link = hyperlink(url, blockNumber.toString());
  return link;
}

export function gerBlockLinkPayload(blockNumber: number): string {
  const url = getBlockUrlPayload(blockNumber);
  const link = hyperlink(url, blockNumber.toString());
  return link;
}

export function getPoolURL(poolAddress: string) {
  return 'https://etherscan.io/address/' + poolAddress;
}

export function getTxHashURLfromEtherscan(txHash: string) {
  return 'https://etherscan.io/tx/' + txHash;
}

export function getTxHashURLfromEigenPhi(txHash: string) {
  return 'https://eigenphi.io/mev/eigentx/' + txHash;
}

export function getBuyerURL(buyerAddress: string) {
  return 'https://etherscan.io/address/' + buyerAddress;
}

export function formatForPrint(someNumber: any) {
  if (typeof someNumber === 'string' && someNumber.includes(',')) return someNumber;
  if (someNumber > 100) {
    someNumber = Number(Number(someNumber).toFixed(0)).toLocaleString();
  } else {
    someNumber = Number(Number(someNumber).toFixed(2)).toLocaleString();
  }
  return someNumber;
}

export function getShortenNumber(amountStr: any) {
  let amount = parseFloat(amountStr.replace(/,/g, ''));
  //amount = roundToNearest(amount);
  if (amount >= 1000000) {
    const millionAmount = amount / 1000000;
    if (Number.isInteger(millionAmount)) {
      return `${millionAmount.toFixed(0)}M`;
    } else {
      return `${millionAmount.toFixed(2)}M`;
    }
  } else if (amount >= 1000) {
    const thousandAmount = amount / 1000;
    if (Number.isInteger(thousandAmount)) {
      return `${thousandAmount.toFixed(0)}k`;
    } else {
      return `${thousandAmount.toFixed(1)}k`;
    }
  } else {
    return `${amount.toFixed(2)}`;
  }
}

export function hyperlink(link: string, name: string): string {
  return "<a href='" + link + "/'> " + name + '</a>';
}

let sentMessages: Record<string, boolean> = {};
export function send(bot: any, message: string, groupID: number) {
  const key = `${groupID}:${message}`;

  if (sentMessages[key]) {
    // console.log("This message has already been sent to this group in the past 30 seconds.");
    return;
  }

  bot.sendMessage(groupID, message, { parse_mode: 'HTML', disable_web_page_preview: 'true' });

  if (!message.startsWith('last seen')) {
    // Track the message as sent
    sentMessages[key] = true;

    // Delete the message from tracking after 30 seconds
    setTimeout(() => {
      delete sentMessages[key];
    }, 30000); // 30000 ms = 30 seconds
  }
}

export function shortenAddress(address: string): string {
  return address.slice(0, 7) + '..' + address.slice(-2);
}

export async function telegramBotMain(env: string, eventEmitter: EventEmitter) {
  eventEmitter.on('newMessage', (message: string) => {
    if (groupID) {
      send(bot, message, parseInt(groupID));
    }
  });

  let telegramGroupToken: string | undefined;
  let groupID: string | undefined;

  if (env == 'prod') {
    telegramGroupToken = process.env.TELEGRAM_scrvUSD_PROD_KEY!;
    groupID = process.env.TELEGRAM_PROD_GROUP_ID!;
  }
  if (env == 'test') {
    telegramGroupToken = process.env.TELEGRAM_GENERAL_SWAP_MONITOR_TEST_KEY!;
    groupID = process.env.TELEGRAM_TEST_GROUP_ID!;
  }

  const bot = new TelegramBot(telegramGroupToken!, { polling: true });

  bot.on('message', async (msg: any) => {
    if (msg && msg.text && msg.text.toLowerCase() === 'bot u with us') {
      await new Promise((resolve) => setTimeout(resolve, 950));
      bot.sendMessage(msg.chat.id, 'with you');
    }
  });
}
