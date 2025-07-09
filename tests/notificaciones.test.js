const {
  getNotificacionesUsuario,
  marcarComoLeida,
  eliminarNotificacion
} = require('../src/controllers/notificacionController');
const Notificacion = require('../src/models/Notificacion');

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
});
