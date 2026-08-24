"use client";

import { useEffect, useState } from "react";
import { EmptyState, LoadingPanel, Toast } from "@/components/feedback";
import { PageHeader } from "@/components/page-header";
import { Spinner } from "@/components/spinner";
import { getErrorMessage } from "@/lib/ui";

type Zone = { id: string; name: string; areas: Array<{ id: string; areaKey: string }> };

export default function AdminZonesPage() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/zones");
      const data = await response.json();
      if (!response.ok) {
        setError(getErrorMessage(data, "Unable to load zones."));
        return;
      }
      setZones(data.zones);
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Unable to load zones."));
    } finally {
      setLoading(false);
    }
  }

  async function createZone(formData: FormData) {
    setSubmitting("zone");
    setError("");
    setSuccess("");
    try {
      const response = await fetch("/api/admin/zones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: formData.get("name") })
      });
      const data = await response.json();
      if (!response.ok) {
        setError(getErrorMessage(data, "Unable to create zone."));
        return;
      }
      setSuccess("Zone created.");
      await load();
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Unable to create zone."));
    } finally {
      setSubmitting("");
    }
  }

  async function addArea(zoneId: string, formData: FormData) {
    setSubmitting(zoneId);
    setError("");
    setSuccess("");
    try {
      const response = await fetch(`/api/admin/zones/${zoneId}/areas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ areaKey: formData.get("areaKey") })
      });
      const data = await response.json();
      if (!response.ok) {
        setError(getErrorMessage(data, "Unable to add pincode mapping."));
        return;
      }
      setSuccess("Pincode mapping saved.");
      await load();
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Unable to add pincode mapping."));
    } finally {
      setSubmitting("");
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <section className="grid gap-4">
      <PageHeader title="Zones" description="Map pincodes to delivery zones used by rate calculation and auto-assignment." />
      <Toast kind="error" message={error} />
      <Toast message={success} />
      <form action={createZone} className="panel grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <label className="field">
          Zone name
          <input className="input" name="name" required disabled={submitting === "zone"} />
        </label>
        <button className="button" disabled={submitting === "zone"}>
          {submitting === "zone" ? <Spinner label="Creating..." /> : "Create zone"}
        </button>
      </form>

      {loading ? <LoadingPanel label="Loading zones..." /> : null}
      {!loading && zones.length === 0 ? <EmptyState title="No zones configured yet." /> : null}
      {!loading && zones.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2">
          {zones.map((zone) => (
            <div className="panel grid gap-3" key={zone.id}>
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-semibold">{zone.name}</h2>
                <span className="text-sm text-muted">{zone.areas.length} mappings</span>
              </div>
              <div className="flex flex-wrap gap-2 text-sm text-muted">
                {zone.areas.length ? (
                  zone.areas.map((area) => (
                    <span className="rounded border border-border bg-surface px-2 py-1" key={area.id}>
                      {area.areaKey}
                    </span>
                  ))
                ) : (
                  <span>No pincodes mapped yet.</span>
                )}
              </div>
              <form action={(formData) => addArea(zone.id, formData)} className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
                <label className="field">
                  Pincode
                  <input className="input" name="areaKey" required disabled={submitting === zone.id} />
                </label>
                <button className="button secondary" disabled={submitting === zone.id}>
                  {submitting === zone.id ? <Spinner label="Saving..." /> : "Add mapping"}
                </button>
              </form>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
