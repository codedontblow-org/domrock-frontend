import { describe, expect, it } from 'vitest'
import {
  alertaDoEnvio, contagemPorFiltro, filtrarPendencias, filtroInicial, metaDoEnvio, numerosDoResultado, textoDaLinha,
  tituloDoEnvio,
} from '../relatorio'
import { job, pendencia } from './fakes'

const SAO_PAULO = 'America/Sao_Paulo'
const impeditivo = pendencia('IMPEDITIVO', 'Funcionário sem loja informada', 214)
const aviso = pendencia('AVISO', 'matrícula sem vendas no mês')

describe('relatório de pendências', () => {
  it('conta por severidade para os filtros Todas, Impeditivo e Aviso', () => {
    expect(contagemPorFiltro([impeditivo, aviso, aviso])).toEqual({ TODAS: 3, IMPEDITIVO: 1, AVISO: 2 })
  })

  it('abre no filtro Impeditivo quando há impeditivo; senão em Todas', () => {
    expect(filtroInicial([aviso, impeditivo])).toBe('IMPEDITIVO')
    expect(filtroInicial([aviso])).toBe('TODAS')
  })

  it('filtra pela severidade escolhida', () => {
    expect(filtrarPendencias([impeditivo, aviso], 'AVISO')).toEqual([aviso])
    expect(filtrarPendencias([impeditivo, aviso], 'TODAS')).toEqual([impeditivo, aviso])
  })

  it('linha 0 é do arquivo todo e aparece como traço', () => {
    expect(textoDaLinha(0)).toBe('—')
    expect(textoDaLinha(null)).toBe('—')
    expect(textoDaLinha(3491)).toBe('3491')
  })
})

describe('cabeçalho e resultado do envio', () => {
  it('título pelo mês, ou pelo número do envio quando o mês não foi lido', () => {
    expect(tituloDoEnvio(job(6, 'CONCLUIDO'))).toBe('Envio de out/2025')
    expect(tituloDoEnvio(job(6, 'FALHA', { competencia: null }))).toBe('Envio nº 6')
  })

  it.each([
    ['CONCLUIDO', 'Enviado por Sérgio em 20/10/2026 às 01:38 · concluído às 01:39'],
    ['PENDENTE', 'Enviado por Sérgio em 20/10/2026 às 01:38 · analisado às 01:39'],
    ['FALHA', 'Enviado por Sérgio em 20/10/2026 às 01:38 · interrompido às 01:39'],
    ['PROCESSANDO', 'Enviado por Sérgio em 20/10/2026 às 01:38'],
  ] as const)('%s: %s', (status, meta) => {
    expect(metaDoEnvio(job(6, status), SAO_PAULO)).toBe(meta)
  })

  it('alerta vermelho só quando nada foi gravado', () => {
    expect(alertaDoEnvio('PENDENTE')).toBe('Planilha com pendências: corrija e envie novamente. Nada foi gravado.')
    expect(alertaDoEnvio('FALHA')).toBe('A importação falhou e nada foi gravado. Veja o motivo abaixo e envie de novo.')
    expect(alertaDoEnvio('CONCLUIDO')).toBeNull()
  })

  it('números: lidas e gravadas sempre; RH, Vendas e Comissão só quando gravou', () => {
    expect(numerosDoResultado(job(6, 'CONCLUIDO'))).toEqual([
      { rotulo: 'Linhas lidas', valor: '5.469' },
      { rotulo: 'Linhas gravadas', valor: '5.467' },
      { rotulo: 'RH', valor: '469' },
      { rotulo: 'Vendas', valor: '4.998' },
      { rotulo: 'Comissão', valor: '0' },
    ])
    expect(numerosDoResultado(job(6, 'PENDENTE'))).toEqual([
      { rotulo: 'Linhas lidas', valor: '5.469' },
      { rotulo: 'Linhas gravadas', valor: '0' },
    ])
  })
})
