pragma solidity ^0.5.0;

import { EIP712 } from "./EIP712.sol";

contract EIP712Demo is EIP712 {

    mapping(address => int) values;

    // EIP712 domain separtor
    bytes32 private constant DEMO_DOMAIN_SALT = 0xb225c57bf2111d6955b97ef0f55525b5a400dc909a5506e34b102e193dd53406;
    bytes32 private constant DEMO_DOMAIN_NAME_HASH = keccak256("EIP712Demo.Set");
    bytes32 private constant DEMO_DOMAIN_VERSION_HASH = keccak256("v1");
    bytes32 private DEMO_DOMAIN_SEPARATOR;
    // EIP712 type definitions
    bytes32 private constant CONTAINER_TYPE_HASH = keccak256("Container(int256 val)");
    bytes32 private constant DEMO_TYPE_HASH = keccak256("EIP712Demo(address whose,Container container)Container(int256 val)");

    constructor(uint256 chainId) public {
        DEMO_DOMAIN_SEPARATOR = EIP712.buildDomainSeparator(
            DEMO_DOMAIN_NAME_HASH,
            DEMO_DOMAIN_VERSION_HASH,
            chainId,
            address(this),
            DEMO_DOMAIN_SALT);
    }

    function set(int val) public {
        values[msg.sender] = val;
    }

    function get(address whose) public view returns (int) {
        return values[whose];
    }

    /**
     * Set the value on behalf of someone else by holding a valid EIP-712 signature
     * of that person.
     */
    function eip712_set(address whose, int val,
        uint8 v, bytes32 r, bytes32 s) public {
        bytes32 containerHash =  keccak256(abi.encode(
            CONTAINER_TYPE_HASH,
            val));
        bytes32 demoHash =  keccak256(abi.encode(
            DEMO_TYPE_HASH,
            whose,
            containerHash));
        require(EIP712.validateMessageSignature(DEMO_DOMAIN_SEPARATOR, demoHash, v, r, s, whose), "Invalid signature");
        values[whose] = val;
    }
}
