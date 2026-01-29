import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        login: resolve(__dirname, 'login.html'),
        dashboard: resolve(__dirname, 'dashboard.html'),
        sales: resolve(__dirname, 'sales.html'),
        inventory: resolve(__dirname, 'inventory.html'),
        transactions: resolve(__dirname, 'transactions.html'),
        settings: resolve(__dirname, 'settings.html'),
        receipt: resolve(__dirname, 'receipt.html')
      },
    },
  },
})