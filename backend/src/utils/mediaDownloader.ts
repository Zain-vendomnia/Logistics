// utils/mediaDownloader.ts
import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';

/**
 * Download media from Twilio URL and store locally
 * @param mediaUrl - Twilio media URL
 * @param contentType - Media content type (image/jpeg, etc.)
 * @param twilioSid - Message SID for unique naming
 * @returns Promise with success status and local URL
 */
export const downloadAndStoreMedia = async (
  mediaUrl: string, 
  contentType: string, 
  twilioSid: string
): Promise<{success: boolean, localUrl?: string, fileName?: string, fileType?: string, fileSize?: number, error?: string}> => {
  try {
    if (!mediaUrl || !contentType || !twilioSid) {
      return { success: false, error: 'Missing required parameters' };
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'uploads', 'whatsapp-media');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Generate filename based on content type
    const fileExtension = getFileExtension(contentType);
    const timestamp = Date.now();
    const filename = `wa_${twilioSid}_${timestamp}${fileExtension}`;
    const filePath = path.join(uploadsDir, filename);

    // Download file from Twilio
    const downloadResult = await downloadFile(mediaUrl, filePath);
    
    if (!downloadResult.success) {
      return { success: false, error: downloadResult.error };
    }

    // Generate public URL
    const baseUrl = process.env.HOST_URL || 'http://localhost:3000';
    const localUrl = `${baseUrl}/api/admin/messages/whatsapp-media/${filename}`;

    console.log('✅ Media downloaded successfully:', {
      originalUrl: mediaUrl,
      localUrl,
      filename,
      size: downloadResult.fileSize,
      contentType
    });

    return { 
      success: true, 
      localUrl,
      fileName: filename,
      fileSize: downloadResult.fileSize,
      fileType: contentType
    };

  } catch (error: any) {
    console.error('❌ Media download error:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
};

/**
 * Download file using Node.js built-in modules with Twilio authentication and redirect handling
 */
const downloadFile = (url: string, filePath: string, redirectCount: number = 0): Promise<{success: boolean, fileSize?: number, error?: string}> => {
  return new Promise((resolve) => {
    // Prevent infinite redirects
    if (redirectCount > 5) {
      resolve({ success: false, error: 'Too many redirects' });
      return;
    }

    const protocol = url.startsWith('https:') ? https : http;
    
    // Get Twilio credentials from environment
    const twilioSid = process.env.TWILIO_SID;
    const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
    
    if (!twilioSid || !twilioAuthToken) {
      resolve({ success: false, error: 'Missing Twilio credentials in environment variables' });
      return;
    }

    // Create Basic Auth header
    const auth = Buffer.from(`${twilioSid}:${twilioAuthToken}`).toString('base64');
    
    const options = {
      headers: {
        'Authorization': `Basic ${auth}`,
        'User-Agent': 'WhatsApp-Media-Downloader/1.0'
      }
    };
    
    const request = protocol.get(url, options, (response) => {
      if (response.statusCode === 401) {
        resolve({ success: false, error: 'Unauthorized - Check Twilio credentials' });
        return;
      }
      
      // Handle redirects (301, 302, 307, 308)
      if (response.statusCode && [301, 302, 307, 308].includes(response.statusCode)) {
        const redirectUrl = response.headers.location;
        if (redirectUrl) {
          console.log(`🔄 Following redirect ${response.statusCode} to: ${redirectUrl}`);
          // Follow redirect recursively
          downloadFile(redirectUrl, filePath, redirectCount + 1)
            .then(resolve)
            .catch((error) => resolve({ success: false, error: error.message }));
          return;
        } else {
          resolve({ success: false, error: `Redirect ${response.statusCode} without location header` });
          return;
        }
      }
      
      if (response.statusCode !== 200) {
        resolve({ success: false, error: `HTTP ${response.statusCode}: ${response.statusMessage}` });
        return;
      }

      const fileStream = fs.createWriteStream(filePath);
      let fileSize = 0;

      response.on('data', (chunk) => {
        fileSize += chunk.length;
      });

      response.pipe(fileStream);

      fileStream.on('finish', () => {
        fileStream.close();
        resolve({ success: true, fileSize });
      });

      fileStream.on('error', (error) => {
        fs.unlink(filePath, () => {}); // Delete partial file
        resolve({ success: false, error: error.message });
      });
    });

    request.on('error', (error) => {
      resolve({ success: false, error: error.message });
    });

    request.setTimeout(30000, () => {
      request.destroy();
      resolve({ success: false, error: 'Download timeout' });
    });
  });
};

/**
 * Get file extension from content type
 */
const getFileExtension = (contentType: string): string => {
  const extensions: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'video/mp4': '.mp4',
    'video/quicktime': '.mov',
    'audio/mpeg': '.mp3',
    'audio/mp4': '.m4a',
    'audio/ogg': '.ogg',
    'application/pdf': '.pdf',
    'application/msword': '.doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
    'text/plain': '.txt'
  };
  
  return extensions[contentType] || '.bin';
};

/**
 * Clean up old media files (optional - run as a cron job)
 */
export const cleanupOldMedia = async (daysOld: number = 30): Promise<void> => {
  try {
    const mediaDir = path.join(process.cwd(), 'uploads', 'whatsapp-media');
    if (!fs.existsSync(mediaDir)) return;

    const files = fs.readdirSync(mediaDir);
    const cutoffDate = Date.now() - (daysOld * 24 * 60 * 60 * 1000);

    let deletedCount = 0;
    files.forEach(file => {
      const filePath = path.join(mediaDir, file);
      const stats = fs.statSync(filePath);
      
      if (stats.mtime.getTime() < cutoffDate) {
        fs.unlinkSync(filePath);
        deletedCount++;
      }
    });

    console.log(`🧹 Cleaned up ${deletedCount} old media files`);
  } catch (error) {
    console.error('❌ Cleanup error:', error);
  }
};