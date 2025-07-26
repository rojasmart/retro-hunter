# 🎮 RetroSniffer

Um comparador de preços para jogos retrô que faz scraping automaticamente de diferentes sites.

## 🚀 Funcionalidades

- ✅ Busca automática em múltiplos sites (MercadoLivre, OLX, Amazon, Nas Sutromi Blog)
- ✅ Comparação de preços em tempo real
- ✅ Interface simples e intuitiva
- ✅ Resultados ordenados por preço
- ✅ Links diretos para os produtos
- ✅ Suporte a jogos retrô portugueses (Nas Sutromi Blog)

## 🛠️ Instalação

### Pré-requisitos

- Node.js 18+
- npm ou yarn

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

# Instalar dependências principais
npm install

# Instalar dependências de scraping
npm install cheerio axios @types/cheerio
```

3. **Execute o projeto**

```bash
npm run dev
```

4. **Acesse no navegador**

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
│   │   ├── mercadolivre.ts       # Scraper MercadoLivre
│   │   ├── olx.ts                # Scraper OLX
│   │   ├── amazon.ts             # Scraper Amazon
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

- Os scrapers estão configurados com dados mockados para demonstração
- Para implementação real, você precisa:
  - Configurar parsing HTML com cheerio
  - Implementar rate limiting adequado
  - Considerar proxies para evitar bloqueios
  - Tratar CAPTCHAs e proteções anti-bot

## 🔄 Próximas Melhorias

- [ ] Implementar parsing real do HTML
- [ ] Adicionar mais sites (Shopee, Americanas, etc.)
- [ ] Sistema de cache Redis
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
