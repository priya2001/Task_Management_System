import api from './authService';

/**
 * File Service
 * Handles all file-related API calls (upload, download, delete, get metadata)
 */

const fileService = {
  /**
   * Upload files to a task
   * @param {string} taskId - Task ID
   * @param {FileList} files - Files to upload
   * @param {string} description - Optional description
   * @returns {Promise}
   */
  uploadFiles: async (taskId, files, description = '') => {
    try {
      console.log('📤 uploadFiles called', { taskId, filesCount: files?.length, description });
      
      const formData = new FormData();
      
      // Add files
      if (files && files.length > 0) {
        for (let i = 0; i < files.length; i++) {
          console.log(`   Adding file ${i + 1}:`, files[i].name);
          formData.append('files', files[i]);
        }
      }
      
      // Add description if provided
      if (description) {
        formData.append('description', description);
      }

      console.log('📤 Sending POST request to', `/api/files/${taskId}/upload`);
      const response = await api.post(
        `/api/files/${taskId}/upload`,
        formData
      );

      console.log('✓ Upload response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ File upload error:', error.response?.data || error.message);
      throw error.response?.data || { 
        success: false, 
        message: error.message 
      };
    }
  },

  /**
   * Get all files for a task
   * @param {string} taskId - Task ID
   * @returns {Promise}
   */
  getTaskFiles: async (taskId) => {
    try {
      const response = await api.get(
        `/api/files/${taskId}`
      );
      return response.data;
    } catch (error) {
      console.error('Get files error:', error);
      throw error.response?.data || { 
        success: false, 
        message: error.message 
      };
    }
  },

  /**
   * Download a specific file
   * @param {string} fileId - File ID
   * @param {string} fileName - Original file name for download
   */
  downloadFile: async (fileId, fileName = 'document.pdf') => {
    try {
      const response = await api.get(
        `/api/files/file/${fileId}/download`,
        {
          responseType: 'blob',
        }
      );

      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.parentElement.removeChild(link);
      window.URL.revokeObjectURL(url);

      return { success: true, message: 'File downloaded' };
    } catch (error) {
      console.error('Download error:', error);
      throw error.response?.data || { 
        success: false, 
        message: error.message 
      };
    }
  },

  /**
   * Get file metadata
   * @param {string} fileId - File ID
   * @returns {Promise}
   */
  getFileMetadata: async (fileId) => {
    try {
      const response = await api.get(
        `/api/files/file/${fileId}`
      );
      return response.data;
    } catch (error) {
      console.error('Get file metadata error:', error);
      throw error.response?.data || { 
        success: false, 
        message: error.message 
      };
    }
  },

  /**
   * Delete a file
   * @param {string} fileId - File ID
   * @returns {Promise}
   */
  deleteFile: async (fileId) => {
    try {
      const response = await api.delete(
        `/api/files/file/${fileId}`
      );
      return response.data;
    } catch (error) {
      console.error('Delete file error:', error);
      throw error.response?.data || { 
        success: false, 
        message: error.message 
      };
    }
  },

  /**
   * Format file size for display
   * @param {number} bytes - File size in bytes
   * @returns {string}
   */
  formatFileSize: (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  },

  /**
   * Validate file
   * @param {File} file - File to validate
   * @returns {object} - { valid: boolean, error?: string }
   */
  validateFile: (file) => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    // Check file type
    if (file.type !== 'application/pdf') {
      return { 
        valid: false, 
        error: 'Only PDF files are allowed' 
      };
    }

    // Check file extension
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      return { 
        valid: false, 
        error: 'Only PDF files are allowed' 
      };
    }

    // Check file size
    if (file.size > maxSize) {
      return { 
        valid: false, 
        error: `File size must be less than ${fileService.formatFileSize(maxSize)}` 
      };
    }

    return { valid: true };
  },
};

export default fileService;
