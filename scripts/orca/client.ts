import { readFile } from "mz/fs";
import { Connection, Keypair } from "@solana/web3.js";
import {
  getOrca,
  Orca,
  OrcaFarmConfig,
  OrcaPoolConfig,
  Network,
  OrcaPoolToken,
} from "@orca-so/sdk";
import { envconfig } from "../../utils/config";
import Decimal from "decimal.js";
import { stringify } from "querystring";

const main = async () => {
  /*** Setup ***/
  // 1. Read secret key file to get owner keypair

  const secretKeyString = await readFile(envconfig.solana_wallet_path, {
    encoding: "utf8",
  });
  const secretKey = Uint8Array.from(JSON.parse(secretKeyString));
  const owner = Keypair.fromSecretKey(secretKey);

  // 2. Initialize Orca object with devnet connection
  const connection = new Connection(
    "https://api.devnet.solana.com",
    "singleGossip"
  );
  const orca: Orca = getOrca(connection, Network.DEVNET);

  try {
    /*** Swap ***/
    // 3. We will be swapping 1 SOL for some USDT
    // const orcaSolPool = orca.getPool(OrcaPoolConfig.ORCA_SOL);
    // const solToken = orcaSolPool.getTokenB();
    // const solAmount = new Decimal(1);
    // const quote = await orcaSolPool.getQuote(solToken, solAmount);
    // const orcaAmount = quote.getMinOutputAmount();

    // console.log(`Swap ${solAmount.toString()} SOL for at least ${orcaAmount.toNumber()} ORCA`);
    // const swapPayload = await orcaSolPool.swap(owner, solToken, solAmount, orcaAmount);
    // const swapTxId = await swapPayload.execute();
    // console.log("Swapped:", swapTxId, "\n");

    const pool = orca.getPool(OrcaPoolConfig.ETH_USDC);
    let inToken: OrcaPoolToken, outToken: OrcaPoolToken;
    const aToB: boolean = false;
    const inAmount = new Decimal(0.25);
    if (aToB) {
      inToken = pool.getTokenA();
      outToken = pool.getTokenB();
    } else {
      inToken = pool.getTokenB();
      outToken = pool.getTokenA();
    }

    const quoteAmount = await pool.getQuote(inToken, inAmount);
    const outAmount = quoteAmount.getMinOutputAmount();
    console.log(
      `Swapping ${inAmount.toString()} for at least ${outAmount.toNumber()}`
    );
    const swap = await (
      await pool.swap(owner, inToken, inAmount, outAmount)
    ).execute();
    console.log("Swapped:", swap, "\n");

    // ======
    // /*** Pool Deposit ***/
    // // 4. Deposit SOL and ORCA for LP token
    // const { maxTokenAIn, maxTokenBIn, minPoolTokenAmountOut } = await orcaSolPool.getDepositQuote(
    //   orcaAmount,
    //   solAmount
    // );

    // console.log(
    //   `Deposit at most ${maxTokenBIn.toNumber()} SOL and ${maxTokenAIn.toNumber()} ORCA, for at least ${minPoolTokenAmountOut.toNumber()} LP tokens`
    // );
    // const poolDepositPayload = await orcaSolPool.deposit(
    //   owner,
    //   maxTokenAIn,
    //   maxTokenBIn,
    //   minPoolTokenAmountOut
    // );
    // const poolDepositTxId = await poolDepositPayload.execute();
    // console.log("Pool deposited:", poolDepositTxId, "\n");

    // /*** Farm Deposit ***/
    // // 5. Deposit some ORCA_SOL LP token for farm token
    // const lpBalance = await orcaSolPool.getLPBalance(owner.publicKey);
    // const orcaSolFarm = orca.getFarm(OrcaFarmConfig.ORCA_SOL_AQ);
    // const farmDepositPayload = await orcaSolFarm.deposit(owner, lpBalance);
    // const farmDepositTxId = await farmDepositPayload.execute();
    // console.log("Farm deposited:", farmDepositTxId, "\n");
    // // Note 1: for double dip, repeat step 5 but with the double dip farm
    // // Note 2: to harvest reward, orcaSolFarm.harvest(owner)
    // // Note 3: to get harvestable reward amount, orcaSolFarm.getHarvestableAmount(owner.publicKey)

    // /*** Farm Withdraw ***/
    // // 6. Withdraw ORCA_SOL LP token, in exchange for farm token
    // const farmBalance = await orcaSolFarm.getFarmBalance(owner.publicKey); // withdraw the entire balance
    // const farmWithdrawPayload = await orcaSolFarm.withdraw(owner, farmBalance);
    // const farmWithdrawTxId = await farmWithdrawPayload.execute();
    // console.log("Farm withdrawn:", farmWithdrawTxId, "\n");

    // /*** Pool Withdraw ***/
    // // 6. Withdraw SOL and ORCA, in exchange for ORCA_SOL LP token
    // const withdrawTokenAmount = await orcaSolPool.getLPBalance(owner.publicKey);
    // const withdrawTokenMint = orcaSolPool.getPoolTokenMint();
    // const { maxPoolTokenAmountIn, minTokenAOut, minTokenBOut } = await orcaSolPool.getWithdrawQuote(
    //   withdrawTokenAmount,
    //   withdrawTokenMint
    // );

    // console.log(
    //   `Withdraw at most ${maxPoolTokenAmountIn.toNumber()} ORCA_SOL LP token for at least ${minTokenAOut.toNumber()} ORCA and ${minTokenBOut.toNumber()} SOL`
    // );
    // const poolWithdrawPayload = await orcaSolPool.withdraw(
    //   owner,
    //   maxPoolTokenAmountIn,
    //   minTokenAOut,
    //   minTokenBOut
    // );
    // const poolWithdrawTxId = await poolWithdrawPayload.execute();
    // console.log("Pool withdrawn:", poolWithdrawTxId, "\n");
  } catch (err) {
    console.warn(err);
  }
};

main()
  .then(() => {
    console.log("Done");
  })
  .catch((e) => {
    console.error(e);
  });
