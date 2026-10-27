import { ActionForm, Submit } from "@/components/admin/forms.tsx";
import type { Client } from "@/lib/server/admin-data.ts";
import { saveClient } from "../../actions.ts";

export function ClientForm({ c }: { c?: Client }) {
  return (
    <ActionForm action={saveClient} className="a-form--grid">
      {c ? <input type="hidden" name="id" value={c.id} /> : null}
      <label className="a-field">
        <span>Name *</span>
        <input name="name" required maxLength={120} defaultValue={c?.name} />
      </label>
      <label className="a-field">
        <span>Company</span>
        <input name="company" maxLength={160} defaultValue={c?.company ?? ""} />
      </label>
      <label className="a-field">
        <span>Email</span>
        <input name="email" type="email" maxLength={200} defaultValue={c?.email ?? ""} />
      </label>
      <label className="a-field">
        <span>Phone</span>
        <input name="phone" maxLength={60} defaultValue={c?.phone ?? ""} />
      </label>
      <label className="a-field">
        <span>Telegram</span>
        <input name="telegram" maxLength={60} defaultValue={c?.telegram ?? ""} />
      </label>
      <label className="a-field">
        <span>Country</span>
        <input name="country" maxLength={60} defaultValue={c?.country ?? ""} />
      </label>
      <label className="a-field">
        <span>Language</span>
        <select name="language" defaultValue={c?.language ?? "en"} className="a-select">
          <option value="en">English</option>
          <option value="ru">Russian</option>
          <option value="hy">Armenian</option>
          <option value="fa">Persian</option>
        </select>
      </label>
      <label className="a-field">
        <span>Source</span>
        <input name="source" maxLength={80} defaultValue={c?.source ?? ""} placeholder="referral, website brief, Instagram…" />
      </label>
      <label className="a-field">
        <span>Status</span>
        <select name="status" defaultValue={c?.status ?? "prospect"} className="a-select">
          <option value="prospect">Prospect</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="past">Past</option>
        </select>
      </label>
      <label className="a-field">
        <span>Tags</span>
        <input name="tags" maxLength={200} defaultValue={c?.tags ?? ""} placeholder="vip, retainer, armenia" />
      </label>
      <label className="a-field a-field--wide">
        <span>Notes</span>
        <textarea name="notes" rows={4} maxLength={5000} defaultValue={c?.notes ?? ""} />
      </label>
      <div className="a-field--wide">
        <Submit>{c ? "Save changes" : "Create client"}</Submit>
      </div>
    </ActionForm>
  );
}
