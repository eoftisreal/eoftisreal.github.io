import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';
import compression from 'vite-plugin-compression';

const isProduction = process.env.NODE_ENV === 'production';

export default defineConfig({
  plugins: [
    react({
      // Fast Refresh optimization
      fastRefresh: !isProduction,
    }),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\./,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 5 * 60, // 5 minutes
              },
            },
          },
        ],
      },
      devOptions: {
        enabled: true
      },
      manifest: {
        name: 'Kapda Kraft',
        short_name: 'Kapda Kraft',
        description: 'Discover the Art of Style',
        theme_color: '#111111',
        background_color: '#F4F2F0',
        display: 'standalone',
        icons: [
          {
            src: '/favicon.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/favicon.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/favicon.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
    // Add compression plugin
    compression({
      algorithm: 'brotliCompress',
      ext: '.br',
    }),
    compression({
      algorithm: 'gzip',
      ext: '.gz',
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
    // Enable compression in dev
    middlewareMode: false,
  },
  build: {
    target: 'ES2020',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: isProduction,
        dead_code: true,
        unused: true,
      },
      format: {
        comments: false,
      },
    },
    sourcemap: !isProduction,
    reportCompressedSize: isProduction,
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'vendor-react': ['react', 'react-dom'],
          'vendor-router': ['react-router-dom'],
          'vendor-state': ['zustand'],
          'vendor-api': ['axios'],

          // UI components
          'ui-icons': ['lucide-react'],
          'ui-toast': ['react-hot-toast'],
          'ui-markdown': ['react-markdown', 'remark-gfm', 'rehype-raw'],

          // Heavy libraries
          'lib-three': ['three'],
          'lib-excel': ['xlsx'],
          'lib-canvas': ['html2canvas'],
          'lib-editor': ['react-quill'],
          'lib-qr': ['qrcode.react'],
        },
        // Optimize chunk sizes
        chunkFileNames: 'js/[name]-[hash].js',
        entryFileNames: 'js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const name = assetInfo.name || '';
          if (/\.(gif|jpe?g|png|svg|webp)$/.test(name)) {
            return 'images/[name]-[hash][extname]';
          } else if (/\.css$/.test(name)) {
            return 'css/[name]-[hash][extname]';
          } else if (/\.woff2?$/.test(name)) {
            return 'fonts/[name]-[hash][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        },
      },
    },
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'zustand',
      'axios',
      'lucide-react',
    ],
    exclude: ['node_modules/.vite'],
  },
});
