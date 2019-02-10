const EIP712Demo = artifacts.require("./EIP712Demo.sol");
const EIP712 = require("..");

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
};

function web3tx(fn, msg, expects = {}) {
    return async function() {
        console.log(msg + ": started");
        let r = await fn.apply(null, arguments);
        let transactionHash, receipt, tx;
        // in case of contract.sendtransaction
        if (r.tx) {
            transactionHash = r.tx;
            receipt = r.receipt;
        }
        // in case of contract.new
        if (r.transactionHash) {
            transactionHash = r.transactionHash;
            receipt = await web3.eth.getTransactionReceipt(transactionHash);
        }

        tx = await web3.eth.getTransaction(transactionHash);
        r.receipt = receipt;

        let gasPrice = web3.utils.fromWei(tx.gasPrice, "gwei");
        console.log(`${msg}: done, gas used ${receipt.gasUsed}, gas price ${gasPrice} Gwei`);
        return r;
    };
}

contract("EIP712",  accounts => {

    let chainId;

    before(async function () {
        chainId = await web3.eth.net.getId();
    });

    it("normal get/set", async function () {
        const demo = await web3tx(EIP712Demo.new, "EIP712Demo.new")(chainId);
        await web3tx(demo.set, "demo.set 42 from: acc0")(42, { from: accounts[0] });
        await web3tx(demo.set, "demo.set 42 from: acc1")(43, { from: accounts[1] });
        assert.equal((await demo.get.call(accounts[0])).toString(), "42");
        assert.equal((await demo.get.call(accounts[1])).toString(), "43");
    });

    it("eip712 set", async function () {
        const demo = await web3tx(EIP712Demo.new, "EIP712Demo.new")(chainId);

        // create EIP712 signature
        const typedData = EIP712.createTypeData(
            DEMO_TYPES,
            "EIP712Demo",
            new EIP712.DomainData(
                "EIP712Demo.Set",
                "v1",
                chainId,
                demo.address,
                "0xb225c57bf2111d6955b97ef0f55525b5a400dc909a5506e34b102e193dd53406"
            ), {
                whose: accounts[1],
                container: {
                    val: 42
                }
            });
        const sig = await EIP712.signTypedData(web3, accounts[1], typedData);

        await web3tx(demo.eip712_set, "demo.eip712_set acc1 42 right signature from: acc0")(
            accounts[1], 42,
            sig.v, sig.r, sig.s,
            { from: accounts[0] });
        assert.equal((await demo.get.call(accounts[1])).toString(), "42");

        // sign with wrong signature
        const badSig = await EIP712.signTypedData(web3, accounts[2], typedData);
        let errorCaught = {};
        try {
            await web3tx(demo.eip712_set, "demo.eip712_set acc1 42 bad signature from: acc0")(
                accounts[2], 42,
                badSig.v, badSig.r, badSig.s,
                { from: accounts[0] });
        } catch(err) {
            errorCaught = err;
        }
        assert.equal(errorCaught.reason, "Invalid signature");
    });
});
