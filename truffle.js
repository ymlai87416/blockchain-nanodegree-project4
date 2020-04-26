var HDWalletProvider = require("truffle-hdwallet-provider");
//var mnemonic = "candy maple cake sugar pudding cream honey rich smooth crumble sweet treat";
const infuraKey = "2c39affa373243a8acb74f3a0c0c7731";
const mnemonic = "number maid remain party need hat aerobic video surround word math journey"

module.exports = {
  networks: {
    development: {
      /*provider: function() {
        return new HDWalletProvider(mnemonic, "http://127.0.0.1:8545/", 0, 50);
      },*/
      host:"127.0.0.1",
      port:8545,
      network_id: '*',
      gas: 9999999,
      accounts: 50,
    },
    rinkeby: {
      provider: () => new HDWalletProvider(mnemonic, `https://rinkeby.infura.io/v3/${infuraKey}`),
        network_id: 4,       // rinkeby's id
        gas: 10000000,        // rinkeby has a lower block limit than mainnet
        gasPrice: 10000000000
    },
  },
  compilers: {
    solc: {
      version: "^0.4.24"
    }
  }
};