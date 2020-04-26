import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import Config from './config.json';
import Web3 from 'web3';

export default class Contract {
    constructor(network, callback) {

        let config = Config[network];
        this.web3 = new Web3(new Web3.providers.HttpProvider(config.url));
        this.flightSuretyApp = new this.web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);
        this.initialize(callback);
        this.owner = null;
        this.airlines = [];
        this.passengers = [];
    }

    initialize(callback) {
        this.web3.eth.getAccounts((error, accts) => {
           
            this.owner = accts[0];

            let counter = 1;
            
            while(this.airlines.length < 5) {
                this.airlines.push(accts[counter++]);
            }

            while(this.passengers.length < 5) {
                this.passengers.push(accts[counter++]);
            }

            callback();
        });
    }

    isOperational(callback) {
       let self = this;
       self.flightSuretyApp.methods
            .isOperational()
            .call({ from: self.owner}, callback);
    }

    fetchFlightStatus(airline, flight, timestamp, callback) {
        let self = this;
        let payload = {
            airline: airline,
            flight: flight,
            timestamp: timestamp
        } 
        self.flightSuretyApp.methods
            .fetchFlightStatus(payload.airline, payload.flight, payload.timestamp)
            .send({ from: self.owner}, (error, result) => {
                callback(error, result);
            });
    }

    registerAirline(fromairline,airlinetoregister,callback){
        let self = this;
        
        self.flightSuretyApp.methods.registerAirline(airlinetoregister.toString())
        .send({ from: fromairline.toString(),gas: 1000000}, (error, result) => {
            callback(error, result);
        });
    }

    sendFunds(airline,funds,callback){
        let self = this;    
        const fundstosend = self.web3.utils.toWei(funds, "ether");  
        console.log(fundstosend) ; 
        self.flightSuretyApp.methods.AirlineFunding()
        .send({ from: airline.toString(),value: fundstosend}, (error, result) => {
            callback(error, result);
        });
    }

    //TODO: look at what buy can do
    purchaseInsurance(airline,flight,passenger,funds_ether,timestamp,callback){
        let self = this;   
        console.log("airline" + airline) ;
        const fundstosend1 = self.web3.utils.toWei(funds_ether, "ether");  
        console.log(fundstosend1) ; 
        let ts = timestamp;//1553367808;
        self.flightSuretyApp.methods.registerFlight(airline.toString(),flight.toString(),ts)
        .send({ from: passenger.toString(),value: fundstosend1,gas: 1000000}, (error, result) => {
            callback(error, result);
        });
      
    }


    withdrawFunds(passenger,funds_ether,callback){
        let self = this;   
       
        const fundstowithdraw = self.web3.utils.toWei(funds_ether.toString(), "ether");      
        self.flightSuretyApp.methods.withdrawFunds(fundstowithdraw)
        .send({ from: passenger.toString()}, (error, result) => {
            callback(error, result);
        });
      
    }

    getBalance(passenger,callback){
        let self = this;
        self.flightSuretyApp.methods.getBalance().call({ from: passenger.toString()}, (error, result) => {
            let balance = self.web3.utils.fromWei(result, 'ether');
            let formattedValue = balance+ " ETH";
            callback(error,formattedValue);
        });
    }

    getExistingAirlines(callback){
        let self = this;
        self.flightSuretyApp.methods.getExistingAirlines().call({ from: self.owner}, (error, result) => {
            callback(error,result);
        });
    }
}