# Guia de Integração: Bibliotecas Externas com Webflow CMS

## Visão Geral

Este documento detalha a implementação do sistema de persistência da área de drop que integra com sucesso o Webflow CMS. O sistema permite que usuários arrastem ativos CMS originais e personalizados para uma área de drop, mantendo o estado através de recarregamentos de página usando localStorage.

### Características Principais

- **Persistência de Estado**: Mantém itens selecionados após recarregamento da página
- **Integração CMS**: Funciona nativamente com elementos dinâmicos do Webflow
- **Cache Inteligente**: Diferencia entre itens originais do CMS e ativos personalizados
- **Interface Responsiva**: Oculta itens fonte quando movidos para área de destino

## Detalhes da Implementação Técnica

### 1. Integração com Bibliotecas Externas no Webflow

#### Estrutura de Integração

```typescript
// Padrão de integração com Webflow
export class WebflowIntegration {
  public static initialize(): void {
    // Aguarda o DOM e scripts do Webflow carregarem
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', this.initializeFeatures);
    } else {
      this.initializeFeatures();
    }
  }

  private static initializeFeatures(): void {
    // Aguarda elementos do Webflow estarem disponíveis
    setTimeout(() => {
      // Inicializa funcionalidades após o Webflow carregar
      EnhancedAtivosManager.initialize();
    }, 100);
  }
}
```

#### Seletores e Identificação de Elementos

**IMPORTANTE**: Sempre use IDs ou classes específicas definidas no Webflow Designer:

```typescript
// ✅ Correto - Usar seletores específicos do Webflow
const dropArea = document.querySelector('.ativos_main_drop_area');
const sourceContainers = document.querySelectorAll('.ativos_main-list');

// ❌ Evitar - Classes auto-geradas do Webflow
const items = container.querySelectorAll('.w-node-abc123'); // Pode mudar
```

### 2. Estratégias de Gerenciamento de Cache

#### Sistema de Identificação Dupla

```typescript
interface DropAreaItem {
  id: string;              // Identificador único para o cache
  name: string;            // Nome do item extraído do DOM
  type: 'original' | 'custom'; // Tipo do ativo
  position: number;        // Posição na área de drop
  createdAt: string;       // Timestamp de criação
  originalId?: string;     // ID original para rastreamento
}
```

#### Persistência com localStorage

```typescript
export class PersistenceManager {
  private static readonly STORAGE_KEY = 'feature_cache_items';

  // Salvar itens no cache
  public static saveItems(items: CacheItem[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(items));
      console.error('DEBUG: Cached', items.length, 'items');
    } catch (error) {
      console.error('Cache save failed:', error);
    }
  }

  // Carregar itens do cache
  public static loadItems(): CacheItem[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Cache load failed:', error);
      return [];
    }
  }
}
```

### 3. Melhores Práticas para Persistência de Dados

#### Sincronização de Estado

```typescript
// Padrão para manter sincronização entre DOM e cache
private static syncStateWithCache(): void {
  // 1. Capturar estado atual do DOM
  const domItems = this.extractDOMItems();
  
  // 2. Comparar com cache
  const cachedItems = this.loadFromCache();
  
  // 3. Aplicar diferenças
  this.reconcileState(domItems, cachedItems);
  
  // 4. Atualizar interface
  this.updateUI();
}
```

#### Tratamento de Elementos Webflow por ID

```typescript
// Integração recomendada usando IDs específicos
private static integrateWithWebflowElements(): void {
  // Use IDs definidos no Webflow Designer
  const addButton = document.querySelector('#adicionarAtivo');
  const inputField = document.querySelector('#adicionarNAtivo');
  const template = document.querySelector('#pillAtivo');
  
  if (addButton && inputField && template) {
    // Configurar funcionalidades
    this.setupEventListeners(addButton, inputField);
    this.configureTemplate(template);
  }
}
```

## Componentes-Chave

### 1. Mecanismo de Persistência localStorage

