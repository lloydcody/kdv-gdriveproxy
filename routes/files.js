import express from 'express';
import { DriveService } from '../drive-service.js';
import { logger } from '../utils/logger.js';
import { proxyThumbnail } from '../utils/proxy.js';

const router = express.Router();
const driveService = new DriveService();

router.get('/', async (req, res, next) => {
  try {
    const files = await driveService.listFilesRecursively(process.env.GOOGLE_FOLDER_ID);
    res.json(files);
  } catch (error) {
    logger.error('Error listing files', error);
    next(error);
  }
});

router.get('/:fileId/preview', async (req, res, next) => {
  try {
    const { fileId } = req.params;
    const response = await driveService.getFile(fileId);
    
    // Forward content type header from Google Drive
    if (response.headers['content-type']) {
      res.setHeader('content-type', response.headers['content-type']);
    }
    
    // Pipe the file stream directly to the response
    response.data.pipe(res);
  } catch (error) {
    logger.error('Error getting file preview', error, { fileId: req.params.fileId });
    next(error);
  }
});

router.get('/:fileId/thumbnail', async (req, res, next) => {
  try {
    const { fileId } = req.params;
    const thumbnailUrl = await driveService.getThumbnail(fileId);
    await proxyThumbnail(thumbnailUrl, res);
  } catch (error) {
    logger.error('Error getting thumbnail', error, { fileId: req.params.fileId });
    next(error);
  }
});

export default router;