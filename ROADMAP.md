# AWSArchitect Roadmap & Feature Plan

> **Last updated**: 2026-02-20
> **Current state**: 11 sample resources, 13 node types, search, detail panel, upload flow
> **Branch**: Pick items from here and implement on feature branches

---

## Priority Legend

- **P0** — High impact, reasonable effort. Do these first.
- **P1** — High impact, moderate effort. Strong value-adds.
- **P2** — Nice to have, or high effort. Do when P0/P1 are stable.
- **P3** — Ambitious / long-term vision items.

---

## 1. Export & Sharing (P0)

### 1a. Export diagram as PNG/SVG
- Use `html-to-image` or React Flow's `toObject()` + canvas rendering
- Add "Export" button to toolbar (dropdown: PNG, SVG)
- Include legend and title in export
- **Why**: The #1 thing users will want — put the diagram in a doc or Slack

### 1b. Export as draw.io XML
- Convert React Flow nodes/edges to draw.io mxGraph XML format
- Preserves layout, colors, grouping (VPC/subnet containers)
- Users can import into draw.io/Lucidchart for further editing
- **Why**: Bridges the gap between auto-generated and hand-crafted diagrams

### 1c. Shareable link (encode state in URL)
- Compress parsed response with `lz-string` and encode in URL hash
- Or: generate short-lived server-side links (needs persistence)
- Client-only approach (URL hash) is simpler and needs no backend changes
- **Why**: "Look at my infrastructure" without sending files around

---

## 2. Interactive Canvas (P0)

### 2a. Draggable nodes with layout save
- Enable `onNodesChange` handler for position changes
- Store custom layout in `localStorage` keyed by a hash of the resource IDs
- "Reset layout" button to return to auto-layout
- **Why**: Auto-layout is never perfect. Users need to rearrange.

### 2b. Collapsible VPC/Subnet containers
- Click a collapse icon on VPC/subnet header to hide children
- Show a badge with child count when collapsed
- Reduces visual clutter for large infrastructures
- **Why**: Real AWS accounts have 50+ resources; need to manage complexity

### 2c. Resource type filter toggles
- Clickable resource badges in the top bar (already showing counts)
- Click a badge to toggle visibility of that resource type
- Active filters shown as pills, "Show all" reset
- **Why**: "Show me only EC2 and RDS" is a very common workflow

### 2d. Keyboard shortcuts
- `Cmd/Ctrl+K` → focus search bar
- `Escape` → deselect node / close panel / clear search
- Arrow keys → navigate between nodes
- `Cmd/Ctrl+E` → export menu
- Show shortcut hints in a `?` tooltip
- **Why**: Power users expect keyboard-driven navigation

---

## 3. Detail Panel Enhancements (P0)

### 3a. Security Group rule expansion
- Show ingress/egress rules inline in the detail panel
- Format: `TCP 443 from 0.0.0.0/0`, `TCP 5432 from sg-abc123`
- Color-code by risk (0.0.0.0/0 = red warning, private CIDR = green)
- **Why**: SG rules are the #1 thing people check in architecture reviews

### 3b. Copy Terraform ID / attributes
- Click-to-copy button next to Terraform ID
- Copy individual attribute values
- "Copy all as JSON" for the full resource
- **Why**: Users will want to reference IDs in their terminal/editor

### 3c. Deep-link to resource
- Clicking a connected resource in the detail panel should:
  - Select that node on the canvas
  - Pan/zoom to center it
  - Open its detail panel
- **Why**: Navigate complex graphs by following connections

---

## 4. New AWS Resource Nodes (P1)

These types are already in `SUPPORTED_TYPES` but render as `genericNode`:

### 4a. ECS cluster/service/task nodes
- Custom `ecsClusterNode` (container, like VPC)
- `ecsServiceNode` and `ecsTaskNode` inside it
- Dedicated icon (container/gear motif)
- Show task count, CPU/memory in detail panel

### 4b. EKS cluster node
- `eksClusterNode` container
- Show Kubernetes version, endpoint
- Dedicated icon

