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
import { getPastEvents, web3Call } from '../web3/generic.js';
import { getContractFeeSplitter, getContractRewardsHandler, getContractSavingsCrvUSD } from '../web3/Helper.js';

export interface GeneralInfo {
  scrvUSD_totalSupply: number;
  pricePerShare: number;
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
}

async function getGeneralInfo(blockNumber: number): Promise<GeneralInfo> {
  const feeSplitter = await getContractFeeSplitter();
  const rewardsHandler = await getContractRewardsHandler();
  const scrvUSD = await getContractSavingsCrvUSD();

  const scrvUSD_totalSupply = Number(await web3Call(scrvUSD, 'totalSupply', [], blockNumber)) / 1e18;
  const totalCrvUSDDeposited = Number(await web3Call(scrvUSD, 'totalAssets', [], blockNumber)) / 1e18;
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
    upperBoundary_percentage = Number((await web3Call(feeSplitter, 'receivers', [1], blockNumber)).weight) / 100;
  } catch (err) {
    upperBoundary_percentage = 1000 / 100;
  }

  return {
    scrvUSD_totalSupply: scrvUSD_totalSupply,
    pricePerShare: pricePerShare,
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
  };
}

let lastCheckedBlockNumber = 0;
let generalInfo: any;

async function processHit(eventEmitter: any, event: any) {
  if (event.blockNumber !== lastCheckedBlockNumber) {
    lastCheckedBlockNumber = event.blockNumber;
    generalInfo = await getGeneralInfo(event.blockNumber);
  }
  const eventName = event.event;
  console.log('generalInfo', generalInfo);
  let message = '';

  if (eventName === 'Deposit') {
    message = await buildDepositMessage(event, generalInfo);
  }
  if (eventName === 'Withdraw') {
    message = await buildWithdrawMessage(event, generalInfo);
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
  if (eventName === 'StrategyReported') {
    message = await buildStrategyReportedMessage(event);
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

  if (message !== '' && message !== 'Hello World!') eventEmitter.emit('newMessage', message);
}

async function processRawEvent(eventEmitter: any, event: any) {
  console.log('Event spotted for Savings crvUSD:', event);
  await processHit(eventEmitter, event);
}

export async function startSavingsCrvUSD(eventEmitter: any) {
  const contractSavingsCrvUSD = await getContractSavingsCrvUSD();

  // LIVE
  const subscription = contractSavingsCrvUSD.events
    .allEvents({ fromBlock: 'latest' })
    .on('data', async (event: any) => {
      await processRawEvent(eventEmitter, event);
    });

  //  HISTORICAL
  // const startBlock = 21087889;
  // const endBlock = 21113577;

  const startBlock = 21114920;
  const endBlock = startBlock;

  const pastEvents = await getPastEvents(contractSavingsCrvUSD, 'Deposit', startBlock, endBlock);
  if (Array.isArray(pastEvents)) {
    for (const event of pastEvents) {
      await processRawEvent(eventEmitter, event);
    }
  }
}
