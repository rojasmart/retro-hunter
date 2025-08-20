# Configuração da API do eBay

Este guia mostra como configurar a API do eBay no projeto Retrosniffer.

## 1. Criar uma Conta de Desenvolvedor no eBay

1. Acesse [eBay Developers](https://developer.ebay.com/)
2. Faça login ou crie uma conta
3. Acesse o painel de desenvolvedor

## 2. Criar uma Aplicação

1. No painel, clique em "Create an App"
2. Preencha os dados da aplicação:
   - **Application Title**: Retrosniffer
   - **Application Type**: Personal
   - **Application Use Case**: Marketplace data
3. Aceite os termos e clique em "Create Application"

## 3. Obter as Credenciais

Após criar a aplicação, você receberá:

- **App ID (Client ID)**
- **Dev ID**
- **Cert ID (Client Secret)**

## 4. Gerar OAuth Application Token

1. No painel da aplicação, vá para "User Tokens"
2. Clique em "Get a Token from eBay via Your Application"
3. Selecione os scopes necessários:
   - `https://api.ebay.com/oauth/api_scope/buy.item.browse`
4. Clique em "Generate Token"
5. Copie o **OAuth Application Token**

## 5. Configurar Variáveis de Ambiente

Adicione as seguintes variáveis ao arquivo `.env.local`:

```env
# eBay API Configuration
EBAY_CLIENT_ID=your_app_id_here
EBAY_CLIENT_SECRET=your_cert_id_here
EBAY_ACCESS_TOKEN=your_oauth_application_token_here

# Opcional - para usar sandbox (desenvolvimento)
EBAY_SANDBOX=false
```

## 6. Testar a Configuração

Execute o script de teste:

```bash
node test-ebay.js
```

## Scopes Necessários

Para usar a API Browse do eBay, você precisa dos seguintes scopes:

- `https://api.ebay.com/oauth/api_scope/buy.item.browse` - Para buscar itens
- `https://api.ebay.com/oauth/api_scope/buy.item.browse.bulk` - Para buscas em massa (opcional)

## Limites da API

O eBay tem os seguintes limites para OAuth Application Tokens:

- **Production**: 5,000 chamadas por dia
- **Sandbox**: 1,000 chamadas por dia

## Marketplace IDs

O projeto está configurado para usar o marketplace da Espanha (`EBAY_ES`) por ser o mais próximo de Portugal. Outros marketplaces disponíveis:

- `EBAY_US` - Estados Unidos
- `EBAY_GB` - Reino Unido
- `EBAY_DE` - Alemanha
- `EBAY_FR` - França
- `EBAY_IT` - Itália

## Troubleshooting

### Token Inválido

Se receber erro de token inválido:

1. Verifique se o token está correto no `.env.local`
2. Gere um novo token no painel do desenvolvedor
3. Certifique-se de que os scopes estão corretos

### Rate Limit Atingido

Se atingir o limite de requisições:

1. Aguarde até o reset diário
2. Implemente cache para reduzir chamadas
3. Use filtros mais específicos

### Erro de CORS

Se houver erros de CORS:

1. Certifique-se de usar a API no servidor (não no cliente)
2. Verifique se as URLs estão corretas

## Estrutura do Projeto

```
src/
├── lib/
│   ├── config/
│   │   └── ebay.ts          # Configurações da API
│   ├── scrapers/
│   │   └── ebay.ts          # Scraper do eBay
│   └── types/
│       └── index.ts         # Tipos TypeScript
├── app/
│   └── api/
│       └── ebay/
│           └── route.ts     # Endpoint da API
└── test-ebay.js            # Script de teste
```

## Exemplo de Uso

### Busca Simples

```typescript
import { scrapeEbay } from "@/lib/scrapers/ebay";

const results = await scrapeEbay("Super Mario", "all");
console.log(results);
```

### Busca por Plataforma

```typescript
const ps2Results = await scrapeEbay("Final Fantasy", "ps2");
console.log(ps2Results);
```

### Busca via API

```bash
curl "http://localhost:3000/api/ebay?nome=mario&platform=ps2"
```

## Links Úteis

- [eBay Developers Portal](https://developer.ebay.com/)
- [API Browse Documentation](https://developer.ebay.com/api-docs/buy/browse/overview.html)
- [OAuth Guide](https://developer.ebay.com/api-docs/static/oauth-quick-start-guide.html)
- [Marketplace IDs](https://developer.ebay.com/api-docs/static/rest-request-components.html#marketpl)
