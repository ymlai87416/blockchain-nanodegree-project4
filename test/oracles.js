
var Test = require('../config/testConfig.js');
//var BigNumber = require('bignumber.js');

contract('Oracles', async (accounts) => {

  const TEST_ORACLES_COUNT = 30;

  // Watch contract events
  const STATUS_CODE_UNKNOWN = 0;
  const STATUS_CODE_ON_TIME = 10;
  const STATUS_CODE_LATE_AIRLINE = 20;
  const STATUS_CODE_LATE_WEATHER = 30;
  const STATUS_CODE_LATE_TECHNICAL = 40;
  const STATUS_CODE_LATE_OTHER = 50;

  var config;
  before('setup contract', async () => {
    config = await Test.Config(accounts);
    //console.log(accounts);
    let fund = web3.utils.toWei("10", "ether");

    await config.flightSuretyData.authorizeCaller(config.flightSuretyApp.address);
    await config.flightSuretyApp.registerAirline(config.firstAirline);
    await config.flightSuretyApp.AirlineFunding({from: config.firstAirline, value: fund});
  });


  it('can register oracles', async () => {
    
    // ARRANGE
    let fee = await config.flightSuretyApp.REGISTRATION_FEE.call();

    // ACT
    for(let a=1; a<TEST_ORACLES_COUNT; a++) {  
      await config.flightSuretyApp.registerOracle({ from: config.testAddresses[a], value: fee });
      let result = await config.flightSuretyApp.getMyIndexes.call({from: config.testAddresses[a]});
      console.log(`Oracle Registered: ${result[0]}, ${result[1]}, ${result[2]}`);
    }
  });

  it('can request flight status', async () => {
    
    // ARRANGE
    let flight = 'ND1309'; // Course number
    let timestamp = Math.floor(Date.now() / 1000);
    let fund = web3.utils.toWei("1", "ether");

    //buy insurance
    await config.flightSuretyApp.registerFlight(config.firstAirline, flight, timestamp, {from: '0x2191eF87E392377ec08E7c08Eb105Ef5448eCED5', value: fund});

    // Submit a request for oracles to get status information for a flight
    await config.flightSuretyApp.fetchFlightStatus(config.firstAirline, flight, timestamp);
    // ACT

    // Since the Index assigned to each test account is opaque by design
    // loop through all the accounts and for each account, all its Indexes (indices?)
    // and submit a response. The contract will reject a submission if it was
    // not requested so while sub-optimal, it's a good test of that feature
    var success = 0;
    var failed = 0;
    var eventEmitted = false;
    var status = -1;

    //seems not working
    var event = config.flightSuretyApp.FlightStatusInfo
    await event({}, (err, res) => {

    })

    for(let a=1; a<TEST_ORACLES_COUNT; a++) {

      // Get oracle information
      let oracleIndexes = await config.flightSuretyApp.getMyIndexes.call({ from: config.testAddresses[a]});
      
      for(let idx=0;idx<3;idx++) {

        try {
          // Submit a response...it will only be accepted if there is an Index match
          await config.flightSuretyApp.submitOracleResponse.sendTransaction(oracleIndexes[idx], config.firstAirline, flight, timestamp, STATUS_CODE_LATE_AIRLINE, { from: config.testAddresses[a] });
          success = success + 1;
          console.log('\nSuccess', idx, oracleIndexes[idx].toNumber(), flight, timestamp);
        }
        catch(e) {
          // Enable this when debugging
           console.log('\nError', idx, oracleIndexes[idx].toNumber(), flight, timestamp, e.message);
           failed = failed + 1;
        }
      }
    }

    console.log("No. of success: " + success + " No. of failed: " + failed);
    let bb = await config.flightSuretyApp.getBalance({from: '0x2191eF87E392377ec08E7c08Eb105Ef5448eCED5'});
    let balance = web3.utils.fromWei(bb, 'ether');
    let formattedValue = balance+ " ETH";

    console.log("Passenger balance " + formattedValue);
    let wamt = web3.utils.toWei('1', 'ether');
    await  config.flightSuretyApp.withdrawFunds(wamt, {from: '0x2191eF87E392377ec08E7c08Eb105Ef5448eCED5'});

    let bb2 = await config.flightSuretyApp.getBalance({from: '0x2191eF87E392377ec08E7c08Eb105Ef5448eCED5'});
    let balance2 = web3.utils.fromWei(bb2, 'ether');
    let formattedValue2 = balance2+ " ETH";
    console.log("Passenger balance " + formattedValue2);

  });


 
});
