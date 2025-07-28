# Configuração para Hospedagem em Subdomínio

## Visão Geral

Hospedar a ferramenta financeira em um subdomínio oferece máxima flexibilidade e performance, sem as limitações de integração com Webflow.

**URL Recomendada:** `app.reinocapital.com.br`

## Vantagens da Aplicação Standalone

### ✅ **Performance Máxima**

- Sem limitações de iframe ou widgets
- Carregamento otimizado
- Cache dedicado
- Sem interferências de CSS/JS externos

### ✅ **SEO Otimizado**

- Aplicação própria indexável pelo Google
- Meta tags específicas para a ferramenta
- URL amigável para compartilhamento
- Analytics dedicado

### ✅ **Controle Total**

- Liberdade completa de design
- Implementação de funcionalidades avançadas
- Atualizações independentes do site principal
- Monitoramento e métricas próprias

### ✅ **Experiência do Usuário Superior**

- Interface dedicada e otimizada
- Navegação fluida sem recarregamentos
- Responsividade total
- PWA (Progressive Web App) possível

## Configuração de DNS

### 1. Configurar CNAME no seu provedor de DNS

```dns
# Adicionar registro CNAME:
Tipo: CNAME
Nome: app
Valor: nome-do-seu-deploy.netlify.app
TTL: 300 (ou automático)
```

### 2. Verificar configuração

```bash
# Testar resolução DNS
nslookup app.reinocapital.com.br

# Deve retornar o endereço do Netlify/Vercel
```

## Configuração do Projeto

### Variáveis de Ambiente (.env.production)

```env
# Supabase
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...

# URLs
VITE_APP_URL=https://app.reinocapital.com.br
VITE_SITE_URL=https://reinocapital.com.br
VITE_API_URL=https://app.reinocapital.com.br/api

# Analytics (opcional)
VITE_GA_TRACKING_ID=G-XXXXXXXXXX
VITE_HOTJAR_ID=1234567

# Features flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_SHARING=true
VITE_ENABLE_EXPORT=true
```

### SEO e Meta Tags

```typescript
// src/components/SEOHead.tsx
import { Helmet } from 'react-helmet-async';

interface SEOHeadProps {
  title?: string;
  description?: string;
  url?: string;
  image?: string;
}

export const SEOHead: React.FC<SEOHeadProps> = ({ 
  title = "Calculadora de Portfolio - Reino Capital",
  description = "Ferramenta gratuita para distribuição de ativos e cálculo de risco de portfolio de investimentos. Monte seu portfolio ideal com nossa calculadora inteligente.",
  url = "https://app.reinocapital.com.br",
  image = "https://app.reinocapital.com.br/og-image.png"
}) => (
  <Helmet>
    {/* Título e descrição */}
    <title>{title}</title>
    <meta name="description" content={description} />
    
    {/* Open Graph */}
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:url" content={url} />
    <meta property="og:type" content="website" />
    <meta property="og:image" content={image} />
    <meta property="og:site_name" content="Reino Capital" />
    
    {/* Twitter */}
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content={title} />
    <meta name="twitter:description" content={description} />
    <meta name="twitter:image" content={image} />
    
    {/* Canonical */}
    <link rel="canonical" href={url} />
    
    {/* Favicon */}
    <link rel="icon" type="image/x-icon" href="/favicon.ico" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    
    {/* Preconnect para performance */}
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://seu-projeto.supabase.co" />
  </Helmet>
);
```

### Configuração de Routing (React Router)

```typescript
// src/router.tsx
import { createBrowserRouter } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { PortfolioPage } from './pages/PortfolioPage';
import { SharedPortfolioPage } from './pages/SharedPortfolioPage';
import { NotFoundPage } from './pages/NotFoundPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <HomePage />,
  },
  {
    path: '/portfolio',
    element: <PortfolioPage />,
  },
  {
    path: '/portfolio/:shareToken',
    element: <SharedPortfolioPage />,
  },
  {
    path: '/sobre',
    element: <AboutPage />,
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);
```

## Deploy e Hospedagem

### Netlify (Recomendado)

```bash
# 1. Instalar CLI
npm install -g netlify-cli

# 2. Build do projeto
npm run build

# 3. Deploy inicial
netlify deploy --dir dist

# 4. Deploy em produção
netlify deploy --prod --dir dist

# 5. Configurar domínio customizado
netlify domains:add app.reinocapital.com.br
```

### Configuração netlify.toml

```toml
[build]
  publish = "dist"
  command = "npm run build"

[build.environment]
  NODE_VERSION = "18"

# Redirects para SPA
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

# Headers de segurança
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"
    Referrer-Policy = "strict-origin-when-cross-origin"

# Cache para assets
[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

# Headers para fontes
[[headers]]
  for = "*.woff2"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

### Vercel (Alternativa)

```bash
# 1. Instalar CLI
npm install -g vercel

