# Estrutura Reorganizada do Currency Module

## Organização Seguindo as Diretrizes do README

A função de currency foi reorganizada seguindo a estrutura recomendada no README principal:

### 📁 Nova Estrutura de Arquivos

```
src/
├── currency/                    # Módulo principal consolidado
│   ├── index.ts                # Ponto de entrada principal
│   ├── formatter.ts            # Classe CurrencyFormatter (simplificada)
│   ├── webflow-integration.ts  # Integração com Webflow
│   ├── config.ts               # Configurações centralizadas
│   ├── types.ts                # Definições TypeScript
│   ├── README.md               # Documentação do módulo
│   └── styles/
│       └── currency.css        # Estilos CSS
├── index.ts                    # Entry point principal
└── tests/
    └── currency-formatter.spec.ts # Testes
```

### 🎯 Entry Points Configurados

No arquivo `bin/build.js`:

```javascript
const ENTRY_POINTS = [
  'src/index.ts',          // Ponto principal com toda funcionalidade
  'src/currency/index.ts', // Módulo currency standalone
];
```

### 📦 Outputs de Build

- **`dist/index.js`** - Aplicação completa com todos os módulos
- **`dist/currency/index.js`** - Módulo currency standalone
- **`dist/currency/index.css`** - Estilos compilados
- **`dist/index.css`** - Estilos globais

### 🔧 Vantagens da Nova Estrutura

1. **Modularidade**: Cada funcionalidade em seu próprio módulo
2. **Reutilização**: Módulo currency pode ser usado independentemente
3. **Manutenibilidade**: Código organizado e fácil de manter
4. **Escalabilidade**: Estrutura preparada para novos módulos
5. **Padrão Finsweet**: Segue as diretrizes do template

### ⚡ Simplificação Implementada (2024)

**Consolidação em torno da biblioteca currency.js:**

- ✅ **Removido**: `src/utils/currency.ts` (código duplicado)
- ✅ **Consolidado**: Configurações centralizadas em `config.ts`
- ✅ **Simplificado**: `formatter.ts` usa configuração única
- ✅ **Reduzido**: ~200 linhas de código duplicado eliminadas
- ✅ **Mantido**: Toda funcionalidade existente preservada

**Benefícios da simplificação:**
- Menor bundle size
- Comportamento de formatação consistente
- Única fonte de verdade para configurações
- Manutenção mais fácil

### 📋 Como Usar

#### Opção 1: Aplicação Completa
```html
<script src="dist/index.js"></script>
```

#### Opção 2: Apenas Currency Module
```html
<link rel="stylesheet" href="dist/currency/index.css">
<script src="dist/currency/index.js"></script>
```

#### Opção 3: Desenvolvimento
```html
<script src="http://localhost:3000/currency/index.js"></script>
```

### 🚀 Funcionalidades Mantidas

- ✅ Auto-detecção de inputs com `data-currency="true"`
- ✅ Formatação como Real Brasileiro (R$ 1.234,56)
- ✅ Símbolo "R$" fixo à esquerda
- ✅ Compatibilidade total com Webflow
- ✅ Responsividade em todos os breakpoints
- ✅ Integração com formulários
- ✅ Testes abrangentes

### 📈 Próximos Passos

1. **Novos Módulos**: Criar outros módulos seguindo esta estrutura
2. **Configuração Avançada**: Implementar configurações por módulo
3. **Documentação**: Manter documentação atualizada
4. **Testes**: Expandir cobertura de testes
5. **Performance**: Otimizar carregamento modular

Esta reorganização mantém toda a funcionalidade original enquanto melhora significativamente a organização e manutenibilidade do código, seguindo as melhores práticas do template Finsweet.
