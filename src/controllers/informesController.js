// src/controllers/informesController.js
const path = require('path');
const fs = require('fs');
const ExcelJS = require('exceljs');
const { Parser } = require('@json2csv/plainjs');

const User = require('../models/User');
const Fase = require('../models/Fase');
const FaseSoc = require('../models/FaseSoc');
const ProgresoResidente = require('../models/ProgresoResidente');

/**
 * Exporta usuarios en CSV o XLSX.
 * GET /informes/usuarios?format=csv|xlsx
 */
exports.exportarUsuarios = async (req, res, next) => {
  try {
    const usuarios = await User.find().lean();

    // Campos dinámicos según el primer documento (si lo hay)
    const fields = usuarios.length > 0 ? Object.keys(usuarios[0]) : [];

    // Filas para Excel (normalizando fechas y objetos)
    const rows = usuarios.map((usuario) =>
      fields.map((field) => {
        const value = usuario[field];
        if (value instanceof Date) return value.toISOString();
        if (typeof value === 'object' && value !== null) {
          return JSON.stringify(value);
        }
        return value;
      }),
    );

    const uploadDir = path.join(__dirname, '../../public/uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    const timestamp = Date.now();
    let filePath;
    let fileName;

    if (req.query.format === 'csv') {
      // CSV
      const parser = new Parser({ fields });
      const csv = parser.parse(usuarios);
      fileName = `Usuarios_${timestamp}.csv`;
      filePath = path.join(uploadDir, fileName);
      fs.writeFileSync(filePath, csv);
      res.set('Content-Type', 'text/csv');
    } else {
      // XLSX (por defecto)
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Usuarios');

      worksheet.addTable({
        name: 'Usuarios',
        ref: 'A1',
        headerRow: true,
        style: { theme: 'TableStyleMedium2', showRowStripes: true },
        columns: fields.map((f) => ({ name: f })),
        rows,
      });

      fileName = `Usuarios_${timestamp}.xlsx`;
      filePath = path.join(uploadDir, fileName);
      await workbook.xlsx.writeFile(filePath);

      res.set(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
    }

    res.download(filePath, fileName, (err) => {
      // Limpieza del temporal, ocurra o no error de envío
      fs.unlink(filePath, (unlinkErr) => {
        if (unlinkErr) {
          console.error('Error eliminando informe temporal', unlinkErr);
        }
      });
      if (err) next(err);
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Exporta listado de Actividades por Fase (para residentes) en XLSX.
 * GET /informes/actividades-residentes
 */
exports.exportarActividadesResidentes = async (req, res, next) => {
  try {
    // Cargamos todas las fases con sus actividades
    const fases = await Fase.find().populate('actividades').lean();

    // Construimos filas: [Fase, Actividad]
    const rows = [];
    (fases || []).forEach((fase) => {
      const faseLabel = `${fase.numero} - ${fase.nombre}`;
      const acts = Array.isArray(fase.actividades) ? fase.actividades : [];
      if (acts.length === 0) {
        // Si una fase no tiene actividades, aún así registramos la fase con celda vacía de actividad
        rows.push([faseLabel, '']);
      } else {
        acts.forEach((act) => {
          rows.push([faseLabel, act?.nombre ?? '']);
        });
      }
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Actividades');

    worksheet.addTable({
      name: 'Actividades',
      ref: 'A1',
      headerRow: true,
      style: { theme: 'TableStyleMedium2', showRowStripes: true },
      columns: [{ name: 'Fase' }, { name: 'Actividad' }],
      rows,
    });

    // Auto-ajuste de anchos aproximado
    worksheet.getColumn(1).width = 40;
    worksheet.getColumn(2).width = 50;

    const uploadDir = path.join(__dirname, '../../public/uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    const timestamp = Date.now();
    const fileName = `ActividadesResidentes_${timestamp}.xlsx`;
    const filePath = path.join(uploadDir, fileName);

    await workbook.xlsx.writeFile(filePath);

    res.set(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );

    // Enviamos como descarga y limpiamos el archivo temporal
    res.download(filePath, fileName, (err) => {
      fs.unlink(filePath, (unlinkErr) => {
        if (unlinkErr) {
          console.error('Error eliminando informe temporal', unlinkErr);
        }
      });
      if (err) next(err);
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Exporta actividades del Programa Sociedades (CSV o XLSX).
 * GET /informes/actividades-sociedades?format=csv|xlsx
 */
exports.exportarActividadesSociedades = async (req, res, next) => {
  try {
    const { format } = req.query;
    const fases = await FaseSoc.find().populate('actividades').lean();

    // Construcción de filas con orden por fase.numero y act.orden
    const rows = [];
    (fases || [])
      .sort((a, b) => (a?.numero ?? 0) - (b?.numero ?? 0))
      .forEach((fase) => {
        const acts = Array.isArray(fase.actividades) ? fase.actividades : [];
        acts
          .sort((a, b) => (a?.orden ?? 0) - (b?.orden ?? 0))
          .forEach((act) => {
            rows.push({
              faseNumero: fase.numero,
              faseNombre: fase.nombre,
              faseDescripcion: fase.descripcion,
              actividadNombre: act?.nombre ?? '',
              actividadDescripcion: act?.descripcion ?? '',
              actividadTipo: act?.tipo ?? '',
              orden: act?.orden ?? '',
              requiereValidacion: !!act?.requiereValidacion,
              requiereFirma: !!act?.requiereFirma,
              requierePorcentaje: !!act?.requierePorcentaje,
              requiereAdjunto: !!act?.requiereAdjunto,
            });
          });
      });

    const timestamp = Date.now();
    const fileBaseName = `ActividadesSociedades_${timestamp}`;

    if (format === 'csv') {
      const headers = [
        'faseNumero',
        'faseNombre',
        'faseDescripcion',
        'actividadNombre',
        'actividadDescripcion',
        'actividadTipo',
        'orden',
        'requiereValidacion',
        'requiereFirma',
        'requierePorcentaje',
        'requiereAdjunto',
      ];

      // CSV seguro con comillas escapadas
      const csvRows = [headers.join(',')];
      rows.forEach((row) => {
        csvRows.push(
          headers
            .map((h) => {
              const val = row[h];
              if (val === undefined || val === null) return '';
              const str = String(val).replace(/"/g, '""');
              return `"${str}"`;
            })
            .join(','),
        );
      });
      const csv = csvRows.join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${fileBaseName}.csv"`,
      );
      return res.send(csv);
    }

    // XLSX
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Actividades');

    worksheet.columns = [
      { header: 'Número de fase', key: 'faseNumero' },
      { header: 'Nombre de fase', key: 'faseNombre' },
      { header: 'Descripción de fase', key: 'faseDescripcion' },
      { header: 'Nombre de actividad', key: 'actividadNombre' },
      { header: 'Descripción de actividad', key: 'actividadDescripcion' },
      { header: 'Tipo de actividad', key: 'actividadTipo' },
      { header: 'Orden', key: 'orden' },
      { header: 'Requiere validación', key: 'requiereValidacion' },
      { header: 'Requiere firma', key: 'requiereFirma' },
      { header: 'Requiere porcentaje', key: 'requierePorcentaje' },
      { header: 'Requiere adjunto', key: 'requiereAdjunto' },
    ];
    worksheet.addRows(rows);

    // Anchos aproximados
    worksheet.columns.forEach((col) => {
      col.width = Math.min(Math.max(15, (col.header || '').length + 5), 40);
    });

    const buffer = await workbook.xlsx.writeBuffer();
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${fileBaseName}.xlsx"`,
    );
    res.send(Buffer.from(buffer));
  } catch (err) {
    next(err);
  }
};

/**
 * Exporta el progreso detallado de usuarios (CSV o XLSX).
 * GET /informes/progreso-usuarios?formato=csv|xlsx
 */
exports.exportarProgresoUsuarios = async (req, res, next) => {
  try {
    const formato = (req.query.formato || 'xlsx').toLowerCase();
    const progresos = await ProgresoResidente.find()
      .populate('residente fase')
      .lean();

    const rows = [];
    (progresos || []).forEach((prog) => {
      const usuario = prog.residente || {};
      const fase = prog.fase || {};
      (prog.actividades || []).forEach((act) => {
        rows.push({
          usuarioId: usuario._id ? String(usuario._id) : '',
          nombre: usuario.nombre || '',
          apellidos: usuario.apellidos || '',
          faseNumero: fase.numero || '',
          faseNombre: fase.nombre || '',
          actividadNombre: act.nombre || '',
          actividadTipo: act.tipo || '',
          estado: act.estado || '',
          comentariosTutor: act.comentariosTutor || '',
          comentariosResidente: act.comentariosResidente || '',
          cirugia: act.cirugia || act.otraCirugia || '',
          nombreCirujano: act.nombreCirujano || '',
          porcentajeParticipacion: act.porcentajeParticipacion ?? '',
        });
      });
    });

    const timestamp = Date.now();
    const ext = formato === 'csv' ? 'csv' : 'xlsx';
    const fileName = `ProgresoUsuarios_${timestamp}.${ext}`;
    const uploadDir = path.join(__dirname, '../../public/uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    const filePath = path.join(uploadDir, fileName);

    const headers = [
      { key: 'usuarioId', header: 'Usuario ID' },
      { key: 'nombre', header: 'Nombre' },
      { key: 'apellidos', header: 'Apellidos' },
      { key: 'faseNumero', header: 'Número Fase' },
      { key: 'faseNombre', header: 'Nombre Fase' },
      { key: 'actividadNombre', header: 'Actividad' },
      { key: 'actividadTipo', header: 'Tipo Actividad' },
      { key: 'estado', header: 'Estado' },
      { key: 'comentariosTutor', header: 'Comentarios Tutor' },
      { key: 'comentariosResidente', header: 'Comentarios Residente' },
      { key: 'cirugia', header: 'Cirugía' },
      { key: 'nombreCirujano', header: 'Nombre Cirujano' },
      { key: 'porcentajeParticipacion', header: '% Participación' },
    ];

    if (formato === 'csv') {
      const csvLines = [];
      csvLines.push(headers.map((h) => h.header).join(','));
      rows.forEach((row) => {
        const line = headers
          .map((h) => {
            const val = row[h.key];
            if (val === undefined || val === null) return '';
            const str = String(val).replace(/"/g, '""');
            return `"${str}"`;
          })
          .join(',');
        csvLines.push(line);
      });
      fs.writeFileSync(filePath, csvLines.join('\n'), 'utf8');
    } else {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Progreso');
      worksheet.columns = headers;
      rows.forEach((r) => worksheet.addRow(r));
      await workbook.xlsx.writeFile(filePath);
    }

    res.set(
      'Content-Type',
      formato === 'csv'
        ? 'text/csv'
        : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.download(filePath, fileName, (err) => {
      fs.unlink(filePath, (unlinkErr) => {
        if (unlinkErr) console.error('Error eliminando informe temporal', unlinkErr);
      });
      if (err) next(err);
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  exportarUsuarios,
  exportarActividadesResidentes,
  exportarActividadesSociedades,
  exportarProgresoUsuarios,
};
