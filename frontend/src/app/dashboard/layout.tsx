// Dashboard layout — mounts the Sidebar and the global AttackProvider.
// The AttackProvider creates ONE persistent SSE connection that survives
// page navigation between Dashboard / Engine Config / Live Terminal.
import { Sidebar } from "@/components/Sidebar";
import { AttackProvider } from "@/lib/AttackContext";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AttackProvider>
      <div className="flex h-screen w-full bg-[#020617] overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto w-full relative">
          {children}
        </main>
      </div>
    </AttackProvider>
  );
}