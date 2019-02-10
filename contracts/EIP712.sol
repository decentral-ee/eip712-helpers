pragma solidity ^0.5.0;

/**
 * @title EIP712 helper contract
 * @author Miao ZhiCheng <miao@decentral.ee>
 */
contract EIP712 {
    bytes32 private constant DOMAIN_TYPEHASH = keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract,bytes32 salt)");

    /**
     * @notice Build a EIP712 domain separtor
     * @param domainNameHash    - hash of the domain name
     * @param domainVersionHash - hash of the domain version
     * @param chainId           - ID used to make signatures unique in different network
     * @param contractAddress   - Optionally to make signatures unique for different instance of the contract
     * @param domainSalt        - Furtherly to make signatures unique for other circumstances
     * @return the domain separator in bytes32
     */
    function buildDomainSeparator(
        bytes32 domainNameHash,
        bytes32 domainVersionHash,
        uint256 chainId,
        address contractAddress,
        bytes32 domainSalt
        ) internal pure returns (bytes32) {
        return keccak256(abi.encode(
            DOMAIN_TYPEHASH,
            domainNameHash,
            domainVersionHash,
            chainId,
            contractAddress,
            domainSalt));
    }

    /**
     * @notice Valid a EIP712 signature
     * @param domainSeparator      - the domain separator for the message
     * @param messageHash          - hash of the message constructed according to EIP712
     * @param v                    - signature v component
     * @param r                    - signature r component
     * @param s                    - signature s component
     * @return whether if the signature is valid
     */
    function validateMessageSignature(
        bytes32 domainSeparator,
        bytes32 messageHash,
        uint8 v, bytes32 r, bytes32 s, address signedByWhom) internal pure returns (bool) {
        bytes32 fullhash = keccak256(abi.encodePacked(
            "\x19\x01",
            domainSeparator,
            messageHash));
        return ecrecover(fullhash, v, r, s) == signedByWhom;
    }
}

