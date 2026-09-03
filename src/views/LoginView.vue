<template>
  <div class="login">
    <form class="login-card" @submit.prevent="handleLogin">
      <h1>登录</h1>
      <p class="login-tip">请输入账号和密码</p>

      <div class="form-item">
        <label for="username">用户名</label>
        <input
          id="username"
          v-model.trim="form.username"
          type="text"
          placeholder="请输入用户名"
          autocomplete="username"
        />
      </div>

      <div class="form-item">
        <label for="password">密码</label>
        <input
          id="password"
          v-model="form.password"
          type="password"
          placeholder="请输入密码"
          autocomplete="current-password"
        />
      </div>

      <p v-if="error" class="login-error">{{ error }}</p>

      <button type="submit" :disabled="loading">
        {{ loading ? '登录中...' : '登录' }}
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
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 80vh;
}

.login-card {
  width: 100%;
  max-width: 360px;
  padding: 32px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
}

.login-card h1 {
  margin: 0 0 8px;
  font-size: 24px;
  text-align: center;
}

.login-tip {
  margin: 0 0 24px;
  color: #6b7280;
  text-align: center;
}

.form-item {
  margin-bottom: 16px;
}

.form-item label {
  display: block;
  margin-bottom: 6px;
  font-size: 14px;
}

.form-item input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  box-sizing: border-box;
}

.form-item input:focus {
  outline: none;
  border-color: #3b82f6;
}

.login-error {
  margin: 0 0 12px;
  color: #ef4444;
  font-size: 13px;
}

button {
  width: 100%;
  padding: 10px;
  border: none;
  border-radius: 6px;
  background: #3b82f6;
  color: #fff;
  font-size: 15px;
  cursor: pointer;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
