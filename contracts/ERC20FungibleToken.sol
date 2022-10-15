// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "../node_modules/@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract ERC20FungibleToken {
  /// @notice Approve set amount as the allowance of spender over caller's tokens
  /// @param token address of tokens to approve
  /// @param spender address who will receive allowance
  /// @param amount that the spender is able to use
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

  /// @notice Check a spender accounts allowance
  /// @param token address of token you are checking allowance on
  /// @param owner address of caller
  /// @param spender the address with an allowance
  /// @return allowance The allowance of the spender over the callers tokens
  function checkAllowance(address token, address owner, address spender) public view returns (uint256 allowance){
      return IERC20(token).allowance(owner, spender);
  }

  /// @notice Transfer the set amount of token from the sender (from) to the recipeint (to) through allowance
  /// @param token address of the token
  /// @param sender  address with allowance (the from address)
  /// @param recipient address recieving token (the to address)
  /// @return result a bool whether it was successfuly or a failure
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
  fallback () external{}
}