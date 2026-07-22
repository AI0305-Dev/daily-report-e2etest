import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CustomerForm } from "@/components/admin/CustomerForm";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditCustomerPage({ params }: Props) {
  const { id } = await params;

  const customer = await prisma.customer.findUnique({
    where: { id },
    select: { id: true, name: true, address: true, note: true, isDeleted: true },
  });

  if (!customer || customer.isDeleted) notFound();

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">顧客編集</h1>
      <CustomerForm
        mode="edit"
        customerId={id}
        initialValues={{
          name: customer.name,
          address: customer.address ?? "",
          note: customer.note ?? "",
        }}
      />
    </div>
  );
}
