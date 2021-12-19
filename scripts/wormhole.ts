import {
  transferFromEth,
  parseSequenceFromLogEth,
  getEmitterAddressEth,
  getSignedVAA,
  postVaaSolana,
  redeemOnSolana,
  ChainId,
  transferFromSolana,
  nativeToHexString,
  hexToUint8Array,
  parseSequenceFromLogSolana,
  getEmitterAddressSolana,
  redeemOnEth,
} from "@certusone/wormhole-sdk";
import { readFile } from "mz/fs";
import { Wallet, BigNumber } from "ethers";
import { Connection, Keypair, Signer } from "@solana/web3.js";
import { envconfig } from "../utils/config";
import hre, { ethers } from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import nacl from "tweetnacl";
import { sign } from "crypto";
import { connect } from "http2";
const hh: HardhatRuntimeEnvironment = hre;

export class WormholeClient {
  //Goerli
  public ETH_BRIDGE_ADDRESS = "0x706abc4E45D419950511e474C7B9Ed348A4a716c";
  public ETH_TOKEN_BRIDGE_ADDRESS =
    "0xF890982f9310df57d00f659cf4fd87e65adEd8d7";
  public CHAIN_ID_ETH = 2;

  //Devnet
  public SOL_BRIDGE_ADDRESS = "3u8hJUVTA4jH1wYAyUur7FFZVQ8H635K3tSHHF4ssjQ5";
  public SOL_TOKEN_BRIDGE_ADDRESS =
    "DZnkkTmCiFWfYTfT41X3Rd1kDgozqzxWaHqsw6W4x2oe";
  public CHAIN_ID_SOLANA = 1;
  public connection = new Connection(
    "https://api.devnet.solana.com",
    "singleGossip"
  );

  public WORMHOLE_RPC_HOST = "https://wormhole-v2-testnet-api.certus.one";

  private async getKeyPair(): Promise<Keypair> {
    const secretKeyString = await readFile(envconfig.solana_wallet_path, {
      encoding: "utf8",
    });
    const secretKey = Uint8Array.from(JSON.parse(secretKeyString));
    return Keypair.fromSecretKey(secretKey);
  }
  public async solWallet(): Promise<Uint8Array> {
    const secretKeyString = await readFile(envconfig.solana_wallet_path, {
      encoding: "utf8",
    });
    const secretKey = Uint8Array.from(JSON.parse(secretKeyString));
    return Keypair.fromSecretKey(secretKey).publicKey.toBytes();
  }

  public async EthToSol(tokenAddress: string, amount: BigNumber) {
    // Submit transaction - results in a Wormhole message being published
    const receipt = await transferFromEth(
      this.ETH_TOKEN_BRIDGE_ADDRESS,
      (
        await hre.ethers.getSigners()
      )[0],
      tokenAddress,
      amount,
      this.CHAIN_ID_SOLANA as ChainId,
      await this.solWallet()
    );
    // Get the sequence number and emitter address required to fetch the signedVAA of our message
    const sequence = parseSequenceFromLogEth(receipt, this.ETH_BRIDGE_ADDRESS);
    const emitterAddress = getEmitterAddressEth(this.ETH_TOKEN_BRIDGE_ADDRESS);
    // Fetch the signedVAA from the Wormhole Network (this may require retries while you wait for confirmation)
    const { vaaBytes } = await getSignedVAA(
      this.WORMHOLE_RPC_HOST,
      this.CHAIN_ID_ETH as ChainId,
      emitterAddress,
      sequence
    );
    // On Solana, we have to post the signedVAA ourselves
    await postVaaSolana(
      this.connection,
      async (transaction) => {
        transaction.partialSign(await this.getKeyPair());
        return transaction;
      },
      this.SOL_BRIDGE_ADDRESS,
      (await this.getKeyPair()).publicKey.toString(),
      Buffer.from(vaaBytes)
    );
    // Finally, redeem on Solana
    let transaction = await redeemOnSolana(
      this.connection,
      this.SOL_BRIDGE_ADDRESS,
      this.SOL_TOKEN_BRIDGE_ADDRESS,
      (await this.getKeyPair()).publicKey.toString(),
      vaaBytes
    );

    const transactionBuffer = transaction.serializeMessage();
    const signature = nacl.sign.detached(
      transactionBuffer,
      (await this.getKeyPair()).secretKey
    );

    transaction.addSignature(
      (await this.getKeyPair()).publicKey,
      Buffer.from(signature)
    );

    const txid = await this.connection.sendRawTransaction(
      transaction.serialize()
    );
    await this.connection.confirmTransaction(txid);
  }

  public async SolToEth(tokenAddressSol: string, amount: BigNumber) {
    // Submit transaction - results in a Wormhole message being published
    const transaction = await transferFromSolana(
      this.connection,
      this.SOL_BRIDGE_ADDRESS,
      this.SOL_TOKEN_BRIDGE_ADDRESS,
      (await this.getKeyPair()).publicKey.toString(),
      (await this.getKeyPair()).publicKey.toString(),
      tokenAddressSol,
      amount.toBigInt(),
      hexToUint8Array(
        nativeToHexString(
          (
            await hre.ethers.getSigners()
          )[0].address,
          this.CHAIN_ID_ETH as ChainId
        ) || ""
      ),
      this.CHAIN_ID_ETH as ChainId
    );
    transaction.partialSign(await this.getKeyPair());
    // const signed = await wallet.signTransaction(transaction);
    const txid = await this.connection.sendRawTransaction(
      transaction.serialize()
    );
    await this.connection.confirmTransaction(txid);
    // Get the sequence number and emitter address required to fetch the signedVAA of our message
    const info = await this.connection.getTransaction(txid);
    if (!info) {
      throw new Error("Transaction not found");
    }
    const sequence = parseSequenceFromLogSolana(info);
    const emitterAddress = await getEmitterAddressSolana(
      this.SOL_TOKEN_BRIDGE_ADDRESS
    );
    // Fetch the signedVAA from the Wormhole Network (this may require retries while you wait for confirmation)
    const { vaaBytes: signedVAA } = await getSignedVAA(
      this.WORMHOLE_RPC_HOST,
      this.CHAIN_ID_SOLANA as ChainId,
      emitterAddress,
      sequence
    );
    // Redeem on Ethereum
    await redeemOnEth(
      this.ETH_TOKEN_BRIDGE_ADDRESS,
      (
        await hre.ethers.getSigners()
      )[0],
      signedVAA
    );
  }
}
