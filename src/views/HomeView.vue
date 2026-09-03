<template>
  <div class="home">
    <h1>首页</h1>
    <p>欢迎使用 Vite + Vue 3 项目！</p>
    <Counter />
    <TodoList />
  </div>
</template>

<script setup>
import Counter from '../components/Counter.vue'
import TodoList from '../components/TodoList.vue'
</script>

<style scoped>
.home {
  max-width: 800px;
  margin: 0 auto;
}
</style>
