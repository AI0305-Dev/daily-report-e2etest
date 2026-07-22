import { auth } from "@/auth";
import { PasswordChangeForm } from "@/components/settings/PasswordChangeForm";

export default async function PasswordPage() {
  const session = await auth();
  const role = session!.user!.role as "SALES" | "MANAGER";

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">パスワード変更</h1>
      <PasswordChangeForm role={role} />
    </div>
  );
}
