import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';
import compression from 'vite-plugin-compression';

export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';
  const enablePwa = process.env.VITE_ENABLE_PWA === 'true';

  return {
  plugins: [
    react({
      // Fast Refresh optimization
      fastRefresh: !isProduction,
    }),
    tailwindcss(),
    ...(enablePwa
      ? [VitePWA({
          registerType: 'autoUpdate',
          workbox: {
            cleanupOutdatedCaches: true,
            skipWaiting: true,
            clientsClaim: true,

          },
          devOptions: {
            enabled: !isProduction,
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
        })]
      : []),
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
    sourcemap: false,
    reportCompressedSize: isProduction,
    rollupOptions: {
      output: {
        // Let Rollup share dependencies across lazy routes. Manual library buckets
        // previously pulled the markdown dependency graph into the initial page.
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
  },
  };
});
