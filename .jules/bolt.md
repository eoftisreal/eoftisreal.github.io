
## 2024-10-06 - Prevent Widespread React Re-renders by selecting Zustand State carefully
**Learning:** Destructuring directly from the store hook (`const { addItem } = useCartStore();`) subscribes the component to ALL state changes in the store. For components heavily rendered in lists like `ProductCard`, this causes massive performance bottlenecks as every cart update triggers a re-render of the entire list.
**Action:** Always use a state selector with Zustand when possible, e.g. `const addItem = useCartStore(state => state.addItem);`, especially in components rendered repeatedly in lists or grids. Further, wrap list items receiving complex props in `React.memo` to guard against parent re-renders.
