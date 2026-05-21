import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Lock,
    ArrowRight,
    Cpu,
    RefreshCcw,
    Shield,
    Terminal,
    Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Encryptable, FheTypes } from '@cofhe/sdk';
import { arbSepolia } from '@cofhe/sdk/chains';
import { useCofhe } from '@/hooks/useCofhe';

export default function EncryptionPlayground() {
    const [plaintext, setPlaintext] = useState('');
    const [isEncrypting, setIsEncrypting] = useState(false);
    const [encryptedValue, setEncryptedValue] = useState(null);
    const [operations, setOperations] = useState([]);
    const [selectedOp, setSelectedOp] = useState('add');
    const [opValue, setOpValue] = useState('5');

    const { isInitialized, client, account } = useCofhe();

    const generateRandomHex = (length) =>
        Array.from({ length }, () => Math.floor(Math.random() * 16).toString(16)).join('');

    const createSimulatedEncryptedUint32 = () => ({
        ctHash: `0x${generateRandomHex(64)}`,
        securityZone: 0,
        utype: FheTypes.Uint32,
        signature: `0x${generateRandomHex(130)}`,
    });

    const handleEncrypt = async () => {
        if (!plaintext || isNaN(plaintext)) return;

        setIsEncrypting(true);

        try {
            const val = BigInt(Number(plaintext));

            if (!isInitialized || !client) {
                const simulatedEncrypted = createSimulatedEncryptedUint32();
                console.warn('CoFHE not initialized. Using simulated InEuint32 output for playground.');
                setEncryptedValue({
                    handle: simulatedEncrypted.ctHash,
                    original: val,
                    type: 'euint32',
                    raw: simulatedEncrypted,
                    simulated: true,
                });
                return;
            }

            let encryptionRequest = client.encryptInputs([Encryptable.uint32(val)]);
            if (account) {
                encryptionRequest = encryptionRequest.setChainId(arbSepolia.id).setAccount(account);
            }

            const [encrypted] = await encryptionRequest.execute();

            let handle = '0x...';
            if (typeof encrypted === 'string') handle = encrypted;
            else if (encrypted && typeof encrypted === 'object') {
                const h = Object.values(encrypted).find(
                    (v) => typeof v === 'string' && v.startsWith('0x') && v.length > 20
                );
                if (h) handle = h;
                else handle = JSON.stringify(encrypted).substring(0, 20) + '...';
            }

            setEncryptedValue({
                handle,
                original: val,
                type: 'euint32',
                raw: encrypted,
                simulated: false,
            });
        } catch (err) {
            console.error('Encryption failed:', err);
            const simulatedEncrypted = createSimulatedEncryptedUint32();
            setEncryptedValue({
                handle: simulatedEncrypted.ctHash,
                original: BigInt(Number(plaintext)),
                type: 'euint32',
                raw: simulatedEncrypted,
                simulated: true,
            });
        } finally {
            setIsEncrypting(false);
            setOperations([]);
        }
    };

    const handleReset = () => {
        setPlaintext('');
        setEncryptedValue(null);
        setOperations([]);
    };

    const addOperation = () => {
        if (!encryptedValue) return;

        const newOp = {
            id: Date.now(),
            type: selectedOp,
            operand: opValue,
            resultHandle: '0x' + Math.random().toString(16).slice(2).repeat(4),
        };

        setOperations([...operations, newOp]);
    };

    const generateCodePreview = () => {
        if (!encryptedValue) return '// Waiting for input...';

        let code = `// 1. Initialize (via useCofhe hook)\n`;
        code += `const { isInitialized, client } = useCofhe();\n`;
        code += `// 2. Encrypt\n`;
        code += `const [encryptedInput] = await client\n`;
        code += `  .encryptInputs([Encryptable.uint32(${encryptedValue.original}n)])\n`;
        code += `  .execute();\n\n`;
        code += `// Result (InEuint32 format)\n`;
        code += `// ${encryptedValue.handle.substring(0, 18)}...\n\n`;
        code += `// 3. Send to Contract\n`;
        code += `await contract.set(encryptedInput);\n`;

        if (operations.length > 0) {
            code += `\n// On-Chain Operations (Simulated)\n`;
            code += `function process(euint32 x) public {\n`;
            operations.forEach((op) => {
                if (op.type === 'add') code += `    x = FHE.add(x, FHE.asEuint32(${op.operand}));\n`;
                if (op.type === 'mul') code += `    x = FHE.mul(x, FHE.asEuint32(${op.operand}));\n`;
                if (op.type === 'gt') code += `    ebool isGt = FHE.gt(x, FHE.asEuint32(${op.operand}));\n`;
            });
            code += `}`;
        }

        return code;
    };

    return (
        <div className="w-full max-w-6xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-white font-display mb-2">Encryption Playground</h2>
                    <p className="text-slate-400 max-w-2xl">
                        Experiment with client-side encryption using the CoFHE SDK. See how plaintext is transformed
                        into ciphertext and prepared for the blockchain without ever revealing the secret.
                    </p>
                </div>
                <div className="hidden md:flex items-center gap-2 bg-[#022031] px-4 py-2 rounded-lg border border-[#0AD9DC]/20">
                    <Shield className="w-5 h-5 text-[#0AD9DC]" />
                    <span className="text-xs font-bold text-white">Client-Side Secure</span>
                </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <Card className="bg-[#011623] border-white/10 p-6 relative overflow-hidden">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <Lock className="w-4 h-4 text-slate-400" /> Plaintext Input
                            </h3>
                            {encryptedValue && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleReset}
                                    className="text-slate-400 hover:text-white h-8"
                                >
                                    <RefreshCcw className="w-4 h-4 mr-1" /> Reset
                                </Button>
                            )}
                        </div>

                        <div className="flex gap-4 items-end">
                            <div className="flex-1">
                                <label className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2 block">
                                    Number Value
                                </label>
                                <Input
                                    type="number"
                                    placeholder="e.g., 42"
                                    value={plaintext}
                                    onChange={(e) => setPlaintext(e.target.value)}
                                    disabled={!!encryptedValue}
                                    className="bg-black/20 border-white/10 text-white font-mono text-lg h-12"
                                />
                            </div>
                            <Button
                                onClick={handleEncrypt}
                                disabled={!plaintext || !!encryptedValue || isEncrypting}
                                className={`h-12 px-6 font-bold min-w-[140px] transition-all ${!!encryptedValue
                                    ? 'bg-green-500/20 text-green-500 hover:bg-green-500/30 cursor-default'
                                    : 'bg-[#0AD9DC] text-[#011623] hover:bg-[#0AD9DC]/90'
                                    }`}
                            >
                                {isEncrypting ? (
                                    <RefreshCcw className="w-4 h-4 animate-spin mr-2" />
                                ) : !!encryptedValue ? (
                                    <>
                                        <Lock className="w-4 h-4 mr-2" /> Encrypted
                                    </>
                                ) : (
                                    'Encrypt'
                                )}
                            </Button>
                        </div>
                    </Card>

                    <AnimatePresence mode="wait">
                        {encryptedValue && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                            >
                                <Card className="bg-[#022031] border-[#0AD9DC]/30 p-6 relative overflow-hidden shadow-[0_0_30px_rgba(10,217,220,0.1)]">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#0AD9DC]/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />

                                    <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                                        <Lock className="w-4 h-4 text-[#0AD9DC]" /> Encrypted Output
                                    </h3>

                                    <div className="bg-black/30 rounded-xl p-4 font-mono text-sm border border-[#0AD9DC]/20 mb-4 break-all relative group">
                                        <div className="text-[10px] text-slate-500 uppercase mb-1 font-bold">
                                            Ciphertext Handle (InEuint32)
                                        </div>
                                        <span className="text-[#0AD9DC] drop-shadow-[0_0_10px_rgba(10,217,220,0.3)]">
                                            {encryptedValue.handle}
                                        </span>

                                        <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs p-2 rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                                            This blob hides the value &quot;{encryptedValue.original}&quot;
                                        </div>
                                    </div>

                                    <div className="bg-slate-950/30 rounded-xl p-3 font-mono text-xs text-slate-300 border border-white/5 overflow-auto max-h-40 mb-4">
                                        <div className="text-slate-400 uppercase tracking-widest text-[10px] mb-2">
                                            Encrypted Object Preview
                                        </div>
                                        <pre className="whitespace-pre-wrap break-words text-[11px] leading-relaxed">
                                            {JSON.stringify(encryptedValue.raw, null, 2)}
                                        </pre>
                                    </div>

                                    {encryptedValue.simulated && (
                                        <div className="text-xs text-yellow-300 bg-yellow-500/10 p-3 rounded-lg border border-yellow-500/20 mb-4">
                                            CoFHE is not fully initialized in this session, so this playground is displaying a simulated
                                            InEuint32 ciphertext object for demonstration.
                                        </div>
                                    )}

                                    <div className="flex items-center gap-2 text-xs text-slate-400 bg-[#0AD9DC]/5 p-3 rounded-lg border border-[#0AD9DC]/10">
                                        <Shield className="w-4 h-4 text-[#0AD9DC] shrink-0" />
                                        The blockchain only sees this. The mathematical properties allow operations
                                        without decryption.
                                    </div>
                                </Card>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <AnimatePresence>
                        {encryptedValue && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                <Card className="bg-[#011623] border-white/10 p-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                            <Cpu className="w-4 h-4 text-slate-400" /> Apply Operations
                                        </h3>
                                    </div>

                                    <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                                        {['add', 'mul', 'sub', 'gt'].map((op) => (
                                            <button
                                                key={op}
                                                onClick={() => setSelectedOp(op)}
                                                className={`px-4 py-2 rounded-lg font-mono text-sm font-bold border transition-all uppercase ${selectedOp === op
                                                    ? 'bg-[#0AD9DC]/20 border-[#0AD9DC] text-[#0AD9DC]'
                                                    : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'
                                                    }`}
                                            >
                                                {op}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="flex gap-4 items-center mb-6">
                                        <div className="font-mono text-[#0AD9DC] font-bold text-lg">x</div>
                                        <div className="font-mono text-slate-400 font-bold">
                                            {selectedOp === 'add' ? '+' : selectedOp === 'sub' ? '-' : selectedOp === 'mul' ? '*' : '>'}
                                        </div>
                                        <Input
                                            type="number"
                                            value={opValue}
                                            onChange={(e) => setOpValue(e.target.value)}
                                            className="w-24 bg-black/20 border-white/10 text-white font-mono text-center"
                                        />
                                        <Button onClick={addOperation} className="bg-white/10 hover:bg-white/20 text-black">
                                            Apply
                                        </Button>
                                    </div>

                                    <div className="space-y-2">
                                        {operations.map((op, i) => (
                                            <motion.div
                                                key={op.id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/5"
                                            >
                                                <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-xs text-slate-400 font-mono">
                                                    {i + 1}
                                                </div>
                                                <div className="flex-1 font-mono text-sm text-slate-300">
                                                    <span className="text-[#0AD9DC]">x</span>
                                                    <span className="text-purple-400 mx-2">
                                                        {op.type === 'add' ? 'FHE.add' : op.type === 'mul' ? 'FHE.mul' : op.type === 'gt' ? 'FHE.gt' : op.type}
                                                    </span>
                                                    <span>{op.operand}</span>
                                                </div>
                                                <ArrowRight className="w-4 h-4 text-slate-600" />
                                                <div className="font-mono text-xs text-[#0AD9DC] opacity-50 truncate max-w-[100px]">
                                                    {op.resultHandle}
                                                </div>
                                            </motion.div>
                                        ))}
                                        {operations.length === 0 && (
                                            <div className="text-center text-slate-500 text-sm italic py-4">
                                                No operations applied yet. Try adding some math!
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="space-y-6">
                    <Card className="bg-[#00101a] border-white/10 overflow-hidden flex flex-col h-full min-h-[500px]">
                        <div className="bg-slate-900/50 border-b border-white/5 px-4 py-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Terminal className="w-4 h-4 text-slate-400" />
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    Contract Interaction Preview
                                </span>
                            </div>
                            <div className="flex gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full bg-red-500/20" />
                                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20" />
                                <div className="w-2.5 h-2.5 rounded-full bg-green-500/20" />
                            </div>
                        </div>

                        <div className="flex-1 p-6 overflow-auto custom-scrollbar bg-black/20">
                            <pre className="font-mono text-sm text-slate-300 leading-relaxed">
                                {generateCodePreview()
                                    .split('\n')
                                    .map((line, i) => (
                                        <div key={i} className="table-row">
                                            <span className="table-cell text-slate-700 select-none pr-4 text-right w-8">
                                                {i + 1}
                                            </span>
                                            <span
                                                className="table-cell"
                                                dangerouslySetInnerHTML={{
                                                    __html: line
                                                        .replace(/\/\/.*/g, '<span class="text-slate-500 italic">$&</span>')
                                                        .replace(
                                                            /(const|await|function|public)/g,
                                                            '<span class="text-purple-400">$1</span>'
                                                        )
                                                        .replace(/(CoFHE|FHE|cofhesdk)/g, '<span class="text-yellow-400">$1</span>')
                                                        .replace(/(euint32|ebool|string)/g, '<span class="text-[#0AD9DC]">$1</span>'),
                                                }}
                                            />
                                        </div>
                                    ))}
                            </pre>
                        </div>

                        <div className="p-4 border-t border-white/5 bg-slate-900/30">
                            <div className="flex gap-3 items-start">
                                <Zap className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="text-white font-bold text-sm mb-1">What&apos;s happening here?</h4>
                                    <p className="text-slate-400 text-xs leading-relaxed">
                                        Using cofhesdk: <code className="text-[#0AD9DC]">encryptInputs()</code> returns
                                        an InEuint32-compatible encrypted input passed to the contract. The contract uses
                                        FHE.add, FHE.mul, etc. for encrypted operations.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
