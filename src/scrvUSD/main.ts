import {
  buildApprovalMessage,
  buildDebtPurchasedMessage,
  buildDebtUpdatedMessage,
  buildDepositMessage,
  buildRoleSetMessage,
  buildShutdownMessage,
  buildStrategyChangedMessage,
  buildStrategyReportedMessage,
  buildTransferMessage,
  buildUpdateAccountantMessage,
  buildUpdateAutoAllocateMessage,
  buildUpdateDefaultQueueMessage,
  buildUpdateDepositLimitModuleMessage,
  buildUpdatedMaxDebtForStrategyMessage,
  buildUpdateFutureRoleManagerMessage,
  buildUpdateMinimumTotalIdleMessage,
  buildUpdateProfitMaxUnlockTimeMessage,
  buildUpdateRoleManagerMessage,
  buildUpdateUseDefaultQueueMessage,
  buildUpdateWithdrawLimitModuleMessage,
  buildWithdrawMessage,
} from '../telegram/Messages.js';
import { getBlockTimeStampFromNode, getPastEvents, web3Call } from '../web3/generic.js';
import {
  getContractCrvUsdPriceAggregatorHttp,
  getContractFeeSplitterHttp,
  getContractRewardsHandlerHttp,
  getContractSavingsCrvUSD,
  getContractSavingsCrvUSDHttp,
  getContractStablecoinLensHttp,
} from '../web3/Helper.js';
import { getAggregatedInterestRateWeightedByMarketTotalBorrows } from './AggregatedInterest.js';

export interface GeneralInfo {
  scrvUSD_totalSupply: number;
  pricePerShare: number;
  apr: number;
  priceCrvUSD: number;
  sinkedCrvUsdPercentage: number;
  totalCrvUSDDeposited: number;
  lowerBoundary_percentage: number;
  upperBoundary_percentage: number;
  weight_percentage: number;
  compute_twa: number;
  scaling_factor: number;
  n_snapshots: number;
  last_snapshot_tracked_value: number;
  last_snapshot_timestamp: number;
  seconds_since_last_snapshot: number;
  days_since_last_snapshot: number;
  weightedBorrowRate: number;
}

async function getGeneralInfo(blockNumber: number): Promise<GeneralInfo> {
  blockNumber = Number(blockNumber);
  const feeSplitter = await getContractFeeSplitterHttp();
  const rewardsHandler = await getContractRewardsHandlerHttp();
  const scrvUSD = await getContractSavingsCrvUSDHttp();
  const crvUsdPriceAggregator = await getContractCrvUsdPriceAggregatorHttp();
  const stablecoinLens = await getContractStablecoinLensHttp();

  const priceCrvUSD = Number(await web3Call(crvUsdPriceAggregator, 'price', [], blockNumber)) / 1e18;

  const scrvUSD_totalSupply = Number(await web3Call(scrvUSD, 'totalSupply', [], blockNumber)) / 1e18;
  const profitUnlockingRate = Number(await web3Call(scrvUSD, 'profitUnlockingRate', [], blockNumber)) / 1e18;
  const apr = ((profitUnlockingRate / 1e12) * 31536000 * 100) / scrvUSD_totalSupply;
  const circulatingCrvUsdSupply = Number(await web3Call(stablecoinLens, 'circulating_supply', [], blockNumber)) / 1e18;
  const totalCrvUSDDeposited = Number(await web3Call(scrvUSD, 'totalAssets', [], blockNumber)) / 1e18;

  const sinkedCrvUsdPercentage = (100 * totalCrvUSDDeposited) / circulatingCrvUsdSupply;

  const pricePerShare = Number(await web3Call(scrvUSD, 'pricePerShare', [], blockNumber)) / 1e18;
  const lowerBoundary_percentage = Number(await web3Call(rewardsHandler, 'minimum_weight', [], blockNumber)) / 100;
  const compute_twa = Number(await web3Call(rewardsHandler, 'compute_twa', [], blockNumber));
  const scaling_factor = Number(await web3Call(rewardsHandler, 'scaling_factor', [], blockNumber));
  const weight_percentage = Number(await web3Call(rewardsHandler, 'weight', [], blockNumber)) / 100;
  const n_snapshots = Number(await web3Call(rewardsHandler, 'get_len_snapshots', [], blockNumber));
  const last_snapshot = await web3Call(rewardsHandler, 'snapshots', [n_snapshots - 1], blockNumber);
  const last_snapshot_tracked_value = Number(last_snapshot.tracked_value);
  const last_snapshot_timestamp = Number(last_snapshot.timestamp);
  const seconds_since_last_snapshot = Math.floor(Date.now() / 1000) - last_snapshot_timestamp;
  const days_since_last_snapshot = seconds_since_last_snapshot / 86400;
  let upperBoundary_percentage;
  try {
    upperBoundary_percentage = Number((await web3Call(feeSplitter, 'receivers', [0], blockNumber)).weight) / 100;
  } catch (err) {
    upperBoundary_percentage = 1000 / 100;
  }
  const aggregatedInterestRateWeightedByMarketTotalBorrows =
    await getAggregatedInterestRateWeightedByMarketTotalBorrows(blockNumber);

  return {
    scrvUSD_totalSupply: scrvUSD_totalSupply,
    pricePerShare: pricePerShare,
    apr: apr,
    priceCrvUSD,
    sinkedCrvUsdPercentage: sinkedCrvUsdPercentage,
    totalCrvUSDDeposited: totalCrvUSDDeposited,
    lowerBoundary_percentage: lowerBoundary_percentage,
    upperBoundary_percentage: upperBoundary_percentage,
    weight_percentage: weight_percentage,
    compute_twa: compute_twa,
    scaling_factor: scaling_factor,
    n_snapshots: n_snapshots,
    last_snapshot_tracked_value: last_snapshot_tracked_value,
    last_snapshot_timestamp: last_snapshot_timestamp,
    seconds_since_last_snapshot: seconds_since_last_snapshot,
    days_since_last_snapshot: days_since_last_snapshot,
    weightedBorrowRate: aggregatedInterestRateWeightedByMarketTotalBorrows,
  };
}

