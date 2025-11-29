import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { CURRICULUM } from '@/components/learn/curriculum';

const UserProgressContext = createContext();

export function UserProgressProvider({ children }) {
    const [user, setUser] = useState(null);
    const [progress, setProgress] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchProgress = useCallback(async (force = false) => {
        try {
            const currentUser = await base44.auth.me();
            setUser(currentUser);
            
            if (currentUser) {
                // Fetch ALL progress records to handle potential duplicates
                const res = await base44.entities.UserProgress.filter({ user_id: currentUser.id });
                
                let currentP;
                if (res.length > 0) {
                    // If multiple exist, pick the one with the most XP/progress
                    // This handles the "wipe" issue if a blank record was accidentally created
                    currentP = res.reduce((prev, current) => {
                        return (current.xp > prev.xp) ? current : prev;
                    });

                    // Self-healing: Sync missed module completions
                    let updatesNeeded = false;
                    const missingModules = [];
                    const currentCompletedModules = currentP.completed_modules || [];
                    const currentCompletedLessons = currentP.completed_lessons || [];

                    CURRICULUM.forEach(mod => {
                        const allLessonsDone = mod.lessons.every(l => currentCompletedLessons.includes(l.id));
                        if (allLessonsDone && !currentCompletedModules.includes(mod.id)) {
                            missingModules.push(mod.id);
                            updatesNeeded = true;
                        }
                    });

                    if (updatesNeeded) {
                        const newCompletedModules = [...currentCompletedModules, ...missingModules];
                        const updated = await base44.entities.UserProgress.update(currentP.id, {
                            completed_modules: newCompletedModules
                        });
                        currentP = updated;
                    }
                    
                    // Sync display name if missing
                    if (!currentP.display_name && currentUser.email) {
                         base44.entities.UserProgress.update(currentP.id, {
                            display_name: currentUser.email.split('@')[0]
                        });
                    }
                } else {
                    // Only create if we are absolutely sure (e.g. after a small delay or retry?)
                    // For now, just create.
                    currentP = await base44.entities.UserProgress.create({
                        user_id: currentUser.id,
                        display_name: currentUser.email?.split('@')[0] || 'Anonymous',
                        xp: 0,
                        completed_lessons: [],
                        completed_modules: [],
                        badges: []
                    });
                }
                setProgress(currentP);
            } else {
                setProgress(null);
            }
        } catch (e) {
            console.error("Context fetch error", e);
            // Don't clear progress on error if we already have it (offline support-ish)
            if (!progress) {
                setUser(null);
                setProgress(null);
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProgress();
    }, [fetchProgress]);

    const updateProgress = async (updates) => {
        if (!progress) return;
        
        // Optimistic update
        const newProgress = { ...progress, ...updates };
        setProgress(newProgress);

        try {
            const updated = await base44.entities.UserProgress.update(progress.id, updates);
            // Update with server response to ensure consistency (e.g. generated fields)
            setProgress(updated);
            return updated;
        } catch (e) {
            console.error("Failed to update progress", e);
            // Revert on error? For now, just log.
            fetchProgress(true); // Refresh from server to get back to consistent state
            throw e;
        }
    };

    return (
        <UserProgressContext.Provider value={{ user, progress, loading, updateProgress, refreshProgress: fetchProgress }}>
            {children}
        </UserProgressContext.Provider>
    );
}

export const useUserProgress = () => useContext(UserProgressContext);