import https from 'https';
import { logger } from './logger.js';

export async function proxyThumbnail(url, res) {
  return new Promise((resolve, reject) => {
    https.get(url, (proxyRes) => {
      // Forward content type and other relevant headers
      res.setHeader('content-type', proxyRes.headers['content-type']);
      res.setHeader('cache-control', 'public, max-age=3600'); // Cache for 1 hour

      // Pipe the thumbnail stream to the response
      proxyRes.pipe(res);

      proxyRes.on('end', () => {
        logger.info('Thumbnail proxied successfully');
        resolve();
      });

      proxyRes.on('error', (error) => {
        logger.error('Error proxying thumbnail', error);
        reject(error);
      });
    }).on('error', (error) => {
      logger.error('Error fetching thumbnail', error);
      reject(error);
    });
  });
}