import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        login: 'login.html',
        dashboard: 'dashboard.html',
        sales: 'sales.html',
        inventory: 'inventory.html',
        transactions: 'transactions.html',
        settings: 'settings.html',
        receipt: 'receipt.html'
      },
    },
  },
})