jest.mock('supertest', () => jest.requireActual('supertest'));
const request = require('supertest');
const express = require('express');

const { Role } = require('../src/utils/roles');

let mockCurrentUser;

jest.mock('../src/middleware/auth', () => {
  const actual = jest.requireActual('../src/middleware/auth');
  return {
    ...actual,
    protect: (req, res, next) => {
      req.user = mockCurrentUser;
      next();
    }
  };
});

const User = require('../src/models/User');
const Invitacion = require('../src/models/Invitacion');
const Hospital = require('../src/models/Hospital');
const AccessCode = require('../src/models/AccessCode');

jest.mock('../src/utils/sendEmail');
const sendEmail = require('../src/utils/sendEmail');

jest.mock('../src/utils/auditLog', () => ({ createAuditLog: jest.fn() }));

const userRoutes = require('../src/routes/userRoutes');

const app = express();
app.use(express.json());
app.use('/api/users', userRoutes);
app.use((err, req, res, next) => {
  const status = err.statusCode || 500;
  res.status(status).json({ success: false, error: err.message });
});

describe('POST /api/users/invite como CSM', () => {
  beforeEach(() => {
    mockCurrentUser = {
      _id: 'csm1',
      id: 'csm1',
      rol: Role.CSM,
      zona: 'NORTE',
      tipo: 'Programa Residentes'
    };
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('permite invitar a un usuario de su zona', async () => {
    jest.spyOn(User, 'findOne').mockResolvedValue(null);
    jest.spyOn(Invitacion, 'findOne').mockResolvedValue(null);
    jest.spyOn(Hospital, 'findById').mockResolvedValue({ _id: 'h1', zona: 'NORTE' });
    const accessSpy = jest
      .spyOn(AccessCode, 'findOne')
      .mockResolvedValue({ codigo: 'CODE123', rol: 'residente', tipo: 'Programa Residentes' });
    const invitacionCreada = { _id: 'inv1', email: 'nuevo@test.com' };
    const createSpy = jest.spyOn(Invitacion, 'create').mockResolvedValue(invitacionCreada);
    sendEmail.mockResolvedValue();

    const res = await request(app)
      .post('/api/users/invite')
      .send({
        email: 'nuevo@test.com',
        rol: 'residente',
        hospital: 'h1',
        tipo: 'Programa Residentes'
      });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, data: invitacionCreada });
    expect(accessSpy).toHaveBeenCalledWith({ rol: 'residente', tipo: 'Programa Residentes' });
    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({ hospital: 'h1', email: 'nuevo@test.com', admin: mockCurrentUser.id })
    );
  });

  test('rechaza invitar a un hospital fuera de su zona', async () => {
    jest.spyOn(User, 'findOne').mockResolvedValue(null);
    jest.spyOn(Invitacion, 'findOne').mockResolvedValue(null);
    jest.spyOn(Hospital, 'findById').mockResolvedValue({ _id: 'h2', zona: 'SUR' });
    const accessSpy = jest.spyOn(AccessCode, 'findOne');
    const createSpy = jest.spyOn(Invitacion, 'create');

    const res = await request(app)
      .post('/api/users/invite')
      .send({
        email: 'zona@test.com',
        rol: 'residente',
        hospital: 'h2',
        tipo: 'Programa Residentes'
      });

    expect(res.status).toBe(403);
    expect(res.body).toEqual({
      success: false,
      error: 'No autorizado para invitar usuarios de otra zona'
    });
    expect(accessSpy).not.toHaveBeenCalled();
    expect(createSpy).not.toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
  });
});