### 4c. SQS / SNS nodes
- `sqsNode` with queue depth attribute
- `snsNode` with subscription count
- Show FIFO badge for SQS FIFO queues

### 4d. CloudFront distribution node
- `cloudfrontNode` with origin domain, price class
- Place at top of diagram (edge/CDN layer)

### 4e. API Gateway node
- `apiGatewayNode` with stage, endpoint type
- Show REST vs HTTP API distinction

### 4f. ElastiCache node
- `elasticacheNode` with engine (Redis/Memcached), node type
- Show cluster mode badge

### 4g. Route53, CloudWatch, IAM
- These are NOT in `SUPPORTED_TYPES` yet — need parser + graph + node
- Route53: hosted zones with record sets
- CloudWatch: alarms linked to resources they monitor
- IAM: roles/policies linked to resources that assume them
- **Why**: Complete the AWS service coverage

---

## 5. Terraform Plan Diff View (P1)

### 5a. Parse `terraform plan -json` output
- New API endpoint: `POST /api/parse/plan`
- Detect `create`, `update`, `destroy` actions per resource
- Return same `ParseResponse` shape with an added `action` field per node

### 5b. Visual diff on canvas
- Green glow/border = resource being created
- Yellow glow/border = resource being updated
- Red glow/border + strikethrough = resource being destroyed
- Unchanged resources dimmed
- Summary banner: "+3 created, 2 updated, 1 destroyed"
- **Why**: This is a killer feature. Reviewing `terraform plan` output is painful.

### 5c. Before/after attribute comparison
- In detail panel, show old → new values for changed attributes
- Highlight which attributes are changing
- **Why**: "What exactly is changing on my RDS instance?"

---

## 6. Visual Polish (P1)

### 6a. Dark mode
- Tailwind `dark:` classes throughout
- Toggle in toolbar (sun/moon icon)
- Persist preference in localStorage
- React Flow has built-in dark mode support

### 6b. Color legend
- Small collapsible legend panel showing edge colors and their meanings
- Show node type → icon mapping
- **Why**: New users won't know what dashed red vs dashed blue means

### 6c. Animated data flow
- Optional mode: animate dots along edges to show data flow direction
- NAT → Internet, ALB → EC2, EC2 → RDS
- Toggle on/off in toolbar
- **Why**: Makes diagrams come alive for presentations

### 6d. Better multi-VPC layout
- Currently VPCs stack vertically; large setups get very tall
- Option: horizontal layout for multi-VPC (side by side)
- Auto-detect peering connections and place peered VPCs adjacent
- **Why**: Multi-VPC architectures are common in production

---

## 7. Multi-File & Comparison (P2)

### 7a. Multiple tfstate files
- Upload multiple files, each rendered as a separate "layer" or tab
- Compare resources across environments (dev vs prod)
- Highlight differences: missing resources, different attributes

### 7b. State file history / drift detection
- Upload two versions of the same state file
- Show what changed between them (added/removed/modified resources)
- Timeline slider if >2 versions

### 7c. Terraform workspace support
- Parse workspace-specific state files
- Show workspace selector in UI

---

## 8. Backend & Performance (P2)

### 8a. Large state file handling
- Current: entire state parsed in one shot, all nodes rendered
- For 200+ resources: implement virtual rendering (React Flow supports it)
- Progressive loading: show VPCs first, then expand on click
- Backend streaming for very large files

### 8b. Caching layer
- Cache parsed results by content hash
- Return cached response for same file
- Reduces re-parse time for large states

### 8c. WebSocket for live updates
- Connect to Terraform Cloud/Enterprise API
- Auto-refresh when state changes
- Show "live" badge when connected

---

## 9. Advanced Features (P3)

### 9a. HCL source parsing (not just state)
- Parse `.tf` files directly
- Show planned infrastructure before `terraform apply`
- Link nodes back to source file + line number

