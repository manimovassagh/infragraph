import type { Node } from 'reactflow';
import type { ProviderFrontendConfig } from '../types';

import { GcpVpcNode } from '@/components/nodes/gcp/GcpVpcNode';
import { GcpSubnetNode } from '@/components/nodes/gcp/GcpSubnetNode';
import { GcpInstanceNode } from '@/components/nodes/gcp/GcpInstanceNode';
import { GcpFirewallNode } from '@/components/nodes/gcp/GcpFirewallNode';
import { GcpAddressNode } from '@/components/nodes/gcp/GcpAddressNode';
import { GcpStorageNode } from '@/components/nodes/gcp/GcpStorageNode';
import { GcpSqlNode } from '@/components/nodes/gcp/GcpSqlNode';
import { GcpFunctionNode } from '@/components/nodes/gcp/GcpFunctionNode';
import { GcpLbNode } from '@/components/nodes/gcp/GcpLbNode';
import { GcpNatNode } from '@/components/nodes/gcp/GcpNatNode';
import { GcpRouteNode } from '@/components/nodes/gcp/GcpRouteNode';
import { GenericNode } from '@/components/nodes/GenericNode';
import {
  GcpVpcIcon, GcpSubnetIcon, GcpInstanceIcon, GcpFirewallIcon,
  GcpAddressIcon, GcpStorageIcon, GcpSqlIcon, GcpFunctionIcon,
  GcpLbIcon,
} from '@/components/nodes/icons/GcpIcons';

export const gcpFrontendConfig: ProviderFrontendConfig = {
  nodeTypes: {
    vpcNode: GcpVpcNode,
    subnetNode: GcpSubnetNode,
    ec2Node: GcpInstanceNode,
    securityGroupNode: GcpFirewallNode,
    eipNode: GcpAddressNode,
    s3Node: GcpStorageNode,
    rdsNode: GcpSqlNode,
    lambdaNode: GcpFunctionNode,
    lbNode: GcpLbNode,
    natNode: GcpNatNode,
    routeTableNode: GcpRouteNode,
    genericNode: GenericNode,
  },

  minimapColors: {
    vpcNode: '#34A853',
    subnetNode: '#4285F4',
    ec2Node: '#FBBC04',
    securityGroupNode: '#EA4335',
    eipNode: '#FBBC04',
    s3Node: '#34A853',
    rdsNode: '#0F9D58',
    lambdaNode: '#FBBC04',
    lbNode: '#AB47BC',
    natNode: '#AB47BC',
    routeTableNode: '#AB47BC',
  },

  edgeColors: {
    'in network': '#34A853',
    'in subnet': '#4285F4',
    'secured by': '#EA4335',
    'depends on': '#0F9D58',
    'attached to': '#64748b',
    'behind pool': '#AB47BC',
  },

  typeMeta: {
    google_compute_network:          { label: 'VPC Network',       color: '#34A853', Icon: GcpVpcIcon },
    google_compute_subnetwork:       { label: 'Subnetwork',        color: '#4285F4', Icon: GcpSubnetIcon },
    google_compute_firewall:         { label: 'Firewall Rule',     color: '#EA4335', Icon: GcpFirewallIcon },
    google_compute_instance:         { label: 'Compute Instance',  color: '#FBBC04', Icon: GcpInstanceIcon },
    google_compute_address:          { label: 'External Address',  color: '#FBBC04', Icon: GcpAddressIcon },
    google_compute_global_address:   { label: 'Global Address',    color: '#FBBC04', Icon: GcpAddressIcon },
    google_compute_forwarding_rule:  { label: 'Forwarding Rule',   color: '#AB47BC', Icon: GcpLbIcon },
    google_storage_bucket:           { label: 'Cloud Storage',     color: '#34A853', Icon: GcpStorageIcon },
    google_sql_database_instance:    { label: 'Cloud SQL',         color: '#0F9D58', Icon: GcpSqlIcon },
    google_cloudfunctions_function:  { label: 'Cloud Function',    color: '#FBBC04', Icon: GcpFunctionIcon },
    google_cloud_run_service:        { label: 'Cloud Run',         color: '#FBBC04', Icon: GcpFunctionIcon },
    google_container_cluster:        { label: 'GKE Cluster',       color: '#4285F4', Icon: GcpInstanceIcon },
  },

  interestingAttrs: {
    google_compute_network:         ['auto_create_subnetworks', 'routing_mode'],
    google_compute_subnetwork:      ['ip_cidr_range', 'region'],
    google_compute_firewall:        ['direction', 'source_ranges'],
    google_compute_instance:        ['machine_type', 'zone'],
    google_compute_address:         ['address', 'address_type', 'region'],
    google_compute_forwarding_rule: ['load_balancing_scheme', 'port_range', 'region'],
    google_storage_bucket:          ['location', 'storage_class'],
    google_sql_database_instance:   ['database_version', 'region'],
    google_cloudfunctions_function: ['runtime', 'entry_point', 'region'],
    google_cloud_run_service:       ['location'],
    google_container_cluster:       ['location', 'initial_node_count'],
  },

  typeConfig: {
    google_compute_network:          { label: 'VPC',      Icon: GcpVpcIcon },
    google_compute_subnetwork:       { label: 'Subnet',   Icon: GcpSubnetIcon },
    google_compute_firewall:         { label: 'FW',       Icon: GcpFirewallIcon },
    google_compute_instance:         { label: 'VM',       Icon: GcpInstanceIcon },
    google_compute_address:          { label: 'IP',       Icon: GcpAddressIcon },
    google_compute_forwarding_rule:  { label: 'LB',       Icon: GcpLbIcon },
    google_storage_bucket:           { label: 'GCS',      Icon: GcpStorageIcon },
    google_sql_database_instance:    { label: 'SQL',      Icon: GcpSqlIcon },
    google_cloudfunctions_function:  { label: 'Func',     Icon: GcpFunctionIcon },
    google_cloud_run_service:        { label: 'Run',      Icon: GcpFunctionIcon },
    google_container_cluster:        { label: 'GKE',      Icon: GcpInstanceIcon },
  },

  minimapNodeColor(node: Node): string {
    return gcpFrontendConfig.minimapColors[node.type ?? ''] ?? '#7B8794';
  },
};
