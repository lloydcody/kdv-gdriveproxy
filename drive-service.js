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

  async listFilesRecursively(folderId, path = []) {
    if (!folderId) {
      logger.error('Missing folder ID');
      throw new Error('Folder ID is required');
    }

    try {
      logger.info('Listing files recursively', { folderId, currentPath: path });
      const response = await this.drive.files.list({
        q: `'${folderId}' in parents and trashed = false`,
        fields: 'files(id, name, mimeType, parents, hasThumbnail)',
        orderBy: 'name'
      });
      
      if (!response.data || !response.data.files) {
        logger.warn('No files found in response', { folderId });
        return [];
      }

      const items = [];
      
      // Process each file/folder
      for (const file of response.data.files) {
        const item = {
          id: file.id,
          name: file.name,
          mimeType: file.mimeType,
          path: [...path, file.name],
          parentId: folderId,
          hasThumbnail: file.hasThumbnail
        };

        // If thumbnail is available, provide the proxy URL
        if (file.hasThumbnail) {
          item.thumbnailUrl = `/api/files/${file.id}/thumbnail`;
        }

        // If it's a folder, recursively get its contents
        if (file.mimeType === 'application/vnd.google-apps.folder') {
          item.type = 'folder';
          item.children = await this.listFilesRecursively(file.id, item.path);
        } else {
          item.type = 'file';
        }

        items.push(item);
      }
      
      logger.info('Files retrieved successfully', { 
        count: items.length,
        folderId 
      });

      return items;
    } catch (error) {
      logger.error('Error listing files recursively', error, { folderId });
      throw new Error(`Failed to list files: ${error.message}`);
    }
  }

  async getThumbnail(fileId) {
    if (!fileId) {
      logger.error('Missing file ID');
      throw new Error('File ID is required');
    }

    try {
      logger.info('Getting thumbnail', { fileId });
      const response = await this.drive.files.get({
        fileId,
        fields: 'thumbnailLink,hasThumbnail'
      });

      if (!response.data.hasThumbnail || !response.data.thumbnailLink) {
        throw new Error('No thumbnail available');
      }

      return response.data.thumbnailLink;
    } catch (error) {
      logger.error('Error getting thumbnail', error, { fileId });
      throw new Error(`Failed to get thumbnail: ${error.message}`);
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