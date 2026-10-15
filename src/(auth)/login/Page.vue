<script setup>
    import Particles from './components/Particles.vue'
    import { ref } from 'vue';

    const showPassword = ref(false)

</script>

<template>
    <Particles profile="clean-flying-points"/>

    <div class="bg-black-bg1 w-250 h-150 flex rounded-lg shadow-2xl border-black-bg2 border">
        <aside class="relative isolate flex-1">
            <Particles profile="clean-flying-points"/>
        </aside>

        <div class="flex flex-col flex-1 p-10 justify-between">
            <div class="flex flex-col gap-10">
                <h1 class="text-header-2">Entre no Camp<b class="text-blue font-bold!">Lana</b> </h1>
                <div class="flex flex-col gap-2">
                    <p class="text-body">Use as credenciais que foram atribuidas a você para entrar no sistema</p>
                    <p class="text-metadata text-gray-txt2-dark">Se você não tiver acesso as suas credenciais, converse com o responsável pelo gerenciamento do sistema CampLana na sua empresa.</p>
                </div>
                <form action="" id="login" class="flex flex-col gap-3">
                    <div class="flex flex-col gap-2">
                        <label for="email" class="text-label">Endereço de email</label>
                        <input type="email" id="email" required placeholder="exemplo@email.com" class="text-body bg-black-bg2 px-3 py-2 rounded focus:outline focus:outline-blue ">
                    </div>
                    <div class="flex flex-col gap-2">
                        <label for="password" class="text-label">Senha</label>
                        <div class="flex">
                            <input :type="[showPassword ? 'text' : 'password']" id="password" required placeholder="Sua senha" class="text-body bg-black-bg2 px-3 py-2 rounded focus:outline focus:outline-blue flex-1">
                            
                            <button type="button" class="px-3 cursor-pointer transition hover:scale-[1.2] active:text-blue active:scale-[0.9]" @click="showPassword = !showPassword">
                                <i class="bi" :class="[showPassword ? 'bi-eye':'bi-eye-slash']"></i>
                            </button>
                        </div>
                        <a href="" class="text-metadata text-blue self-end underline! p-2 hover:text-white-txt1">Esqueci minha senha</a>
                    </div>
                </form>
            </div>

            <button form="login" type="submit" class="bg-blue rounded p-2 text-body self-end w-2/4 hover:cursor-pointer transform transition hover:-translate-y-1 motion-reduce:transition-none motion-reduce:hover:transform-none"> Entrar </button>
        </div>
    </div>

</template>