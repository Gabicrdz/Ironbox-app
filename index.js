const express = require('express');
const cors = require('cors');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json({ limit: '10mb' })); 
app.use(express.static('public'));

app.get('/', (req, res) => { res.sendFile(path.join(__dirname, 'public', 'index.html')); });

// Usuarios
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await prisma.usuario.findUnique({ where: { username } });
        if (user && user.password === password) { res.json(user); } else { res.status(401).json({ error: "Credenciales incorrectas" }); }
    } catch (e) { res.status(500).json({ error: "Error" }); }
});

app.post('/api/usuarios', async (req, res) => {
    const { username, password, nombre, apellido, edad, horarioClase, rol, categoria, fotoUrl } = req.body;
    try {
        const usuario = await prisma.usuario.create({ data: { username, password, nombre, apellido, edad: parseInt(edad), horarioClase, rol, categoria, fotoUrl } });
        res.status(201).json(usuario);
    } catch (e) { res.status(400).json({ error: "Error al registrar" }); }
});

app.get('/api/usuarios/:username', async (req, res) => {
    const user = await prisma.usuario.findUnique({ where: { username: req.params.username } });
    user ? res.json(user) : res.status(404).json({ error: "No encontrado" });
});

// --- EDICIÓN DE PERFIL ACTUALIZADA (AHORA RECIBE CATEGORÍA) ---
app.put('/api/usuarios/:username', async (req, res) => {
    const { username } = req.params;
    const { nombre, apellido, fotoUrl, categoria } = req.body;
    try {
        const datosActualizar = { nombre, apellido };
        if (categoria) datosActualizar.categoria = categoria; // Actualiza la categoría
        if (fotoUrl) datosActualizar.fotoUrl = fotoUrl;
        const usuarioActualizado = await prisma.usuario.update({ where: { username }, data: datosActualizar });
        res.json(usuarioActualizado);
    } catch (e) { res.status(400).json({ error: "No se pudo actualizar el perfil." }); }
});

app.get('/api/usuarios/:username/historial', async (req, res) => {
    try {
        const usuario = await prisma.usuario.findUnique({ where: { username: req.params.username } });
        if (!usuario) return res.status(404).json({ error: "Usuario no encontrado" });
        const historial = await prisma.score.findMany({ where: { usuarioId: usuario.id }, include: { wod: true }, orderBy: { createdAt: 'desc' } });
        res.json(historial);
    } catch (e) { res.status(500).json({ error: "Error" }); }
});

// RMs
app.post('/api/rms', async (req, res) => {
    const { username, ejercicio, peso } = req.body;
    try {
        const usuario = await prisma.usuario.findUnique({ where: { username } });
        if (!usuario) return res.status(404).json({ error: "Usuario no encontrado" });
        const nuevoRm = await prisma.rm.create({ data: { usuarioId: usuario.id, ejercicio: ejercicio.toUpperCase().trim(), peso: parseFloat(peso) } });
        res.status(201).json(nuevoRm);
    } catch (e) { res.status(400).json({ error: "Error" }); }
});

app.get('/api/usuarios/:username/rms', async (req, res) => {
    try {
        const usuario = await prisma.usuario.findUnique({ where: { username: req.params.username } });
        if (!usuario) return res.status(404).json({ error: "Usuario no encontrado" });
        const rms = await prisma.rm.findMany({ where: { usuarioId: usuario.id }, orderBy: { ejercicio: 'asc' } });
        res.json(rms);
    } catch (e) { res.status(500).json({ error: "Error" }); }
});

app.put('/api/rms/:id', async (req, res) => {
    const { id } = req.params;
    const { peso } = req.body;
    try {
        const rmActualizado = await prisma.rm.update({ where: { id: id }, data: { peso: parseFloat(peso) } });
        res.json(rmActualizado);
    } catch (e) { res.status(400).json({ error: "Error" }); }
});

// --- WODS (INCLUYE BÚSQUEDA POR FECHA PARA EDITAR) ---
app.post('/api/wods', async (req, res) => {
    const { fecha, tipo, descripcion, goal } = req.body;
    try {
        const fechaObj = new Date(fecha + 'T12:00:00Z');
        const wod = await prisma.wod.upsert({
            where: { fecha: fechaObj },
            update: { tipo, descripcion, goal },
            create: { fecha: fechaObj, tipo, descripcion, goal }
        });
        res.status(201).json(wod);
    } catch (e) { res.status(400).json({ error: "Error al guardar el WOD" }); }
});

app.get('/api/wods/today', async (req, res) => {
    try {
        const today = new Date();
        const wod = await prisma.wod.findFirst({ where: { fecha: { lte: today } }, orderBy: { fecha: 'desc' } });
        res.json(wod || {});
    } catch (e) { res.status(500).json({ error: "Error" }); }
});

// Endpoint para buscar WOD por fecha específica y cargarlo en el form del coach
app.get('/api/wods/date/:date', async (req, res) => {
    try {
        const fechaObj = new Date(req.params.date + 'T12:00:00Z');
        const wod = await prisma.wod.findUnique({ where: { fecha: fechaObj } });
        res.json(wod || { vacio: true });
    } catch (e) { res.status(500).json({ error: "Error" }); }
});

// Scores
app.post('/api/scores', async (req, res) => {
    const { username, wodId, tiempoPuntaje, categoria, bloque } = req.body;
    try {
        const usuario = await prisma.usuario.findUnique({ where: { username } });
        if (!usuario) return res.status(404).json({ error: "Usuario no encontrado" });
        const nuevoScore = await prisma.score.create({ data: { usuarioId: usuario.id, wodId, tiempoPuntaje, categoria, bloque: bloque || 'GENERAL' } });
        res.status(201).json(nuevoScore);
    } catch (error) { res.status(400).json({ error: 'Error' }); }
});

app.get('/api/scores/today', async (req, res) => {
    try {
        const today = new Date();
        const wod = await prisma.wod.findFirst({ where: { fecha: { lte: today } }, orderBy: { fecha: 'desc' } });
        if (!wod) return res.json({ scores: [] });
        const scores = await prisma.score.findMany({
            where: { wodId: wod.id },
            include: { usuario: { select: { nombre: true, apellido: true, horarioClase: true } } },
            orderBy: [{ bloque: 'asc' }, { tiempoPuntaje: 'asc' }]
        });
        res.json({ wodId: wod.id, scores });
    } catch (error) { res.status(500).json({ error: 'Error' }); }
});

// --- NUEVA SECCIÓN: EJERCICIOS ---
app.post('/api/ejercicios', async (req, res) => {
    const { nombre, link } = req.body;
    try {
        const ej = await prisma.ejercicio.create({ data: { nombre: nombre.toUpperCase().trim(), link } });
        res.status(201).json(ej);
    } catch (e) { res.status(400).json({ error: "Error al guardar el ejercicio" }); }
});

app.get('/api/ejercicios', async (req, res) => {
    try {
        const ejs = await prisma.ejercicio.findMany({ orderBy: { nombre: 'asc' } });
        res.json(ejs);
    } catch (e) { res.status(500).json({ error: "Error" }); }
});

module.exports = app;