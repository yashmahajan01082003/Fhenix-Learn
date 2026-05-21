import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function isBadgeMinted(badge) {
  if (!badge || typeof badge !== 'object') return false;
  return (
    typeof badge.id === 'string' && badge.id.length > 0 &&
    typeof badge.txHash === 'string' && /^0x[a-fA-F0-9]{64}$/.test(badge.txHash) &&
    typeof badge.contractAddress === 'string' && badge.contractAddress.length > 0 &&
    typeof badge.walletAddress === 'string' && badge.walletAddress.length > 0 &&
    typeof badge.mintedAt === 'string' && !isNaN(Date.parse(badge.mintedAt))
  );
}

export function isBadgePending(badge) {
  if (!badge) return false;
  if (typeof badge === 'string') return true;
  return typeof badge.id === 'string' && badge.id.length > 0 && !isBadgeMinted(badge);
}

export function findBadgeStatus(badgeId, badges = []) {
  if (!badgeId) return 'locked';
  const entry = (badges || []).find((badge) => {
    if (typeof badge === 'string') return badge === badgeId;
    return badge?.id === badgeId;
  });

  if (!entry) return 'locked';
  return isBadgeMinted(entry) ? 'minted' : 'pending';
}

export const isIframe = window.self !== window.top;
