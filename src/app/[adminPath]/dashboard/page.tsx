import { notFound } from "next/navigation";
import { AdminDashboard } from "./AdminDashboard";

interface Props {
  params: Promise<{ adminPath: string }>;
}

export default async function AdminDashboardPage({ params }: Props) {
  const { adminPath } = await params;
  if (!process.env.ADMIN_PATH || adminPath !== process.env.ADMIN_PATH) {
    notFound();
  }
  return <AdminDashboard adminPath={adminPath} />;
}
