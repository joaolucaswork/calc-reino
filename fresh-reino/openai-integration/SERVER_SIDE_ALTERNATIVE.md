# Server-Side OpenAI Integration Alternative

Este documento descreve uma implementação alternativa do lado servidor para maior segurança e controle centralizado das chamadas à API OpenAI.

## Por que usar Server-Side?

### Vantagens
1. **Segurança**: API key fica protegida no servidor
2. **Controle de custos**: Monitoramento centralizado de uso
3. **Rate limiting**: Controle de requisições por usuário
4. **Cache**: Possibilidade de cachear respostas comuns
5. **Logs**: Auditoria centralizada de todas as requisições

### Desvantagens
1. Requer infraestrutura de servidor
2. Latência adicional
3. Custos de hospedagem

## Arquitetura Proposta

```
[Cliente Webflow] <-> [API Gateway] <-> [Servidor Backend] <-> [OpenAI API]
```

## Implementação Backend (Node.js + Express)

### 1. Estrutura do Projeto

```
backend/
├── src/
│   ├── controllers/
│   │   └── allocation.controller.js
│   ├── services/
│   │   ├── openai.service.js
│   │   └── allocation.service.js
│   ├── middleware/
│   │   ├── auth.middleware.js
│   │   └── rateLimit.middleware.js
│   ├── config/
│   │   └── index.js
│   └── app.js
├── package.json
└── .env
```

### 2. Configuração Inicial

**package.json**
```json
{
  "name": "asset-allocation-api",
  "version": "1.0.0",
  "main": "src/app.js",
  "scripts": {
    "start": "node src/app.js",
    "dev": "nodemon src/app.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "openai": "^4.20.0",
    "express-rate-limit": "^7.1.0",
    "helmet": "^7.1.0",
    "morgan": "^1.10.0",
    "joi": "^17.11.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
```

**.env**
```
PORT=3000
OPENAI_API_KEY=sk-your-api-key-here
ALLOWED_ORIGINS=https://your-site.webflow.io,http://localhost:3000
RATE_LIMIT_WINDOW=60000
RATE_LIMIT_MAX=10
```

### 3. Configuração do Servidor

**src/config/index.js**
```javascript
require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  openaiApiKey: process.env.OPENAI_API_KEY,
  allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['*'],
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 60000,
    max: parseInt(process.env.RATE_LIMIT_MAX) || 10
  }
};
```

**src/app.js**
```javascript
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const config = require('./config');
const allocationController = require('./controllers/allocation.controller');
const rateLimitMiddleware = require('./middleware/rateLimit.middleware');

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: config.allowedOrigins,
  credentials: true
}));

// Logging
app.use(morgan('combined'));

// Body parsing
app.use(express.json());

// Rate limiting
app.use('/api/allocation', rateLimitMiddleware);

// Routes
app.post('/api/allocation/process', allocationController.processAllocation);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    code: err.code || 'SERVER_ERROR'
  });
});

// Start server
app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});
```

### 4. Serviços

**src/services/openai.service.js**
```javascript
const { OpenAI } = require('openai');
const config = require('../config');

class OpenAIService {
  constructor() {
    this.client = new OpenAI({
      apiKey: config.openaiApiKey
    });

    this.systemPrompt = `You are an asset allocation assistant. Parse natural language requests about investment allocation and return structured JSON data.

Available asset categories:
- Renda Fixa (CDB, LCI, LCA)
- Renda Fixa (CRI, CRA, DEBENTURE)
- Renda Fixa (Títulos públicos)
- Fundo de investimento (Ações)
- Fundo de investimento (Liquidez)
- Fundo de investimento (Renda Fixa)
- Renda variável (Ações)
- Renda variável (FII)
- Renda variável (ETF)
- Renda variável (BDR)
- Previdência privada (PGBL/VGBL)
- Outros investimentos

Instructions:
1. Parse the user's request for allocation changes
2. Return ONLY valid JSON with the requested allocations
3. Ensure total allocation does not exceed 100%
4. Use percentages for allocations
5. Match asset categories exactly as listed above

Response format:
{
  "allocations": [
    {
      "category": "exact category name",
      "subcategory": "exact subcategory name",
      "percentage": number
    }
  ],
  "totalPercentage": number
}`;
  }

  async processAllocationRequest(prompt, currentAllocations) {
    try {
      const contextPrompt = `
Current allocations:
${JSON.stringify(currentAllocations, null, 2)}

User request: ${prompt}
      `;

      const response = await this.client.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: this.systemPrompt
          },
          {
            role: 'user',
            content: contextPrompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.3
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw new Error('Failed to process allocation request');
    }
  }
}

module.exports = new OpenAIService();
```

