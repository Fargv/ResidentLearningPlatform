jest.mock('html-pdf-node');

const { descargarCertificado } = require('../src/controllers/certificadoController');
const User = require('../src/models/User');
const ProgresoResidente = require('../src/models/ProgresoResidente');
const Adjunto = require('../src/models/Adjunto');
const pdf = require('html-pdf-node');
const fs = require('fs');

describe('descargarCertificado', () => {
  beforeEach(() => {
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    jest.spyOn(fs, 'mkdirSync').mockImplementation(() => {});
    jest.spyOn(fs, 'writeFileSync').mockImplementation(() => {});
    jest.spyOn(fs, 'readFileSync').mockReturnValue('<html></html>');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('returns 400 when phases not validated', async () => {
    jest.spyOn(User, 'findById').mockReturnValue({ populate: jest.fn().mockResolvedValue({ _id: 'u1' }) });
    jest.spyOn(ProgresoResidente, 'find').mockReturnValue({ sort: jest.fn().mockResolvedValue([{ estadoGeneral: 'en progreso' }]) });

    const req = { params: { id: 'u1' }, user: { id: 'u1', rol: 'residente' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await descargarCertificado(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('sends pdf when validated', async () => {
    jest.spyOn(User, 'findById').mockReturnValue({ populate: jest.fn().mockResolvedValue({ _id: 'u1', nombre: 'A', apellidos: 'B', tipo: 'Programa', hospital: { nombre: 'H' } }) });
    jest.spyOn(ProgresoResidente, 'find').mockReturnValue({ sort: jest.fn().mockResolvedValue([{ _id: 'p1', estadoGeneral: 'validado' }]) });
    jest.spyOn(Adjunto, 'create').mockResolvedValue({});

    const req = { params: { id: 'u1' }, user: { id: 'u1', rol: 'residente' } };
    const res = { set: jest.fn(), download: jest.fn() };

    await descargarCertificado(req, res, jest.fn());
    expect(pdf.generatePdf).toHaveBeenCalled();
    expect(res.set).toHaveBeenCalledWith('Content-Type', 'application/pdf');
    expect(res.download).toHaveBeenCalled();
  });
});
