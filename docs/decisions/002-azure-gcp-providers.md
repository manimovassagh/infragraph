# ADR 002: Azure & GCP Provider Implementation

## Status
Accepted (v1.4.0)

## Context
With the multi-cloud architecture in place (ADR 001), we needed to implement full Azure and GCP support including icons, node components, test fixtures, and frontend configs.

## Decisions

### Separate Node Components Per Provider
Each provider has its own directory of React components (`nodes/azure/`, `nodes/gcp/`) rather than sharing generic components. This ensures:
- Provider-specific attributes are displayed correctly (e.g., Azure `vm_size` vs GCP `machine_type`)
- Brand colors and labels match each cloud provider's identity
- Components can evolve independently without cross-provider regressions

### Color Palettes
Colors follow each provider's brand guidelines:
- **AWS**: Orange (#ED7100), purple (#8C4FFF), green (#3F8624), blue (#3B48CC)
- **Azure**: Blue (#0078D4), green (#107C10), red (#D13438), teal (#008272), purple (#773ADC)
- **GCP**: Green (#34A853), yellow (#FBBC04), red (#EA4335), blue (#4285F4), purple (#AB47BC)

### Attribute Mappings
Each provider displays the most useful resource-specific attributes:
- **Azure VNet**: `address_space` | **GCP VPC**: `auto_create_subnetworks`
- **Azure VM**: `vm_size` | **GCP Instance**: `machine_type`
- **Azure PIP**: `ip_address` | **GCP Address**: `address`
- **Azure SQL**: `version` | **GCP SQL**: `database_version`

### Test Fixtures
Each provider has a sample `.tfstate` fixture with ~11-12 resources covering the main resource categories: networking (VPC/VNet, subnets), compute, storage, database, serverless, load balancing, and container orchestration.

### No Backend Changes Required
The existing backend provider configs (`azure.ts`, `gcp.ts`) already had complete `nodeTypeMapping`, `containerTypes`, and `edgeAttributes`. Only frontend work was needed to bring Azure and GCP to parity with AWS.

## Consequences
- All three providers now have full visual support with branded icons and components
- Test fixtures enable reliable E2E testing for each provider's upload flow
- The per-provider component pattern means ~11 files per provider, but each is small and focused
- Future providers (e.g., Oracle Cloud, DigitalOcean) can follow the same pattern
