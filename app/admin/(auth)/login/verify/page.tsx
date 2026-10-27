import { redirect } from "next/navigation";
import { getPendingUserId } from "@/lib/server/auth.ts";
import { ActionForm, Submit } from "@/components/admin/forms.tsx";
import { verifySecondFactor } from "../../../actions.ts";

export const metadata = { title: "Two-step sign-in" };

export default async function VerifyPage() {
  if (!(await getPendingUserId())) redirect("/admin/login");
  return (
    <>
      <h1 className="a-auth__title">One more step</h1>
      <p className="a-auth__lead">Enter the 6-digit code from your authenticator app.</p>
      <ActionForm action={verifySecondFactor}>
        <label className="a-field">
          <span>Code</span>
          <input name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9 ]{6,7}" maxLength={7} required autoFocus className="a-input--code" />
        </label>
        <Submit className="a-btn a-btn--primary a-btn--block">Verify</Submit>
      </ActionForm>
    </>
  );
}
