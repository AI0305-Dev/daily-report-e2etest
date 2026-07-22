"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CustomerSearchFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [name, setName] = useState(searchParams.get("name") ?? "");

  useEffect(() => {
    const handler = setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      if (name) {
        params.set("name", name);
      } else {
        params.delete("name");
      }
      params.set("page", "1");
      router.push(`${pathname}?${params.toString()}`);
    }, 300);

    return () => clearTimeout(handler);
  }, [name, pathname, router]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  }, []);

  return (
    <div className="flex items-center gap-2">
      <Label className="text-sm">顧客名:</Label>
      <Input
        type="text"
        value={name}
        onChange={handleChange}
        placeholder="顧客名で検索"
        className="w-56"
      />
    </div>
  );
}
