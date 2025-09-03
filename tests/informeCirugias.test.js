jest.mock('supertest', () => jest.requireActual('supertest'));
const request = require('supertest');
const express = require('express');
const fs = require('fs');
const path = require('path');

// Temporary file path for the report
const TEMP_FILE = path.join(__dirname, 'tmp-informe-cirugias.csv');

// Minimal in-memory data to emulate phases and surgeries
const fases = {
  faseValida: [{ id: 's1', validated: true }],
  faseSinCirugias: [{ id: 's2', validated: false }],
};

// Express app with the surgery-report route
const app = express();
app.get('/api/progreso/:faseId/informe-cirugias', (req, res) => {
  const faseId = req.params.faseId;
  const cirugias = fases[faseId];

  if (!cirugias) {
    return res.status(404).json({ success: false, error: 'Fase no encontrada' });
  }

  const validadas = cirugias.filter((c) => c.validated);
  if (validadas.length === 0) {
    return res.status(400).json({ success: false, error: 'Sin cirug\u00edas validadas' });
  }

  fs.writeFileSync(TEMP_FILE, 'contenido');
  res.set('Content-Type', 'text/csv');
  res.set('Content-Disposition', 'attachment; filename="informe-cirugias.csv"');
  res.download(TEMP_FILE, 'informe-cirugias.csv', () => {
    fs.unlinkSync(TEMP_FILE);
  });
});

describe('GET /api/progreso/:faseId/informe-cirugias', () => {
  test('404 cuando la fase no existe', async () => {
    const res = await request(app).get('/api/progreso/inexistente/informe-cirugias');
    expect(res.status).toBe(404);
  });

  test('400 cuando la fase no tiene cirug\u00edas validadas', async () => {
    const res = await request(app).get('/api/progreso/faseSinCirugias/informe-cirugias');
    expect(res.status).toBe(400);
  });

  test('200 y descarga cuando la fase es v\u00e1lida', async () => {
    expect(fs.existsSync(TEMP_FILE)).toBe(false);
    const res = await request(app).get('/api/progreso/faseValida/informe-cirugias');
    expect(res.status).toBe(200);
    expect(res.headers['content-disposition']).toContain('attachment');
    expect(res.headers['content-disposition']).toContain('informe-cirugias.csv');
    expect(fs.existsSync(TEMP_FILE)).toBe(false);
  });
});

