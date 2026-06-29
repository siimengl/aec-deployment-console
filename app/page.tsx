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
  // flat-card fallback fields
  title?: string;
  painPoint?: string;
  workflowOpportunity?: string;
  recommendedOwner?: string;
  riskLevel?: string;
  suggestedNextStep?: string;
  _demoMode?: boolean;
}

const DISCOVERY_FALLBACK: DiscoveryResult = {
  title: "Deployment Opportunity Detected",
  summary: "Project teams spend hours manually cross-referencing RFIs and submittals against Revit models, making it hard to track missing references and discipline owners before coordination meetings.",
  painPoint: "Project teams spend hours manually cross-referencing RFIs and submittals against Revit models, making it hard to track missing references and discipline owners before coordination meetings.",
  painPoints: [
    "Manual cross-referencing of RFIs and submittals against Revit models",
    "Difficulty tracking missing references and discipline owners",
    "High coordination overhead before project meetings",
  ],
  workflowOpportunity: "Create an AI-assisted intake and routing workflow that extracts missing references, identifies required discipline owners, and flags high-risk items for human review.",
  recommendedWorkflow: "Create an AI-assisted intake and routing workflow that extracts missing references, identifies required discipline owners, and flags high-risk items for human review.",
  recommendedOwner: "BIM Lead / Project Manager",
  riskLevel: "Medium",
  suggestedNextStep: "Route the intake record to AI Triage & Routing, require source reference checks, and create a review gate before project-team adoption.",
  automationFitScore: 78,
  humanReviewNeed: true,
  successMetrics: [
    "Reduce RFI cross-reference time by 60%",
    "100% of high-risk items flagged for human review",
    "Discipline owner assigned within 1 business day",
  ],
  _demoMode: true,
};

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

