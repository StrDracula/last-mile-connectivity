import { Role } from "@prisma/client";
import { handleRouteError, ok } from "@/lib/api";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const activeStatuses = ["PLACED", "PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY", "RESCHEDULED"] as const;

export async function GET() {
  try {
    await requireRole([Role.ADMIN]);
    const agents = await prisma.agent.findMany({
      orderBy: { user: { name: "asc" } },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        currentZone: true,
        assignedOrders: { where: { currentStatus: { in: [...activeStatuses] } }, select: { id: true } }
      }
    });

    return ok({
      agents: agents.map((agent) => ({
        ...agent,
        activeOrderCount: agent.assignedOrders.length
      }))
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