# 2. Deploy
vercel --prod
```

### Configuração vercel.json

```json
{
  "builds": [
    {
      "src": "dist/**",
      "use": "@vercel/static"
    }
  ],
  "routes": [
    {
      "src": "/assets/(.*)",
      "dest": "/assets/$1",
      "headers": {
        "Cache-Control": "public, max-age=31536000, immutable"
      }
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options", 
          "value": "nosniff"
        }
      ]
    }
  ]
}
```

## Analytics e Monitoramento

### Google Analytics 4

```typescript
// src/services/analytics.ts
import { gtag } from 'ga-gtag';

export const initGA = () => {
  if (import.meta.env.VITE_GA_TRACKING_ID) {
    gtag('config', import.meta.env.VITE_GA_TRACKING_ID, {
      page_title: document.title,
      page_location: window.location.href,
    });
  }
};

export const trackEvent = (action: string, category: string, label?: string, value?: number) => {
  gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
  });
};

// Eventos específicos da aplicação
export const trackPortfolioEvent = {
  created: (totalValue: number) => trackEvent('portfolio_created', 'portfolio', 'total_value', totalValue),
  assetAdded: (assetName: string) => trackEvent('asset_added', 'portfolio', assetName),
  exported: (format: string) => trackEvent('portfolio_exported', 'export', format),
  shared: () => trackEvent('portfolio_shared', 'sharing'),
};
```

### Hotjar (Heatmaps e Recordings)

```typescript
// src/services/hotjar.ts
export const initHotjar = () => {
  if (import.meta.env.VITE_HOTJAR_ID) {
    (function(h: any, o: any, t: any, j: any, a?: any, r?: any) {
      h.hj = h.hj || function(...args: any[]) { (h.hj.q = h.hj.q || []).push(args) };
      h._hjSettings = { hjid: import.meta.env.VITE_HOTJAR_ID, hjsv: 6 };
      a = o.getElementsByTagName('head')[0];
      r = o.createElement('script'); r.async = 1;
      r.src = t + h._hjSettings.hjid + j + h._hjSettings.hjsv;
      a.appendChild(r);
    })(window, document, 'https://static.hotjar.com/c/hotjar-', '.js?sv=');
  }
};
```

## PWA (Progressive Web App)

### Configuração do Manifest

```json
// public/manifest.json
{
  "name": "Calculadora de Portfolio - Reino Capital",
  "short_name": "Portfolio Reino",
  "description": "Ferramenta para distribuição de ativos e cálculo de risco",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#1E40AF",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png", 
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### Service Worker

```typescript
// src/sw.ts
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst } from 'workbox-strategies';

// Precache dos assets
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// Cache para imagens
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images',
    plugins: [{
      cacheKeyWillBeUsed: async ({ request }) => request.url,
    }],
  })
);

// Cache para API calls
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'api-cache',
    networkTimeoutSeconds: 3,
  })
);
```

## Performance e Otimizações

### Lazy Loading de Componentes

```typescript
// src/components/LazyComponents.ts
import { lazy } from 'react';

export const PortfolioGrid = lazy(() => import('./portfolio/PortfolioGrid'));
export const ChartsPanel = lazy(() => import('./charts/ChartsPanel'));
export const ExportModal = lazy(() => import('./modals/ExportModal'));
```

### Bundle Splitting

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          supabase: ['@supabase/supabase-js'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-slider'],
          charts: ['recharts'],
          utils: ['@tanstack/react-query', 'zustand'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
});
```

## Checklist de Deploy

- [ ] DNS configurado (CNAME record)
- [ ] Domínio SSL ativo
- [ ] Variáveis de ambiente em produção
- [ ] Build otimizado executado
- [ ] SEO tags implementadas
- [ ] Analytics configurado
- [ ] PWA manifest criado
- [ ] Service Worker ativo
- [ ] Performance testada (Lighthouse)
- [ ] Compatibilidade cross-browser testada
- [ ] Testes de responsividade realizados
- [ ] Backup/restore de dados testado

## Estrutura Final de URLs

```
https://app.reinocapital.com.br/
├── /                           # Página inicial da ferramenta
├── /portfolio                  # Calculadora principal
├── /portfolio/:shareToken      # Portfolio compartilhado
├── /sobre                      # Sobre a ferramenta
├── /api/                       # API endpoints (Edge Functions)
│   ├── /export-pdf             # Export para PDF
│   ├── /export-excel           # Export para Excel
│   └── /analytics              # Métricas customizadas
└── /assets/                    # Assets estáticos
```

Esta configuração oferece uma aplicação completa, performática e profissional, ideal para hospedar em subdomínio com máxima autonomia e flexibilidade.
