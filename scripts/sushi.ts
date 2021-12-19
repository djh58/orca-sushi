import { SushiClient } from "../typechain/SushiClient";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import hre, { ethers } from "hardhat";
import { BigNumber } from "ethers";

export const hh: HardhatRuntimeEnvironment = hre;
export class SushiTrade {
  public WETH_addr = "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6";
  public USDC_addr = "0xD87Ba7A50B2E7E660f678A895E4B72E7CB4CCd9C";
  public DAI_addr = "0x11fE4B6AE13d2a6055C8D9cF65c55bac32B5d844";

  public user: string = "";

  public async init() {
    this.user = (await ethers.getSigners())[0].address;
  }

  public async sushiClient(): Promise<SushiClient> {
    return await ethers.getContract(
      "SushiClient",
      (
        await ethers.getSigners()
      )[0]
    );
  }

  // choose two tokens are random from WETH_addr, USDC_addr, DAI_addr
  private getRandomTokens(): string[] {
    const tokens: string[] = [];
    const tokenAddrs = [this.WETH_addr, this.USDC_addr, this.DAI_addr];
    const tokenAddr = tokenAddrs[Math.floor(Math.random() * 3)];
    tokens.push(tokenAddr);
    // remove tokenAddr from tokenAddrs
    tokenAddrs.splice(tokenAddrs.indexOf(tokenAddr), 1);

    const tokenAddr2 = tokenAddrs[Math.floor(Math.random() * 3)];
    tokens.push(tokenAddr2);
    tokenAddrs.splice(tokenAddrs.indexOf(tokenAddr2), 1);

    return tokens;
  }

  // get random amount from 0 to the user's balance of the token
  public async getRandomAmounts(
    tokenAddr: string,
    n: number
  ): Promise<BigNumber[]> {
    const token = await hh.ethers.getContractAt("IERC20", tokenAddr);
    let balance: BigNumber = await token.balanceOf(this.user);
    let amounts: BigNumber[] = [];
    // random number between 0 and balance
    for (var i = 0; i < n; i++) {
      const amount = balance.mul(Math.random());
      balance = balance.sub(amount);
      amounts.push(amount);
    }
    return amounts;
  }

  public async generateSushiSybilActions(
    start_asset: string,
    end_asset: string,
    num_actions: number
  ) {
    const amounts = await this.getRandomAmounts(start_asset, num_actions);
    await (
      await this.sushiClient()
    ).batchSybilSwap(start_asset, end_asset, amounts);
  }
}
