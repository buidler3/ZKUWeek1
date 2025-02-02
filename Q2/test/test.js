const { expect, assert } = require("chai");
const { ethers } = require("hardhat");
const { groth16, plonk } = require("snarkjs");

const wasm_tester = require("circom_tester").wasm;

const F1Field = require("ffjavascript").F1Field;
const Scalar = require("ffjavascript").Scalar;
exports.p = Scalar.fromString("21888242871839275222246405745257275088548364400416034343698204186575808495617");
const Fr = new F1Field(exports.p);

describe("HelloWorld", function () {
    this.timeout(100000000);
    let Verifier;
    let verifier;

    beforeEach(async function () {
        Verifier = await ethers.getContractFactory("HelloWorldVerifier");
        verifier = await Verifier.deploy();
        await verifier.deployed();
    });

    it("Circuit should multiply two numbers correctly", async function () {
        const circuit = await wasm_tester("contracts/circuits/HelloWorld.circom");

        const INPUT = {
            "a": 2,
            "b": 3
        }

        const witness = await circuit.calculateWitness(INPUT, true);

        //console.log(witness);

        assert(Fr.eq(Fr.e(witness[0]),Fr.e(1)));
        assert(Fr.eq(Fr.e(witness[1]),Fr.e(6)));

    });

    it("Should return true for correct proof", async function () {
        //[assignment] Add comments to explain what each line is doing
        // Produce groth16 proof based on randomly selected input a=2,b=3
        const { proof, publicSignals } = await groth16.fullProve({"a":"2","b":"3"}, "contracts/circuits/HelloWorld/HelloWorld_js/HelloWorld.wasm","contracts/circuits/HelloWorld/circuit_final.zkey");

        // Print equations represents the relation of inputs and output
        console.log('2x3 =',publicSignals[0]);
        
        // Generate arguments of hex format for prover contract
        const calldata = await groth16.exportSolidityCallData(proof, publicSignals);
    
        // Ttransfer format from hex to uint
        const argv = calldata.replace(/["[\]\s]/g, "").split(',').map(x => BigInt(x).toString());
    
        // Wrap up arguments for verifying
        const a = [argv[0], argv[1]];
        const b = [[argv[2], argv[3]], [argv[4], argv[5]]];
        const c = [argv[6], argv[7]];
        const Input = argv.slice(8);

        // Check the validity of proof by comparing expected true value
        expect(await verifier.verifyProof(a, b, c, Input)).to.be.true;
    });
    it("Should return false for invalid proof", async function () {
        let a = [0, 0];
        let b = [[0, 0], [0, 0]];
        let c = [0, 0];
        let d = [0]
        expect(await verifier.verifyProof(a, b, c, d)).to.be.false;
    });
});


describe("Multiplier3 with Groth16", function () {

    beforeEach(async function () {
        //[assignment] insert your script here
        // Instantiate smart contract
        Verifier = await ethers.getContractFactory("Multiplier3Verifier");
        // Deploy smart contract
        verifier = await Verifier.deploy();
        // Wait until deployment settled
        await verifier.deployed();
    });

    it("Circuit should multiply three numbers correctly", async function () {
        //[assignment] insert your script here
        // Create circuit instance
        const circuit = await wasm_tester("contracts/circuits/Multiplier3.circom");

        const INPUT = {
            "a": 2,
            "b": 3,
            "c": 4
        }

        const witness = await circuit.calculateWitness(INPUT, true);

        // Check soundness of witness
        assert(Fr.eq(Fr.e(witness[0]),Fr.e(1)));
        assert(Fr.eq(Fr.e(witness[1]),Fr.e(24)));

    });

    it("Should return true for correct proof", async function () {
        //[assignment] insert your script here
        // Produce GROTH16 proof based on randomly selected input a=1,b=2,c=3
        const { proof, publicSignals } = await groth16.fullProve({"a":"1","b":"2","c":"3"}, "contracts/circuits/Multiplier3/Multiplier3_js/Multiplier3.wasm","contracts/circuits/Multiplier3/circuit_final.zkey");

        // Print equations represents the relation of inputs and output
        console.log('1x2x3 =',publicSignals[0]);
        
        // Generate arguments of hex format for prover contract
        const calldata = await groth16.exportSolidityCallData(proof, publicSignals);
    
        // Transform format from hex to uint
        const argv = calldata.replace(/["[\]\s]/g, "").split(',').map(x => BigInt(x).toString());        

        // Wrap up arguments for verifying
        const a = [argv[0], argv[1]];
        const b = [[argv[2], argv[3]], [argv[4], argv[5]]];
        const c = [argv[6], argv[7]];

        // Split ouput out from argv
        const Input = argv.slice(8);

        // Check the validity of proof by comparing expected true value
        expect(await verifier.verifyProof(a, b, c, Input)).to.be.true;
    });

    it("Should return false for invalid proof", async function () {
        //[assignment] insert your script here
        // Set invalid arguments for proof
        let a = [0, 0];
        let b = [[0, 0], [0, 0]];
        let c = [0, 0];
        let d = [0]
        // Check the validity of proof by comparing expected false value
        expect(await verifier.verifyProof(a, b, c, d)).to.be.false;
    });
});


describe("Multiplier3 with PLONK", function () {

    beforeEach(async function () {
        //[assignment] insert your script here
        // Instantiate smart contract
        Verifier = await ethers.getContractFactory("PlonkVerifier");
        // Deploy smart contract
        verifier = await Verifier.deploy();
        // Wait until deployment settled
        await verifier.deployed();
    });

    it("Should return true for correct proof", async function () {
        //[assignment] insert your script here
        // Produce PLONK proof based on randomly selected input a=1,b=2,c=3
        const { proof, publicSignals } = await plonk.fullProve({"a":"1","b":"2","c":"3"}, "contracts/circuits/Multiplier3_plonk/Multiplier3_js/Multiplier3.wasm","contracts/circuits/Multiplier3_plonk/circuit_final.zkey");

        // Print equations represents the relation of inputs and output
        console.log('1x2x3 =',publicSignals[0]);

        // Generate arguments of hex format for prover contract
        const calldata = await plonk.exportSolidityCallData(proof, publicSignals);

        // Split calldata to arguments of proof and output
        const argv = calldata.replace(/["[\]\s]/g, "").split(',')
        const a = argv[0];

        // Split ouput out from argv
        const Input = argv.slice(1);

        // Check the validity of proof by comparing expected true value
        expect(await verifier.verifyProof(a, Input)).to.be.true;
    });
    
    it("Should return false for invalid proof", async function () {
        //[assignment] insert your script here
        // Set invalid arguments for proof
        let a = '0xaa';
        let b = ['0x01'];
        // Check the validity of proof by comparing expected false value
        expect(await verifier.verifyProof(a, b)).to.be.false;
    });
});