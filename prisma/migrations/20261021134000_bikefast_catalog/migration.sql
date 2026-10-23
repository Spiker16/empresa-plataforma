-- Bikefast Electrics: adapta el inventario existente a bicicletas eléctricas.
-- Esta migración no elimina los datos históricos del CRM.

ALTER TYPE "VehicleType" RENAME TO "VehicleType_legacy";
CREATE TYPE "VehicleType" AS ENUM (
  'BICICLETA_ELECTRICA',
  'BICICLETA_CARGA',
  'BICICLETA_URBANA',
  'BICICLETA_MONTANA'
);
ALTER TABLE "Vehicle"
  ALTER COLUMN "vehicleType" TYPE "VehicleType"
  USING CASE
    WHEN "vehicleType"::text = 'MOTO' THEN 'BICICLETA_URBANA'::"VehicleType"
    ELSE 'BICICLETA_ELECTRICA'::"VehicleType"
  END;
DROP TYPE "VehicleType_legacy";

ALTER TYPE "Transmission" RENAME TO "Transmission_legacy";
CREATE TYPE "Transmission" AS ENUM ('ASISTENCIA_PEDAL', 'ACELERADOR');
ALTER TABLE "Vehicle"
  ALTER COLUMN "transmission" TYPE "Transmission"
  USING 'ASISTENCIA_PEDAL'::"Transmission";
DROP TYPE "Transmission_legacy";

ALTER TYPE "FuelType" RENAME TO "FuelType_legacy";
CREATE TYPE "FuelType" AS ENUM ('ELECTRICO');
ALTER TABLE "Vehicle"
  ALTER COLUMN "fuelType" TYPE "FuelType"
  USING 'ELECTRICO'::"FuelType";
DROP TYPE "FuelType_legacy";

ALTER TABLE "Vehicle"
  ADD COLUMN IF NOT EXISTS "battery" TEXT,
  ADD COLUMN IF NOT EXISTS "rangeKm" INTEGER,
  ADD COLUMN IF NOT EXISTS "motorPower" TEXT,
  ADD COLUMN IF NOT EXISTS "chargeTime" TEXT,
  ADD COLUMN IF NOT EXISTS "maxSpeed" INTEGER,
  ADD COLUMN IF NOT EXISTS "weightCapacity" INTEGER;
