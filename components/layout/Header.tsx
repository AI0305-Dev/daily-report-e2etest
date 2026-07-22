"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import type { Role } from "@prisma/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

type HeaderProps = {
  userName: string;
  isAdmin: boolean;
  role: Role;
};

export function Header({ userName, isAdmin, role }: HeaderProps) {
  const router = useRouter();
  const reportsHref = role === "MANAGER" ? "/manager/reports" : "/reports";

  return (
    <header className="border-b bg-white px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <span className="font-semibold text-lg">日報システム</span>
        <nav className="flex gap-4">
          <Link href={reportsHref} className="text-sm text-gray-600 hover:text-gray-900">
            日報一覧
          </Link>
          {isAdmin && (
            <>
              <Link href="/admin/customers" className="text-sm text-gray-600 hover:text-gray-900">
                顧客マスタ
              </Link>
              <Link href="/admin/users" className="text-sm text-gray-600 hover:text-gray-900">
                営業マスタ
              </Link>
            </>
          )}
        </nav>
      </div>

      <div className="flex items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="sm" />}>
            {userName}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => router.push("/settings/password")}>
              パスワード変更
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="outline" size="sm" onClick={() => signOut({ callbackUrl: "/login" })}>
          ログアウト
        </Button>
      </div>
    </header>
  );
}