### 9b. Cost estimation overlay
- Integrate with AWS pricing API or Infracost
- Show monthly cost estimate per resource
- Total cost in toolbar
- Cost diff in plan view

### 9c. Compliance / security scanning
- Flag resources with security issues:
  - Public S3 buckets
  - Overly permissive security groups (0.0.0.0/0)
  - Unencrypted RDS/S3
  - Missing tags (cost allocation)
- Show warning badges on nodes
- Summary panel with findings

### 9d. Multi-cloud support
- Azure: parse `terraform.tfstate` with `azurerm_*` resources
- GCP: parse with `google_*` resources
- Each cloud gets its own icon set and color scheme
- Mixed-cloud diagrams for multi-cloud architectures

### 9e. AI-powered insights
- "Explain this architecture" — generate natural language summary
- "Suggest improvements" — recommend HA, cost optimization
- "Find issues" — detect single points of failure
- Use Claude API for analysis

---

## 10. Developer Experience (P1)

### 10a. Fix E2E tests
- Update selectors in `e2e/tests/` to match current UI
- All 11 tests should pass in CI
- Add test for search bar and detail panel

### 10b. Frontend typecheck in CI
- Add `tsc --noEmit -p apps/frontend/tsconfig.json` to typecheck script
- Currently only backend is typechecked in CI

### 10c. Storybook for components
- Add Storybook with stories for each node type
- Stories for Upload, SearchBar, NodeDetailPanel, ResourceSummary
- Visual regression testing with Chromatic or Percy

### 10d. API documentation improvements
- Generate OpenAPI spec from code (instead of static object)
- Add example responses to Swagger
- Document the `ParseResponse` shape in detail

---

## Quick Wins (can do in <1 hour each)

- [ ] Copy Terraform ID button in detail panel
- [ ] `Cmd+K` to focus search
- [ ] `Escape` to clear search / deselect
- [ ] Click resource badge to filter that type
- [ ] Export as PNG (html-to-image, ~30 lines)
- [ ] Dark mode toggle (Tailwind dark classes)
- [ ] Show warnings from parser in a toast/banner
- [ ] Populate `parseRaw` usage (paste JSON directly)
- [ ] Fix the 2 React Flow warnings (nodeTypes memoization)

---

## Implementation Order (Suggested)

**Sprint 1 — Polish & Export**
1. Fix E2E tests (10a)
2. Export as PNG/SVG (1a)
3. Keyboard shortcuts (2d)
4. Copy Terraform ID (3b)
5. Deep-link to connected resource (3c)

**Sprint 2 — Interactivity**
1. Draggable nodes (2a)
2. Collapsible containers (2b)
3. Resource type filter toggles (2c)
4. Security group rule expansion (3a)
5. Dark mode (6a)

**Sprint 3 — New Resources**
1. ECS nodes (4a)
2. SQS/SNS nodes (4c)
3. API Gateway node (4e)
4. Color legend (6b)
5. Better multi-VPC layout (6d)

**Sprint 4 — Killer Features**
1. Terraform plan diff view (5a, 5b, 5c)
2. Export as draw.io (1b)
3. Cost estimation overlay (9b)

---

## Architecture Notes

### Adding a new node type (checklist)
1. Add type to `SUPPORTED_TYPES` in `apps/backend/src/parser/tfstate.ts`
2. Add type to `AwsResourceType` union in `packages/shared/src/index.ts`
3. Add NodeType variant to `NodeType` union in shared
4. Add type → NodeType mapping in `buildGraph()` in `apps/backend/src/parser/graph.ts`
5. Create icon in `apps/frontend/src/components/nodes/icons/AwsIcons.tsx`
6. Create node component in `apps/frontend/src/components/nodes/`
7. Add to `nodeTypes` map in `apps/frontend/src/components/Canvas.tsx`
8. Add to `INTERESTING_ATTRS` in `apps/frontend/src/components/NodeDetailPanel.tsx`
9. Add color to MiniMap in Canvas.tsx
10. Add color to ResourceSummary icon mapping
11. Build shared → restart backend → test
