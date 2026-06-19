"use client";
import { useState } from "react";

// ---- Types ----

interface DiscoveryResult {
  summary: string;
  painPoints: string[];
  recommendedWorkflow: string;
  automationFitScore: number;
  humanReviewNeed: boolean;
  successMetrics: string[];
}

interface MvpWorkflowStep {
  stepName: string;
  whatHappens: string;
  responsibleAgent: string;
  expectedOutput: string;
}

interface WorkflowPlan {
  workflowName: string;
  prototypeGoal: string;
  mvpWorkflowSteps: MvpWorkflowStep[];
  routingRules: string[];
  humanReviewRules: string[];
  structuredOutputSchema: Record<string, unknown>;
  prototypeToolStack: string[];
  productionToolStack: string[];
  acceptanceCriteria: string[];
  failureHandling: string[];
  metricsToTrack: string[];
}

interface ReviewItem {
  id: string;
  title: string;
  summary: string;
  riskLevel: "low" | "medium" | "high";
  decisionRequired: string;
  context: string;
  status: "pending" | "approved" | "rejected" | "info-requested";
  cardType: "plan-review" | "case-review";
}

type HandoffStatus = "idle" | "running" | "done" | "error";

interface HandoffStep {
  label: string;
  detail: string;
  status: "pending" | "complete";
  timestamp?: string;
}

// ---- Discovery Agent Section ----

