-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('ATLETA', 'COACH');

-- CreateEnum
CREATE TYPE "Categoria" AS ENUM ('RX', 'SCALED');

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "edad" INTEGER NOT NULL,
    "horarioClase" TEXT NOT NULL,
    "rol" "Rol" NOT NULL DEFAULT 'ATLETA',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Wod" (
    "id" TEXT NOT NULL,
    "fecha" DATE NOT NULL,
    "tipo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "goal" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Wod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EjercicioVideo" (
    "id" TEXT NOT NULL,
    "wodId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "urlVideo" TEXT NOT NULL,

    CONSTRAINT "EjercicioVideo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Score" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "wodId" TEXT NOT NULL,
    "tiempoPuntaje" TEXT NOT NULL,
    "categoria" "Categoria" NOT NULL DEFAULT 'RX',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Score_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_username_key" ON "Usuario"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Wod_fecha_key" ON "Wod"("fecha");

-- CreateIndex
CREATE UNIQUE INDEX "Score_usuarioId_wodId_key" ON "Score"("usuarioId", "wodId");

-- AddForeignKey
ALTER TABLE "EjercicioVideo" ADD CONSTRAINT "EjercicioVideo_wodId_fkey" FOREIGN KEY ("wodId") REFERENCES "Wod"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Score" ADD CONSTRAINT "Score_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Score" ADD CONSTRAINT "Score_wodId_fkey" FOREIGN KEY ("wodId") REFERENCES "Wod"("id") ON DELETE CASCADE ON UPDATE CASCADE;
