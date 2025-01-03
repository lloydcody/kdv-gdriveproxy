import { google } from 'googleapis';
import { JWT } from 'google-auth-library';
import { config } from './config.js';
import { logger } from './utils/logger.js';

export class DriveService {
  constructor() {
    if (!config.credentials.client_email || !config.credentials.private_key) {
      throw new Error('Missing required Google Drive credentials');
    }

    this.auth = new JWT({
      email: config.credentials.client_email,
      key: config.credentials.private_key,
      scopes: ['https://www.googleapis.com/auth/drive.readonly']
    });
    this.drive = google.drive({ version: 'v3', auth: this.auth });
  }

  async listFiles(folderId) {
    if (!folderId) {
      logger.error('Missing folder ID');
      throw new Error('Folder ID is required');
    }

    try {
      logger.info('Listing files', { folderId });
      const response = await this.drive.files.list({
        q: `'${folderId}' in parents and trashed = false`,
        fields: 'files(id, name, mimeType)',
        orderBy: 'name'
      });
      
      if (!response.data || !response.data.files) {
        logger.warn('No files found in response', { folderId });
        return [];
      }
      
      logger.info('Files retrieved successfully', { 
        count: response.data.files.length,
        folderId 
      });
      return response.data.files;
    } catch (error) {
      logger.error('Error listing files', error, { folderId });
      throw new Error(`Failed to list files: ${error.message}`);
    }
  }

  async getFile(fileId) {
    if (!fileId) {
      logger.error('Missing file ID');
      throw new Error('File ID is required');
    }

    try {
      logger.info('Getting file', { fileId });
      const response = await this.drive.files.get({
        fileId,
        alt: 'media'
      }, { responseType: 'stream' });

      if (!response || !response.data) {
        logger.error('File not found or empty response', null, { fileId });
        throw new Error('File not found');
      }

      return response;
    } catch (error) {
      logger.error('Error getting file', error, { fileId });
      throw new Error(`Failed to get file: ${error.message}`);
    }
  }
}