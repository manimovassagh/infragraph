# AWSArchitect

Visualize AWS infrastructure as interactive architecture diagrams. Upload a `.tfstate` file and get a live, zoomable canvas showing your VPCs, subnets, and resources with their relationships.

## Features

- Parse Terraform state files (`.tfstate`)
- Auto-layout: VPC → Subnet → Resource hierarchy
- Interactive React Flow canvas with zoom, pan, and minimap
- Click any node to inspect its attributes, tags, and dependencies
- Designed to support AWS CDK, CloudFormation, and Pulumi in the future

## Project Structure

```
aws-architect/
├── apps/
│   ├── backend/        # Express API — parses tfstate, builds graph
│   └── frontend/       # Next.js app — React Flow canvas + UI
└── packages/
    └── shared/         # Shared TypeScript types (AwsResource, GraphNode, etc.)
```

## Prerequisites

- Node.js 20+
- npm 10+

## Setup

```bash
# Install all dependencies
npm install

# Build shared types (required before running frontend)
npm run build --workspace=packages/shared
```

## Development

```bash
# Run backend + frontend concurrently
npm run dev

# Or run individually
npm run dev --workspace=apps/backend    # http://localhost:3001
npm run dev --workspace=apps/frontend   # http://localhost:3000
```

## Testing

```bash
# Backend smoke test — parses the sample fixture and validates graph output
npx tsx apps/backend/src/scripts/test-parse.ts
```

Expected output: 11 nodes, 12 edges, all verification checks green.

## API

### `POST /api/parse`
Upload a `.tfstate` file as multipart form data.

### `POST /api/parse/raw`
Send raw tfstate JSON in the request body: `{ "tfstate": "..." }`

Both endpoints return a `ParseResponse`:
```ts
{
  nodes: GraphNode[];
  edges: GraphEdge[];
  resources: AwsResource[];
  warnings: string[];
}
```

## License

MIT
