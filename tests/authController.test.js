const { checkAccessCode } = require('../src/controllers/authController');
const AccessCode = require('../src/models/AccessCode');
const ErrorResponse = require('../src/utils/errorResponse');

describe('checkAccessCode', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('returns rol and tipo for valid code', async () => {
    const access = { rol: 'residente', tipo: 'Programa Residentes' };
    const req = { params: { codigo: 'ABCD' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    jest.spyOn(AccessCode, 'findOne').mockResolvedValue(access);

    await checkAccessCode(req, res, jest.fn());

    expect(AccessCode.findOne).toHaveBeenCalledWith({ codigo: 'ABCD' });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: access });
  });

  test('passes error when code not found', async () => {
    const req = { params: { codigo: 'BAD' } };
    const next = jest.fn();
    jest.spyOn(AccessCode, 'findOne').mockResolvedValue(null);

    await checkAccessCode(req, {}, next);

    expect(next).toHaveBeenCalledWith(expect.any(ErrorResponse));
  });
});
