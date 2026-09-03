<script setup>
import { useTodos } from '../composables/useTodos'

const {
  todos,
  newTodoText,
  remaining,
  completed,
  total,
  allDone,
  addTodo,
  toggleTodo,
  deleteTodo,
  clearCompleted,
  toggleAll,
  resetTodos
} = useTodos([
  { id: 1, text: '学习 Vite', done: true, createdAt: new Date().toISOString() },
  { id: 2, text: '学习 Vue 3', done: false, createdAt: new Date().toISOString() },
  { id: 3, text: '构建一个应用', done: false, createdAt: new Date().toISOString() }
])

function handleAdd() {
  addTodo(newTodoText.value)
  newTodoText.value = ''
}
</script>

<template>
  <div class="todo-list">
    <h2>待办事项</h2>
    <div class="todo-input">
      <input
        v-model="newTodoText"
        @keyup.enter="handleAdd"
        placeholder="添加新待办..."
      />
      <button @click="handleAdd" :disabled="!newTodoText.trim()">添加</button>
    </div>
    <div class="todo-stats">
      <span>剩余 {{ remaining }} 项 / 共 {{ total }} 项</span>
      <span>已完成 {{ completed }} 项</span>
      <div class="todo-actions">
        <button v-if="todos.length > 0" @click="toggleAll" class="btn-toggle">
          {{ allDone ? '全部取消' : '全部完成' }}
        </button>
        <button v-if="completed > 0" @click="clearCompleted" class="btn-clear">
          清除已完成
        </button>
        <button v-if="todos.length > 0" @click="resetTodos" class="btn-reset">
          清空全部
        </button>
      </div>
    </div>
    <ul class="todo-items">
      <li v-for="todo in todos" :key="todo.id" :class="{ done: todo.done }">
        <input type="checkbox" :checked="todo.done" @change="toggleTodo(todo.id)" />
        <span>{{ todo.text }}</span>
        <button @click="deleteTodo(todo.id)" class="btn-delete">删除</button>
      </li>
    </ul>
    <p v-if="todos.length === 0" class="empty">🎉 所有待办已完成！</p>
  </div>
</template>

<style scoped>
.todo-list {
  border: 1px solid #646cff;
  border-radius: 8px;
  padding: 1.5rem;
  margin-top: 2rem;
  text-align: left;
  max-width: 550px;
  margin-left: auto;
  margin-right: auto;
}
.todo-input {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}
.todo-input input {
  flex: 1;
  padding: 0.5rem 0.8rem;
  border: 1px solid #555;
  border-radius: 4px;
  background: transparent;
  color: inherit;
}
.todo-input input:focus {
  outline: none;
  border-color: #42b883;
}
.todo-input button {
  background: #42b883;
  color: #fff;
  border: none;
  padding: 0.5rem 1.2rem;
  border-radius: 4px;
  cursor: pointer;
}
.todo-input button:hover {
  background: #369e6f;
}
.todo-input button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.todo-stats {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem 1rem;
  font-size: 0.9rem;
  color: #888;
  margin-bottom: 0.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #333;
}
.todo-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-left: auto;
}
.todo-actions button {
  font-size: 0.8rem;
  padding: 0.2rem 0.6rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
.btn-toggle {
  background: #646cff;
  color: #fff;
}
.btn-toggle:hover {
  background: #535bf2;
}
.btn-clear {
  background: #ffc107;
  color: #333;
}
.btn-clear:hover {
  background: #e0a800;
}
.btn-reset {
  background: #dc3545;
  color: #fff;
}
.btn-reset:hover {
  background: #c82333;
}
.todo-items {
  list-style: none;
  padding: 0;
  margin: 0.5rem 0 0;
}
.todo-items li {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0;
  border-bottom: 1px solid #333;
}
.todo-items li:last-child {
  border-bottom: none;
}
.todo-items li.done span {
  text-decoration: line-through;
  color: #888;
}
.todo-items li input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}
.btn-delete {
  margin-left: auto;
  background: #dc3545;
  color: #fff;
  border: none;
  padding: 0.2rem 0.8rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
}
.btn-delete:hover {
  background: #c82333;
}
.empty {
  text-align: center;
  color: #42b883;
  padding: 1rem 0;
}

@media (prefers-color-scheme: light) {
  .todo-input input {
    border-color: #ccc;
  }
  .todo-stats {
    border-bottom-color: #e0e0e0;
  }
  .todo-items li {
    border-bottom-color: #e0e0e0;
  }
}
</style>