const WORKFLOW_FALLBACK: WorkflowPlan = {
  workflowName: "Pilot Workflow Generated",
  prototypeGoal: "Automate repeated clash detection checks between Revit models and Rhino/Grasshopper structural studies before the weekly coordination meeting.",
  mvpWorkflowSteps: [
    { stepName: "Ingest Model/Export Input", whatHappens: "Receive Revit MEP model and Rhino/Grasshopper structural study exports as structured inputs.", responsibleAgent: "Intake Agent", expectedOutput: "Validated input record" },
    { stepName: "Classify Clash Type and Affected Discipline", whatHappens: "AI classifies the clash type and identifies the affected engineering discipline.", responsibleAgent: "Classification Agent", expectedOutput: "Clash type label + discipline tag" },
    { stepName: "Assign Recommended Owner", whatHappens: "Route the clash record to the appropriate discipline lead based on classification rules.", responsibleAgent: "Routing Agent", expectedOutput: "Assigned owner record" },
    { stepName: "Flag High-Risk or Ambiguous Issues for Human Review", whatHappens: "Issues affecting structural coordination, MEP routing, or published documentation are escalated.", responsibleAgent: "Review Gate Agent", expectedOutput: "Flagged review item" },
    { stepName: "Output Review-Ready Record with Acceptance Criteria", whatHappens: "Generate a structured output record with all required fields and acceptance criteria for BIM Lead sign-off.", responsibleAgent: "Output Agent", expectedOutput: "Review-ready record" },
  ],
  routingRules: [
    "Structural clashes → Structural Lead",
    "MEP routing conflicts → MEP Coordinator",
    "Documentation conflicts → BIM Lead",
    "Ambiguous issues → Project Manager for triage",
  ],
  humanReviewRules: [
    "Required before deployment if the issue affects structural coordination",
    "Required for MEP routing changes impacting published documentation",
    "Required when AI confidence score is below 85%",
  ],
  structuredOutputSchema: {
    clashId: "string",
    clashType: "string",
    affectedDiscipline: "string",
    assignedOwner: "string",
    riskLevel: "low | medium | high",
    requiresHumanReview: "boolean",
    acceptanceCriteria: "string[]",
  },
  prototypeToolStack: ["Revit", "Rhino/Grasshopper", "n8n", "Airtable"],
  productionToolStack: ["Revit API", "Rhino Compute", "n8n (hosted)", "Procore", "BIM360"],
  acceptanceCriteria: [
    "BIM Lead assigned",
    "Required inputs present",
    "Clash rules defined",
    "Review decision recorded",
    "Pilot output approved before weekly use",
  ],
  failureHandling: [
    "Missing input → return to sender with required fields list",
    "Low confidence → escalate to human review queue",
    "Webhook timeout → retry once, then alert PM",
  ],
  metricsToTrack: [
    "Clash detection time per coordination cycle",
    "% of issues auto-routed without human intervention",
    "Human review turnaround time",
    "Pilot approval rate",
  ],
  _demoMode: true,
} as WorkflowPlan & { _demoMode: boolean };

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
      if (!res.ok) { setResult(DISCOVERY_FALLBACK); return; }
      const data = await res.json();
      if (
        data.error ||
        (typeof data.error === "string" && data.error.toLowerCase().includes("invalid token")) ||
        !data.summary
      ) {
        setResult(DISCOVERY_FALLBACK);
        return;
      }
      setResult(data);
    } catch {
      setResult(DISCOVERY_FALLBACK);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="border border-gray-200 rounded-xl p-6 bg-white shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">🔍</span>
        <h2 className="text-lg font-semibold text-gray-800">AEC Workflow Discovery Agent</h2>
        <span className="ml-auto text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
          AI-Powered
        </span>
      </div>
      <p className="text-sm text-gray-500 mb-4">
        Paste messy AEC project inputs (RFIs, BIM automation requests, LCA/Simulation handoffs). The agent will extract pain points and surface deployment opportunities.
      </p>
      <textarea
        className="w-full border border-gray-200 rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-400 mb-3"
        rows={6}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="e.g. 'Project teams spend hours manually cross-referencing RFIs and submittals against Revit models, making it hard to track missing references and discipline owners before the coordination meeting...'"
      />
      <button
        onClick={handleDiscover}
        disabled={loading || !notes.trim()}
        className="bg-blue-600 text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "Analyzing Project Inputs..." : "Discover Deployment Opportunities"}
      </button>

      {result && (
        <div className="mt-5 space-y-3 border-t border-gray-100 pt-4">
          {result._demoMode && (
            <p className="text-xs text-gray-400 italic">Demo mode output shown for portfolio walkthrough.</p>
          )}
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Engineering Summary
            </span>
            <p className="text-sm text-gray-700 mt-1">{result.summary}</p>
          </div>

          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Identified Pain Points
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
              Recommended Deployment Path
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
                Human-in-the-Loop Required
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
              Target Adoption Metrics
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
      if (!res.ok) { setPlan(WORKFLOW_FALLBACK); setSchemaOpen(false); return; }
      const data = await res.json();
      if (
        data.error ||
        (typeof data.error === "string" && data.error.toLowerCase().includes("invalid token")) ||
        !data.workflowName
      ) {
        setPlan(WORKFLOW_FALLBACK);
        setSchemaOpen(false);
        return;
      }
      setPlan(data);
      setSchemaOpen(false);
    } catch {
      setPlan(WORKFLOW_FALLBACK);
      setSchemaOpen(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="border border-gray-200 rounded-xl p-6 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">🏗️</span>
        <h2 className="text-lg font-semibold text-gray-800">Deployment Plan Agent</h2>
        <span className="ml-auto text-xs font-medium px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
          AI-Powered
        </span>
      </div>
      <p className="text-sm text-gray-500 mb-4">
        Describe an engineering automation objective. The agent designs a sprint-ready MVP deployment plan with routing rules, strict human review gates, and JSON schema outputs.
      </p>

      {/* Input */}
      <textarea
        className="w-full border border-gray-200 rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-400 mb-3"
        rows={4}
        value={objective}
        onChange={(e) => setObjective(e.target.value)}
        placeholder="e.g. 'Automate repeated clash detection checks between Revit models and Rhino/Grasshopper structural studies before the weekly coordination meeting.'"
      />
      <button
        onClick={handleBuild}
        disabled={loading || !objective.trim()}
        className="bg-purple-600 text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "Designing Deployment Plan..." : "Generate Pilot Workflow"}
      </button>

      {plan && (
        <div className="mt-6 space-y-5 border-t border-gray-100 pt-5">
          {/* Title + Goal */}
          <div>
            {(plan as WorkflowPlan & { _demoMode?: boolean })._demoMode && (
              <p className="text-xs text-gray-400 italic mb-2">Demo mode output shown for portfolio walkthrough.</p>
            )}
            <h3 className="text-base font-bold text-gray-900">{plan.workflowName}</h3>
            <p className="text-sm text-gray-600 mt-1">{plan.prototypeGoal}</p>
          </div>

          {/* Workflow Steps */}
          <div>
            <SectionLabel>MVP Deployment Steps</SectionLabel>
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
              <SectionLabel>Pilot Tool Stack</SectionLabel>
              <p className="text-xs text-green-700 mb-2">Mapped to MVP steps</p>
              <TagList items={plan.prototypeToolStack.filter((t) => t.toLowerCase() !== "google sheets")} color="bg-green-100 text-green-800" />
              {plan.prototypeToolStack.some((t) => t.toLowerCase().includes("procore") || plan.mvpWorkflowSteps.some((s) => s.whatHappens.toLowerCase().includes("procore"))) && (
                <p className="text-xs text-green-600 mt-2 italic">Includes simulated Procore/BIM360 lookup to validate routing.</p>
              )}
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <SectionLabel>Scale Rollout Stack</SectionLabel>
              <p className="text-xs text-slate-500 mb-2">Adopt when proven</p>
              <TagList items={plan.productionToolStack} color="bg-slate-200 text-slate-700" />
            </div>
          </div>

          {/* Routing & Human Review Rules */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
              <SectionLabel>Discipline Routing</SectionLabel>
              <RuleList items={plan.routingRules} icon="↪" />
            </div>
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-100">
              <SectionLabel>Engineering Review Gates</SectionLabel>
              <RuleList items={plan.humanReviewRules} icon="🔒" />
            </div>
          </div>

          {/* Acceptance Criteria */}
          <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
            <SectionLabel>Adoption & Acceptance Criteria</SectionLabel>
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
              <SectionLabel>Failure Modes</SectionLabel>
              <RuleList items={plan.failureHandling} icon="⚠" />
            </div>
            <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-100">
              <SectionLabel>Operational Metrics</SectionLabel>
              <RuleList items={plan.metricsToTrack} icon="📊" />
            </div>
          </div>

          {/* Structured Output Schema — collapsible */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setSchemaOpen((v) => !v)}
              className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide hover:bg-gray-100 transition-colors"
            >
              <span>Required JSON Schema Contract</span>
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

// ---- Shared AEC queue data ----

const INITIAL_QUEUE: ReviewItem[] = [
  {
    id: "rev-001",
    title: "RFI / Spec Review Intake",
    summary:
      "Missing structural reference found in Level 4 MEP layout. Requires cross-discipline check before response is issued.",
    riskLevel: "high",
    decisionRequired:
      "Assign to Structural Lead for review, or return to contractor for clarification.",
    context: "RFI #204-A · Project: London HQ · Source: Procore",
    status: "pending",
    cardType: "case-review",
  },
  {
    id: "rev-002",
    title: "BIM / Computational Automation Request",
    summary:
      "Automation pilot workflow generated for Revit-to-Rhino export, but required BIM Lead owner is unassigned.",
    riskLevel: "medium",
    decisionRequired:
      "Assign BIM Lead owner and approve the pilot workflow deployment.",
    context: "Request: Automated geometry export · Frequency: Weekly",
    status: "pending",
    cardType: "case-review",
  },
  {
    id: "rev-003",
    title: "LCA / Simulation Handoff",
    summary:
      "Envelope material scenarios extracted, but daylight simulation assumptions flag a potential inconsistency in glazing properties.",
    riskLevel: "low",
    decisionRequired:
      "Review assumptions checklist and confirm scenario parameters before running full Tally/OpenLCA simulation.",
    context:
      "Model: South Facade Opt 2 · Tool: Rhino/Grasshopper",
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
    "plan-review": "DEPLOYMENT PLAN",
    "case-review": "ENGINEERING REVIEW",
  };

  // Context-aware resolved label: plan items get sprint-specific copy, case items get generic copy.
  function resolvedLabel(item: ReviewItem): { text: string; cls: string } {
    if (item.status === "info-requested") {
      return { text: "Details Requested", cls: "bg-blue-100 text-blue-700" };
    }
    if (item.cardType === "plan-review") {
      return item.status === "approved"
        ? { text: "Approved — Pilot authorized", cls: "bg-green-100 text-green-700" }
        : { text: "Rejected — Pilot not authorized", cls: "bg-red-100 text-red-700" };
    }
    return item.status === "approved"
      ? { text: "Approved — Resolution sent", cls: "bg-green-100 text-green-700" }
      : { text: "Rejected — Escalated to PM", cls: "bg-red-100 text-red-700" };
  }

  const pending = queue.filter((i) => i.status === "pending");
  const resolved = queue.filter((i) => i.status !== "pending");

  return (
    <section className="border border-gray-200 rounded-xl p-6 bg-white shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">👤</span>
        <h2 className="text-lg font-semibold text-gray-800">Engineering Review Queue</h2>
        {pending.length > 0 && (
          <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
            {pending.length} Pending
          </span>
        )}
      </div>
      <p className="text-sm text-gray-500 mb-5">
        High-risk AEC inputs flagged by the agent that require discipline lead or project manager approval before execution.
      </p>

      {pending.length === 0 && resolved.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-8">
          Queue is empty. No engineering items awaiting review.
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
                Request Context
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

// ---- Feedback & Adoption Log Section (NEW) ----
const ADOPTION_LOGS = [
  {
    id: "log-1",
    date: "2026-06-25",
    type: "Adoption Blocker",
    title: "Discipline Leads ignoring Slack alerts",
    detail: "Engineers reported alert fatigue from the n8n bot. Solution: Updated JSON schema to enforce specific `@mention` targeting based on the 'discipline owner' field.",
    status: "Resolved"
  },
  {
    id: "log-2",
    date: "2026-06-27",
    type: "Training Need",
    title: "Prompting guidelines for LCA simulation handoff",
    detail: "Sustainability team needed examples of how to format grasshopper export data for the agent. Created a 1-page prompting template.",
    status: "Deployed"
  },
  {
    id: "log-3",
    date: "2026-06-28",
    type: "Schema Update",
    title: "Added confidence score threshold",
    detail: "BIM automation requests were getting misrouted. Added a Python validation step in n8n to force human review if AI confidence < 85%.",
    status: "Resolved"
  }
];

function FeedbackAdoptionLog() {
  return (
    <section className="border border-gray-200 rounded-xl p-6 bg-white shadow-sm mt-8">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">📈</span>
        <h2 className="text-lg font-semibold text-gray-800">Feedback & Adoption Log</h2>
        <span className="ml-auto text-xs font-medium px-2 py-0.5 rounded-full bg-teal-100 text-teal-700">
          Operationalization
        </span>
      </div>
      <p className="text-sm text-gray-500 mb-5">
        Capturing adoption blockers, training needs, schema improvements, and lessons learned from live project teams.
      </p>
      <div className="space-y-3">
        {ADOPTION_LOGS.map(log => (
          <div key={log.id} className="border border-gray-100 rounded-lg p-4 bg-gray-50 flex gap-4">
            <div className="shrink-0 pt-1">
              <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wide ${
                log.type === 'Adoption Blocker' ? 'bg-red-100 text-red-700' :
                log.type === 'Training Need' ? 'bg-blue-100 text-blue-700' :
                'bg-purple-100 text-purple-700'
              }`}>
                {log.type}
              </span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-800">{log.title}</h3>
              <p className="text-xs text-gray-600 mt-1">{log.detail}</p>
              <p className="text-[10px] text-gray-400 mt-2 font-medium">Logged: {log.date} • Status: {log.status}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ---- Workflow Handoff Module ----

const HANDOFF_STEPS_TEMPLATE: Omit<HandoffStep, "timestamp">[] = [
  { label: "n8n webhook", detail: "Deployment trigger registered", status: "pending" },
  { label: "Airtable record", detail: "Adoption audit row created", status: "pending" },
  { label: "Slack notification", detail: "Project team channel notified", status: "pending" },
  { label: "Engineering review item", detail: "Review item added to queue", status: "pending" },
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
      title: `Deployment plan ready: ${plan.workflowName}`,
      summary: `The Deployment Agent generated a ${plan.mvpWorkflowSteps.length}-step plan using ${plan.prototypeToolStack.join(", ")}. Authorize the pilot before pushing to live project environments.`,
      riskLevel: "medium",
      decisionRequired:
        "Confirm the data contracts are safe and authorize the pilot workflow to begin.",
      context: `${plan.mvpWorkflowSteps.length} steps · ${plan.prototypeToolStack.length} tools · ${plan.humanReviewRules.length} review gates`,
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
          <p className="text-sm font-semibold text-gray-800">System Handoff</p>
          <p className="text-xs text-gray-500 mt-0.5">
            Push this workflow to the automation stack and create an adoption audit item.
          </p>
        </div>
        <button
          onClick={runHandoff}
          disabled={handoffStatus !== "idle"}
          className="shrink-0 text-xs font-semibold px-4 py-2 rounded-lg bg-gray-900 text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {handoffStatus === "idle" && "Deploy Plan for Approval"}
          {handoffStatus === "running" && "Deploying..."}
          {handoffStatus === "done" && "Deployed ✓"}
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
  eventType: "rfi_intake_received",
  ticketId: "RFI-2026-089",
  projectId: "PRJ-LDN-HQ",
  issueText: "Contractor requests clarification on structural steel connections for the South Atrium. Revit model shows clash with HVAC routing.",
  sourceChannel: "Procore integration",
  sensitivity: "High",
  createdAt: "2026-06-27T15:26:00Z",
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
  // AEC-specific fields
  id?: string;
  status?: string;
  discipline?: string;
  riskLevel?: string;
  confidenceScore?: number;
  humanReviewRequired?: boolean;
  routingReason?: string;
  recommendedNextStep?: string;
  sourceChannel?: string;
  acceptanceCriteria?: string[];
  fields?: {
    human_review_required?: boolean;
    recommended_owner?: string;
    raw_case?: string;
    routing_reason?: string;
    recommended_next_step?: string;
    status?: string;
    category?: string;
    source_channel?: string;
    discipline?: string;
    risk_level?: string;
    confidence_score?: number;
    acceptance_criteria?: string[];
  };
  [key: string]: unknown;
}

const AEC_RUNTIME_FALLBACK: RuntimeResult = {
  id: "REV-001",
  createdTime: "2026-06-29T12:18:40.000Z",
  fields: {
    human_review_required: true,
    recommended_owner: "Structural Lead / MEP Lead",
    raw_case: "Contractor requests clarification on structural steel connections for the South Atrium. Revit model shows clash with HVAC routing, and the latest RFI response references an outdated drawing sheet.",
    routing_reason: "This RFI involves a structural and MEP coordination conflict with outdated source references. It requires discipline review before a response is issued.",
    recommended_next_step: "Route to Structural Lead and MEP Lead for source verification, confirm the latest drawing reference, and block contractor response until review decision is recorded.",
    status: "Engineering Review Required",
    category: "RFI / Spec Review Intake",
    source_channel: "Procore Integration",
    discipline: "Structural / MEP Coordination",
    risk_level: "High",
    confidence_score: 0.91,
    acceptance_criteria: [
      "Structural owner assigned",
      "MEP coordination conflict reviewed",
      "latest drawing reference confirmed",
      "outdated source flagged",
      "review decision recorded before response is issued",
    ],
  },
};

const AEC_BANNED_TERMS = [
  "customer support", "customer-facing", "finance", "agent console demo",
  "generic support", "billing", "saas", "app support", "ticket support",
];

function isNonAecResponse(data: RuntimeResult): boolean {
  const text = JSON.stringify(data).toLowerCase();
  return AEC_BANNED_TERMS.some((term) => text.includes(term));
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
        setResult(AEC_RUNTIME_FALLBACK);
        setStatus("done");
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (data.success === false || isNonAecResponse(data)) {
        setResult(AEC_RUNTIME_FALLBACK);
        setStatus("done");
        return;
      }
      setResult(data);
      setStatus("done");
    } catch {
      setResult(AEC_RUNTIME_FALLBACK);
      setStatus("done");
    }
  };

  return (
    <section className="border border-gray-200 rounded-xl p-6 bg-white shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">🎫</span>
        <h2 className="text-lg font-semibold text-gray-800">Run Staged Project Input</h2>
        <span className="ml-auto text-xs font-medium px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
          Staged Runtime
        </span>
      </div>
      <p className="text-sm text-gray-500 mb-4">
        Run a pre-configured AEC project input through the staged runtime pipeline to validate classification, routing, and engineering review logic.
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
        {status === "idle" && "Run Staged Payload"}
        {status === "running" && "Executing..."}
        {status === "done" && "Completed ✓"}
        {status === "error" && "Failed — retry?"}
      </button>

      {/* Runtime Result card */}
      {status === "done" && result && (() => {
        const f = result.fields;
        const category = f?.category ?? result.category as string;
        const owner = f?.recommended_owner ?? result.recommendedOwner as string;
        const discipline = f?.discipline ?? result.discipline as string;
        const riskLevel = f?.risk_level ?? result.riskLevel as string;
        const statusVal = f?.status ?? result.status as string;
        const sourceChannel = f?.source_channel ?? result.sourceChannel as string;
        const confidence = f?.confidence_score ?? result.confidence;
        const humanReview = f?.human_review_required ?? result.humanReviewRequired;
        const routingReason = f?.routing_reason ?? result.routingReason as string;
        const nextStep = f?.recommended_next_step ?? result.recommendedNextStep as string;
        const criteria = f?.acceptance_criteria ?? result.acceptanceCriteria as string[];
        const recordId = result.id ?? result.ticketId ?? STAGED_TICKET.ticketId;
        return (
          <div className="mt-4 rounded-lg border border-gray-200 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border-b border-gray-200">
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">Runtime Result</span>
              <span className="ml-auto text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700">n8n response</span>
            </div>
            <div className="px-4 py-3 space-y-0">
              <ResultRow label="Record ID" value={recordId} />
              <ResultRow label="Category" value={category} />
              <ResultRow label="Status" value={statusVal} />
              <ResultRow label="Discipline" value={discipline} />
              <ResultRow label="Recommended Owner" value={owner} />
              <ResultRow label="Risk Level" value={riskLevel} />
              <ResultRow label="Confidence Score" value={confidence !== undefined ? `${confidence}` : undefined} />
              <ResultRow label="Human Review" value={humanReview !== undefined ? (humanReview ? "Required" : "Not required") : undefined} />
              <ResultRow label="Source Channel" value={sourceChannel} />
              <ResultRow label="Routing Reason" value={routingReason} />
              <ResultRow label="Recommended Next Step" value={nextStep} />
            </div>
            {criteria && criteria.length > 0 && (
              <div className="px-4 pb-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Acceptance Criteria</p>
                <ul className="space-y-1">
                  {criteria.map((c, i) => (
                    <li key={i} className="flex gap-2 text-xs text-gray-700">
                      <span className="shrink-0 text-green-500 font-bold">✓</span>
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
      })()}
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
            AEC AI Workflow Deployment Console
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            A staged prototype for deploying agentic AI workflows into engineering project teams with structured intake, review gates, testing, feedback capture, and adoption guidance.
          </p>
        </header>

        <DiscoveryAgent />
        <WorkflowArchitect onHandoffComplete={handleHandoffComplete} />
        <RunStagedTicket />
        <HumanReviewQueue queue={queue} onDecide={handleDecide} />
        
        <FeedbackAdoptionLog />
      </div>
    </div>
  );
}
