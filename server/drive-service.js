import { google } from 'googleapis';
import { JWT } from 'google-auth-library';
import { config } from './config.js';
import { logger } from './utils/logger.js';
import { createVersionHash } from './utils/version-hash.js';

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
        fields: 'files(id, name, mimeType, parents, hasThumbnail, modifiedTime, md5Checksum, size)',
        orderBy: 'name'
      });
      
      if (!response.data || !response.data.files) {
        logger.warn('No files found in response', { folderId });
        return [];
      }

      const items = [];
      
      for (const file of response.data.files) {
        const item = {
          id: file.id,
          name: file.name,
          mimeType: file.mimeType,
          path: [...path, file.name],
          parentId: folderId,
          hasThumbnail: file.hasThumbnail,
          modifiedTime: file.modifiedTime,
          size: file.size,
          versionHash: createVersionHash({
            modifiedTime: file.modifiedTime,
            name: file.name,
            size: file.size,
            md5Checksum: file.md5Checksum
          })
        };

        if (file.hasThumbnail) {
          item.thumbnailUrl = `/api/files/${file.id}/thumbnail`;
        }

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

  // ... rest of the class implementation remains the same ...
}