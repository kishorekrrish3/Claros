"use client";

import { useState } from "react";
import { Category } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, ArrowRight, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { importTransactionsFromCSV } from "@/actions/import-export";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Papa from "papaparse";

interface ImportWizardProps {
  categories: Category[];
}

export function ImportWizard({ categories }: ImportWizardProps) {
  const [step, setStep] = useState(1);
  const [csvText, setCsvText] = useState("");
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);

  const [mapping, setMapping] = useState<Record<string, string>>({
    date: "",
    amount: "",
    merchant: "",
    category: "",
    type: "",
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCsvText(event.target?.result as string);
      };
      reader.readAsText(file);
    }
  };

  const handleParse = () => {
    if (!csvText.trim()) {
      toast.error("Please provide CSV data");
      return;
    }

    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data.length === 0) {
          toast.error("No valid data found in CSV");
          return;
        }
        setHeaders(Object.keys(results.data[0] as any));
        setParsedData(results.data);
        
        // Auto-guess mapping
        const keys = Object.keys(results.data[0] as any);
        const guess = { ...mapping };
        keys.forEach(k => {
          const lower = k.toLowerCase();
          if (lower.includes("date")) guess.date = k;
          if (lower.includes("amount") || lower.includes("price")) guess.amount = k;
          if (lower.includes("merchant") || lower.includes("desc") || lower.includes("name")) guess.merchant = k;
          if (lower.includes("category")) guess.category = k;
          if (lower.includes("type")) guess.type = k;
        });
        setMapping(guess);
        setStep(2);
      },
      error: () => {
        toast.error("Failed to parse CSV");
      }
    });
  };

  const handleImport = async () => {
    if (!mapping.date || !mapping.amount || !mapping.merchant) {
      toast.error("Date, Amount, and Merchant are required fields");
      return;
    }

    setIsImporting(true);
    try {
      const transactionsToImport = parsedData.map(row => ({
        date: row[mapping.date],
        amount: parseFloat(row[mapping.amount]) || 0,
        merchantName: row[mapping.merchant],
        categoryName: mapping.category ? row[mapping.category] : "",
        type: mapping.type ? row[mapping.type] : "expense", // default to expense
      }));

      await importTransactionsFromCSV(transactionsToImport);
      toast.success(`Successfully imported ${transactionsToImport.length} transactions`);
      setStep(3);
    } catch (error) {
      toast.error("Failed to import transactions");
    } finally {
      setIsImporting(false);
    }
  };

  const reset = () => {
    setStep(1);
    setCsvText("");
    setParsedData([]);
  };

  return (
    <div className="border border-border/50 rounded-xl p-6 bg-card/50">
      <div className="flex items-center gap-4 mb-6">
        <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>1</div>
        <div className={`h-1 flex-1 ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
        <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>2</div>
        <div className={`h-1 flex-1 ${step >= 3 ? 'bg-primary' : 'bg-muted'}`} />
        <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>3</div>
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Upload CSV</h3>
          <p className="text-sm text-muted-foreground mb-4">Upload a bank statement or paste CSV text.</p>
          <div className="flex items-center gap-4 mb-4">
            <Input type="file" accept=".csv" onChange={handleFileUpload} className="max-w-xs" />
            <span className="text-sm text-muted-foreground">or</span>
          </div>
          <Textarea 
            placeholder="Paste CSV content here..." 
            className="h-32 font-mono text-xs"
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
          />
          <div className="flex justify-end mt-4">
            <Button onClick={handleParse} disabled={!csvText.trim()}>
              Next step <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <h3 className="text-lg font-medium">Map Columns</h3>
          <p className="text-sm text-muted-foreground">Match your CSV columns to Claros fields.</p>
          
          <div className="grid grid-cols-2 gap-4 max-w-2xl">
            {Object.entries({
              date: "Date (Required)",
              amount: "Amount (Required)",
              merchant: "Merchant (Required)",
              category: "Category (Optional)",
              type: "Type (Optional, income/expense)"
            }).map(([key, label]) => (
              <div key={key} className="space-y-2">
                <Label>{label}</Label>
                <Select value={mapping[key]} onValueChange={(val) => setMapping(prev => ({ ...prev, [key]: val }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select column..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">-- Skip --</SelectItem>
                    {headers.map(h => (
                      <SelectItem key={h} value={h}>{h}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>

          <div className="bg-muted p-4 rounded-lg overflow-auto max-h-48 border border-border/50">
            <h4 className="text-sm font-medium mb-2">Preview (first 2 rows)</h4>
            <pre className="text-xs">{JSON.stringify(parsedData.slice(0, 2), null, 2)}</pre>
          </div>

          <div className="flex justify-between mt-4">
            <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
            <Button onClick={handleImport} disabled={isImporting || !mapping.date || !mapping.amount || !mapping.merchant}>
              {isImporting ? "Importing..." : "Run Import"} <Upload className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="text-center py-8 space-y-4">
          <div className="flex justify-center">
            <CheckCircle2 className="h-16 w-16 text-emerald-500" />
          </div>
          <h3 className="text-xl font-medium">Import Complete!</h3>
          <p className="text-muted-foreground">Your transactions have been successfully imported.</p>
          <Button onClick={reset} variant="outline" className="mt-4">
            Import more
          </Button>
        </div>
      )}
    </div>
  );
}
