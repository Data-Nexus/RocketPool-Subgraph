import { ethereum, BigInt } from '@graphprotocol/graph-ts'
import {
  Staker,
  Node,
  RocketETHTransaction,
  NetworkStakerBalanceCheckpoint,
  RocketPoolProtocol,
  StakerBalanceCheckpoint,
  NetworkNodeTimezone,
  NodeRPLStakeTransaction,
  RPLRewardInterval,
  RPLRewardClaim,
  NetworkNodeBalanceCheckpoint,
} from '../generated/schema'
import { BalancesUpdated } from '../generated/rocketNetworkBalances/rocketNetworkBalances'
import { ROCKETPOOL_PROTOCOL_ROOT_ID } from './constants/generalconstants'

class RocketPoolEntityFactory {
  /**
   * Should only every be created once.
   */
  public createRocketPoolProtocol(): RocketPoolProtocol {
    let protocol = new RocketPoolProtocol(ROCKETPOOL_PROTOCOL_ROOT_ID)
    protocol.stakers = new Array<string>(0)
    protocol.lastNetworkStakerBalanceCheckPoint = null
    protocol.nodes = new Array<string>(0)
    protocol.nodeTimezones = new Array<string>(0)
    protocol.lastRPLRewardInterval = null
    protocol.lastNetworkNodeBalanceCheckPoint = null
    return protocol
  }

  /**
   * Attempts to create a new RocketETHTransaction.
   */
  public createRocketETHTransaction(
    id: string,
    from: Staker,
    to: Staker,
    amount: BigInt,
    event: ethereum.Event,
  ): RocketETHTransaction | null {
    if (
      id == null ||
      from === null ||
      from.id == null ||
      to === null ||
      to.id == null ||
      event === null ||
      event.block === null ||
      event.transaction === null
    )
      return null

    let rocketETHTransaction = new RocketETHTransaction(id)
    rocketETHTransaction.from = from.id
    rocketETHTransaction.amount = amount
    rocketETHTransaction.to = to.id
    rocketETHTransaction.block = event.block.number
    rocketETHTransaction.blockTime = event.block.timestamp
    rocketETHTransaction.transactionHash = event.transaction.hash

    return rocketETHTransaction
  }

  /**
   * Attempts to create a new NetworkStakerBalanceCheckpoint.
   */
  public createNetworkStakerBalanceCheckpoint(
    id: string,
    event: BalancesUpdated,
    stakerETHWaitingInDepositPool: BigInt,
    stakerETHInRocketEthContract: BigInt,
    rEthExchangeRate: BigInt,
  ): NetworkStakerBalanceCheckpoint | null {
    if (
      id == null ||
      event === null ||
      event.block === null ||
      event.params === null
    )
      return null

    // Use 0 if negative was passed in for totals.
    if (stakerETHWaitingInDepositPool < BigInt.fromI32(0))
      stakerETHWaitingInDepositPool = BigInt.fromI32(0)
    if (stakerETHInRocketEthContract < BigInt.fromI32(0))
      stakerETHInRocketEthContract = BigInt.fromI32(0)
    let totalStakerETHInProtocol = BigInt.fromI32(0)
    if (event.params.totalEth > BigInt.fromI32(0))
      totalStakerETHInProtocol = event.params.totalEth
    let totalStakerETHActivelyStaking = BigInt.fromI32(0)
    if (event.params.stakingEth > BigInt.fromI32(0))
      totalStakerETHActivelyStaking = event.params.stakingEth

    let networkBalance = new NetworkStakerBalanceCheckpoint(id)
    networkBalance.stakerETHActivelyStaking = totalStakerETHActivelyStaking
    networkBalance.stakerETHWaitingInDepositPool = stakerETHWaitingInDepositPool
    networkBalance.stakerETHInRocketETHContract = stakerETHInRocketEthContract
    networkBalance.stakerETHInProtocol = totalStakerETHInProtocol
    networkBalance.totalRETHSupply = event.params.rethSupply
    networkBalance.averageStakerETHRewards = BigInt.fromI32(0)
    networkBalance.rETHExchangeRate = rEthExchangeRate
    networkBalance.block = event.block.number
    networkBalance.blockTime = event.block.timestamp

    return networkBalance
  }

