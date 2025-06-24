const { crearSociedad, actualizarSociedad, eliminarSociedad } = require('../src/controllers/sociedadesController');
const Sociedades = require('../src/models/Sociedades');
const { authorize } = require('../src/middleware/auth');
const ErrorResponse = require('../src/utils/errorResponse');

describe('sociedadesController', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('crearSociedad crea una nueva sociedad', async () => {
    const nueva = { _id: 's1', titulo: 'Test' };
    const req = { body: { titulo: 'Test' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    jest.spyOn(Sociedades, 'create').mockResolvedValue(nueva);

    await crearSociedad(req, res);

    expect(Sociedades.create).toHaveBeenCalledWith(req.body);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(nueva);
  });

  test('actualizarSociedad actualiza la sociedad', async () => {
    const actualizada = { _id: 's1', titulo: 'Actualizada' };
    const req = { params: { id: 's1' }, body: { titulo: 'Actualizada' } };
    const res = { json: jest.fn() };

    jest.spyOn(Sociedades, 'findByIdAndUpdate').mockResolvedValue(actualizada);

    await actualizarSociedad(req, res);

    expect(Sociedades.findByIdAndUpdate).toHaveBeenCalledWith('s1', req.body, { new: true });
    expect(res.json).toHaveBeenCalledWith(actualizada);
  });

  test('eliminarSociedad elimina la sociedad', async () => {
    const req = { params: { id: 's1' } };
    const res = { json: jest.fn() };

    jest.spyOn(Sociedades, 'findByIdAndDelete').mockResolvedValue({});

    await eliminarSociedad(req, res);

    expect(Sociedades.findByIdAndDelete).toHaveBeenCalledWith('s1');
    expect(res.json).toHaveBeenCalledWith({ mensaje: 'Sociedad eliminada' });
  });
});

describe('authorization for sociedades', () => {
  test('bloquea a usuarios no administradores', () => {
    const esAdmin = authorize('administrador');
    const req = { user: { rol: 'residente' } };
    const next = jest.fn();

    esAdmin(req, {}, next);

    expect(next).toHaveBeenCalledWith(expect.any(ErrorResponse));
  });

  test('permite a administradores continuar', () => {
    const esAdmin = authorize('administrador');
    const req = { user: { rol: 'administrador' } };
    const next = jest.fn();

    esAdmin(req, {}, next);

    expect(next).toHaveBeenCalledWith();
  });
});
