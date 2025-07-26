## 🎮 Teste do Scraper Nas Sutromi - Hello Kitty

### 📍 URLs de Teste:

1. **Página Principal PlayStation 2:**

   ```
   https://nas-sutromi.blogspot.com/search/label/Playstation%202
   ```

2. **Post Específico Hello Kitty:**

   ```
   https://nas-sutromi.blogspot.com/2024/11/hello-kitty.html
   ```

3. **Busca no Blog:**
   ```
   https://nas-sutromi.blogspot.com/search?q=Hello+Kitty
   ```

### 🔍 Estratégias de Busca Implementadas:

#### 1. **Busca na Página Principal**

- Acessa a listagem de todos os jogos PlayStation 2
- Extrai títulos, links e preços usando múltiplos padrões regex
- Ideal para descobrir novos jogos

#### 2. **Busca Usando Sistema do Blog**

- Utiliza o mecanismo de busca nativo do Blogspot
- Busca por termo específico em todo o conteúdo
- Melhor para encontrar posts específicos

#### 3. **Busca Multi-Página**

- Percorre múltiplas páginas de resultados
- Aumenta a cobertura de jogos encontrados
- Útil para buscas abrangentes

### 🎯 Padrões de Detecção:

```typescript
// Padrão 1: Markdown do blog
/### \[([^\]]+)\]\(([^)]+)\)[^]*?Valor:\s*(\d+)€/gi

// Padrão 2: HTML estruturado
/<h3[^>]*><a[^>]+href="([^"]+)"[^>]*>([^<]+)<\/a><\/h3>[^]*?Valor:\s*(\d+)€/gi

// Padrão 3: Links diretos
/<a[^>]+href="([^"]*nas-sutromi\.blogspot\.com[^"]*)"[^>]*>([^<]+)<\/a>[^]*?(\d+)€/gi

// Padrão 4: Atributos de imagem/título
/(?:title|alt)="([^"]*(?:jogo|game|playstation)[^"]*)"[^]*?href="([^"]*nas-sutromi[^"]*)"[^]*?(\d+)€/gi
```

### 🎮 Jogos de Exemplo Conhecidos:

| Jogo                   | Preço (EUR) | Preço (BRL) | Link                                                                                         |
| ---------------------- | ----------- | ----------- | -------------------------------------------------------------------------------------------- |
| Hello Kitty            | €8          | ~R$ 48,00   | [Ver Post](https://nas-sutromi.blogspot.com/2024/11/hello-kitty.html)                        |
| R-Type Final           | €20         | ~R$ 120,00  | [Ver Post](https://nas-sutromi.blogspot.com/2021/06/r-type-final.html)                       |
| Final Fantasy X        | €3          | ~R$ 18,00   | [Ver Post](https://nas-sutromi.blogspot.com/2021/07/final-fantasy-x.html)                    |
| Resident Evil Outbreak | €15         | ~R$ 90,00   | [Ver Post](https://nas-sutromi.blogspot.com/2021/09/playstation-2-jogo-usado-testado-e.html) |

### 🧪 Como Testar:

1. **Via Interface Web:**

   ```bash
   npm run dev
   # Acesse: http://localhost:3000
   # Digite: "Hello Kitty"
   ```

2. **Via Script de Teste:**

   ```bash
   node test-nassutromi.js
   ```

3. **Via API Direta:**
   ```bash
   curl "http://localhost:3000/api/comparar?nome=Hello%20Kitty"
   ```

### ✨ Funcionalidades Especiais:

- **Conversão Automática:** EUR → BRL (1€ ≈ 6 BRL)
- **Busca Inteligente:** Encontra jogos com nomes parciais
- **Anti-Duplicatas:** Remove resultados repetidos
- **Fallback Robusto:** Usa lista conhecida se parsing falhar
- **Rate Limiting:** Evita sobrecarga do blog

### 🔧 Configurações:

```typescript
// Taxa de conversão
EUR_TO_BRL_RATE: 6.0

// Delay entre requisições
DEFAULT_DELAY: 1000ms

// Máximo de páginas para buscar
MAX_PAGES: 3
```

Este scraper agora está otimizado para encontrar o Hello Kitty e outros jogos retrô portugueses! 🎯
