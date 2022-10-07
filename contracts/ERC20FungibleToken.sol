// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "../node_modules/@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract ERC20FungibleToken {
  function transferFrom(address token, address sender, address recipient, uint256 amount) public returns (bool result) {
        (bool success, ) = token.delegatecall(
          abi.encodeWithSelector(
              IERC20.transferFrom.selector,
              sender,
              recipient,
              amount
          )
      );
      return success;
  }

  function checkAllowance(address token, address owner, address spender) public view returns (uint256){
      return IERC20(token).allowance(owner, spender);
  }

  function approve(address token, address spender, uint256 amount) public returns (bool result) {
      (bool success, ) = token.delegatecall(
          abi.encodeWithSelector(
              IERC20.approve.selector,
              spender,
              amount
          )
      );
      return success;
  }
  fallback () external{}
}