import { 
    ChainId, 
    Token, 
    Fetcher,
    Route,
    Trade,
    TokenAmount,
    TradeType,
} from "sushi-sdk";
import { SushiClient } from "../../src/types/SushiClient";

class SushiTrade {
    public WETH_addr = "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6";
    public USDC_addr = "0xD87Ba7A50B2E7E660f678A895E4B72E7CB4CCd9C";
    public DAI_addr = "0x11fE4B6AE13d2a6055C8D9cF65c55bac32B5d844";

    public sushiClient: SushiClient;

    public init() {
        this.sushiClient = await ethers.getContract
    }

}



const main = async () => {
  try {
    const chainId = ChainId.GÖRLI;
    const DAI: Token = await Fetcher.fetchTokenData(chainId,DAI_addr);
    const USDC: Token = await Fetcher.fetchTokenData(chainId,USDC_addr);
    const WETH: Token = await Fetcher.fetchTokenData(chainId,WETH_addr);

    const DAI_WETH_pair = await Fetcher.fetchPairData(DAI, WETH[DAI.chainId]);
    const DAI_for_WETH_route = new Route([DAI_WETH_pair], WETH[DAI.chainId]);
    const amountIn = "1000000000000000000";
    const trade = new Trade(
        DAI_for_WETH_route,
        new TokenAmount(WETH[DAI.chainId], amountIn),
        TradeType.EXACT_INPUT
    );
    

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
