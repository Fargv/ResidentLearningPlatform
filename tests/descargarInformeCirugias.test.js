const { descargarInformeCirugias } = require('../src/controllers/informeCirugiasController');
const ProgresoResidente = require('../src/models/ProgresoResidente');
const fs = require('fs');

describe('descargarInformeCirugias', () => {
  beforeEach(() => {
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    jest.spyOn(fs, 'mkdirSync').mockImplementation(() => {});
    jest.spyOn(fs, 'unlink').mockImplementation((path, cb) => cb());
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('returns 400 when phase not validated', async () => {
    const progreso = {
      _id: 'p1',
      estadoGeneral: 'en progreso',
      residente: {
        _id: 'u1',
        tipo: 'Programa Sociedades',
        hospital: { _id: 'h1', zona: 'NORTE' },
        especialidad: 'URO',
      },
      actividades: [],
      fase: { nombre: 'F1' },
    };
    const query = {
      populate: jest.fn().mockReturnThis(),
      then: (resolve) => Promise.resolve(resolve(progreso)),
    };
    jest.spyOn(ProgresoResidente, 'findById').mockReturnValue(query);

    const req = { params: { id: 'p1' }, user: { id: 'u1', rol: 'residente' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await descargarInformeCirugias(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('creates excel when validated', async () => {
    const progreso = {
      _id: 'p1',
      estadoGeneral: 'validado',
      residente: {
        _id: 'u1',
        nombre: 'A',
        apellidos: 'B',
        tipo: 'Programa Sociedades',
        hospital: { _id: 'h1', zona: 'NORTE' },
        especialidad: 'URO',
      },
      actividades: [
        {
          tipo: 'cirugia',
          nombre: 'Act1',
          estado: 'validado',
          fechaRealizacion: new Date('2025-01-01'),
          cirugia: { name: 'Proc1' },
          nombreCirujano: 'Dr X',
          porcentajeParticipacion: 50,
          comentariosResidente: 'com',
        },
      ],
      fase: { nombre: 'F1' },
    };
    const query = {
      populate: jest.fn().mockReturnThis(),
      then: (resolve) => Promise.resolve(resolve(progreso)),
    };
    jest.spyOn(ProgresoResidente, 'findById').mockReturnValue(query);

    const req = { params: { id: 'p1' }, user: { id: 'u1', rol: 'residente' } };
    const res = {
      set: jest.fn(),
      download: jest.fn((path, name, cb) => cb()),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await descargarInformeCirugias(req, res, jest.fn());

    const ExcelJS = require('exceljs');
    expect(ExcelJS.Workbook).toHaveBeenCalled();
    const workbook = ExcelJS.Workbook.mock.results[0].value;
    expect(workbook.xlsx.writeFile).toHaveBeenCalled();
    expect(res.download).toHaveBeenCalled();
    expect(fs.unlink).toHaveBeenCalled();
  });
});
