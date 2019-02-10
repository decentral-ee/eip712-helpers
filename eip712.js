const DOMAON_TYPE = [
    {
        type: "string",
        name: "name"
    },
    {
        type: "string",
        name: "version"
    },
    {
        type: "uint256",
        name: "chainId"
    },
    {
        type: "address",
        name: "verifyingContract"
    },
    {
        type: "bytes32",
        name: "salt"
    },
];

function DomainData(name, version, chainId, verifyingContract, salt) {
    this.name = name;
    this.version = version;
    this.chainId = chainId;
    this.verifyingContract = verifyingContract;
    this.salt = salt;
}
DomainData.prototype.toString = function() {
    return `EIP712 Domain: ${this.name}@${this.version}`;
};

module.exports = {
    DOMAON_TYPE,

    DomainData,

    createTypeData: function (types, primaryType, domainData, message) {
        return {
            types: Object.assign({
                EIP712Domain: DOMAON_TYPE,
            }, types),
            domain: domainData,
            primaryType: primaryType,
            message: message
        };
    },

    signTypedData: function (web3, from, data) {
        return new Promise(async (resolve, reject) => {
            function cb(err, result) {
                if (err) {
                    return reject(err);
                }
                if (result.error) {
                    return reject(result.error);
                }

                const sig = result.result;
                const sig0 = sig.substring(2);
                const r = "0x" + sig0.substring(0, 64);
                const s = "0x" + sig0.substring(64, 128);
                const v = parseInt(sig0.substring(128, 130), 16);

                resolve({
                    data,
                    sig,
                    v, r, s
                });
            }
            if (web3.currentProvider.isMetaMask) {
                web3.currentProvider.sendAsync({
                    jsonrpc: "2.0",
                    method: "eth_signTypedData_v3",
                    params: [from, JSON.stringify(data)],
                    id: new Date().getTime()
                }, cb);
            } else {
                let send = web3.currentProvider.sendAsync;
                if (!send) send = web3.currentProvider.send;
                send({
                    jsonrpc: "2.0",
                    method: "eth_signTypedData",
                    params: [from, data],
                    id: new Date().getTime()
                }, cb);
            }
        });
    }
};

