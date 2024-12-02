import { GeneralInfo } from '../scrvUSD/main.js';
import {
  formatForPrint,
  getBuyerURL,
  getTokenURL,
  getTxHashURLfromEtherscan,
  hyperlink,
  shortenAddress,
} from './TelegramBot.js';

function getscrvusdTag() {
  const address = '0x0655977feb2f289a4ab78af67bab0d17aab84367';
  const name = 'scrvUSD';
  return `${hyperlink(getTokenURL(address), name)}`;
}

function getcrvusdTag() {
  const address = '0xf939E0A03FB07F59A73314E73794Be0E57ac1b4E';
  const name = 'crvUSD';
  return `${hyperlink(getTokenURL(address), name)}`;
}

function getGeneralInfoMessage(generalInfo: GeneralInfo) {
  const scrvUSDTag = getscrvusdTag();
  const crvUSDTag = getcrvusdTag();

  let apr;
  if (generalInfo.apr > 20) {
    apr = generalInfo.apr.toFixed(0);
  } else {
    apr = generalInfo.apr.toFixed(2);
  }

  let weightedAprMessage = ``;
  if (!Number.isNaN(generalInfo.weightedBorrowRate)) {
    weightedAprMessage = `Weighted Borrow Rate: ${generalInfo.weightedBorrowRate.toFixed(2)}%`;
  }

  if (generalInfo.scaling_factor / 10000 === 1) {
    return `APY: ${apr}% |${crvUSDTag} Price: ${generalInfo.priceCrvUSD.toFixed(3)}$ | ${weightedAprMessage}
Supply${scrvUSDTag}: ${formatForPrint(generalInfo.scrvUSD_totalSupply)} | Deposited${crvUSDTag}: ${formatForPrint(
      generalInfo.totalCrvUSDDeposited
    )} (${generalInfo.sinkedCrvUsdPercentage.toFixed(1)}%) | Price Per Share: ${generalInfo.pricePerShare.toFixed(3)}
Weight Range: ${generalInfo.lowerBoundary_percentage} ↹ ${generalInfo.upperBoundary_percentage} | Current: ${
      generalInfo.weight_percentage
    }%
Raw Twa: ${generalInfo.compute_twa / 100}% | Last Snapshot: ${
      generalInfo.last_snapshot_tracked_value / 100
    }% | ${generalInfo.days_since_last_snapshot.toFixed(2)} days ago`;
  }

  return `APR: ${apr}% |${crvUSDTag} Price: ${generalInfo.priceCrvUSD.toFixed(
    3
  )}$ | Weighted Borrow Rate: ${generalInfo.weightedBorrowRate.toFixed(2)}%
Supply${scrvUSDTag}: ${formatForPrint(generalInfo.scrvUSD_totalSupply)} | Deposited${crvUSDTag}: ${formatForPrint(
    generalInfo.totalCrvUSDDeposited
  )} (${generalInfo.sinkedCrvUsdPercentage.toFixed(1)}%) | Price Per Share: ${generalInfo.pricePerShare.toFixed(3)}
Weight Range: ${generalInfo.lowerBoundary_percentage} ↹ ${generalInfo.upperBoundary_percentage} | Current: ${
    generalInfo.weight_percentage
  }%
Raw Twa: ${generalInfo.compute_twa / 100}% | Scaling Factor: ${generalInfo.scaling_factor / 10000} | Last Snapshot: ${
    generalInfo.last_snapshot_tracked_value / 100
  }% | ${generalInfo.days_since_last_snapshot.toFixed(2)} days ago`;
}

function getLinkLine(txHash: string) {
  const txHashUrl = getTxHashURLfromEtherscan(txHash);
  const curveUrl = 'https://crvusd.curve.fi/#/ethereum/scrvUSD/';
  const feeSplitterUrl = getBuyerURL('0x2dFd89449faff8a532790667baB21cF733C064f2');
  const rewardsHandlerUrl = getBuyerURL('0xe8d1e2531761406af1615a6764b0d5ff52736f56');

  return `Links:${hyperlink(curveUrl, 'curve.fi')} |${hyperlink(feeSplitterUrl, 'feeSplitter')} |${hyperlink(
    rewardsHandlerUrl,
    'rewardsHandler'
  )} |${hyperlink(txHashUrl, 'etherscan.io')} 🦙🦙🦙
  `;
}

