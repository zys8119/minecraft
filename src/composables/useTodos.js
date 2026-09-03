import { ref, computed, watch } from 'vue'

/**
 * 待办事项组合式函数
 */
export function useTodos(initialTodos = []) {
  const todos = ref([...initialTodos])
  const newTodoText = ref('')

  const remaining = computed(() => todos.value.filter(t => !t.done).length)
  const completed = computed(() => todos.value.filter(t => t.done).length)
  const total = computed(() => todos.value.length)
  const allDone = computed(() => total.value > 0 && remaining.value === 0)

  function addTodo(text) {
    const trimmed = text.trim()
    if (!trimmed) return false
    todos.value.push({
      id: Date.now(),
      text: trimmed,
      done: false,
      createdAt: new Date().toISOString()
    })
    return true
  }

  function toggleTodo(id) {
    const todo = todos.value.find(t => t.id === id)
    if (todo) {
      todo.done = !todo.done
    }
  }

  function deleteTodo(id) {
    todos.value = todos.value.filter(t => t.id !== id)
  }

  function clearCompleted() {
    todos.value = todos.value.filter(t => !t.done)
  }

  function toggleAll() {
    const shouldMarkDone = !allDone.value
    todos.value.forEach(t => {
      t.done = shouldMarkDone
    })
  }

  function resetTodos() {
    todos.value = []
  }

  // 自动保存到 localStorage
  watch(
    todos,
    (newTodos) => {
      try {
        localStorage.setItem('todos', JSON.stringify(newTodos))
      } catch (e) {
        // ignore
      }
    },
    { deep: true }
  )

  return {
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
  }
}
