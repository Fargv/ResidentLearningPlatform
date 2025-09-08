const {
  getNotificacionesUsuario,
  marcarComoLeida,
  eliminarNotificacion,
  crearNotificacion
} = require('../src/controllers/notificacionController');
const Notificacion = require('../src/models/Notificacion');
const { requestPasswordReset } = require('../src/controllers/authController');
const User = require('../src/models/User');
const { Role } = require('../src/utils/roles');

describe('notificacionController', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('getNotificacionesUsuario obtiene notificaciones del usuario', async () => {
    const list = [{ _id: 'n1' }, { _id: 'n2' }];
    const sort = jest.fn().mockResolvedValue(list);
    jest.spyOn(Notificacion, 'find').mockReturnValue({ sort });

    const req = { user: { id: 'u1' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await getNotificacionesUsuario(req, res, jest.fn());

    expect(Notificacion.find).toHaveBeenCalledWith({ usuario: 'u1' });
    expect(sort).toHaveBeenCalledWith('-fechaCreacion');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, count: 2, data: list });
  });

  test('marcarComoLeida marca la notificacion y la devuelve', async () => {
    const notif = { usuario: 'u1', marcarComoLeida: jest.fn().mockResolvedValue() };
    const updated = { _id: 'n1', usuario: 'u1', leida: true };

    const findSpy = jest
      .spyOn(Notificacion, 'findById')
      .mockResolvedValueOnce(notif)
      .mockResolvedValueOnce(updated);

    const req = { params: { id: 'n1' }, user: { id: 'u1' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await marcarComoLeida(req, res, jest.fn());

    expect(findSpy).toHaveBeenCalledWith('n1');
    expect(notif.marcarComoLeida).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: updated });
  });

  test('eliminarNotificacion borra la notificacion del usuario', async () => {
    const notif = { usuario: 'u1', remove: jest.fn().mockResolvedValue() };
    jest.spyOn(Notificacion, 'findById').mockResolvedValue(notif);

    const req = { params: { id: 'n1' }, user: { id: 'u1' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await eliminarNotificacion(req, res, jest.fn());

    expect(Notificacion.findById).toHaveBeenCalledWith('n1');
    expect(notif.remove).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: {} });
  });

  test('crearNotificacion acepta tipo passwordReset', async () => {
    const datos = { usuario: 'u1', tipo: 'passwordReset', mensaje: 'Reset' };
    jest.spyOn(Notificacion, 'create').mockResolvedValue(datos);

    const res = await crearNotificacion(datos);

    expect(Notificacion.create).toHaveBeenCalledWith(datos);
    expect(res).toEqual(datos);
  });

  test('requestPasswordReset incluye nombre y email en la notificación', async () => {
    const user = { _id: 'u1', email: 'user@test.com', nombre: 'User', tutor: null, hospital: null };
    jest
      .spyOn(User, 'findOne')
      .mockReturnValue({ populate: jest.fn().mockResolvedValue(user) });

    jest.spyOn(User, 'find').mockImplementation((query) => {
      if (query.rol === Role.ADMINISTRADOR) {
        return { select: jest.fn().mockResolvedValue([{ _id: 'admin1' }]) };
      }
      return { select: jest.fn().mockResolvedValue([]) };
    });

    const insertSpy = jest.spyOn(Notificacion, 'insertMany').mockResolvedValue();

    const req = { body: { email: 'user@test.com' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    await requestPasswordReset(req, res, next);

    expect(insertSpy).toHaveBeenCalledWith([
      {
        usuario: 'admin1',
        tipo: 'passwordReset',
        mensaje: 'User (user@test.com) ha solicitado un reseteo de contraseña.',
        entidadRelacionada: { tipo: 'usuario', id: 'u1' }
      }
    ]);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true });
  });
});
