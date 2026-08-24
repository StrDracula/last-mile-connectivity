CREATE TYPE "Role" AS ENUM ('CUSTOMER', 'AGENT', 'ADMIN');
CREATE TYPE "ActorRole" AS ENUM ('CUSTOMER', 'AGENT', 'ADMIN', 'SYSTEM');
CREATE TYPE "OrderType" AS ENUM ('B2B', 'B2C');
CREATE TYPE "ZoneRelation" AS ENUM ('INTRA', 'INTER');
CREATE TYPE "Availability" AS ENUM ('AVAILABLE', 'BUSY', 'OFFLINE');
CREATE TYPE "PaymentType" AS ENUM ('PREPAID', 'COD');
CREATE TYPE "OrderStatus" AS ENUM ('PLACED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED', 'RESCHEDULED');
CREATE TYPE "NotificationChannelType" AS ENUM ('EMAIL', 'SMS');
CREATE TYPE "NotificationStatus" AS ENUM ('SENT', 'FAILED', 'SKIPPED');

CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "role" "Role" NOT NULL,
  "phone" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Zone" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  CONSTRAINT "Zone_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ZoneArea" (
  "id" TEXT NOT NULL,
  "zoneId" TEXT NOT NULL,
  "areaKey" TEXT NOT NULL,
  CONSTRAINT "ZoneArea_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RateCard" (
  "id" TEXT NOT NULL,
  "orderType" "OrderType" NOT NULL,
  "zoneRelation" "ZoneRelation" NOT NULL,
  "baseRate" DOUBLE PRECISION NOT NULL,
  "ratePerKg" DOUBLE PRECISION NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "effectiveFrom" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RateCard_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CodConfig" (
  "id" TEXT NOT NULL,
  "orderType" "OrderType" NOT NULL,
  "surchargeAmount" DOUBLE PRECISION NOT NULL,
  CONSTRAINT "CodConfig_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Agent" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "currentZoneId" TEXT NOT NULL,
  "availability" "Availability" NOT NULL DEFAULT 'AVAILABLE',
  CONSTRAINT "Agent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Order" (
  "id" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "createdById" TEXT NOT NULL,
  "pickupAddress" TEXT NOT NULL,
  "pickupZoneId" TEXT NOT NULL,
  "dropAddress" TEXT NOT NULL,
  "dropZoneId" TEXT NOT NULL,
  "lengthCm" DOUBLE PRECISION NOT NULL,
  "breadthCm" DOUBLE PRECISION NOT NULL,
  "heightCm" DOUBLE PRECISION NOT NULL,
  "actualWeightKg" DOUBLE PRECISION NOT NULL,
  "volumetricWeightKg" DOUBLE PRECISION NOT NULL,
  "billableWeightKg" DOUBLE PRECISION NOT NULL,
  "orderType" "OrderType" NOT NULL,
  "paymentType" "PaymentType" NOT NULL,
  "baseCharge" DOUBLE PRECISION NOT NULL,
  "codSurcharge" DOUBLE PRECISION NOT NULL,
  "totalCharge" DOUBLE PRECISION NOT NULL,
  "currentStatus" "OrderStatus" NOT NULL,
  "assignedAgentId" TEXT,
  "scheduledDate" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OrderStatusHistory" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "status" "OrderStatus" NOT NULL,
  "actorId" TEXT NOT NULL,
  "actorRole" "ActorRole" NOT NULL,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OrderStatusHistory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RescheduleRequest" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "requestedDate" TIMESTAMP(3) NOT NULL,
  "reason" TEXT NOT NULL,
  "newAgentId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RescheduleRequest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "NotificationLog" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "channel" "NotificationChannelType" NOT NULL,
  "recipient" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "status" "NotificationStatus" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "NotificationLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "Zone_name_key" ON "Zone"("name");
CREATE UNIQUE INDEX "ZoneArea_areaKey_key" ON "ZoneArea"("areaKey");
CREATE INDEX "RateCard_orderType_zoneRelation_isActive_effectiveFrom_idx" ON "RateCard"("orderType", "zoneRelation", "isActive", "effectiveFrom");
CREATE UNIQUE INDEX "CodConfig_orderType_key" ON "CodConfig"("orderType");
CREATE UNIQUE INDEX "Agent_userId_key" ON "Agent"("userId");
CREATE INDEX "Order_customerId_currentStatus_idx" ON "Order"("customerId", "currentStatus");
CREATE INDEX "Order_assignedAgentId_currentStatus_idx" ON "Order"("assignedAgentId", "currentStatus");
CREATE INDEX "Order_pickupZoneId_idx" ON "Order"("pickupZoneId");
CREATE INDEX "Order_dropZoneId_idx" ON "Order"("dropZoneId");
CREATE INDEX "OrderStatusHistory_orderId_createdAt_idx" ON "OrderStatusHistory"("orderId", "createdAt");

ALTER TABLE "ZoneArea" ADD CONSTRAINT "ZoneArea_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Agent" ADD CONSTRAINT "Agent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Agent" ADD CONSTRAINT "Agent_currentZoneId_fkey" FOREIGN KEY ("currentZoneId") REFERENCES "Zone"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Order" ADD CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Order" ADD CONSTRAINT "Order_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Order" ADD CONSTRAINT "Order_pickupZoneId_fkey" FOREIGN KEY ("pickupZoneId") REFERENCES "Zone"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Order" ADD CONSTRAINT "Order_dropZoneId_fkey" FOREIGN KEY ("dropZoneId") REFERENCES "Zone"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Order" ADD CONSTRAINT "Order_assignedAgentId_fkey" FOREIGN KEY ("assignedAgentId") REFERENCES "Agent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "OrderStatusHistory" ADD CONSTRAINT "OrderStatusHistory_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrderStatusHistory" ADD CONSTRAINT "OrderStatusHistory_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RescheduleRequest" ADD CONSTRAINT "RescheduleRequest_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RescheduleRequest" ADD CONSTRAINT "RescheduleRequest_newAgentId_fkey" FOREIGN KEY ("newAgentId") REFERENCES "Agent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "NotificationLog" ADD CONSTRAINT "NotificationLog_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE OR REPLACE FUNCTION prevent_status_history_mutation()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'OrderStatusHistory is append-only';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER order_status_history_append_only_update
BEFORE UPDATE ON "OrderStatusHistory"
FOR EACH ROW EXECUTE FUNCTION prevent_status_history_mutation();

CREATE TRIGGER order_status_history_append_only_delete
BEFORE DELETE ON "OrderStatusHistory"
FOR EACH ROW EXECUTE FUNCTION prevent_status_history_mutation();
