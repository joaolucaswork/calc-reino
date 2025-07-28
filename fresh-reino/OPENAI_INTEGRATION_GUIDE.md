# OpenAI Asset Allocation Integration Guide

Este guia documenta a integração do sistema de alocação de ativos por IA (OpenAI) com o projeto Webflow existente.

## Visão Geral

A integração permite que usuários descrevam em linguagem natural como desejam alocar seus investimentos, e o sistema automaticamente interpreta e aplica as mudanças usando a API da OpenAI.

## Arquivos da Integração

### 1. JavaScript Principal
- **Arquivo**: `openai-integration/openai-allocation.js`
- **Função**: Controla toda a lógica de integração com OpenAI e atualização dos valores

## Modificações Necessárias no Webflow

### 1. Adicionar o Script de Integração

No Webflow, vá para **Project Settings > Custom Code** e adicione no campo **Before </body> tag**:

```html
<!-- OpenAI Asset Allocation Integration -->
<script src="https://seu-dominio.com/openai-integration/openai-allocation.js"></script>
```

**Nota**: Você precisará hospedar o arquivo JavaScript em um servidor ou CDN. Alternativas:
- Upload para o Webflow Assets
- Usar um CDN como jsDelivr ou unpkg
- Hospedar em seu próprio servidor

### 2. Atributos HTML Necessários

Os seguintes elementos já existem no projeto e serão utilizados pela integração:

#### Input de Prompt
- **Classe**: `.prompt-input`
- **Local**: Dentro do `.componente-alocao-float`
- **Placeholder atual**: "Escreva como quer dividir seu patrimônio"

#### Botão de Processar
- **Classe**: `.process-prompt`
- **Local**: Ao lado do input de prompt
- **Texto**: "Alocar"

#### Seção de Alocação
- **Classe**: `._3-section-patrimonio-alocation`
- **Contém**: Todos os itens de investimento

### 3. Estrutura dos Itens de Investimento

Cada item de investimento deve manter a seguinte estrutura (já existente):

```html
<div class="patrimonio_interactive_item">
  <div class="ativo_alocated_top-wrapper">
    <div class="categoria-ativo">[Categoria]</div>
    <div>[Subcategoria]</div>
  </div>
  <div class="active-produto-item">
    <div class="patrimonio_value_input">
      <input class="currency-input individual" />
    </div>
  </div>
</div>
```

### 4. CSS Adicional (Opcional)

Adicione no Webflow em **Page Settings > Custom Code > Inside <head> tag**:

```css
<style>
/* Loading state animation */
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* AI loading overlay */
.ai-loading-state {
  backdrop-filter: blur(2px);
}

/* Notification animations */
@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes slideOut {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
}

/* Enhanced prompt input focus state */
.prompt-input:focus {
  border-color: #101010;
  box-shadow: 0 0 0 2px rgba(16, 16, 16, 0.1);
}

/* Process button hover state */
.process-prompt:hover {
  background-color: #2a2a2a;
  transform: translateY(-1px);
  transition: all 0.2s ease;
}
</style>
```

## Configuração da API OpenAI

### 1. Obtenção da Chave API

