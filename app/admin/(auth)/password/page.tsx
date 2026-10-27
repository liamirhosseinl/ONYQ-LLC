import { requireUser } from "@/lib/server/auth.ts";
import { redirect } from "next/navigation";
import { ActionForm, Submit } from "@/components/admin/forms.tsx";
import { changePassword, logout } from "../../actions.ts";

export const metadata = { title: "Choose a new password" };

/** Shown after a temporary password (from a teammate or the recovery command): nothing else opens until it is replaced. */
export default async function PasswordPage() {
  const user = await requireUser("viewer", { allowTemporary: true });
  if (!user.must_change_password) redirect("/admin/settings");
  return (
    <>
      <h1 className="a-auth__title">Choose your own password</h1>
      <p className="a-auth__lead">You signed in with a temporary password. Replace it to open the panel.</p>
      <ActionForm action={changePassword}>
        <input type="email" name="username" autoComplete="username" value={user.email} readOnly hidden />
        <label className="a-field">
          <span>Temporary password</span>
          <input name="current" type="password" required autoComplete="current-password" maxLength={200} />
        </label>
        <label className="a-field">
          <span>New password (12+ characters)</span>
          <input name="next" type="password" required minLength={12} maxLength={200} autoComplete="new-password" />
        </label>
        <label className="a-field">
          <span>Repeat new password</span>
          <input name="confirm" type="password" required minLength={12} maxLength={200} autoComplete="new-password" />
        </label>
        <Submit className="a-btn a-btn--primary a-btn--block">Save and continue</Submit>
      </ActionForm>
      <form action={logout} className="a-auth__alt">
        <button type="submit" className="a-link">Sign out</button>
      </form>
    </>
  );
}
