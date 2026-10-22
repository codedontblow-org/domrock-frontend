<script setup lang="ts">
import { ref } from 'vue'
import { useUsuarios } from './useUsuarios'

const {
  emailLogado,
  usuariosOrdenados,
  totalUsuarios,
  ativosCount,
  desativadosCount,
  carregando,
  showModal,
  isEditing,
  errorMessage,
  isSaving,
  formData,
  isEmailValid,
  isFormValid,
  paginaAtual,
  totalPaginas,
  showConfirmModal,
  usuarioParaAlterar,
  isToggling,
  abrirModalNovo,
  abrirModalEditar,
  fecharModal,
  salvar,
  abrirModalConfirmacao,
  fecharModalConfirmacao,
  confirmarToggleStatus,
  proximaPagina,
  paginaAnterior
} = useUsuarios()

const isPerfilOpen = ref(false)

const perfisDisponiveis = [
  { valor: 'GERENTE', rotulo: 'Gerente' },
  { valor: 'SUPERVISOR', rotulo: 'Supervisor' },
  { valor: 'ADMIN', rotulo: 'Administrador' }
]

function selecionarPerfil(valor: string) {
  formData.value.perfil = valor as any
  isPerfilOpen.value = false
}
</script>

<template>
  <div class="px-4 lg:px-32 py-10 lg:py-20 w-full mx-auto flex flex-col text-white-txt1 font-raleway">
    
    <h1 class="text-[44px] font-forum tracking-wide pb-7.5">Usuários</h1>

    <div class="flex items-center gap-3 bg-black-bg2 w-fit border-l-2 border-blue px-4 py-3 rounded-r-md">
      <i class="bi bi-exclamation-triangle text-blue"></i>
      <p class="text-[16px] text-white-txt1">Usuários <strong class="font-bold!">nunca são excluídos</strong>: quem é desativado não consegue mais entrar, mas as campanhas e aprovações dele continuam no histórico.</p>
    </div>

    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-17.5 pb-7.5">
      <div class="flex flex-col md:flex-row md:items-baseline gap-1 md:gap-3">   
        <h2 class="text-[24px] font-medium whitespace-nowrap">Pessoas com acesso</h2>
        <span class="text-[16px] text-gray-txt2-dark">Quem pode entrar no Camplana e com qual perfil</span>
      </div>
      <button 
        @click="abrirModalNovo"
        class="cursor-pointer bg-blue hover:bg-[#0099db] text-black-bg1 px-4 py-2 rounded flex items-center justify-center gap-2 text-[16px] font-medium transition-colors w-full md:w-auto"
      >
        Adicionar usuário
        <span class="bg-white text-blue rounded-sm w-5 h-5 flex items-center justify-center font-bold text-2xl">+</span>
      </button>
    </div>

    <div class="flex flex-col gap-4 w-full">
      <p class="text-[16px]">
        Visualizando {{ totalUsuarios }} usuários - {{ ativosCount }} ativos e {{ desativadosCount }} desativado{{ desativadosCount !== 1 ? 's' : '' }}
      </p>

      <div class="border border-white-txt3 rounded-lg overflow-x-auto overscroll-x-none relative shadow-lg">
        <div v-if="carregando" class="absolute inset-0 bg-black/50 flex justify-center items-center backdrop-blur-sm z-10 cursor-wait">
          <span class="text-white-txt1">Carregando...</span>
        </div>

        <table class="w-full text-left border-collapse text-sm min-w-[800px]">
          <thead class="bg-white-txt1 text-gray-txt3-dark font-label">
            <tr>
              <th class="px-6 py-4 font-medium">Nome</th>
              <th class="px-6 py-4 font-medium">E-mail</th>
              <th class="px-6 py-4 font-medium">Perfil</th>
              <th class="px-6 py-4 font-medium">Situação</th>
              <th class="px-6 py-4 font-medium text-right pr-10">Ações</th>
            </tr>
          </thead>
          
          <tbody class="divide-y divide-gray-txt3 bg-black-bg2">
            <tr 
              v-for="u in usuariosOrdenados" 
              :key="u.id"
              class="transition-colors hover:bg-white/5 group"
              :class="{ 'text-gray-txt2-dark': !u.ativo }"
            >
              <td class="px-6 py-4 text-[16px]">
                {{ u.nome }}
                <span v-if="u.email === emailLogado" class="text-xs opacity-50 ml-1">(você)</span>
              </td>
              <td class="px-6 py-4 text-[16px] text-gray-txt2 font-label">{{ u.email }}</td>
              <td class="px-6 py-4 text-[16px]">
                {{ u.perfil === 'ADMIN' ? 'Administrador' : u.perfil === 'GERENTE' ? 'Gerente' : 'Supervisor' }}
              </td>
              <td class="px-6 py-4 font-label text-gray-txt2">
                <div class="flex items-center gap-2 h-full">
                  <span 
                    class="w-2 h-2 rounded-full"
                    :class="u.ativo ? 'bg-green' : 'bg-gray-txt3'"
                  ></span>
                  {{ u.ativo ? 'Ativo' : 'Desativado' }}
                </div>
              </td>
              <td class="px-6 py-4">
                <div class="flex gap-3 justify-end pr-4">
                  
                  <button 
                    @click="abrirModalEditar(u)"
                    class="cursor-pointer bg-orange hover:bg-[#DD6B20] text-white-txt1 w-7 h-7 flex items-center justify-center rounded-md transition-colors text-[16px]"
                    title="Editar usuário"
                  >
                    <i class="bi bi-pencil-fill"></i>
                  </button>
                  
                  <div class="relative flex items-center justify-center group/status">
                    <button 
                      @click="abrirModalConfirmacao(u)"
                      :disabled="u.email === emailLogado"
                      class="cursor-pointer w-7 h-7 flex items-center justify-center rounded-md text-white-txt1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-[16px]"
                      :class="u.ativo ? 'bg-red hover:bg-[#C53030]' : 'bg-green hover:bg-[#2F855A]'"
                    >
                      <i class="bi" :class="u.ativo ? 'bi-person-dash-fill' : 'bi-person-check-fill'"></i>
                    </button>

                    <div 
                      v-if="u.email === emailLogado"
                      class="absolute right-[calc(100%+12px)] top-1/2 -translate-y-1/2 hidden group-hover/status:block bg-black-txt1 border border-gray-txt2 text-xs text-white-txt1 px-3 py-2 rounded whitespace-nowrap z-50 shadow-xl"
                    >
                      Você não pode desativar a si mesmo
                      <div class="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-gray-txt2"></div>
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div class="bg-black-bg2 flex items-center justify-between px-6 py-4 border-t border-gray-txt3">
          <span class="text-[14px] text-gray-txt2-dark">
            Página {{ totalPaginas === 0 ? 0 : paginaAtual + 1 }} de {{ totalPaginas }}
          </span>
          <div class="flex gap-2">
            <button 
              @click="paginaAnterior"
              :disabled="paginaAtual === 0"
              class="cursor-pointer bg-black-bg1 border border-gray-txt3 text-white-txt1 px-3 py-1.5 rounded transition-colors hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 text-[14px]"
            >
              <i class="bi bi-chevron-left"></i> Anterior
            </button>
            <button 
              @click="proximaPagina"
              :disabled="paginaAtual >= totalPaginas - 1"
              class="cursor-pointer bg-black-bg1 border border-gray-txt3 text-white-txt1 px-3 py-1.5 rounded transition-colors hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 text-[14px]"
            >
              Próxima <i class="bi bi-chevron-right"></i>
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showModal" class="fixed inset-0 bg-black/70 flex justify-center items-center z-50 p-4 backdrop-blur-sm">
      <div class="absolute inset-0 z-0" @click="fecharModal"></div>
      
      <div class="bg-black-bg1 border border-black-bg2 p-8 rounded-lg w-full max-w-md shadow-2xl flex flex-col gap-5 z-10 relative">
        <h3 class="text-[24px] font-medium text-white-txt1 font-forum tracking-wide">
          {{ isEditing ? 'Editar Usuário' : 'Novo Usuário' }}
        </h3>
        
        <form @submit.prevent="salvar" class="flex flex-col gap-4 relative">
          <div v-if="errorMessage" class="bg-red/10 border-l-4 border-red text-red p-3 rounded text-sm flex items-center gap-2 font-label">
            <i class="bi bi-exclamation-circle-fill"></i> {{ errorMessage }}
          </div>

          <div class="flex flex-col gap-1.5">
            <label class="text-[14px] text-gray-txt2-dark font-label">Nome</label>
            <input v-model="formData.nome" type="text" required class="bg-black-bg2 text-white-txt1 px-3 py-2.5 rounded focus:outline-none focus:ring-1 focus:ring-blue transition-all" />
          </div>

          <div class="flex flex-col gap-1.5">
            <label class="text-[14px] text-gray-txt2-dark font-label">E-mail</label>
            <input v-model="formData.email" type="email" required class="bg-black-bg2 text-white-txt1 px-3 py-2.5 rounded focus:outline-none focus:ring-1 transition-all" :class="!isEmailValid && formData.email !== '' ? 'focus:ring-red ring-1 ring-red' : 'focus:ring-blue'" />
          </div>

          <div class="flex flex-col gap-1.5 relative">
            <label class="text-[14px] text-gray-txt2-dark font-label">Perfil</label>
            <div v-if="isPerfilOpen" @click="isPerfilOpen = false" class="fixed inset-0 z-40"></div>
            <button 
              type="button"
              @click="isPerfilOpen = !isPerfilOpen"
              class="w-full bg-black-bg2 px-3 py-2.5 rounded focus:outline-none focus:ring-1 focus:ring-blue transition-all flex justify-between items-center z-50 relative border border-transparent cursor-pointer"
              :class="isPerfilOpen ? 'ring-1 ring-blue' : ''"
            >
              <span :class="formData.perfil === '' ? 'text-gray-txt2-dark' : 'text-white-txt1'">
                {{ formData.perfil === '' ? 'Selecione um perfil' : perfisDisponiveis.find(p => p.valor === formData.perfil)?.rotulo }}
              </span>
              <i class="bi bi-chevron-down text-gray-txt2-dark transition-transform duration-200" :class="isPerfilOpen ? 'rotate-180' : ''"></i>
            </button>

            <ul 
              v-if="isPerfilOpen"
              class="absolute top-[100%] left-0 w-full mt-2 bg-black-bg1 border border-black-bg2 rounded shadow-2xl z-50 overflow-hidden flex flex-col py-1"
            >
              <li 
                v-for="p in perfisDisponiveis" 
                :key="p.valor"
                @click="selecionarPerfil(p.valor)"
                class="px-4 py-3 cursor-pointer hover:bg-black-bg2 transition-colors text-white-txt1 text-[14px] flex items-center gap-2"
                :class="formData.perfil === p.valor ? 'text-blue font-medium' : ''"
              >
                <span class="w-1.5 h-1.5 rounded-full" :class="formData.perfil === p.valor ? 'bg-blue' : 'bg-transparent'"></span>
                {{ p.rotulo }}
              </li>
            </ul>
          </div>

          <div class="flex flex-col gap-1.5" v-if="!isEditing">
            <label class="text-[14px] text-gray-txt2-dark font-label">Senha Inicial</label>
            <input v-model="formData.senha" type="password" minlength="8" required placeholder="Mínimo 8 caracteres" class="bg-black-bg2 text-white-txt1 px-3 py-2.5 rounded focus:outline-none focus:ring-1 focus:ring-blue transition-all placeholder:text-gray-txt2-dark" />
          </div>

          <div class="flex justify-end gap-3 mt-4 pt-4 border-t border-black-bg2">
            <button type="button" @click="fecharModal" class="cursor-pointer px-4 py-2 rounded text-[16px] text-gray-txt2-dark hover:text-white-txt1 transition-colors relative z-10">
              Cancelar
            </button>
            <button type="submit" :disabled="!isFormValid || isSaving" class="cursor-pointer bg-blue hover:bg-[#0099db] text-black-bg1 px-6 py-2 rounded text-[16px] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed relative z-10">
              {{ isSaving ? 'Salvando...' : 'Salvar' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <div v-if="showConfirmModal && usuarioParaAlterar" class="fixed inset-0 bg-black/70 flex justify-center items-center z-50 p-4 backdrop-blur-sm">
      <div class="absolute inset-0 z-0" @click="fecharModalConfirmacao"></div>
      
      <div class="bg-black-bg1 border border-black-bg2 p-8 rounded-lg w-full max-w-sm shadow-2xl flex flex-col gap-4 z-10 relative text-center">
        <div 
          class="w-16 h-16 rounded-full mx-auto flex items-center justify-center text-3xl mb-2 self-center"
          :class="usuarioParaAlterar.ativo ? 'bg-red/10 text-red' : 'bg-green/10 text-green'"
        >
          <i class="bi" :class="usuarioParaAlterar.ativo ? 'bi-person-dash-fill' : 'bi-person-check-fill'"></i>
        </div>
        
        <h3 class="text-[20px] font-medium text-white-txt1 font-forum tracking-wide">
          {{ usuarioParaAlterar.ativo ? 'Desativar usuário?' : 'Reativar usuário?' }}
        </h3>
        
        <p class="text-[14px] text-gray-txt2-dark font-label">
          Tem certeza que deseja {{ usuarioParaAlterar.ativo ? 'desativar' : 'reativar' }} o acesso de <strong class="text-white-txt1 font-medium">{{ usuarioParaAlterar.nome }}</strong>?
        </p>

        <div class="flex justify-center gap-3 mt-4">
          <button type="button" @click="fecharModalConfirmacao" class="cursor-pointer px-4 py-2 rounded text-[16px] text-gray-txt2-dark hover:text-white-txt1 transition-colors">
            Cancelar
          </button>
          <button 
            type="button" 
            @click="confirmarToggleStatus" 
            :disabled="isToggling" 
            class="cursor-pointer px-6 py-2 rounded text-[16px] font-medium transition-colors text-white-txt1 disabled:opacity-50 disabled:cursor-not-allowed"
            :class="usuarioParaAlterar.ativo ? 'bg-red hover:bg-[#C53030]' : 'bg-green hover:bg-[#2F855A]'"
          >
            {{ isToggling ? 'Aguarde...' : 'Confirmar' }}
          </button>
        </div>
      </div>
    </div>

  </div>
</template>