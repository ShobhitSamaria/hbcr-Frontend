import { prisma } from "../db/prisma.ts";

function monthDiff(d: Date) {
  return d.getUTCFullYear() * 12 + d.getUTCMonth();
}

export const dashboardService = {
  /**
   * Tile numbers used in the dashboard cards.
   *   total patients, new (last 30 days) registrations,
   *   pending / completed cases.
   */
  async getStats() {
    const since = new Date();
    since.setUTCDate(since.getUTCDate() - 30);

    const [patientTotal, newRegistrations, pending, completed] = await Promise.all([
      prisma.patient.count(),
      prisma.registration.count({
        where: { createdAt: { gte: since } },
      }),
      prisma.registration.count({ where: { status: "PENDING" } }),
      prisma.registration.count({ where: { status: "COMPLETED" } }),
    ]);

    return {
      totalPatients: patientTotal,
      newRegistrations,
      pendingCases: pending,
      completedCases: completed,
    };
  },

  /**
   * Monthly chart for the last 6 months (including current month). Sums new
   * registrations per month.
   */
  async getMonthlyRegistrations(months = 6) {
    const now = new Date();
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (months - 1), 1));

    const items = await prisma.registration.findMany({
      where: { createdAt: { gte: start } },
      select: { createdAt: true },
    });

    const buckets = new Map<string, number>();
    for (let i = 0; i < months; i++) {
      const d = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + i, 1));
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
      buckets.set(key, 0);
    }

    const monthLabels = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];

    for (const r of items) {
      const d = r.createdAt;
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
      if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }

    return Array.from(buckets.entries()).map(([key, value], idx) => {
      const [, m] = key.split("-");
      const monthIndex = Number(m) - 1;
      // Drop the bucket label to YYYY-MM + a friendly month name
      const startBucket = new Date(
        Date.UTC(Number(key.split("-")[0]), monthIndex, 1),
      );
      return {
        // Keep <month> string for frontend compat:
        month: monthLabels[monthIndex] ?? key,
        value,
        year: startBucket.getUTCFullYear(),
        monthIndex,
        bucketIndex: idx,
        spanMonths: months,
        _signature: `monthDiff=${monthDiff(startBucket)};total=${months}`,
      };
    });
  },

  /**
   * Case overview donut: counts by status (Active / Pending / Completed).
   */
  async getCaseOverview() {
    const counts = await prisma.registration.groupBy({
      by: ["status"],
      _count: { _all: true },
    });

    return counts.map((c) => ({
      status: c.status,
      count: c._count._all,
    }));
  },

  /**
   * Recent registrations (last 5) for the dashboard "Recent patients" card.
   */
  async getRecent(limit = 5) {
    const items = await prisma.registration.findMany({
      orderBy: { id: "desc" },
      take: limit,
      include: {
        patient: { select: { id: true, fullName: true, age: true, gender: true } },
        hospital: { select: { id: true, name: true } },
      },
    });
    return items;
  },
};
