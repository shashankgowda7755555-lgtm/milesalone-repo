// Export/Import service for offline data management with PDF generation
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { database } from './database';

export interface ExportOptions {
  format: 'json' | 'csv' | 'pdf';
  modules?: string[];
  dateRange?: { start: string; end: string };
  includeMedia?: boolean;
}

export interface ImportResult {
  success: boolean;
  imported: number;
  errors: string[];
}

export class ExportImportService {
  private static instance: ExportImportService;

  static getInstance(): ExportImportService {
    if (!ExportImportService.instance) {
      ExportImportService.instance = new ExportImportService();
    }
    return ExportImportService.instance;
  }

  // Export all data or specific modules
  async exportData(options: ExportOptions): Promise<Blob> {
    const { format, modules, dateRange, includeMedia = false } = options;
    
    const allModules = [
      'travelPins', 'people', 'journalEntries', 'expenses',
      'checklistItems', 'learningEntries', 'foodEntries', 'gearItems'
    ];
    
    const targetModules = modules || allModules;
    const exportData: any = {
      exportDate: new Date().toISOString(),
      version: '1.0',
      modules: {}
    };

    // Collect data from each module
    for (const moduleName of targetModules) {
      try {
        let moduleData = await database.getAll<any>(moduleName);
        
        // Apply date filter if specified
        if (dateRange) {
          moduleData = moduleData.filter((item: any) => {
            const itemDate = new Date(item.createdAt);
            const startDate = new Date(dateRange.start);
            const endDate = new Date(dateRange.end);
            return itemDate >= startDate && itemDate <= endDate;
          });
        }
        
        // Remove media if not included
        if (!includeMedia) {
          moduleData = moduleData.map((item: any) => {
            const cleanItem = { ...item };
            delete cleanItem.photos;
            delete cleanItem.files;
            return cleanItem;
          });
        }
        
        exportData.modules[moduleName] = moduleData;
      } catch (error) {
        console.error(`Failed to export ${moduleName}:`, error);
        exportData.modules[moduleName] = [];
      }
    }

    // Generate output based on format
    switch (format) {
      case 'json':
        return new Blob([JSON.stringify(exportData, null, 2)], { 
          type: 'application/json' 
        });
      
      case 'csv':
        return this.generateCSV(exportData);
      
      case 'pdf':
        return this.generatePDF(exportData);
      
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  // Import data from uploaded file
  async importData(file: File): Promise<ImportResult> {
    try {
      const content = await file.text();
      const data = JSON.parse(content);
      
      if (!data.modules) {
        throw new Error('Invalid import file format');
      }

      let imported = 0;
      const errors: string[] = [];

      // Import each module
      for (const [moduleName, moduleData] of Object.entries(data.modules)) {
        if (!Array.isArray(moduleData)) continue;
        
        try {
          for (const item of moduleData as any[]) {
            // Generate new ID to avoid conflicts
            const newItem = {
              ...item,
              id: `imported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              updatedAt: new Date().toISOString()
            };
            
            await database.add(moduleName, newItem);
            imported++;
          }
        } catch (error) {
          errors.push(`Failed to import ${moduleName}: ${error}`);
        }
      }

      return { success: true, imported, errors };
    } catch (error) {
      return { 
        success: false, 
        imported: 0, 
        errors: [`Import failed: ${error}`] 
      };
    }
  }

  // Generate trip report PDF
  async generateTripReport(options?: {
    title?: string;
    dateRange?: { start: string; end: string };
  }): Promise<Blob> {
    const { title = 'Travel Report', dateRange } = options || {};
    
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    let page = pdfDoc.addPage([595.28, 841.89]); // A4 size
    let yPosition = 750;
    
    // Helper function to add text
    const addText = (text: string, options: any = {}) => {
      const { fontSize = 12, fontType = font, color = rgb(0, 0, 0) } = options;
      
      if (yPosition < 50) {
        page = pdfDoc.addPage([595.28, 841.89]);
        yPosition = 750;
      }
      
      page.drawText(text, {
        x: 50,
        y: yPosition,
        size: fontSize,
        font: fontType,
        color
      });
      
      yPosition -= fontSize + 5;
    };

    // Title
    addText(title, { fontSize: 24, fontType: boldFont, color: rgb(0.2, 0.4, 0.8) });
    addText(`Generated on: ${new Date().toLocaleDateString()}`, { fontSize: 10 });
    yPosition -= 20;

    // Travel Pins Summary
    const pins = await database.getAll<any>('travelPins');
    addText('Travel Destinations', { fontSize: 16, fontType: boldFont });
    addText(`Total places: ${pins.length}`);
    
    const statusCounts = pins.reduce((acc: any, pin: any) => {
      acc[pin.status] = (acc[pin.status] || 0) + 1;
      return acc;
    }, {});
    
    Object.entries(statusCounts).forEach(([status, count]) => {
      addText(`  ${status}: ${count}`);
    });
    yPosition -= 10;

    // Journal Entries
    const journal = await database.getAll<any>('journalEntries');
    addText('Journal Entries', { fontSize: 16, fontType: boldFont });
    addText(`Total entries: ${journal.length}`);
    
    journal.slice(0, 5).forEach((entry: any) => {
      addText(`• ${entry.title}`, { fontSize: 10 });
      if (entry.location) {
        addText(`  Location: ${entry.location}`, { fontSize: 9 });
      }
      addText(`  Date: ${new Date(entry.createdAt).toLocaleDateString()}`, { fontSize: 9 });
    });
    yPosition -= 10;

    // Expenses Summary
    const expenses = await database.getAll<any>('expenses');
    addText('Expenses Summary', { fontSize: 16, fontType: boldFont });
    
    const totalExpenses = expenses.reduce((sum: number, exp: any) => sum + (exp.amount || 0), 0);
    addText(`Total spent: $${totalExpenses.toFixed(2)}`);
    
    const expensesByCategory = expenses.reduce((acc: any, exp: any) => {
      acc[exp.category] = (acc[exp.category] || 0) + (exp.amount || 0);
      return acc;
    }, {});
    
    Object.entries(expensesByCategory).forEach(([category, amount]) => {
      addText(`  ${category}: $${(amount as number).toFixed(2)}`);
    });
    yPosition -= 10;

    // People Met
    const people = await database.getAll<any>('people');
    addText('People Met', { fontSize: 16, fontType: boldFont });
    addText(`Total contacts: ${people.length}`);
    
    people.slice(0, 10).forEach((person: any) => {
      addText(`• ${person.name}${person.location ? ` (${person.location})` : ''}`, { fontSize: 10 });
    });

    return new Blob([await pdfDoc.save()], { type: 'application/pdf' });
  }

  private async generateCSV(data: any): Promise<Blob> {
    let csvContent = '';
    
    // Generate CSV for each module
    for (const [moduleName, moduleData] of Object.entries(data.modules)) {
      if (!Array.isArray(moduleData) || moduleData.length === 0) continue;
      
      csvContent += `\n=== ${moduleName.toUpperCase()} ===\n`;
      
      // Get headers from first item
      const headers = Object.keys(moduleData[0]);
      csvContent += headers.join(',') + '\n';
      
      // Add data rows
      moduleData.forEach((item: any) => {
        const row = headers.map(header => {
          const value = item[header];
          if (Array.isArray(value)) {
            return `"${value.join('; ')}"`;
          }
          if (typeof value === 'string' && value.includes(',')) {
            return `"${value}"`;
          }
          return value || '';
        });
        csvContent += row.join(',') + '\n';
      });
      
      csvContent += '\n';
    }
    
    return new Blob([csvContent], { type: 'text/csv' });
  }

  private async generatePDF(data: any): Promise<Blob> {
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    let page = pdfDoc.addPage([595.28, 841.89]);
    let yPosition = 750;
    
    const addText = (text: string, options: any = {}) => {
      const { fontSize = 10, fontType = font } = options;
      
      if (yPosition < 50) {
        page = pdfDoc.addPage([595.28, 841.89]);
        yPosition = 750;
      }
      
      page.drawText(text, {
        x: 50,
        y: yPosition,
        size: fontSize,
        font: fontType
      });
      
      yPosition -= fontSize + 3;
    };

    // Title
    addText('Travel Companion Data Export', { fontSize: 16, fontType: boldFont });
    addText(`Export Date: ${data.exportDate}`, { fontSize: 10 });
    yPosition -= 10;

    // Add data for each module
    for (const [moduleName, moduleData] of Object.entries(data.modules)) {
      if (!Array.isArray(moduleData) || moduleData.length === 0) continue;
      
      addText(moduleName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()), { 
        fontSize: 14, 
        fontType: boldFont 
      });
      
      moduleData.slice(0, 20).forEach((item: any) => {
        const title = item.title || item.name || 'Untitled';
        addText(`• ${title}`, { fontSize: 9 });
        
        if (item.description) {
          const desc = item.description.substring(0, 100) + (item.description.length > 100 ? '...' : '');
          addText(`  ${desc}`, { fontSize: 8 });
        }
        
        addText(`  Date: ${new Date(item.createdAt).toLocaleDateString()}`, { fontSize: 8 });
      });
      
      if (moduleData.length > 20) {
        addText(`... and ${moduleData.length - 20} more items`, { fontSize: 8 });
      }
      
      yPosition -= 10;
    }
    
    return new Blob([await pdfDoc.save()], { type: 'application/pdf' });
  }

  // Download file helper
  downloadFile(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

export const exportImportService = ExportImportService.getInstance();