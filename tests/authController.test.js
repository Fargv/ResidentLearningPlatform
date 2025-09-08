const { checkAccessCode, requestPasswordReset } = require('../src/controllers/authController');
const AccessCode = require('../src/models/AccessCode');
const User = require('../src/models/User');
const Notificacion = require('../src/models/Notificacion');
const ErrorResponse = require('../src/utils/errorResponse');

describe('checkAccessCode', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('returns rol and tipo for valid code', async () => {
    const access = { rol: 'residente', tipo: 'Programa Residentes' };
    const req = { params: { codigo: 'ABCD' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    jest
      .spyOn(AccessCode, 'findOne')
      .mockReturnValue({ lean: jest.fn().mockResolvedValue(access) });

    await checkAccessCode(req, res, jest.fn());

    expect(AccessCode.findOne).toHaveBeenCalledWith({ codigo: 'ABCD' });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: access });
  });

  test('passes error when code not found', async () => {
    const req = { params: { codigo: 'BAD' } };
    const next = jest.fn();
    jest
      .spyOn(AccessCode, 'findOne')
      .mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });

    await checkAccessCode(req, {}, next);

    expect(next).toHaveBeenCalledWith(expect.any(ErrorResponse));
  });
});

describe('requestPasswordReset', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('returns 404 and does not create notifications when email not found', async () => {
    const req = { body: { email: 'missing@test.com' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    jest
      .spyOn(User, 'findOne')
      .mockReturnValue({ populate: jest.fn().mockResolvedValue(null) });
    const insertSpy = jest.spyOn(Notificacion, 'insertMany').mockResolvedValue();

    await requestPasswordReset(req, res, next);

    expect(User.findOne).toHaveBeenCalledWith({ email: 'missing@test.com' });
    expect(insertSpy).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(expect.any(ErrorResponse));
    expect(next.mock.calls[0][0].statusCode).toBe(404);
  });
});
