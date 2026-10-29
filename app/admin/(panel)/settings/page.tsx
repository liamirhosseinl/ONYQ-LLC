import QRCode from "qrcode";
import { requireUser, can } from "@/lib/server/auth.ts";
import { all, get } from "@/lib/server/db.ts";
import { totpUri } from "@/lib/server/security.ts";
import { getSiteContact } from "@/lib/server/site-settings.ts";
import { fxRates } from "@/lib/server/admin-data.ts";
import { Badge, Card, PageHead, ago, dateTime } from "@/components/admin/ui.tsx";
import { ActionForm, ConfirmSubmit, Submit } from "@/components/admin/forms.tsx";
import {
  changePassword,
  createUser,
  disableTotp,
  enableTotp,
  purgeAnalytics,
  saveContactSettings,
  saveFxRates,
  signOutEverywhere,
  startTotp,
  toggleUser,
} from "../../actions.ts";

export const metadata = { title: "Settings" };

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ welcome?: string; password?: string }> }) {
  const user = await requireUser("viewer");
  const sp = await searchParams;
  const me = get<{ totp_secret: string | null; totp_enabled: number; created_at: number; last_login_at: number | null }>(
    "SELECT totp_secret, totp_enabled, created_at, last_login_at FROM users WHERE id = ?",
    user.id,
  )!;
  const qr = me.totp_secret && !me.totp_enabled ? await QRCode.toString(totpUri(me.totp_secret, user.email), { type: "svg", margin: 1, color: { dark: "#060d0c", light: "#ffffff" } }) : null;
  const sessions = all<{ created_at: number; last_seen_at: number; ip: string | null; user_agent: string | null }>(
    "SELECT created_at, last_seen_at, ip, user_agent FROM sessions WHERE user_id = ? AND mfa_pending = 0 ORDER BY last_seen_at DESC",
    user.id,
  );
  const users = can(user, "admin")
    ? all<{ id: number; name: string; email: string; role: string; totp_enabled: number; disabled: number; last_login_at: number | null }>(
        "SELECT id, name, email, role, totp_enabled, disabled, last_login_at FROM users ORDER BY id",
      )
    : [];
  const contact = getSiteContact();
  const fx = fxRates();

  return (
    <>
      <PageHead title="Settings" sub={`Signed in as ${user.email}`} />
      {sp.welcome ? (
        <p className="a-msg a-msg--ok">Welcome! Your owner account is ready. Turn on two-step sign-in below — it takes a minute.</p>
      ) : null}
      {sp.password ? <p className="a-msg a-msg--ok">Your new password is saved. Turn on two-step sign-in below if it isn't on yet.</p> : null}

      <div className="a-grid a-grid--2">
        <Card title="Two-step sign-in">
          {me.totp_enabled ? (
            <>
              <p className="a-ok-line">
                <Badge value="active" label="On" /> Your account asks for an authenticator code at every sign-in.
              </p>
              <ActionForm action={disableTotp}>
                <label className="a-field">
                  <span>Your password</span>
                  <input name="password" type="password" required autoComplete="current-password" />
                </label>
                <label className="a-field">
                  <span>Current code from your app</span>
                  <input name="code" inputMode="numeric" pattern="[0-9 ]{6,7}" maxLength={7} required autoComplete="one-time-code" />
                </label>
                <Submit className="a-btn a-btn--ghost-danger">Turn off</Submit>
              </ActionForm>
            </>
          ) : qr ? (
            <div className="a-totp">
              <div className="a-totp__qr" dangerouslySetInnerHTML={{ __html: qr }} />
              <div>
                <p>1. Scan with Google Authenticator, 1Password, Authy or any TOTP app.</p>
                <p className="a-small a-muted">
                  Or enter the key: <code className="a-code">{me.totp_secret!.match(/.{1,4}/g)!.join(" ")}</code>
                </p>
                <p>2. Type the 6-digit code it shows.</p>
                <ActionForm action={enableTotp}>
                  <input name="code" inputMode="numeric" autoComplete="one-time-code" maxLength={7} required className="a-input--code" aria-label="Code" />
                  <Submit>Turn on</Submit>
                </ActionForm>
              </div>
            </div>
          ) : (
            <>
              <p className="a-muted">Protect the panel with a second factor: even a stolen password is not enough to sign in.</p>
              <form action={startTotp}>
                <Submit>Set up two-step sign-in</Submit>
              </form>
            </>
          )}
        </Card>

        <Card title="Password">
          <ActionForm action={changePassword} resetOnOk>
            <input type="email" name="username" autoComplete="username" value={user.email} readOnly hidden />
            <label className="a-field">
              <span>Current password</span>
              <input name="current" type="password" required autoComplete="current-password" maxLength={200} />
            </label>
            <label className="a-field">
              <span>New password</span>
              <input name="next" type="password" required minLength={12} maxLength={200} autoComplete="new-password" />
            </label>
            <label className="a-field">
              <span>Repeat new password</span>
              <input name="confirm" type="password" required minLength={12} maxLength={200} autoComplete="new-password" />
            </label>
            <Submit>Change password</Submit>
          </ActionForm>
        </Card>
      </div>

      <Card title="Active sessions" action={<form action={signOutEverywhere}><ConfirmSubmit className="a-btn a-btn--ghost-danger" confirm="Sign out everywhere?">Sign out everywhere</ConfirmSubmit></form>} pad={false}>
        <div className="a-tablewrap">
          <table className="a-table a-table--dense">
            <thead>
              <tr>
                <th>Device</th>
                <th>IP</th>
                <th>Started</th>
                <th>Last active</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s, i) => (
                <tr key={i}>
                  <td className="a-clip">{s.user_agent ?? "—"}</td>
                  <td>{s.ip ?? "—"}</td>
                  <td>{dateTime(s.created_at)}</td>
                  <td>{ago(s.last_seen_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {can(user, "admin") ? (
        <>
          <Card title="Website contact details" action={<span className="a-muted a-small">Shown on the site as soon as you save. Empty = hidden.</span>}>
            <ActionForm action={saveContactSettings} className="a-form--grid">
              <label className="a-field">
                <span>Sales email</span>
                <input name="salesEmail" type="email" defaultValue={contact.salesEmail ?? ""} maxLength={200} />
              </label>
              <label className="a-field">
                <span>Telegram username</span>
                <input name="telegram" defaultValue={contact.telegram ?? ""} maxLength={40} placeholder="onyq" />
              </label>
              <label className="a-field">
                <span>WhatsApp number</span>
                <input name="whatsapp" defaultValue={contact.whatsapp ?? ""} maxLength={20} placeholder="+374…" />
              </label>
              <label className="a-field">
                <span>Phone numbers (separate with commas)</span>
                <input name="phone" defaultValue={contact.phone ?? ""} maxLength={80} placeholder="+374 94 000000, +374 94 000001" />
              </label>
              <label className="a-field">
                <span>Security contact (security.txt)</span>
                <input name="securityEmail" type="email" defaultValue={contact.securityEmail ?? ""} maxLength={200} />
              </label>
              <div className="a-field--wide">
                <p className="a-subhead">Social profiles</p>
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} className="a-form__row">
                    <input name={`socialLabel${i}`} defaultValue={contact.social[i]?.label ?? ""} placeholder="Instagram" maxLength={40} aria-label={`Social ${i + 1} label`} />
                    <input name={`socialUrl${i}`} defaultValue={contact.social[i]?.url ?? ""} placeholder="https://…" maxLength={300} className="a-grow" aria-label={`Social ${i + 1} link`} />
                  </div>
                ))}
              </div>
              <div className="a-field--wide">
                <Submit>Save contact details</Submit>
              </div>
            </ActionForm>
          </Card>

          <div className="a-grid a-grid--2">
            <Card title="Team">
              <ul className="a-list a-list--tight">
                {users.map((u) => (
                  <li key={u.id} className={`a-list__row${u.disabled ? " is-done" : ""}`}>
                    <span className="a-avatar">{u.name.slice(0, 1).toUpperCase()}</span>
                    <span className="a-list__main">
                      <b>{u.name}</b>
                      <small>
                        {u.email} · {u.totp_enabled ? "2-step on" : "2-step off"} · {u.last_login_at ? `seen ${ago(u.last_login_at)}` : "never signed in"}
                      </small>
                    </span>
                    <span className="a-list__side">
                      <Badge value={u.role} />
                      {u.id !== user.id && u.role !== "owner" ? (
                        <form action={toggleUser}>
                          <input type="hidden" name="id" value={u.id} />
                          <ConfirmSubmit className="a-btn a-btn--small" confirm="Sure?">
                            {u.disabled ? "Enable" : "Disable"}
                          </ConfirmSubmit>
                        </form>
                      ) : null}
                    </span>
                  </li>
                ))}
              </ul>
              <details className="a-details">
                <summary>+ Add a team member</summary>
                <ActionForm action={createUser} className="a-form--grid" resetOnOk>
                  <label className="a-field">
                    <span>Name</span>
                    <input name="name" required maxLength={80} />
                  </label>
                  <label className="a-field">
                    <span>Email</span>
                    <input name="email" type="email" required maxLength={200} autoComplete="off" />
                  </label>
                  <label className="a-field">
                    <span>Role</span>
                    <select name="role" className="a-select" defaultValue="manager">
                      {user.role === "owner" ? <option value="admin">Admin — everything except owner settings</option> : null}
                      <option value="manager">Manager — clients, deals, finance</option>
                      <option value="viewer">Viewer — read only</option>
                    </select>
                  </label>
                  <label className="a-field">
                    <span>Temporary password</span>
                    <input name="password" type="password" required minLength={12} maxLength={200} autoComplete="new-password" />
                  </label>
                  <div className="a-field--wide">
                    <Submit>Add member</Submit>
                  </div>
                </ActionForm>
              </details>
            </Card>

            <Card title="Exchange rates for totals">
              <ActionForm action={saveFxRates} className="a-form--grid">
                <label className="a-field">
                  <span>AMD per 1 USD</span>
                  <input name="AMD" type="number" step="0.01" min={1} defaultValue={(1 / fx.AMD).toFixed(2)} />
                </label>
                <label className="a-field">
                  <span>USD per 1 EUR</span>
                  <input name="EUR" type="number" step="0.0001" min={0.1} defaultValue={fx.EUR.toFixed(4)} />
                </label>
                <label className="a-field">
                  <span>RUB per 1 USD</span>
                  <input name="RUB" type="number" step="0.01" min={1} defaultValue={(1 / fx.RUB).toFixed(2)} />
                </label>
                <div className="a-field--wide">
                  <Submit>Save rates</Submit>
                </div>
              </ActionForm>
              <p className="a-subhead">Data</p>
              <div className="a-form__row">
                <a className="a-btn" href="/admin/export/clients">Clients CSV</a>
                <a className="a-btn" href="/admin/export/leads">Briefs CSV</a>
                <a className="a-btn" href="/admin/export/invoices">Invoices CSV</a>
                <a className="a-btn" href="/admin/export/analytics">Page views CSV</a>
              </div>
              {user.role === "owner" ? (
                <form action={purgeAnalytics} className="a-form a-form--row">
                  <span className="a-muted a-small">Delete analytics older than</span>
                  <select name="days" className="a-select" defaultValue="395" aria-label="Keep days">
                    <option value="90">90 days</option>
                    <option value="180">6 months</option>
                    <option value="395">13 months</option>
                  </select>
                  <ConfirmSubmit className="a-btn a-btn--ghost-danger">Delete old data</ConfirmSubmit>
                </form>
              ) : null}
            </Card>
          </div>
        </>
      ) : null}
    </>
  );
}
