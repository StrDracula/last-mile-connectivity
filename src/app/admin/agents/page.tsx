"use client";

import { useEffect, useState } from "react";
import { EmptyState, LoadingPanel, Toast } from "@/components/feedback";
import { PageHeader } from "@/components/page-header";
import { Spinner } from "@/components/spinner";
import { formatStatus, getErrorMessage } from "@/lib/ui";

type Agent = {
  id: string;
  availability: string;
  activeOrderCount: number;
  user: { name: string; email: string; phone?: string };
  currentZone: { name: string };
};

export default function AdminAgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/agents");
      const data = await response.json();
      if (!response.ok) {
        setError(getErrorMessage(data, "Unable to load agents."));
        return;
      }
      setAgents(data.agents);
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Unable to load agents."));
    } finally {
      setLoading(false);
    }
  }

  async function updateAvailability(id: string, availability: string) {
    setUpdating(id);
    setError("");
    setSuccess("");
    try {
      const response = await fetch(`/api/admin/agents/${id}/availability`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ availability })
      });
      const data = await response.json();
      if (!response.ok) {
        setError(getErrorMessage(data, "Unable to update agent availability."));
        return;
      }
      setSuccess("Agent availability updated.");
      await load();
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Unable to update agent availability."));
    } finally {
      setUpdating("");
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <section className="grid gap-4">
      <PageHeader title="Agents" description="Monitor zones, availability, and active delivery load." />
      <Toast kind="error" message={error} />
      <Toast message={success} />
      {loading ? <LoadingPanel label="Loading agents..." /> : null}
      {!loading && agents.length === 0 ? <EmptyState title="No agents have been configured yet." /> : null}
      {!loading && agents.length > 0 ? (
        <div className="panel overflow-x-auto p-0">
          <table className="table min-w-[720px]">
            <thead>
              <tr>
                <th>Agent</th>
                <th>Zone</th>
                <th>Availability</th>
                <th>Active orders</th>
                <th>Update</th>
              </tr>
            </thead>
            <tbody>
              {agents.map((agent) => (
                <tr key={agent.id}>
                  <td>
                    <div className="font-medium">{agent.user.name}</div>
                    <div className="text-sm text-muted">{agent.user.email}</div>
                  </td>
                  <td>{agent.currentZone.name}</td>
                  <td>{formatStatus(agent.availability)}</td>
                  <td>{agent.activeOrderCount}</td>
                  <td>
                    {updating === agent.id ? (
                      <Spinner label="Updating..." />
                    ) : (
                      <select className="input" value={agent.availability} onChange={(event) => updateAvailability(agent.id, event.target.value)}>
                        <option value="AVAILABLE">Available</option>
                        <option value="BUSY">Busy</option>
                        <option value="OFFLINE">Offline</option>
                      </select>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
