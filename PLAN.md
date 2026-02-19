# AWSArchitect — Implementation Plan

## Context

Building a web app that visualizes AWS infrastructure as interactive architecture diagrams. Starting with `.tfstate` as the first input source, but designed to support AWS CDK, CloudFormation, Pulumi, and more in the future. Monorepo scaffold (shared types, backend routes, tfstate parser) is partially complete. The goal is to finish the backend graph builder, scaffold the full frontend, and wire everything together — with small verified steps, tests before moving on, and commits at each milestone.

**Project name:** AWSArchitect (was AWSArchitect — renamed to reflect broader AWS focus, not Terraform-only)

**Key principles (user requirements):**
- Small moves only — one piece at a time
- Tests must pass before moving to the next step
- Commits at each milestone for rollback safety
- No rabbit holes — minimum code for the current step
- GitHub repo with tickets and architecture first

---

## What Already Exists

| File | Status |
|------|--------|
| `packages/shared/src/index.ts` | ✅ Complete — all types defined |
| `apps/backend/src/index.ts` | ✅ Complete — Express server |
| `apps/backend/src/routes/parse.ts` | ✅ Complete — both endpoints |
| `apps/backend/src/parser/tfstate.ts` | ✅ Complete — `parseTfstate()` + `extractResources()` |
| `apps/backend/src/parser/graph.ts` | ❌ Missing — imported but not created |
| `apps/frontend/` | ❌ Empty |

---

## Implementation Steps

### STEP 0 — GitHub Setup (before any code)

**Actions:**
1. Rename project folder: `mv terracanvas aws-architect`
2. `git init` in project root
3. Create initial commit with existing files
4. `gh repo create aws-architect --public --source=. --push`
   - Repo is **public**
   - Claude is NOT added as a collaborator — all commits are authored by the user's git config
5. Create labels first: `backend`, `frontend`, `testing`, `integration`
6. Create GitHub Issues for each milestone (using `gh issue create`):
   - Issue #1: `[Backend] Implement graph builder (graph.ts)` — label: `backend`
   - Issue #2: `[Backend] Add fixture + smoke test script` — label: `backend`, `testing`
   - Issue #3: `[Frontend] Scaffold Next.js app` — label: `frontend`
   - Issue #4: `[Frontend] Upload component` — label: `frontend`
   - Issue #5: `[Frontend] React Flow canvas + custom nodes` — label: `frontend`
   - Issue #6: `[Frontend] Sidebar detail panel` — label: `frontend`
   - Issue #7: `[Infra] Wire frontend ↔ backend end-to-end` — label: `integration`

**Verification:** `gh repo view` shows repo, `gh issue list` shows all 7 issues.

**Commit:** `chore: initial project scaffold`

---

### STEP 1 — Backend: graph.ts (closes Issue #1)

**File:** `apps/backend/src/parser/graph.ts`

**What it does:**
- Exports `buildGraph(tfstate: Tfstate): ParseResponse`
- Internally calls `extractResources()` from `tfstate.ts`
- Builds edges by resolving attribute-based relationships
- Builds nodes with VPC → Subnet → Resource parent grouping
- Auto-positions nodes on a grid

**Edge detection — attribute keys to check per resource:**
```
vpc_id           → subnet/SG/IGW/NAT → VPC
subnet_id        → EC2/RDS/NAT/LB → subnet
subnet_ids[]     → LB → subnet (array)
security_groups[] / vpc_security_group_ids[] → → SG
nat_gateway_id   → route table → NAT
internet_gateway_id → route table → IGW
instance_id      → EIP → EC2
allocation_id    → NAT → EIP
load_balancer_arn → listener → LB
```

**AWS ID resolution:** Build `Map<string, string>` from `attributes.id → resource.id`. Use this to resolve AWS IDs (e.g. `"vpc-0abc"`) back to Terraform IDs (e.g. `"aws_vpc.main"`). Fall back to `resource.dependencies[]` if attribute resolution fails.

**Layout constants (fixed for v1):**
```
VPC: x=0, y=i*(800+60), width=900, height=700
Subnet: x=padding+(j%2)*420, y=100+(j/2|0)*320, width=380, height=280
Resource: x=padding+(k%3)*230, y=60+(k/3|0)*120, width=200, height=90
Root-level resources: x=960, y=i*130
```

