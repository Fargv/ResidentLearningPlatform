jest.mock('supertest');
const request = require('supertest');
const express = require('express');

let mockCurrentRole;

jest.mock('../src/middleware/auth', () => ({
  protect: (req, res, next) => {
    req.user = { _id: 'user', rol: mockCurrentRole };
    next();
  },
  authorize: (...roles) => (req, res, next) => {
    if (roles.includes(req.user.rol)) return next();
    return res.status(403).json({ success: false });
  }
}));

jest.mock('../src/utils/auditLog', () => ({ createAuditLog: jest.fn() }));
jest.mock('../src/utils/sendEmail');

jest.mock('../src/models/User');
const User = require('../src/models/User');
const sendEmail = require('../src/utils/sendEmail');

const userRoutes = require('../src/routes/userRoutes');

const app = express();
app.use(express.json());
app.use('/api/users', userRoutes);
app.use((err, req, res, next) => {
  res.status(err.statusCode || 500).json({
    success: false,
    error: err.message || 'Server Error'
  });
});

const mockUser = (email, nombre) => ({
  _id: 'u1',
  email,
  nombre,
  getResetPasswordToken: jest.fn(() => 'token123'),
  save: jest.fn().mockResolvedValue()
});

const expectedExpireDays = parseInt(process.env.RESET_PASSWORD_EXPIRE_DAYS || '3', 10);

describe('POST /api/users/:id/reset-password', () => {
  beforeEach(() => {
    sendEmail.mockResolvedValue({});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('tutor recibe confirmación de envío', async () => {
    mockCurrentRole = 'tutor';
    User.findById.mockResolvedValue(mockUser('tutor@test.com', 'Tutor'));

    const res = await request(app).post('/api/users/u1/reset-password').send({});

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      success: true,
      email: 'tutor@test.com',
      name: 'Tutor',
      expiresInDays: expectedExpireDays
    });
    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: [{ email: 'tutor@test.com', name: 'Tutor' }],
        subject: expect.stringContaining('Restablecer contraseña')
      })
    );
  });

  test('csm recibe confirmación de envío', async () => {
    mockCurrentRole = 'csm';
    User.findById.mockResolvedValue(mockUser('csm@test.com', 'Csm'));

    const res = await request(app).post('/api/users/u1/reset-password').send({});

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      success: true,
      email: 'csm@test.com',
      name: 'Csm',
      expiresInDays: expectedExpireDays
    });
    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: [{ email: 'csm@test.com', name: 'Csm' }]
      })
    );
  });

  test('devuelve error si no se puede enviar el email', async () => {
    mockCurrentRole = 'administrador';
    const user = mockUser('admin@test.com', 'Admin');
    User.findById.mockResolvedValue(user);
    sendEmail.mockRejectedValue(new Error('smtp-error'));

    const res = await request(app).post('/api/users/u1/reset-password').send({});

    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      success: false,
      error: 'No se pudo enviar el email de restablecimiento'
    });

    expect(user.resetPasswordToken).toBeUndefined();
    expect(user.resetPasswordExpire).toBeUndefined();
  });
});

