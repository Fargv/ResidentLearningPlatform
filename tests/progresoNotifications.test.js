const { validarProgreso, rechazarActividad } = require('../src/controllers/progresoController');
const ProgresoResidente = require('../src/models/ProgresoResidente');
const Validacion = require('../src/models/Validacion');
const User = require('../src/models/User');
const Notificacion = require('../src/models/Notificacion');
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
      .mockResolvedValueOnce([{ _id: 'f1' }])
      .mockResolvedValueOnce([{ _id: 'i1' }]);
    const updateSpy = jest.spyOn(Notificacion, 'updateMany').mockResolvedValue();
    jest.spyOn(Notificacion, 'create').mockResolvedValue({});

    const req = {
      params: { id: 'p1' },
      user: { rol: 'formador', hospital: 'h1', _id: 'f1', nombre: 'F', apellidos: 'L' },
      body: { comentarios: 'ok', firmaDigital: 'sig' },
      ip: '::1',
      headers: { 'user-agent': 'jest' }
    };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await validarProgreso(req, res, jest.fn());

    expect(updateSpy).toHaveBeenCalledWith(
      {
        usuario: { $in: ['f1', 'i1'] },
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
      .mockResolvedValueOnce([{ _id: 'f1' }])
      .mockResolvedValueOnce([{ _id: 'i1' }]);
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
        usuario: { $in: ['f1', 'i1'] },
        'entidadRelacionada.tipo': 'progreso',
        'entidadRelacionada.id': 'p2'
      },
      { leida: true }
    );
  });
});
