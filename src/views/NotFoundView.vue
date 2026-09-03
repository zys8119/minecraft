<template>
  <div class="not-found">
    <div class="not-found-content">
      <h1>404</h1>
      <h2>页面未找到</h2>
      <p>抱歉，您访问的页面不存在。</p>
      <router-link to="/" class="btn-home">返回首页</router-link>
    </div>
  </div>
</template>

<style scoped>
.not-found {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
  text-align: center;
}
.not-found-content h1 {
  font-size: 6rem;
  margin: 0;
  color: #646cff;
}
.not-found-content h2 {
  font-size: 2rem;
  margin: 0.5rem 0;
}
.not-found-content p {
  color: #888;
  margin: 1rem 0 2rem;
}
.btn-home {
  display: inline-block;
  padding: 0.6rem 1.8rem;
  background: #646cff;
  color: #fff;
  border-radius: 4px;
  text-decoration: none;
  transition: background 0.3s;
}
.btn-home:hover {
  background: #535bf2;
}
</style>