async function processHit(eventEmitter: any, event: any) {
  let generalInfo;
  let retries = 0;
  while (retries < 5) {
    generalInfo = await getGeneralInfo(event.blockNumber);
    if (!generalInfo) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      retries++;
      continue;
    }

    // Check if any field is undefined or NaN
    const hasInvalidField = Object.values(generalInfo).some((value) => value === undefined || Number.isNaN(value));

    if (hasInvalidField) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      retries++;
      continue;
    }

    break;
  }

  if (!generalInfo || Object.values(generalInfo).some((value) => value === undefined || Number.isNaN(value))) {
    console.log('Failed to fetch valid GeneralInfo');
    return;
  }

  const eventName = event.event;
  console.log('generalInfo', generalInfo);
  let message = '';

  if (eventName === 'Deposit') {
    retries = 0;
    while (retries < 5) {
      message = await buildDepositMessage(event, generalInfo);
      if (!message.includes('NaN')) {
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
      retries++;
    }
    console.log('Deposit-message', message);
  }
  if (eventName === 'Withdraw') {
    retries = 0;
    while (retries < 5) {
      message = await buildWithdrawMessage(event, generalInfo);
      if (!message.includes('NaN')) {
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
      retries++;
    }
    console.log('Withdraw-message', message);
  }
  if (eventName === 'StrategyReported') {
    message = await buildStrategyReportedMessage(event, generalInfo);
  }
  if (eventName === 'Transfer') {
    message = await buildTransferMessage(event);
  }
  if (eventName === 'Approval') {
    message = await buildApprovalMessage(event);
  }
  if (eventName === 'StrategyChanged') {
    message = await buildStrategyChangedMessage(event);
  }
  if (eventName === 'DebtUpdated') {
    message = await buildDebtUpdatedMessage(event);
  }
  if (eventName === 'RoleSet') {
    message = await buildRoleSetMessage(event);
  }
  if (eventName === 'UpdateFutureRoleManager') {
    message = await buildUpdateFutureRoleManagerMessage(event);
  }
  if (eventName === 'UpdateRoleManager') {
    message = await buildUpdateRoleManagerMessage(event);
  }
  if (eventName === 'UpdateAccountant') {
    message = await buildUpdateAccountantMessage(event);
  }
  if (eventName === 'UpdateDepositLimitModule') {
    message = await buildUpdateDepositLimitModuleMessage(event);
  }
  if (eventName === 'UpdateWithdrawLimitModule') {
    message = await buildUpdateWithdrawLimitModuleMessage(event);
  }
  if (eventName === 'UpdateDefaultQueue') {
    message = await buildUpdateDefaultQueueMessage(event);
  }
  if (eventName === 'UpdateUseDefaultQueue') {
    message = await buildUpdateUseDefaultQueueMessage(event);
  }
  if (eventName === 'UpdateAutoAllocate') {
    message = await buildUpdateAutoAllocateMessage(event);
  }
  if (eventName === 'UpdatedMaxDebtForStrategy') {
    message = await buildUpdatedMaxDebtForStrategyMessage(event);
  }
  if (eventName === 'UpdateMinimumTotalIdle') {
    message = await buildUpdateMinimumTotalIdleMessage(event);
  }
  if (eventName === 'UpdateProfitMaxUnlockTime') {
    message = await buildUpdateProfitMaxUnlockTimeMessage(event);
  }
  if (eventName === 'DebtPurchased') {
    message = await buildDebtPurchasedMessage(event);
  }
  if (eventName === 'Shutdown') {
    message = await buildShutdownMessage(event);
  }

  if (message !== '' && message !== 'Hello World!' && message !== 'too smol') eventEmitter.emit('newMessage', message);
}

async function processRawEvent(eventEmitter: any, event: any) {
  console.log('Event spotted for Savings crvUSD:', event);
  await processHit(eventEmitter, event);
}

export async function startSavingsCrvUSD(eventEmitter: any) {
  const contractSavingsCrvUSD = await getContractSavingsCrvUSD();

  // LIVE;
  const subscription = contractSavingsCrvUSD.events
    .allEvents({ fromBlock: 'latest' })
    .on('data', async (event: any) => {
      await processRawEvent(eventEmitter, event);
    });

  // HISTORICAL
  // const startBlock = 21087889;
  // const endBlock = 21121675;

  // const startBlock = 21377708;
  // const endBlock = startBlock;

  // const pastEvents = await getPastEvents(contractSavingsCrvUSD, 'allEvents', startBlock, endBlock);
  // if (Array.isArray(pastEvents)) {
  //   for (const event of pastEvents) {
  //     await processRawEvent(eventEmitter, event);
  //   }
  // }
}
