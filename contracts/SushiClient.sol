// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

import "@sushiswap/core/contracts/uniswapv2/interfaces/IUniswapV2Router02.sol";
import "@sushiswap/core/contracts/uniswapv2/libraries/UniswapV2Library.sol";
import "@sushiswap/core/contracts/uniswapv2/interfaces/IUniswapV2Pair.sol";
import "@sushiswap/core/contracts/uniswapv2/interfaces/IUniswapV2Factory.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract SushiClient {
    string public greeting;

    IUniswapV2Router02 public sushiRouter;
    IUniswapV2Factory public sushiFactory;
    IERC20 public weth;
    IERC20 public usdc;
    IERC20 public dai;
    mapping(address => bool) public tokens;

    uint24 public slippageNumerator = 250_000;
    uint24 public slippageDenominator = 1_000_000;

    constructor() public {
        sushiRouter = IUniswapV2Router02(
            0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506
        );
        sushiFactory = IUniswapV2Factory(
            0xc35DADB65012eC5796536bD9864eD8773aBc74C4
        );
        weth = IERC20(0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6);
        usdc = IERC20(0xD87Ba7A50B2E7E660f678A895E4B72E7CB4CCd9C);
        dai = IERC20(0x11fE4B6AE13d2a6055C8D9cF65c55bac32B5d844);
        tokens[address(weth)] = true;
        tokens[address(usdc)] = true;
        tokens[address(dai)] = true;
        weth.approve(address(sushiRouter), 2**256 - 1);
        usdc.approve(address(sushiRouter), 2**256 - 1);
        dai.approve(address(sushiRouter), 2**256 - 1);
    }

    function swap(
        address _from,
        address _to,
        uint256 _amount
    ) internal {
        require(tokens[_from] && tokens[_to], "Token not supported");
        require(_amount > 0, "Amount must be greater than 0");
        IERC20(_from).transferFrom(msg.sender, address(this), _amount);
        address[] memory path = new address[](2);
        path[0] = _from;
        path[1] = _to;
        // IUniswapV2Factory factory = IUniswapV2Factory(sushi.factory());
        // address pairAddress = factory.getPair(_from, _to);
        // require(pairAddress != address(0), "This pool does not exist");

        uint256 amountOut = getAmountOut(path, _amount);
        sushiRouter.swapExactTokensForTokens(
            _amount,
            amountOut,
            path,
            msg.sender,
            block.timestamp
        );
    }

    // batch swap - take list of pairs and amounts and swap them all
    function batchSwap(
        address[] memory _from,
        address[] memory _to,
        uint256[] memory _amount
    ) external {
        require(
            _from.length == _to.length && _from.length == _amount.length,
            "Arrays must be the same length"
        );

        require(_from.length > 0, "Arrays must contain at least one element");

        for (uint256 i = 0; i < _from.length; i++) {
            swap(_from[i], _to[i], _amount[i]);
        }
    }

    function batchSybilSwap(
        address _from,
        address _to,
        uint256[] memory _amount
    ) external {
        for (uint256 i = 0; i < _amount.length; i++) {
            swap(_from, _to, _amount[i]);
        }
    }

    function getAmountOut(address[] memory path, uint256 amountIn)
        public
        view
        returns (uint256)
    {
        uint256 amountOut = UniswapV2Library.getAmountsOut(
            address(sushiFactory),
            amountIn,
            path
        )[0];
        uint256 amountOutLessSlippage = (amountOut *
            (slippageDenominator - slippageNumerator)) / slippageDenominator;
        return amountOutLessSlippage;
    }
}
