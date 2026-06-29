import {ClerkProvider} from '@clerk/react';
import {RouterProvider} from '@tanstack/react-router';
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import './index.css';
import {router} from './router';

const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!clerkPublishableKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClerkProvider publishableKey={clerkPublishableKey}>
      <RouterProvider router={router} />
    </ClerkProvider>
  </StrictMode>
);