  /**
   * Attempts to create a new Staker.
   */
  public createStaker(
    id: string,
    blockNumber: BigInt,
    blockTime: BigInt,
  ): Staker | null {
    if (id == null) return null

    let staker = new Staker(id)
    staker.rETHBalance = BigInt.fromI32(0)
    staker.ethBalance = BigInt.fromI32(0)
    staker.totalETHRewards = BigInt.fromI32(0)
    staker.lastBalanceCheckpoint = null
    staker.hasAccruedETHRewardsDuringLifecycle = false
    staker.block = blockNumber
    staker.blockTime = blockTime

    return staker
  }

  /**
   * Attempts to create a new staker balance checkpoint for the given values.
   */
  public createStakerBalanceCheckpoint(
    id: string,
    staker: Staker | null,
    networkStakerBalanceCheckpoint: NetworkStakerBalanceCheckpoint | null,
    ethBalance: BigInt,
    rEthBalance: BigInt,
    totalETHRewards: BigInt,
    blockNumber: BigInt,
    blockTime: BigInt,
  ): StakerBalanceCheckpoint | null {
    if (
      id == null ||
      staker === null ||
      staker.id == null ||
      networkStakerBalanceCheckpoint === null ||
      networkStakerBalanceCheckpoint.id == null
    )
      return null

    let stakerBalanceCheckpoint = new StakerBalanceCheckpoint(id)
    stakerBalanceCheckpoint.stakerId = staker.id
    stakerBalanceCheckpoint.networkStakerBalanceCheckpointId =
      networkStakerBalanceCheckpoint.id
    stakerBalanceCheckpoint.ethBalance = ethBalance
    stakerBalanceCheckpoint.rETHBalance = rEthBalance
    stakerBalanceCheckpoint.totalETHRewards = totalETHRewards
    stakerBalanceCheckpoint.block = blockNumber
    stakerBalanceCheckpoint.blockTime = blockTime

    return stakerBalanceCheckpoint
  }

  /**
   * Attempts to create a node timezone.
   */
  public createNodeTimezone(timezoneId: string): NetworkNodeTimezone {
    let timezone = new NetworkNodeTimezone(timezoneId)
    timezone.totalRegisteredNodes = BigInt.fromI32(0)
    return timezone
  }

  /**
   * Attempts to create a new Node.
   */
  public createNode(
    id: string,
    timezoneId: string,
    blockNumber: BigInt,
    blockTime: BigInt,
  ): Node | null {
    if (id == null) return null

    let node = new Node(id)
    node.timezone = timezoneId
    node.rplStaked = BigInt.fromI32(0)
    node.effectiveRPLStaked = BigInt.fromI32(0)
    node.totalRPLSlashed = BigInt.fromI32(0)
    node.totalClaimedRPLRewards = BigInt.fromI32(0)
    node.minimumRPLNeededForMinipools = BigInt.fromI32(0)
    node.maximumRPLNeededForMinipools = BigInt.fromI32(0)
    node.queuedMinipools = BigInt.fromI32(0)
    node.stakingMinipools = BigInt.fromI32(0)
    node.unbondedStakingMinipools = BigInt.fromI32(0)
    node.withdrawableMinipools = BigInt.fromI32(0)
    node.totalFinalizedMinipools = BigInt.fromI32(0)
    node.averageMinipoolFee = BigInt.fromI32(0)
    node.lastNodeBalanceCheckpoint = null
    node.block = blockNumber
    node.blockTime = blockTime
    return node
  }

  /**
   * Attempts to create a new Node RPL Transaction.
   */
  public createNodeRPLStakeTransaction(
    id: string,
    nodeId: string,
    amount: BigInt,
    ethAmount: BigInt,
    type: string,
    blockNumber: BigInt,
    blockTime: BigInt,
  ): NodeRPLStakeTransaction | null {
    if (id == null) return null

    let transaction = new NodeRPLStakeTransaction(id)
    transaction.node = nodeId
    transaction.amount = amount
    transaction.ethAmount = ethAmount
    transaction.type = type
    transaction.block = blockNumber
    transaction.blockTime = blockTime

    return transaction
  }

