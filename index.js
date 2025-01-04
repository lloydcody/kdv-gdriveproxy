import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config.js';
import { setupSecurityHeaders } from './middleware/security.js';
import { errorHandler } from './middleware/errorHandler.js';
import { logger } from './utils/logger.js';
import filesRouter from './routes/files.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// Security headers
setupSecurityHeaders(app);

// Enable CORS with origin validation
// app.use(cors({
//   origin: (origin, callback) => {
//     // Allow requests with no origin (like mobile apps or curl requests)
//     if (!origin) return callback(null, true);
    
//     if (config.corsOrigins.indexOf(origin) !== -1) {
//       callback(null, true);
//     } else {
//       logger.error('Not allowed by CORS', null, { origin });
//       callback(new Error('Not allowed by CORS'));
//     }
//   },
//   credentials: true
// }));

// temporarily allow all orignsi
app.use(cors({
  origin: '*',
  credentials: false // Since we're allowing all origins, we should disable credentials
}));


// API routes
app.use('/api/files', filesRouter);

// Error handling
app.use(errorHandler);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  logger.info(`Server running on port ${port}`);
});
