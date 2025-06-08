// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IERC6551Account {
    function owner() external view returns (address);
    function execute(address to, uint256 value, bytes calldata data) external payable returns (bytes memory result);
    function executeWithSignature(
        address to,
        uint256 value,
        bytes calldata data,
        address signer,
        uint256 deadline,
        bytes calldata signature
    ) external payable returns (bytes memory result);
    function supportsInterface(bytes4 interfaceId) external view returns (bool);
}

abstract contract EIP712Domain {
    bytes32 public DOMAIN_SEPARATOR;
    string public constant NAME = "StarglowTBA";
    string public constant VERSION = "1";
    
    function _initializeDomain() internal {
        DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256(bytes(NAME)),
                keccak256(bytes(VERSION)),
                block.chainid,
                address(this)
            )
        );
    }
}

contract StarglowTBA is IERC6551Account, EIP712Domain {
    address public nftContract;
    uint256 public tokenId;
    uint256 public salt;
    bool private initialized;
    mapping(address => bool) public permittedSigners;

    bytes32 public constant EXECUTE_TYPEHASH =
        keccak256("Execute(address to,uint256 value,bytes data,address signer,uint256 deadline)");

    event Executed(address indexed to, uint256 value, bytes data, address indexed executor);
    event PermittedSignerAdded(address indexed signer);
    event PermittedSignerRemoved(address indexed signer);

    // Initialize function for proxy pattern compatibility
    function initialize(
        address _nftContract,
        uint256 _tokenId,
        uint256 _salt,
        bytes calldata initData
    ) external {
        require(!initialized, "Already initialized");
        initialized = true;
        
        nftContract = _nftContract;
        tokenId = _tokenId;
        salt = _salt;
        
        _initializeDomain();
        
        // If initData is provided, decode and process it
        if (initData.length > 0) {
            // Decode initial permitted signers
            address[] memory initialSigners = abi.decode(initData, (address[]));
            
            // Add each signer to permitted list
            for (uint256 i = 0; i < initialSigners.length; i++) {
                if (initialSigners[i] != address(0)) {
                    permittedSigners[initialSigners[i]] = true;
                    emit PermittedSignerAdded(initialSigners[i]);
                }
            }
        }
    }

    function owner() public view override returns (address) {
        require(nftContract != address(0), "Not initialized");
        (bool success, bytes memory data) = nftContract.staticcall(
            abi.encodeWithSignature("ownerOf(uint256)", tokenId)
        );
        require(success, "ownerOf failed");
        address nftOwner = abi.decode(data, (address));
        require(nftOwner != address(0), "Invalid owner");
        return nftOwner;
    }

    function execute(
        address to,
        uint256 value,
        bytes calldata data
    ) external payable override returns (bytes memory result) {
        require(to != address(0), "Invalid target");
        require(msg.sender == owner(), "Not NFT owner");
        
        (bool success, bytes memory res) = to.call{value: value}(data);
        require(success, "Call failed");
        emit Executed(to, value, data, msg.sender);
        return res;
    }

    function executeWithSignature(
        address to,
        uint256 value,
        bytes calldata data,
        address signer,
        uint256 deadline,
        bytes calldata signature
    ) external payable override returns (bytes memory result) {
        require(to != address(0), "Invalid target");
        require(block.timestamp <= deadline, "Signature expired");
        require(permittedSigners[signer] || signer == owner(), "Not permitted signer");

        bytes32 structHash = keccak256(
            abi.encode(
                EXECUTE_TYPEHASH,
                to,
                value,
                keccak256(data),
                signer,
                deadline
            )
        );
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR, structHash));
        address recovered = recoverSigner(digest, signature);
        require(recovered != address(0), "Invalid signature");
        require(recovered == signer, "Signature mismatch");

        (bool success, bytes memory res) = to.call{value: value}(data);
        require(success, "Call failed");
        emit Executed(to, value, data, signer);
        return res;
    }

    function recoverSigner(bytes32 digest, bytes memory signature) public pure returns (address) {
        require(signature.length == 65, "Invalid signature length");
        bytes32 r;
        bytes32 s;
        uint8 v;
        assembly {
            r := mload(add(signature, 32))
            s := mload(add(signature, 64))
            v := byte(0, mload(add(signature, 96)))
        }
        
        // Prevent signature malleability
        require(uint256(s) <= 0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF5D576E7357A4501DDFE92F46681B20A0, "Invalid signature 's' value");
        
        return ecrecover(digest, v, r, s);
    }

    function addPermittedSigner(address signer) external {
        require(signer != address(0), "Invalid signer");
        require(msg.sender == owner(), "Not NFT owner");
        permittedSigners[signer] = true;
        emit PermittedSignerAdded(signer);
    }

    function removePermittedSigner(address signer) external {
        require(msg.sender == owner(), "Not NFT owner");
        permittedSigners[signer] = false;
        emit PermittedSignerRemoved(signer);
    }

    function supportsInterface(bytes4 interfaceId) external pure override returns (bool) {
        return
            interfaceId == type(IERC6551Account).interfaceId ||
            interfaceId == 0x01ffc9a7; // ERC165
    }

    receive() external payable {}
}