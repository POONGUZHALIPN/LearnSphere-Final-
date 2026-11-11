
import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cpSync, existsSync } from 'node:fs';

const projectRoot = fileURLToPath(new URL('.', import.meta.url));

const pageRoutes = {
  '/': '/index.html',
  '/index.html': '/index.html',
  '/login': '/pages/login.html',
  '/login.html': '/pages/login.html',
  '/register': '/pages/register.html',
  '/register.html': '/pages/register.html',
  '/admin-login': '/pages/admin-login.html',
  '/admin-login.html': '/pages/admin-login.html',
  '/admin-register': '/pages/admin-register.html',
  '/admin-register.html': '/pages/admin-register.html',
  '/forgot-password': '/pages/forgot-password.html',
  '/forgot-password.html': '/pages/forgot-password.html',
  '/account-settings': '/pages/account-settings.html',
  '/account-settings.html': '/pages/account-settings.html',
  '/student-dashboard': '/pages/student-dashboard.html',
  '/student-dashboard.html': '/pages/student-dashboard.html',
  '/admin-dashboard': '/pages/admin-dashboard.html',
  '/admin-dashboard.html': '/pages/admin-dashboard.html',
  '/course-player': '/pages/course-player.html',
  '/course-player.html': '/pages/course-player.html'
};

export default defineConfig({
  root: 'public',

  base: '/',

  build: {
    outDir: 'dist',
    emptyOutDir: true,

    rollupOptions: {
      input: {
        home: resolve(projectRoot, 'public/index.html'),
        login: resolve(projectRoot, 'public/pages/login.html'),
        register: resolve(projectRoot, 'public/pages/register.html'),
        adminLogin: resolve(projectRoot, 'public/pages/admin-login.html'),
        adminRegister: resolve(projectRoot, 'public/pages/admin-register.html'),
        forgotPassword: resolve(projectRoot, 'public/pages/forgot-password.html'),
        accountSettings: resolve(projectRoot, 'public/pages/account-settings.html'),
        studentDashboard: resolve(projectRoot, 'public/pages/student-dashboard.html'),
        adminDashboard: resolve(projectRoot, 'public/pages/admin-dashboard.html'),
        coursePlayer: resolve(projectRoot, 'public/pages/course-player.html')
      }
    }
  },

  server: {
    port: 5173,
    strictPort: false,

    proxy: {
      '/api': 'http://localhost:3000',
      '/login': 'http://localhost:3000',
      '/register': 'http://localhost:3000',
      '/logout': 'http://localhost:3000',
      '/forgot-password': 'http://localhost:3000',
      '/reset-password': 'http://localhost:3000',
      '/admin-login': 'http://localhost:3000',
      '/admin-register': 'http://localhost:3000',
      '/student/dashboard': 'http://localhost:3000',
      '/admin/dashboard': 'http://localhost:3000',
      '/course': 'http://localhost:3000',
      '/account': 'http://localhost:3000'
    }
  },

  plugins: [
    {
      name: 'learnsphere-clean-routes',

      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.method === 'GET') {
            const pathname = new URL(req.url, 'http://localhost').pathname;

            if (pageRoutes[pathname]) {
              req.url = pageRoutes[pathname];
            }
          }

          next();
        });
      },

      closeBundle() {
        for (const folder of ['js', 'css']) {
          const source = resolve(projectRoot, 'public', folder);
          const destination = resolve(projectRoot, 'public', 'dist', folder);

          if (existsSync(source)) {
            cpSync(source, destination, { recursive: true });
          }
        }
      }
    }
  ]
});
