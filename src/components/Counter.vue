<script setup>
import { useCounter } from '../composables/useCounter'

const { count, double, isEven, increment, decrement, reset } = useCounter(0, 1)
</script>

<template>
  <div class="counter">
    <h2>计数器</h2>
    <div class="counter-display">
      <span class="count">{{ count }}</span>
      <span class="double">(2倍: {{ double }})</span>
      <span class="badge" :class="{ even: isEven, odd: !isEven }">
        {{ isEven ? '偶数' : '奇数' }}
      </span>
    </div>
    <div class="counter-buttons">
      <button @click="decrement">−</button>
      <button @click="reset">重置</button>
      <button @click="increment">+</button>
    </div>
  </div>
</template>

<style scoped>
.counter {
  border: 1px solid #42b883;
  border-radius: 8px;
  padding: 2rem;
  margin: 1rem 0;
}
.counter-display {
  font-size: 1.5rem;
  margin-bottom: 1rem;
}
.count {
  font-weight: bold;
  font-size: 2rem;
  color: #42b883;
}
.double {
  color: #888;
  margin-left: 1rem;
}
.badge {
  display: inline-block;
  font-size: 0.8rem;
  padding: 0.2rem 0.8rem;
  border-radius: 12px;
  margin-left: 1rem;
  font-weight: 500;
}
.badge.even {
  background: rgba(66, 184, 131, 0.2);
  color: #42b883;
}
.badge.odd {
  background: rgba(255, 193, 7, 0.2);
  color: #ffc107;
}
.counter-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
}
.counter-buttons button {
  min-width: 60px;
}
</style>