export async function buildDepositMessage(event: any, generalInfo: GeneralInfo) {
  const userUrl = getBuyerURL(event.returnValues.sender);
  const shortenUser = await shortenAddress(event.returnValues.sender);
  const userLink = hyperlink(userUrl, shortenUser);

  const crvUSDTag = getcrvusdTag();
  const scrvUSDTag = getscrvusdTag();

  const depositAssetsAmount = Number(event.returnValues.assets) / 1e18;
  const sharesAmount = Number(event.returnValues.shares) / 1e18;

  const assetLink = `${formatForPrint(depositAssetsAmount)}${crvUSDTag}`;
  const sharesLink = `${formatForPrint(sharesAmount)}${scrvUSDTag}`;

  const generalInfoMessage = getGeneralInfoMessage(generalInfo);
  const linkLine = getLinkLine(event.transactionHash);

  return `
🚀${userLink} deposited ${assetLink} and received ${sharesLink}
${generalInfoMessage}
${linkLine}
  `;
}

export async function buildWithdrawMessage(event: any, generalInfo: GeneralInfo) {
  const userUrl = getBuyerURL(event.returnValues.sender);
  const shortenUser = await shortenAddress(event.returnValues.sender);
  const userLink = hyperlink(userUrl, shortenUser);

  const crvUSDTag = getcrvusdTag();
  const scrvUSDTag = getscrvusdTag();

  const assetsAmount = Number(event.returnValues.assets) / 1e18;
  const sharesAmount = Number(event.returnValues.shares) / 1e18;

  const assetLink = `${formatForPrint(assetsAmount)}${crvUSDTag}`;
  const sharesLink = `${formatForPrint(sharesAmount)}${scrvUSDTag}`;

  const generalInfoMessage = getGeneralInfoMessage(generalInfo);
  const linkLine = getLinkLine(event.transactionHash);

  return `
User${userLink} withdrew ${sharesLink} and received ${assetLink}
${generalInfoMessage}
${linkLine}
  `;
}

export async function buildStrategyReportedMessage(event: any, generalInfo: GeneralInfo) {
  const crvUSDTag = getcrvusdTag();
  const scrvUSDTag = getscrvusdTag();

  const generalInfoMessage = getGeneralInfoMessage(generalInfo);
  const linkLine = getLinkLine(event.transactionHash);
  return `
🎊 Payout to${scrvUSDTag}: ${formatForPrint(event.returnValues.gain / 1e18)}${crvUSDTag}
${generalInfoMessage}
${linkLine}
  `;
}

export async function buildTransferMessage(event: any) {
  return `Hello World!`;
}

export async function buildApprovalMessage(event: any) {
  return `Hello World!`;
}

export async function buildStrategyChangedMessage(event: any) {
  return `Hello World!`;
}

export async function buildDebtUpdatedMessage(event: any) {
  return `Hello World!`;
}

export async function buildRoleSetMessage(event: any) {
  return `Hello World!`;
}

export async function buildUpdateFutureRoleManagerMessage(event: any) {
  return `Hello World!`;
}

export async function buildUpdateRoleManagerMessage(event: any) {
  return `Hello World!`;
}

export async function buildUpdateAccountantMessage(event: any) {
  return `Hello World!`;
}

export async function buildUpdateDepositLimitModuleMessage(event: any) {
  return `Hello World!`;
}

export async function buildUpdateWithdrawLimitModuleMessage(event: any) {
  return `Hello World!`;
}

export async function buildUpdateDefaultQueueMessage(event: any) {
  return `Hello World!`;
}

export async function buildUpdateUseDefaultQueueMessage(event: any) {
  return `Hello World!`;
}

export async function buildUpdateAutoAllocateMessage(event: any) {
  return `Hello World!`;
}

export async function buildUpdatedMaxDebtForStrategyMessage(event: any) {
  return `Hello World!`;
}

export async function buildUpdateMinimumTotalIdleMessage(event: any) {
  return `Hello World!`;
}

export async function buildUpdateProfitMaxUnlockTimeMessage(event: any) {
  return `Hello World!`;
}

export async function buildDebtPurchasedMessage(event: any) {
  return `Hello World!`;
}

export async function buildShutdownMessage(event: any) {
  return `Hello World!`;
}
