import { Role } from "@prisma/client";
import { fail, handleRouteError, ok } from "@/lib/api";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await requireRole([Role.AGENT]);
    const agent = await prisma.agent.findUnique({
      where: { userId: session.user.id },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        currentZone: true
      }
    });

    if (!agent) return fail("Agent profile not found.", 404);
    return ok({ agent });
  } catch (error) {
    return handleRouteError(error);
  }
}
