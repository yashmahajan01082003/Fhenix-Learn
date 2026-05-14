import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, X, Share2, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import { usePrivy, useWallets, useSendTransaction } from '@privy-io/react-auth';
import { useUserProgress } from '@/components/UserProgressContext';
import { Interface } from 'ethers';

// FhenixLearnBadge ERC-721 on Arbitrum Sepolia — keep in sync with hardhat/deployments.json
const BADGE_CONTRACT_ADDRESS = '0x910F079D4a48CbB8B28b791E8Cfd7B3c1c40eEAc';
const ARBITRUM_SEPOLIA_CHAIN_ID = 421614;

export default function BadgeAwardModal({ isOpen, onClose, badge }) {
    const { width, height } = useWindowSize();
    const { ready, authenticated } = usePrivy();
    const { wallets } = useWallets();
    const { progress } = useUserProgress();
    const [isMinting, setIsMinting] = useState(false);
    const [mintSuccess, setMintSuccess] = useState(false);
    const [mintError, setMintError] = useState(null);
    const [txHash, setTxHash] = useState(null);

    // Reset mint state whenever the modal opens for a (possibly new) badge so each badge shows Mint button
    useEffect(() => {
        if (isOpen && badge) {
            setMintSuccess(false);
            setMintError(null);
            setTxHash(null);
        }
    }, [isOpen, badge?.id]);

    if (!isOpen || !badge) return null;

    const isSpecial = badge.special === true;
    const confettiCount = isSpecial ? 1000 : 500;
    const badgeSize = isSpecial ? 'w-40 h-40' : 'w-32 h-32';
    const iconSize = isSpecial ? 'w-20 h-20' : 'w-16 h-16';

    // Calculate progress
    const totalModules = 6;
    const completedModules = progress?.completed_modules?.length || 0;
    const progressPercent = Math.round((completedModules / totalModules) * 100);

    const { sendTransaction } = useSendTransaction();

    const handleMint = async () => {
        if (!authenticated || !ready) {
            setMintError('Please connect your wallet first.');
            return;
        }
        if (!wallets?.length) {
            setMintError('No wallet connected. Connect a wallet in Privy to mint.');
            return;
        }

        setIsMinting(true);
        setMintError(null);
        setTxHash(null);

        try {
            // Standardized metadata with module id for indexing (badge.id = e.g. module-1, completion)
            const metadata = {
                name: badge.name,
                description: badge.description || "You've mastered a new skill in the FHE universe.",
                image: "ipfs://bafkreiet6x2hw6c57q36o6srfpqedlcyr6m43d7sokq4f2f45v6z3qg4ma",
                attributes: [
                    { trait_type: "Badge ID", value: badge.id || "unknown" },
                    { trait_type: "Module", value: badge.id?.replace("module-", "") || "completion" }
                ]
            };
            const metadataString = JSON.stringify(metadata);
            const metadataUri = `data:application/json;base64,${btoa(metadataString)}`;

            const badgeInterface = new Interface([
                'function mint(string memory uri) public returns (uint256)'
            ]);
            const encodedData = badgeInterface.encodeFunctionData('mint', [metadataUri]);

            // Privy requires an explicit wallet address for sendTransaction (embedded or connected)
            const walletAddress = wallets[0]?.address;
            if (!walletAddress) {
                setMintError('No wallet address available. Try reconnecting your wallet in the Privy menu.');
                return;
            }

            const txReceipt = await sendTransaction({
                to: BADGE_CONTRACT_ADDRESS,
                data: encodedData,
                chainId: ARBITRUM_SEPOLIA_CHAIN_ID
            }, {
                address: walletAddress,
                uiOptions: {
                    header: `Mint ${badge.name}`,
                    description: 'Minting your completion badge on Arbitrum Sepolia!',
                    buttonText: 'Confirm Mint'
                }
            });

            const hash = txReceipt?.transactionHash || txReceipt?.hash;
            if (hash) {
                console.log('[BadgeAwardModal] Mint tx confirmed:', hash);
                setTxHash(hash);
            }
            setMintSuccess(true);
        } catch (error) {
            const message = error?.message || String(error);
            const code = error?.code ?? error?.cause?.code;
            console.error('[BadgeAwardModal] Mint failed:', { message, code, error });

            if (code === 4902 || message?.toLowerCase().includes('chain') || message?.toLowerCase().includes('network')) {
                setMintError('Wrong network. Please switch to Arbitrum Sepolia in your wallet.');
            } else if (message?.toLowerCase().includes('reject') || code === 4001) {
                setMintError('Transaction was rejected.');
            } else {
                setMintError(message || 'Mint failed. Try again or check your wallet is on Arbitrum Sepolia.');
            }
        } finally {
            setIsMinting(false);
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                />

                {/* Confetti */}
                <div className="absolute inset-0 pointer-events-none z-50">
                    <Confetti width={width} height={height} recycle={false} numberOfPieces={confettiCount} />
                </div>

                {/* Modal */}
                <motion.div
                    initial={{ scale: 0.5, opacity: 0, y: 50 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.5, opacity: 0, y: 50 }}
                    className={`relative bg-[#022031] border rounded-3xl p-8 max-w-md w-full shadow-[0_0_50px_-10px_rgba(10,217,220,0.3)] overflow-hidden ${isSpecial ? 'border-yellow-400/50' : 'border-[#0AD9DC]/30'}`}
                >
                    {/* Glow Effect */}
                    <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 blur-[60px] -z-10 ${isSpecial ? 'bg-yellow-400/30' : 'bg-[#0AD9DC]/20'}`} />

                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>

                    <div className="flex flex-col items-center text-center">
                        <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
                            className={`${badgeSize} rounded-full flex items-center justify-center border-4 mb-6 shadow-[0_0_30px_-5px_currentColor] ${badge.bg} ${badge.border} ${badge.color}`}
                        >
                            <Award className={iconSize} />
                        </motion.div>

                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="text-3xl font-bold text-white mb-2"
                        >
                            Badge Unlocked!
                        </motion.h2>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="text-[#0AD9DC] font-bold text-xl mb-4"
                        >
                            {badge.name}
                        </motion.p>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                            className="text-slate-400 mb-4"
                        >
                            {badge.description || "You've mastered a new skill in the FHE universe."}
                        </motion.p>

                        {/* Progress Indicator */}
                        {!isSpecial && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.7 }}
                                className="w-full mb-6 p-4 bg-white/5 rounded-lg border border-white/10"
                            >
                                <div className="flex justify-between text-xs text-slate-400 mb-2">
                                    <span>Module Progress</span>
                                    <span className="font-bold text-[#0AD9DC]">{completedModules}/{totalModules} Completed</span>
                                </div>
                                <div className="h-2 bg-black/50 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progressPercent}%` }}
                                        transition={{ delay: 0.9, duration: 0.8 }}
                                        className="h-full bg-gradient-to-r from-[#0AD9DC] to-blue-500"
                                    />
                                </div>
                                {completedModules < totalModules && (
                                    <p className="text-xs text-slate-500 mt-2 text-center">
                                        🚀 Keep going! {totalModules - completedModules} module{totalModules - completedModules !== 1 ? 's' : ''} remaining
                                    </p>
                                )}
                            </motion.div>
                        )}

                        {/* Special completion message */}
                        {isSpecial && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.7 }}
                                className="w-full mb-6 p-4 bg-gradient-to-r from-yellow-400/10 to-orange-500/10 rounded-lg border border-yellow-400/20"
                            >
                                <p className="text-yellow-400 font-bold text-center">
                                    🎉 Congratulations! You've mastered all of CoFHE! 🎉
                                </p>
                            </motion.div>
                        )}

                        {mintError && (
                            <div className="w-full mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                                {mintError}
                            </div>
                        )}

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.7 }}
                            className="flex gap-3 w-full"
                        >
                            {!mintSuccess ? (
                                <>
                                    <Button
                                        onClick={handleMint}
                                        disabled={isMinting}
                                        className="flex-1 bg-[#0AD9DC] hover:bg-[#0AD9DC]/90 text-[#011623] font-bold h-12 rounded-xl disabled:opacity-50"
                                    >
                                        {isMinting ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Minting...
                                            </>
                                        ) : (
                                            'Mint On-Chain Badge'
                                        )}
                                    </Button>
                                    <Button
                                        onClick={onClose}
                                        variant="outline"
                                        className="flex-1 border-white/10 hover:bg-white/5 text-white h-12 rounded-xl"
                                    >
                                        Skip
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Button
                                        onClick={onClose}
                                        className="flex-1 bg-[#0AD9DC] hover:bg-[#0AD9DC]/90 text-[#011623] font-bold h-12 rounded-xl"
                                    >
                                        Awesome!
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="flex-1 border-white/10 hover:bg-white/5 text-white h-12 rounded-xl gap-2"
                                    >
                                        <Share2 className="w-4 h-4" /> Share
                                    </Button>
                                </>
                            )}
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1 }}
                            className="mt-6 text-xs text-slate-500 flex items-center gap-1"
                        >
                            <Check className="w-3 h-3 text-green-500" />
                            {mintSuccess ? (
                                txHash ? (
                                    <>
                                        Minted on Arbitrum Sepolia!{' '}
                                        <a
                                            href={`https://sepolia.arbiscan.io/tx/${txHash}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="underline text-[#0AD9DC]"
                                        >
                                            View on Arbiscan
                                        </a>
                                    </>
                                ) : (
                                    'Minted on Arbitrum Sepolia!'
                                )
                            ) : (
                                'Saved to your profile'
                            )}
                        </motion.div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
