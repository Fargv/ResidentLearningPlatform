jest.mock('supertest');
const request = require('supertest');
const express = require('express');

jest.mock('../src/middleware/auth', () => ({
  protect: (req, res, next) => { req.user = { _id: 'admin', rol: 'administrador' }; return next(); },
  authorize: () => (req, res, next) => next()
}));

jest.mock('../src/models/AccessCode');
const AccessCode = require('../src/models/AccessCode');

const accessCodeRoutes = require('../src/routes/accessCodeRoutes');

const app = express();
app.use(express.json());
app.use('/api/access-codes', accessCodeRoutes);

describe('access code routes', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('POST /api/access-codes crea un código', async () => {
    const nuevo = { _id: '1', codigo: 'CODE', rol: 'residente', tipo: 'Programa' };
    AccessCode.create.mockResolvedValue(nuevo);
    const res = await request(app)
      .post('/api/access-codes')
      .send({ codigo: 'CODE', rol: 'residente', tipo: 'Programa' });
    expect(res.status).toBe(201);
    expect(res.body.data).toEqual(nuevo);
  });

  test('GET /api/access-codes lista códigos', async () => {
    const list = [{ _id: '1' }, { _id: '2' }];
    AccessCode.find.mockResolvedValue(list);
    const res = await request(app).get('/api/access-codes');
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(2);
    expect(res.body.data).toEqual(list);
  });

  test('GET /api/access-codes/:id devuelve código', async () => {
    const code = { _id: '1', codigo: 'A' };
    AccessCode.findById.mockResolvedValue(code);
    const res = await request(app).get('/api/access-codes/1');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(code);
  });

  test('PUT /api/access-codes/:id actualiza código', async () => {
    const updated = { _id: '1', codigo: 'B' };
    AccessCode.findByIdAndUpdate.mockResolvedValue(updated);
    const res = await request(app)
      .put('/api/access-codes/1')
      .send({ codigo: 'B' });
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(updated);
  });

  test('DELETE /api/access-codes/:id elimina código', async () => {
    const code = { _id: '1', remove: jest.fn().mockResolvedValue() };
    AccessCode.findById.mockResolvedValue(code);
    const res = await request(app).delete('/api/access-codes/1');
    expect(AccessCode.findById).toHaveBeenCalledWith('1');
    expect(code.remove).toHaveBeenCalled();
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({});
  });
});
