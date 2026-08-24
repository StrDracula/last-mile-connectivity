"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ConfirmDialog, EmptyState, LoadingPanel, Toast } from "@/components/feedback";
import { PageHeader } from "@/components/page-header";
import { Spinner } from "@/components/spinner";
import { StatusBadge } from "@/components/status-badge";
import { formatMoney, formatStatus, getErrorMessage } from "@/lib/ui";

type Agent = { id: string; availability: string; user: { name: string }; currentZone: { name: string } };
type Zone = { id: string; name: string };
type Order = {
  id: string;
  currentStatus: string;
  totalCharge: number;
  pickupAddress: string;
  dropAddress: string;
  customer: { name: string; email: string };
  pickupZone: Zone;
  dropZone: Zone;
  assignedAgent?: Agent | null;
};

type PendingAction =
  | { type: "override"; orderId: string; status: string }
  | { type: "assign"; orderId: string; agentId: string; agentName: string }
  | { type: "auto"; orderId: string };

const statuses = ["", "PLACED", "PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED", "FAILED", "RESCHEDULED"];
const activeStatuses = new Set(["PLACED", "PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY", "RESCHEDULED"]);

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [filters, setFilters] = useState({ status: "", zone: "", agent: "" });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const metrics = useMemo(
    () => ({
      total: orders.length,
      active: orders.filter((order) => activeStatuses.has(order.currentStatus)).length,
      delivered: orders.filter((order) => order.currentStatus === "DELIVERED").length,
      failed: orders.filter((order) => order.currentStatus === "FAILED").length,
      availableAgents: agents.filter((agent) => agent.availability === "AVAILABLE").length,
      busyAgents: agents.filter((agent) => agent.availability === "BUSY").length
    }),
    [orders, agents]
  );

  async function load() {
    setLoading(true);
    setError("");
    const query = new URLSearchParams();
    if (filters.status) query.set("status", filters.status);
    if (filters.zone) query.set("zone", filters.zone);
    if (filters.agent) query.set("agent", filters.agent);

    try {
      const [ordersResponse, agentsResponse, zonesResponse] = await Promise.all([
        fetch(`/api/orders?${query}`),
        fetch("/api/admin/agents"),
        fetch("/api/admin/zones")
      ]);
      const ordersData = await ordersResponse.json();
      const agentsData = await agentsResponse.json();
      const zonesData = await zonesResponse.json();

      if (!ordersResponse.ok) {
        setError(getErrorMessage(ordersData, "Unable to load orders."));
        return;
      }
      setOrders(ordersData.orders);
      if (agentsResponse.ok) setAgents(agentsData.agents);
      if (zonesResponse.ok) setZones(zonesData.zones);
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Unable to load admin dashboard."));
    } finally {
      setLoading(false);
    }
  }

  async function runPendingAction() {
    if (!pendingAction) return;
    setError("");
    setSuccess("");
    const key = `${pendingAction.type}:${pendingAction.orderId}`;
    setActionLoading(key);
    try {
      let response: Response;
      if (pendingAction.type === "override") {
        response = await fetch(`/api/admin/orders/${pendingAction.orderId}/override-status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: pendingAction.status, notes: "Admin override from dashboard." })
        });
      } else if (pendingAction.type === "assign") {
        response = await fetch(`/api/orders/${pendingAction.orderId}/assign`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ agentId: pendingAction.agentId })
        });
      } else {
        response = await fetch(`/api/orders/${pendingAction.orderId}/auto-assign`, { method: "POST" });
      }

      const data = await response.json();
      if (!response.ok) {
        setError(getErrorMessage(data, "Unable to complete admin action."));
        return;
      }
      setSuccess("Admin action completed successfully.");
      await load();
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Unable to complete admin action."));
    } finally {
      setPendingAction(null);
      setActionLoading("");
    }
  }

  useEffect(() => {
    load();
  }, []);

  const dialogText =
    pendingAction?.type === "override"
      ? `Override this order to ${formatStatus(pendingAction.status)}?`
      : pendingAction?.type === "assign"
        ? `Reassign this order to ${pendingAction.agentName}?`
        : "Run auto-assignment for this order?";

  return (
    <section className="grid gap-4">
      <PageHeader title="Admin Orders" description="Monitor delivery operations, filter orders, override status, and manage assignment." />
      <Toast kind="error" message={error} />
      <Toast message={success} />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <Metric label="Total orders" value={metrics.total} />
        <Metric label="Pending/active" value={metrics.active} />
        <Metric label="Delivered" value={metrics.delivered} />
        <Metric label="Failed" value={metrics.failed} />
        <Metric label="Available agents" value={metrics.availableAgents} />
        <Metric label="Busy agents" value={metrics.busyAgents} />
      </div>

      <div className="panel grid gap-3 md:grid-cols-4">
        <label className="field">
          Status
          <select className="input" value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}>
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status ? formatStatus(status) : "All"}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          Zone
          <select className="input" value={filters.zone} onChange={(event) => setFilters((current) => ({ ...current, zone: event.target.value }))}>
            <option value="">All</option>
            {zones.map((zone) => (
              <option key={zone.id} value={zone.id}>
                {zone.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          Agent
          <select className="input" value={filters.agent} onChange={(event) => setFilters((current) => ({ ...current, agent: event.target.value }))}>
            <option value="">All</option>
            {agents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.user.name}
              </option>
            ))}
          </select>
        </label>
        <button className="button self-end" onClick={load} disabled={loading}>
          {loading ? <Spinner label="Applying..." /> : "Apply filters"}
        </button>
      </div>

      {loading ? <LoadingPanel label="Loading admin dashboard..." /> : null}
      {!loading && orders.length === 0 ? <EmptyState title="No orders match the current filters." /> : null}

      {!loading && orders.length > 0 ? (
        <div className="panel overflow-x-auto p-0">
          <table className="table min-w-[980px]">
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Route</th>
                <th>Agent</th>
                <th>Status override</th>
                <th>Assign</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className={!order.assignedAgent ? "bg-yellow-50" : ""}>
                  <td>
                    <Link className="font-semibold text-accent" href={`/orders/${order.id}`}>
                      #{order.id}
                    </Link>
                    <div className="mt-1">
                      <StatusBadge status={order.currentStatus} />
                    </div>
                    <div className="mt-1 text-sm text-muted">{formatMoney(order.totalCharge)}</div>
                    {!order.assignedAgent ? <div className="text-sm font-medium text-yellow-800">Pending assignment</div> : null}
                  </td>
                  <td>
                    <div>{order.customer.name}</div>
                    <div className="text-sm text-muted">{order.customer.email}</div>
                  </td>
                  <td className="max-w-sm">
                    <div className="break-words">{order.pickupZone.name}: {order.pickupAddress}</div>
                    <div className="break-words text-muted">{order.dropZone.name}: {order.dropAddress}</div>
                  </td>
                  <td>{order.assignedAgent?.user.name ?? "None"}</td>
                  <td>
                    <select
                      className="input"
                      value={order.currentStatus}
                      disabled={Boolean(actionLoading)}
                      onChange={(event) => setPendingAction({ type: "override", orderId: order.id, status: event.target.value })}
                    >
                      {statuses.filter(Boolean).map((status) => (
                        <option key={status} value={status}>
                          {formatStatus(status)}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <div className="grid gap-2">
                      <select
                        className="input"
                        value=""
                        disabled={Boolean(actionLoading)}
                        onChange={(event) => {
                          const agent = agents.find((item) => item.id === event.target.value);
                          if (agent) setPendingAction({ type: "assign", orderId: order.id, agentId: agent.id, agentName: agent.user.name });
                        }}
                      >
                        <option value="">Manual assign</option>
                        {agents.map((agent) => (
                          <option key={agent.id} value={agent.id}>
                            {agent.user.name} ({agent.currentZone.name})
                          </option>
                        ))}
                      </select>
                      <button className="button secondary" onClick={() => setPendingAction({ type: "auto", orderId: order.id })} disabled={Boolean(actionLoading)}>
                        {actionLoading === `auto:${order.id}` ? <Spinner label="Assigning..." /> : "Auto assign"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <ConfirmDialog
        open={Boolean(pendingAction)}
        title="Confirm admin action"
        message={dialogText}
        confirmLabel="Confirm"
        onCancel={() => setPendingAction(null)}
        onConfirm={runPendingAction}
      />
    </section>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="panel">
      <div className="text-sm text-muted">{label}</div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
    </div>
  );
}
