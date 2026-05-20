-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "edad" INTEGER NOT NULL,
    "horarioClase" TEXT NOT NULL,
    "rol" TEXT NOT NULL DEFAULT 'ATLETA',
    "fotoUrl" TEXT,
    "categoria" TEXT NOT NULL DEFAULT 'RX',

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Wod" (
    "id" TEXT NOT NULL,
    "fecha" DATE NOT NULL,
    "tipo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "goal" TEXT NOT NULL,

    CONSTRAINT "Wod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Score" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "wodId" TEXT NOT NULL,
    "tiempoPuntaje" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,

    CONSTRAINT "Score_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_username_key" ON "Usuario"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Wod_fecha_key" ON "Wod"("fecha");

-- AddForeignKey
ALTER TABLE "Score" ADD CONSTRAINT "Score_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Score" ADD CONSTRAINT "Score_wodId_fkey" FOREIGN KEY ("wodId") REFERENCES "Wod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
