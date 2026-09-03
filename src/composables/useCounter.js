import { ref, computed } from 'vue'

/**
 * 计数器组合式函数
 * @param {number} initialValue - 初始值
 * @param {number} step - 步长
 */
export function useCounter(initialValue = 0, step = 1) {
  const count = ref(initialValue)
  const double = computed(() => count.value * 2)
  const isEven = computed(() => count.value % 2 === 0)

  function increment() {
    count.value += step
  }

  function decrement() {
    count.value -= step
  }

  function reset() {
    count.value = initialValue
  }

  function set(value) {
    count.value = value
  }

  return {
    count,
    double,
    isEven,
    increment,
    decrement,
    reset,
    set
  }
}