  /**
   * Attempts to create a new RPL Reward Interval.
   */
  public createRPLRewardInterval(
    id: string,
    claimableRewards: BigInt,
    intervalStartTime: BigInt,
    intervalDuration: BigInt,
    blockNumber: BigInt,
    blockTime: BigInt,
  ): RPLRewardInterval | null {
    if (id == null) return null

    let rewardInterval = new RPLRewardInterval(id)
    rewardInterval.claimableRewards = claimableRewards
    rewardInterval.totalRPLClaimed = BigInt.fromI32(0)
    rewardInterval.rplRewardClaims = new Array<string>(0)
    rewardInterval.isClosed = false
    rewardInterval.intervalStartTime = intervalStartTime
    rewardInterval.intervalClosedTime = null
    rewardInterval.intervalDuration = intervalDuration
    rewardInterval.intervalDurationActual = null
    rewardInterval.block = blockNumber
    rewardInterval.blockTime = blockTime

    return rewardInterval
  }

  /**
   * Attempts to create a new RPL Reward Claim.
   */
  public createRPLRewardClaim(
    id: string,
    claimer: string,
    claimerType: string,
    amount: BigInt,
    ethAmount: BigInt,
    blockNumber: BigInt,
    blockTime: BigInt,
  ): RPLRewardClaim | null {
    if (
      id == null ||
      claimer == null ||
      claimerType == null ||
      amount == BigInt.fromI32(0) ||
      ethAmount == BigInt.fromI32(0)
    )
      return null

    let rewardInterval = new RPLRewardClaim(id)
    rewardInterval.claimer = claimer
    rewardInterval.claimerType = claimerType
    rewardInterval.amount = amount
    rewardInterval.ethAmount = ethAmount
    rewardInterval.block = blockNumber
    rewardInterval.blockTime = blockTime

    return rewardInterval
  }

  /**
   * Attempts to create a new Network Node Balance Checkpoint.
   */
  public createNetworkNodeBalanceCheckpoint(
    id: string,
    minimumRPLNeededForNewMinipool: BigInt,
    maximumRPLNeededForNewMinipool: BigInt,
    newRplPriceInETH: BigInt,
    newMinipoolFee: BigInt,
    blockNumber: BigInt,
    blockTime: BigInt,
  ): NetworkNodeBalanceCheckpoint | null {
    if (id == null || newRplPriceInETH == BigInt.fromI32(0)) return null

    let checkpoint = new NetworkNodeBalanceCheckpoint(id)
    checkpoint.nodesRegistered = BigInt.fromI32(0) // Will be calculated.
    checkpoint.rplStaked = BigInt.fromI32(0) // Will be calculated.
    checkpoint.effectiveRPLStaked = BigInt.fromI32(0) // Will be calculated.
    checkpoint.totalRPLSlashed = BigInt.fromI32(0) // Will be calculated.
    checkpoint.totalClaimedRPLRewards = BigInt.fromI32(0) // Will be calculated.
    checkpoint.minimumRPLNeededForNewMinipool = minimumRPLNeededForNewMinipool
    checkpoint.maximumRPLNeededForNewMinipool = maximumRPLNeededForNewMinipool
    checkpoint.minimumRPLNeededForQueuedOrStakingMinipools = BigInt.fromI32(0) // Will be calculated.
    checkpoint.maximumRPLNeededForQueuedOrStakingMinipools = BigInt.fromI32(0) // Will be calculated.
    checkpoint.rplPriceInETH = newRplPriceInETH // From the associated price update.
    checkpoint.queuedMinipools = BigInt.fromI32(0) // Will be calculated.
    checkpoint.queuedMinipoolsTotalCapacity = BigInt.fromI32(0) // Will be calculated.
    checkpoint.queuedMinipoolsEffectiveCapacity = BigInt.fromI32(0) // Will be calculated.
    checkpoint.stakingMinipools = BigInt.fromI32(0) // Will be calculated.
    checkpoint.stakingUnbondedMinipools = BigInt.fromI32(0) // Will be calculated.
    checkpoint.withdrawableMinipools = BigInt.fromI32(0) // Will be calculated.
    checkpoint.totalFinalizedMinipools = BigInt.fromI32(0) // Will be calculated.
    checkpoint.averageMinipoolFee = BigInt.fromI32(0) // Will be calculated.
    checkpoint.averageFeeForActivelyQueuedOrStakedMinipools = BigInt.fromI32(0) // Will be calculated.
    checkpoint.newMinipoolFee = newMinipoolFee
    checkpoint.block = blockNumber
    checkpoint.blockTime = blockTime

    return checkpoint
  }
}

export let rocketPoolEntityFactory = new RocketPoolEntityFactory()
