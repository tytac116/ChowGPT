import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import App from './App.tsx';
import './index.css';

// Import the Clerk Publishable Key
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error('Missing Clerk Publishable Key. Please add VITE_CLERK_PUBLISHABLE_KEY to your .env file');
}

// Get the current domain for proper redirects
const getCurrentDomain = (): string => {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return '';
};

// Robust redirect URLs that work across domains
const getRedirectUrl = (path: string): string => {
  const domain = getCurrentDomain();
  return domain ? `${domain}${path}` : path;
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClerkProvider 
      publishableKey={PUBLISHABLE_KEY}
      afterSignInUrl={getRedirectUrl('/finder')}
      afterSignUpUrl={getRedirectUrl('/finder')}
      afterSignOutUrl={getRedirectUrl('/')}
      signInFallbackRedirectUrl={getRedirectUrl('/finder')}
      signUpFallbackRedirectUrl={getRedirectUrl('/finder')}
    >
      <App />
    </ClerkProvider>
  </StrictMode>
);
