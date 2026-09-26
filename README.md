# Repositório Front-end Web DomRock

O desafio consiste no desenvolvimento de um sistema para gerenciamento de regras de negócio. Este repositório tem como objetivo alocar o front-end da aplicação web.

Leia mais em [Repositório Principal](https://github.com/codedontblow-org/domrock-camplana)!


## 📂 **Estrutura do Projeto**

```
domrock-frontend/
│
├── public/                              # Arquivos estáticos
│   └── ...
│
├── src/                                 # Código-fonte principal
│   │
│   ├── assets/                          # Imagens, ícones, estilos globais
│   │   
│   ├── components/                      # Componentes reutilizáveis
│   │     
│   ├── App.vue                           # Componente raiz
│   └── main.ts                           # Ponto de entrada da aplicação
│
├── .gitignore
├── eslint.config.js                      # Configuração do ESLint
├── LICENSE
├── package-lock.json
├── package.json
├── README.md
├── vite.config.ts                        # Configuração do Vite
└── tsconfig.json                         # Configuração do TypeScript
```
---

## ⚙️ Tecnologias Utilizadas:

![Vue.js](https://img.shields.io/badge/Vue.js-42B883?style=for-the-badge&logo=vue.js&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwind-css&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)

## ❓Como Executar:

```bash
npm install
npm run dev
```

## Requisições ao backend (Axios)

O cliente compartilhado está em `src/services/api.ts`. Ele utiliza a URL definida em
`VITE_API_BASE_URL` (padrão: `/backend`) e um timeout de 30 segundos.

Para personalizar o ambiente local:

```bash
cp .env.example .env.local
```

Com o backend em execução na porta 8080, `npm run dev` encaminha as chamadas com
prefixo `/backend` para `http://localhost:8080`, removendo somente esse prefixo.
Assim, `/backend/usuario` chega ao backend como `/usuario`, e
`/backend/api/importacao` chega como `/api/importacao`. O navegador usa a mesma
origem do frontend durante o desenvolvimento. Para outro endereço do backend,
ajuste `API_PROXY_TARGET` e reinicie o Vite.

Exemplo de consulta paginada ao endpoint existente:

```ts
import { api } from '@/services/api'

const { data } = await api.get('/usuario', {
  params: { page: 0, size: 20 },
})
```

Para importar planilhas, o backend espera `FormData` com o campo repetido `arquivos`:

```ts
const formData = new FormData()
for (const arquivo of arquivosSelecionados) {
  formData.append('arquivos', arquivo)
}

const { data } = await api.post('/api/importacao', formData, { timeout: 120000 })
```

O `Content-Type` não é fixado no cliente: o Axios trata JSON e o navegador define
o delimitador de uploads multipart. O timeout pode ser ajustado por requisição.
Erros HTTP, de rede e timeout continuam rejeitando a Promise; o consumidor deve
tratá-los com `try/catch`. Para erros Axios, `axios.isAxiosError(erro)` permite
consultar `erro.response?.status` e `erro.response?.data`, incluindo mensagens
retornadas pelo backend. O cliente não inicia chamadas automaticamente.

No deploy, o servidor que hospeda o frontend precisa encaminhar `/backend` ao
backend e remover o prefixo, ou o build deve receber uma `VITE_API_BASE_URL`
absoluta com CORS autorizado pelo backend. O proxy de desenvolvimento não faz
parte dos arquivos estáticos gerados. Variáveis `VITE_*` ficam públicas no build
e não devem conter credenciais.

Referências: [instâncias Axios](https://axios-http.com/docs/instance) e
[proxy do Vite](https://vite.dev/config/server-options#server-proxy).

> © 2026 - by **💣Code Don't Blow**
