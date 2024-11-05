import { formatForPrint, getBuyerURL, getTokenURL, getTxHashURLfromEtherscan, hyperlink, shortenAddress, } from './TelegramBot.js';
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
function getGeneralInfoMessage(generalInfo) {
    const scrvUSDTag = getscrvusdTag();
    const crvUSDTag = getcrvusdTag();
    return `Weight Range: ${generalInfo.lowerBoundary_percentage} ↹ ${generalInfo.upperBoundary_percentage} | Current: ${generalInfo.weight_percentage}% 
Raw Twa: ${generalInfo.compute_twa} | Scaling Factor: ${generalInfo.scaling_factor / 10000} | Last Snapshot: ${generalInfo.last_snapshot_tracked_value} | ${generalInfo.days_since_last_snapshot.toFixed(2)} days ago
Supply${scrvUSDTag}: ${formatForPrint(generalInfo.scrvUSD_totalSupply)} | Deposited${crvUSDTag}: ${formatForPrint(generalInfo.totalCrvUSDDeposited)} | Price Per Share: ${generalInfo.pricePerShare.toFixed(4)}`;
}
function getLinkLine(txHash) {
    const txHashUrl = getTxHashURLfromEtherscan(txHash);
    const curveUrl = 'https://curve.fi/';
    const feeSplitterUrl = getBuyerURL('0x2dFd89449faff8a532790667baB21cF733C064f2');
    const rewardsHandlerUrl = getBuyerURL('0xe8d1e2531761406af1615a6764b0d5ff52736f56');
    return `Links:${hyperlink(curveUrl, 'curve.fi')} |${hyperlink(feeSplitterUrl, 'feeSplitter')} |${hyperlink(rewardsHandlerUrl, 'rewardsHandler')} |${hyperlink(txHashUrl, 'etherscan.io')} 🦙🦙🦙
  `;
}
export async function buildDepositMessage(event, generalInfo) {
    const userUrl = getBuyerURL(event.returnValues.sender);
    const shortenUser = shortenAddress(event.returnValues.sender);
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
🚀${userLink} deposited ${assetLink} and reveived ${sharesLink}
${generalInfoMessage}
${linkLine}
  `;
}
export async function buildWithdrawMessage(event, generalInfo) {
    const userUrl = getBuyerURL(event.returnValues.sender);
    const shortenUser = shortenAddress(event.returnValues.sender);
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
User${userLink} returned ${sharesLink} and reveived ${assetLink}
${generalInfoMessage}
${linkLine}
  `;
}
export async function buildTransferMessage(event) {
    return `Hello World!`;
}
export async function buildApprovalMessage(event) {
    return `Hello World!`;
}
export async function buildStrategyChangedMessage(event) {
    return `Hello World!`;
}
export async function buildStrategyReportedMessage(event) {
    return `Hello World!`;
}
export async function buildDebtUpdatedMessage(event) {
    return `Hello World!`;
}
export async function buildRoleSetMessage(event) {
    return `Hello World!`;
}
export async function buildUpdateFutureRoleManagerMessage(event) {
    return `Hello World!`;
}
export async function buildUpdateRoleManagerMessage(event) {
    return `Hello World!`;
}
export async function buildUpdateAccountantMessage(event) {
    return `Hello World!`;
}
export async function buildUpdateDepositLimitModuleMessage(event) {
    return `Hello World!`;
}
export async function buildUpdateWithdrawLimitModuleMessage(event) {
    return `Hello World!`;
}
export async function buildUpdateDefaultQueueMessage(event) {
    return `Hello World!`;
}
export async function buildUpdateUseDefaultQueueMessage(event) {
    return `Hello World!`;
}
export async function buildUpdateAutoAllocateMessage(event) {
    return `Hello World!`;
}
export async function buildUpdatedMaxDebtForStrategyMessage(event) {
    return `Hello World!`;
}
export async function buildUpdateMinimumTotalIdleMessage(event) {
    return `Hello World!`;
}
export async function buildUpdateProfitMaxUnlockTimeMessage(event) {
    return `Hello World!`;
}
export async function buildDebtPurchasedMessage(event) {
    return `Hello World!`;
}
export async function buildShutdownMessage(event) {
    return `Hello World!`;
}
//# sourceMappingURL=Messages.js.map