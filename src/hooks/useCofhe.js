import { useEffect, useState, useCallback } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { createPublicClient, createWalletClient, custom } from 'viem';
import { arbitrumSepolia } from 'viem/chains';
import { createCofheConfig, createCofheClient } from '@cofhe/sdk/web';
import { useCofheStore } from '@/services/store/cofheStore';

// Simple module-scoped singleton so we only create one client
let cofheClientSingleton = null;

export function useCofhe(config = {}) {
    const { authenticated } = usePrivy();
    const { wallets } = useWallets();
    const { isInitialized: globalIsInitialized, setIsInitialized: setGlobalIsInitialized } = useCofheStore();

    const [isInitializing, setIsInitializing] = useState(false);
    const [isGeneratingPermit, setIsGeneratingPermit] = useState(false);
    const [error, setError] = useState(null);
    const [permit, setPermit] = useState(undefined);

    useEffect(() => {
        const initialize = async () => {
            if (
                !authenticated ||
                wallets.length === 0 ||
                globalIsInitialized ||
                isInitializing
            )
                return;

            try {
                setIsInitializing(true);
                const wallet = wallets[0];
                const provider = await wallet.getEthereumProvider();

                const publicClient = createPublicClient({
                    chain: arbitrumSepolia,
                    transport: custom(provider),
                });

                const walletClient = createWalletClient({
                    chain: arbitrumSepolia,
                    transport: custom(provider),
                    account: wallet.address,
                });

                if (!cofheClientSingleton) {
                    const sdkConfig = createCofheConfig({
                        supportedChains: [arbitrumSepolia],
                    });
                    cofheClientSingleton = createCofheClient(sdkConfig);
                }

                await cofheClientSingleton.connect(publicClient, walletClient);

                console.log('[useCofhe] cofhesdk client connected');
                setGlobalIsInitialized(true);
                setError(null);
            } catch (err) {
                console.error('[useCofhe] Failed to initialize cofhesdk:', err);
                setError(err instanceof Error ? err : new Error(String(err)));
            } finally {
                setIsInitializing(false);
            }
        };

        initialize();
    }, [authenticated, wallets, globalIsInitialized, isInitializing, setGlobalIsInitialized]);

    const createPermit = useCallback(async () => {
        if (!globalIsInitialized || !cofheClientSingleton) {
            return { success: false, error: 'CoFHE not initialized' };
        }

        try {
            setIsGeneratingPermit(true);
            setError(null);

            const createdPermit = await cofheClientSingleton.permits.getOrCreateSelfPermit();
            setPermit(createdPermit);

            console.log('[useCofhe] Permit created via cofhesdk');
            return { success: true, data: createdPermit };
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Unknown error generating permit';
            setError(new Error(errorMsg));
            return { success: false, error: errorMsg };
        } finally {
            setIsGeneratingPermit(false);
        }
    }, [globalIsInitialized]);

    return {
        isInitialized: globalIsInitialized,
        isInitializing,
        isGeneratingPermit,
        error,
        permit,
        createPermit,
        client: cofheClientSingleton,
    };
}
