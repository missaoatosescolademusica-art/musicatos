# 🎓 Musicatos

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/missaoatosescolademusica-9459s-projects/v0-student-management-app)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.app-black?style=for-the-badge)](https://v0.app/chat/ud2uBb5K7Sx)

---

## 🔍 Introdução

- 🎵 Sistema de gerenciamento de estudantes para a Missão Atos – Escola de Música
- 🧭 Facilita cadastro, listagem, edição e remoção de estudantes, com busca avançada e paginação
- 🖥️ Suporte completo a dispositivos móveis e desktop com design responsivo

### 🎯 Objetivos

- Centralizar o controle de estudantes e usuários
- Garantir experiência fluida de navegação (hambúrguer menu, overlay, animações)
- Manter persistência de estado entre páginas (menus e autenticação)

### 🚀 Tecnologias

- ⚛️ React + Next.js
- 🟦 TypeScript
- 🎨 TailwindCSS + Radix UI
- 🗃️ Prisma + PostgreSQL
- 🔐 JWT + Middleware/Proxy
- 🧪 Vitest (testes)
- ▲ Vercel (deploy)

===

## 📋 Instalação

```bash
npm i
npm run dev
```

### 🛠️ Troubleshooting

- 🟥 Porta 3000 ocupada: o dev usa a próxima porta disponível (ex.: 3001). Feche instâncias anteriores.
- ⚠️ Aviso “middleware” deprecado: migre gradualmente para “proxy” conforme docs do Next.js.
- 🔑 Erros de autenticação: verifique `JWT_SECRET` e cookies `auth`.
- 🗂️ Banco de dados: confirme `DATABASE_URL` e execução do `prisma generate`.

---

## 🗺️ Rotas da API

| Método | Rota       | Descrição            | Parâmetros   |
|--------|------------|----------------------|--------------|
| GET    | /api/users | Lista todos usuários | page, limit  |
| POST   | /api/auth  | Autenticação         | email, pwd   |

---

## 🎨 Exemplos de Código

```ts
// Exemplo de atualização de estudante
await fetch(`/api/students/${id}`, {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ fullName, email, phone, instruments, available }),
})
```

```ts
// Busca com query e paginação
await fetch(`/api/students?page=${page}&search=${encodeURIComponent(term)}`)
```

---

## 📌 Configuração

- 📄 Arquivos importantes:
  - `.env`
  - `next.config.mjs`
  - `prisma/schema.prisma`

- 🔧 Variáveis de ambiente:
  - `NODE_ENV` (ex.: `development` | `production`)
  - `DATABASE_URL` (string de conexão do banco)
  - `JWT_SECRET` (segredo para assinar tokens)

---

## 🤝 Contribuição

- 🧭 Fluxo de trabalho:
  - Crie branchs por feature/bugfix
  - Abra PR com descrição objetiva
  - Code review e testes antes de merge

- 🧾 Padrões de commit (com emojis):
  - ✨ feat: nova funcionalidade
  - 🐛 fix: correção de bug
  - ♻️ refactor: refatoração
  - 🧪 test: testes
  - 📚 docs: documentação

---

## ❓ FAQ

- 🟢 “Não consigo acessar /register”
  - Faça login ou ajuste o middleware para acesso público.

- 🟡 “Menu lateral não persiste”
  - Verifique `localStorage.sidebarOpen` e a lógica do `UIContext`.

- 🟥 “Porta em uso / lock no dev”
  - Feche instâncias anteriores e reinicie o servidor.

---

## 📜 Status

- 🟢 Funcionando: Dashboard, CRUD de estudantes, autenticação
- 🟡 Em desenvolvimento: ajustes finos de Proxy/Middleware

===

## 📘 Changelog

### Refatoração do StudentsContext

- Alinhado o `StudentsContext` com os wrappers de `app/dashboard/helper/crudStudent.ts`, delegando toda a lógica de negócio (CRUD) aos wrappers.
- Padronização de tipos: o contexto expõe funções sem parâmetros (`fetchStudents`, `viewStudent`, `editStudent`, `deleteStudent`, `saveStudent`) que internamente chamam os wrappers com dependências de estado.
- Adicionada propriedade `error` ao tipo `StudentsContextState` (em `app/types/contexts.ts`) para sinalização de falhas junto ao `loading`.
- Reduzido código duplicado e melhorada a legibilidade, mantendo reatividade e estado global (lista, paginação, diálogo, seleção).
- Notificações de sucesso/erro continuam sendo tratadas pelos helpers subjacentes (via `toast`).