**NodeType mapping:**
```
aws_vpc → vpcNode
aws_subnet → subnetNode
aws_internet_gateway → igwNode
aws_nat_gateway → natNode
aws_route_table / aws_route_table_association → routeTableNode
aws_security_group → securityGroupNode
aws_instance → ec2Node
aws_db_instance → rdsNode
aws_lb / aws_alb → lbNode
aws_eip → eipNode
aws_s3_bucket → s3Node
aws_lambda_function → lambdaNode
everything else → genericNode
```

**Critical implementation notes:**
- `nodeTypes` keys must match the string values in the `NodeType` union from shared
- Child node positions are RELATIVE to parent (React Flow parent-child semantics)
- Set `style: { width, height }` on VPC and Subnet nodes so React Flow sizes the containers
- Deduplicate edges with a `Set<string>` keyed by `source|target`

**Test (smoke):** `npx tsx apps/backend/src/scripts/test-parse.ts` must print nodes/edges with correct parent relationships. Must pass before committing. Unit tests will be added in a later quality pass.

**Commit:** `feat(backend): implement graph builder with relationship detection (closes #1)`

---

### STEP 2 — Backend: Fixture + test-parse script (closes Issue #2)

**File 1:** `apps/backend/src/fixtures/sample.tfstate`

Realistic minimal AWS infra:
- 1 VPC (`vpc-001`, CIDR `10.0.0.0/16`)
- 2 subnets: `subnet-pub` (public, `10.0.1.0/24`) + `subnet-priv` (private, `10.0.2.0/24`)
- 1 IGW attached to VPC
- 1 EIP + 1 NAT Gateway in public subnet
- 1 Security Group in VPC
- 1 EC2 in public subnet with the SG
- 1 RDS in private subnet with the SG
- 1 ALB in public subnet
- 1 S3 bucket (no VPC — should float at root)

All attributes must include realistic `id` values (e.g. `"vpc-0main001"`) and the `dependencies` array pointing to Terraform resource addresses.

**File 2:** `apps/backend/src/scripts/test-parse.ts`

Script that:
1. Reads fixture file
2. Calls `parseTfstate()` + `buildGraph()`
3. Prints summary: `nodeCount`, `edgeCount`, `resourceCount`, `warnings`
4. Prints node list with `id`, `type`, `parentNode`
5. Prints edge list

**Verification checklist (must all be true before committing):**
- [ ] `nodeCount >= 10`
- [ ] `edgeCount >= 5`
- [ ] VPC node has no `parentNode`
- [ ] Both subnet nodes have `parentNode === 'aws_vpc.main'`
- [ ] EC2 node has `parentNode === 'aws_subnet.public_1'`
- [ ] S3 bucket has no `parentNode`
- [ ] No duplicate edges
- [ ] `warnings` is empty array

**Commit:** `feat(backend): add sample fixture and test-parse pipeline script (closes #2)`

---

### STEP 3 — Frontend: Scaffold Next.js app (closes Issue #3)

**Files to create (config only — no feature code):**
- `apps/frontend/package.json` — next@14, react@18, reactflow@11, tailwindcss@3, `@awsarchitect/shared: "*"`
- `apps/frontend/tsconfig.json` — Next.js compatible (ESNext/bundler, NOT NodeNext)
- `apps/frontend/next.config.ts` — `transpilePackages: ['@awsarchitect/shared']`
- `apps/frontend/tailwind.config.ts` — content paths + navy color tokens
- `apps/frontend/postcss.config.js` — tailwind + autoprefixer
- `apps/frontend/src/app/globals.css` — Tailwind directives + React Flow dark theme overrides
- `apps/frontend/src/app/layout.tsx` — root layout, metadata, dark body
- `apps/frontend/src/app/page.tsx` — placeholder: just `<h1>AWSArchitect</h1>` for now

**Verification:** `npm install && npm run dev --workspace=apps/frontend` starts without errors. `http://localhost:3000` shows "AWSArchitect" heading.

**Commit:** `feat(frontend): scaffold Next.js app with Tailwind and React Flow (closes #3)`

---

### STEP 4 — Frontend: Upload component (closes Issue #4)

**File:** `apps/frontend/src/components/Upload.tsx`

