import { PrismaClient, Role, OrderType, ZoneRelation } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function upsertUser(email: string, name: string, role: Role, phone?: string) {
  const passwordHash = await bcrypt.hash("Password123!", 10);
  return prisma.user.upsert({
    where: { email },
    update: { name, role, phone, passwordHash },
    create: { email, name, role, phone, passwordHash }
  });
}

async function main() {
  const zoneData = [
    { name: "North", areas: ["110001", "110002", "110003"] },
    { name: "South", areas: ["560001", "560002", "560003"] },
    { name: "West", areas: ["400001", "400002", "400003"] },
    { name: "East", areas: ["700001", "700002", "700003"] }
  ];

  const zones = [];
  for (const item of zoneData) {
    const zone = await prisma.zone.upsert({
      where: { name: item.name },
      update: {},
      create: { name: item.name }
    });
    zones.push(zone);

    for (const areaKey of item.areas) {
      await prisma.zoneArea.upsert({
        where: { areaKey },
        update: { zoneId: zone.id },
        create: { areaKey, zoneId: zone.id }
      });
    }
  }

  await upsertUser("system@lastmile.local", "System", Role.ADMIN);
  await upsertUser("admin@example.com", "Demo Admin", Role.ADMIN, "9999999900");
  await upsertUser("customer@example.com", "Demo Customer", Role.CUSTOMER, "9999999901");
  const agentNorth = await upsertUser("agent.north@example.com", "North Agent", Role.AGENT, "9999999902");
  const agentSouth = await upsertUser("agent.south@example.com", "South Agent", Role.AGENT, "9999999903");

  await prisma.agent.upsert({
    where: { userId: agentNorth.id },
    update: { currentZoneId: zones[0].id, availability: "AVAILABLE" },
    create: { userId: agentNorth.id, currentZoneId: zones[0].id, availability: "AVAILABLE" }
  });

  await prisma.agent.upsert({
    where: { userId: agentSouth.id },
    update: { currentZoneId: zones[1].id, availability: "AVAILABLE" },
    create: { userId: agentSouth.id, currentZoneId: zones[1].id, availability: "AVAILABLE" }
  });

  const cards = [
    { orderType: OrderType.B2C, zoneRelation: ZoneRelation.INTRA, baseRate: 50, ratePerKg: 12 },
    { orderType: OrderType.B2C, zoneRelation: ZoneRelation.INTER, baseRate: 80, ratePerKg: 18 },
    { orderType: OrderType.B2B, zoneRelation: ZoneRelation.INTRA, baseRate: 120, ratePerKg: 20 },
    { orderType: OrderType.B2B, zoneRelation: ZoneRelation.INTER, baseRate: 180, ratePerKg: 28 }
  ];

  await prisma.rateCard.deleteMany({});
  for (const card of cards) {
    await prisma.rateCard.create({
      data: { ...card, isActive: true, effectiveFrom: new Date("2026-01-01T00:00:00.000Z") }
    });
  }

  for (const config of [
    { orderType: OrderType.B2C, surchargeAmount: 35 },
    { orderType: OrderType.B2B, surchargeAmount: 75 }
  ]) {
    await prisma.codConfig.upsert({
      where: { orderType: config.orderType },
      update: { surchargeAmount: config.surchargeAmount },
      create: config
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
