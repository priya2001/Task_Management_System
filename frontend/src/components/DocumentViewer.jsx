import { useState, useEffect } from 'react'
import fileService from '../services/fileService'

/**
 * DocumentViewer Component
 * Displays attached documents/files for a task
 * Allows download and deletion
 */
export const DocumentViewer = ({ taskId, onFileDeleted, isOwner = false }) => {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [deletingFileId, setDeletingFileId] = useState(null)

  // Fetch files on component mount or when taskId changes
  useEffect(() => {
    if (taskId) {
      fetchFiles()
    }
  }, [taskId])

  const fetchFiles = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await fileService.getTaskFiles(taskId)
      
      if (response.success) {
        setFiles(response.data || [])
      } else {
        setFiles([])
      }
    } catch (err) {
      console.error('Error fetching files:', err)
      setError(err.message || 'Failed to load files')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async (fileId, originalName) => {
    try {
      await fileService.downloadFile(fileId, originalName)
    } catch (err) {
      console.error('Download error:', err)
      setError(err.message || 'Failed to download file')
    }
  }

  const handleDelete = async (fileId) => {
    if (!window.confirm('Are you sure you want to delete this file?')) {
      return
    }

    try {
      setDeletingFileId(fileId)
      const response = await fileService.deleteFile(fileId)
      
      if (response.success) {
        setFiles((prev) => prev.filter((f) => f._id !== fileId))
        if (onFileDeleted) {
          onFileDeleted(fileId)
        }
      }
    } catch (err) {
      console.error('Delete error:', err)
      setError(err.message || 'Failed to delete file')
    } finally {
      setDeletingFileId(null)
    }
  }

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return 'Unknown date'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-500">Loading files...</div>
      </div>
    )
  }

  if (files.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400">📄 No documents attached yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
          ⚠️ {error}
        </div>
      )}

      <div className="space-y-2">
        {files.map((file) => (
          <div
            key={file._id}
            className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-200 hover:bg-gray-100 transition"
          >
            {/* File Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-lg">📄</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {file.originalName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {fileService.formatFileSize(file.size)} • {formatDate(file.createdAt)}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 ml-2">
              <button
                onClick={() => handleDownload(file._id, file.originalName)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded transition"
                title="Download file"
              >
                ⬇️
              </button>

              {isOwner && (
                <button
                  onClick={() => handleDelete(file._id)}
                  disabled={deletingFileId === file._id}
                  className="p-2 text-red-600 hover:bg-red-50 rounded transition disabled:opacity-50"
                  title="Delete file"
                >
                  {deletingFileId === file._id ? '⏳' : '🗑️'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default DocumentViewer
