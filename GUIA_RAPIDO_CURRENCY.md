# 🚀 Guia Rápido - Currency Module

## Para Produção

### 1. Build do Projeto
```bash
pnpm build
```

### 2. Upload dos Arquivos
- `dist/currency/index.js` → Seu servidor/CDN
- `dist/currency/index.css` → Seu servidor/CDN

### 3. Adicionar no Webflow (Head Code)
```html
<link href="https://seu-dominio.com/currency/index.css" rel="stylesheet" type="text/css"/>
```

### 4. Adicionar no Webflow (Footer Code)
```html
<script defer src="https://seu-dominio.com/currency/index.js"></script>
```

### 5. Configurar Inputs
```html
<input type="text" data-currency="true" name="price" placeholder="0,00">
```

---

## Para Desenvolvimento

### 1. Iniciar Dev Server
```bash
pnpm dev
```

### 2. Adicionar no Webflow (Head Code)
```html
<link href="http://localhost:3000/currency/index.css" rel="stylesheet" type="text/css"/>
```

### 3. Adicionar no Webflow (Footer Code)
```html
<script defer src="http://localhost:3000/currency/index.js"></script>
```

---

## ✅ Resultado

Qualquer input com `data-currency="true"` será automaticamente formatado como:
- **R$ 1.234,56** (formato brasileiro)
- Símbolo fixo à esquerda
- Formatação em tempo real
- Valor numérico preservado para formulários

## 🔧 Não Precisa de Mais Nada!

O módulo funciona automaticamente após a importação. Sem configuração adicional necessária.