**src/services/allocation.service.js**
```javascript
const openaiService = require('./openai.service');

class AllocationService {
  async processAllocation(data) {
    const { prompt, currentAllocations, totalValue } = data;

    // Validate input
    if (!prompt || !totalValue || totalValue <= 0) {
      throw new Error('Invalid input data');
    }

    // Get AI response
    const aiResponse = await openaiService.processAllocationRequest(
      prompt,
      currentAllocations
    );

    // Parse and validate response
    const parsedData = this.parseAIResponse(aiResponse);

    // Calculate actual values
    const allocationsWithValues = this.calculateValues(parsedData, totalValue);

    return {
      success: true,
      allocations: allocationsWithValues,
      totalPercentage: parsedData.totalPercentage,
      timestamp: new Date().toISOString()
    };
  }

  parseAIResponse(response) {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const data = JSON.parse(jsonMatch[0]);

      // Validate structure
      if (!data.allocations || !Array.isArray(data.allocations)) {
        throw new Error('Invalid allocation structure');
      }

      // Validate total percentage
      const total = data.allocations.reduce((sum, item) => sum + item.percentage, 0);
      if (total > 100.1) {
        throw new Error(`Total allocation exceeds 100% (${total.toFixed(1)}%)`);
      }

      data.totalPercentage = total;
      return data;
    } catch (error) {
      console.error('Error parsing AI response:', error);
      throw new Error('Failed to parse AI response');
    }
  }

  calculateValues(parsedData, totalValue) {
    return parsedData.allocations.map(allocation => ({
      ...allocation,
      value: (totalValue * allocation.percentage) / 100,
      formattedValue: this.formatCurrency((totalValue * allocation.percentage) / 100)
    }));
  }

  formatCurrency(value) {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  }
}

module.exports = new AllocationService();
```

### 5. Controllers

**src/controllers/allocation.controller.js**
```javascript
const allocationService = require('../services/allocation.service');
const Joi = require('joi');

// Validation schema
const allocationSchema = Joi.object({
  prompt: Joi.string().min(10).max(500).required(),
  totalValue: Joi.number().positive().required(),
  currentAllocations: Joi.object({
    totalValue: Joi.number(),
    allocations: Joi.array().items(
      Joi.object({
        category: Joi.string(),
        subcategory: Joi.string(),
        value: Joi.number(),
        percentage: Joi.number()
      })
    )
  })
});

class AllocationController {
  async processAllocation(req, res, next) {
    try {
      // Validate request
      const { error, value } = allocationSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          error: 'Validation error',
          details: error.details[0].message
        });
      }

      // Process allocation
      const result = await allocationService.processAllocation(value);

      // Log for monitoring
      console.log('Allocation processed:', {
        prompt: value.prompt.substring(0, 50) + '...',
        totalValue: value.totalValue,
        timestamp: new Date().toISOString()
      });

      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AllocationController();
```

### 6. Middleware

**src/middleware/rateLimit.middleware.js**
```javascript
const rateLimit = require('express-rate-limit');
const config = require('../config');

const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: 'Too many requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = limiter;
```

**src/middleware/auth.middleware.js** (Opcional)
```javascript
// Implementação de autenticação se necessário
const authenticateUser = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  // Implementar validação de API key por usuário
  if (!apiKey) {
    return res.status(401).json({ error: 'API key required' });
  }
  
  // Validar API key no banco de dados
  // ...
  
  next();
};

module.exports = { authenticateUser };
```

## Modificação do Cliente (Webflow)

### 1. Novo arquivo JavaScript para cliente

**openai-allocation-server.js**
```javascript
(function() {
  'use strict';

  const CONFIG = {
    apiEndpoint: 'https://your-api-domain.com/api/allocation/process',
    timeout: 30000
  };

  class OpenAIAllocationClient {
    constructor() {
      this.isProcessing = false;
      this.promptInput = null;
      this.processButton = null;
      this.patrimonySystem = null;
    }

    async init() {
      await this.waitForDependencies();
      this.setupUI();
      this.setupEventListeners();
      console.log('OpenAI Allocation Client initialized');
    }

    async processAllocationRequest() {
      if (this.isProcessing) return;

      const prompt = this.promptInput.value.trim();
      if (!prompt) return;

      this.isProcessing = true;
      this.showLoading(true);

      try {
        const currentAllocations = this.getCurrentAllocations();
        const mainValue = this.patrimonySystem.getMainValue();

        const response = await fetch(CONFIG.apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            prompt,
            totalValue: mainValue,
            currentAllocations
          })
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Request failed');
        }

        const data = await response.json();
        
        if (data.success) {
          await this.applyAllocations(data);
          this.promptInput.value = '';
          this.showSuccess();
        }
      } catch (error) {
        console.error('Error:', error);
        this.showError(error.message);
      } finally {
        this.isProcessing = false;
        this.showLoading(false);
      }
    }

    // ... resto dos métodos similares ao cliente original ...
  }

  const client = new OpenAIAllocationClient();
  client.init().catch(console.error);

})();
```

## Deployment

### 1. Heroku

```bash
# Instalar Heroku CLI
# Criar app
heroku create your-app-name

# Configurar variáveis
heroku config:set OPENAI_API_KEY=sk-...
heroku config:set ALLOWED_ORIGINS=https://your-site.webflow.io

# Deploy
git push heroku main
```

### 2. Vercel

**vercel.json**
```json
{
  "version": 2,
  "builds": [
    {
      "src": "src/app.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "src/app.js"
    }
  ]
}
```

### 3. AWS Lambda

Usar Serverless Framework para deploy em Lambda.

## Monitoramento

### 1. Logs Estruturados

```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

### 2. Métricas

- Tempo de resposta da API
- Taxa de erro
- Uso por usuário
- Custos da OpenAI

## Segurança Adicional

1. **HTTPS obrigatório**
2. **Validação de entrada rigorosa**
3. **Rate limiting por IP e por usuário**
4. **Sanitização de prompts**
5. **Timeout nas requisições**
6. **Backup da API key**

## Vantagens desta Abordagem

1. **Segurança**: API key nunca exposta
2. **Controle**: Logs centralizados
3. **Flexibilidade**: Fácil adicionar features
4. **Escalabilidade**: Pode usar cache e load balancing
5. **Conformidade**: Melhor para LGPD/compliance