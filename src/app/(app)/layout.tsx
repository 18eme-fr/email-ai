import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Sidebar } from "@/components/sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="lg:flex min-h-screen bg-stage-gradient">
      <Sidebar email={user.email} />
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto w-full">{children}</main>
    </div>
  );
}
