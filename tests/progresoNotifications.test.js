const { validarProgreso, rechazarActividad, registrarProgreso } = require('../src/controllers/progresoController');
const ProgresoResidente = require('../src/models/ProgresoResidente');
const Validacion = require('../src/models/Validacion');
const User = require('../src/models/User');
const Notificacion = require('../src/models/Notificacion');
const Actividad = require('../src/models/Actividad');
const { createAuditLog } = require('../src/utils/auditLog');

jest.mock('../src/utils/auditLog', () => ({ createAuditLog: jest.fn() }));

describe('progresoController notifications', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('validarProgreso marca notificaciones como leidas', async () => {
    const progreso = {
      _id: 'p1',
      residente: { _id: 'res1', hospital: 'h1', sociedad: 's1', email: 'r@test.com' },
      actividad: { nombre: 'Act' },
      estado: 'pendiente',
      save: jest.fn().mockResolvedValue()
    };
    const populate = jest
      .fn()
      .mockImplementationOnce(() => ({ populate }))
      .mockResolvedValueOnce(progreso);
    jest.spyOn(ProgresoResidente, 'findById').mockReturnValue({ populate });

    jest.spyOn(Validacion, 'create').mockResolvedValue({
      _id: 'v1',
      registrarAuditoria: jest.fn().mockResolvedValue()
    });
    const valPopulate = jest
      .fn()
      .mockImplementationOnce(() => ({ populate: valPopulate }))
      .mockResolvedValueOnce({});
    jest.spyOn(Validacion, 'findById').mockReturnValue({ populate: valPopulate });
    jest
      .spyOn(User, 'find')
      .mockResolvedValueOnce([{ _id: 't1' }])
      .mockResolvedValueOnce([{ _id: 'pr1' }]);
    const updateSpy = jest.spyOn(Notificacion, 'updateMany').mockResolvedValue();
    jest.spyOn(Notificacion, 'create').mockResolvedValue({});

    const req = {
      params: { id: 'p1' },
      user: { rol: 'tutor', hospital: 'h1', _id: 't1', nombre: 'F', apellidos: 'L' },
      body: { comentarios: 'ok', firmaDigital: 'sig' },
      ip: '::1',
      headers: { 'user-agent': 'jest' }
    };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await validarProgreso(req, res, jest.fn());

    expect(updateSpy).toHaveBeenCalledWith(
      {
        usuario: { $in: ['t1', 'pr1'] },
        'entidadRelacionada.tipo': 'progreso',
        'entidadRelacionada.id': 'p1'
      },
      { leida: true }
    );
  });

  test('rechazarActividad marca notificaciones como leidas', async () => {
    const progreso = {
      _id: 'p2',
      residente: { _id: 'res1', hospital: 'h1', sociedad: 's1' },
      actividades: [
        { estado: 'completado', actividad: { nombre: 'Act' } }
      ],
      save: jest.fn().mockResolvedValue(),
      populate: jest.fn().mockResolvedValue()
    };
    jest
      .spyOn(ProgresoResidente, 'findById')
      .mockReturnValue({ populate: jest.fn().mockResolvedValue(progreso) });
    jest
      .spyOn(User, 'find')
      .mockResolvedValueOnce([{ _id: 't1' }])
      .mockResolvedValueOnce([{ _id: 'pr1' }]);
    const updateSpy = jest.spyOn(Notificacion, 'updateMany').mockResolvedValue();
    jest.spyOn(Notificacion, 'create').mockResolvedValue({});

    const req = {
      params: { id: 'p2', index: '0' },
      body: { comentarios: 'no' }
    };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await rechazarActividad(req, res, jest.fn());

    expect(updateSpy).toHaveBeenCalledWith(
      {
        usuario: { $in: ['t1', 'pr1'] },
        'entidadRelacionada.tipo': 'progreso',
        'entidadRelacionada.id': 'p2'
      },
      { leida: true }
    );
  });
  test('registrarProgreso crea notificaciones de validacion', async () => {
    jest.spyOn(Actividad, 'findById').mockResolvedValue({
      _id: 'a1',
      nombre: 'Act',
      requiereValidacion: true
    });
    jest.spyOn(User, 'findById').mockResolvedValue({
      _id: 'res1',
      rol: 'residente',
      hospital: 'h1',
      sociedad: 's1',
      nombre: 'Res',
      apellidos: 'Dent'
    });
    jest
      .spyOn(User, 'find')
      .mockResolvedValueOnce([{ _id: 't1' }])
      .mockResolvedValueOnce([{ _id: 'pr1' }]);
    jest.spyOn(ProgresoResidente, 'create').mockResolvedValue({ _id: 'p1' });
    const populate = jest.fn();
    populate
      .mockImplementationOnce(() => ({ populate }))
      .mockImplementationOnce(() => ({ populate }))
      .mockResolvedValueOnce({});
    jest.spyOn(ProgresoResidente, 'findById').mockReturnValue({ populate });
    const createSpy = jest
      .spyOn(Notificacion, 'create')
      .mockResolvedValue({});

    const req = {
      body: { residente: 'res1', actividad: 'a1' },
      user: { rol: 'residente', id: 'res1', _id: 'res1' },
      ip: '::1'
    };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await registrarProgreso(req, res, jest.fn());

    expect(createSpy).toHaveBeenCalledTimes(2);
    expect(createSpy).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        usuario: 't1',
        tipo: 'validacion',
        enlace: '/dashboard/validaciones'
      })
    );
    expect(createSpy).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        usuario: 'pr1',
        tipo: 'validacion',
        enlace: '/dashboard/validaciones'
      })
    );
  });
});
