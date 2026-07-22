import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Header } from "@/components/layout/Header";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) redirect("/login");
  if (!session.user.isAdmin) redirect("/reports");

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header
        userName={session.user.name}
        isAdmin={session.user.isAdmin}
        role={session.user.role}
      />
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
