const { inviteUser } = require('../src/controllers/userController');
const User = require('../src/models/User');
const Invitacion = require('../src/models/Invitacion');
const Hospital = require('../src/models/Hospital');
const sendEmail = require('../src/utils/sendEmail');
const { createAuditLog } = require('../src/utils/auditLog');
const ErrorResponse = require('../src/utils/errorResponse');

jest.mock('../src/utils/sendEmail');
jest.mock('../src/utils/auditLog', () => ({ createAuditLog: jest.fn() }));

describe('inviteUser', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('crea invitación y envía email', async () => {
    jest.spyOn(User, 'findOne').mockResolvedValue(null);
    jest.spyOn(Invitacion, 'findOne').mockResolvedValue(null);
    jest.spyOn(Hospital, 'findById').mockResolvedValue({ _id: 'h1' });
    const created = { _id: 'i1', email: 'new@test.com' };
    jest.spyOn(Invitacion, 'create').mockResolvedValue(created);
    sendEmail.mockResolvedValue();

    const req = {
      body: { email: 'new@test.com', rol: 'residente', hospital: 'h1' },
      protocol: 'http',
      get: () => 'localhost',
      user: { _id: 'admin', id: 'admin' },
      ip: '::1'
    };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await inviteUser(req, res, jest.fn());

    expect(Invitacion.create).toHaveBeenCalled();
    expect(sendEmail).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: created });
  });

  test('retorna error si el email existe', async () => {
    jest.spyOn(User, 'findOne').mockResolvedValue({ _id: 'u1' });
    const next = jest.fn();

    await inviteUser({ body: { email: 'taken@test.com' } }, {}, next);

    expect(next).toHaveBeenCalledWith(expect.any(ErrorResponse));
  });
});
