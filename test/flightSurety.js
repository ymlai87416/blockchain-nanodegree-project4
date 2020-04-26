
var Test = require('../config/testConfig.js');
var BigNumber = require('bignumber.js');

contract('Flight Surety Tests', async (accounts) => {

  var config;
  before('setup contract', async () => {
    config = await Test.Config(accounts);
    await config.flightSuretyData.authorizeCaller(config.flightSuretyApp.address);
    await config.flightSuretyApp.registerAirline(config.firstAirline, {from: config.owner});
  });

  /****************************************************************************************/
  /* Operations and Settings                                                              */
  /****************************************************************************************/

  it(`(multiparty) has correct initial isOperational() value`, async function () {

    // Get operating status
    let status = await config.flightSuretyData.isOperational.call();
    assert.equal(status, true, "Incorrect initial operating status value");

  });

  it(`(multiparty) can block access to setOperatingStatus() for non-Contract Owner account`, async function () {

      // Ensure that access is denied for non-Contract Owner account
      let accessDenied = false;
      try 
      {
          await config.flightSuretyData.setOperatingStatus(false, { from: config.testAddresses[2] });
      }
      catch(e) {
          accessDenied = true;
      }
      assert.equal(accessDenied, true, "Access not restricted to Contract Owner");
            
  });

  it(`(multiparty) can allow access to setOperatingStatus() for Contract Owner account`, async function () {

      // Ensure that access is allowed for Contract Owner account
      let accessDenied = false;
      try 
      {
          await config.flightSuretyData.setOperatingStatus(false);
      }
      catch(e) {
          accessDenied = true;
      }
      assert.equal(accessDenied, false, "Access not restricted to Contract Owner");
      
  });

  it(`(multiparty) can block access to functions using requireIsOperational when operating status is false`, async function () {

      await config.flightSuretyData.setOperatingStatus(false);

      let reverted = false;
      try 
      {
          await config.flightSurety.setTestingMode(true);
      }
      catch(e) {
          reverted = true;
      }
      assert.equal(reverted, true, "Access not blocked for requireIsOperational");      

      // Set it back for other tests to work
      await config.flightSuretyData.setOperatingStatus(true);

  });

  it('(airline) cannot register an Airline using registerAirline() if it is not funded', async () => {
    
    // ARRANGE
    let newAirline = accounts[2];

    // ACT
    try {
        await config.flightSuretyApp.registerAirline(newAirline, {from: config.firstAirline});
    }
    catch(e) {

    }
    let result = await config.flightSuretyData.isAirlineRegistered.call(newAirline); 

    // ASSERT
    assert.equal(result.registered, false, "Airline should not be able to register another airline if it hasn't provided funding");

  });


  it('(airline) Airline can make a deposit', async () => {
    
    // ARRANGE
    let fund = web3.utils.toWei("10", "ether");
    const balanceOfUser2BeforeTransaction = await web3.eth.getBalance(config.firstAirline);
    // ACT
    try {
        await config.flightSuretyApp.AirlineFunding({from: config.firstAirline, value: fund});
    }
    catch(e) {
        assert.ok(false, e.message)
    }
    const balanceOfUser2AfterTransaction = await web3.eth.getBalance(config.firstAirline);

    let value = Number(balanceOfUser2BeforeTransaction) - Number(balanceOfUser2AfterTransaction);

    // ASSERT
    assert.ok(value > fund, "Airline should be able to make a deposit");
  });

  it('(airline) can register an Airline using registerAirline() after it is funded', async () => {
    
    // ARRANGE
    let newAirline = accounts[2];

    // ACT
    try {
        await config.flightSuretyApp.registerAirline(newAirline, {from: config.firstAirline});
    }
    catch(e) {

    }
    let result = await config.flightSuretyData.isAirlineRegistered.call(newAirline); 

    // ASSERT
    assert.equal(result.registered, true, "Airline should be able to register another airline if it has provided funding");

  });

  it('(passenger) can purchase insurance from a registered and funded airline', async () => {
    
    // ARRANGE
    let firstAirline = accounts[1];
    let flight = 'ND1309'; // Course number
    let timestamp = Math.floor(Date.parse('04/20/2020 17:00:00') / 1000);
    let passenger = accounts[5];
    let fund = web3.utils.toWei("1", "ether");
    let result = false;
    // ACT
    try {
        result = await config.flightSuretyApp.registerFlight(firstAirline, flight, timestamp, {from: passenger, value:fund});
    }
    catch(e) {
      assert.ok(false, e.message);
    }

  });
 
  it('(passenger) cannot purchase insurance worth more than 1 ether', async () => {
    
    // ARRANGE
    let firstAirline = accounts[1];
    let flight = 'ND1309'; // Course number
    let timestamp = Math.floor(Date.parse('04/25/2020 17:00:00') / 1000);
    let passenger = accounts[5];
    let fund = web3.utils.toWei("2", "ether");
    let result = false

    // ACT
    try {
        result = await config.flightSuretyApp.registerFlight(firstAirline, flight, timestamp, {from: passenger, value:fund});
        assert.ok(false, "passenger should not purchase insurance worth more than 1 ether");
    }
    catch(e) {

    }
    
  });
});
