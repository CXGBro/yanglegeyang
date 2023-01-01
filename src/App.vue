<template>
  <div class="gamePage">
    <button @click="playMusicHandler">{{isPlay?"关闭":"开启"}}背景音乐</button>
    <audio autoplay muted loop ref="audio">
      <source src="./assets/backgroundMusic.mp3" type="audio/mp3">
    </audio>
    <game />
  </div>
</template>
<script setup>
import { ref } from 'vue';
import game from './components/game.vue';
const isPlay = ref(false);
const audio = ref(null);
const playMusicHandler = () => {
  audio.value.muted = !audio.value.muted;
  audio.value.play();
  isPlay.value = !isPlay.value;
}

</script>
<style scoped>
.gamePage {
  background: url(./assets/background.jpg);
  height: 100%;
}
</style>