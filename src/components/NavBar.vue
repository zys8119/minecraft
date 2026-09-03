<script setup>
import { useRoute } from 'vue-router'

const route = useRoute()
</script>

<template>
  <nav class="navbar">
    <div class="nav-brand">
      <img src="/vite.svg" alt="Vite" class="nav-logo" />
      <span>Vue 3 项目</span>
    </div>
    <ul class="nav-links">
      <li>
        <router-link to="/" :class="{ active: route.path === '/' }">首页</router-link>
      </li>
      <li>
        <router-link to="/about" :class="{ active: route.path === '/about' }">关于</router-link>
      </li>
      <li>
        <router-link to="/minecraft" :class="{ active: route.path === '/minecraft' }">我的世界</router-link>
      </li>
      <li>
        <router-link to="/login" :class="{ active: route.path === '/login' }">登录</router-link>
      </li>
    </ul>
  </nav>
</template>

<style scoped>
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background: rgba(36, 36, 36, 0.8);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid #333;
  margin-bottom: 2rem;
}
.nav-brand {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: bold;
  font-size: 1.2rem;
}
.nav-logo {
  height: 30px;
  width: 30px;
}
.nav-links {
  display: flex;
  list-style: none;
  gap: 1.5rem;
  margin: 0;
  padding: 0;
}
.nav-links a {
  color: #888;
  text-decoration: none;
  transition: color 0.3s;
  padding: 0.3rem 0.6rem;
  border-radius: 4px;
}
.nav-links a:hover {
  color: #fff;
}
.nav-links a.active {
  color: #42b883;
  background: rgba(66, 184, 131, 0.15);
}
@media (prefers-color-scheme: light) {
  .navbar {
    background: rgba(255, 255, 255, 0.9);
    border-bottom: 1px solid #e0e0e0;
  }
  .nav-links a {
    color: #555;
  }
  .nav-links a:hover {
    color: #000;
  }
}
</style>
