# Vite + Vue 3 项目

## 技术栈
- ⚡ Vite 4 - 极速构建工具
- 🖖 Vue 3 - 渐进式 JavaScript 框架
- 📦 Vue Router 4 - 官方路由管理器

## 启动项目

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

## 项目结构

```
test/
├── public/
│   └── vite.svg
├── src/
│   ├── components/
│   │   ├── Counter.vue          # 计数器组件
│   │   ├── HelloWorld.vue       # 欢迎组件
│   │   ├── NavBar.vue           # 导航栏组件
│   │   └── TodoList.vue         # 待办事项组件
│   ├── views/
│   │   ├── HomeView.vue         # 首页视图
│   │   └── AboutView.vue        # 关于视图
│   ├── router/
│   │   └── index.js             # 路由配置
│   ├── App.vue
│   ├── main.js
│   └── style.css
├── .env                          # 环境变量
├── .env.example                  # 环境变量示例
├── .gitignore
├── index.html
├── vite.config.js
├── package.json
└── README.md
```

## 开发说明

- 使用 Vue 3 Composition API (`<script setup>`)
- 支持热模块替换 (HMR)
- 开发服务器默认运行在 http://localhost:5173
- 路由支持：首页 `/` 和关于 `/about`

## 功能示例

- 计数器：展示 Vue 3 响应式状态和计算属性
- 待办事项：展示列表渲染、事件处理和组件状态管理
- 路由导航：展示 Vue Router 的基本使用
