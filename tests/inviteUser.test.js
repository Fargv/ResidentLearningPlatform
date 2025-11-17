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

describe('inviteUser', () => {
  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  test('crea invitación y envía email', async () => {
    jest.spyOn(User, 'findOne').mockResolvedValue(null);
    jest.spyOn(Invitacion, 'findOne').mockResolvedValue(null);
    jest.spyOn(Hospital, 'findById').mockResolvedValue({ _id: 'h1' });
    const accessCode = { codigo: 'ABC123', rol: 'residente', tipo: 'Programa Residentes' };
    const accessSpy = jest.spyOn(AccessCode, 'findOne').mockResolvedValue(accessCode);
    const created = { _id: 'i1', email: 'new@test.com' };
    jest.spyOn(Invitacion, 'findOneAndUpdate').mockResolvedValue(created);
    sendEmail.mockResolvedValue();

    const req = {
      body: {
        email: 'new@test.com',
        rol: 'residente',
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
      expect.objectContaining({ tipo: 'Programa Residentes' })
    );
    expect(accessSpy).toHaveBeenCalledWith({ rol: 'residente', tipo: 'Programa Residentes' });
    expect(sendEmail).toHaveBeenCalled();
    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining('Código de acceso: ABC123'),
        html: expect.stringContaining('ABC123')
      })
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: created });
  });

  test('reenvía invitación pendiente actualizando token', async () => {
    jest.spyOn(User, 'findOne').mockResolvedValue(null);
    const existingInvitation = {
      _id: 'inv1',
      email: 'repeat@test.com',
      estado: 'pendiente',
      hospital: 'h1',
      sociedad: 's1'
    };
    jest.spyOn(Invitacion, 'findOne').mockResolvedValue(existingInvitation);
    jest.spyOn(Hospital, 'findById').mockResolvedValue({ _id: 'h1' });
    jest.spyOn(AccessCode, 'findOne').mockResolvedValue({ codigo: 'CODE123', rol: 'residente', tipo: 'Programa Residentes' });
    const updatedInvitation = { _id: 'inv1', email: 'repeat@test.com' };
    const updateSpy = jest
      .spyOn(Invitacion, 'findOneAndUpdate')
      .mockResolvedValue(updatedInvitation);
    sendEmail.mockResolvedValue();

    const req = {
      body: {
        email: 'repeat@test.com',
        rol: 'residente',
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
      expect.objectContaining({ $set: expect.objectContaining({ email: 'repeat@test.com' }) }),
      expect.objectContaining({ upsert: true })
    );
    expect(sendEmail).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: updatedInvitation });
  });

  test('registra log y reenvía si el usuario existe', async () => {
    const logSpy = jest.spyOn(console, 'info').mockImplementation(() => {});
    jest.spyOn(User, 'findOne').mockResolvedValue({ _id: 'user1' });
    jest.spyOn(Invitacion, 'findOne').mockResolvedValue(null);
    jest.spyOn(Hospital, 'findById').mockResolvedValue({ _id: 'h1' });
    jest.spyOn(AccessCode, 'findOne').mockResolvedValue({ codigo: 'CODE999', rol: 'residente', tipo: 'Programa Residentes' });
    const updatedInvitation = { _id: 'inv-log', email: 'exists@test.com' };
    jest.spyOn(Invitacion, 'findOneAndUpdate').mockResolvedValue(updatedInvitation);
    sendEmail.mockResolvedValue();

    const req = {
      body: {
        email: 'exists@test.com',
        rol: 'residente',
        hospital: 'h1',
        tipo: 'Programa Residentes'
      },
      user: { _id: 'admin', id: 'admin' },
      ip: '::1'
    };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await inviteUser(req, res, jest.fn());

    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('El email exists@test.com pertenece a un usuario existente')
    );
    expect(sendEmail).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: updatedInvitation });

    logSpy.mockRestore();
  });

  test('retorna error si no hay código configurado', async () => {
    jest.spyOn(User, 'findOne').mockResolvedValue(null);
    jest.spyOn(Invitacion, 'findOne').mockResolvedValue(null);
    jest.spyOn(Hospital, 'findById').mockResolvedValue({ _id: 'h1' });
    jest.spyOn(AccessCode, 'findOne').mockResolvedValue(null);
    const next = jest.fn();

    const req = {
      body: {
        email: 'new@test.com',
        rol: 'residente',
        hospital: 'h1',
        tipo: 'Programa Residentes'
      },
      protocol: 'http',
      get: () => 'localhost',
      user: { _id: 'admin', id: 'admin' },
      ip: '::1'
    };

    await inviteUser(req, {}, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        message: 'Falta configurar el código de acceso para el rol residente'
      })
    );
  });
});
