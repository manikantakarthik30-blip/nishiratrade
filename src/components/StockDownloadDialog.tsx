import { useState } from "react";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { downloadStockHistory } from "@/utils/downloadData";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  symbol: string;
  companyName?: string;
  endPrice: number;
};

const PRESETS: { label: string; days: number }[] = [
  { label: "30D", days: 30 },
  { label: "90D", days: 90 },
  { label: "1Y", days: 365 },
  { label: "5Y", days: 365 * 5 },
  { label: "Max", days: 365 * 15 },
];

function isoDate(d: Date) {
  return d.toISOString().split("T")[0];
}

export function StockDownloadDialog({
  open,
  onOpenChange,
  symbol,
  companyName,
  endPrice,
}: Props) {
  const today = new Date();
  const defaultFrom = new Date(today);
  defaultFrom.setFullYear(defaultFrom.getFullYear() - 5);

  const [from, setFrom] = useState(isoDate(defaultFrom));
  const [to, setTo] = useState(isoDate(today));
  const [format, setFormat] = useState<"csv" | "xlsx">("xlsx");

  const applyPreset = (days: number) => {
    const t = new Date();
    const f = new Date();
    f.setDate(f.getDate() - days);
    setFrom(isoDate(f));
    setTo(isoDate(t));
  };

  const handleDownload = () => {
    const fromD = new Date(from);
    const toD = new Date(to);
    if (isNaN(fromD.getTime()) || isNaN(toD.getTime())) {
      toast.error("Invalid date range");
      return;
    }
    if (fromD > toD) {
      toast.error("'From' date must be before 'To' date");
      return;
    }
    downloadStockHistory({
      symbol,
      endPrice,
      from: fromD,
      to: toD,
      format,
    });
    toast.success(`Downloaded ${symbol} history (${format.toUpperCase()})`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-4 w-4 text-primary" />
            Download {symbol} history
          </DialogTitle>
          <DialogDescription>
            {companyName ? `${companyName} · ` : ""}Choose a date range and format
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => applyPreset(p.days)}
                className="rounded-md border border-border/60 bg-background/40 px-3 py-1 text-xs font-semibold text-muted-foreground transition hover:border-primary/60 hover:text-primary"
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="from" className="text-xs uppercase text-muted-foreground">From</Label>
              <Input id="from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="to" className="text-xs uppercase text-muted-foreground">To</Label>
              <Input id="to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
          </div>

          <div>
            <Label className="text-xs uppercase text-muted-foreground">Format</Label>
            <div className="mt-1 grid grid-cols-2 gap-2">
              <button
                onClick={() => setFormat("xlsx")}
                className={`flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold transition ${
                  format === "xlsx"
                    ? "border-primary/60 bg-primary/10 text-primary"
                    : "border-border/60 text-muted-foreground hover:text-foreground"
                }`}
              >
                <FileSpreadsheet className="h-4 w-4" /> Excel (.xlsx)
              </button>
              <button
                onClick={() => setFormat("csv")}
                className={`flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold transition ${
                  format === "csv"
                    ? "border-primary/60 bg-primary/10 text-primary"
                    : "border-border/60 text-muted-foreground hover:text-foreground"
                }`}
              >
                <FileText className="h-4 w-4" /> CSV
              </button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleDownload}>
            <Download className="mr-1 h-4 w-4" /> Download
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
