# Publicação e comissão no período

No chat, complete os parâmetros e simule a campanha. A barra superior usa a descrição da regra como nome e permite abrir o painel de parâmetros ou **Publicar Campanha**. Alterar parâmetros exige uma nova simulação antes da publicação.

O modal permite conferir o resumo e a comissão no período. Cancelar, Escape ou clicar fora fecha o modal. O aviso informa que a submissão compartilhará o histórico do chat.

## Por que a % está assim

A tabela apresenta cada marca/cargo e trecho de datas, comparando a taxa base, a vigente e a taxa com a campanha proposta. **Por quê** abre as campanhas que compõem a taxa vigente, com período, acréscimo, autor, aprovador, data de aprovação e justificativa. Sem campanhas, a Lana deve fornecer vigente igual à base e histórico vazio. O frontend não calcula taxas nem conflitos. Sobreposições aparecem em amarelo e não bloqueiam a submissão.

## Integração pendente

O backend atual não tem endpoint de publicação. O botão Publicar apresenta uma mensagem de indisponibilidade e mantém o modal aberto; não persiste uma submissão nem informa sucesso. Substituir o handler `publicar` de `chat/Page.vue` pela chamada ao endpoint quando seu contrato for definido, controlando erro e estado `publicando` do modal.

`ResultadoSimulacao.comissoes_periodo` e `.conflitos` são extensões opcionais de apresentação propostas em `chat/types.ts`, ainda não produzidas pela Lana. Adaptar o serviço ao contrato definitivo. `undefined` significa não informado; `conflitos: []` significa verificação sem conflitos. Não preencher esses campos a partir dos totais monetários da simulação.

`ResumoCampanha.vue` aceita `campanha` e `compacto`. Está na feature chat e pode ser reutilizado na futura fila de aprovação. Retorno, autor e data de submissão são opcionais: não existem no contrato atual e não são fabricados. O custo incremental alimenta apenas o investimento. A tela de aprovação não foi alterada.

O modal usa `@headlessui/vue` para gerenciamento de foco, Escape, clique externo e semântica acessível. Os componentes seguem as variáveis de cores e fontes do projeto.
