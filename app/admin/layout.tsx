// import { Sidebar } from "@/components/admin/Sidebar";
// import ClientWrapper from "./client-wrapper";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen">
      {/* <ClientWrapper>
        <Sidebar />
      </ClientWrapper> */}
      <main className="flex-1 p-6 overflow-auto">{children}</main>
    </div>
  );
}
