import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import { ethers } from 'ethers';
dotenv.config({ path: '../.env' });
export function getTokenURL(tokenAddress) {
    return 'https://etherscan.io/token/' + tokenAddress;
}
export function getBlockUrlEtherscan(blockNumber) {
    return 'https://etherscan.io/block/' + blockNumber;
}
export function getBlockUrlPayload(blockNumber) {
    return 'https://payload.de/data/' + blockNumber;
}
export function getBlockLinkEtherscan(blockNumber) {
    const url = getBlockUrlEtherscan(blockNumber);
    const link = hyperlink(url, blockNumber.toString());
    return link;
}
export function gerBlockLinkPayload(blockNumber) {
    const url = getBlockUrlPayload(blockNumber);
    const link = hyperlink(url, blockNumber.toString());
    return link;
}
export function getPoolURL(poolAddress) {
    return 'https://etherscan.io/address/' + poolAddress;
}
export function getTxHashURLfromEtherscan(txHash) {
    return 'https://etherscan.io/tx/' + txHash;
}
export function getTxHashURLfromEigenPhi(txHash) {
    return 'https://eigenphi.io/mev/eigentx/' + txHash;
}
export function getBuyerURL(buyerAddress) {
    return 'https://etherscan.io/address/' + buyerAddress;
}
export function formatForPrint(someNumber) {
    if (typeof someNumber === 'string' && someNumber.includes(','))
        return someNumber;
    if (someNumber > 100) {
        someNumber = Number(Number(someNumber).toFixed(0)).toLocaleString();
    }
    else {
        someNumber = Number(Number(someNumber).toFixed(2)).toLocaleString();
    }
    return someNumber;
}
export function getShortenNumber(amountStr) {
    let amount = parseFloat(amountStr.replace(/,/g, ''));
    //amount = roundToNearest(amount);
    if (amount >= 1000000) {
        const millionAmount = amount / 1000000;
        if (Number.isInteger(millionAmount)) {
            return `${millionAmount.toFixed(0)}M`;
        }
        else {
            return `${millionAmount.toFixed(2)}M`;
        }
    }
    else if (amount >= 1000) {
        const thousandAmount = amount / 1000;
        if (Number.isInteger(thousandAmount)) {
            return `${thousandAmount.toFixed(0)}k`;
        }
        else {
            return `${thousandAmount.toFixed(1)}k`;
        }
    }
    else {
        return `${amount.toFixed(2)}`;
    }
}
export function hyperlink(link, name) {
    return "<a href='" + link + "/'> " + name + '</a>';
}
let sentMessages = {};
export function send(bot, message, groupID) {
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
function getLabels() {
    const labels = {
        '0x3451B6b219478037a1AC572706627FC2BDa1e812': '1Inch',
        '0xB28Ca7e465C452cE4252598e0Bc96Aeba553CF82': 'Odos Router',
        '0x9008D19f58AAbD9eD0D60971565AA8510560ab41': 'Cow Swap',
    };
    return labels;
}
export async function resolveEnsName(address) {
    // Ensure you have a valid Ethereum RPC provider URL
    const provider = new ethers.JsonRpcProvider(process.env.WEB3_HTTP_MAINNET);
    try {
        // Validate the input address
        if (!ethers.isAddress(address)) {
            throw new Error('Invalid Ethereum address.');
        }
        // Resolve the ENS name for the given address
        const ensName = await provider.lookupAddress(address);
        // If no ENS name is associated with the address, return null
        if (!ensName) {
            return null;
        }
        // Verify reverse resolution (optional but recommended)
        const resolvedAddress = await provider.resolveName(ensName);
        if (resolvedAddress && resolvedAddress.toLowerCase() === address.toLowerCase()) {
            return ensName;
        }
        return null; // Reverse resolution failed
    }
    catch (error) {
        console.error(`Error resolving ENS name for address ${address}:`, error);
        return null;
    }
}
export async function shortenAddress(address) {
    const labels = getLabels();
    const addressLower = address.toLowerCase();
    const ensName = await resolveEnsName(address);
    for (const [labelAddress, label] of Object.entries(labels)) {
        if (labelAddress.toLowerCase() === addressLower) {
            return label;
        }
    }
    if (ensName)
        return ensName;
    return address.slice(0, 7) + '..' + address.slice(-2);
}
export async function telegramBotMain(env, eventEmitter) {
    eventEmitter.on('newMessage', (message) => {
        if (groupID) {
            send(bot, message, parseInt(groupID));
        }
    });
    let telegramGroupToken;
    let groupID;
    if (env == 'prod') {
        telegramGroupToken = process.env.TELEGRAM_scrvUSD_PROD_KEY;
        groupID = process.env.TELEGRAM_PROD_GROUP_ID;
    }
    if (env == 'test') {
        telegramGroupToken = process.env.TELEGRAM_GENERAL_SWAP_MONITOR_TEST_KEY;
        groupID = process.env.TELEGRAM_TEST_GROUP_ID;
    }
    const bot = new TelegramBot(telegramGroupToken, { polling: true });
    bot.on('message', async (msg) => {
        if (msg && msg.text && msg.text.toLowerCase() === 'bot u with us') {
            await new Promise((resolve) => setTimeout(resolve, 950));
            bot.sendMessage(msg.chat.id, 'with you');
        }
    });
}
//# sourceMappingURL=TelegramBot.js.map