#### Implementação Base

```typescript
export class CacheManager {
  private static readonly KEY = 'webflow_feature_cache';

  // Estrutura padronizada para cache
  public static saveToCache<T>(data: T[], key?: string): void {
    const cacheKey = key || this.KEY;
    try {
      localStorage.setItem(cacheKey, JSON.stringify({
        timestamp: Date.now(),
        data: data,
        version: '1.0'
      }));
    } catch (error) {
      this.handleCacheError(error);
    }
  }

  public static loadFromCache<T>(key?: string): T[] {
    const cacheKey = key || this.KEY;
    try {
      const cached = localStorage.getItem(cacheKey);
      if (!cached) return [];
      
      const parsed = JSON.parse(cached);
      return this.validateCacheData(parsed) ? parsed.data : [];
    } catch (error) {
      this.handleCacheError(error);
      return [];
    }
  }

  private static validateCacheData(data: any): boolean {
    return data && 
           typeof data.timestamp === 'number' && 
           Array.isArray(data.data) &&
           data.version;
  }
}
```

### 2. Gerenciamento de Ativos Originais vs Personalizados

#### Diferenciação por Atributos

```typescript
// Sistema de classificação de itens
private static classifyItem(element: HTMLElement): ItemType {
  if (element.hasAttribute('data-new-asset')) {
    return { type: 'custom', source: 'user-created' };
  }
  
  if (element.hasAttribute('data-original-id') || 
      element.classList.contains('w-dyn-item')) {
    return { type: 'original', source: 'webflow-cms' };
  }
  
  return { type: 'unknown', source: 'undefined' };
}

// Aplicar tratamento específico por tipo
private static handleItemByType(element: HTMLElement, itemType: ItemType): void {
  switch (itemType.type) {
    case 'original':
      this.handleOriginalCMSItem(element);
      break;
    case 'custom':
      this.handleCustomItem(element);
      break;
    default:
      console.warn('Unknown item type:', element);
  }
}
```

### 3. Padrões de Integração com Elementos Webflow

#### Template de Clonagem

```typescript
// Padrão para clonar templates do Webflow
private static cloneWebflowTemplate(templateId: string, data: any): HTMLElement | null {
  const template = document.querySelector(`#${templateId}`);
  if (!template) {
    console.error(`Template ${templateId} not found`);
    return null;
  }

  const clone = template.cloneNode(true) as HTMLElement;
  
  // Remover ID para evitar duplicatas
  clone.removeAttribute('id');
  
  // Aplicar dados ao clone
  this.populateTemplate(clone, data);
  
  return clone;
}

private static populateTemplate(element: HTMLElement, data: any): void {
  // Encontrar e atualizar elementos de texto
  const textElement = element.querySelector('[class*="text"], .text-block');
  if (textElement && data.name) {
    textElement.textContent = data.name;
  }
  
  // Aplicar atributos necessários
  element.setAttribute('data-ativo-item', 'true');
  if (data.type === 'custom') {
    element.setAttribute('data-new-asset', 'true');
    element.setAttribute('data-asset-name', data.name);
  }
}
```

## Guia de Implementação Passo a Passo

### Pré-requisitos e Configuração

1. **Estrutura de Projeto**

```text
src/
├── feature-name/
│   ├── index.ts              # Ponto de entrada
│   ├── manager.ts            # Lógica principal
│   ├── persistence.ts        # Gerenciamento de cache
│   ├── webflow-integration.ts # Integração Webflow
│   └── types.ts              # Definições de tipos
```

1. **Configuração no Webflow**

- Definir IDs específicos para elementos importantes
- Usar classes consistentes para seleção
- Configurar estrutura CMS se necessário

### Passos de Implementação

#### Passo 1: Configurar Integração Principal

```typescript
// src/feature-name/webflow-integration.ts
export class FeatureWebflowIntegration {
  public static initialize(): void {
    // Aguardar carregamento do Webflow
    this.waitForWebflow(() => {
      FeatureManager.initialize();
    });
  }

