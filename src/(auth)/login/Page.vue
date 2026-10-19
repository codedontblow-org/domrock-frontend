<script setup lang="ts">
    import Particles from './components/Particles.vue'
    import { ref, computed, nextTick } from 'vue'
    import { isAxiosError } from 'axios'
    import { router } from '@/router/index'
    import { login } from '@/services/auth.ts'

    // AUTH
    // ==============================
    const email = ref('')
    const senha = ref('')
    const erro = ref('')
    const isLoading = ref(false)

    const submeterLogin = async () => {
        erro.value = ''
        
        if(email.value === '' || senha.value === '') {
            dispararErro('Preencha todos os campos!')
            return
        }
        
        isLoading.value = true
        try {
            await login(email.value, senha.value)
            await router.push('/')
        }
        catch (error) {
            const status = isAxiosError(error) ? error.response?.status : undefined
            if(status === 401) {
                await nextTick()
                dispararErro('Email ou senha inválidos! Tente novamente.')
            }
            else
            if (status === 400) {
                await nextTick()
                dispararErro('Algo parece errado com os dados informados!')
            }
            else {
                await nextTick()
                dispararErro('Não foi possível se conectar ao servidor nesse momento! Você pode tentar novamente mais tarde.')
                console.error('Erro não identificado durante o login:', error)
            }
        }
        finally {
            isLoading.value = false
        }
    }
    
    // INTERFACE
    // ==============================
    const showPassword = ref(false)

    // Definir o pageColor como o tema salvo no localStorage e usar isso somente como fallback caso não tenha tema salvo
    const colorPalette = ['red', 'orange', 'green', 'blue', 'purple']
    const randomColor = colorPalette[Math.floor(Math.random() * colorPalette.length)]
    const pageColor = ref(randomColor)

    const pageTheme = computed(() => ({
        '--color': `var(--color-${pageColor.value})`,
    }))

    const particleProfiles = ["ring", "grid"]
    const profile = particleProfiles[Math.floor(Math.random() * particleProfiles.length)]

    const dispararErro = async (mensagem: string) => {
        await nextTick()
        erro.value = mensagem        
    }

</script>

<template> 
    <Particles profile="clean-flying-points" :config="{colorA: pageColor, colorB: pageColor}" />

    <div 
        id="container"
        :style="pageTheme" 
        class="bg-black-bg1 w-250 h-150 flex rounded-2xl shadow-2xl border-black-bg2 border transition-colors duration-[5000ms] ease-out"
    >
        <aside class="relative isolate flex-1 rounded-l-2xl border-r border-black-bg2">
            <Particles :profile="profile" :config="{colorA: pageColor, colorB:pageColor}"/>
        </aside>

        <div :style="pageTheme" class="flex flex-col flex-1 p-10 justify-between">
            <div class="flex flex-col gap-10">
                <h1 class="text-header-2">
                    Entre no Camp<b class="text-[var(--color)] font-bold!">Lana</b>
                </h1>

                <div class="flex flex-col gap-3">
                    <p class="text-body">Use as credenciais que foram atribuidas a você para entrar no sistema!</p>
                    <p class="text-metadata text-gray-txt2-dark">Se você não tiver acesso as suas credenciais, converse com o responsável pelo gerenciamento do sistema CampLana na sua empresa.</p>
                </div>
                <form action="" id="login" class="flex flex-col gap-3" @submit.prevent="submeterLogin">
                    <div class="flex flex-col gap-2">
                        <label for="email" class="text-label">Endereço de email</label>
                        <input type="email" v-model="email" id="email" placeholder="exemplo@email.com" class="text-body bg-black-bg2 px-3 py-2 rounded focus:outline focus:outline-[var(--color)] ">
                    </div>
                    <div class="flex flex-col gap-2">
                        <label for="password" class="text-label">Senha</label>

                        <div class="flex bg-black-bg2 px-3 py-2 pr-0 rounded has-[input:focus]:outline has-[input:focus]:outline-[var(--color)] transition-colors ease-out has-[button:active]:text-[var(--color)]">
                            <input :type="showPassword ? 'text' : 'password'" v-model="senha" id="password" placeholder="Sua senha" class="outline-none flex-1 text-body">
                            
                            <button type="button" class="px-3 cursor-pointer transition ease-out rounded-r hover:scale-[1.15] active:text-[var(--color)] active:scale-[0.9]" @click="showPassword = !showPassword">
                                <i class="bi" :class="[showPassword ? 'bi-eye':'bi-eye-slash']"></i>
                            </button>
                        </div>
                        <a href="" class="text-metadata text-[var(--color)] self-end underline! p-2 hover:text-white-txt1">Esqueci minha senha</a>

                        <div v-if="erro != ''" class="flex items-center gap-3 bg-black-bg2 px-4 py-1 rounded border-l-3 border-red" :class="erro != '' && 'animate-[shake_ease-out_250ms]'">
                            <i class="bi bi-exclamation-triangle-fill text-red"></i>
                            <p class="text-red text-label"> {{ erro }} </p>
                        </div>
                    </div>
                </form>
            </div>

            <button 
                form="login" 
                type="submit" 
                :disabled="isLoading" 
                class="bg-[var(--color)] rounded p-2 text-body self-end w-2/4 hover:cursor-pointer transform transition hover:-translate-y-1 motion-reduce:transition-none motion-reduce:hover:transform-none" 
                :class="{
                    'bg-black-bg2 cursor-wait transform-none! translate-y-none!' : isLoading
                }"> 
                    {{
                        isLoading
                        ? 'Entrando'
                        : 'Entrar'
                    }}
                </button>
        </div>
    </div>

</template>