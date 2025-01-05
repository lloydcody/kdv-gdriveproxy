import crypto from 'crypto';

/**
 * Creates a version hash for a file based on its metadata
 * @param {Object} fileMetadata File metadata from Google Drive
 * @param {string} fileMetadata.modifiedTime Last modified timestamp
 * @param {string} fileMetadata.name File name
 * @param {string} fileMetadata.size File size in bytes
 * @param {string} [fileMetadata.md5Checksum] MD5 checksum if available
 * @returns {string} Version hash
 */
export function createVersionHash(fileMetadata) {
  const components = [
    fileMetadata.modifiedTime,
    fileMetadata.name,
    fileMetadata.size || '0'
  ];

  // Include MD5 checksum if available (not available for Google Docs)
  if (fileMetadata.md5Checksum) {
    components.push(fileMetadata.md5Checksum);
  }

  // Create a hash of all components
  return crypto
    .createHash('sha256')
    .update(components.join('::'))
    .digest('hex');
}