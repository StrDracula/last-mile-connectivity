import { Role } from "@prisma/client";
import { handleRouteError, ok } from "@/lib/api";
import { requireRole } from "@/lib/auth";
import { updateOrderStatus } from "@/lib/orders";
import { statusSchema } from "@/lib/validation";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireRole([Role.ADMIN]);
    const { id } = await params;
    const payload = statusSchema.parse(await request.json());
    const order = await updateOrderStatus(
      id,
      payload.status,
      { id: session.user.id, role: session.user.role },
      payload.notes ?? "Admin override.",
      true
    );
    return ok({ order });
  } catch (error) {
    return handleRouteError(error);
  }
}
