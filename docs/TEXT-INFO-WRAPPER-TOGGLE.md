# Toggle da Classe "hide" para text-info_wrapper

## Funcionalidade Implementada

Foi implementado o toggle automático da classe "hide" para elementos com classe `text-info_wrapper` baseado no estado das áreas de drop e containers de origem. **Esta implementação substitui o sistema anterior de mensagens CSS (`::after`) que mostravam "Arraste seus ativos aqui".**

### Como Funciona

1. **Quando a área está VAZIA**:
   - A classe `hide` é **removida** do elemento `text-info_wrapper`
   - O elemento fica **visível** (assumindo que a classe `hide` define `display: none` no CSS)

2. **Quando a área TEM ITENS**:
   - A classe `hide` é **adicionada** ao elemento `text-info_wrapper`
   - O elemento fica **oculto**

### Mudanças da Implementação Anterior

- **Removido**: Sistema CSS `::after` que mostrava "Arraste seus ativos aqui"
- **Removido**: Classes `ativos-empty` e lógica relacionada no CSS
- **Simplificado**: Sistema de controle de estado no `counter.ts`
- **Implementado**: Sistema baseado no `text-info_wrapper` com toggle da classe `hide`

### Áreas Monitoradas

- **Containers de origem**: `.ativos_main-list`
- **Áreas de drop**: `.ativos_main_drop_area`

### Estratégias de Busca do text-info_wrapper

O sistema procura o elemento `text-info_wrapper` usando múltiplas estratégias:

1. **Busca direta**: Dentro do próprio container
2. **Busca no elemento pai**: No `parentElement` do container
3. **Busca específica para drop areas**:
   - Dentro do wrapper `.drop_ativos_area-wrapper`
   - Dentro de qualquer elemento com classe que contenha "drop"

### Quando é Executado

O toggle é executado automaticamente nos seguintes momentos:

- **Inicialização**: Quando o sistema é inicializado
- **Adição de item**: Quando um item é arrastado para uma área
- **Remoção de item**: Quando um item é removido de uma área
- **Restauração de itens**: Quando itens são restaurados para containers originais
- **Criação de novos ativos**: Quando novos ativos são criados
- **Carregamento de persistência**: Quando itens persistidos são carregados

### Estrutura HTML Esperada

```html
<!-- Exemplo para container de origem -->
<div class="container-wrapper">
  <div class="ativos_main-list">
    <!-- itens draggable aqui -->
  </div>
  <div class="text-info_wrapper">
    <p>Área vazia - arraste itens aqui</p>
  </div>
</div>

<!-- Exemplo para área de drop -->
<div class="drop_ativos_area-wrapper">
  <div class="ativos_main_drop_area">
    <!-- itens dropped aqui -->
  </div>
  <div class="text-info_wrapper">
    <p>Área de drop vazia</p>
  </div>
</div>
```

### CSS Necessário

```css
.text-info_wrapper.hide {
  display: none;
}
```

### Integração no Webflow

1. **Estrutura no Webflow**:
   - Criar elementos com as classes corretas (`ativos_main-list`, `ativos_main_drop_area`, `text-info_wrapper`)
   - Posicionar o `text-info_wrapper` próximo aos containers que ele deve monitorar

2. **Classe CSS "hide"**:
   - Criar uma classe combo "hide" no Webflow Designer
   - Configurar `display: none` para esta classe
   - Aplicar como combo class ao `text-info_wrapper`

3. **Teste**:
   - Publicar o site
   - Testar arraste e solte de itens
   - Verificar se a mensagem aparece/desaparece corretamente

### Debugging

Para verificar se a funcionalidade está funcionando:

```javascript
// No console do navegador, execute:
console.log('Containers monitorados:', document.querySelectorAll('.ativos_main-list, .ativos_main_drop_area'));
console.log('Text info wrappers encontrados:', document.querySelectorAll('.text-info_wrapper'));

// Para forçar uma atualização manual:
// (assumindo que o módulo está disponível globalmente)
EnhancedAtivosManager.updateContainerStates();
```
