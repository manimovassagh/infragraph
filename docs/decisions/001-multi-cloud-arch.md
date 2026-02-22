# ADR 001: Multi-Cloud Architecture

## Status
Accepted (v1.3.0)

## Context
InfraGraph started as an AWS-only Terraform visualizer. Users requested support for Azure and GCP infrastructure. We needed an architecture that could support multiple cloud providers without duplicating the parsing engine.

## Decision
We adopted a **provider config pattern** where each cloud provider supplies a `ProviderConfig` (backend) and `ProviderFrontendConfig` (frontend) object. The core parsing and graph-building logic is provider-agnostic.

### Backend Architecture
- `ProviderConfig` defines: supported resource types, edge attributes, container types (for nesting), node type mappings, and region extraction
- The parser accepts any `ProviderConfig` and produces a generic graph of nodes and edges
- Auto-detection reads resource type prefixes (`aws_`, `azurerm_`, `google_`) to select the correct provider

### Frontend Architecture
- `ProviderFrontendConfig` defines: node type components, minimap colors, edge colors, type metadata, and interesting attributes
- Each provider registers its own React components for the same node type keys (`vpcNode`, `ec2Node`, etc.)
- Provider configs are loaded from a registry keyed by `CloudProvider` ID

### Shared Registry Keys
Node type keys like `ec2Node`, `s3Node`, `lbNode` are **capability names**, not brand names. The backend maps `azurerm_linux_virtual_machine` to `ec2Node` (meaning "compute instance"), and each provider's frontend config maps `ec2Node` to its own branded component (e.g., `AzureVmNode`).

### Container Nesting
VPC/VNet/Network and Subnet nesting is config-driven via `containerTypes` arrays. The graph builder uses these to create React Flow parent-child relationships automatically.

## Consequences
- Adding a new provider requires only config files and React components — no parser changes
- Provider-specific display logic stays isolated in per-provider directories
- The shared key pattern means the backend API response is provider-agnostic
- Trade-off: resource types that don't map cleanly to existing keys fall back to `genericNode`
