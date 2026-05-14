import React, { createContext, useContext } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useCofhe } from '@/hooks/useCofhe';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const { user, authenticated, ready, login, logout } = usePrivy();

  // Initialize CoFHE globally when authenticated
  const { isInitialized, error: cofheError } = useCofhe({
    environment: "TESTNET",
    ignoreErrors: true
  });

  // Sync Privy user with backend (if needed)
  // useEffect(() => {
  //   if (authenticated && user) {
  //     // Here you would typically sync the user to your backend
  //     // For now, we'll assume the wallet address is the primary ID
  //     console.log("User authenticated:", user.wallet?.address);
  //   }
  // }, [authenticated, user]);

  const navigateToLogin = () => {
    login();
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: authenticated,
      isLoadingAuth: !ready,
      isLoadingPublicSettings: false, // Deprecated/Not needed for now
      authError: null,
      appPublicSettings: null,
      logout,
      navigateToLogin,
      checkAppState: () => { } // No-op
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
