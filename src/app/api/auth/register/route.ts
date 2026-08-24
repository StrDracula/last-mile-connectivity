import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { z } from "zod";
import { fail, handleRouteError, ok } from "@/lib/api";
import { prisma } from "@/lib/prisma";

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().optional(),
  role: z.nativeEnum(Role).default(Role.CUSTOMER)
});

export async function POST(request: Request) {
  try {
    const payload = registerSchema.parse(await request.json());
    if (payload.role === Role.ADMIN) {
      return fail("Admin accounts must be seeded or created directly by an administrator.", 403);
    }

    const email = payload.email.toLowerCase().trim();
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return fail("A user with this email already exists.", 409);
    }

    const user = await prisma.user.create({
      data: {
        name: payload.name,
        email,
        phone: payload.phone,
        role: payload.role,
        passwordHash: await bcrypt.hash(payload.password, 10)
      },
      select: { id: true, name: true, email: true, role: true, phone: true, createdAt: true }
    });

    return ok({ user }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
