"use client";

import { useEffect, useState } from "react";
import { EmptyState, LoadingPanel, Toast } from "@/components/feedback";
import { PageHeader } from "@/components/page-header";
import { Spinner } from "@/components/spinner";
import { formatMoney, getErrorMessage } from "@/lib/ui";

type RateCard = {
  id: string;
  orderType: string;
  zoneRelation: string;
  baseRate: number;
  ratePerKg: number;
  isActive: boolean;
  effectiveFrom: string;
};

export default function AdminRateCardsPage() {
  const [rateCards, setRateCards] = useState<RateCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/rate-cards");
      const data = await response.json();
      if (!response.ok) {
        setError(getErrorMessage(data, "Unable to load rate cards."));
        return;
      }
      setRateCards(data.rateCards);
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Unable to load rate cards."));
    } finally {
      setLoading(false);
    }
  }

  async function create(formData: FormData) {
    setSubmitting(true);
    setError("");
    setSuccess("");
    const payload = Object.fromEntries(formData.entries());
    try {
      const response = await fetch("/api/admin/rate-cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, isActive: payload.isActive === "on" })
      });
      const data = await response.json();
      if (!response.ok) {
        setError(getErrorMessage(data, "Unable to create rate card."));
        return;
      }
      setSuccess("Rate card created.");
      await load();
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Unable to create rate card."));
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <section className="grid gap-4">
      <PageHeader title="Rate Cards" description="Configure active pricing by order type and zone relation." />
      <Toast kind="error" message={error} />
      <Toast message={success} />

      <form action={create} className="panel grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        <label className="field">
          Type
          <select className="input" name="orderType" disabled={submitting}>
            <option value="B2C">B2C</option>
            <option value="B2B">B2B</option>
          </select>
        </label>
        <label className="field">
          Relation
          <select className="input" name="zoneRelation" disabled={submitting}>
            <option value="INTRA">INTRA</option>
            <option value="INTER">INTER</option>
          </select>
        </label>
        <label className="field">
          Base rate
          <input className="input" name="baseRate" type="number" step="0.01" min="0" required disabled={submitting} />
        </label>
        <label className="field">
          Rate per kg
          <input className="input" name="ratePerKg" type="number" step="0.01" min="0" required disabled={submitting} />
        </label>
        <label className="field">
          Effective from
          <input className="input" name="effectiveFrom" type="datetime-local" required disabled={submitting} />
        </label>
        <label className="flex items-center gap-2 self-end text-sm font-medium">
          <input name="isActive" type="checkbox" defaultChecked disabled={submitting} />
          Active
        </label>
        <button className="button md:col-span-3 xl:col-span-6" disabled={submitting}>
          {submitting ? <Spinner label="Creating..." /> : "Create rate card"}
        </button>
      </form>

      {loading ? <LoadingPanel label="Loading rate cards..." /> : null}
      {!loading && rateCards.length === 0 ? <EmptyState title="No rate cards configured yet." /> : null}
      {!loading && rateCards.length > 0 ? (
        <div className="panel overflow-x-auto p-0">
          <table className="table min-w-[760px]">
            <thead>
              <tr>
                <th>Type</th>
                <th>Relation</th>
                <th>Base</th>
                <th>Per kg</th>
                <th>Active</th>
                <th>Effective from</th>
              </tr>
            </thead>
            <tbody>
              {rateCards.map((card) => (
                <tr key={card.id}>
                  <td>{card.orderType}</td>
                  <td>{card.zoneRelation}</td>
                  <td>{formatMoney(card.baseRate)}</td>
                  <td>{formatMoney(card.ratePerKg)}</td>
                  <td>{card.isActive ? "Yes" : "No"}</td>
                  <td>{new Date(card.effectiveFrom).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
