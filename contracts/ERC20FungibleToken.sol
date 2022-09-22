// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";

contract ERC20FungibleToken {

    function name(address token) public view returns(string memory) {
        return IERC20Metadata(token).name();
    }

    function symbol(address token) public view returns(string memory) {
        return IERC20Metadata(token).symbol();
    }

    function transferFrom(address token, address sender, address recipient, uint256 amount) public {
        IERC20(token).transferFrom(sender, recipient, amount);
    }

    function allowance(address token, address owner, address spender) public view {
        IERC20(token).allowance(owner, spender);
    }

    function approve(address token, address spender, uint256 amount) public {
        IERC20(token).approve(spender, amount);
    }
    
    fallback () external{}
}