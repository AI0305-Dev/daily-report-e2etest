"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CustomerAutocomplete } from "@/components/reports/CustomerAutocomplete";
import { TrashIcon, PlusIcon } from "lucide-react";

export type VisitRecordValue = {
  _id: string;
  customerId: string;
  customerName: string;
  content: string;
};

type VisitRecordFieldsProps = {
  records: VisitRecordValue[];
  onChange: (records: VisitRecordValue[]) => void;
  errors?: { customerId?: string; content?: string }[];
};

export function VisitRecordFields({ records, onChange, errors = [] }: VisitRecordFieldsProps) {
  function addRecord() {
    if (records.length >= 10) return;
    onChange([
      ...records,
      { _id: crypto.randomUUID(), customerId: "", customerName: "", content: "" },
    ]);
  }

  function removeRecord(index: number) {
    onChange(records.filter((_, i) => i !== index));
  }

  function updateRecord(index: number, patch: Partial<VisitRecordValue>) {
    onChange(records.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  return (
    <div className="space-y-3">
      {records.map((record, i) => (
        <div key={record._id} className="border rounded-lg p-3 space-y-2 bg-muted/20">
          <div className="flex items-start gap-2">
            <div className="flex-1 space-y-1">
              <CustomerAutocomplete
                inputValue={record.customerName}
                onInputChange={(name) => updateRecord(i, { customerName: name })}
                onSelect={(id, name) => updateRecord(i, { customerId: id, customerName: name })}
                error={errors[i]?.customerId}
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => removeRecord(i)}
              className="text-muted-foreground hover:text-destructive mt-0.5"
            >
              <TrashIcon />
              <span className="sr-only">削除</span>
            </Button>
          </div>
          <div>
            <Textarea
              value={record.content}
              onChange={(e) => updateRecord(i, { content: e.target.value })}
              placeholder="訪問内容"
              rows={2}
              aria-invalid={!!errors[i]?.content}
            />
            {errors[i]?.content && (
              <p className="text-sm text-destructive mt-1">{errors[i].content}</p>
            )}
          </div>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addRecord}
        disabled={records.length >= 10}
        className="gap-1.5"
      >
        <PlusIcon />
        訪問記録を追加
      </Button>
    </div>
  );
}