  private static waitForWebflow(callback: () => void): void {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback);
    } else {
      setTimeout(callback, 100);
    }
  }
}
```

#### Passo 2: Implementar Gerenciador Principal

```typescript
// src/feature-name/manager.ts
export class FeatureManager {
  private static instances = new Map<HTMLElement, any>();

  public static initialize(options?: FeatureOptions): void {
    // Inicializar componentes
    this.initializeContainers();
    this.setupEventListeners();
    this.loadPersistedData();
  }

  private static initializeContainers(): void {
    // Encontrar e configurar containers
    const containers = document.querySelectorAll('.feature-container');
    containers.forEach(container => this.setupContainer(container));
  }
}
```

#### Passo 3: Configurar Sistema de Persistência

```typescript
// src/feature-name/persistence.ts
export class FeaturePersistence {
  private static readonly STORAGE_KEY = 'feature_data';

  public static save(data: FeatureData[]): void {
    try {
      const cacheData = {
        timestamp: Date.now(),
        data: data,
        version: '1.0'
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Failed to save feature data:', error);
    }
  }

  public static load(): FeatureData[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return [];
      
      const parsed = JSON.parse(stored);
      return parsed.data || [];
    } catch (error) {
      console.error('Failed to load feature data:', error);
      return [];
    }
  }
}
```

### Armadilhas Comuns e Como Evitar

#### 1. Timing de Inicialização

```typescript
// ❌ Problema: Inicializar muito cedo
document.addEventListener('DOMContentLoaded', initialize); // Webflow pode não ter carregado

// ✅ Solução: Aguardar Webflow + delay
setTimeout(() => {
  if (document.querySelector('.webflow-specific-element')) {
    initialize();
  } else {
    // Tentar novamente
    setTimeout(initialize, 100);
  }
}, 100);
```

#### 2. Seleção de Elementos

```typescript
// ❌ Problema: Usar classes auto-geradas
const item = document.querySelector('.w-node-12345abc');

// ✅ Solução: Usar IDs/classes definidas
const item = document.querySelector('#meuElemento');
const items = document.querySelectorAll('.minha-classe-personalizada');
```

#### 3. Gerenciamento de Estado

```typescript
// ❌ Problema: Não sincronizar DOM com cache
this.saveToCache(data);
// DOM pode estar desatualizado

// ✅ Solução: Sempre sincronizar
this.saveToCache(data);
this.updateDOMFromCache();
this.validateDOMState();
```

## Padrões Reutilizáveis

### 1. Template de Integração Genérica

```typescript
// Template base para qualquer integração Webflow
export abstract class WebflowFeatureBase {
  protected abstract readonly FEATURE_NAME: string;
  protected abstract readonly STORAGE_KEY: string;

  public initialize(options?: any): void {
    this.waitForWebflow(() => {
      this.setupFeature(options);
      this.loadPersistedData();
      this.attachEventListeners();
    });
  }

  protected abstract setupFeature(options?: any): void;
  protected abstract loadPersistedData(): void;
  protected abstract attachEventListeners(): void;

  private waitForWebflow(callback: () => void): void {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback);
    } else {
      setTimeout(callback, 100);
    }
  }
}
```

### 2. Sistema de Cache Genérico

```typescript
// Utilitário reutilizável para cache
export class WebflowCacheUtil {
  public static save<T>(key: string, data: T[]): boolean {
    try {
      const cacheData = {
        timestamp: Date.now(),
        data: data,
        version: '1.0',
        feature: key
      };
      localStorage.setItem(key, JSON.stringify(cacheData));
      return true;
    } catch (error) {
      console.error(`Cache save failed for ${key}:`, error);
      return false;
    }
  }

