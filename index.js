const express = require('express');
const cors = require('cors');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();

app.use(cors());
// Aumentamos el límite de JSON a 10mb para permitir recibir el texto de las fotos
app.use(express.json({ limit: '10mb' })); 
app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Autenticación (Login)
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await prisma.usuario.findUnique({ where: { username } });
        if (user && user.password === password) {
            res.json(user);
        } else {
            res.status(401).json({ error: "Credenciales incorrectas" });
        }
    } catch (e) { res.status(500).json({ error: "Error en el servidor" }); }
});

// Registro de usuarios (SIN MULTER - Recibe Base64)
app.post('/api/usuarios', async (req, res) => {
    const { username, password, nombre, apellido, edad, horarioClase, rol, categoria, fotoUrl } = req.body;
    try {
        const usuario = await prisma.usuario.create({
            data: { username, password, nombre, apellido, edad: parseInt(edad), horarioClase, rol, categoria, fotoUrl }
        });
        res.status(201).json(usuario);
    } catch (e) { 
        console.error(e);
        res.status(400).json({ error: "Error al registrar" }); 
    }
});

app.get('/api/usuarios/:username', async (req, res) => {
    const user = await prisma.usuario.findUnique({ where: { username: req.params.username } });
    user ? res.json(user) : res.status(404).json({ error: "No encontrado" });
});

// Historial personal del atleta
app.get('/api/usuarios/:username/historial', async (req, res) => {
    try {
        const usuario = await prisma.usuario.findUnique({ where: { username: req.params.username } });
        if (!usuario) return res.status(404).json({ error: "Usuario no encontrado" });

        const historial = await prisma.score.findMany({
            where: { usuarioId: usuario.id },
            include: { wod: true },
            orderBy: { createdAt: 'desc' }
        });
        res.json(historial);
    } catch (e) { res.status(500).json({ error: "Error al obtener historial" }); }
});

// Guardar un RM nuevo
app.post('/api/rms', async (req, res) => {
    const { username, ejercicio, peso } = req.body;
    try {
        const usuario = await prisma.usuario.findUnique({ where: { username } });
        if (!usuario) return res.status(404).json({ error: "Usuario no encontrado" });

        const nuevoRm = await prisma.rm.create({
            data: {
                usuarioId: usuario.id,
                ejercicio: ejercicio.toUpperCase().trim(),
                peso: parseFloat(peso)
            }
        });
        res.status(201).json(nuevoRm);
    } catch (e) { res.status(400).json({ error: "Error al guardar el RM" }); }
});

// Obtener RMs
app.get('/api/usuarios/:username/rms', async (req, res) => {
    try {
        const usuario = await prisma.usuario.findUnique({ where: { username: req.params.username } });
        if (!usuario) return res.status(404).json({ error: "Usuario no encontrado" });

        const rms = await prisma.rm.findMany({
            where: { usuarioId: usuario.id },
            orderBy: { ejercicio: 'asc' }
        });
        res.json(rms);
    } catch (e) { res.status(500).json({ error: "Error al obtener RMs" }); }
});

// Actualizar RM
app.put('/api/rms/:id', async (req, res) => {
    const { id } = req.params;
    const { peso } = req.body;
    try {
        const rmActualizado = await prisma.rm.update({
            where: { id: id },
            data: { peso: parseFloat(peso) }
        });
        res.json(rmActualizado);
    } catch (e) { res.status(400).json({ error: "Error al actualizar" }); }
});

// Configuración de WODs
app.post('/api/wods', async (req, res) => {
    const { tipo, descripcion, goal } = req.body;
    try {
        const wod = await prisma.wod.create({ data: { fecha: new Date(), tipo, descripcion, goal } });
        res.status(201).json(wod);
    } catch (e) { res.status(400).json({ error: "Error al crear WOD" }); }
});

app.get('/api/wods/today', async (req, res) => {
    const wod = await prisma.wod.findFirst({ orderBy: { fecha: 'desc' } });
    res.json(wod || {});
});

// Scores
app.post('/api/scores', async (req, res) => {
    const { username, wodId, tiempoPuntaje, categoria } = req.body;
    try {
        const usuario = await prisma.usuario.findUnique({ where: { username } });
        if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

        const nuevoScore = await prisma.score.create({
            data: { usuarioId: usuario.id, wodId, tiempoPuntaje, categoria }
        });
        res.status(201).json(nuevoScore);
    } catch (error) { res.status(400).json({ error: 'Error al cargar score' }); }
});

app.get('/api/scores/today', async (req, res) => {
    try {
        const wod = await prisma.wod.findFirst({ orderBy: { fecha: 'desc' } });
        if (!wod) return res.json({ scores: [] });

        const scores = await prisma.score.findMany({
            where: { wodId: wod.id },
            include: { usuario: { select: { nombre: true, apellido: true, horarioClase: true } } },
            orderBy: { tiempoPuntaje: 'asc' }
        });
        res.json({ wodId: wod.id, scores });
    } catch (error) { res.status(500).json({ error: 'Error' }); }
});

module.exports = app;