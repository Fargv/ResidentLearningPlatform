const ErrorResponse = require('../utils/errorResponse');
const Adjunto = require('../models/Adjunto');
const ProgresoResidente = require('../models/ProgresoResidente');
const { createAuditLog } = require('../utils/auditLog');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// @desc    Subir adjunto para un progreso
// @route   POST /api/adjuntos/:progresoId
// @access  Private
exports.subirAdjunto = async (req, res, next) => {
  try {
    const progreso = await ProgresoResidente.findById(req.params.progresoId)
      .populate('residente')
      .populate('actividad');

    if (!progreso) {
      return next(new ErrorResponse(`Progreso no encontrado con id ${req.params.progresoId}`, 404));
    }

    // Verificar permisos: solo el propio residente, formadores de su hospital o administradores
    if (
      req.user.rol !== 'administrador' && 
      req.user.id !== progreso.residente._id.toString() && 
      (req.user.rol !== 'formador' || req.user.hospital.toString() !== progreso.residente.hospital.toString())
    ) {
      return next(new ErrorResponse('No autorizado para subir adjuntos a este progreso', 403));
    }

    // Verificar que se ha subido un archivo
    if (!req.files || Object.keys(req.files).length === 0) {
      return next(new ErrorResponse('Por favor suba un archivo', 400));
    }

    const file = req.files.file;

    // Verificar tipo de archivo
    const fileTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|ppt|pptx|txt/;
    const extname = fileTypes.test(path.extname(file.name).toLowerCase());
    
    if (!extname) {
      return next(new ErrorResponse('Por favor suba un archivo válido', 400));
    }

    // Crear nombre de archivo único
    const fileName = `${crypto.randomBytes(10).toString('hex')}_${file.name}`;
    
    // Directorio de almacenamiento
    const uploadDir = path.join(__dirname, '../../public/uploads');
    
    // Crear directorio si no existe
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    // Ruta completa del archivo
    const filePath = `${uploadDir}/${fileName}`;
    
    // Mover archivo
    file.mv(filePath, async err => {
      if (err) {
        console.error(err);
        return next(new ErrorResponse('Problema al subir el archivo', 500));
      }

      // Determinar tipo de archivo
      let tipoArchivo = 'otro';
      const ext = path.extname(file.name).toLowerCase();
      
      if (ext === '.pdf') {
        tipoArchivo = 'documento';
      } else if (['.jpg', '.jpeg', '.png', '.gif'].includes(ext)) {
        tipoArchivo = 'imagen';
      } else if (['.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt'].includes(ext)) {
        tipoArchivo = 'documento';
      }

      // Crear registro de adjunto
      const adjunto = await Adjunto.create({
        progreso: progreso._id,
        nombreArchivo: file.name,
        rutaArchivo: `/uploads/${fileName}`,
        tipoArchivo,
        contieneDatosSensibles: req.body.contieneDatosSensibles === 'true'
      });

      // Si contiene datos sensibles, marcar como cifrado (en un entorno real, aquí se cifraría el archivo)
      if (req.body.contieneDatosSensibles === 'true') {
        await adjunto.marcarComoCifrado();
      }

      // Crear registro de auditoría
      await createAuditLog({
        usuario: req.user._id,
        accion: 'subir_adjunto',
        descripcion: `Adjunto subido para progreso ${progreso._id}`,
        ip: req.ip
      });

      res.status(200).json({
        success: true,
        data: adjunto
      });
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Obtener adjuntos de un progreso
// @route   GET /api/adjuntos/progreso/:progresoId
// @access  Private
exports.getAdjuntosProgreso = async (req, res, next) => {
  try {
    const progreso = await ProgresoResidente.findById(req.params.progresoId)
      .populate('residente');

    if (!progreso) {
      return next(new ErrorResponse(`Progreso no encontrado con id ${req.params.progresoId}`, 404));
    }

    // Verificar permisos: solo el propio residente, formadores de su hospital o administradores
    if (
      req.user.rol !== 'administrador' && 
      req.user.id !== progreso.residente._id.toString() && 
      (req.user.rol !== 'formador' || req.user.hospital.toString() !== progreso.residente.hospital.toString())
    ) {
      return next(new ErrorResponse('No autorizado para ver adjuntos de este progreso', 403));
    }

    const adjuntos = await Adjunto.find({ progreso: req.params.progresoId });

    res.status(200).json({
      success: true,
      count: adjuntos.length,
      data: adjuntos
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Eliminar un adjunto
// @route   DELETE /api/adjuntos/:id
// @access  Private
exports.eliminarAdjunto = async (req, res, next) => {
  try {
    const adjunto = await Adjunto.findById(req.params.id);

    if (!adjunto) {
      return next(new ErrorResponse(`Adjunto no encontrado con id ${req.params.id}`, 404));
    }

    const progreso = await ProgresoResidente.findById(adjunto.progreso)
      .populate('residente');

    if (!progreso) {
      return next(new ErrorResponse('Progreso asociado no encontrado', 404));
    }

    // Verificar permisos: solo el propio residente, formadores de su hospital o administradores
    if (
      req.user.rol !== 'administrador' && 
      req.user.id !== progreso.residente._id.toString() && 
      (req.user.rol !== 'formador' || req.user.hospital.toString() !== progreso.residente.hospital.toString())
    ) {
      return next(new ErrorResponse('No autorizado para eliminar este adjunto', 403));
    }

    // Eliminar archivo físico
    const filePath = path.join(__dirname, '../../public', adjunto.rutaArchivo);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await adjunto.remove();

    // Crear registro de auditoría
    await createAuditLog({
      usuario: req.user._id,
      accion: 'eliminar_adjunto',
      descripcion: `Adjunto eliminado: ${adjunto.nombreArchivo}`,
      ip: req.ip
    });

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Descargar un adjunto
// @route   GET /api/adjuntos/:id/download
// @access  Private
exports.descargarAdjunto = async (req, res, next) => {
  try {
    const adjunto = await Adjunto.findById(req.params.id);

    if (!adjunto) {
      return next(new ErrorResponse(`Adjunto no encontrado con id ${req.params.id}`, 404));
    }

    const progreso = await ProgresoResidente.findById(adjunto.progreso)
      .populate('residente');

    if (!progreso) {
      return next(new ErrorResponse('Progreso asociado no encontrado', 404));
    }

    // Verificar permisos: solo el propio residente, formadores de su hospital o administradores
    if (
      req.user.rol !== 'administrador' && 
      req.user.id !== progreso.residente._id.toString() && 
      (req.user.rol !== 'formador' || req.user.hospital.toString() !== progreso.residente.hospital.toString())
    ) {
      return next(new ErrorResponse('No autorizado para descargar este adjunto', 403));
    }

    const filePath = path.join(__dirname, '../../public', adjunto.rutaArchivo);
    
    if (!fs.existsSync(filePath)) {
      return next(new ErrorResponse('Archivo no encontrado', 404));
    }

    // Crear registro de auditoría
    await createAuditLog({
      usuario: req.user._id,
      accion: 'descargar_adjunto',
      descripcion: `Adjunto descargado: ${adjunto.nombreArchivo}`,
      ip: req.ip
    });

    res.download(filePath, adjunto.nombreArchivo);
  } catch (err) {
    next(err);
  }
};
