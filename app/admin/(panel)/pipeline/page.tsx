import { requireUser, can } from "@/lib/server/auth.ts";
import { deals, financeSummary, DEAL_STAGES } from "@/lib/server/admin-data.ts";
import { Kanban } from "@/components/admin/kanban.tsx";
import { Kpi, PageHead, usd } from "@/components/admin/ui.tsx";
import { moveDeal } from "../../actions.ts";

export const metadata = { title: "Pipeline" };

export default async function PipelinePage() {
  const user = await requireUser("viewer");
  const ds = deals();
  const fin = financeSummary(3);
  const wonQuarter = ds.filter((d) => d.stage === "won" && d.updated_at > Date.now() - 90 * 86400_000);
  const closed = ds.filter((d) => (d.stage === "won" || d.stage === "lost") && d.updated_at > Date.now() - 90 * 86400_000);
  const winRate = closed.length ? (wonQuarter.length / closed.length) * 100 : 0;
  return (
    <>
      <PageHead title="Pipeline" sub="Drag deals between stages. Values are in USD." />
      <div className="a-kpis">
        <Kpi label="Open pipeline" value={usd(fin.pipelineOpen)} />
        <Kpi label="Weighted forecast" value={usd(fin.pipelineWeighted)} hint="by stage probability" />
        <Kpi label="Won · 90 days" value={usd(wonQuarter.reduce((s, d) => s + d.value_usd, 0))} hint={`${wonQuarter.length} deals`} accent />
        <Kpi label="Win rate · 90 days" value={`${winRate.toFixed(0)}%`} hint={`${closed.length} closed`} />
      </div>
      <Kanban
        stages={DEAL_STAGES}
        canEdit={can(user, "manager")}
        move={moveDeal}
        cards={ds.map((d) => ({ id: d.id, title: d.title, client: d.client_name ?? "", clientId: d.client_id, value: d.value_usd, stage: d.stage, recurring: Boolean(d.recurring), close: d.expected_close }))}
      />
    </>
  );
}
