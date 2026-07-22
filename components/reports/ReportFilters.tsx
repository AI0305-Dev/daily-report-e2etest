"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STATUS_OPTIONS = [
  { value: "ALL", label: "全て" },
  { value: "DRAFT", label: "下書き" },
  { value: "SUBMITTED", label: "提出済" },
  { value: "REJECTED", label: "差し戻し" },
  { value: "COMPLETED", label: "完了" },
];

function getDefaultDateRange(): { dateFrom: string; dateTo: string } {
  const today = new Date();
  const from = new Date(today);
  from.setDate(today.getDate() - 30);
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return { dateFrom: fmt(from), dateTo: fmt(today) };
}

type UserOption = {
  id: string;
  name: string;
};

type ReportFiltersProps = {
  defaultStatus?: string;
  excludeStatuses?: ("DRAFT" | "SUBMITTED" | "REJECTED" | "COMPLETED")[];
  users?: UserOption[];
};

export function ReportFilters({
  defaultStatus = "",
  excludeStatuses = [],
  users,
}: ReportFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const defaultDateRange = useMemo(() => getDefaultDateRange(), []);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    const { dateFrom, dateTo } = defaultDateRange;
    let changed = false;
    if (!params.has("dateFrom")) {
      params.set("dateFrom", dateFrom);
      changed = true;
    }
    if (!params.has("dateTo")) {
      params.set("dateTo", dateTo);
      changed = true;
    }
    if (changed) router.replace(`${pathname}?${params.toString()}`);
  }, [pathname, router, searchParams, defaultDateRange]);

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (key === "status") {
        params.set(key, value);
      } else if (key === "userId") {
        if (value && value !== "ALL") {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      } else if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.set("page", "1");
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  const status = searchParams.get("status") ?? defaultStatus ?? "ALL";
  const userId = searchParams.get("userId") ?? "ALL";
  const dateFrom = searchParams.get("dateFrom") ?? defaultDateRange.dateFrom;
  const dateTo = searchParams.get("dateTo") ?? defaultDateRange.dateTo;

  const statusLabel = STATUS_OPTIONS.find((o) => o.value === status)?.label ?? "全て";
  const userLabel =
    userId === "ALL" ? "全員" : (users?.find((u) => u.id === userId)?.name ?? "全員");

  return (
    <div className="flex flex-wrap items-end gap-3">
      {users !== undefined && (
        <div className="flex items-center gap-2">
          <Label className="text-sm">営業:</Label>
          <Select value={userId} onValueChange={(v) => updateParam("userId", v ?? "ALL")}>
            <SelectTrigger className="w-36">
              <SelectValue>{userLabel}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">全員</SelectItem>
              {users.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="flex items-center gap-2">
        <Label className="text-sm">ステータス:</Label>
        <Select value={status} onValueChange={(v) => updateParam("status", v ?? "")}>
          <SelectTrigger className="w-36">
            <SelectValue>{statusLabel}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.filter((opt) => !(excludeStatuses as string[]).includes(opt.value)).map(
              (opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              )
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => updateParam("dateFrom", e.target.value)}
          className="w-40"
        />
        <span className="text-sm text-muted-foreground">〜</span>
        <Input
          type="date"
          value={dateTo}
          onChange={(e) => updateParam("dateTo", e.target.value)}
          className="w-40"
        />
      </div>
    </div>
  );
}
