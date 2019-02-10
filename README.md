# Summary

Helpers to implement _EIP-712_. Including js helpers for creating _EIP-712_ signatures and a solidity contract for validating _EIP-712_ signatures.

_EIP-712_ is a standard for Ethereum typed structured data hashing and signing. For more information, read the [EIP-712](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-712.md)

# Usages

## Step 1 - define message types

You should list all types that are used for signing the signature. And you should also pick one of them as the primary type where your message is defined.

For example:

```
const DEMO_TYPES = {
    EIP712Demo: [
        {
            type: "address",
            name: "whose",
        },
        {
            type: "Container",
            name: "container",
        },
    ],

    Container: [
        {
            type: "int256",
            name: "val"
        }
    ]
}
```

In this case, `EIP712Demo` is the primary type.

## Step 2 - create the message hash and signature

Import this helper library as `EIP712`.

Create the type data using the `createTypeData` helper function:

```
const typedData = EIP712.createTypeData(
    DEMO_TYPES,
    "EIP712Demo",
    new EIP712.DomainData(
        "EIP712Demo.Set", // domain name
        "v1", // domain version
        chainId,
        demo.address,
        "0xb225c57bf2111d6955b97ef0f55525b5a400dc909a5506e34b102e193dd53406"
    ), {
        whose: accounts[1],
        container: {
            val: 42
        }
    });
```

Sign the typed data signature with the `signTypedData` helper function:

```
const sig = await EIP712.signTypedData(web3, accounts[1], typedData);
// You should now use: sig.v, sig.r, sig.s,
```

## Step 3 - validate the message signature in solidity

Import `EIP712` from the `EIP712.sol`

### Build domain separator once in the constructor:

```
    // EIP712 domain separtor
    bytes32 private constant DEMO_DOMAIN_SALT = 0xb225c57bf2111d6955b97ef0f55525b5a400dc909a5506e34b102e193dd53406;
    bytes32 private constant DEMO_DOMAIN_NAME_HASH = keccak256("EIP712Demo.Set");
    bytes32 private constant DEMO_DOMAIN_VERSION_HASH = keccak256("v1");
    bytes32 private DEMO_DOMAIN_SEPARATOR;

    constructor(uint256 chainId) public {
        DEMO_DOMAIN_SEPARATOR = EIP712.buildDomainSeparator(
            DEMO_DOMAIN_NAME_HASH,
            DEMO_DOMAIN_VERSION_HASH,
            chainId,
            address(this),
            DEMO_DOMAIN_SALT);
    }
```

Note that the domain name, the domain version, the salt have to match the ones you used in the javascript.

Define types hashes:

```
// EIP712 type definitions
bytes32 private constant CONTAINER_TYPE_HASH = keccak256("Container(int256 val)");
bytes32 private constant DEMO_TYPE_HASH = keccak256("EIP712Demo(address whose,Container container)Container(int256 val)");
```

Note that as a compound type, `EIP712Demo` has to include its composite types according to the standard: "If the struct type references other struct types (and these in turn reference even more struct types), then the set of referenced struct types is collected, sorted by name and appended to the encoding. An example encoding is Transaction(Person from,Person to,Asset tx)Asset(address token,uint256 amount)Person(address wallet,string name)."

Create message hashes and validate the signature:

```
bytes32 containerHash =  keccak256(abi.encode(
    CONTAINER_TYPE_HASH,
    val));
bytes32 demoHash =  keccak256(abi.encode(
    DEMO_TYPE_HASH,
    whose,
    containerHash));
require(EIP712.validateMessageSignature(DEMO_DOMAIN_SEPARATOR, demoHash, v, r, s, whose), "Invalid signature");
```

# Example

Checkout the test code for an actual example: `test/eip712.test.js`
