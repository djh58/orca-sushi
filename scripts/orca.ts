import { readFile } from "mz/fs";
import { Connection, Keypair } from "@solana/web3.js";
import {
  getOrca,
  Orca,
  OrcaFarmConfig,
  OrcaPoolConfig,
  OrcaPool,
  Network,
  OrcaPoolToken,
} from "@orca-so/sdk";
import { envconfig } from "../utils/config";
import Decimal from "decimal.js";
import { stringify } from "querystring";

export class OrcaTrade {
  public owner: Keypair = new Keypair();
  public connection = new Connection(
    "https://api.devnet.solana.com",
    "singleGossip"
  );
  public orca: Orca = getOrca(this.connection, Network.DEVNET);

  // double dictionary
  public pools: { [key: string]: { [key: string]: string } } = {
    ETH: {
      A: "3e1W6Aqcbuk2DfHUwRiRcyzpyYRRjg6yhZZcyEARydUX",
    },
    USDC: {
      A: "H2uzgruPvonVpCRhwwdukcpXK8TG17swFNzYFr2rtPxy",
      B: "3e1W6Aqcbuk2DfHUwRiRcyzpyYRRjg6yhZZcyEARydUX",
    },
    USDT: {
      B: "H2uzgruPvonVpCRhwwdukcpXK8TG17swFNzYFr2rtPxy",
    },
  };

  public async init() {
    const secretKeyString = await readFile(envconfig.solana_wallet_path, {
      encoding: "utf8",
    });
    const secretKey = Uint8Array.from(JSON.parse(secretKeyString));
    this.owner = Keypair.fromSecretKey(secretKey);
  }

  private validatePoolExists(start_asset: string, end_asset: string): boolean {
    const noPools = !this.pools[start_asset] || !this.pools[end_asset];
    const noAtoB = this.pools[start_asset]["A"] !== this.pools[end_asset]["B"];
    const noBtoA = this.pools[start_asset]["B"] !== this.pools[end_asset]["A"];
    if (noPools || noAtoB || noBtoA) {
      return false;
    }
    return true;
  }

  private getPoolAddr(start_asset: string, end_asset: string): string {
    this.validatePoolExists(start_asset, end_asset);
    let poolAddr = this.pools[start_asset]["A"];
    if (!poolAddr) {
      poolAddr = this.pools[start_asset]["B"];
    }
    return poolAddr;
  }

  public async randomSwap(start_asset: string, end_asset: string) {
    const poolAddr = this.getPoolAddr(start_asset, end_asset);
    const pool = this.orca.getPool(poolAddr as OrcaPoolConfig);
    const inAmount = new Decimal(Math.random());
    const aToB = Math.random() > 0.5;
    let inToken: OrcaPoolToken, outToken: OrcaPoolToken;
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
      await pool.swap(this.owner, inToken, inAmount, outAmount)
    ).execute();
    console.log("Swapped:", swap, "\n");
  }
}
