# Currency Module

Módulo de formatação de moeda para formulários Webflow que formata automaticamente valores como Real Brasileiro (BRL).

## Estrutura do Módulo

```
src/currency/
├── index.ts              # Ponto de entrada principal
├── formatter.ts          # Classe principal do formatador
├── webflow-integration.ts # Integração específica com Webflow
├── config.ts            # Configurações do módulo
├── types.ts             # Definições de tipos TypeScript
└── styles/
    └── currency.css     # Estilos CSS para os inputs
```

## Uso

### Importação Básica

```typescript
// Importa e inicializa automaticamente
import './currency';

// Ou importa funcionalidades específicas
import { currencyFormatter, WebflowCurrencyInit, currencyUtils } from './currency';
```

### Configuração HTML

```html
<!-- Adiciona o atributo data-currency="true" para formatação automática -->
<input type="text" data-currency="true" name="price" placeholder="0,00">
```

### API Avançada

```typescript
// Formatação manual
const formatted = currencyUtils.formatCurrency(1234.56); // "1.234,56"

// Parse de valor formatado
const numeric = currencyUtils.parseCurrency("1.234,56"); // 1234.56

// Obter todos os inputs de moeda
const inputs = currencyUtils.getAllCurrencyInputs();

// Atualizar todos os inputs
currencyUtils.refreshAllInputs();
```

## Configuração

O módulo pode ser configurado através do arquivo `config.ts`:

```typescript
import { DEFAULT_BRL_CONFIG } from './config';

// Configuração padrão para Real Brasileiro
const config = {
  symbol: 'R$ ',
  decimal: ',',
  separator: '.',
  precision: 2,
  pattern: '# !',
  negativePattern: '- # !',
};
```

## Integração com Webflow

### Inicialização Automática

O módulo se inicializa automaticamente quando importado, detectando:
- Evento `DOMContentLoaded`
- Evento `Webflow.ready()` (se disponível)
- Mutações no DOM para conteúdo dinâmico

### Recursos Específicos do Webflow

- ✅ Compatível com formulários Webflow
- ✅ Funciona com CMS dinâmico
- ✅ Suporta interações Webflow
- ✅ Responsivo em todos os breakpoints
- ✅ Integração com validação de formulários

## Styling

O módulo inclui CSS responsivo que:
- Mantém o símbolo "R$" fixo à esquerda
- Adapta-se aos breakpoints do Webflow
- Suporta modo escuro e alto contraste
- Funciona com classes CSS personalizadas

## Testes

Execute os testes com:

```bash
pnpm test
```

Os testes cobrem:
- Formatação de diferentes valores
- Manipulação de eventos
- Integração com formulários
- Casos extremos e edge cases

## Build

Para compilar apenas o módulo currency:

```bash
pnpm build
```

Isso gera:
- `dist/currency/index.js` - Módulo standalone
- `dist/currency/index.css` - Estilos compilados

## Desenvolvimento

Para desenvolvimento com live reload:

```bash
pnpm dev
```

### Importação no Webflow (Development)

**Opção Recomendada - Apenas Currency Module:**
```html
<link href="http://localhost:3000/currency/index.css" rel="stylesheet" type="text/css"/>
<script defer src="http://localhost:3000/currency/index.js"></script>
```

**Opção Alternativa - Aplicação Completa:**
```html
<link href="http://localhost:3000/index.css" rel="stylesheet" type="text/css"/>
<script defer src="http://localhost:3000/index.js"></script>
```

> 💡 **Dica**: Use a primeira opção (currency module) para carregar apenas a funcionalidade de moeda, resultando em menor tamanho de arquivo e melhor performance.
