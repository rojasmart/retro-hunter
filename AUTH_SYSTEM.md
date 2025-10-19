# Sistema de Autenticação - Retro Hunter

## Visão Geral

Foi implementado um sistema completo de autenticação para o Retro Hunter que permite aos usuários:

- ✅ Criar conta (registro)
- ✅ Fazer login
- ✅ Manter sessão ativa
- ✅ Acessar páginas protegidas (My Collection e My Account)
- ✅ Fazer logout

## Estrutura dos Arquivos

### 📁 Tipos e Interfaces

- `src/lib/types/auth.ts` - Definições TypeScript para autenticação

### 📁 Context de Autenticação

- `src/contexts/AuthContext.tsx` - Context React para gerenciar estado global de autenticação

### 📁 Componentes de UI

- `src/components/auth/LoginForm.tsx` - Formulário de login
- `src/components/auth/RegisterForm.tsx` - Formulário de registro
- `src/components/auth/AuthModal.tsx` - Modal que contém os formulários
- `src/components/auth/AuthButton.tsx` - Botão de login/logout com dropdown
- `src/components/ProtectedRoute.tsx` - Wrapper para proteger rotas

### 📁 APIs Backend

- `src/app/api/auth/auth-service.ts` - Serviço de autenticação (simulação em memória)
- `src/app/api/auth/login/route.ts` - Endpoint de login
- `src/app/api/auth/register/route.ts` - Endpoint de registro
- `src/app/api/auth/verify/route.ts` - Endpoint para verificar token
- `src/app/api/auth/logout/route.ts` - Endpoint de logout

### 📁 Páginas Protegidas

- `src/app/my-account/page.tsx` - Página de conta do usuário
- `src/app/my-collection/page.tsx` - Página de coleção de jogos

### 📁 Middleware

- `middleware.ts` - Middleware Next.js (básico)

## Como Usar

### 1. Navegação

Na página principal, você verá botões "Entrar" e "Registrar" no canto superior direito.

### 2. Criar Conta

1. Clique em "Registrar"
2. Preencha nome, email e senha (mínimo 6 caracteres)
3. Confirme a senha
4. Clique em "Criar conta"

### 3. Fazer Login

1. Clique em "Entrar"
2. Digite email e senha
3. Clique em "Entrar"

### 4. Acessar Páginas Protegidas

Após fazer login, você pode acessar:

- **My Collection**: `/my-collection` - Gerencie sua coleção de jogos
- **My Account**: `/my-account` - Visualize e edite suas informações

### 5. Logout

Clique no seu nome no canto superior direito e selecione "Sair".

## Recursos Implementados

### 🔐 Autenticação

- **Registro de usuários** com validação de email e senha
- **Login** com credenciais
- **Sessões persistentes** (localStorage + verificação no servidor)
- **Logout** com limpeza de sessão

### 🛡️ Proteção de Rotas

- Componente `ProtectedRoute` que:
  - Verifica se o usuário está logado
  - Redireciona para login se necessário
  - Mostra loading durante verificação

### 🎨 Interface de Usuário

- **Modal responsivo** para login/registro
- **Formulários validados** com feedback de erro
- **Botão de perfil** com dropdown
- **Design consistente** com o tema do projeto

### 📱 Páginas de Usuário

#### My Account

- Visualizar informações do perfil
- Editar nome e email (simulado)
- Estatísticas da conta
- Avatar gerado automaticamente

#### My Collection

- Adicionar jogos à coleção pessoal
- Gerenciar plataforma, condição e preço
- Visualizar estatísticas da coleção
- Remover jogos

## Implementação Técnica

### Estado Global

```tsx
const { user, isAuthenticated, login, logout, error } = useAuth();
```

### Proteção de Componentes

```tsx
<ProtectedRoute>
  <MinhaComponenteProtegida />
</ProtectedRoute>
```

### APIs

- **POST** `/api/auth/register` - Criar conta
- **POST** `/api/auth/login` - Fazer login
- **GET** `/api/auth/verify` - Verificar token
- **POST** `/api/auth/logout` - Fazer logout

## Melhorias Futuras

### 🚀 Para Produção

- [ ] Usar banco de dados real (PostgreSQL/MongoDB)
- [ ] Hash de senhas com bcrypt
- [ ] JWT tokens com refresh
- [ ] Validação de email
- [ ] Recuperação de senha
- [ ] Autenticação social (Google, GitHub)

### 🎯 Funcionalidades Extras

- [ ] Persistir coleção no banco de dados
- [ ] Sincronização com API do eBay
- [ ] Notificações de preços
- [ ] Wishlist de jogos
- [ ] Importar/exportar coleção

## Segurança

⚠️ **Nota sobre Segurança**: A implementação atual é para demonstração. Em produção:

1. **Nunca armazene senhas em texto plano**
2. **Use HTTPS sempre**
3. **Implemente rate limiting**
4. **Valide todas as entradas**
5. **Use tokens JWT com expiração**
6. **Sanitize dados do usuário**

## Como Testar

1. Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

2. Acesse `http://localhost:3000`

3. Teste o fluxo completo:
   - Registre uma nova conta
   - Faça login
   - Acesse "My Collection" e "My Account"
   - Adicione alguns jogos à coleção
   - Faça logout

O sistema está totalmente funcional e pronto para uso! 🎮
