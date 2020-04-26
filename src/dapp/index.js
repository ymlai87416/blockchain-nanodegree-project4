
import DOM from './dom';
import Contract from './contract';
import './flightsurety.css';


(async() => {

    let result = null;

    let contract = new Contract('localhost', () => {

        // Read transaction
        contract.isOperational((error, result) => {
            console.log(error,result);
            display('Operational Status', 'Check if contract is operational', [ { label: 'Operational Status', error: error, value: result} ]);
        });
    
        var fundAirlineBtn = DOM.elid('fund-airline');
        var regAirlineBtn = DOM.elid('register-airline');
        var buyInsuranceBtn = DOM.elid('buy-insurance');
        var submitOracleBtn = DOM.elid('submit-oracle');
        var withdrawFundBtn = DOM.elid('withdraw-fund');
        var airlineList = DOM.elid('airline-select');
        var currentBalance = DOM.elid('current-balance');

        //fund airline
        if(fundAirlineBtn){
            fundAirlineBtn.addEventListener('click', () => {
                let airline = web3.currentProvider.selectedAddress;
                let funds = DOM.elid('transfer-value').value;
                // Write transaction
                contract.sendFunds(airline, funds, (error, result) => {
                    display('Airline', 'Registration', [ { label: 'Fund airline', error: error, value: result} ]);
                });
            })
        }
        
        //register airline
        if(regAirlineBtn){
            regAirlineBtn.addEventListener('click', () => {
                let fromairline = web3.currentProvider.selectedAddress;
                let airline = DOM.elid('airline').value;
                // Write transaction
                contract.registerAirline(fromairline, airline, (error, result) => {
                    console.log(result);
                    console.log(error);
                    display('Airline', 'Registration', [ { label: 'Register airline', error: error, value: result} ]);
                });
            })
        }
    

        //buy
        if(buyInsuranceBtn){
            buyInsuranceBtn.addEventListener('click', () => {
                let airline = DOM.elid('airline-select').value;
                let flight = DOM.elid('flight-number').value;
                let passenger = web3.currentProvider.selectedAddress;
                let funds_ether = DOM.elid('transfer-value').value;
                let flightDate = DOM.elid('flight-date').value;
                let flightTime = DOM.elid('flight-time').value;
                let timestamp = Date.parse(flightDate + " " + flightTime) / 1000;

                // Write transaction
                contract.purchaseInsurance(airline, flight, passenger, funds_ether, timestamp, (error, result) => {
                    display('Passenger', 'Purcahse insurance', [ { label: 'Purcahse insurance', error: error, value: result} ]);
                });
            })
        }
        

        // User-submitted transaction
        if(submitOracleBtn){
            submitOracleBtn.addEventListener('click', () => {
                let airline = DOM.elid('airline-select').value;
                let flight = DOM.elid('flight-number').value;
                let flightDate = DOM.elid('flight-date').value;
                let flightTime = DOM.elid('flight-time').value;
                let timestamp = Date.parse(flightDate + " " + flightTime) / 1000;
                // Write transaction
                contract.fetchFlightStatus(airline, flight, timestamp, (error, result) => {
                    display('Oracles', 'Trigger oracles', [ { label: 'Fetch Flight Status', error: error, value: result} ]);
                });
            })
        }
        

        //withdraw money
        if(withdrawFundBtn){
            withdrawFundBtn.addEventListener('click', () => {
                let fundstowithdraw = DOM.elid('transfer-amount').value;
                let passenger = web3.currentProvider.selectedAddress;
                contract.withdrawFunds(passenger, fundstowithdraw, (error, result) => {
                    display('Passenger', 'Withdraw', [ { label: 'Withdraw Money', error: error, value: result} ]);
                    //refresh the fund
                    let passenger = web3.currentProvider.selectedAddress;
                    contract.getBalance(passenger, (error, result) => {
                        currentBalance.value = result;
                    });
                });
            })
        }

        if(airlineList){
            contract.getExistingAirlines((error, result) => {
                for(var i =0; i<result.length; ++i){
                    var opt = document.createElement('option');
                    opt.appendChild( document.createTextNode(result[i]) );
                    opt.value = result[i]; 
                    airlineList.appendChild(opt); 
                }
            });
        }

        if(currentBalance){
            let passenger = web3.currentProvider.selectedAddress;
            contract.getBalance(passenger, (error, result) => {
                currentBalance.value = result;
            });  
        }
        
    });
    
})();


function display(title, description, results) {
    let displayDiv = DOM.elid("display-wrapper");
    let section = DOM.section();
    section.appendChild(DOM.h2(title));
    section.appendChild(DOM.h5(description));
    results.map((result) => {
        let row = section.appendChild(DOM.div({className:'row'}));
        row.appendChild(DOM.div({className: 'col-sm-4 field'}, result.label));
        row.appendChild(DOM.div({className: 'col-sm-8 field-value'}, result.error ? String(result.error) : String(result.value)));
        section.appendChild(row);
    })
    displayDiv.append(section);

}







