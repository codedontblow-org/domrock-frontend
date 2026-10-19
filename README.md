# Repositório Front-end Web DomRock

O desafio consiste no desenvolvimento de um sistema para gerenciamento de regras de negócio. Este repositório tem como objetivo alocar o front-end da aplicação web.

Leia mais em [Repositório Principal](https://github.com/codedontblow-org/domrock-camplana)!


## 📂 **Estrutura do Projeto**

```
domrock-frontend/
│
├── public/                              # Arquivos estáticos
│
├── src/                                 # Código-fonte principal
│   ├── (auth)/login/                    # Tela de login (e a animação de partículas)
│   ├── (user)/chat/                     # Chat com a Lana, ficha da campanha e resultado da simulação
│   │   ├── components/                  # Painel de parâmetros, resultado, cenários, campos da ficha
│   │   ├── services/                    # Chamadas da campanha ao backend
│   │   ├── stores/                      # Estado do chat (Pinia)
│   │   └── __tests__/                   # Testes (Vitest)
│   ├── (admin)/users/                   # Gestão de usuários do Administrador (A6-63, em construção)
│   ├── assets/                          # Fontes, ícones e estilos globais
│   ├── components/                      # Componentes reutilizáveis (Sidebar, botões)
│   ├── layouts/                         # Layout com a barra lateral
│   ├── router/                          # Rotas e guardas de navegação por perfil
│   ├── services/                        # Cliente HTTP (api.ts) e login (auth.ts)
│   ├── types/                           # Tipos compartilhados
│   ├── App.vue                          # Componente raiz
│   └── main.ts                          # Ponto de entrada da aplicação
│
├── .github/workflows/ci.yml             # CI: tipos, testes e build
├── .env.example                         # Variáveis do Vite (endereço do backend)
├── LICENSE
├── package-lock.json
├── package.json
├── README.md
├── vite.config.ts                       # Configuração do Vite (inclui o proxy /backend)
└── tsconfig.json                        # Configuração do TypeScript
```
---

## ⚙️ Tecnologias Utilizadas:

![Vue.js](https://img.shields.io/badge/Vue.js-42B883?style=for-the-badge&logo=vue.js&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwind-css&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)

Vue 3 com Vite, TypeScript, Pinia, Vue Router, Axios, Tailwind CSS e Vitest.

## ❓Como Executar:

### Pré-requisitos

- Node.js 24 (o mesmo do CI; o `package.json` aceita `^22.18.0` ou `>=24.12.0`);
- O backend rodando, porque toda tela, exceto o login, exige um usuário autenticado.

Para subir o sistema completo (banco, backend, Lana e este front) com um comando, use o [repositório principal](https://github.com/codedontblow-org/domrock-camplana). Os passos abaixo rodam **só o front**, apontando para um backend que já esteja no ar.

### Passo a passo

```bash
npm install
cp .env.example .env   # opcional: os valores padrão já apontam para http://localhost:8080
npm run dev
```

A aplicação abre em http://localhost:5173.

| Variável | Padrão | Para quê |
| --- | --- | --- |
| `VITE_API_BASE_URL` | `/backend` | Prefixo que o navegador usa para chamar a API |
| `API_PROXY_TARGET` | `http://localhost:8080` | Para onde o Vite repassa as chamadas a `/backend` (só em desenvolvimento) |

Se o backend estiver em outra porta, troque `API_PROXY_TARGET` no `.env` e reinicie o `npm run dev`.

## 🔐 Login e perfis

Sem login, qualquer rota leva para `/login`. O token e o perfil ficam no `localStorage`, e todas as chamadas à API enviam o token. Se o backend responder 401 (token vencido ou usuário desativado), a sessão é encerrada e o usuário volta para o login.

| Rota | Tela | Quem acessa |
| --- | --- | --- |
| `/login` | Login | Qualquer pessoa |
| `/` | Chat com a Lana | Gerente e Supervisor |
| `/admin` | Gestão de usuários | Administrador (que entra direto aqui) |

Usuários da demonstração, criados pelo backend (senha de todos: `123456`):

| Nome | E-mail | Perfil |
| --- | --- | --- |
| Gabriela | gabriela@camplana.com.br | Gerente de Vendas |
| Sérgio | sergio@camplana.com.br | Supervisor de Vendas |
| Sílvia | silvia@camplana.com.br | Supervisor de Vendas |
| Ana | ana@camplana.com.br | Administrador |

## 🧪 Testes

```bash
npm run type-check   # tipos (vue-tsc)
npx vitest run       # testes; npm run test:unit roda em modo watch
npm run build        # tipos + build de produção
```

O CI (`.github/workflows/ci.yml`, Node 24) roda os tipos, os testes e o build de produção a cada push e pull request para `main` e `develop`.

> © 2026 - by **💣Code Don't Blow**
