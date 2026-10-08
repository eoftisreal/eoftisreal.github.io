## 2024-10-08 - Zustand Store Destructuring Anti-pattern
**Learning:** Destructuring the entire store from Zustand hooks (e.g., `const { addItem } = useCartStore()`) causes components to subscribe to ALL state changes, leading to widespread re-rendering bottlenecks, especially in list/grid components like `ProductCard`.
**Action:** Always use selectors to pick specific state slices (e.g., `const addItem = useCartStore(state => state.addItem)`) to minimize re-renders.
