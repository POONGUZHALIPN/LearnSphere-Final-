import { defineConfig } from 'vite';

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
  plugins: [{
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
    }
  }]
});
