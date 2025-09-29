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
  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

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
    jest.spyOn(Invitacion, 'findOneAndUpdate').mockResolvedValue(created);
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
      expect.objectContaining({ rol: 'csm', tipo: 'Programa Residentes' })
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

  test('permite reenvío de invitación pendiente para csm', async () => {
    jest.spyOn(User, 'findOne').mockResolvedValue(null);
    const existingInvitation = {
      _id: 'csm-inv',
      email: 'coord@test.com',
      estado: 'pendiente',
      hospital: 'h1'
    };
    jest.spyOn(Invitacion, 'findOne').mockResolvedValue(existingInvitation);
    jest.spyOn(Hospital, 'findById').mockResolvedValue({ _id: 'h1', zona: 'norte' });
    jest
      .spyOn(AccessCode, 'findOne')
      .mockResolvedValue({ codigo: 'CSM123', rol: 'csm', tipo: 'Programa Residentes' });
    const updated = { _id: 'csm-inv', email: 'coord@test.com', rol: 'csm' };
    const updateSpy = jest
      .spyOn(Invitacion, 'findOneAndUpdate')
      .mockResolvedValue(updated);
    sendEmail.mockResolvedValue();

    const req = {
      body: {
        email: 'coord@test.com',
        rol: 'csm',
        hospital: 'h1',
        tipo: 'Programa Residentes'
      },
      user: { _id: 'admin', id: 'admin' },
      ip: '::1'
    };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await inviteUser(req, res, jest.fn());

    expect(updateSpy).toHaveBeenCalledWith(
      { _id: existingInvitation._id },
      expect.objectContaining({ $set: expect.objectContaining({ email: 'coord@test.com' }) }),
      expect.objectContaining({ upsert: true })
    );
    expect(sendEmail).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: updated });
  });

  test('registra log y reenvía cuando el correo ya tiene usuario', async () => {
    const logSpy = jest.spyOn(console, 'info').mockImplementation(() => {});
    jest.spyOn(User, 'findOne').mockResolvedValue({ _id: 'existing-user' });
    jest.spyOn(Invitacion, 'findOne').mockResolvedValue(null);
    jest.spyOn(Hospital, 'findById').mockResolvedValue({ _id: 'h1', zona: 'norte' });
    jest
      .spyOn(AccessCode, 'findOne')
      .mockResolvedValue({ codigo: 'CSM123', rol: 'csm', tipo: 'Programa Residentes' });
    const updated = { _id: 'csm-inv-new', email: 'coord@test.com', rol: 'csm' };
    jest.spyOn(Invitacion, 'findOneAndUpdate').mockResolvedValue(updated);
    sendEmail.mockResolvedValue();

    const req = {
      body: {
        email: 'coord@test.com',
        rol: 'csm',
        hospital: 'h1',
        tipo: 'Programa Residentes'
      },
      user: { _id: 'admin', id: 'admin' },
      ip: '::1'
    };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await inviteUser(req, res, jest.fn());

    expect(logSpy).toHaveBeenCalled();
    expect(sendEmail).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: updated });

    logSpy.mockRestore();
  });
});