function DiscoveryAgent() {
  const [notes, setNotes] = useState("");
  const [result, setResult] = useState<DiscoveryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDiscover = async () => {
    if (!notes.trim() || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="border border-gray-200 rounded-xl p-6 bg-white shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">🔍</span>
        <h2 className="text-lg font-semibold text-gray-800">Discovery Agent</h2>
        <span className="ml-auto text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
          AI-Powered
        </span>
      </div>
      <p className="text-sm text-gray-500 mb-4">
        Paste raw client notes, emails, or tickets. The agent will identify pain
        points and surface automation opportunities.
      </p>
      <textarea
        className="w-full border border-gray-200 rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-400 mb-3"
        rows={6}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="e.g. 'Every Monday morning the ops team manually exports the CRM report, copies it into a spreadsheet, and emails it to 12 people. Takes 2 hrs. Mistakes happen often...'"
      />
      <button
        onClick={handleDiscover}
        disabled={loading || !notes.trim()}
        className="bg-blue-600 text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "Analyzing..." : "Discover Opportunities"}
      </button>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-5 space-y-3 border-t border-gray-100 pt-4">
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Summary
            </span>
            <p className="text-sm text-gray-700 mt-1">{result.summary}</p>
          </div>

          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Pain Points
            </span>
            <ul className="mt-1 space-y-1">
              {result.painPoints?.map((p, i) => (
                <li key={i} className="text-sm text-gray-700 flex gap-2">
                  <span className="text-red-400 shrink-0">•</span>
                  {p}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Recommended Workflow
            </span>
            <p className="text-sm text-gray-700 mt-1">
              {result.recommendedWorkflow}
            </p>
          </div>

          <div className="flex gap-6">
            <div>
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                Automation Fit
              </span>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${result.automationFitScore}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {result.automationFitScore}/100
                </span>
              </div>
            </div>
            <div>
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                Human Review Needed
              </span>
              <p
                className={`text-sm font-medium mt-1 ${
                  result.humanReviewNeed ? "text-amber-600" : "text-green-600"
                }`}
              >
                {result.humanReviewNeed ? "Yes" : "No"}
              </p>
            </div>
          </div>

          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Success Metrics
            </span>
            <ul className="mt-1 space-y-1">
              {result.successMetrics?.map((m, i) => (
                <li key={i} className="text-sm text-gray-700 flex gap-2">
                  <span className="text-green-500 shrink-0">✓</span>
                  {m}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}

// ---- Workflow Architect Agent Section ----

function TagList({ items, color }: { items: string[]; color: string }) {
  return (
    <div className="flex flex-wrap gap-1.5 mt-1">
      {items.map((item, i) => (
        <span key={i} className={`text-xs font-medium px-2 py-0.5 rounded-full ${color}`}>
          {item}
        </span>
      ))}
    </div>
  );
}

function RuleList({ items, icon }: { items: string[]; icon: string }) {
  return (
    <ul className="mt-1 space-y-1.5">
      {items.map((rule, i) => (
        <li key={i} className="flex gap-2 text-sm text-gray-700">
          <span className="shrink-0 text-base leading-5">{icon}</span>
          {rule}
        </li>
      ))}
    </ul>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
      {children}
    </p>
  );
}

function WorkflowArchitect({
  onHandoffComplete,
}: {
  onHandoffComplete: (item: ReviewItem) => void;
}) {
  const [objective, setObjective] = useState("");
  const [plan, setPlan] = useState<WorkflowPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [schemaOpen, setSchemaOpen] = useState(false);

  const handleBuild = async () => {
    if (!objective.trim() || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/architect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ objective }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setPlan(data);
      setSchemaOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="border border-gray-200 rounded-xl p-6 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">🏗️</span>
        <h2 className="text-lg font-semibold text-gray-800">Workflow Architect Agent</h2>
        <span className="ml-auto text-xs font-medium px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
          AI-Powered
        </span>
      </div>
      <p className="text-sm text-gray-500 mb-4">
        Describe an automation objective. The agent designs a sprint-ready 3-5 day plan with
        lightweight MVP tooling, strict human review gates, and a clear path to production.
      </p>

      {/* Input */}
      <textarea
        className="w-full border border-gray-200 rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-400 mb-3"
        rows={4}
        value={objective}
        onChange={(e) => setObjective(e.target.value)}
        placeholder="e.g. 'Automate the weekly CRM report generation and distribution to 12 stakeholders, with an approval gate before any data leaves the system.'"
      />
      <button
        onClick={handleBuild}
        disabled={loading || !objective.trim()}
        className="bg-purple-600 text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "Designing Sprint Plan..." : "Build Workflow Plan"}
      </button>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {plan && (
        <div className="mt-6 space-y-5 border-t border-gray-100 pt-5">
          {/* Title + Goal */}
          <div>
            <h3 className="text-base font-bold text-gray-900">{plan.workflowName}</h3>
            <p className="text-sm text-gray-600 mt-1">{plan.prototypeGoal}</p>
          </div>

          {/* Workflow Steps */}
          <div>
            <SectionLabel>MVP Workflow Steps</SectionLabel>
            <div className="space-y-2">
              {plan.mvpWorkflowSteps?.map((step, i) => (
                <div key={i} className="flex gap-3 p-3 rounded-lg bg-purple-50 border border-purple-100">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-purple-600 text-white text-xs font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800">{step.stepName}</p>
                    <p className="text-xs text-gray-600 mt-0.5">{step.whatHappens}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-medium">
                        {step.responsibleAgent}
                      </span>
                      <span className="text-xs text-gray-400">→</span>
                      <span className="text-xs text-gray-500 italic">{step.expectedOutput}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* MVP vs Production Stack */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-green-50 border border-green-100">
              <SectionLabel>MVP Tool Stack</SectionLabel>
              <p className="text-xs text-green-700 mb-2">Mapped to steps only — no unused tools</p>
              <TagList items={plan.prototypeToolStack.filter((t) => t.toLowerCase() !== "google sheets")} color="bg-green-100 text-green-800" />
              {plan.prototypeToolStack.some((t) => t.toLowerCase().includes("shopify") || plan.mvpWorkflowSteps.some((s) => s.whatHappens.toLowerCase().includes("shopify"))) && (
                <p className="text-xs text-green-600 mt-2 italic">Includes simulated Shopify lookup to validate order routing rules.</p>
              )}
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <SectionLabel>Production Tool Stack</SectionLabel>
              <p className="text-xs text-slate-500 mb-2">Scale when proven</p>
              <TagList items={plan.productionToolStack} color="bg-slate-200 text-slate-700" />
            </div>
          </div>

          {/* Routing & Human Review Rules */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
              <SectionLabel>Routing Rules</SectionLabel>
              <RuleList items={plan.routingRules} icon="↪" />
            </div>
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-100">
              <SectionLabel>Human Review Gates</SectionLabel>
              <RuleList items={plan.humanReviewRules} icon="🔒" />
            </div>
          </div>

          {/* Acceptance Criteria */}
          <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
            <SectionLabel>Acceptance Criteria</SectionLabel>
            <ul className="mt-1 space-y-1.5">
              {plan.acceptanceCriteria?.map((criterion, i) => (
                <li key={i} className="flex gap-2 text-sm text-gray-700">
                  <span className="shrink-0 text-green-500 font-bold">✓</span>
                  {criterion}
                </li>
              ))}
            </ul>
          </div>

          {/* Failure Handling & Metrics — side by side */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="p-3 rounded-lg bg-red-50 border border-red-100">
              <SectionLabel>Failure Handling</SectionLabel>
              <RuleList items={plan.failureHandling} icon="⚠" />
            </div>
            <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-100">
              <SectionLabel>Metrics to Track</SectionLabel>
              <RuleList items={plan.metricsToTrack} icon="📊" />
            </div>
          </div>

          {/* Structured Output Schema — collapsible */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setSchemaOpen((v) => !v)}
              className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide hover:bg-gray-100 transition-colors"
            >
              <span>Structured Output Schema</span>
              <span className="text-gray-400">{schemaOpen ? "▲" : "▼"}</span>
            </button>
            {schemaOpen && (
              <pre className="p-3 text-xs text-gray-700 bg-white overflow-x-auto">
                {JSON.stringify(plan.structuredOutputSchema, null, 2)}
              </pre>
            )}
          </div>

          {/* Handoff module */}
          <WorkflowHandoff plan={plan} onHandoffComplete={onHandoffComplete} />
        </div>
      )}
    </section>
  );
}

// ---- Shared e-commerce queue data ----

const INITIAL_QUEUE: ReviewItem[] = [
  {
    id: "rev-001",
    title: "Refund request with payment mismatch",
    summary:
      "Customer #C-44821 submitted a $89.99 refund for order #ORD-9913 but the Shopify payment record shows $79.99. Delta of $10 requires manual reconciliation.",
    riskLevel: "high",
    decisionRequired:
      "Approve the refund at the original $79.99 charge, approve the claimed $89.99, or reject and contact the customer for clarification.",
    context: "Order #ORD-9913 · Payment gateway: Stripe · Submitted: 2024-06-14.",
    status: "pending",
    cardType: "case-review",
  },
  {
    id: "rev-002",
    title: "Missing Shopify order ID on return label",
    summary:
      "Return label was generated by the automation but the Shopify order ID field is blank. Cannot link the return to a customer record without it.",
    riskLevel: "medium",
    decisionRequired:
      "Manually locate and attach the correct Shopify order ID, or void the label and ask the customer to re-initiate the return.",
    context: "Return label #RTN-2024-0541 · Carrier: UPS · Created: 2024-06-13.",
    status: "pending",
    cardType: "case-review",
  },
  {
    id: "rev-003",
    title: "Carrier delay with low confidence match",
    summary:
      "Tracking event shows a 4-day delay for shipment #TRK-882019, but the AI confidence score for matching it to the correct order is 61% — below the 80% auto-resolve threshold.",
    riskLevel: "low",
    decisionRequired:
      "Confirm the order match and approve a proactive delay notification to the customer, or flag for manual investigation.",
    context:
      "Shipment #TRK-882019 · Carrier: FedEx · Expected delivery: 2024-06-12 (now: 2024-06-16).",
    status: "pending",
    cardType: "case-review",
  },
];

// ---- Human Review Queue Section ----

function HumanReviewQueue({
  queue,
  onDecide,
}: {
  queue: ReviewItem[];
  onDecide: (id: string, decision: "approved" | "rejected" | "info-requested") => void;
}) {
  const riskBadge: Record<ReviewItem["riskLevel"], string> = {
    low: "bg-green-100 text-green-700",
    medium: "bg-amber-100 text-amber-700",
    high: "bg-red-100 text-red-700",
  };

  const cardTypeBadge: Record<ReviewItem["cardType"], string> = {
    "plan-review": "bg-purple-100 text-purple-700",
    "case-review": "bg-sky-100 text-sky-700",
  };

  const cardTypeLabel: Record<ReviewItem["cardType"], string> = {
    "plan-review": "PLAN REVIEW",
    "case-review": "CASE REVIEW",
  };

  // Context-aware resolved label: plan items get sprint-specific copy, case items get generic copy.
  function resolvedLabel(item: ReviewItem): { text: string; cls: string } {
    if (item.status === "info-requested") {
      return { text: "Info Requested", cls: "bg-blue-100 text-blue-700" };
    }
    if (item.cardType === "plan-review") {
      return item.status === "approved"
        ? { text: "Approved — Sprint authorized", cls: "bg-green-100 text-green-700" }
        : { text: "Rejected — Sprint not authorized", cls: "bg-red-100 text-red-700" };
    }
    return item.status === "approved"
      ? { text: "Approved — Case resolved", cls: "bg-green-100 text-green-700" }
      : { text: "Rejected — Case escalated", cls: "bg-red-100 text-red-700" };
  }

  const pending = queue.filter((i) => i.status === "pending");
  const resolved = queue.filter((i) => i.status !== "pending");

  return (
    <section className="border border-gray-200 rounded-xl p-6 bg-white shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">👤</span>
        <h2 className="text-lg font-semibold text-gray-800">Human Review Queue</h2>
        {pending.length > 0 && (
          <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
            {pending.length} Pending
          </span>
        )}
      </div>
      <p className="text-sm text-gray-500 mb-5">
        Items flagged by agents that require a human decision before the workflow continues.
      </p>

      {pending.length === 0 && resolved.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-8">
          Queue is empty. No items awaiting review.
        </p>
      )}

      <div className="space-y-3">
        {pending.map((item) => (
          <div key={item.id} className="border border-gray-100 rounded-lg p-4 bg-gray-50">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className={`shrink-0 text-xs font-bold px-1.5 py-0.5 rounded ${cardTypeBadge[item.cardType]}`}>
                  {cardTypeLabel[item.cardType]}
                </span>
                <h3 className="text-sm font-semibold text-gray-800 truncate">{item.title}</h3>
              </div>
              <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full capitalize ${riskBadge[item.riskLevel]}`}>
                {item.riskLevel} risk
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-1">{item.summary}</p>
            <p className="text-xs text-gray-500 mb-3">{item.context}</p>
            <div className="p-2 bg-amber-50 border border-amber-100 rounded text-xs text-amber-800 mb-3">
              <strong>Decision required:</strong> {item.decisionRequired}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onDecide(item.id, "approved")}
                className="text-xs font-medium px-3 py-1.5 rounded-md bg-green-600 text-white hover:bg-green-700 transition-colors"
              >
                Approve
              </button>
              <button
                onClick={() => onDecide(item.id, "rejected")}
                className="text-xs font-medium px-3 py-1.5 rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                Reject
              </button>
              <button
                onClick={() => onDecide(item.id, "info-requested")}
                className="text-xs font-medium px-3 py-1.5 rounded-md border border-gray-300 text-gray-600 bg-white hover:bg-gray-50 transition-colors"
              >
                Request Info
              </button>
            </div>
          </div>
        ))}
      </div>

      {resolved.length > 0 && (
        <div className="mt-4 border-t border-gray-100 pt-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Resolved</p>
          <div className="space-y-2">
            {resolved.map((item) => {
              const s = resolvedLabel(item);
              return (
                <div key={item.id} className="flex items-center justify-between gap-2 p-3 bg-gray-50 rounded-lg opacity-70">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`shrink-0 text-xs font-bold px-1.5 py-0.5 rounded ${cardTypeBadge[item.cardType]}`}>
                      {cardTypeLabel[item.cardType]}
                    </span>
                    <span className="text-sm text-gray-600 truncate">{item.title}</span>
                  </div>
                  <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${s.cls}`}>
                    {s.text}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}

// ---- Workflow Handoff Module ----

const HANDOFF_STEPS_TEMPLATE: Omit<HandoffStep, "timestamp">[] = [
  { label: "n8n webhook", detail: "Workflow trigger registered", status: "pending" },
  { label: "Airtable record", detail: "Sprint plan row created", status: "pending" },
  { label: "Slack notification", detail: "Team channel notified", status: "pending" },
  { label: "Human review item", detail: "Review item added to queue", status: "pending" },
];

function fmt(d: Date) {
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function WorkflowHandoff({
  plan,
  onHandoffComplete,
}: {
  plan: WorkflowPlan;
  onHandoffComplete: (reviewItem: ReviewItem) => void;
}) {
  const [handoffStatus, setHandoffStatus] = useState<HandoffStatus>("idle");
  const [steps, setSteps] = useState<HandoffStep[]>(
    HANDOFF_STEPS_TEMPLATE.map((s) => ({ ...s }))
  );
  const [handoffError, setHandoffError] = useState<string | null>(null);

  const runHandoff = async () => {
    if (handoffStatus !== "idle") return;
    setHandoffStatus("running");
    setHandoffError(null);
    setSteps(HANDOFF_STEPS_TEMPLATE.map((s) => ({ ...s })));

    // Step 0: POST directly to the approval webhook (server-side CORS not needed for n8n public webhooks)
    try {
      const res = await fetch("https://simengliu.app.n8n.cloud/webhook/22b0c32d-a047-4f18-a76a-582439b65a89", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(plan),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Webhook responded with ${res.status}${text ? `: ${text}` : ""}`);
      }
      const result = await res.json().catch(() => ({}));
      if (result.success === false) {
        throw new Error(result.message || result.error || "n8n returned success: false");
      }
    } catch (err) {
      setHandoffError(err instanceof Error ? err.message : String(err));
      setHandoffStatus("error");
      return;
    }

    // Mark n8n step complete with real timestamp
    const n8nTime = fmt(new Date());
    setSteps((prev) =>
      prev.map((s, i) =>
        i === 0
          ? { ...s, status: "complete", detail: `n8n webhook received — ${n8nTime}` }
          : s
      )
    );

    // Simulate remaining steps with staggered delays
    for (let i = 1; i < HANDOFF_STEPS_TEMPLATE.length; i++) {
      await new Promise<void>((resolve) => setTimeout(resolve, 650));
      setSteps((prev) =>
        prev.map((s, idx) =>
          idx === i ? { ...s, status: "complete", timestamp: fmt(new Date()) } : s
        )
      );
    }

    // Build the queue item — short 2-sentence summary
    const newItem: ReviewItem = {
      id: `rev-handoff-${Date.now()}`,
      title: `Sprint plan ready: ${plan.workflowName}`,
      summary: `The Workflow Architect generated a ${plan.mvpWorkflowSteps.length}-step MVP plan using ${plan.prototypeToolStack.join(", ")}. Authorize the sprint before any automation runs.`,
      riskLevel: "medium",
      decisionRequired:
        "Confirm the MVP tool stack is approved and authorize the sprint to begin.",
      context: `${plan.mvpWorkflowSteps.length} steps · ${plan.prototypeToolStack.length} MVP tools · ${plan.humanReviewRules.length} human gates`,
      status: "pending",
      cardType: "plan-review",
    };
    onHandoffComplete(newItem);
    setHandoffStatus("done");
  };

  return (
    <div className="mt-5 pt-5 border-t border-gray-100">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm font-semibold text-gray-800">Workflow Handoff</p>
          <p className="text-xs text-gray-500 mt-0.5">
            Push this plan to the automation stack and create a human review item.
          </p>
        </div>
        <button
          onClick={runHandoff}
          disabled={handoffStatus !== "idle"}
          className="shrink-0 text-xs font-semibold px-4 py-2 rounded-lg bg-gray-900 text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {handoffStatus === "idle" && "Send Plan for Approval"}
          {handoffStatus === "running" && "Sending..."}
          {handoffStatus === "done" && "Sent ✓"}
          {handoffStatus === "error" && "Failed — retry?"}
        </button>
      </div>

      {handoffError && (
        <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
          <strong>n8n error:</strong> {handoffError}
        </div>
      )}

      {(handoffStatus === "running" || handoffStatus === "done") && (
        <ul className="mt-3 space-y-2">
          {steps.map((step, i) => (
            <li key={i} className="flex items-center gap-3">
              <span
                className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  step.status === "complete"
                    ? "bg-green-500 text-white"
                    : "bg-gray-200 text-gray-400"
                }`}
              >
                {step.status === "complete" ? "✓" : "·"}
              </span>
              <span className="text-sm text-gray-700 font-medium">{step.label}</span>
              <span
                className={`text-xs ml-auto font-medium px-2 py-0.5 rounded-full ${
                  step.status === "complete"
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                {step.status === "complete" ? step.detail : "pending"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ---- Run Staged Ticket ----

const STAGED_TICKET = {
  eventType: "customer_ticket_received",
  ticketId: "ZD-10023",
  orderId: "ORD-9913",
  issueText: "Customer requested an $89.99 refund, but Shopify payment record shows $79.99.",
  sourceChannel: "Agent Console Demo",
  sensitivity: "High",
  createdAt: "2026-06-16T21:15:00Z",
};

interface RuntimeResult {
  ticketId?: string;
  category?: string;
  confidence?: string | number;
  route?: string;
  recommendedOwner?: string;
  reason?: string;
  airtableRecord?: string;
  slackAlert?: string;
  executionTime?: string | number;
  [key: string]: unknown;
}

function ResultRow({ label, value }: { label: string; value?: string | number }) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <div className="flex items-start justify-between gap-4 py-1.5 border-b border-gray-100 last:border-0">
      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide shrink-0 w-36">{label}</span>
      <span className="text-xs text-gray-700 text-right">{String(value)}</span>
    </div>
  );
}

function RunStagedTicket() {
  const [status, setStatus] = useState<"idle" | "running" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RuntimeResult | null>(null);
  const [payloadText, setPayloadText] = useState(() => JSON.stringify(STAGED_TICKET, null, 2));
  const [parseError, setParseError] = useState<string | null>(null);

  const handlePayloadChange = (value: string) => {
    setPayloadText(value);
    try {
      JSON.parse(value);
      setParseError(null);
    } catch {
      setParseError("Invalid JSON — fix before sending.");
    }
  };

  const run = async () => {
    if (status !== "idle" || parseError) return;
    let payload: unknown;
    try {
      payload = JSON.parse(payloadText);
    } catch {
      setParseError("Invalid JSON — fix before sending.");
      return;
    }
    setStatus("running");
    setError(null);
    setResult(null);
    try {
      const res = await fetch(
        "https://simengliu.app.n8n.cloud/webhook/8be9f72c-2554-4273-b23b-f0b8ccb5dc79",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Webhook responded with ${res.status}${text ? `: ${text}` : ""}`);
      }
      const data = await res.json().catch(() => ({}));
      if (data.success === false) {
        throw new Error(data.message || data.error || "n8n returned success: false");
      }
      setResult(data);
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setStatus("error");
    }
  };

  return (
    <section className="border border-gray-200 rounded-xl p-6 bg-white shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">🎫</span>
        <h2 className="text-lg font-semibold text-gray-800">Run Staged Ticket</h2>
        <span className="ml-auto text-xs font-medium px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
          Staged Runtime
        </span>
      </div>
      <p className="text-sm text-gray-500 mb-4">
        Run a pre-configured e-commerce support ticket through the staged runtime pipeline to validate classification, routing, and human-review behavior.
      </p>

      {/* Editable payload */}
      <div className="mb-4 rounded-lg border border-gray-200 overflow-hidden">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-3 pt-2 pb-1 bg-gray-50 border-b border-gray-200">
          Payload
          <span className="ml-2 font-normal normal-case text-gray-400">— editable</span>
        </p>
        <textarea
          value={payloadText}
          onChange={(e) => handlePayloadChange(e.target.value)}
          spellCheck={false}
          rows={12}
          className={`w-full px-3 py-2 text-xs font-mono text-gray-700 bg-white resize-y focus:outline-none focus:ring-2 ${
            parseError ? "focus:ring-red-400 ring-1 ring-red-300" : "focus:ring-orange-400"
          }`}
        />
        {parseError && (
          <p className="px-3 py-1.5 text-xs text-red-600 bg-red-50 border-t border-red-200">
            {parseError}
          </p>
        )}
      </div>

      <button
        onClick={run}
        disabled={status !== "idle" || !!parseError}
        className="text-sm font-semibold px-5 py-2 rounded-lg bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {status === "idle" && "Run Staged Ticket"}
        {status === "running" && "Running..."}
        {status === "done" && "Completed ✓"}
        {status === "error" && "Failed — retry?"}
      </button>

      {/* Runtime Result card */}
      {status === "done" && result && (
        <div className="mt-4 rounded-lg border border-gray-200 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border-b border-gray-200">
            <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">Runtime Result</span>
            <span className="ml-auto text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700">n8n response</span>
          </div>
          <div className="px-4 py-3 space-y-0">
            <ResultRow label="Ticket" value={result.ticketId ?? STAGED_TICKET.ticketId} />
            <ResultRow label="Category" value={result.category as string} />
            <ResultRow label="Confidence" value={result.confidence !== undefined ? `${result.confidence}` : undefined} />
            <ResultRow label="Route" value={result.route as string} />
            <ResultRow label="Recommended Owner" value={result.recommendedOwner as string} />
            <ResultRow label="Reason" value={result.reason as string} />
            <ResultRow label="Airtable Record" value={result.airtableRecord as string} />
            <ResultRow label="Slack Alert" value={result.slackAlert as string} />
            <ResultRow label="Execution Time" value={result.executionTime !== undefined ? `${result.executionTime}` : undefined} />
          </div>
          {/* Fallback: show raw JSON if none of the mapped fields matched */}
          {!result.category && !result.route && !result.recommendedOwner && (
            <div className="px-4 pb-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Raw Response</p>
              <pre className="text-xs text-gray-600 overflow-x-auto bg-gray-50 rounded p-2">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
          <strong>Error:</strong> {error}
        </div>
      )}
    </section>
  );
}

// ---- Page Root ----

export default function WorkflowConsole() {
  const [queue, setQueue] = useState<ReviewItem[]>(INITIAL_QUEUE);

  const handleDecide = (id: string, decision: "approved" | "rejected" | "info-requested") => {
    setQueue((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: decision } : item))
    );
  };

  const handleHandoffComplete = (newItem: ReviewItem) => {
    setQueue((prev) => [newItem, ...prev]);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <header>
          <h1 className="text-2xl font-bold text-gray-900">
            AI Workflow Agent Console
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Discover automation opportunities, design workflow plans, and manage
            human review gates for client operations.
          </p>
        </header>

        <DiscoveryAgent />
        <WorkflowArchitect onHandoffComplete={handleHandoffComplete} />
        <RunStagedTicket />
        <HumanReviewQueue queue={queue} onDecide={handleDecide} />
      </div>
    </div>
  );
}
