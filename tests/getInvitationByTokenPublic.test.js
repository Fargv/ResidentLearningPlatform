const { getInvitationByTokenPublic } = require('../src/controllers/userController');
const Invitacion = require('../src/models/Invitacion');
const AccessCode = require('../src/models/AccessCode');
const ErrorResponse = require('../src/utils/errorResponse');

describe('getInvitationByTokenPublic', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  test('devuelve información de la invitación válida', async () => {
    const invitation = {
      email: 'user@test.com',
      rol: 'residente',
      tipo: 'Programa Residentes',
      estado: 'pendiente',
      haExpirado: jest.fn().mockReturnValue(false),
      hospital: { _id: 'h1', nombre: 'Hospital 1', zona: 'NORTE' },
      sociedad: null
    };

    const execMock = jest.fn().mockResolvedValue(invitation);
    const populateMock = jest.fn().mockReturnValue({ exec: execMock });
    jest.spyOn(Invitacion, 'findOne').mockReturnValue({ populate: populateMock });
    const accessCode = { codigo: 'ABC123', rol: 'residente', tipo: 'Programa Residentes' };
    const accessSpy = jest.spyOn(AccessCode, 'findOne').mockResolvedValue(accessCode);

    const req = { params: { token: 'token123' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await getInvitationByTokenPublic(req, res, jest.fn());

    expect(Invitacion.findOne).toHaveBeenCalledWith({ token: 'token123', estado: 'pendiente' });
    expect(populateMock).toHaveBeenCalledWith([
      { path: 'hospital', select: 'nombre zona' },
      { path: 'sociedad', select: 'titulo status' }
    ]);
    expect(accessSpy).toHaveBeenCalledWith({ rol: 'residente', tipo: 'Programa Residentes' });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: expect.objectContaining({
        email: 'user@test.com',
        rol: 'residente',
        tipo: 'Programa Residentes',
        codigoAcceso: 'ABC123',
        hospital: { _id: 'h1', nombre: 'Hospital 1' },
        zona: 'NORTE'
      })
    });
  });

  test('usa la zona de la invitación cuando no hay hospital', async () => {
    const invitation = {
      email: 'coord@test.com',
      rol: 'csm',
      tipo: 'Programa Residentes',
      estado: 'pendiente',
      haExpirado: jest.fn().mockReturnValue(false),
      hospital: null,
      sociedad: null,
      zona: 'CANARIAS'
    };

    const execMock = jest.fn().mockResolvedValue(invitation);
    const populateMock = jest.fn().mockReturnValue({ exec: execMock });
    jest.spyOn(Invitacion, 'findOne').mockReturnValue({ populate: populateMock });
    jest
      .spyOn(AccessCode, 'findOne')
      .mockResolvedValue({ codigo: 'CSM123', rol: 'csm', tipo: 'Programa Residentes' });

    const req = { params: { token: 'token-zone' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await getInvitationByTokenPublic(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: expect.objectContaining({ zona: 'CANARIAS' })
    });
  });

  test('lanza error cuando la invitación no existe', async () => {
    const execMock = jest.fn().mockResolvedValue(null);
    const populateMock = jest.fn().mockReturnValue({ exec: execMock });
    jest.spyOn(Invitacion, 'findOne').mockReturnValue({ populate: populateMock });

    const req = { params: { token: 'missing' } };
    const next = jest.fn();

    await getInvitationByTokenPublic(req, {}, next);

    expect(next).toHaveBeenCalledWith(expect.any(ErrorResponse));
    expect(next.mock.calls[0][0]).toMatchObject({ statusCode: 404 });
  });

  test('marca como expirada y devuelve error cuando la invitación está caducada', async () => {
    const invitation = {
      email: 'user@test.com',
      rol: 'residente',
      tipo: 'Programa Residentes',
      estado: 'pendiente',
      haExpirado: jest.fn().mockReturnValue(true),
      marcarComoExpirada: jest.fn().mockResolvedValue(),
      hospital: null,
      sociedad: null
    };

    const execMock = jest.fn().mockResolvedValue(invitation);
    const populateMock = jest.fn().mockReturnValue({ exec: execMock });
    jest.spyOn(Invitacion, 'findOne').mockReturnValue({ populate: populateMock });

    const req = { params: { token: 'expired' } };
    const next = jest.fn();

    await getInvitationByTokenPublic(req, {}, next);

    expect(invitation.marcarComoExpirada).toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(expect.any(ErrorResponse));
    expect(next.mock.calls[0][0]).toMatchObject({ statusCode: 410 });
  });
});
