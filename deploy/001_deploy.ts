import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction, DeployResult } from "hardhat-deploy/types";
import { ethers } from "hardhat";
import { BigNumber } from "ethers";
import { Provider } from "@ethersproject/abstract-provider";
import { envconfig } from "../utils/config";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;

  const { deployer } = await getNamedAccounts();

  const res: DeployResult = await deploy("SushiClient", {
    from: deployer,
    log: true,
    autoMine: true,
  });
  const sushiClient = res.address;
  const uint256Max = hre.ethers.constants.MaxUint256;
  // const provider = new ethers.providers.JsonRpcProvider(
  //   envconfig.goerli.provider_url
  // );
  const signers = await hre.ethers.getSigners();
  const deployerSigner = await hre.ethers.getSigner(deployer); //signers[0];
  const dai = await hre.ethers.getContractAt(
    "IERC20",
    "0x11fE4B6AE13d2a6055C8D9cF65c55bac32B5d844",
    deployerSigner
  );
  const usdc = await hre.ethers.getContractAt(
    "IERC20",
    "0xD87Ba7A50B2E7E660f678A895E4B72E7CB4CCd9C",
    deployerSigner
  );
  const weth = await hre.ethers.getContractAt(
    "IERC20",
    "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6",
    deployerSigner
  );
  // get provider from envconfig.goerli.provider_url

  if ((await dai.allowance(deployer, sushiClient)) < uint256Max.toString()) {
    console.log("approving dai");
    const approveDai = await dai.approve(sushiClient, uint256Max);
    await approveDai.wait();
  }
  if ((await usdc.allowance(deployer, sushiClient)) < uint256Max.toString()) {
    console.log("approving usdc");
    const approveUsdc = await usdc.approve(sushiClient, uint256Max);
    await approveUsdc.wait();
  }
  if ((await weth.allowance(deployer, sushiClient)) < uint256Max.toString()) {
    console.log("approving weth");
    const approveWeth = await weth.approve(sushiClient, uint256Max);
    await approveWeth.wait();
  }
  console.log("All set!");
};
export default func;
func.tags = ["client"];
