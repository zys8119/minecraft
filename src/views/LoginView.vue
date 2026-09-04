<template>
  <div class="login">
    <div class="login-background"></div>
    <form class="login-card" @submit.prevent="handleLogin">
      <div class="login-header">
        <div class="login-icon">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="4" y="4" width="24" height="24" rx="6" stroke="currentColor" stroke-width="2.5" />
            <path d="M12 16L16 20L24 12" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"
              stroke-linejoin="round" />
          </svg>
        </div>
        <h1>欢迎回来</h1>
        <p class="login-tip">登录以继续使用</p>
      </div>

      <div class="form-item">
        <label for="username">用户名</label>
        <div class="input-wrapper">
          <input id="username" v-model.trim="form.username" type="text" placeholder="请输入用户名" autocomplete="username"
            :class="{ 'input-error': error && !form.username }" />
        </div>
      </div>

      <div class="form-item">
        <label for="password">密码</label>
        <div class="input-wrapper">
          <input id="password" v-model="form.password" type="password" placeholder="请输入密码"
            autocomplete="current-password" :class="{ 'input-error': error && !form.password }" />
        </div>
      </div>

      <transition name="fade">
        <p v-if="error" class="login-error">{{ error }}</p>
      </transition>

      <div class="demo-hint">
        <span class="demo-label">测试账号</span>
        <span class="demo-cred">用户名: <strong>admin</strong></span>
        <span class="demo-cred">密码: <strong>admin</strong></span>
      </div>

      <button type="submit" :disabled="loading" :class="{ 'loading': loading }">
        <span v-if="!loading">登录</span>
        <span v-else class="loader"></span>
      </button>
    </form>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const form = reactive({
  username: '',
  password: ''
})
const loading = ref(false)
const error = ref('')

async function handleLogin() {
  error.value = ''

  if (!form.username) {
    error.value = '请输入用户名'
    return
  }
  if (!form.password) {
    error.value = '请输入密码'
    return
  }

  loading.value = true
  try {
    // 模拟登录请求，接入真实接口后替换
    await new Promise((resolve) => setTimeout(resolve, 500))

    // 模拟校验：用户名/密码均为 admin 时登录成功
    if (form.username === 'admin' && form.password === 'admin') {
      localStorage.setItem('isLoggedIn', '1')
      router.push('/')
    } else {
      error.value = '用户名或密码错误'
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 24px;
  background: var(--bg-primary, #f8fafc);
  overflow: hidden;
}

.login-background {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at 20% 50%, rgba(59, 130, 246, 0.08) 0%, transparent 60%),
    radial-gradient(ellipse at 80% 50%, rgba(139, 92, 246, 0.06) 0%, transparent 60%);
  pointer-events: none;
}

.login-card {
  position: relative;
  width: 100%;
  max-width: 400px;
  padding: 40px 36px 44px;
  border-radius: 20px;
  background: var(--card-bg, rgba(255, 255, 255, 0.85));
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--card-border, rgba(255, 255, 255, 0.5));
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.06), 0 4px 16px rgba(0, 0, 0, 0.03);
  transition: box-shadow 0.3s ease;
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.login-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: var(--icon-bg, #eff6ff);
  color: var(--icon-color, #3b82f6);
  margin-bottom: 16px;
  transition: transform 0.2s ease;
}

.login-card h1 {
  margin: 0 0 6px;
  font-size: 26px;
  font-weight: 600;
  color: var(--text-primary, #0f172a);
  letter-spacing: -0.5px;
}

.login-tip {
  margin: 0;
  color: var(--text-secondary, #64748b);
  font-size: 14px;
  font-weight: 400;
}

.form-item {
  margin-bottom: 20px;
}

.form-item label {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary, #0f172a);
  letter-spacing: 0.3px;
}

.input-wrapper {
  position: relative;
}

.form-item input {
  width: 100%;
  padding: 12px 16px;
  border: 1.5px solid var(--input-border, #e2e8f0);
  border-radius: 12px;
  font-size: 14px;
  font-weight: 400;
  color: var(--text-primary, #0f172a);
  background: var(--input-bg, #f1f5f9);
  box-sizing: border-box;
  transition: border-color 0.25s ease, box-shadow 0.25s ease, background 0.25s ease;
}

.form-item input::placeholder {
  color: var(--text-muted, #94a3b8);
  font-weight: 300;
}

.form-item input:focus {
  outline: none;
  border-color: #3b82f6;
  background: var(--input-focus-bg, #ffffff);
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
}

.form-item input.input-error {
  border-color: #ef4444;
  box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.08);
}

.login-error {
  margin: -8px 0 12px;
  color: #ef4444;
  font-size: 13px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
}

.login-error::before {
  content: '';
  display: inline-block;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #ef4444;
  flex-shrink: 0;
}

.demo-hint {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  margin: 0 0 18px;
  border-radius: 10px;
  background: rgba(59, 130, 246, 0.06);
  border: 1px solid rgba(59, 130, 246, 0.12);
  font-size: 13px;
  color: var(--text-secondary, #64748b);
  flex-wrap: wrap;
}

.demo-label {
  font-weight: 600;
  color: #3b82f6;
  background: rgba(59, 130, 246, 0.12);
  padding: 2px 10px;
  border-radius: 6px;
  font-size: 12px;
}

.demo-cred {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.demo-cred strong {
  color: var(--text-primary, #0f172a);
  font-weight: 600;
  background: rgba(0, 0, 0, 0.04);
  padding: 0 6px;
  border-radius: 4px;
  font-family: 'Menlo', 'Monaco', monospace;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

button {
  width: 100%;
  padding: 14px;
  border: none;
  border-radius: 12px;
  background: #3b82f6;
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.25s ease, transform 0.15s ease, box-shadow 0.25s ease;
  box-shadow: 0 4px 14px rgba(59, 130, 246, 0.25);
  position: relative;
  overflow: hidden;
}

button:hover:not(:disabled) {
  background: #2563eb;
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.35);
  transform: translateY(-1px);
}

button:active:not(:disabled) {
  transform: scale(0.98);
}

button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

button .loader {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 2.5px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-color-scheme: dark) {
  .login {
    --bg-primary: #0f172a;
    --card-bg: rgba(30, 41, 59, 0.85);
    --card-border: rgba(255, 255, 255, 0.06);
    --text-primary: #f1f5f9;
    --text-secondary: #94a3b8;
    --text-muted: #64748b;
    --input-border: #334155;
    --input-bg: #1e293b;
    --input-focus-bg: #1e293b;
    --icon-bg: rgba(59, 130, 246, 0.15);
    --icon-color: #60a5fa;
  }

  .login-card {
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
  }

  .login-background {
    background: radial-gradient(ellipse at 20% 50%, rgba(59, 130, 246, 0.12) 0%, transparent 60%),
      radial-gradient(ellipse at 80% 50%, rgba(139, 92, 246, 0.08) 0%, transparent 60%);
  }

  button {
    box-shadow: 0 4px 14px rgba(59, 130, 246, 0.3);
  }

  .demo-hint {
    background: rgba(59, 130, 246, 0.08);
    border-color: rgba(59, 130, 246, 0.15);
  }

  .demo-cred strong {
    background: rgba(255, 255, 255, 0.06);
    color: #e2e8f0;
  }

  .demo-label {
    background: rgba(59, 130, 246, 0.2);
  }
}
</style>
