import { defineChain } from 'viem';
import { arbitrumSepolia } from 'viem/chains';

export const privyConfig = {
  appId: 'cmij9xc0a00jjk10c7jqro7xl',
  config: {
    loginMethods: ['wallet'],
    appearance: {
      theme: 'dark',
      accentColor: '#0AD9DC',
      logo: 'https://www.fhenix.io/wp-content/uploads/2023/09/Fhenix-Logo-White.svg', // Assuming a logo URL
    },
    embeddedWallets: {
      createOnLogin: 'users-without-wallets',
    },
    defaultChain: arbitrumSepolia,
    supportedChains: [arbitrumSepolia],
  },
};
