<template>
  <div class="gamePage">
    <audio autoplay loop id="audio">
      <source src="../public/backgroundMusic.mp3">
    </audio>
    <game />
  </div>
</template>
<script setup>
import { ref } from 'vue';
import game from './components/game.vue';
const audio = ref(null);
</script>
<style scoped>
.gamePage {
  background: url(/background.jpg);
  height: 100%;
}
</style>