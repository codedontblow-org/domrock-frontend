// Nomes curtos para a interface. O catálogo da Lana traz rótulos longos em caixa-alta
// ("VENDEDOR BALCAO", "PRETO (10)"), que ocupam muito espaço no painel e no resultado.

export const NOMES_MARCA: Record<string, string> = {
  ALL: 'Todas',
  '10': 'Preto', '20': 'Branco', '30': 'Azul', '40': 'Vermelho', '50': 'Amarelo', '60': 'Cinza',
}

export const NOMES_CARGO: Record<string, string> = {
  '100': 'Vendedor loja', '150': 'Gerente', '200': 'Vendedor balcão', '300': 'Assistente de vendas',
}

export const ROTULOS_CURTOS_PARAMETRO: Record<string, string> = {
  periodo: 'Período',
  pct_acrescimo: 'Acréscimo',
  marcas_alvo: 'Marcas',
  cargos_alvo: 'Cargos',
  meta_vendas: 'Meta de vendas',
  orcamento_limite: 'Orçamento',
}

const NOMES_OPCAO: Record<string, Record<string, string>> = {
  marcas_alvo: NOMES_MARCA,
  cargos_alvo: NOMES_CARGO,
}

/** Ex.: nomeDaOpcao('cargos_alvo', '200', 'VENDEDOR BALCAO') -> 'Vendedor balcão' */
export function nomeDaOpcao(key: string, id: string, rotuloOriginal: string): string {
  return NOMES_OPCAO[key]?.[id] ?? rotuloOriginal
}
