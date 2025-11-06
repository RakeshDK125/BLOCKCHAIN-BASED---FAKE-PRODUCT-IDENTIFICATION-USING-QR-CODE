//SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract ProductRegistry {
    struct Product {
        uint256 productId;
        string productName;
        string manufacturerName;
        address manufacturer;
        address currentOwner;
        uint256 timestamp;
        bool isAuthentic;
        string qrCode;
        string[] supplyChainHistory;
        mapping(address => bool) authorizedParties;
    }
    
    struct SupplyChainEvent {
        address from;
        address to;
        uint256 timestamp;
        string eventType;
        string location;
    }
    
    mapping(uint256 => Product) public products;
    mapping(string => uint256) public qrCodeToProductId;
    mapping(uint256 => SupplyChainEvent[]) public productHistory;
    mapping(address => bool) public authorizedManufacturers;
    mapping(address => bool) public authorizedDistributors;
    mapping(string => bool) public usedQRCodes;
    
    uint256 public nextProductId = 1;
    address public admin;
    
    event ProductRegistered(
        uint256 indexed productId,
        string productName,
        address indexed manufacturer,
        string qrCode
    );
    
    event OwnershipTransferred(
        uint256 indexed productId,
        address indexed from,
        address indexed to,
        string eventType
    );
    
    event CounterfeitDetected(
        uint256 indexed productId,
        string reason,
        address reporter
    );
    
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }
    
    modifier onlyAuthorizedManufacturer() {
        require(authorizedManufacturers[msg.sender], "Only authorized manufacturers");
        _;
    }
    
    modifier productExists(uint256 _productId) {
        require(_productId < nextProductId && _productId > 0, "Product does not exist");
        _;
    }
    
    constructor() {
        admin = msg.sender;
        authorizedManufacturers[msg.sender] = true;
    }
    
    function authorizeManufacturer(address _manufacturer) external onlyAdmin {
        authorizedManufacturers[_manufacturer] = true;
    }
    
    function authorizeDistributor(address _distributor) external onlyAdmin {
        authorizedDistributors[_distributor] = true;
    }
    
    function registerProduct(
        string memory _productName,
        string memory _manufacturerName,
        string memory _qrCode
    ) external onlyAuthorizedManufacturer returns (uint256) {
        require(!usedQRCodes[_qrCode], "QR Code already used");
        require(bytes(_qrCode).length > 0, "QR Code cannot be empty");
        
        uint256 productId = nextProductId++;
        
        Product storage newProduct = products[productId];
        newProduct.productId = productId;
        newProduct.productName = _productName;
        newProduct.manufacturerName = _manufacturerName;
        newProduct.manufacturer = msg.sender;
        newProduct.currentOwner = msg.sender;
        newProduct.timestamp = block.timestamp;
        newProduct.isAuthentic = true;
        newProduct.qrCode = _qrCode;
        newProduct.authorizedParties[msg.sender] = true;
        
        qrCodeToProductId[_qrCode] = productId;
        usedQRCodes[_qrCode] = true;
        
        // Add initial supply chain event
        productHistory[productId].push(SupplyChainEvent({
            from: address(0),
            to: msg.sender,
            timestamp: block.timestamp,
            eventType: "MANUFACTURED",
            location: "Factory"
        }));
        
        emit ProductRegistered(productId, _productName, msg.sender, _qrCode);
        return productId;
    }
    
    function transferOwnership(
        uint256 _productId,
        address _newOwner,
        string memory _eventType,
        string memory _location
    ) external productExists(_productId) {
        Product storage product = products[_productId];
        require(product.currentOwner == msg.sender, "Only current owner can transfer");
        require(_newOwner != address(0), "Invalid new owner address");
        require(product.isAuthentic, "Cannot transfer counterfeit product");
        
        address previousOwner = product.currentOwner;
        product.currentOwner = _newOwner;
        product.authorizedParties[_newOwner] = true;
        
        // Add supply chain event
        productHistory[_productId].push(SupplyChainEvent({
            from: previousOwner,
            to: _newOwner,
            timestamp: block.timestamp,
            eventType: _eventType,
            location: _location
        }));
        
        emit OwnershipTransferred(_productId, previousOwner, _newOwner, _eventType);
    }
    
    function verifyProduct(string memory _qrCode) external view returns (
        uint256 productId,
        string memory productName,
        string memory manufacturerName,
        address manufacturer,
        address currentOwner,
        bool isAuthentic,
        uint256 timestamp
    ) {
        require(usedQRCodes[_qrCode], "QR Code not found");
        
        productId = qrCodeToProductId[_qrCode];
        Product storage product = products[productId];
        
        return (
            product.productId,
            product.productName,
            product.manufacturerName,
            product.manufacturer,
            product.currentOwner,
            product.isAuthentic,
            product.timestamp
        );
    }
    
    function getSupplyChainHistory(uint256 _productId) 
        external 
        view 
        productExists(_productId) 
        returns (SupplyChainEvent[] memory) {
        return productHistory[_productId];
    }
    
    function reportCounterfeit(uint256 _productId, string memory _reason) 
        external 
        productExists(_productId) {
        Product storage product = products[_productId];
        product.isAuthentic = false;
        
        emit CounterfeitDetected(_productId, _reason, msg.sender);
    }
    
    function detectDuplicateQR(string memory _qrCode) external view returns (bool) {
        return usedQRCodes[_qrCode];
    }
    
    function getProductsByManufacturer(address _manufacturer) 
        external 
        view 
        returns (uint256[] memory) {
        uint256[] memory manufacturerProducts = new uint256[](nextProductId - 1);
        uint256 count = 0;
        
        for (uint256 i = 1; i < nextProductId; i++) {
            if (products[i].manufacturer == _manufacturer) {
                manufacturerProducts[count] = i;
                count++;
            }
        }
        
        // Resize array to actual count
        uint256[] memory result = new uint256[](count);
        for (uint256 j = 0; j < count; j++) {
            result[j] = manufacturerProducts[j];
        }
        
        return result;
    }
}