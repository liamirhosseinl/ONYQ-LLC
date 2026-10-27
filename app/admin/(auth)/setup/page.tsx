import { redirect } from "next/navigation";
import { get, dataDir } from "@/lib/server/db.ts";
import { ActionForm, Submit } from "@/components/admin/forms.tsx";
import { setupOwner } from "../../actions.ts";

export const metadata = { title: "First-time setup" };

export default function SetupPage() {
  const users = get<{ n: number }>("SELECT COUNT(*) AS n FROM users")!.n;
  if (users > 0) redirect("/admin/login");
  return (
    <>
      <h1 className="a-auth__title">Create the owner account</h1>
      <p className="a-auth__lead">
        This page works once. Copy the setup token from <code>{dataDir()}/setup-token.txt</code> on the server.
      </p>
      <ActionForm action={setupOwner}>
        <label className="a-field">
          <span>Setup token</span>
          <input name="token" required maxLength={100} autoComplete="off" />
        </label>
        <label className="a-field">
          <span>Your name</span>
          <input name="name" required maxLength={80} autoComplete="name" />
        </label>
        <label className="a-field">
          <span>Email</span>
          <input name="email" type="email" required maxLength={200} autoComplete="username" />
        </label>
        <label className="a-field">
          <span>Password</span>
          <input name="password" type="password" required minLength={12} maxLength={200} autoComplete="new-password" />
          <small>At least 12 characters. A long phrase is best.</small>
        </label>
        <Submit className="a-btn a-btn--primary a-btn--block">Create account</Submit>
      </ActionForm>
    </>
  );
}
