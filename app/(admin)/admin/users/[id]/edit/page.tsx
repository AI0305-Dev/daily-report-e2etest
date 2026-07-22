import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { UserForm } from "@/components/admin/UserForm";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditUserPage({ params }: Props) {
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isAdmin: true,
      managerId: true,
      isDeleted: true,
    },
  });

  if (!user || user.isDeleted) notFound();

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">営業編集</h1>
      <UserForm
        mode="edit"
        userId={id}
        initialValues={{
          name: user.name,
          email: user.email,
          role: user.role,
          isAdmin: user.isAdmin,
          managerId: user.managerId,
        }}
      />
    </div>
  );
}
