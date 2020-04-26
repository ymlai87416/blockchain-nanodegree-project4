pragma solidity >=0.4.25;

// It's important to avoid vulnerabilities due to numeric overflow bugs
// OpenZeppelin's SafeMath library, when used correctly, protects agains such bugs
// More info: https://www.nccgroup.trust/us/about-us/newsroom-and-events/blog/2018/november/smart-contract-insecurity-bad-arithmetic/

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";

/************************************************** */
/* FlightSurety Smart Contract                      */
/************************************************** */
contract FlightSuretyApp {
    using SafeMath for uint256; // Allow SafeMath functions to be called for all uint256 types (similar to "prototype" in Javascript)

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    // Flight status codees
    uint8 private constant STATUS_CODE_UNKNOWN = 0;
    uint8 private constant STATUS_CODE_ON_TIME = 10;
    uint8 private constant STATUS_CODE_LATE_AIRLINE = 20;
    uint8 private constant STATUS_CODE_LATE_WEATHER = 30;
    uint8 private constant STATUS_CODE_LATE_TECHNICAL = 40;
    uint8 private constant STATUS_CODE_LATE_OTHER = 50;

    address private contractOwner;          // Account used to deploy contract

    uint256 private constant AIRLINE_SEED_FUND = 10 ether;
    uint256 private constant PASSENGER_MAX_INSURE = 1 ether;
    uint8 private constant AIRLINE_VOTE_THRESHOLD = 4;

    FlightSuretyData flightSuretyData;

    mapping (address => address[]) private airlineRegistrationConsensus;
 
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
         // Modify to call data contract's status
        require(isOperational(), "Contract is currently not operational");
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

    /**
    * @dev Modifier that requires the "ContractOwner" account to be the function caller
    */
    modifier requireRegisteredAirline(address entity)
    {
        (bool airlineRegistered, uint256 fundRemained) = flightSuretyData.isAirlineRegistered(entity);
        require(airlineRegistered, "Airline is not registered.");
        _;
    }

    /********************************************************************************************/
    /*                                       CONSTRUCTOR                                        */
    /********************************************************************************************/

    /**
    * @dev Contract constructor
    *
    */
    constructor
                                (
                                    address dataContract
                                )
                                public
    {
        contractOwner = msg.sender;
        flightSuretyData = FlightSuretyData(dataContract);
    }

    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/

    function isOperational()
                            public
                            view
                            returns(bool)
    {
        return flightSuretyData.isOperational();  // Modify to call data contract's status
    }

    function getContractOwner() public view returns (address) {
        return contractOwner;
    }

    function uintToString(uint v) constant returns (string str) {
        uint maxlength = 100;
        bytes memory reversed = new bytes(maxlength);
        uint i = 0;
        while (v != 0) {
            uint remainder = v % 10;
            v = v / 10;
            reversed[i++] = byte(48 + remainder);
        }
        bytes memory s = new bytes(i + 1);
        for (uint j = 0; j <= i; j++) {
            s[j] = reversed[i - j];
        }
        str = string(s);
    }

    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/

   /**
    * @dev Add an airline to the registration queue
    *
    */
    function registerAirline
                            (
                                address airline
                            )
                            external
                            requireIsOperational
                            returns(bool success, uint256 votes)
    {
        if(msg.sender == contractOwner){
            //allow contract owner to register airline on needed basis.
            flightSuretyData.registerAirline(airline);
            return (true, 1);
        }
        else{

            bool airlineRegistered;
            uint256 fundRemained;

            (airlineRegistered, fundRemained) = flightSuretyData.isAirlineRegistered(msg.sender);
            require(airlineRegistered, "Airline is not registered.");
            require(fundRemained >= AIRLINE_SEED_FUND, "Airline should not be able to register another airline if it hasn't provided funding");

            (airlineRegistered, fundRemained) = flightSuretyData.isAirlineRegistered(airline);
            require(!airlineRegistered, "Airline already registered.");

            uint256 airlineCount = flightSuretyData.getRegisteredAirlinesCount();

            if(airlineCount < AIRLINE_VOTE_THRESHOLD){
                flightSuretyData.registerAirline(airline);
                return (true, 1);
            }
            else{
                address[] storage agreeAirlines = airlineRegistrationConsensus[airline];

                bool isDuplicate = false;
                for(uint c=0; c<agreeAirlines.length; c++) {
                    if (agreeAirlines[c] == msg.sender) {
                        isDuplicate = true;
                        break;
                    }
                }
                require(!isDuplicate, "Caller has already registered this airline.");

                uint threshold = (airlineCount+1) / 2;
                agreeAirlines.push(msg.sender);
                if (agreeAirlines.length >= threshold) {
                    flightSuretyData.registerAirline(airline);
                    return (true, agreeAirlines.length);
                }
                else{
                    return (false, agreeAirlines.length);
                }
            }
        }
    }


   /**
    * @dev Register a future flight for insuring.
    *
    */
    function registerFlight
                                (
                                    address airline,
                                    string flight,
                                    uint256 timestamp
                                )
                                external
                                payable
                                requireIsOperational
                                returns(bool)
    {
        require(msg.value <= 1 ether, "A passenger can only pay up to 1 ether for purchasing flight insurance.");

        uint256 amount = flightSuretyData.getPassengerIssuredAmount(airline, flight, timestamp, msg.sender);
        require(amount == 0, "A passenger have already brought the issurance.");

        (bool registered, uint256 fundRemained) = flightSuretyData.isAirlineRegistered(airline);
        require(registered && (fundRemained >= 10 ether), "Airline is not register or have enough fund.");

        flightSuretyData.registerFlight(airline, flight, timestamp);

        address(flightSuretyData).transfer(msg.value);
        flightSuretyData.buy(airline, flight, timestamp, msg.sender, msg.value);
        return true;
    }
    
   /**
    * @dev Called after oracle has updated flight status
    *
    */
    function processFlightStatus
                                (
                                    address airline,
                                    string memory flight,
                                    uint256 timestamp,
                                    uint8 statusCode
                                )
                                internal
                                requireIsOperational
    {
        if(statusCode == STATUS_CODE_LATE_AIRLINE)
            flightSuretyData.creditInsurees(airline, flight, timestamp, 3, 2);
        else
            flightSuretyData.creditInsurees(airline, flight, timestamp, 0, 0);
    }


    // Generate a request for oracles to fetch flight information
    function fetchFlightStatus
                        (
                            address airline,
                            string flight,
                            uint256 timestamp
                        )
                        external
                        requireIsOperational
                        requireRegisteredAirline(airline)
    {
        uint8 index = getRandomIndex(msg.sender);

        // Generate a unique key for storing the request
        bytes32 key = keccak256(abi.encodePacked(index, airline, flight, timestamp));
        oracleResponses[key] = ResponseInfo({
                                                requester: msg.sender,
                                                isOpen: true
                                            });

        emit OracleRequest(index, airline, flight, timestamp);
    }

    function getExistingAirlines()
                             public
                             view
                             requireIsOperational
                            returns(address[])
    {
        return flightSuretyData.getExistingAirlines();
    }


    function withdrawFunds
            (
                uint256 amount
            )
            public   
            requireIsOperational
            returns(uint256)
    {
        return flightSuretyData.pay(msg.sender, amount);
    }

    /**
    * @dev to see how much fund an airline has  
    */
    function AirlineFunding
                            (
                            )
                            public
                            payable
                            requireIsOperational
                            requireRegisteredAirline(msg.sender)

    {
        address(flightSuretyData).transfer(msg.value);
        flightSuretyData.AirlineFunding(msg.sender,msg.value);
    }

    function getBalance() external view returns(uint256 amount){
        return flightSuretyData.getBalance(msg.sender);
    }

// region ORACLE MANAGEMENT

    // Incremented to add pseudo-randomness at various points
    uint8 private nonce = 0;

    // Fee to be paid when registering oracle
    uint256 public constant REGISTRATION_FEE = 1 ether;

    // Number of oracles that must respond for valid status
    uint256 private constant MIN_RESPONSES = 3;


    struct Oracle {
        bool isRegistered;
        uint8[3] indexes;
    }

    // Track all registered oracles
    mapping(address => Oracle) private oracles;

    // Model for responses from oracles
    struct ResponseInfo {
        address requester;                              // Account that requested status
        bool isOpen;                                    // If open, oracle responses are accepted
        mapping(uint8 => address[]) responses;          // Mapping key is the status code reported
                                                        // This lets us group responses and identify
                                                        // the response that majority of the oracles
    }

    // Track all oracle responses
    // Key = hash(index, flight, timestamp)
    mapping(bytes32 => ResponseInfo) private oracleResponses;

    // Event fired each time an oracle submits a response
    event FlightStatusInfo(address airline, string flight, uint256 timestamp, uint8 status);

    event OracleReport(address airline, string flight, uint256 timestamp, uint8 status);

    // Event fired when flight status request is submitted
    // Oracles track this and if they have a matching index
    // they fetch data and submit a response
    event OracleRequest(uint8 index, address airline, string flight, uint256 timestamp);


    // Register an oracle with the contract
    function registerOracle
                            (
                            )
                            external
                            payable
    {
        // Require registration fee
        require(msg.value >= REGISTRATION_FEE, "Registration fee is required");

        uint8[3] memory indexes = generateIndexes(msg.sender);

        oracles[msg.sender] = Oracle({
                                        isRegistered: true,
                                        indexes: indexes
                                    });
    }

    function getMyIndexes
                            (
                            )
                            external
                            view
                            returns(uint8[3])
    {
        require(oracles[msg.sender].isRegistered, "Not registered as an oracle");

        return oracles[msg.sender].indexes;
    }




    // Called by oracle when a response is available to an outstanding request
    // For the response to be accepted, there must be a pending request that is open
    // and matches one of the three Indexes randomly assigned to the oracle at the
    // time of registration (i.e. uninvited oracles are not welcome)
    function submitOracleResponse
                        (
                            uint8 index,
                            address airline,
                            string flight,
                            uint256 timestamp,
                            uint8 statusCode
                        )
                        external
                        requireIsOperational
    {
        
        require((oracles[msg.sender].indexes[0] == index) || (oracles[msg.sender].indexes[1] == index) || (oracles[msg.sender].indexes[2] == index), "Index does not match oracle request");


        bytes32 key = keccak256(abi.encodePacked(index, airline, flight, timestamp));
        require(oracleResponses[key].isOpen, "Flight or timestamp do not match oracle request");

        oracleResponses[key].responses[statusCode].push(msg.sender);
        

        // Information isn't considered verified until at least MIN_RESPONSES
        // oracles respond with the *** same *** information
        emit OracleReport(airline, flight, timestamp, statusCode);
        
        if (oracleResponses[key].responses[statusCode].length >= MIN_RESPONSES) {
            oracleResponses[key].isOpen = false;
            emit FlightStatusInfo(airline, flight, timestamp, statusCode);

            // Handle flight status as appropriate
            processFlightStatus(airline, flight, timestamp, statusCode);
        }
    }


    function getFlightKey
                        (
                            address airline,
                            string flight,
                            uint256 timestamp
                        )
                        pure
                        internal
                        returns(bytes32)
    {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }

    // Returns array of three non-duplicating integers from 0-9
    function generateIndexes
                            (
                                address account
                            )
                            internal
                            returns(uint8[3])
    {
        uint8[3] memory indexes;
        indexes[0] = getRandomIndex(account);

        indexes[1] = indexes[0];
        while(indexes[1] == indexes[0]) {
            indexes[1] = getRandomIndex(account);
        }

        indexes[2] = indexes[1];
        while((indexes[2] == indexes[0]) || (indexes[2] == indexes[1])) {
            indexes[2] = getRandomIndex(account);
        }

        return indexes;
    }

    // Returns array of three non-duplicating integers from 0-9
    function getRandomIndex
                            (
                                address account
                            )
                            internal
                            returns (uint8)
    {
        uint8 maxValue = 10;

        // Pseudo random number...the incrementing nonce adds variation
        uint8 random = uint8(uint256(keccak256(abi.encodePacked(blockhash(block.number - nonce++), account))) % maxValue);

        if (nonce > 250) {
            nonce = 0;  // Can only fetch blockhashes for last 256 blocks so we adapt
        }

        return random;
    }

// endregion

}


contract FlightSuretyData{
    function isOperational() public view returns (bool);

    function registerAirline(address airline) public;

    function registerFlight(address airline, string flight, uint256 timestamp) external;

    function isAirlineRegistered(address airline) external view returns(bool registered, uint256 fundRemained);

    function isFlightRegistered(address airline, string flight, uint256 timestamp) external view returns(bool registered);

    function buy(address airline, string flight, uint256 timestamp,
                                address passenger,
                                uint256 value) external;

    function creditInsurees(address airline, string flight, uint256 timestamp,
                                    uint256 numerator, uint256 denominator) external;

    function pay(address passenger, uint256 amount) external returns(uint256);

    function fund() public payable;

    function getRegisteredAirlinesCount() external view returns(uint256);

    function getExistingAirlines() external view returns(address[]);

    function getBalance(address entity) external view returns(uint256);

    function getPassengerIssuredAmount(address airline, string flight, uint256 timestamp,
                                address passenger ) external view returns(uint256);

    function AirlineFunding(address airline, uint amount) external;
}