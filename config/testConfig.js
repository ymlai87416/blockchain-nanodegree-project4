
var FlightSuretyApp = artifacts.require("FlightSuretyApp");
var FlightSuretyData = artifacts.require("FlightSuretyData");
var BigNumber = require('bignumber.js');

var Config = async function(accounts) {
    
    // These test addresses are useful when you need to add
    // multiple users in test scripts
    /*
    let testAddresses = [
        "0x69e1CB5cFcA8A311586e3406ed0301C06fb839a2",
        "0xF014343BDFFbED8660A9d8721deC985126f189F3",
        "0x0E79EDbD6A727CfeE09A2b1d0A59F7752d5bf7C9",
        "0x9bC1169Ca09555bf2721A5C9eC6D69c8073bfeB4",
        "0xa23eAEf02F9E0338EEcDa8Fdd0A73aDD781b2A86",
        "0x6b85cc8f612d5457d49775439335f83e12b8cfde",
        "0xcbd22ff1ded1423fbc24a7af2148745878800024",
        "0xc257274276a4e539741ca11b590b9447b26a8051",
        "0x2f2899d6d35b1a48a4fbdc93a37a72f264a9fca7"
    ];
    */

    //generate more address from https://iancoleman.io/bip39/
    let testAddresses = [
        '0x69e1CB5cFcA8A311586e3406ed0301C06fb839a2',
        '0xF014343BDFFbED8660A9d8721deC985126f189F3',
        '0x0E79EDbD6A727CfeE09A2b1d0A59F7752d5bf7C9',
        '0x9bC1169Ca09555bf2721A5C9eC6D69c8073bfeB4',
        '0xa23eAEf02F9E0338EEcDa8Fdd0A73aDD781b2A86',
        '0xc449a27B106BE1120Bd1Fd62F8166A2F61588eb9',
        '0xF24AE9CE9B62d83059BD849b9F36d3f4792F5081',
        '0xc44B027a94913FB515B19F04CAf515e74AE24FD6',
        '0xcb0236B37Ff19001633E38808bd124b60B1fE1ba',
        '0x715e632C0FE0d07D02fC3d2Cf630d11e1A45C522',
        '0x90FFD070a8333ACB4Ac1b8EBa59a77f9f1001819',
        '0x036945CD50df76077cb2D6CF5293B32252BCe247',
        '0x23f0227FB09D50477331D2BB8519A38a52B9dFAF',
        '0x799759c45265B96cac16b88A7084C068d38aFce9',
        '0xA6BFE07B18Df9E42F0086D2FCe9334B701868314',
        '0x39Ae04B556bbdD73123Bab2d091DCD068144361F',
        '0x068729ec4f46330d9Af83f2f5AF1B155d957BD42',
        '0x9EE19563Df46208d4C1a11c9171216012E9ba2D0',
        '0x04ab41d3d5147c5d2BdC3BcFC5e62539fd7e428B',
        '0xeF264a86495fF640481D7AC16200A623c92D1E37',
        '0x645FdC97c87c437da6b11b72471a703dF3702813',
        '0xbE6f5bF50087332024634d028eCF896C7b482Ab1',
        '0xcE527c7372B73C77F3A349bfBce74a6F5D800d8E',
        '0x21ec0514bfFefF9E0EE317b8c87657E4a30F4Fb2',
        '0xEAA2fc390D0eC1d047dCC1210a9Bf643d12de330',
        '0xC5fa34ECBaF44181f1d144C13FBaEd69e76b80f1',
        '0x4F388EE383f1634d952a5Ed8e032Dc27094f44FD',
        '0xeEf5E3535aA39e0C2266BbA234E187adA9ed50A1',
        '0x6008E128477ceEE5561fE2dEAdD82564d29fD249',
        '0xfEf504C230aA4c42707FcBFfa46aE640498BC2cb',
        '0x70C8F02D4e44d906e80a8d0b1591Ab569a20Ae9C',
        '0x53eF3e89950e97bAD7d027F41ab05debc7Bb5c74',
        '0xE3c27A49b81a7D59DC516D58ab2E5ee6A545c008',
        '0xc496E6FEACf5D7ee4E1609179fA4C1D1698116ec',
        '0x5598CA13044003326C25459B4E9B778922C8a00e',
        '0x5Fb25C1c734D077fdFb603E9f586Bee11706a042',
        '0x3E5a0f348C831b489deC1be087f8Ef182A4CfE54',
        '0x6a90Ed741Fe4B87545a127879bA18F41FD17fdB5',
        '0xa1AD47355B994Cc18Bd709789055DeFD54e738E3'
    ];

    let owner = accounts[0];
    let firstAirline = accounts[1];

    let flightSuretyData = await FlightSuretyData.new();
    let flightSuretyApp = await FlightSuretyApp.new(flightSuretyData.address);

    return {
        owner: owner,
        firstAirline: firstAirline,
        weiMultiple: (new BigNumber(10)).pow(18),
        testAddresses: testAddresses,
        flightSuretyData: flightSuretyData,
        flightSuretyApp: flightSuretyApp
    };
}

module.exports = {
    Config: Config
};