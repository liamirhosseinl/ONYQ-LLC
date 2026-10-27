import { redirect } from "next/navigation";
import { get } from "@/lib/server/db.ts";
import { getUser } from "@/lib/server/auth.ts";
import { ActionForm, Submit } from "@/components/admin/forms.tsx";
import { login } from "../../actions.ts";

export const metadata = { title: "Sign in" };

export default async function LoginPage() {
  if (await getUser()) redirect("/admin");
  const users = get<{ n: number }>("SELECT COUNT(*) AS n FROM users")!.n;
  if (users === 0) redirect("/admin/setup");
  return (
    <>
      <h1 className="a-auth__title">Welcome back</h1>
      <p className="a-auth__lead">Sign in to manage the website, clients and finances.</p>
      <ActionForm action={login}>
        <label className="a-field">
          <span>Email</span>
          <input name="email" type="email" autoComplete="username" required maxLength={200} autoFocus />
        </label>
        <label className="a-field">
          <span>Password</span>
          <input name="password" type="password" autoComplete="current-password" required maxLength={200} />
        </label>
        <Submit className="a-btn a-btn--primary a-btn--block">Sign in</Submit>
      </ActionForm>
    </>
  );
}
