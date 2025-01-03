export function setupSecurityHeaders(app) {
  app.use((req, res, next) => {
    // Allow connections to both development and production URLs
    const connectSrc = [
      "'self'",
      process.env.CORS_ORIGIN || 'http://localhost:5173',
      'http://localhost:3000'
    ].join(' ');

    res.setHeader(
      'Content-Security-Policy',
      [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https:",
        `connect-src ${connectSrc}`,
        "font-src 'self' data:"
      ].join('; ')
    );
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
  });
}