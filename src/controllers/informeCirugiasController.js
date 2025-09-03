const path = require('path');
const fs = require('fs');
const ExcelJS = require('exceljs');
const ProgresoResidente = require('../models/ProgresoResidente');

exports.descargarInformeCirugias = async (req, res, next) => {
  try {
    const progreso = await ProgresoResidente.findById(req.params.id)
      .populate({
        path: 'residente',
        select: 'nombre apellidos tipo hospital sociedad especialidad',
        populate: { path: 'hospital', select: 'zona' },
      })
      .populate('fase')
      .populate('actividades.cirugia');

    if (!progreso) {
      return res
        .status(404)
        .json({ success: false, error: 'Progreso no encontrado' });
    }

    const usuario = progreso.residente;
    if (!usuario || usuario.tipo !== 'Programa Residentes') {
      return res.status(400).json({
        success: false,
        error: 'El usuario no pertenece al Programa Residentes',
      });
    }

    if (
      req.user.rol === 'residente' &&
      req.user.id !== usuario._id.toString()
    ) {
      return res.status(403).json({ success: false, error: 'No autorizado' });
    }

    if (req.user.rol === 'tutor') {
      if (
        req.user.hospital.toString() !== usuario.hospital._id.toString() ||
        (req.user.especialidad !== 'ALL' &&
          req.user.especialidad !== usuario.especialidad)
      ) {
        return res.status(403).json({ success: false, error: 'No autorizado' });
      }
    }

    if (
      req.user.rol === 'csm' &&
      req.user.zona !== usuario.hospital.zona
    ) {
      return res.status(403).json({ success: false, error: 'No autorizado' });
    }

    if (
      req.user.rol === 'profesor' &&
      (!usuario.sociedad ||
        req.user.sociedad.toString() !== usuario.sociedad.toString())
    ) {
      return res.status(403).json({ success: false, error: 'No autorizado' });
    }

    if (progreso.estadoGeneral !== 'validado') {
      return res.status(400).json({
        success: false,
        error: 'Fase sin validar',
      });
    }

    const cirugias = progreso.actividades.filter(
      (act) => act.tipo === 'cirugia'
    );

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Cirugias');

    const rows = cirugias.map((act) => [
      act.nombre,
      `${usuario.nombre} ${usuario.apellidos}`,
      act.estado,
      act.fechaRealizacion
        ? act.fechaRealizacion.toISOString().split('T')[0]
        : '',
      act.cirugia ? act.cirugia.name : act.otraCirugia || '',
      act.nombreCirujano || '',
      act.porcentajeParticipacion,
      act.comentariosResidente || '',
    ]);

    worksheet.addTable({
      name: 'Cirugias',
      ref: 'A1',
      headerRow: true,
      style: { theme: 'TableStyleMedium2', showRowStripes: true },
      columns: [
        { name: 'Título' },
        { name: 'Nombre del usuario' },
        { name: 'Estado' },
        { name: 'Fecha' },
        { name: 'Procedimiento' },
        { name: 'Cirujano' },
        { name: '% participación' },
        { name: 'Comentario' },
      ],
      rows,
    });

    const uploadDir = path.join(__dirname, '../../public/uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    const faseNombre = progreso.fase.nombre.replace(/\s+/g, '_');
    const nombreUsuario = `${usuario.nombre}_${usuario.apellidos}`.replace(/\s+/g, '_');
    const fileName = `Informe_Cirugias_Fase(${faseNombre})_${nombreUsuario}.xlsx`;
    const filePath = path.join(uploadDir, fileName);
    await workbook.xlsx.writeFile(filePath);

    res.set(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.download(filePath, fileName, (err) => {
      fs.unlink(filePath, (unlinkErr) => {
        if (unlinkErr)
          console.error('Error eliminando informe temporal', unlinkErr);
      });
      if (err) next(err);
    });
  } catch (err) {
    next(err);
  }
};
