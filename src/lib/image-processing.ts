// Image processing service using browser-image-compression
import imageCompression from 'browser-image-compression';

export interface ImageProcessingOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  useWebWorker?: boolean;
  quality?: number;
}

export interface ProcessedImage {
  file: File;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  dataUrl: string;
}

export class ImageProcessingService {
  private static instance: ImageProcessingService;
  
  static getInstance(): ImageProcessingService {
    if (!ImageProcessingService.instance) {
      ImageProcessingService.instance = new ImageProcessingService();
    }
    return ImageProcessingService.instance;
  }

  // Compress and optimize image for storage
  async processImage(
    file: File, 
    options: ImageProcessingOptions = {}
  ): Promise<ProcessedImage> {
    const {
      maxSizeMB = 1,
      maxWidthOrHeight = 1920,
      useWebWorker = true,
      quality = 0.8
    } = options;

    try {
      const originalSize = file.size;
      
      const compressionOptions = {
        maxSizeMB,
        maxWidthOrHeight,
        useWebWorker,
        initialQuality: quality,
        alwaysKeepResolution: false,
        fileType: file.type.includes('png') ? 'image/png' : 'image/jpeg',
      };

      const compressedFile = await imageCompression(file, compressionOptions);
      const dataUrl = await this.fileToDataUrl(compressedFile);
      
      return {
        file: compressedFile,
        originalSize,
        compressedSize: compressedFile.size,
        compressionRatio: originalSize / compressedFile.size,
        dataUrl
      };
    } catch (error) {
      console.error('Image processing failed:', error);
      // Fallback: return original file with data URL
      const dataUrl = await this.fileToDataUrl(file);
      return {
        file,
        originalSize: file.size,
        compressedSize: file.size,
        compressionRatio: 1,
        dataUrl
      };
    }
  }

  // Process multiple images
  async processMultipleImages(
    files: File[], 
    options: ImageProcessingOptions = {}
  ): Promise<ProcessedImage[]> {
    const promises = files.map(file => this.processImage(file, options));
    return Promise.all(promises);
  }

  // Create thumbnail
  async createThumbnail(file: File, size: number = 200): Promise<ProcessedImage> {
    return this.processImage(file, {
      maxSizeMB: 0.1,
      maxWidthOrHeight: size,
      quality: 0.7
    });
  }

  // Resize image to specific dimensions
  async resizeImage(
    file: File, 
    width: number, 
    height: number
  ): Promise<ProcessedImage> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = async () => {
        canvas.width = width;
        canvas.height = height;
        
        if (ctx) {
          // Draw image with proper scaling
          const scaleX = width / img.width;
          const scaleY = height / img.height;
          const scale = Math.min(scaleX, scaleY);
          
          const scaledWidth = img.width * scale;
          const scaledHeight = img.height * scale;
          const x = (width - scaledWidth) / 2;
          const y = (height - scaledHeight) / 2;
          
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
          
          canvas.toBlob(async (blob) => {
            if (blob) {
              const resizedFile = new File([blob], file.name, { type: file.type });
              const dataUrl = await this.fileToDataUrl(resizedFile);
              
              resolve({
                file: resizedFile,
                originalSize: file.size,
                compressedSize: resizedFile.size,
                compressionRatio: file.size / resizedFile.size,
                dataUrl
              });
            } else {
              reject(new Error('Failed to resize image'));
            }
          }, file.type, 0.8);
        } else {
          reject(new Error('Canvas context not available'));
        }
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }

  // Extract EXIF data
  async extractExifData(file: File): Promise<any> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        try {
          // Basic EXIF extraction (limited without external library)
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (ctx) {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            
            resolve({
              width: img.width,
              height: img.height,
              size: file.size,
              type: file.type,
              lastModified: file.lastModified
            });
          } else {
            resolve({});
          }
        } catch (error) {
          resolve({});
        }
      };
      
      img.onerror = () => resolve({});
      img.src = URL.createObjectURL(file);
    });
  }

  // Convert file to data URL
  private fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Convert data URL to blob
  dataUrlToBlob(dataUrl: string): Blob {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)![1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    
    return new Blob([u8arr], { type: mime });
  }

  // Generate image variations for responsive display
  async generateImageVariations(file: File): Promise<{
    thumbnail: ProcessedImage;
    small: ProcessedImage;
    medium: ProcessedImage;
    large: ProcessedImage;
  }> {
    const [thumbnail, small, medium, large] = await Promise.all([
      this.processImage(file, { maxWidthOrHeight: 150, maxSizeMB: 0.05 }),
      this.processImage(file, { maxWidthOrHeight: 400, maxSizeMB: 0.2 }),
      this.processImage(file, { maxWidthOrHeight: 800, maxSizeMB: 0.5 }),
      this.processImage(file, { maxWidthOrHeight: 1920, maxSizeMB: 1.5 })
    ]);
    
    return { thumbnail, small, medium, large };
  }

  // Check if file is an image
  isImageFile(file: File): boolean {
    return file.type.startsWith('image/');
  }

  // Get optimal image size for different use cases
  getOptimalSize(useCase: 'thumbnail' | 'gallery' | 'fullscreen' | 'print'): ImageProcessingOptions {
    const sizeMap = {
      thumbnail: { maxWidthOrHeight: 200, maxSizeMB: 0.05, quality: 0.7 },
      gallery: { maxWidthOrHeight: 800, maxSizeMB: 0.3, quality: 0.8 },
      fullscreen: { maxWidthOrHeight: 1920, maxSizeMB: 1, quality: 0.85 },
      print: { maxWidthOrHeight: 3000, maxSizeMB: 3, quality: 0.95 }
    };
    
    return sizeMap[useCase];
  }
}

export const imageProcessing = ImageProcessingService.getInstance();