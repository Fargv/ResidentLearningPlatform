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

jest.mock('../src/models/User');
const User = require('../src/models/User');

const userRoutes = require('../src/routes/userRoutes');

const app = express();
app.use(express.json());
app.use('/api/users', userRoutes);

const mockUser = (email, nombre) => ({
  _id: 'u1',
  email,
  nombre,
  getResetPasswordToken: jest.fn(() => 'token123'),
  save: jest.fn().mockResolvedValue()
});

describe('POST /api/users/:id/reset-password', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('tutor recibe token y metadatos', async () => {
    mockCurrentRole = 'tutor';
    User.findById.mockResolvedValue(mockUser('tutor@test.com', 'Tutor'));

    const res = await request(app).post('/api/users/u1/reset-password').send({});

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      success: true,
      resetToken: 'token123',
      email: 'tutor@test.com',
      name: 'Tutor'
    });
  });

  test('csm recibe token y metadatos', async () => {
    mockCurrentRole = 'csm';
    User.findById.mockResolvedValue(mockUser('csm@test.com', 'Csm'));

    const res = await request(app).post('/api/users/u1/reset-password').send({});

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      success: true,
      resetToken: 'token123',
      email: 'csm@test.com',
      name: 'Csm'
    });
  });
});

