import { UserForm } from "@/components/admin/UserForm";

export default function NewUserPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">営業追加</h1>
      <UserForm mode="create" />
    </div>
  );
}
