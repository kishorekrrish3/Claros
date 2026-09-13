"use client";

import { useState } from "react";
import { format, subMonths } from "date-fns";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { getTransactions } from "@/actions/transactions"; // assuming this exists or use a generic fetch
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function PdfReport() {
  const [selectedMonth, setSelectedMonth] = useState(() => format(new Date(), "yyyy-MM"));
  const [isGenerating, setIsGenerating] = useState(false);

  const months = Array.from({ length: 12 }).map((_, i) => {
    const d = subMonths(new Date(), i);
    return {
      value: format(d, "yyyy-MM"),
      label: format(d, "MMMM yyyy"),
    };
  });

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      // In a real scenario, you'd fetch stats and transactions for the month.
      // For now, we simulate the fetch or you can implement the action.
      // const data = await getTransactions(selectedMonth);
      
      const doc = new jsPDF();
      
      doc.setFontSize(20);
      doc.text("Claros Financial Report", 14, 22);
      
      doc.setFontSize(12);
      doc.text(`Month: ${format(new Date(selectedMonth), "MMMM yyyy")}`, 14, 32);

      // Example autotable
      autoTable(doc, {
        startY: 40,
        head: [['Category', 'Amount', 'Type']],
        body: [
          ['Food', '1200', 'Expense'],
          ['Transport', '400', 'Expense'],
          ['Salary', '50000', 'Income'],
        ],
      });

      doc.save(`claros-report-${selectedMonth}.pdf`);
      toast.success("PDF Report generated");
    } catch (error) {
      toast.error("Failed to generate PDF");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <Select value={selectedMonth} onValueChange={setSelectedMonth}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Select month" />
        </SelectTrigger>
        <SelectContent>
          {months.map((m) => (
            <SelectItem key={m.value} value={m.value}>
              {m.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button onClick={handleGenerate} disabled={isGenerating}>
        <Download className="h-4 w-4 mr-2" />
        {isGenerating ? "Generating..." : "Generate PDF"}
      </Button>
    </div>
  );
}
