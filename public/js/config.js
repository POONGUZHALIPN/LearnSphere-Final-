/*
 * LearnSphere API configuration.
 * Production points both the compatibility API and Task 9–14 API to the
 * existing MongoDB-backed Render service.
 */
(() => {
  const isLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname);
  const renderApi = 'https://learnsphere-backend-ua33.onrender.com';

  window.LEARNSPHERE_CONFIG = Object.freeze({
    APP_API_BASE_URL: `${isLocal ? 'http://localhost:5000' : renderApi}/api`,
    TASK9_API_BASE_URL: `${isLocal ? 'http://localhost:5000' : renderApi}/api/v1`
  });
})();
