const express = require('express');
const cors = require('cors');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 1. Obtener el WOD del día
app.get('/api/wods/today', async (req, res) => {
    try {
        const wod = await prisma.wod.findFirst({
            orderBy: { fecha: 'desc' },
            include: { ejercicios: true }
        });
        res.json(wod || { mensaje: 'No hay WOD cargado para hoy' });
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener el WOD' });
    }
});

// 2. Registro de nuevo Atleta
app.post('/api/usuarios', async (req, res) => {
    const { username, password, nombre, apellido, edad, horarioClase } = req.body;
    try {
        const nuevoUsuario = await prisma.usuario.create({
            data: { username, password, nombre, apellido, edad: parseInt(edad), horarioClase }
        });
        res.status(201).json({ mensaje: 'Atleta registrado con éxito', usuario: nuevoUsuario });
    } catch (error) {
        res.status(400).json({ error: 'Error al registrar. Es posible que el usuario ya exista.' });
    }
});

// 3. Cargar un nuevo Score
app.post('/api/scores', async (req, res) => {
    const { username, wodId, tiempoPuntaje, categoria } = req.body;
    try {
        // Primero buscamos al usuario por su username
        const usuario = await prisma.usuario.findUnique({ where: { username } });
        if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

        const nuevoScore = await prisma.score.create({
            data: {
                usuarioId: usuario.id,
                wodId: wodId,
                tiempoPuntaje,
                categoria
            }
        });
        res.status(201).json(nuevoScore);
    } catch (error) {
        res.status(400).json({ error: 'Error. ¿Ya cargaste tu score para este WOD?' });
    }
});

// 4. Obtener Leaderboard del día
app.get('/api/scores/today', async (req, res) => {
    try {
        const wod = await prisma.wod.findFirst({ orderBy: { fecha: 'desc' } });
        if (!wod) return res.json({ scores: [] });

        const scores = await prisma.score.findMany({
            where: { wodId: wod.id },
            include: {
                usuario: { select: { nombre: true, apellido: true, horarioClase: true } }
            },
            orderBy: { tiempoPuntaje: 'asc' } // Ordena del menor tiempo al mayor
        });
        res.json({ wodId: wod.id, scores });
    } catch (error) {
        res.status(500).json({ error: 'Error al cargar el Leaderboard' });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});