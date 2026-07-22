import { CustomerForm } from "@/components/admin/CustomerForm";

export default function NewCustomerPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">顧客追加</h1>
      <CustomerForm mode="create" />
    </div>
  );
}
