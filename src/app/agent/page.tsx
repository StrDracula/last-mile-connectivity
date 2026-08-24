"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ConfirmDialog, EmptyState, LoadingPanel, Toast } from "@/components/feedback";
import { PageHeader } from "@/components/page-header";
import { Spinner } from "@/components/spinner";
import { StatusBadge } from "@/components/status-badge";
import { formatStatus, getErrorMessage } from "@/lib/ui";

const nextActions: Record<string, string[]> = {
  PLACED: ["PICKED_UP"],
  RESCHEDULED: ["PICKED_UP"],
  PICKED_UP: ["IN_TRANSIT"],
  IN_TRANSIT: ["OUT_FOR_DELIVERY"],
  OUT_FOR_DELIVERY: ["DELIVERED", "FAILED"]
};

type AgentProfile = {
  availability: string;
  currentZone: { name: string };
  user: { name: string; email: string };
};

type Order = {
  id: string;
  currentStatus: string;
  pickupAddress: string;
  dropAddress: string;
  scheduledDate: string;
  customer: { name: string; phone?: string };
};

export default function AgentPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [profile, setProfile] = useState<AgentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<{ orderId: string; status: string } | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [ordersResponse, profileResponse] = await Promise.all([fetch("/api/orders"), fetch("/api/agent/me")]);
      const ordersData = await ordersResponse.json();
      const profileData = await profileResponse.json();

      if (!ordersResponse.ok) {
        setError(getErrorMessage(ordersData, "Unable to load assigned orders."));
        return;
      }
      if (!profileResponse.ok) {
        setError(getErrorMessage(profileData, "Unable to load agent profile."));
      } else {
        setProfile(profileData.agent);
      }
      setOrders(ordersData.orders);
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Unable to load agent workspace."));
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(orderId: string, status: string) {
    setPendingAction(null);
    setUpdating(`${orderId}:${status}`);
    setError("");
    setSuccess("");
    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      const data = await response.json();
      if (!response.ok) {
        setError(getErrorMessage(data, "Unable to update order status."));
        return;
      }
      setSuccess(`Order status updated to ${formatStatus(status)}.`);
      await load();
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Unable to update order status."));
    } finally {
      setUpdating(null);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <section className="grid gap-4">
      <PageHeader title="Agent Workspace" description="Review assigned deliveries and move each order through its next valid status." />
      <Toast kind="error" message={error} />
      <Toast message={success} />

      {profile ? (
        <div className="grid gap-3 md:grid-cols-3">
          <div className="panel">
            <div className="text-sm text-muted">Availability</div>
            <div className="mt-1 font-semibold">{formatStatus(profile.availability)}</div>
          </div>
          <div className="panel">
            <div className="text-sm text-muted">Current zone</div>
            <div className="mt-1 font-semibold">{profile.currentZone.name}</div>
          </div>
          <div className="panel">
            <div className="text-sm text-muted">Assigned orders</div>
            <div className="mt-1 font-semibold">{orders.length}</div>
          </div>
        </div>
      ) : null}

      {loading ? <LoadingPanel label="Loading assigned orders..." /> : null}
      {!loading && orders.length === 0 ? <EmptyState title="No orders are currently assigned to you." /> : null}

      {!loading && orders.length > 0 ? (
        <div className="grid gap-3">
          {orders.map((order) => (
            <article className="panel grid gap-3" key={order.id}>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <Link href={`/orders/${order.id}`} className="font-semibold text-accent">
                    Order #{order.id}
                  </Link>
                  <div className="text-sm text-muted">Scheduled {new Date(order.scheduledDate).toLocaleString()}</div>
                </div>
                <StatusBadge status={order.currentStatus} />
              </div>
              <div className="grid gap-3 text-sm md:grid-cols-3">
                <div>
                  <strong>Customer</strong>
                  <div>{order.customer.name}</div>
                  <div className="text-muted">{order.customer.phone}</div>
                </div>
                <div>
                  <strong>Pickup</strong>
                  <div className="break-words text-muted">{order.pickupAddress}</div>
                </div>
                <div>
                  <strong>Drop</strong>
                  <div className="break-words text-muted">{order.dropAddress}</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 border-t border-border pt-3">
                {(nextActions[order.currentStatus] ?? []).length ? (
                  (nextActions[order.currentStatus] ?? []).map((status) => (
                    <button
                      className={status === "FAILED" ? "button danger" : "button secondary"}
                      key={status}
                      disabled={Boolean(updating)}
                      onClick={() => (status === "FAILED" ? setPendingAction({ orderId: order.id, status }) : updateStatus(order.id, status))}
                    >
                      {updating === `${order.id}:${status}` ? <Spinner label="Updating..." /> : `Mark ${formatStatus(status)}`}
                    </button>
                  ))
                ) : (
                  <span className="text-sm text-muted">No further agent action available.</span>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : null}

      <ConfirmDialog
        open={Boolean(pendingAction)}
        title="Mark this delivery as failed?"
        message="This will notify the customer and make the order eligible for rescheduling."
        confirmLabel="Mark Failed"
        onCancel={() => setPendingAction(null)}
        onConfirm={() => pendingAction && updateStatus(pendingAction.orderId, pendingAction.status)}
      />
    </section>
  );
}
