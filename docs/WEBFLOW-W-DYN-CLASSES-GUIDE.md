# ⚠️ Guia: Classes w-dyn-* do Webflow

## O Problema

As classes `w-dyn-items` e `w-dyn-item` são **automaticamente geradas pelo Webflow** e não devem ser usadas diretamente no código JavaScript como seletores primários.

## Por que isso é um problema?

### 1. **Classes Automáticas do Webflow**

- `w-dyn-items` é automaticamente adicionada a containers de Collection Lists
- `w-dyn-item` é automaticamente adicionada a cada item de Collection Lists
- Essas classes são **combos automáticos** - não são criadas manualmente

### 2. **Conflitos de Estilo**

- Essas classes têm CSS próprio do Webflow
- Aplicar estilos customizados pode gerar conflitos
- O comportamento pode variar entre Designer e site publicado

### 3. **Dependência Frágil**

- Se o Webflow mudar a implementação dessas classes, o código quebra
- Não há garantia de que essas classes existam em elementos não-Collection

## ✅ Soluções Implementadas

### Antes (Problemático)

```typescript
// ❌ Dependente de classes geradas automaticamente
document.querySelector('.patrimonio_interactive_content-wrapper.w-dyn-items')
document.querySelector('.patrimonio_interactive_item.w-dyn-item')
```

### Depois (Correto)

```typescript
// ✅ Usa apenas classes customizadas
document.querySelector('.patrimonio_interactive_content-wrapper')
document.querySelector('.patrimonio_interactive_item')
```

## 🎯 Diretrizes para Webflow

### No Designer

1. **Adicione apenas classes customizadas**:
   - `.patrimonio_interactive_content-wrapper`
   - `.patrimonio_interactive_item`

2. **NÃO adicione manualmente**:
   - `w-dyn-items`
   - `w-dyn-item`

### No Código JavaScript

1. **Use sempre classes customizadas** como seletores primários
2. **Evite depender** de classes `w-dyn-*`
3. **Se necessário**, use data-attributes para identificação única

## 📋 Checklist de Correções Aplicadas

- [x] **WebflowPortfolioSlider**: Removido `.w-dyn-items` e `.w-dyn-item` dos seletores
- [x] **Config de Ativos**: Substituído `.w-dyn-item` por `[data-ativo-item]`
- [x] **README atualizado**: Documentação corrigida com avisos
- [x] **Exemplos atualizados**: HTML de exemplo sem classes `w-dyn-*`

## 🔍 Classes w-dyn-* Ainda em Uso (Testes)

Os arquivos de teste ainda usam essas classes para simular o ambiente Webflow real. Isso é aceitável pois:

1. **Testes são ambientes controlados**
2. **Simulam comportamento real do Webflow**
3. **Não afetam o código de produção**

## 🚀 Próximos Passos

1. **Verificar no Webflow Designer** se as classes customizadas estão aplicadas
2. **Testar funcionamento** com e sem Collection Lists
3. **Monitorar console** para debug logs de inicialização
4. **Validar responsividade** em todos os breakpoints

## ⚡ Benefícios da Correção

- ✅ **Maior estabilidade** - independente de mudanças do Webflow
- ✅ **Melhor performance** - seletores mais diretos
- ✅ **Código mais limpo** - sem dependências desnecessárias
- ✅ **Flexibilidade** - funciona com ou sem Collection Lists
