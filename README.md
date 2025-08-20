# 🎮 RetroSniffer

Um comparador de preços para jogos retrô que busca automaticamente no eBay.

## 🚀 Funcionalidades

- ✅ Busca automática no eBay usando a API oficial
- ✅ Comparação de preços em tempo real
- ✅ Interface simples e intuitiva
- ✅ Resultados ordenados por preço
- ✅ Links diretos para os produtos no eBay
- ✅ Suporte a diferentes plataformas de jogos (PS2, PS3, PS4, Xbox, Nintendo, etc.)
- ✅ Sistema de autenticação automática com eBay API

## 🛠️ Instalação

### Pré-requisitos

- Node.js 18+
- npm ou yarn
- Conta de desenvolvedor eBay (para obter as credenciais da API)

### Passos

1. **Clone o repositório**

```bash
git clone https://github.com/rojasmart/retrosniffer.git
cd retrosniffer
```

2. **Instale as dependências**

```bash
# Se o PowerShell estiver bloqueando scripts, execute primeiro:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Instalar dependências
npm install
```

3. **Configure as credenciais do eBay**

Siga as instruções no arquivo `EBAY-SETUP.md` para configurar suas credenciais da API do eBay.

4. **Execute o projeto**

```bash
npm run dev
```

5. **Acesse no navegador**

```
http://localhost:3000
```

## 📁 Estrutura do Projeto

```
src/
├── app/
│   ├── api/
│   │   └── comparar/
│   │       └── route.ts          # API endpoint
│   ├── page.tsx                  # Página principal
│   ├── layout.tsx
│   └── globals.css
├── lib/
│   ├── scrapers/
│   │   ├── olx.ts                # Scraper OLX
│   │   ├── mercadolivre.ts       # Scraper MercadoLivre
│   │   ├── amazon.ts             # Scraper Amazon
│   │   ├── webuy.ts              # Scraper WebBuy Portugal
│   │   ├── nassutromi.ts         # Scraper Nas Sutromi Blog (PT)
│   │   └── index.ts              # Coordenador dos scrapers
│   ├── utils/
│   │   ├── formatters.ts         # Formatação de dados
│   │   └── validators.ts         # Validações
│   └── types/
│       └── index.ts              # Tipos TypeScript
```

## 🔧 API

### GET /api/comparar

Busca preços de um jogo específico.

**Parâmetros:**

- `nome` (string, obrigatório): Nome do jogo a ser pesquisado

**Exemplo:**

```
GET /api/comparar?nome=R-Type Final
```

**Resposta:**

```json
{
  "resultados": [
    {
      "title": "R-Type Final - PlayStation 2",
      "priceText": "R$ 89,90",
      "price": 89.9,
      "link": "https://...",
      "site": "MercadoLivre",
      "image": "https://..."
    }
  ],
  "total": 1
}
```

## 🎯 Como Usar

1. Digite o nome do jogo na caixa de pesquisa
2. Clique em "Procurar"
3. Aguarde os resultados aparecerem
4. Clique nos links para ver os produtos nos sites originais

## ⚠️ Limitações Atuais

- **Scrapers Implementados:**

  - ✅ **WebBuy Portugal**: Scraping real com Cheerio
  - ✅ **Nas Sutromi Blog**: Multi-year pagination com parsing real
  - ⚠️ **OLX, MercadoLivre, Amazon**: Dados mockados para demonstração

- **Para implementação completa dos scrapers mockados:**
  - Configurar parsing HTML com cheerio
  - Implementar rate limiting adequado
  - Considerar proxies para evitar bloqueios
  - Tratar CAPTCHAs e proteções anti-bot

## 🔄 Próximas Melhorias

## 🇵🇹 WebBuy Portugal Scraper

O scraper do WebBuy Portugal é totalmente funcional e implementa:

### Características

- **Parsing HTML Real**: Usa Cheerio para extrair dados reais
- **Múltiplas Estratégias**: 3 métodos de busca diferentes
- **Paginação Automática**: Procura em até 3 páginas automaticamente
- **Rate Limiting**: Delays respeitosos entre requisições
- **Filtros Específicos**: Foca especificamente em PlayStation 2
- **Busca por SKU**: Pode buscar produtos específicos por código

### URLs Suportadas

```
https://pt.webuy.com/search?categoryIds=1077&stext=JOGO     # PS2 específico
https://pt.webuy.com/search?stext=JOGO                     # Busca geral
https://pt.webuy.com/product/SKU                           # Produto específico
```

### Teste do WebBuy

```bash
node test-webuy.js
```

## 🚀 Roadmap

- [x] Scraper WebBuy Portugal
- [x] Scraper Nas Sutromi Blog com paginação
- [ ] Scraper OLX com parsing real
- [ ] Scraper MercadoLivre com parsing real
- [ ] Scraper Amazon com parsing real
- [ ] Filtros avançados (preço, condição, etc.)
- [ ] Histórico de preços
- [ ] Alertas de preço
- [ ] Modo escuro

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch: `git checkout -b feature/nova-funcionalidade`
3. Commit: `git commit -m 'Adiciona nova funcionalidade'`
4. Push: `git push origin feature/nova-funcionalidade`
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT.

## ⚖️ Aviso Legal

Este projeto é para fins educacionais. Respeite os termos de uso dos sites que você fizer scraping e considere usar APIs oficiais quando disponíveis.
