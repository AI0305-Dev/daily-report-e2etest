"use client";

import { useState, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";

type Customer = {
  id: string;
  name: string;
};

type CustomerAutocompleteProps = {
  inputValue: string;
  onInputChange: (value: string) => void;
  onSelect: (customerId: string, customerName: string) => void;
  error?: string;
};

export function CustomerAutocomplete({
  inputValue,
  onInputChange,
  onSelect,
  error,
}: CustomerAutocompleteProps) {
  const [options, setOptions] = useState<Customer[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const search = useCallback((query: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      if (!query.trim()) {
        setOptions([]);
        setOpen(false);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(`/api/customers?name=${encodeURIComponent(query)}&limit=10`);
        const json = await res.json();
        setOptions(json.data ?? []);
        setOpen(true);
      } catch {
        setOptions([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  }, []);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    onInputChange(v);
    if (!v) {
      onSelect("", "");
    }
    search(v);
  }

  function handleSelect(customer: Customer) {
    onInputChange(customer.name);
    onSelect(customer.id, customer.name);
    setOpen(false);
    setOptions([]);
  }

  function handleBlur() {
    setTimeout(() => {
      if (!containerRef.current?.contains(document.activeElement)) {
        setOpen(false);
      }
    }, 150);
  }

  return (
    <div ref={containerRef} className="relative">
      <Input
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleBlur}
        onFocus={() => inputValue && options.length > 0 && setOpen(true)}
        placeholder="顧客名を入力して検索"
        aria-invalid={!!error}
        className="w-full"
      />
      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border rounded-lg shadow-md max-h-48 overflow-y-auto">
          {loading ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">検索中...</div>
          ) : options.length === 0 ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">顧客が見つかりません</div>
          ) : (
            options.map((c) => (
              <button
                key={c.id}
                type="button"
                className="w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                onMouseDown={() => handleSelect(c)}
              >
                {c.name}
              </button>
            ))
          )}
        </div>
      )}
      {error && <p className="text-sm text-destructive mt-1">{error}</p>}
    </div>
  );
}
