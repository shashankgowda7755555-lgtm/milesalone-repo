// OCR Service using Tesseract.js for offline text extraction
import Tesseract from 'tesseract.js';

export interface OCRResult {
  text: string;
  confidence: number;
  words: Array<{
    text: string;
    confidence: number;
    bbox: { x0: number; y0: number; x1: number; y1: number };
  }>;
}

export class OCRService {
  private static instance: OCRService;
  private worker: Tesseract.Worker | null = null;
  private isInitialized = false;

  static getInstance(): OCRService {
    if (!OCRService.instance) {
      OCRService.instance = new OCRService();
    }
    return OCRService.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      this.worker = await Tesseract.createWorker('eng');

      this.isInitialized = true;
      console.log('OCR Service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize OCR service:', error);
      throw error;
    }
  }

  async extractText(imageFile: File | Blob | string): Promise<OCRResult> {
    if (!this.worker || !this.isInitialized) {
      await this.initialize();
    }

    try {
      const result = await this.worker!.recognize(imageFile);
      
      return {
        text: result.data.text.trim(),
        confidence: result.data.confidence,
        words: [], // Simplified for now
      };
    } catch (error) {
      console.error('OCR extraction failed:', error);
      throw new Error('Failed to extract text from image');
    }
  }

  // Extract receipt information with smart parsing
  async processReceipt(imageFile: File): Promise<{
    text: string;
    amount?: number;
    vendor?: string;
    date?: string;
    currency?: string;
  }> {
    const ocrResult = await this.extractText(imageFile);
    const text = ocrResult.text;

    return {
      text,
      amount: this.extractAmount(text),
      vendor: this.extractVendor(text),
      date: this.extractDate(text),
      currency: this.extractCurrency(text),
    };
  }

  // Extract screenshot text for gear module
  async processScreenshot(imageFile: File): Promise<{
    text: string;
    extractedData: any;
  }> {
    const ocrResult = await this.extractText(imageFile);
    
    return {
      text: ocrResult.text,
      extractedData: this.extractScreenshotData(ocrResult.text),
    };
  }

  private extractAmount(text: string): number | undefined {
    // Match various currency patterns: $123.45, €45,67, 123.45$, etc.
    const amountPatterns = [
      /[\$€£¥]\s*(\d{1,3}(?:[,.]?\d{3})*(?:[.,]\d{2})?)/g,
      /(\d{1,3}(?:[,.]?\d{3})*(?:[.,]\d{2})?)[\s]*[\$€£¥]/g,
      /total[:\s]*[\$€£¥]?\s*(\d{1,3}(?:[,.]?\d{3})*(?:[.,]\d{2})?)/gi,
      /amount[:\s]*[\$€£¥]?\s*(\d{1,3}(?:[,.]?\d{3})*(?:[.,]\d{2})?)/gi,
    ];

    for (const pattern of amountPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        const amountStr = matches[0].replace(/[^\d.,]/g, '');
        const amount = parseFloat(amountStr.replace(',', '.'));
        if (!isNaN(amount) && amount > 0) {
          return amount;
        }
      }
    }
    return undefined;
  }

  private extractVendor(text: string): string | undefined {
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    
    // Usually the vendor name is in the first few lines
    for (let i = 0; i < Math.min(3, lines.length); i++) {
      const line = lines[i].trim();
      if (line.length > 2 && line.length < 50 && !line.match(/^\d/)) {
        return line;
      }
    }
    return undefined;
  }

  private extractDate(text: string): string | undefined {
    const datePatterns = [
      /\d{1,2}\/\d{1,2}\/\d{2,4}/g,
      /\d{1,2}-\d{1,2}-\d{2,4}/g,
      /\d{2,4}-\d{1,2}-\d{1,2}/g,
      /\b\d{1,2}\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+\d{2,4}\b/gi,
    ];

    for (const pattern of datePatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[0];
      }
    }
    return undefined;
  }

  private extractCurrency(text: string): string | undefined {
    if (text.includes('$')) return 'USD';
    if (text.includes('€')) return 'EUR';
    if (text.includes('£')) return 'GBP';
    if (text.includes('¥')) return 'JPY';
    return 'USD'; // Default
  }

  private extractScreenshotData(text: string): any {
    // Basic data extraction from screenshots
    const urls = text.match(/https?:\/\/[^\s]+/g) || [];
    const emails = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g) || [];
    const numbers = text.match(/\b\d{3,}\b/g) || [];
    
    return { urls, emails, numbers };
  }

  async cleanup(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
      this.isInitialized = false;
    }
  }
}

export const ocrService = OCRService.getInstance();