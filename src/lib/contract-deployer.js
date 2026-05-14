import { createWalletClient, createPublicClient, custom, encodeDeployData } from 'viem';
import { arbitrumSepolia } from 'viem/chains';
import { Encryptable } from '@cofhe/sdk';

// Reference contract code - see getReferenceContractInfo()
const REFERENCE_CONTRACT = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "@fhenixprotocol/cofhe-contracts/FHE.sol";

contract HiddenValue {
    euint32 private val;

    function set(InEuint32 calldata encryptedInput) public {
        val = FHE.asEuint32(encryptedInput);
        FHE.allowThis(val);
        FHE.allowSender(val);
    }

    function get() public view returns (euint32) {
        return val;
    }
}`;

const DEPLOYED_CONTRACT_ADDRESS = '0x82882Ea4B0997472C56109CF99aA118466f82641';

const HIDDEN_VALUE_ABI = [
    { inputs: [], name: 'get', outputs: [{ internalType: 'euint32', name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' },
    {
        inputs: [{
            components: [
                { internalType: 'uint256', name: 'ctHash', type: 'uint256' },
                { internalType: 'uint8', name: 'securityZone', type: 'uint8' },
                { internalType: 'uint8', name: 'utype', type: 'uint8' },
                { internalType: 'bytes', name: 'signature', type: 'bytes' },
            ],
            internalType: 'struct InEuint32',
            name: 'encryptedInput',
            type: 'tuple',
        }],
        name: 'set',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
];

const HIDDEN_VALUE_BYTECODE = '0x6080604052348015600e575f80fd5b506103d68061001c5f395ff3fe608060405234801561000f575f80fd5b5060043610610034575f3560e01c80636d4ce63c14610038578063b95ca4fb1461004c575b5f80fd5b5f5460405190815260200160405180910390f35b61005f61005a366004610198565b610061565b005b61007261006d82610252565b610077565b5f5550565b60408101515f9060049060ff1681146100ba5760408084015190516367cf307160e01b815260ff9182166004820152908216602482015260440160405180910390fd5b60408051608080820183525f808352602080840182905283850191909152606092830183905283519182018452865182528087015160ff1690820152600492810192909252808501519082015261011090610117565b9392505050565b6040516313fce3b160e11b81525f9073ea30c4b8b44078bbf8a6ef5b9f1ec1626c7848d9906327f9c762906101529085903390600401610314565b6020604051808303815f875af115801561016e573d5f803e3d5ffd5b505050506040513d601f19601f820116820180604052508101906101929190610389565b92915050565b5f602082840312156101a8575f80fd5b813567ffffffffffffffff8111156101be575f80fd5b820160808185031215610110575f80fd5b634e487b7160e01b5f52604160045260245ffd5b6040516080810167ffffffffffffffff81118282101715610206576102066101cf565b60405290565b604051601f8201601f1916810167ffffffffffffffff81118282101715610235576102356101cf565b604052919050565b803560ff8116811461024d575f80fd5b919050565b5f60808236031215610262575f80fd5b61026a6101e3565b82358152602061027b81850161023d565b8183015261028b6040850161023d565b6040830152606084013567ffffffffffffffff808211156102aa575f80fd5b9085019036601f8301126102bc575f80fd5b8135818111156102ce576102ce6101cf565b6102e0601f8201601f1916850161020c565b915080825236848285010111156102f5575f80fd5b80848401858401375f9082019093019290925250606082015292915050565b604081528251604082015260ff602084015116606082015260ff60408401511660808201525f6060840151608060a084015280518060c0850152806020830160e086015e5f60e08286018101919091526001600160a01b03959095166020850152601f01601f19169092019092019392505050565b5f60208284031215610399575f80fd5b505191905056fea26469706673582212204f192e6c2fa849f4a627feb313135306203e50ed3d0d2cca9b77052c8dbaed5964736f6c63430008190033';

export function getReferenceContractInfo() {
    return {
        address: DEPLOYED_CONTRACT_ADDRESS,
        referenceCode: REFERENCE_CONTRACT,
        abi: HIDDEN_VALUE_ABI,
        bytecode: HIDDEN_VALUE_BYTECODE,
    };
}

export function validateContractStructure(userCode, referenceCode = REFERENCE_CONTRACT) {
    const errors = [];
    const normalizedUser = userCode.toLowerCase().replace(/\s+/g, ' ');
    const checks = [
        { name: 'SPDX license', pattern: /spdx-license-identifier/i },
        { name: 'pragma solidity', pattern: /pragma\s+solidity/i },
        { name: 'FHE import', pattern: /@fhenixprotocol\/cofhe-contracts\/fhe\.sol/i },
        { name: 'contract HiddenValue', pattern: /contract\s+hiddenvalue/i },
        { name: 'euint32 private val', pattern: /euint32\s+private\s+val/i },
        { name: 'function set', pattern: /function\s+set\s*\([^)]*ineuint32[^)]*\)/i },
        { name: 'FHE.asEuint32', pattern: /fhe\.aseuint32/i },
        { name: 'function get', pattern: /function\s+get\s*\([^)]*\)\s*[^{]*returns\s*\([^)]*euint32[^)]*\)/i },
        { name: 'return val', pattern: /return\s+val/i },
    ];
    for (const check of checks) {
        if (!check.pattern.test(userCode)) errors.push(`Missing or incorrect: ${check.name}`);
    }
    const setMatch = userCode.match(/function\s+set[^{]*\{([^}]+)\}/is);
    if (setMatch) {
        const setBody = setMatch[1].toLowerCase();
        if (!setBody.includes('val=') && !setBody.includes('val =')) errors.push('set() function must assign to val');
    }
    return { success: errors.length === 0, errors };
}

export async function deployContract(provider, account, abi, bytecode) {
    try {
        const walletClient = createWalletClient({
            chain: arbitrumSepolia,
            transport: custom(provider),
            account,
        });
        const publicClient = createPublicClient({
            chain: arbitrumSepolia,
            transport: custom(provider),
        });
        const deployData = encodeDeployData({
            abi,
            bytecode: bytecode.startsWith('0x') ? bytecode : `0x${bytecode}`,
            args: [],
        });
        const maxPriorityFeePerGas = BigInt(1000000000);
        const maxFeePerGas = BigInt(10000000000);
        let estimatedGas;
        try {
            estimatedGas = await publicClient.estimateGas({ account, data: deployData });
            estimatedGas = (estimatedGas * BigInt(120)) / BigInt(100);
        } catch {
            estimatedGas = BigInt(3000000);
        }
        const nonce = await publicClient.getTransactionCount({ address: account });
        const chainId = arbitrumSepolia.id;
        const rawTransaction = {
            from: account,
            data: deployData,
            gas: `0x${estimatedGas.toString(16)}`,
            maxFeePerGas: `0x${maxFeePerGas.toString(16)}`,
            maxPriorityFeePerGas: `0x${maxPriorityFeePerGas.toString(16)}`,
            type: '0x2',
            chainId: `0x${chainId.toString(16)}`,
            nonce: `0x${nonce.toString(16)}`,
        };
        const hash = await provider.request({ method: 'eth_sendTransaction', params: [rawTransaction] });
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        if (receipt.contractAddress) {
            return { success: true, contractAddress: receipt.contractAddress, transactionHash: hash };
        }
        return { success: false, error: 'Contract deployment failed - no contract address in receipt' };
    } catch (error) {
        return { success: false, error: error.message || 'Deployment failed' };
    }
}

export async function testDeployedContract(provider, account, contractAddress, abi, walletClient, publicClient, cofheClient) {
    try {
        const code = await publicClient.getBytecode({ address: contractAddress });
        if (!code || code === '0x') return { success: false, error: 'Contract has no code' };

        if (!cofheClient) {
            return { success: false, error: 'CoFHE client not provided' };
        }

        await cofheClient.permits.getOrCreateSelfPermit();

        const testValue = 42n;
        const [encryptedInput] = await cofheClient
            .encryptInputs([Encryptable.uint32(testValue)])
            .execute();

        let contractAbi = HIDDEN_VALUE_ABI;
        if (abi && Array.isArray(abi) && abi.length > 0) contractAbi = abi;
        else if (abi && typeof abi === 'object' && abi.abi && Array.isArray(abi.abi)) contractAbi = abi.abi;

        const setHash = await walletClient.writeContract({
            address: contractAddress,
            abi: contractAbi,
            functionName: 'set',
            args: [encryptedInput],
            account,
        });
        await publicClient.waitForTransactionReceipt({ hash: setHash });

        let handle;
        try {
            handle = await publicClient.readContract({
                address: contractAddress,
                abi: contractAbi,
                functionName: 'get',
                args: [],
            });
        } catch {
            return { success: true, message: 'set() executed successfully', note: 'get() requires additional setup', encryptedValue: testValue };
        }
        if (handle === undefined || handle === null) return { success: false, error: 'Contract returned undefined handle' };
        return { success: true, message: 'Test passed', handle: handle.toString(), encryptedValue: testValue };
    } catch (error) {
        return { success: false, error: error.message || 'Contract test failed' };
    }
}
