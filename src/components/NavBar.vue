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
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background: transparent;
  backdrop-filter: none;
  border-bottom: none;
  margin-bottom: 0;
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: bold;
  font-size: 1.2rem;
  color: #fff;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

.nav-logo {
  height: 30px;
  width: 30px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

.nav-links {
  display: flex;
  list-style: none;
  gap: 1.5rem;
  margin: 0;
  padding: 0;
}

.nav-links a {
  color: rgba(255, 255, 255, 0.8);
  text-decoration: none;
  transition: all 0.3s;
  padding: 0.3rem 0.6rem;
  border-radius: 4px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

.nav-links a:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.15);
}

.nav-links a.active {
  color: #42b883;
  background: rgba(66, 184, 131, 0.2);
}

@media (prefers-color-scheme: light) {
  .nav-brand {
    color: #333;
    text-shadow: 0 2px 4px rgba(255, 255, 255, 0.5);
  }

  .nav-links a {
    color: rgba(0, 0, 0, 0.7);
    text-shadow: 0 2px 4px rgba(255, 255, 255, 0.5);
  }

  .nav-links a:hover {
    color: #000;
    background: rgba(0, 0, 0, 0.08);
  }

  .nav-links a.active {
    color: #42b883;
    background: rgba(66, 184, 131, 0.15);
  }
}
</style>
