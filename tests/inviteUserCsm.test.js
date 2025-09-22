jest.mock('../src/config/config', () => ({
  frontendUrl: 'https://frontend.test/app/'
}));

const { inviteUser } = require('../src/controllers/userController');
const User = require('../src/models/User');
const Invitacion = require('../src/models/Invitacion');
const Hospital = require('../src/models/Hospital');
const AccessCode = require('../src/models/AccessCode');
const sendEmail = require('../src/utils/sendEmail');
const { createAuditLog } = require('../src/utils/auditLog');

jest.mock('../src/utils/sendEmail');
jest.mock('../src/utils/auditLog', () => ({ createAuditLog: jest.fn() }));

describe('inviteUser csm', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  test('crea invitación para csm', async () => {
    jest.spyOn(User, 'findOne').mockResolvedValue(null);
    jest.spyOn(Invitacion, 'findOne').mockResolvedValue(null);
    jest.spyOn(Hospital, 'findById').mockResolvedValue({ _id: 'h1' });
    const accessSpy = jest
      .spyOn(AccessCode, 'findOne')
      .mockResolvedValue({ codigo: 'CSM123', rol: 'csm', tipo: 'Programa Residentes' });
    const created = { _id: 'i1', email: 'coord@test.com', rol: 'csm' };
    jest.spyOn(Invitacion, 'create').mockResolvedValue(created);
    sendEmail.mockResolvedValue();

    const req = {
      body: {
        email: 'coord@test.com',
        rol: 'csm',
        hospital: 'h1',
        tipo: 'Programa Residentes'
      },
      protocol: 'http',
      get: () => 'localhost',
      user: { _id: 'admin', id: 'admin' },
      ip: '::1'
    };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await inviteUser(req, res, jest.fn());

    expect(Invitacion.create).toHaveBeenCalledWith(
      expect.objectContaining({ rol: 'csm' })
    );
    expect(accessSpy).toHaveBeenCalledWith({ rol: 'csm', tipo: 'Programa Residentes' });
    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining('Código de acceso: CSM123')
      })
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: created });
  });
});
