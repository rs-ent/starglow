"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ECDSA__factory = void 0;
/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
const ethers_1 = require("ethers");
const _abi = [
    {
        inputs: [],
        name: "ECDSAInvalidSignature",
        type: "error",
    },
    {
        inputs: [
            {
                internalType: "uint256",
                name: "length",
                type: "uint256",
            },
        ],
        name: "ECDSAInvalidSignatureLength",
        type: "error",
    },
    {
        inputs: [
            {
                internalType: "bytes32",
                name: "s",
                type: "bytes32",
            },
        ],
        name: "ECDSAInvalidSignatureS",
        type: "error",
    },
];
const _bytecode = "0x608060405234601a57604051603f6020823930815050603f90f35b600080fdfe6080604052600080fdfea26469706673582212201880293c10f97aeafbe959ffe32bd5e719c4b78e6768150eef9e2bc6078f57d964736f6c634300081c0033";
const isSuperArgs = (xs) => xs.length > 1;
class ECDSA__factory extends ethers_1.ContractFactory {
    constructor(...args) {
        if (isSuperArgs(args)) {
            super(...args);
        }
        else {
            super(_abi, _bytecode, args[0]);
        }
    }
    getDeployTransaction(overrides) {
        return super.getDeployTransaction(overrides || {});
    }
    deploy(overrides) {
        return super.deploy(overrides || {});
    }
    connect(runner) {
        return super.connect(runner);
    }
    static createInterface() {
        return new ethers_1.Interface(_abi);
    }
    static connect(address, runner) {
        return new ethers_1.Contract(address, _abi, runner);
    }
}
exports.ECDSA__factory = ECDSA__factory;
ECDSA__factory.bytecode = _bytecode;
ECDSA__factory.abi = _abi;