Features:
- Drag-and-drop zone + click-to-browse
- Only accepts `.tfstate` / `.json` files
- States: `idle` | `dragging` | `ready` (file selected) | `invalid`
- Shows file name + size when ready
- "Parse →" button calls `onFileAccepted(file)`

**Update** `apps/frontend/src/app/page.tsx` to render `<Upload onFileAccepted={...} />`.

**Verification:** Drag a `.tfstate` file into the browser — file name appears, "Parse" button enabled. Drag a `.txt` file — shows error state.

**Commit:** `feat(frontend): add drag-and-drop upload component (closes #4)`

---

### STEP 5 — Frontend: API client + Canvas + Nodes (closes Issue #5)

Three sub-steps, each verified before the next:

**5a — API client**
- `apps/frontend/src/lib/api.ts`
- `parseFile(file: File): Promise<ParseResponse>` — POST multipart to `/api/parse`
- `parseRaw(tfstate: string): Promise<ParseResponse>` — POST JSON to `/api/parse/raw`
- Wire into `page.tsx`: `onFileAccepted` calls `parseFile`, stores result in state

**Verification:** Upload `sample.tfstate` → console.log shows `ParseResponse` with nodes/edges. Backend must be running.

**5b — Node components** (one at a time, simplest first)

Each node file follows this pattern:
```tsx
import { Handle, Position, type NodeProps } from 'reactflow';
import type { GraphNodeData } from '@awsarchitect/shared';

export function XxxNode({ data, selected }: NodeProps<GraphNodeData>) {
  return (
    <div className={`node-card ${selected ? 'ring-2 ring-white' : ''}`}>
      <span>[icon]</span>
      <span>{data.label}</span>
      <span className="text-xs text-slate-400">{keyAttribute}</span>
      <Handle type="source" position={Position.Right} />
      <Handle type="target" position={Position.Left} />
    </div>
  );
}
```

Order to create:
1. `GenericNode.tsx` — fallback, simplest
2. `Ec2Node.tsx` — amber border, shows `instance_type`
3. `RdsNode.tsx` — purple border, shows `engine`
4. `S3Node.tsx` — pink border, shows `bucket`
5. `LambdaNode.tsx` — orange border, shows `runtime`
6. `LbNode.tsx` — cyan border, shows `load_balancer_type`
7. `SubnetNode.tsx` — green border, container node, shows `cidr_block`
8. `VpcNode.tsx` — blue border, container node, shows `cidr_block`

Container nodes (VPC, Subnet) do NOT use `<Handle>` — they use `<NodeResizer>` and render children via React Flow's parent-child mechanism.

**5c — Canvas component**
- `apps/frontend/src/components/Canvas.tsx`
- `nodeTypes` defined at MODULE scope (not inside component)
- Uses `useNodesState` + `useEdgesState`
- `<Background variant="dots" />`, `<Controls />`, `<MiniMap />`
- `onNodeClick` → calls `onNodeSelect(id)`
- `onPaneClick` → calls `onNodeSelect(null)`

**Update** `page.tsx` to show `<Canvas>` when data is loaded.

**Verification:** Upload `sample.tfstate` → canvas renders VPC box containing subnets containing resources. Zoom/pan works. S3 floats outside VPC.

**Commit:** `feat(frontend): add React Flow canvas with custom AWS nodes (closes #5)`

---

### STEP 6 — Frontend: Sidebar (closes Issue #6)

**File:** `apps/frontend/src/components/Sidebar.tsx`

Sections when a node is selected:
1. Header: type badge + display name + region
2. Attributes: filtered key/value table (exclude `id`, `arn`, `tags`, `tags_all`, `owner_id`, `timeouts`)
3. Tags: key=value chips, "No tags" if empty
4. Dependencies: list with display name + type badge, "No dependencies" if empty

When nothing selected: "Click a node to inspect it" prompt.

**Update** `page.tsx`: `flex h-screen` layout, canvas takes `flex-1`, sidebar is `w-80`.

**Verification:** Click EC2 node → sidebar shows `instance_type`, security group IDs, tags. Click pane → sidebar shows prompt. Click S3 → shows bucket name.

**Commit:** `feat(frontend): add click-to-inspect sidebar panel (closes #6)`

---

### STEP 7 — End-to-end integration check (closes Issue #7)

