"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.IERC721A__factory = exports.ERC721A__factory = exports.ERC721A__IERC721Receiver__factory = exports.IERC721AUpgradeable__factory = exports.ERC721AUpgradeable__factory = exports.ERC721A__IERC721ReceiverUpgradeable__factory = exports.Staking__factory = exports.CollectionFactory__factory = exports.IERC721Permit__factory = exports.Collection__factory = exports.Assets__factory = exports.Strings__factory = exports.ShortStrings__factory = exports.ReentrancyGuard__factory = exports.Pausable__factory = exports.SafeCast__factory = exports.Errors__factory = exports.EIP712__factory = exports.ECDSA__factory = exports.Address__factory = exports.Proxy__factory = exports.ERC1967Utils__factory = exports.ERC1967Proxy__factory = exports.IBeacon__factory = exports.IERC5267__factory = exports.IERC1967__factory = exports.IERC1822Proxiable__factory = exports.Ownable__factory = exports.ReentrancyGuardUpgradeable__factory = exports.PausableUpgradeable__factory = exports.EIP712Upgradeable__factory = exports.ContextUpgradeable__factory = exports.UUPSUpgradeable__factory = exports.Initializable__factory = exports.OwnableUpgradeable__factory = exports.factories = void 0;
exports.factories = __importStar(require("./factories"));
var OwnableUpgradeable__factory_1 = require("./factories/@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable__factory");
Object.defineProperty(exports, "OwnableUpgradeable__factory", { enumerable: true, get: function () { return OwnableUpgradeable__factory_1.OwnableUpgradeable__factory; } });
var Initializable__factory_1 = require("./factories/@openzeppelin/contracts-upgradeable/proxy/utils/Initializable__factory");
Object.defineProperty(exports, "Initializable__factory", { enumerable: true, get: function () { return Initializable__factory_1.Initializable__factory; } });
var UUPSUpgradeable__factory_1 = require("./factories/@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable__factory");
Object.defineProperty(exports, "UUPSUpgradeable__factory", { enumerable: true, get: function () { return UUPSUpgradeable__factory_1.UUPSUpgradeable__factory; } });
var ContextUpgradeable__factory_1 = require("./factories/@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable__factory");
Object.defineProperty(exports, "ContextUpgradeable__factory", { enumerable: true, get: function () { return ContextUpgradeable__factory_1.ContextUpgradeable__factory; } });
var EIP712Upgradeable__factory_1 = require("./factories/@openzeppelin/contracts-upgradeable/utils/cryptography/EIP712Upgradeable__factory");
Object.defineProperty(exports, "EIP712Upgradeable__factory", { enumerable: true, get: function () { return EIP712Upgradeable__factory_1.EIP712Upgradeable__factory; } });
var PausableUpgradeable__factory_1 = require("./factories/@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable__factory");
Object.defineProperty(exports, "PausableUpgradeable__factory", { enumerable: true, get: function () { return PausableUpgradeable__factory_1.PausableUpgradeable__factory; } });
var ReentrancyGuardUpgradeable__factory_1 = require("./factories/@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable__factory");
Object.defineProperty(exports, "ReentrancyGuardUpgradeable__factory", { enumerable: true, get: function () { return ReentrancyGuardUpgradeable__factory_1.ReentrancyGuardUpgradeable__factory; } });
var Ownable__factory_1 = require("./factories/@openzeppelin/contracts/access/Ownable__factory");
Object.defineProperty(exports, "Ownable__factory", { enumerable: true, get: function () { return Ownable__factory_1.Ownable__factory; } });
var IERC1822Proxiable__factory_1 = require("./factories/@openzeppelin/contracts/interfaces/draft-IERC1822.sol/IERC1822Proxiable__factory");
Object.defineProperty(exports, "IERC1822Proxiable__factory", { enumerable: true, get: function () { return IERC1822Proxiable__factory_1.IERC1822Proxiable__factory; } });
var IERC1967__factory_1 = require("./factories/@openzeppelin/contracts/interfaces/IERC1967__factory");
Object.defineProperty(exports, "IERC1967__factory", { enumerable: true, get: function () { return IERC1967__factory_1.IERC1967__factory; } });
var IERC5267__factory_1 = require("./factories/@openzeppelin/contracts/interfaces/IERC5267__factory");
Object.defineProperty(exports, "IERC5267__factory", { enumerable: true, get: function () { return IERC5267__factory_1.IERC5267__factory; } });
var IBeacon__factory_1 = require("./factories/@openzeppelin/contracts/proxy/beacon/IBeacon__factory");
Object.defineProperty(exports, "IBeacon__factory", { enumerable: true, get: function () { return IBeacon__factory_1.IBeacon__factory; } });
var ERC1967Proxy__factory_1 = require("./factories/@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy__factory");
Object.defineProperty(exports, "ERC1967Proxy__factory", { enumerable: true, get: function () { return ERC1967Proxy__factory_1.ERC1967Proxy__factory; } });
var ERC1967Utils__factory_1 = require("./factories/@openzeppelin/contracts/proxy/ERC1967/ERC1967Utils__factory");
Object.defineProperty(exports, "ERC1967Utils__factory", { enumerable: true, get: function () { return ERC1967Utils__factory_1.ERC1967Utils__factory; } });
var Proxy__factory_1 = require("./factories/@openzeppelin/contracts/proxy/Proxy__factory");
Object.defineProperty(exports, "Proxy__factory", { enumerable: true, get: function () { return Proxy__factory_1.Proxy__factory; } });
var Address__factory_1 = require("./factories/@openzeppelin/contracts/utils/Address__factory");
Object.defineProperty(exports, "Address__factory", { enumerable: true, get: function () { return Address__factory_1.Address__factory; } });
var ECDSA__factory_1 = require("./factories/@openzeppelin/contracts/utils/cryptography/ECDSA__factory");
Object.defineProperty(exports, "ECDSA__factory", { enumerable: true, get: function () { return ECDSA__factory_1.ECDSA__factory; } });
var EIP712__factory_1 = require("./factories/@openzeppelin/contracts/utils/cryptography/EIP712__factory");
Object.defineProperty(exports, "EIP712__factory", { enumerable: true, get: function () { return EIP712__factory_1.EIP712__factory; } });
var Errors__factory_1 = require("./factories/@openzeppelin/contracts/utils/Errors__factory");
Object.defineProperty(exports, "Errors__factory", { enumerable: true, get: function () { return Errors__factory_1.Errors__factory; } });
var SafeCast__factory_1 = require("./factories/@openzeppelin/contracts/utils/math/SafeCast__factory");
Object.defineProperty(exports, "SafeCast__factory", { enumerable: true, get: function () { return SafeCast__factory_1.SafeCast__factory; } });
var Pausable__factory_1 = require("./factories/@openzeppelin/contracts/utils/Pausable__factory");
Object.defineProperty(exports, "Pausable__factory", { enumerable: true, get: function () { return Pausable__factory_1.Pausable__factory; } });
var ReentrancyGuard__factory_1 = require("./factories/@openzeppelin/contracts/utils/ReentrancyGuard__factory");
Object.defineProperty(exports, "ReentrancyGuard__factory", { enumerable: true, get: function () { return ReentrancyGuard__factory_1.ReentrancyGuard__factory; } });
var ShortStrings__factory_1 = require("./factories/@openzeppelin/contracts/utils/ShortStrings__factory");
Object.defineProperty(exports, "ShortStrings__factory", { enumerable: true, get: function () { return ShortStrings__factory_1.ShortStrings__factory; } });
var Strings__factory_1 = require("./factories/@openzeppelin/contracts/utils/Strings__factory");
Object.defineProperty(exports, "Strings__factory", { enumerable: true, get: function () { return Strings__factory_1.Strings__factory; } });
var Assets__factory_1 = require("./factories/contracts/Assets__factory");
Object.defineProperty(exports, "Assets__factory", { enumerable: true, get: function () { return Assets__factory_1.Assets__factory; } });
var Collection__factory_1 = require("./factories/contracts/Collection.sol/Collection__factory");
Object.defineProperty(exports, "Collection__factory", { enumerable: true, get: function () { return Collection__factory_1.Collection__factory; } });
var IERC721Permit__factory_1 = require("./factories/contracts/Collection.sol/IERC721Permit__factory");
Object.defineProperty(exports, "IERC721Permit__factory", { enumerable: true, get: function () { return IERC721Permit__factory_1.IERC721Permit__factory; } });
var CollectionFactory__factory_1 = require("./factories/contracts/Factory.sol/CollectionFactory__factory");
Object.defineProperty(exports, "CollectionFactory__factory", { enumerable: true, get: function () { return CollectionFactory__factory_1.CollectionFactory__factory; } });
var Staking__factory_1 = require("./factories/contracts/Staking__factory");
Object.defineProperty(exports, "Staking__factory", { enumerable: true, get: function () { return Staking__factory_1.Staking__factory; } });
var ERC721A__IERC721ReceiverUpgradeable__factory_1 = require("./factories/erc721a-upgradeable/contracts/ERC721AUpgradeable.sol/ERC721A__IERC721ReceiverUpgradeable__factory");
Object.defineProperty(exports, "ERC721A__IERC721ReceiverUpgradeable__factory", { enumerable: true, get: function () { return ERC721A__IERC721ReceiverUpgradeable__factory_1.ERC721A__IERC721ReceiverUpgradeable__factory; } });
var ERC721AUpgradeable__factory_1 = require("./factories/erc721a-upgradeable/contracts/ERC721AUpgradeable.sol/ERC721AUpgradeable__factory");
Object.defineProperty(exports, "ERC721AUpgradeable__factory", { enumerable: true, get: function () { return ERC721AUpgradeable__factory_1.ERC721AUpgradeable__factory; } });
var IERC721AUpgradeable__factory_1 = require("./factories/erc721a-upgradeable/contracts/IERC721AUpgradeable__factory");
Object.defineProperty(exports, "IERC721AUpgradeable__factory", { enumerable: true, get: function () { return IERC721AUpgradeable__factory_1.IERC721AUpgradeable__factory; } });
var ERC721A__IERC721Receiver__factory_1 = require("./factories/erc721a/contracts/ERC721A.sol/ERC721A__IERC721Receiver__factory");
Object.defineProperty(exports, "ERC721A__IERC721Receiver__factory", { enumerable: true, get: function () { return ERC721A__IERC721Receiver__factory_1.ERC721A__IERC721Receiver__factory; } });
var ERC721A__factory_1 = require("./factories/erc721a/contracts/ERC721A.sol/ERC721A__factory");
Object.defineProperty(exports, "ERC721A__factory", { enumerable: true, get: function () { return ERC721A__factory_1.ERC721A__factory; } });
var IERC721A__factory_1 = require("./factories/erc721a/contracts/IERC721A__factory");
Object.defineProperty(exports, "IERC721A__factory", { enumerable: true, get: function () { return IERC721A__factory_1.IERC721A__factory; } });
