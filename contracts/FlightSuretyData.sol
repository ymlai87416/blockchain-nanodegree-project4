pragma solidity >=0.4.25;

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";

contract FlightSuretyData {
    using SafeMath for uint256;

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    address private contractOwner;                                      // Account used to deploy contract
    bool private operational = true;                                    // Blocks all state changes throughout the contract if false

    // Flight status codees
    uint8 private constant STATUS_CODE_UNKNOWN = 0;
    uint8 private constant STATUS_CODE_ON_TIME = 10;
    uint8 private constant STATUS_CODE_LATE_AIRLINE = 20;
    uint8 private constant STATUS_CODE_LATE_WEATHER = 30;
    uint8 private constant STATUS_CODE_LATE_TECHNICAL = 40;
    uint8 private constant STATUS_CODE_LATE_OTHER = 50;

    struct Flight {
        bool isRegistered;
        uint8 statusCode;
        uint256 updatedTimestamp;
        address airline;
    }

    enum PolicyStatus { 
        Inforce,
        Paid,
        Expired
    }

    struct InsurancePolicy{
        address passenger;
        uint256 amount;
        PolicyStatus status;
    }

    mapping(bytes32 => Flight) private flights;
    mapping (address => uint256) private registeredAirlines;
    mapping (address => uint256) private balances;
    mapping (address => uint256) private authorizedContracts;
    mapping (bytes32 => InsurancePolicy[]) private insurancePolicies;
    address[] airlines;

    /********************************************************************************************/
    /*                                       EVENT DEFINITIONS                                  */
    /********************************************************************************************/


    /**
    * @dev Constructor
    *      The deploying account becomes contractOwner
    */
    constructor
                                (
                                ) 
                                public 
    {
        contractOwner = msg.sender;
    }

    /********************************************************************************************/
    /*                                       FUNCTION MODIFIERS                                 */
    /********************************************************************************************/

    // Modifiers help avoid duplication of code. They are typically used to validate something
    // before a function is allowed to be executed.

    /**
    * @dev Modifier that requires the "operational" boolean variable to be "true"
    *      This is used on all state changing functions to pause the contract in 
    *      the event there is an issue that needs to be fixed
    */
    modifier requireIsOperational() 
    {
        require(operational, "Contract is currently not operational");
        _;  // All modifiers require an "_" which indicates where the function body will be added
    }

    /**
    * @dev Modifier that requires the "ContractOwner" account to be the function caller
    */
    modifier requireContractOwner()
    {
        require(msg.sender == contractOwner, "Caller is not contract owner");
        _;
    }

    modifier requireRegisteredAirline(address caller){
        require(registeredAirlines[caller] != 0, "Caller must be a registered airline.");
        _;
    }

    modifier requireIsCallerAuthorized(){
        require(authorizedContracts[msg.sender] == 1, "Caller is not an authorized contract.");
        _;
    } 

    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/

    /**
    * @dev Get operating status of contract
    *
    * @return A bool that is the current operating status
    */      
    function isOperational() 
                            public 
                            view 
                            returns(bool) 
    {
        return operational;
    }


    /**
    * @dev Sets contract operations on/off
    *
    * When operational mode is disabled, all write transactions except for this one will fail
    */    
    function setOperatingStatus
                            (
                                bool mode
                            ) 
                            external
                            requireContractOwner 
    {
        operational = mode;
    }

    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/

    function authorizeCaller
                            (
                                address contractAddress
                            )
                            external
                            requireContractOwner
    {
        authorizedContracts[contractAddress] = 1;
       
    }

    function deauthorizeCaller
                            (
                                address contractAddress
                            )
                            external
                            requireContractOwner
    {
        delete authorizedContracts[contractAddress];
    }


   /**
    * @dev Add an airline to the registration queue
    *      Can only be called from FlightSuretyApp contract
    *
    */   
    function registerAirline
                            (   
                                address airline
                            )
                            public
                            requireIsCallerAuthorized
    {
        airlines.push(airline);
        registeredAirlines[airline] = 1;
    }

    function registerFlight
                                (
                                    address airline,
                                    string flight,
                                    uint256 timestamp
                                )
                                external
                                requireIsCallerAuthorized
    {
        bytes32 flightKey = getFlightKey(airline, flight, timestamp);

        flights[flightKey] = Flight({
            isRegistered: true,
            statusCode: STATUS_CODE_UNKNOWN,
            updatedTimestamp: now,
            airline: airline
        });
    }


    function isAirlineRegistered(address airline)
    external view
    returns(bool registered, uint256 fundRemained)
    {
        return (registeredAirlines[airline] != 0, balances[airline]);
    }

    function isFlightRegistered(
        address airline, string flight, uint256 timestamp
    )
    external view
    returns(bool registered)
    {
        bytes32 flightKey = getFlightKey(airline, flight, timestamp);
        return flights[flightKey].isRegistered == true;
    }

    function getRegisteredAirlinesCount() external view returns(uint256){
        return airlines.length;
    }

    function getPassengerIssuredAmount(address airline, string flight, uint256 timestamp,
                                address passenger ) external view returns(uint256){
        bytes32 flightKey = getFlightKey(airline, flight, timestamp);

        InsurancePolicy[] storage policies = insurancePolicies[flightKey];
        for(uint256 i=0; i<policies.length; ++i){
            if(policies[i].passenger == passenger){
                return policies[i].amount;
            }
        }
        return 0;
    }

    function getFlightStatus(address airline, string flight, uint256 timestamp) external view returns(uint8){
        bytes32 flightKey = getFlightKey(airline, flight, timestamp);

        return flights[flightKey].statusCode;
    }

   /**
    * @dev Buy insurance for a flight
    *
    */   
    function buy
                            (
                                address airline, string flight, uint256 timestamp,
                                address passenger,
                                uint256 value
                            )
                            external
                            payable
                            requireIsCallerAuthorized
    {
        require(registeredAirlines[passenger] == 0, "Passenger cannot be registered airline.");

        bytes32 flightKey = getFlightKey(airline, flight, timestamp);
        require(flights[flightKey].isRegistered, "Flight has not registered");

        Flight storage flightInfo = flights[flightKey];
        require(flightInfo.statusCode == STATUS_CODE_UNKNOWN, "Flight has already taken off.");

        insurancePolicies[flightKey].push(InsurancePolicy({
            passenger: passenger,
            amount: value,
            status: PolicyStatus.Inforce
        }));

    }


    /**
     *  @dev Credits payouts to insurees
    */
    function creditInsurees
                                (
                                    address airline, string flight, uint256 timestamp,
                                    uint256 numerator, uint256 denominator
                                )
                                external
                                requireIsCallerAuthorized()
    {
        bytes32 flightKey = getFlightKey(airline, flight, timestamp);

        for(uint i=0; i<insurancePolicies[flightKey].length; ++i){
            
            address passenger = insurancePolicies[flightKey][i].passenger;
            uint256 amount = insurancePolicies[flightKey][i].amount;
            PolicyStatus status = insurancePolicies[flightKey][i].status;

            if(status == PolicyStatus.Inforce){
                uint256 payoutValue = 0;

                if (numerator != 0){
                    payoutValue = amount * numerator / denominator;
                }

                if(payoutValue > 0){
                    insurancePolicies[flightKey][i].status = PolicyStatus.Paid;
                    uint256 finalAmount = balances[passenger] + payoutValue;
                    balances[passenger] = finalAmount;
                }
                else{
                    insurancePolicies[flightKey][i].status = PolicyStatus.Expired;
                }
            }
        }
    }
    

    /**
     *  @dev Transfers eligible payout funds to insuree
     *
    */
    function pay
                            (
                               address passenger,
                               uint256 amount
                            )
                            external
                            requireIsCallerAuthorized
                            returns(uint256)
    {
        //Check
        require(balances[passenger] >= amount, "Insufficient credit.");
        require(address(this).balance >= amount, "Contract does not have enough ether to make the payment.");
        
        uint256 val = balances[passenger] - amount;
    
        //Effect
        balances[passenger] = val;

        //Interaction
        passenger.transfer(amount);

        return val;
    }

    function getExistingAirlines() external view returns(address[]){
        return airlines;
    }

    function getBalance(address entity) external view returns(uint256){
        return balances[entity];
    }

    function AirlineFunding(
                                address airline,
                                uint amount
                            )
                            external
                            requireIsCallerAuthorized
    {
        balances[airline] += amount;
    }

   /**
    * @dev Initial funding for the insurance. Unless there are too many delayed flights
    *      resulting in insurance payouts, the contract should be self-sustaining
    *
    */   
    function fund
                            (
                            )
                            public
                            payable
    {
    }

    function getFlightKey
                        (
                            address airline,
                            string memory flight,
                            uint256 timestamp
                        )
                        pure
                        internal
                        returns(bytes32) 
    {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }

    /**
    * @dev Fallback function for funding smart contract.
    *
    */
    function() 
                            external 
                            payable 
    {
        //require(msg.data.length == 0, "Prevent attack.");
        fund();
    }


}