**Actions:**
1. `npm run dev` from root (starts both backend + frontend concurrently)
2. Open `http://localhost:3000`
3. Upload `apps/backend/src/fixtures/sample.tfstate`
4. Verify full visual checklist:
   - [ ] VPC renders as large container
   - [ ] Both subnets inside VPC
   - [ ] EC2 inside public subnet
   - [ ] RDS inside private subnet
   - [ ] S3 floats outside
   - [ ] Edges visible between related nodes
   - [ ] Minimap in corner
   - [ ] Click node → sidebar populates
   - [ ] Click pane → sidebar clears
   - [ ] Zoom and pan work
5. Write `README.md` with setup + dev + test instructions

**Commit:** `feat: complete end-to-end integration (closes #7)`

---

## File Creation Order (dependency-safe)

```
1.  packages/shared — already done, build first
2.  apps/backend/src/parser/graph.ts
3.  apps/backend/src/fixtures/sample.tfstate
4.  apps/backend/src/scripts/test-parse.ts
    → RUN: npx tsx apps/backend/src/scripts/test-parse.ts
    → COMMIT if green
5.  apps/frontend/package.json
6.  apps/frontend/tsconfig.json
7.  apps/frontend/next.config.ts
8.  apps/frontend/tailwind.config.ts + postcss.config.js
9.  apps/frontend/src/app/globals.css
10. apps/frontend/src/app/layout.tsx
11. apps/frontend/src/app/page.tsx (placeholder)
    → RUN: npm run dev --workspace=apps/frontend
    → COMMIT if green
12. apps/frontend/src/components/Upload.tsx
    → TEST: drag file, visual check
    → COMMIT if green
13. apps/frontend/src/lib/api.ts
14. apps/frontend/src/components/nodes/GenericNode.tsx
15. apps/frontend/src/components/nodes/Ec2Node.tsx
16. apps/frontend/src/components/nodes/RdsNode.tsx
17. apps/frontend/src/components/nodes/S3Node.tsx
18. apps/frontend/src/components/nodes/LambdaNode.tsx
19. apps/frontend/src/components/nodes/LbNode.tsx
20. apps/frontend/src/components/nodes/SubnetNode.tsx
21. apps/frontend/src/components/nodes/VpcNode.tsx
22. apps/frontend/src/components/Canvas.tsx
    → TEST: upload + canvas renders
    → COMMIT if green
23. apps/frontend/src/components/Sidebar.tsx
    → TEST: click node + sidebar
    → COMMIT if green
24. README.md
    → Final integration test
    → COMMIT
```

---

## Verification Gates (never skip these)

| After step | Must verify before continuing |
|------------|------------------------------|
| graph.ts | `npx tsx test-parse.ts` — nodeCount > 0, edges > 0, correct parentNode values |
| frontend scaffold | `npm run dev` starts, `localhost:3000` loads |
| Upload component | File drag works, invalid file rejected |
| API client wired | Browser console shows ParseResponse on upload |
| Canvas | VPC → Subnet → Resource hierarchy visible |
| Sidebar | Attributes + tags appear on node click |
| Final | Full visual checklist above passes |

---

## Engineering Constraints (non-negotiable)

1. **Small moves** — one file at a time, never write more than needed for the current step
2. **Test before commit** — every verification gate must pass before moving to the next step
3. **Commit per milestone** — each step gets its own commit so we can roll back cleanly
4. **No rabbit holes** — if something blocks us, stop and discuss rather than patch around it
5. **Smoke test is the pipeline** — `npx tsx test-parse.ts` is the ground truth for backend correctness
6. **No Claude as collaborator** — all git config is the user's, Claude only authors code content
7. **Unit tests later** — smoke tests for v1, proper Vitest coverage added in a quality pass

---

## Critical Technical Notes

1. **`nodeTypes` at module scope** — defining inside Canvas component causes infinite React Flow re-renders
2. **Child positions are relative** — when `parentNode` is set, x/y are relative to parent container, not canvas origin
3. **`transpilePackages`** in next.config.ts is required for `@awsarchitect/shared` to resolve in Next.js
4. **Frontend tsconfig** must use `"module": "esnext"` + `"moduleResolution": "bundler"` — NOT NodeNext (which is for the backend)
5. **Build shared first** — `npm run build --workspace=packages/shared` before frontend dev server
