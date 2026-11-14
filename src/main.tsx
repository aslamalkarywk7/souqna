import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';

// Self-hosted fonts — no external CDN at runtime
import '@fontsource-variable/inter';
import '@fontsource/cairo/400.css';
import '@fontsource/cairo/600.css';
import '@fontsource/cairo/700.css';

import {BrowserRouter} from 'react-router-dom';
import '@/i18n';
import '@/index.css';
import App from '@/App';
import {AuthProvider} from '@/context/AuthContext';
import {CartProvider} from '@/context/CartContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <App />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
