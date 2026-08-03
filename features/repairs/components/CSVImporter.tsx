"use client"

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Upload, FileText, AlertTriangle, CheckCircle } from 'lucide-react';

export function CSVImporter() {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<any>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const processCsv = async () => {
    if (!file) return;
    setImporting(true);
    
    try {
      const text = await file.text();
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      const rows = lines.slice(1).map(line => {
        const values = line.split(',');
        return headers.reduce((obj: any, header, i) => {
          obj[header] = values[i]?.trim();
          return obj;
        }, {});
      });

      const response = await fetch('/api/repairs/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows }),
      });

      const data = await response.json();
      setResults(data);
      toast.success(`Imported ${data.success} repairs successfully`);
    } catch (error) {
      toast.error('Failed to process CSV file');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-slate-50 dark:bg-slate-900">
      <div className="flex items-center gap-2">
        <FileText className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold">Bulk Import Repairs</h3>
      </div>
      
      <div className="grid w-full max-w-sm items-center gap-1.5">
        <Label htmlFor="csv-file">CSV File (Headers: imei, deviceModel, complaint, etc.)</Label>
        <Input id="csv-file" type="file" accept=".csv" onChange={handleFileChange} />
      </div>

      <Button onClick={processCsv} disabled={!file || importing}>
        {importing ? 'Importing...' : 'Start Import'}
        <Upload className="ml-2 h-4 w-4" />
      </Button>

      {results && (
        <div className="mt-4 space-y-2 text-sm">
          <div className="flex items-center text-green-600">
            <CheckCircle className="mr-2 h-4 w-4" />
            Success: {results.success}
          </div>
          <div className="flex items-center text-orange-600">
            <AlertTriangle className="mr-2 h-4 w-4" />
            Duplicates: {results.duplicates}
          </div>
          <div className="flex items-center text-red-600">
            <AlertTriangle className="mr-2 h-4 w-4" />
            Failed: {results.failed}
          </div>
          {results.errors.length > 0 && (
            <div className="mt-2 max-h-32 overflow-y-auto border p-2 rounded bg-white dark:bg-black text-xs">
              {results.errors.map((err: string, i: number) => (
                <div key={i} className="text-red-500">{err}</div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
