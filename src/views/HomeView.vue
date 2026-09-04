<template>
  <div class="home">
    <section class="hero-section">
      <div class="hero-content">
        <span class="badge">✨ Vue 3 项目</span>
        <h1 class="hero-title">欢迎回来</h1>
        <p class="hero-description">
          使用 Vite + Vue 3 构建的现代化应用，<br />体验高效、轻量的开发流程。
        </p>
        <div class="hero-actions">
          <button class="btn-primary" @click="scrollToFeatures">开始使用</button>
          <button class="btn-secondary" @click="router.push('/about')">了解更多</button>
        </div>
      </div>
      <div class="hero-visual">
        <div class="hero-card">
          <div class="card-icon">⚡</div>
          <div class="card-stats">
            <span class="stat-number">4</span>
            <span class="stat-label">功能模块</span>
          </div>
          <div class="card-stats">
            <span class="stat-number">3</span>
            <span class="stat-label">内置工具</span>
          </div>
        </div>
      </div>
    </section>

    <section class="features-section" id="features">
      <div class="section-header">
        <span class="section-badge">功能亮点</span>
        <h2>核心功能</h2>
        <p>快速上手，轻松管理</p>
      </div>
      <div class="features-grid">
        <div class="feature-card">
          <div class="feature-icon">🎯</div>
          <h3>计数器</h3>
          <p>实时追踪数值变化，支持增、减、重置</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">📋</div>
          <h3>待办事项</h3>
          <p>高效管理任务，自动保存至本地</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">🎮</div>
          <h3>我的世界</h3>
          <p>3D 体素沙盒，体验沉浸式创造</p>
        </div>
      </div>
    </section>

    <section class="demo-section">
      <div class="demo-container">
        <h2>快速体验</h2>
        <div class="demo-grid">
          <div class="demo-item">
            <Counter />
          </div>
          <div class="demo-item">
            <TodoList />
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import Counter from '../components/Counter.vue'
import TodoList from '../components/TodoList.vue'

const router = useRouter()

const scrollToFeatures = () => {
  document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })
}
</script>

<style scoped>
.home {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem 4rem;
}

.hero-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4rem;
  align-items: center;
  padding: 3rem 0 4rem;
  min-height: 60vh;
}

.hero-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.badge {
  display: inline-block;
  background: #0d9488;
  color: #fff;
  font-size: 0.8rem;
  font-weight: 600;
  padding: 0.3rem 1rem;
  border-radius: 20px;
  width: fit-content;
  letter-spacing: 0.5px;
}

.hero-title {
  font-size: 3rem;
  font-weight: 700;
  color: var(--text-primary, #134e4a);
  line-height: 1.1;
  margin: 0;
}

.hero-description {
  font-size: 1.1rem;
  color: var(--text-secondary, #475569);
  line-height: 1.6;
  max-width: 480px;
}

.hero-actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.btn-primary {
  background: #0d9488;
  color: #fff;
  border: none;
  padding: 0.8rem 2rem;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 12px;
  cursor: pointer;
  transition: background 0.2s ease, transform 0.1s ease;
}

.btn-primary:hover {
  background: #0f766e;
  transform: translateY(-2px);
}

.btn-secondary {
  background: transparent;
  color: #0d9488;
  border: 2px solid #0d9488;
  padding: 0.8rem 2rem;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 12px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.btn-secondary:hover {
  background: rgba(13, 148, 136, 0.08);
}

.hero-visual {
  display: flex;
  justify-content: center;
  align-items: center;
}

.hero-card {
  background: #fff;
  border-radius: 20px;
  padding: 2.5rem 2rem;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.06);
  border: 1px solid #e8f1f4;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  min-width: 240px;
}

.card-icon {
  font-size: 2.5rem;
  text-align: center;
}

.card-stats {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-number {
  font-size: 2.5rem;
  font-weight: 700;
  color: #0d9488;
}

.stat-label {
  font-size: 0.9rem;
  color: #64748b;
}

.features-section {
  padding: 4rem 0;
}

.section-header {
  text-align: center;
  margin-bottom: 3rem;
}

.section-badge {
  display: inline-block;
  font-size: 0.8rem;
  font-weight: 600;
  color: #0d9488;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.section-header h2 {
  font-size: 2.2rem;
  font-weight: 700;
  color: var(--text-primary, #134e4a);
  margin: 0.5rem 0 0.2rem;
}

.section-header p {
  color: var(--text-secondary, #475569);
  font-size: 1.05rem;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 2rem;
}

.feature-card {
  background: #fff;
  border-radius: 16px;
  padding: 2rem 1.5rem;
  text-align: center;
  border: 1px solid #e8f1f4;
  transition: box-shadow 0.3s ease, transform 0.2s ease;
}

.feature-card:hover {
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.06);
  transform: translateY(-4px);
}

.feature-icon {
  font-size: 2rem;
  margin-bottom: 1rem;
}

.feature-card h3 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #134e4a;
  margin: 0 0 0.5rem;
}

.feature-card p {
  font-size: 0.95rem;
  color: #64748b;
  margin: 0;
  line-height: 1.5;
}

.demo-section {
  padding: 3rem 0;
}

.demo-container {
  background: #f8fafc;
  border-radius: 24px;
  padding: 2.5rem 2rem;
  border: 1px solid #e8f1f4;
}

.demo-container h2 {
  text-align: center;
  font-size: 1.8rem;
  font-weight: 600;
  color: #134e4a;
  margin: 0 0 2rem;
}

.demo-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

.demo-item {
  background: #fff;
  border-radius: 16px;
  padding: 1.5rem;
  border: 1px solid #e8f1f4;
}

@media (max-width: 768px) {
  .hero-section {
    grid-template-columns: 1fr;
    gap: 2rem;
    text-align: center;
  }

  .hero-description {
    max-width: 100%;
    margin: 0 auto;
  }

  .hero-actions {
    justify-content: center;
  }

  .demo-grid {
    grid-template-columns: 1fr;
  }

  .hero-title {
    font-size: 2.2rem;
  }

  .home {
    padding: 0 1rem 2rem;
  }
}

@media (prefers-color-scheme: dark) {
  .hero-card {
    background: #1e293b;
    border-color: #334155;
  }

  .feature-card {
    background: #1e293b;
    border-color: #334155;
  }

  .feature-card h3 {
    color: #e2e8f0;
  }

  .demo-container {
    background: #0f172a;
    border-color: #334155;
  }

  .demo-item {
    background: #1e293b;
    border-color: #334155;
  }
}
</style>
