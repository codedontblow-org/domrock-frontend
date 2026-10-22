<script setup lang="ts">
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
  abrirModalNovo,
  abrirModalEditar,
  fecharModal,
  salvar,
  toggleStatus
} = useUsuarios()
</script>

<template>
  <div class="px-32 py-19 w-full mx-auto flex flex-col text-white-txt1 font-raleway">
    
    <h1 class="text-[44px] font-forum tracking-wide pb-7.5">Usuários</h1>

    <div class="flex items-center gap-3 bg-black-bg2 w-fit border-l-2 border-blue px-4 py-3 rounded-r-md">
      <i class="bi bi-exclamation-triangle text-blue"></i>
      <p class="text-[16px] text-white-txt1">Usuários <strong class="font-bold!">nunca são excluídos</strong>: quem é desativado não consegue mais entrar, mas as campanhas e aprovações dele continuam no histórico.</p>
    </div>

    <div class="flex items-center justify-between pt-17.5 pb-7.5">
      <div class="flex items-baseline gap-3">   
        <h2 class="text-[24px] font-medium ">Pessoas com acesso</h2>
        <span class="text-[16px] text-gray-txt2-dark">Quem pode entrar no Camplana e com qual perfil</span>
      </div>
      <button 
        @click="abrirModalNovo"
        class="cursor-pointer bg-blue hover:bg-[#0099db] text-black-bg1 px-4 py-2 rounded flex items-center gap-2 text-[16px] font-medium transition-colors"
      >
        Adicionar usuário
        <span class="bg-white text-blue rounded-sm w-5 h-5 flex items-center justify-center font-bold text-2xl">+</span>
      </button>
    </div>

    <div class="flex flex-col gap-4 w-full">
      <p class="text-[16px]">
        Visualizando {{ totalUsuarios }} usuários - {{ ativosCount }} ativos e {{ desativadosCount }} desativado{{ desativadosCount !== 1 ? 's' : '' }}
      </p>

      <div class="border border-white-txt3 rounded-lg overflow-hidden relative">
        <div v-if="carregando" class="absolute inset-0 bg-black/50 flex justify-center items-center backdrop-blur-sm z-10">
          <span class="text-white">Carregando...</span>
        </div>

        <table class="w-full text-left border-collapse text-sm">
          <thead class="bg-[#E2E8F0] text-gray-txt3-dark font-label">
            <tr>
              <th class="px-6 py-3 font-medium ">Nome</th>
              <th class="px-6 py-3 font-medium">E-mail</th>
              <th class="px-6 py-3 font-medium">Perfil</th>
              <th class="px-6 py-3 font-medium">Situação</th>
              <th class="px-6 py-3 font-medium">Ações</th>
            </tr>
          </thead>
          
          <tbody class="divide-y divide-gray-txt3 bg-black-bg2">
            <tr 
              v-for="u in usuariosOrdenados" 
              :key="u.id"
              class="transition-colors hover:bg-black-bg2/30 group"
              :class="{ 'text-gray-txt2-dark': !u.ativo }"
            >
              <td class="px-6 py-4 text-[16px]">
                {{ u.nome }}
                <span v-if="u.email === emailLogado" class="text-xs opacity-50 ml-1">(você)</span>
              </td>
              <td class="px-6 py-4 text-[16px] text-gray-txt2 font-label">{{ u.email }}</td>
              <td class="px-6 py-4">
                {{ u.perfil === 'ADMIN' ? 'Administrador' : u.perfil === 'GERENTE' ? 'Gerente de Vendas' : 'Supervisor de Vendas' }}
              </td>
              <td class="px-6 py-4 flex items-center gap-2 font-label text-gray-txt2">
                <span 
                  class="w-2 h-2 rounded-full"
                  :class="u.ativo ? 'bg-[#38A169]' : 'bg-gray-500'"
                ></span>
                {{ u.ativo ? 'Ativo' : 'Desativado' }}
              </td>
              <td class="px-6 py-4">
                <div class="flex gap-2">
                  <!-- Botão Editar -->
                  <button 
                    @click="abrirModalEditar(u)"
                    class="bg-[#ED8936] hover:bg-[#DD6B20] text-white p-1.5 rounded transition-colors"
                    title="Editar usuário"
                  >
                    <i class="bi bi-pencil-square"></i>
                  </button>
                  
                  <div class="relative flex items-center">
                    <button 
                      @click="toggleStatus(u)"
                      :disabled="u.email === emailLogado"
                      class="p-1.5 rounded text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      :class="u.ativo ? 'bg-[#E53E3E] hover:bg-[#C53030]' : 'bg-[#38A169] hover:bg-[#2F855A]'"
                    >
                      <i class="bi" :class="u.ativo ? 'bi-person-x-fill' : 'bi-person-check-fill'"></i>
                    </button>

    
                    <div 
                      v-if="u.email === emailLogado"
                      class="absolute right-0 translate-x-[110%] hidden group-hover:block bg-black text-xs text-white p-2 rounded whitespace-nowrap z-20 border border-[var(--color-black-bg2)]"
                    >
                      Você não pode desativar a si mesmo
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="showModal" class="fixed inset-0 bg-black/70 flex justify-center items-center z-50 p-4 backdrop-blur-sm" @click.self="fecharModal">
      <div class="bg-[var(--color-black-bg1)] border border-[var(--color-black-bg2)] p-6 rounded-lg w-full max-w-md shadow-2xl flex flex-col gap-4">
        <h3 class="text-xl font-medium text-[var(--color-white-txt1)]">
          {{ isEditing ? 'Editar Usuário' : 'Novo Usuário' }}
        </h3>
        
        <form @submit.prevent="salvar" class="flex flex-col gap-4">
          <div v-if="errorMessage" class="bg-red-500/10 border-l-4 border-red-500 text-red-500 p-3 rounded text-sm flex items-center gap-2">
            <i class="bi bi-exclamation-circle-fill"></i> {{ errorMessage }}
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-sm text-[var(--color-gray-txt2-dark)]">Nome</label>
            <input v-model="formData.nome" type="text" required class="bg-[var(--color-black-bg2)] text-white px-3 py-2 rounded focus:outline-none focus:ring-1 focus:ring-[#00B2FF]" />
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-sm text-[var(--color-gray-txt2-dark)]">E-mail</label>
            <input v-model="formData.email" type="email" required class="bg-[var(--color-black-bg2)] text-white px-3 py-2 rounded focus:outline-none focus:ring-1 focus:ring-[#00B2FF]" :class="{ 'ring-1 ring-red-500': !isEmailValid && formData.email }" />
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-sm text-[var(--color-gray-txt2-dark)]">Perfil</label>
            <select v-model="formData.perfil" required class="bg-[var(--color-black-bg2)] text-white px-3 py-2 rounded focus:outline-none focus:ring-1 focus:ring-[#00B2FF] appearance-none">
              <option value="" disabled>Selecione um perfil</option>
              <option value="GERENTE">Gerente de Vendas</option>
              <option value="SUPERVISOR">Supervisor de Vendas</option>
              <option value="ADMIN">Administrador</option>
            </select>
          </div>

          <div class="flex flex-col gap-1" v-if="!isEditing">
            <label class="text-sm text-[var(--color-gray-txt2-dark)]">Senha Inicial</label>
            <input v-model="formData.senha" type="password" minlength="8" required placeholder="Mínimo 8 caracteres" class="bg-[var(--color-black-bg2)] text-white px-3 py-2 rounded focus:outline-none focus:ring-1 focus:ring-[#00B2FF]" />
          </div>

          <div class="flex justify-end gap-3 mt-4">
            <button type="button" @click="fecharModal" class="px-4 py-2 rounded text-sm text-[var(--color-gray-txt2-dark)] hover:text-white transition-colors">
              Cancelar
            </button>
            <button type="submit" :disabled="!isFormValid || isSaving" class="bg-[#00B2FF] hover:bg-[#0099db] text-white px-4 py-2 rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {{ isSaving ? 'Salvando...' : 'Salvar' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>