1. Acesse [platform.openai.com](https://platform.openai.com)
2. Crie uma conta ou faça login
3. Vá para API Keys
4. Crie uma nova chave
5. Copie a chave (formato: `sk-...`)

### 2. Primeira Utilização

Na primeira vez que o usuário clicar em "Alocar":
1. Um modal aparecerá solicitando a chave API
2. A chave será salva no localStorage do navegador
3. Não é necessário inserir novamente

### 3. Segurança

- A chave é armazenada localmente no navegador do usuário
- Nunca é enviada para seu servidor
- Cada usuário precisa ter sua própria chave

## Categorias de Investimento Suportadas

O sistema reconhece as seguintes categorias (devem ser escritas exatamente assim):

1. **Renda Fixa**
   - CDB, LCI, LCA
   - CRI, CRA, DEBENTURE
   - Títulos públicos

2. **Fundo de investimento**
   - Ações
   - Liquidez
   - Renda Fixa

3. **Renda variável**
   - Ações
   - FII
   - ETF
   - BDR

4. **Previdência privada**
   - PGBL/VGBL

5. **Outros investimentos**

## Exemplos de Uso

### Comandos em Linguagem Natural

Os usuários podem escrever comandos como:

- "Coloque 60% em renda fixa e 40% em ações"
- "Quero 30% em FIIs, 20% em CDB e o resto em ações"
- "Aumente ações para 50% e reduza renda fixa para 30%"
- "Distribua igualmente entre ações, FIIs e renda fixa"
- "70% conservador em renda fixa e 30% em renda variável"

### Fluxo de Funcionamento

1. Usuário define o valor total do patrimônio
2. Usuário escreve comando em linguagem natural
3. Sistema envia para OpenAI processar
4. OpenAI retorna estrutura JSON com alocações
5. Sistema aplica automaticamente as porcentagens
6. Valores são atualizados na interface

## Integração com Sistema Existente

### Dependências

O sistema depende do `PatrimonySync` já existente:
- Aguarda o sistema estar inicializado
- Usa os métodos existentes para atualizar valores
- Mantém sincronização com localStorage

### Eventos

A integração dispara os mesmos eventos do sistema manual:
- `input` events nos campos de valor
- Atualiza sliders automaticamente
- Mantém validações de totalização

## Tratamento de Erros

### Erros Comuns e Soluções

1. **"API key not configured"**
   - Solução: Configure a chave API no modal

2. **"Total allocation exceeds 100%"**
   - Solução: Ajuste as porcentagens no comando

3. **"Por favor, defina o valor total do patrimônio primeiro"**
   - Solução: Insira o valor total antes de usar IA

4. **"Invalid response format"**
   - Solução: Tente reformular o comando

## Customizações Opcionais

### 1. Modificar o Prompt do Sistema

No arquivo `openai-allocation.js`, linha 16, você pode ajustar o `systemPrompt` para:
- Adicionar novas categorias
- Mudar o comportamento da IA
- Adicionar regras de negócio

### 2. Alterar Modelo da OpenAI

Linha 12: `model: 'gpt-4-turbo-preview'`

Opções:
- `gpt-4-turbo-preview` (recomendado)
- `gpt-4`
- `gpt-3.5-turbo` (mais barato, menos preciso)

### 3. Ajustar Limites

- `maxTokens`: Linha 13 (padrão: 1000)
- `temperature`: Linha 14 (padrão: 0.3)
- `retryAttempts`: Linha 48 (padrão: 3)

## Monitoramento e Debug

### Console Logs

O sistema registra no console:
- Inicialização: "OpenAI Allocation Controller initialized"
- Erros de processamento
- Respostas da API

### Debug Mode

Para ativar debug detalhado, no console do navegador:

```javascript
window.OpenAIAllocationController.debug = true;
```

## Considerações de Performance

1. **Cache de Respostas**: Não implementado para sempre ter alocações atualizadas
2. **Rate Limiting**: OpenAI limita requisições por minuto
3. **Timeout**: Requisições têm timeout de 30 segundos

## Suporte e Manutenção

### Atualizações Necessárias

1. Se adicionar novas categorias no Webflow:
   - Atualizar o `systemPrompt` no JS
   - Garantir estrutura HTML consistente

2. Se mudar classes CSS:
   - Atualizar seletores no arquivo JS

### Testes Recomendados

1. Testar com diferentes comandos em português
2. Verificar limites de porcentagem (não passar de 100%)
3. Testar com valores grandes e pequenos
4. Verificar comportamento offline

## Notas Finais

- A integração é não-invasiva e pode ser removida sem afetar o sistema manual
- Todos os dados continuam salvos no localStorage
- A API da OpenAI é paga por uso - monitore os custos
- Recomenda-se instruir usuários sobre comandos eficazes