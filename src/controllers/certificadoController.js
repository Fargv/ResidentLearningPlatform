const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const ProgresoResidente = require('../models/ProgresoResidente');
const Adjunto = require('../models/Adjunto');

exports.descargarCertificado = async (req, res, next) => {
  try {
    const usuario = await User.findById(req.params.id).populate('hospital');
    if (!usuario) {
      return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    }

    if ((req.user.rol === 'residente' || req.user.rol === 'alumno') && req.user.id !== req.params.id) {
      return res.status(403).json({ success: false, error: 'No autorizado' });
    }

    const progresos = await ProgresoResidente.find({ residente: req.params.id }).sort({ createdAt: 1 });
    if (!progresos.every(p => p.estadoGeneral === 'validado')) {
      return res.status(400).json({ success: false, error: 'Existen fases sin validar' });
    }

    const uploadDir = path.join(__dirname, '../../public/uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    const fileName = `certificado_${usuario._id}_${Date.now()}.pdf`;
    const filePath = path.join(uploadDir, fileName);

    const doc = new PDFDocument();
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    doc.fontSize(20).text('Certificado de Finalización', { align: 'center' });
    doc.moveDown();
    doc.fontSize(14).text(`Nombre: ${usuario.nombre} ${usuario.apellidos}`);
    doc.text(`Hospital: ${usuario.hospital ? usuario.hospital.nombre : ''}`);
    doc.text(`Programa: ${usuario.tipo}`);
    doc.text(`Fecha de finalización: ${new Date().toLocaleDateString('es-ES')}`);
    doc.end();

    stream.on('finish', async () => {
      try {
        const ultimoProgreso = progresos[progresos.length - 1];
        await Adjunto.create({
          progreso: ultimoProgreso._id,
          nombreArchivo: fileName,
          rutaArchivo: `/uploads/${fileName}`,
          tipoArchivo: 'certificado'
        });
      } catch (e) {
        console.error('Error guardando certificado', e);
      }
      res.set('Content-Type', 'application/pdf');
      res.download(filePath, 'certificado.pdf');
    });
  } catch (err) {
    next(err);
  }
};
