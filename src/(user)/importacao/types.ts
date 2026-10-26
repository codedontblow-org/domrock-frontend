// Formatos do contrato 7 (importação da base do mês, A6-78). Campos em snake_case, como o backend manda.

/** PROCESSANDO em andamento; CONCLUIDO gravado; PENDENTE com impeditivo, nada gravado; FALHA erro inesperado. */
export type SituacaoJob = 'PROCESSANDO' | 'CONCLUIDO' | 'PENDENTE' | 'FALHA'

export type Severidade = 'IMPEDITIVO' | 'AVISO'

export interface PendenciaImportacao {
  /** Nome da planilha, "Cruzamento" ou "SISTEMA" (job em FALHA). */
  origem: string
  /** 0 quando a pendência é do arquivo todo. */
  linha: number | null
  campo: string
  motivo: string
  severidade: Severidade
}

/** Linha do histórico (`GET /api/importacao`). */
export interface EnvioImportacao {
  id: number
  status: SituacaoJob
  /** "2025-10"; null enquanto processa e quando o job falha antes de ler o mês. */
  competencia: string | null
  usuario: string | null
  total_linhas: number
  linhas_importadas: number
  criada_em: string
  concluida_em: string | null
}

/** Job com o relatório (`GET /api/importacao/{id}`). */
export interface JobImportacao extends EnvioImportacao {
  /** Linhas gravadas por planilha: { RH, VENDAS, COMISSAO }; vazio enquanto não conclui. */
  totais: Record<string, number> | null
  pendencias: PendenciaImportacao[] | null
}

/** Resposta 202 do `POST /api/importacao`. */
export interface JobCriado {
  id: number
  status: SituacaoJob
}
