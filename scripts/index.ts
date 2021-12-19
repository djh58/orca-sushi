import { Address } from "hardhat-deploy/dist/types";
import { OrcaTrade } from "./orca";
import { SushiTrade, hh } from "./sushi";
import { WormholeClient } from "./wormhole";

class SybilAgent {
  public sushi = new SushiTrade();
  public orca = new OrcaTrade();
  public wormhole = new WormholeClient();

  public async init() {
    await this.sushi.init();
    await this.orca.init();
  }

  public async generateSushiSybilActions(
    start_asset: string,
    end_asset: string,
    num_actions: number
  ) {
    await this.sushi.generateSushiSybilActions(
      start_asset,
      end_asset,
      num_actions
    );
  }

  public async generateSybilAction(start_asset: string, end_asset: string) {
    enum scenario {
      SUSHI_TO_SUSHI,
      SUSHI_TO_ORCA,
      ORCA_TO_SUSHI,
      ORCA_TO_ORCA,
    }
    const action_type = Math.floor(Math.random() * 4);
    switch (action_type as scenario) {
      case scenario.SUSHI_TO_SUSHI:
        await this.generateSushiSybilActions(start_asset, end_asset, 1);
        break;
      case scenario.SUSHI_TO_ORCA:
        await this.generateSushiSybilActions(start_asset, end_asset, 1);
        await this.wormhole.EthToSol(
          start_asset,
          hh.ethers.utils.parseEther(Math.random().toString())
        );
        await this.orca.randomSwap(start_asset, end_asset);
        break;
      case scenario.ORCA_TO_SUSHI:
        await this.orca.randomSwap(start_asset, end_asset);
        await this.wormhole.SolToEth(
          end_asset,
          hh.ethers.utils.parseEther(Math.random().toString())
        );
        await this.generateSushiSybilActions(start_asset, end_asset, 1);
        break;
      case scenario.ORCA_TO_ORCA:
        await this.orca.randomSwap(start_asset, end_asset);
        break;
      default:
        break;
    }
  }
}
