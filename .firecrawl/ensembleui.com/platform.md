[Ensemble](https://ensembleui.com/) [Home](https://ensembleui.com/) [Platform](https://ensembleui.com/platform) [About](https://ensembleui.com/about)

[Sign in](https://ensembleapp.ai/home) [Get Started](https://ensembleapp.ai/home)

[Home](https://ensembleui.com/) [Platform](https://ensembleui.com/platform) [About](https://ensembleui.com/about)

[Sign in](https://ensembleapp.ai/home) [Get Started](https://ensembleapp.ai/home)

[Get Started](https://ensembleapp.ai/home)

[Platform Guide](https://ensembleui.com/platform) [vs n8n](https://ensembleui.com/platform/vs-n8n)

Ensemble Platform Guide: Building and Running AI Agents at Scale

Ensemble

Platform Guide

# Building and Running AI Agents at Scale

Ensemble is an **agent harness** — the operational platform that takes AI models and makes them production-ready agents. This guide covers the full picture: building, deploying, securing, and governing agents at enterprise scale.

Contents

01. [1\. What is an AI agent?](https://ensembleui.com/_platform/#what-is-agent)
02. [2\. Agent Lifecycle Management](https://ensembleui.com/_platform/#alm)
03. [3\. Platform architecture](https://ensembleui.com/_platform/#platform)
04. [4\. Building agents](https://ensembleui.com/_platform/#building)
05. [5\. Connecting to systems](https://ensembleui.com/_platform/#connecting)
06. [Deploying agents](https://ensembleui.com/_platform/#deploying)
07. [The Ensemble chat widget](https://ensembleui.com/_platform/#widget)
08. [8\. Testing and observability](https://ensembleui.com/_platform/#testing)
09. [9\. Security and data protection](https://ensembleui.com/_platform/#security)
10. [10\. Governance and policies](https://ensembleui.com/_platform/#governance)
11. [11\. Picking the right use cases](https://ensembleui.com/_platform/#usecases)
12. [12\. How Ensemble compares](https://ensembleui.com/_platform/#vs)

## 1\. What is an AI agent?

An AI agent is software that can **reason** and **take action** — not just generate text. It uses a large language model (LLM) as its reasoning engine and wraps it with the ability to call external systems, execute multi-step processes, and adapt based on what it learns along the way.

Three things define an agent:

- **A role and objective** — what it's trying to accomplish, such as resolving a billing dispute or onboarding a new employee
- **The ability to reason** — it reads context, interprets requests, and decides what to do next; it's not following a fixed script
- **The ability to act** — it can call APIs, query databases, send messages, and update records in real systems

Agent vs. chatbot

Ask a standard LLM chatbot "What's the status of my order?" and it generates a plausible-sounding answer from training data. Ask an agent the same question and it connects to your order management system, queries the actual record, and returns the real status. The difference is real action vs. generated text.

Building an agent that works reliably in production — with the right tools, guardrails, observability, and governance — requires more than a model. It requires a **harness**: the operational layer that wraps the model and makes it enterprise-ready. That's what Ensemble provides.

## 2\. Agent Lifecycle Management (ALM)

An agent that works in a demo is not the same as one that works reliably in production. ALM is the discipline of managing an agent through each stage of its life — from initial definition through continuous improvement. Ensemble is built to make each stage straightforward.

1

Define

What should the agent do? What systems does it need? What are its guardrails?

2

Build

Write the system prompt, select a model, connect tools and knowledge bases, define workflows.

3

Test

Run evaluations across real scenarios — not just happy paths. Check tool calls, retrieval, and edge cases.

4

Deploy

Promote from dev → staging → production. Embed the agent in the apps and channels where users need it.

5

Secure

Ensure the agent cannot leak data, exceed its authority, or create compliance risk.

6

Monitor

Track performance, cost, and failures in production. Run monitoring agents to catch issues automatically.

7

Improve

Collect feedback, surface failure patterns, and update the agent's configuration on a continuous basis.

8

Govern

Manage multiple agents across environments with version control, access policies, and compliance standards.

## 3\. Platform architecture

As a full-stack agent harness, Ensemble is organized in five stacked layers — channels at the top through to security at the base — with a continuous observability loop running alongside. Each layer builds on the one below it; together they handle everything between a user's request and a reliable, governed agent response.

Channels & interfacesRich UI widgetSlackWhatsAppVoiceSMSDirect APIMCP serverOrchestrationAgent hierarchiesContext passingMemoryState managementAgentsSupervisoragentSub-agent ASub-agent BSub-agent CLLM modelFast / Std / ReasoningContextMCPTools (API, SQL, MQL…)Knowledge basesWorkflowsPromptsSecurity & complianceIdentity / RBACTenant isolationEnv promotionAudit & complianceKey storeObservability& feedbackEvalsTracing& metricsUserfeedbackAIanalysisMonitoring& governanceImprove& redeploy

Ensemble platform architecture — user requests enter at the top through any channel and flow down through orchestration, agents, and context layers, all underpinned by security. The observability column spans the full stack with a continuous improvement loop.

## 4\. Building agents

Every Ensemble agent is assembled from the same set of building blocks: a system prompt, a model, knowledge bases, workflows, and optionally sub-agents. Together these determine what the agent knows, how it reasons, and what it can do.

### System prompt

The system prompt is the foundation of every agent — it defines the agent's role, objective, and rules. A well-crafted prompt specifies not just what the agent does, but what it must not do: "always verify eligibility before recommending a provider," "escalate if the customer expresses dissatisfaction," "never quote prices without checking current inventory." Think of it as the agent's standing instructions.

### Model selection

Ensemble supports all major model providers out of the box — Anthropic, OpenAI, Google, Mistral, DeepSeek, and others — along with open-source models via self-hosted inference (vLLM, Ollama, or any OpenAI-compatible endpoint). Custom or fine-tuned models can be registered via API and used exactly like built-in ones. Model versions are managed centrally so you can pin agents to specific versions, set organization-wide defaults, and control which models are available in production.

Match the model tier to the task. In multi-agent setups, different agents in the same hierarchy can use different tiers — a supervisor routing requests might use a fast model while a sub-agent doing financial analysis uses a reasoning model.

| Tier | Examples | Best for |
| --- | --- | --- |
| **Fast** | Claude Haiku, GPT-4.1 Mini, Gemini Flash, Mistral Small | Routing, intent classification, FAQ answering, high-volume low-latency tasks |
| **Standard** | Claude Sonnet, GPT-4.1, Gemini Pro, Llama 3.3 70B | Customer support, multi-tool synthesis, report generation — most production workloads |
| **Reasoning** | Claude Opus, o3, DeepSeek R1 | Financial analysis, complex planning, ambiguous requests requiring careful judgment |
| **Custom / self-hosted** | Fine-tuned models, private vLLM or Ollama deployments | Domain-specific tasks, data residency requirements, cost optimization at scale |

![Ensemble LLM model management screen](<Base64-Image-Removed>)

The Ensemble LLM Models screen — all configured models from Anthropic, OpenAI, Cerebras, and others, with per-token pricing and version details. Admins set organization-wide defaults and can register custom or self-hosted models alongside built-ins.

### Knowledge bases

Knowledge bases give agents access to your internal documentation — SOPs, policy docs, product manuals, support articles. Upload documents and Ensemble handles chunking, embedding, and indexing automatically.

At runtime, agents use RAG (Retrieval-Augmented Generation) to answer from your content. When a user asks a question, the agent converts it into a vector a numerical representation of meaning — semantically similar questions produce similar vectors and searches for the document sections closest in meaning. Those sections are injected into the agent's context, grounding its response in your actual documentation rather than base model training data.

Example

An HR agent connected to your benefits documentation can answer "Does my plan cover orthodontics?" by searching the actual plan document and quoting the relevant clause — not by guessing. Update the document, and the knowledge base re-indexes it immediately.

![Ensemble Knowledge Base configuration screen showing embedding model, chunking settings, query parameters, and document stats](<Base64-Image-Removed>)

The Ensemble knowledge base configuration screen — embedding model, chunk size, overlap, similarity threshold, and reranking are all configurable, with sensible defaults that work out of the box. Shown: a financial documents knowledge base with 11 uploaded documents processed into 397 searchable chunks.

### Workflows

Workflows define multi-step processes agents can execute. In Ensemble, you describe workflows in plain natural language — no code or flow diagrams needed. Ensemble generates the workflow structure from your description, which you can then refine, test, and publish like any other configuration.

Workflow execution runs on a massively scalable engine that handles high volumes of concurrent workflows without any infrastructure management on your part. Workflows support three step types, freely mixed within a single flow:

- **Deterministic steps** — fixed rules: if condition X, do Y. Use for compliance checks, approval routing, and any step that must be predictable and auditable.
- **Agentic steps** — hand off to an LLM to interpret context, make judgment calls, and handle exceptions. Use for understanding intent, synthesizing information, and drafting responses.
- **Tool steps** — call external systems directly (query a DB, call an API, send a notification) without going through LLM reasoning.

Example — insurance claims workflow

_Agentic step:_ parse the claim narrative and extract key details → _Deterministic step:_ verify policy coverage and run compliance checks → _Agentic step:_ draft a response for the claimant → _Deterministic step:_ route for human approval if the claim exceeds the threshold. Pure rule-based automation breaks on exceptions; pure LLM is unpredictable for compliance steps. The hybrid handles both cleanly.

![Ensemble workflow builder showing Client Credit Approval](<Base64-Image-Removed>)

The Ensemble workflow builder — a visual canvas where deterministic steps, LLM steps, human approvals, and tool calls are composed into a flow. Shown: the Client Credit Approval workflow with parallel approval paths and conditional routing.

### Agent hierarchies

A single agent works well for focused tasks. As scope grows, it's better to split work across specialized agents. Ensemble supports three composable patterns.

**Why not put everything in one agent?** Three reasons: **context limits** — an agent with 40 tools reasons worse than one with 8, because it struggles to choose between them; **isolation** — a prompt change or bug in one monolithic agent affects all its use cases simultaneously; and **parallelism** — a supervisor can run multiple sub-agents concurrently, a single agent cannot.

- **Default agent with optional sub-agents** — handles most requests end-to-end using its own tools, but can optionally delegate specific tasks to specialist sub-agents. The agent retains its own tools and decides at runtime whether to handle something itself or hand it off. This is the most common pattern.
- **Supervisor agent** — a coordination-only agent that routes every incoming request to the right sub-agent. Doesn't execute tasks directly. Best for multi-domain applications where no single agent can reasonably cover everything.
- **Sub-agents** — specialist agents invoked by a parent. Each runs in its own context window with its own tools, knowledge bases, and instructions. Sub-agents can themselves have sub-agents, enabling deep hierarchies for complex workflows.

Example — default agent with sub-agent delegation

A procurement agent handles most requests itself — vendor status, contract terms, policy questions. When a request involves complex multi-quarter financial analysis, it delegates to a specialized financial analysis sub-agent with deeper data access and a reasoning-tier model. The procurement agent doesn't need to know how to do the analysis; it just knows when to ask for help.

Example — supervisor with domain specialists

A user says: "I was double-charged and now I can't log in." The supervisor identifies two distinct issues and routes them in parallel — a billing sub-agent handles the refund; an account sub-agent diagnoses the login failure. Each specialist accesses only the systems it needs. The supervisor synthesizes both results into a single response.

Sub-agents vs. tools

A tool is a single discrete action (query a database, call an API). A sub-agent is a full reasoning unit — it can use multiple tools, follow a workflow, and make multi-step decisions. Use a tool when the task is one action. Use a sub-agent when the task requires judgment, multiple steps, or specialized context that would bloat the parent agent.

![Ensemble agent hierarchy UI](<Base64-Image-Removed>)

The Ensemble agent hierarchy view — supervisors and their sub-agents shown in an expandable tree, with each agent's tools, workflows, and knowledge bases visible inline. Shown: the Client Operations Supervisor with three specialist sub-agents.

![Ensemble agent configuration screen showing the Credit and Resolution Agent with system prompt, model, description, and four tools](<Base64-Image-Removed>)

A fully configured Ensemble agent — system prompt, model selection, description, and tools (issue\_credit, send\_client\_notification, log\_audit\_event, send\_slack\_notification) all in one view. The "unpublished changes" indicator shows the draft/publish versioning in action: changes are isolated in draft until deliberately promoted.

## 5\. Connecting agents to systems

Agents are only as useful as the systems they can reach. Ensemble handles this through **connections** (authentication profiles for external systems) and **tools** (the actions agents can take once connected).

### Connections

A connection is a reusable, pre-configured authentication profile for an external system — your CRM, ERP, HRIS, or database. Credentials are stored encrypted server-side and are never exposed to the browser or the LLM. When agents are promoted across environments, credentials are automatically re-encrypted for the target environment.

### Tools

Tools are what agents and workflows use to take action. The same tool can be invoked by an agent reasoning about what to do next, or as an explicit step within a workflow — the same tool works in both contexts.

Ensemble ships with a large library of pre-built connectors — Salesforce, HubSpot, Jira, ServiceNow, Zendesk, Workday, SAP, and many others — requiring no custom integration work. Utility tools (web search, geocoding, weather) are available with no setup. For everything else, Ensemble provides flexible building blocks:

- **HTTP Call / API Connection** — call any REST API, with reusable auth for frequently accessed systems
- **SQL / MQL / GraphQL** — query relational databases, MongoDB, or GraphQL endpoints with parameterized queries to prevent injection attacks
- **Notifications** — send Slack messages or SMS via Twilio / AWS SNS
- **JavaScript** — run custom server-side logic for transformations, calculations, or combining data from multiple sources
- **RAG Search** — semantic search across your uploaded knowledge bases

Tool design tip

Keep tools narrowly focused. An agent chooses tools based on their names and descriptions — `get_order_status` leads to better selection than `query_db`. Always return useful error information on failure so the agent can decide whether to retry, ask the user for clarification, or try an alternative path.

## 6\. Deploying agents

Ensemble agents can be embedded in applications, invoked directly via API, or exposed as an MCP server. One agent configuration powers all three — build once, integrate anywhere.

### Chat widget

A React-based chat widget that embeds in any web or mobile application, with real-time response streaming. Authentication flows through JWT tokens a secure, compact standard for passing user identity between systems — API keys and secrets never reach the browser. The widget is highly customizable: it supports fully custom UI themes, and agents can return structured JSON rendered as rich interactive components — tables, charts, booking forms, product cards — built as custom React components in your codebase.

### REST APIs

Every agent and every workflow is individually available as a REST API endpoint. Any system that can make an HTTP request can invoke an agent or trigger a workflow — backend services, mobile apps, third-party platforms, or scheduled jobs. This makes Ensemble agents first-class citizens in any existing architecture, no chat interface required.

### MCP server

The entire Ensemble platform is exposed as an MCP server. Model Context Protocol: an open standard for AI models to securely discover and call external tools and data sources This means any MCP-compatible AI client — Claude Desktop, Cursor, and others — can discover and invoke your agents, workflows, and tools directly. Organizations building AI-native internal tooling can expose their entire agent catalog through a single endpoint.

### Channels

The same agent configuration powers all communication channels: embedded web widget, Slack (webhook), SMS and WhatsApp (Twilio / AWS SNS), and Voice (Twilio / WebRTC with real-time TTS and STT).

### Deployment options

| Option | Description | Best for |
| --- | --- | --- |
| **Public cloud** | Ensemble-hosted, internet-accessible | Teams wanting fast time-to-value with no infrastructure management |
| **Private cloud** | Dedicated infrastructure, not shared with other tenants | Organizations requiring network isolation or custom security configuration |
| **Self-hosted** | Deployed in your own data center; all data stays within your perimeter | Healthcare, financial services, government, defense — wherever data cannot leave the organization |

## 7\. The Ensemble chat widget

The Ensemble chat widget is more than an embeddable chatbox. It's a fully programmable UI runtime — designed so that every aspect of the experience, from styling to data to component rendering, is under your control. Agents communicate through it, but so does your application: passing context, injecting components, and controlling session isolation all happen at the integration layer.

### Custom React components rendered at runtime

Agents can return structured JSON payloads that the widget renders as fully custom React components — inline, in the conversation flow, in real time. These aren't pre-built templates: they're components you write and register. A vendor recommendation surfaces as a rich card with a map, distance, and action buttons. A product search returns an interactive grid. A booking confirmation renders a form. The agent handles the reasoning; your components handle the presentation.

![Ensemble Chat Configurator showing custom widget types alongside a live preview rendering rich vendor recommendation cards](<Base64-Image-Removed>)

The Ensemble Chat Configurator — custom widget types (person-card, map-widget, vendor-cards) registered alongside built-ins. The live preview shows an agent response rendered as rich, interactive vendor cards with location data, verification badges, and action buttons — not plain text.

### Fully configurable

Every visual aspect of the widget is overridable. CSS variables control colors, typography, border radii, and spacing — override any of them to match your application's design system exactly. The widget ships with a live configurator where style changes reflect instantly in a preview, making it straightforward to tune the experience before embedding. The widget works in two modes: **inline**, rendered as a persistent interface in a designated page area, and **popup**, triggered as an overlay — switchable via configuration with no code changes.

### SDK and runtime context

The Ensemble SDK handles initialization, authentication, and session management. At runtime, your application can pass context directly into the agent's session — the current user, their role, the page they're on, any relevant application state. The agent receives this context and can use it to personalize responses, filter results, or apply role-appropriate guardrails, without the user having to re-explain their situation.

Example

A healthcare application passes the current patient's ID and care plan status into the widget on initialization. The agent immediately knows who it's talking to and what their care status is — without the patient needing to identify themselves or repeat information already in their record.

### Multi-threaded and user-isolated

Each user session runs in its own isolated thread. Conversation history, context, and state are scoped to that session and never bleed across users — enforced at the platform level, not just the application level. The caller controls session lifecycle via the SDK: create a new thread, resume an existing one, or clear a session entirely. This makes the widget suitable for multi-user environments, shared devices, and applications where strict per-user isolation is a compliance requirement.

What this enables

Most embedded chat widgets give you a styled chatbox. Ensemble's widget gives you a rendering engine: the agent decides what to say and what data to return; your application decides how to present it. The result is agent-powered experiences that feel native to your product, not bolted on.

## 8\. Testing and observability

### Evaluations

Ensemble's evaluations module tests the full agent pipeline — not just the LLM's text output, but tool calls, knowledge base retrievals, and workflow execution. An agent can produce a plausible-sounding response while calling the wrong API or misinterpreting the data it retrieved. Evals catch these failures before users encounter them. You define test cases with sample inputs and expected outputs; the eval framework verifies the agent produces the right results through the right steps.

### Monitoring agents

Monitoring agents are a second line of defense that runs continuously in production. These are purpose-built agents configured to observe live conversations across multiple dimensions — automatically, at scale, without requiring human review of every exchange:

- **Response quality** — are answers accurate, complete, and relevant?
- **Sentiment and tone** — are users expressing frustration, confusion, or dissatisfaction?
- **Policy compliance** — is the agent staying within its guardrails, escalating when it should?
- **Data leakage** — is the agent surfacing content it shouldn't — other users' records, confidential data, internal information?
- **PII handling** — is sensitive data (names, account numbers, health information) being masked or handled appropriately?
- **Hallucination detection** — is the agent making claims not supported by its knowledge base or retrieved data?

When a monitoring agent detects an issue, it can trigger automated actions: flag the conversation for human review, alert the agent owner, or escalate to a live agent. This creates a continuous quality loop without manual auditing at scale.

Example

A financial services company deploys a customer support agent for account inquiries. A monitoring agent observes every conversation, checking for PII in responses, compliance with disclosure requirements, and any discussion of products outside the agent's authorized scope. When a conversation is flagged, a compliance team member receives an alert with the full context, the specific policy triggered, and a recommended action.

### Versioning

Every agent and tool exists in one of two states: **Draft** — the editable working copy used for development and testing — and **Published** (v1, v2…) — an immutable snapshot. Once published, a version never changes; previous versions remain accessible for instant rollback. The workflow is always: edit in draft → run evals → publish when ready. A published agent should always reference published tools, not drafts — a published agent referencing a draft tool can break silently when someone edits that tool.

### Environment promotion

Configurations sync one-way across environments: `dev` → `staging` → `prod`. All dependencies — tools, knowledge bases, connections, sub-agents — are included in the sync, preventing partial deployments. Credentials are re-encrypted for the target environment automatically. The sync API integrates directly with CI/CD pipelines.

### Observability

Ensemble provides full production visibility through message tracing (step-by-step view of each turn — tools called, knowledge retrieved, reasoning taken), performance metrics (token usage, latency, and cost per agent and workflow), user feedback (thumbs up/down built into the chat widget), and AI-powered improvement suggestions generated from patterns in feedback and monitoring data.

![Ensemble message tracing UI](<Base64-Image-Removed>)

Ensemble message tracing — conversation threads listed on the left, full turn-by-turn detail on the right. Each message shows the agent, timestamp, and exact content, making it straightforward to trace unexpected behavior back to its source.

The improvement loop

Deploy → monitoring agents surface issues in live conversations → patterns appear in the observability dashboard → agent owner updates configuration → evals verify the fix → promote to production. Agents improve continuously with use, not just at launch.

![Ensemble user feedback dashboard](<Base64-Image-Removed>)

The Ensemble feedback dashboard — total responses, satisfaction rate, positive/negative counts, and a filterable feed of individual ratings by agent and time period.

## 9\. Security and data protection

### Identity and access

Ensemble enforces role-based access control (RBAC) with three roles: Owner, Admin, and standard user. User identity flows through JWT tokens from your existing auth system — agent API keys and secrets are managed entirely server-side and never reach the browser or the LLM's context window.

### Data isolation

All conversations, tool inputs/outputs, and knowledge base contents are isolated at the tenant level. One organization's data is never accessible to another. Credentials in connections are encrypted at rest and re-encrypted when synced across environments.

### Preventing data exposure

- **Server-side credential management** — secrets never touch the browser or LLM context
- **Parameterized SQL queries** — prevents injection attacks at the tool layer
- **Tenant isolation** — no cross-tenant data access by architecture
- **Role-based access** — only Admin/Owner roles can configure connections or initiate environment syncs
- **Monitoring agents** — continuously scan live conversations for data leakage, PII exposure, and policy violations in real time (see Section 7)

### Compliance

Ensemble maintains the following certifications. These apply to the platform itself — organizations handling regulated data should additionally establish their own policies around data access, conversation retention, and agent behavior auditing.

SOC 2 Type II

Security, availability & confidentiality

ISO 27001

Information security management

## 10\. Governance and policies

AI agent governance differs from traditional software governance in one fundamental way: agent behavior is not fully determined by code. It's shaped by instructions, model choices, retrieved data, and runtime context — all of which can vary. A prompt edit changes how an agent handles thousands of edge cases. A model upgrade can subtly shift reasoning. A knowledge base update changes what the agent believes.

This creates two distinct challenges: **operational governance** — how changes are made, tested, and deployed safely — and **AI governance** — what agents are permitted to do, say, and decide. Both are essential.

### AI governance

**Behavioral guardrails.** Every production agent needs explicit written rules for what it must not do: topics to decline, actions requiring human approval, how to handle sensitive requests. These live in the system prompt and should be treated as formal policy documents — reviewed and versioned just like code. A poorly written guardrail is as dangerous as a missing one: overly broad restrictions make agents useless; overly narrow ones leave gaps.

Example — guardrails for a financial support agent

"Never commit to a refund or credit over $500 without routing to a human agent." "Do not recommend products outside the approved catalog." "If a customer mentions legal action, acknowledge and transfer immediately — do not attempt to resolve."

**Human-in-the-loop (HITL) policies.** Define which decisions agents can make autonomously and which require a human sign-off. The threshold should be based on reversibility and impact. Low-stakes, reversible actions (answering questions, looking up records) can be fully autonomous. High-stakes or irreversible actions (initiating payments, sending external communications, modifying critical records) should have a human approval step built into the workflow.

**Model governance.** Define which model providers and versions are approved for production use, establish tier-by-use-case guidelines (not every workflow needs the most powerful model), and treat model upgrades as significant changes requiring testing. A model update can alter agent behavior in ways that aren't obvious until they affect real conversations.

**Continuous behavioral monitoring.** Monitoring agents (Section 7) are the operational arm of AI governance — they actively watch live conversations for policy violations, data exposure, and quality issues. This creates an audit trail of agent _behavior_, not just configuration, and surfaces the gap between what you intended the agent to do and what it's actually doing.

**AI behavioral incidents.** AI agents introduce a new category of incident beyond outages and breaches: behavioral incidents — cases where an agent does something unexpected, harmful, or contrary to policy. Define a response process: who is notified, what triggers an immediate rollback vs. a configuration patch, how affected users are identified and communicated with, and how root cause is analyzed.

### Operational governance

**Versioning and promotion.** Production always runs a published version — never a draft. Changes flow one-way through dev → staging → prod, initiated only by Admin or Owner roles. All dependencies are promoted together. The sync API integrates with CI/CD for programmatic, auditable promotion. (Full versioning details in Section 7.)

**Role-based permissions.** Owners and Admins can build agents, configure connections, and promote to production. Standard users can interact with agents but cannot modify configurations.

**Audit trails.** All agent interactions, tool invocations, configuration changes, and environment promotions are logged — a complete record of what each agent did, what data it accessed, and who changed its configuration. Essential for compliance reporting and incident investigation.

### Data access policies

Apply least privilege at the agent level. Each agent is configured with only the connections and tools it genuinely needs for its role.

| Agent | Should have access to | Should not have access to |
| --- | --- | --- |
| Customer support | CRM, order management, product knowledge base | HR database, financial systems, internal pricing |
| HR benefits | Benefits documents, employee records (read-only) | Payroll write access, performance review data |
| Procurement | Vendor database, budget system, approval workflows | Customer data, employee compensation records |

### Operational policies to establish

- **Agent registry** — maintain a list of every production agent: owner, model, connected systems, last review date, and compliance classification. Without a registry you cannot audit what's running or respond quickly to incidents.
- **Change management** — define who approves changes to production agents. A small prompt wording change can significantly alter how an agent handles edge cases across thousands of conversations.
- **Review cadence** — quarterly reviews of production agents: check for model deprecations, review monitoring reports, verify connected systems haven't changed, confirm guardrails still reflect current policy.
- **Incident response** — who is notified when an agent behaves unexpectedly, the rollback threshold, how affected users are communicated with, and what the post-incident review looks like.

The governing principle

Think of a production agent like a new employee with direct access to your systems and customer relationships. You wouldn't give that person unrestricted access and no guidelines. The same logic applies: define what they're allowed to do, scope their access to what they need, monitor their work, and have a clear plan for when things go wrong.

## 11\. Picking the right use cases

Starting with the wrong use case wastes time and erodes organizational confidence. Here's a practical framework for identifying where to start.

### Strong candidates

- **High-volume tasks with variation** — the same general task happens frequently, but each instance differs enough that rigid scripting breaks down. Example: customer support inquiries that follow common patterns but require different data lookups each time.
- **Multi-step processes crossing systems** — completing the task requires querying or updating multiple systems. Example: vendor payment processing requires matching an invoice to a PO, checking budget approval, verifying vendor details, and initiating payment — across ERP, procurement, and banking systems.
- **Long wait times caused by data gathering** — hours or days of delay primarily because someone is looking up information across multiple systems. Example: a care specialist searching two databases and policy documents for 24 hours to make a vendor recommendation — reduced to seconds with an agent.
- **Knowledge-intensive tasks with existing documentation** — answers exist in SOPs and policy docs, but finding and applying the right information is slow. Example: benefits navigation requiring guidance drawn from complex plan documents.

### Poor candidates

- **Fully deterministic processes** — if every instance follows the same steps with no judgment required, traditional automation (scripts, RPA) is simpler and more predictable.
- **High-stakes decisions with zero error tolerance** — where any mistake has severe, irreversible consequences. Use agents to gather and present information; keep a human in the loop for the final call.
- **No digital data access** — if the information needed doesn't exist in queryable systems, an agent has nothing to work with. Get the data into accessible systems first.

Where to start

Ask: where are skilled employees spending hours on tasks that feel like they should take minutes? Start narrow — one well-scoped workflow — measure before and after, and use the evidence to expand.

## 12\. How Ensemble compares

| Alternative | What it gives you | Where it falls short | Ensemble's approach |
| --- | --- | --- | --- |
| **DIY on cloud**<br>AWS Bedrock, Azure OpenAI, GCP Vertex | Maximum flexibility; you choose every component | You build and maintain everything: orchestration, versioning, evals, security, multi-tenancy, deployment pipelines | All of that is built in. Focus on the agent's purpose, not the infrastructure. |
| **Traditional RPA**<br>UiPath, Automation Anywhere | Proven for deterministic, rule-based automation; strong legacy system integration | Breaks on variation. Bolting LLMs onto RPA retrofits intelligence onto a rules engine. | AI-native from the ground up. Hybrid workflows combine LLM reasoning and deterministic rules naturally. |
| **Vertical point solutions**<br>Domain-specific chatbots, copilots | Fast time-to-value for one specific use case | Fragmentation — each use case is its own vendor, integration, and data silo. No shared infrastructure or learnings. | One platform for all agent types. Build connections, security, and tooling once; reuse across every use case. |
| **Raw LLM APIs**<br>Direct OpenAI, Anthropic, Google | Simplest path for simple use cases; no intermediary layer | Everything else: tool orchestration, knowledge management, multi-agent coordination, versioning, observability, security | Ensemble is the harness layer — the orchestration, tooling, observability, and governance infrastructure that turns a model into a production-ready agent. |

* * *

Ensemble Platform Guide: Building and Running AI Agents at Scale
For enterprise IT leaders and engineers