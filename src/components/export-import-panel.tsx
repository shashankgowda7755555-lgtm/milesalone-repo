import { useState } from 'react';
import { Download, Upload, FileText, Database, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { exportImportService } from '@/lib/export-import-service';
import { useToast } from '@/hooks/use-toast';

export function ExportImportPanel() {
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<'json' | 'csv' | 'pdf'>('json');
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [includeMedia, setIncludeMedia] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const modules = [
    { id: 'travelPins', name: 'Travel Pins', icon: '📍' },
    { id: 'people', name: 'People Met', icon: '👥' },
    { id: 'journalEntries', name: 'Journal', icon: '📝' },
    { id: 'expenses', name: 'Expenses', icon: '💰' },
    { id: 'checklistItems', name: 'Checklists', icon: '✅' },
    { id: 'learningEntries', name: 'Learning', icon: '🎓' },
    { id: 'foodEntries', name: 'Food & Water', icon: '🍽️' },
    { id: 'gearItems', name: 'Gear', icon: '🎒' },
  ];

  const handleExport = async () => {
    if (selectedModules.length === 0) {
      toast({
        title: "No modules selected",
        description: "Please select at least one module to export",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const blob = await exportImportService.exportData({
        format: exportFormat,
        modules: selectedModules,
        includeMedia
      });

      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `travel-companion-${timestamp}.${exportFormat}`;
      
      exportImportService.downloadFile(blob, filename);
      
      toast({
        title: "Export successful",
        description: `Data exported as ${filename}`,
      });
      
      setIsExportOpen(false);
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      const result = await exportImportService.importData(file);
      
      if (result.success) {
        toast({
          title: "Import successful",
          description: `Imported ${result.imported} items`,
        });
        
        if (result.errors.length > 0) {
          console.warn('Import warnings:', result.errors);
        }
      } else {
        toast({
          title: "Import failed",
          description: result.errors[0] || "Unknown error",
          variant: "destructive",
        });
      }
      
      setIsImportOpen(false);
    } catch (error) {
      toast({
        title: "Import failed",
        description: "Failed to import data. Please check the file format.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      // Reset input
      event.target.value = '';
    }
  };

  const generateTripReport = async () => {
    setIsProcessing(true);
    try {
      const blob = await exportImportService.generateTripReport({
        title: `Travel Report - ${new Date().getFullYear()}`
      });
      
      const filename = `trip-report-${new Date().toISOString().split('T')[0]}.pdf`;
      exportImportService.downloadFile(blob, filename);
      
      toast({
        title: "Trip report generated",
        description: `Downloaded ${filename}`,
      });
    } catch (error) {
      toast({
        title: "Report generation failed",
        description: "Failed to generate trip report",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleModule = (moduleId: string) => {
    setSelectedModules(prev => 
      prev.includes(moduleId) 
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Data Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Export Section */}
        <Dialog open={isExportOpen} onOpenChange={setIsExportOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Export Travel Data</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label>Export Format</Label>
                <Select value={exportFormat} onValueChange={(value: any) => setExportFormat(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="json">JSON (Full Data)</SelectItem>
                    <SelectItem value="csv">CSV (Spreadsheet)</SelectItem>
                    <SelectItem value="pdf">PDF (Report)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Select Modules</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {modules.map(module => (
                    <div key={module.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={module.id}
                        checked={selectedModules.includes(module.id)}
                        onCheckedChange={() => toggleModule(module.id)}
                      />
                      <Label htmlFor={module.id} className="text-sm flex items-center gap-1">
                        <span>{module.icon}</span>
                        {module.name}
                      </Label>
                    </div>
                  ))}
                </div>
                <Button 
                  variant="link" 
                  className="p-0 h-auto text-xs"
                  onClick={() => setSelectedModules(modules.map(m => m.id))}
                >
                  Select All
                </Button>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeMedia"
                  checked={includeMedia}
                  onCheckedChange={(checked) => setIncludeMedia(!!checked)}
                />
                <Label htmlFor="includeMedia" className="text-sm">
                  Include photos and files
                </Label>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={handleExport} 
                  disabled={isProcessing}
                  className="flex-1"
                >
                  {isProcessing ? 'Exporting...' : 'Export'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsExportOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Import Section */}
        <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full">
              <Upload className="h-4 w-4 mr-2" />
              Import Data
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Import Travel Data</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                  id="import-file"
                  disabled={isProcessing}
                />
                <Label htmlFor="import-file" className="cursor-pointer">
                  <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <div className="text-sm">
                    {isProcessing ? 'Importing...' : 'Click to select JSON file'}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Only JSON exports are supported
                  </div>
                </Label>
              </div>

              <div className="text-xs text-muted-foreground">
                <strong>Note:</strong> Imported items will be added to your existing data. 
                Duplicates may be created.
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Trip Report */}
        <Button 
          variant="outline" 
          className="w-full"
          onClick={generateTripReport}
          disabled={isProcessing}
        >
          <BookOpen className="h-4 w-4 mr-2" />
          {isProcessing ? 'Generating...' : 'Generate Trip Report'}
        </Button>

        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>Export:</strong> Download your data for backup or sharing</p>
          <p><strong>Import:</strong> Restore data from previous exports</p>
          <p><strong>Trip Report:</strong> Create a beautiful PDF summary</p>
        </div>
      </CardContent>
    </Card>
  );
}