  public static load<T>(key: string, maxAge?: number): T[] {
    try {
      const stored = localStorage.getItem(key);
      if (!stored) return [];

      const parsed = JSON.parse(stored);
      
      // Verificar idade do cache se especificada
      if (maxAge && Date.now() - parsed.timestamp > maxAge) {
        this.clear(key);
        return [];
      }

      return Array.isArray(parsed.data) ? parsed.data : [];
    } catch (error) {
      console.error(`Cache load failed for ${key}:`, error);
      return [];
    }
  }

  public static clear(key: string): void {
    localStorage.removeItem(key);
  }
}
```

### 3. Utilitário de Extração de Texto

```typescript
// Extrator de texto robusto para elementos Webflow
export class WebflowTextExtractor {
  private static readonly TEXT_SELECTORS = [
    '[class*="text"]',
    '.text-block',
    'span:not(:empty)',
    'div:not(:has(*))',
    'p',
    'h1, h2, h3, h4, h5, h6'
  ];

  public static extractText(element: HTMLElement): string {
    // Tentar seletores específicos primeiro
    for (const selector of this.TEXT_SELECTORS) {
      try {
        const textElement = element.querySelector(selector);
        if (textElement?.textContent?.trim()) {
          return textElement.textContent.trim();
        }
      } catch (error) {
        console.warn(`Selector ${selector} failed:`, error);
      }
    }

    // Fallback para textContent direto
    const directText = element.textContent?.trim();
    if (directText) return directText;

    // Último recurso: buscar qualquer nó de texto
    return this.findFirstTextNode(element);
  }

  private static findFirstTextNode(element: HTMLElement): string {
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          return node.textContent?.trim() 
            ? NodeFilter.FILTER_ACCEPT 
            : NodeFilter.FILTER_REJECT;
        }
      }
    );

    const textNode = walker.nextNode();
    return textNode?.textContent?.trim() || '';
  }
}
```

### 4. Padrão de Configuração

```typescript
// Interface padrão para opções de integração
export interface WebflowIntegrationConfig {
  containerSelectors: string[];
  templateIds: string[];
  storageKey: string;
  debugMode?: boolean;
  initDelay?: number;
  cacheMaxAge?: number;
}

// Factory para criar integrações
export class WebflowIntegrationFactory {
  public static create(config: WebflowIntegrationConfig): WebflowFeatureBase {
    return new class extends WebflowFeatureBase {
      protected readonly FEATURE_NAME = config.storageKey;
      protected readonly STORAGE_KEY = config.storageKey;

      protected setupFeature(): void {
        // Implementação baseada na configuração
        config.containerSelectors.forEach(selector => {
          this.initializeContainer(selector);
        });
      }

      protected loadPersistedData(): void {
        const data = WebflowCacheUtil.load(
          config.storageKey, 
          config.cacheMaxAge
        );
        this.restoreFromCache(data);
      }

      protected attachEventListeners(): void {
        // Event listeners baseados na configuração
        this.setupEventListeners(config);
      }
    };
  }
}
```

## Exemplo de Uso Completo

```typescript
// Implementação completa usando os padrões definidos
const dropAreaConfig: WebflowIntegrationConfig = {
  containerSelectors: ['.ativos_main-list', '.ativos_main_drop_area'],
  templateIds: ['pillAtivo'],
  storageKey: 'ativos_drop_area_items',
  debugMode: true,
  initDelay: 100,
  cacheMaxAge: 24 * 60 * 60 * 1000 // 24 horas
};

// Inicializar feature
const dropAreaFeature = WebflowIntegrationFactory.create(dropAreaConfig);
dropAreaFeature.initialize();
```

## Conclusão

Este guia fornece uma base sólida para implementar integrações robustas entre bibliotecas externas e o Webflow CMS. Os padrões apresentados garantem:

- **Compatibilidade**: Funciona com mudanças no Webflow
- **Manutenibilidade**: Código organizado e reutilizável  
- **Confiabilidade**: Tratamento de erros e fallbacks
- **Performance**: Cache otimizado e carregamento eficiente

Para futuras implementações, use este guia como referência e adapte os padrões conforme necessário para cada caso de uso específico.
