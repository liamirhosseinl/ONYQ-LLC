import Link from "next/link";
import { requireUser } from "@/lib/server/auth.ts";
import { Card, PageHead } from "@/components/admin/ui.tsx";
import { ClientForm } from "../ClientForm.tsx";

export const metadata = { title: "New client" };

export default async function NewClient() {
  await requireUser("manager");
  return (
    <>
      <PageHead title="New client" sub={<Link href="/admin/clients" className="a-link">← Clients</Link>} />
      <Card>
        <ClientForm />
      </Card>
    </>
  );
}
