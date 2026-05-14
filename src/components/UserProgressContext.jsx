
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { usePrivy } from '@privy-io/react-auth';

const UserProgressContext = createContext(null);

function buildDefaultProgress(userId, displayName) {
    return {
        user_id: userId,
        display_name: displayName || (userId ? userId.slice(0, 6) : null),
        xp: 0,
        completed_modules: [],
        completed_lessons: [],
        badges: []
    };
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 3000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
        return await fetch(url, { ...options, signal: controller.signal });
    } finally {
        clearTimeout(timeoutId);
    }
}

export function UserProgressProvider({ children }) {
    const { user: privyUser, authenticated } = usePrivy();
    const [progress, setProgress] = useState(null);
    const [loading, setLoading] = useState(true);

    // Use the stable Privy user id as the canonical identifier so each
    // authenticated user has exactly one progress row / leaderboard entry,
    // regardless of how many wallets they connect.
    const userId = privyUser?.id;
    const walletAddress = privyUser?.wallet?.address;

    const fetchProgress = useCallback(async () => {
        if (!authenticated || !userId) {
            setProgress(null);
            setLoading(false);
            return;
        }

        try {
            const walletParam = walletAddress ? `?wallet=${encodeURIComponent(walletAddress)}` : '';
            const res = await fetchWithTimeout(`/api/progress/${userId}${walletParam}`, {
                cache: 'no-store'
            }, 3000);

            if (res.ok) {
                const data = await res.json();
                setProgress({
                    ...buildDefaultProgress(userId, data.display_name),
                    ...data,
                    display_name: data.display_name || userId.slice(0, 6),
                    completed_modules: Array.isArray(data.completed_modules) ? data.completed_modules : [],
                    completed_lessons: Array.isArray(data.completed_lessons) ? data.completed_lessons : [],
                    badges: Array.isArray(data.badges) ? data.badges : []
                });
            } else {
                console.error('Failed to fetch progress from API');
                setProgress(buildDefaultProgress(userId, privyUser?.email?.address || walletAddress));
            }
        } catch (e) {
            console.error('Context fetch error', e);
            // Keep learning flow functional even when API is unavailable (e.g. local sqlite not running).
            setProgress(buildDefaultProgress(userId, privyUser?.email?.address || walletAddress));
        } finally {
            setLoading(false);
        }
    }, [authenticated, userId, privyUser?.email?.address, walletAddress]);

    useEffect(() => {
        fetchProgress();
    }, [fetchProgress]);

    const updateProgress = async (updates) => {
        if (!userId) return;

        const baseProgress = progress || buildDefaultProgress(userId, privyUser?.email?.address || walletAddress);

        // Optimistic update
        const newProgress = { ...baseProgress, ...updates };
        setProgress(newProgress);

        // Persist to API
        try {
            await fetchWithTimeout('/api/progress', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: userId,
                    display_name: newProgress.display_name,
                    xp: newProgress.xp,
                    completed_modules: newProgress.completed_modules,
                    completed_lessons: newProgress.completed_lessons,
                    badges: newProgress.badges
                })
            }, 3000);
        } catch (e) {
            console.error('Failed to persist progress to API', e);
        }

        return newProgress;
    };

    return (
        <UserProgressContext.Provider value={{ user: privyUser, progress, loading, updateProgress, refreshProgress: fetchProgress }}>
            {children}
        </UserProgressContext.Provider>
    );
}

export const useUserProgress = () => useContext(UserProgressContext);