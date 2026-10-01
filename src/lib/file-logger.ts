/**
 * File Operation Logger - Track uploads, downloads, and file management
 * 
 * Purpose: Monitor file operations for security and compliance
 * Stores in audit_logs table with file_operation action
 */

import { writeAuditLog } from '@/lib/audit-log';
import { query as dbQuery } from '@/lib/db';

interface FileOperationData {
  operation: 'upload' | 'download' | 'delete' | 'move' | 'rename';
  userId: string;
  fileName: string;
  fileSize: number;
  fileMimeType: string;
  filePath: string;
  category?: string; // e.g., 'news', 'media', 'publications'
  details?: Record<string, any>;
  request: Request;
}

/**
 * Log file upload operation
 * @param data Upload details
 * 
 * Usage:
 * ```typescript
 * await logFileUpload({
 *   operation: 'upload',
 *   userId: adminUser,
 *   fileName: 'article.pdf',
 *   fileSize: 1024000,
 *   fileMimeType: 'application/pdf',
 *   filePath: 'uploads/news/article.pdf',
 *   category: 'news',
 *   request,
 * });
 * ```
 */
export async function logFileUpload(data: FileOperationData): Promise<void> {
  try {
    // Log in audit trail
    await writeAuditLog({
      request: data.request,
      username: data.userId,
      action: 'file_upload',
      category: 'files',
      targetType: 'file',
      targetId: data.filePath,
      targetTitle: data.fileName,
      detail: {
        file_size_bytes: data.fileSize,
        mime_type: data.fileMimeType,
        category: data.category,
        ...data.details,
      },
    });

    // Also create file_operations record for specialized queries
    await dbQuery(
      `INSERT INTO file_operations 
       (operation_type, user_id, file_name, file_size, mime_type, file_path, category, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
      [
        'upload',
        data.userId,
        data.fileName,
        data.fileSize,
        data.fileMimeType,
        data.filePath,
        data.category || null,
        'success',
      ]
    );
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[File Upload Logger Error]', error);
    }
  }
}

/**
 * Log file download operation
 * @param data Download details
 */
export async function logFileDownload(data: FileOperationData): Promise<void> {
  try {
    await writeAuditLog({
      request: data.request,
      username: data.userId,
      action: 'file_download',
      category: 'files',
      targetType: 'file',
      targetId: data.filePath,
      targetTitle: data.fileName,
      detail: {
        file_size_bytes: data.fileSize,
        mime_type: data.fileMimeType,
        category: data.category,
        ...data.details,
      },
    });

    await dbQuery(
      `INSERT INTO file_operations 
       (operation_type, user_id, file_name, file_size, mime_type, file_path, category, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
      [
        'download',
        data.userId,
        data.fileName,
        data.fileSize,
        data.fileMimeType,
        data.filePath,
        data.category || null,
        'success',
      ]
    );
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[File Download Logger Error]', error);
    }
  }
}

/**
 * Log file deletion
 * @param data Deletion details
 */
export async function logFileDelete(data: FileOperationData): Promise<void> {
  try {
    await writeAuditLog({
      request: data.request,
      username: data.userId,
      action: 'file_delete',
      category: 'files',
      targetType: 'file',
      targetId: data.filePath,
      targetTitle: data.fileName,
      detail: {
        file_size_bytes: data.fileSize,
        mime_type: data.fileMimeType,
        category: data.category,
        ...data.details,
      },
    });

    await dbQuery(
      `INSERT INTO file_operations 
       (operation_type, user_id, file_name, file_size, mime_type, file_path, category, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
      [
        'delete',
        data.userId,
        data.fileName,
        data.fileSize,
        data.fileMimeType,
        data.filePath,
        data.category || null,
        'success',
      ]
    );
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[File Delete Logger Error]', error);
    }
  }
}

/**
 * Get file operation statistics
 * Usage: For security audits, compliance reports
 */
export async function getFileOperationStats(
  userId?: string,
  hours: number = 24
): Promise<{
  uploads: number;
  downloads: number;
  deletes: number;
  totalSize: number;
} | null> {
  try {
    let whereClause = 'WHERE created_at >= NOW() - INTERVAL \'1 hour\' * $1';
    let params: any[] = [hours];

    if (userId) {
      whereClause += ' AND user_id = $2';
      params.push(userId);
    }

    const result = await dbQuery(
      `SELECT 
        COUNT(*) FILTER (WHERE operation_type = 'upload') as uploads,
        COUNT(*) FILTER (WHERE operation_type = 'download') as downloads,
        COUNT(*) FILTER (WHERE operation_type = 'delete') as deletes,
        COALESCE(SUM(file_size), 0) as total_size
       FROM file_operations
       ${whereClause}
       AND created_at >= NOW() - INTERVAL '120 days'`,
      params
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      uploads: row.uploads || 0,
      downloads: row.downloads || 0,
      deletes: row.deletes || 0,
      totalSize: row.total_size || 0,
    };
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[File Stats Error]', error);
    }
    return null;
  }
}
