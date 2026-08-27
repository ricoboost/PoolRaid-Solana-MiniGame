import { notFound } from "next/navigation";
import { AdminLogin } from "./AdminLogin";

interface Props {
  params: Promise<{ adminPath: string }>;
}

export default async function AdminPage({ params }: Props) {
  const { adminPath } = await params;
  const expectedPath = process.env.ADMIN_PATH;

  if (!expectedPath || adminPath !== expectedPath) {
    notFound();
  }

  return <AdminLogin adminPath={adminPath} />;
}
