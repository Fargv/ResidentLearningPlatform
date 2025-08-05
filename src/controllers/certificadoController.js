const pdf = require("html-pdf-node");
const path = require("path");
const fs = require("fs");
const User = require("../models/User");
const ProgresoResidente = require("../models/ProgresoResidente");

exports.descargarCertificado = async (req, res, next) => {
  try {
    const usuario = await User.findById(req.params.id).populate("hospital");
    if (!usuario) {
      return res
        .status(404)
        .json({ success: false, error: "Usuario no encontrado" });    }

    if (
      (req.user.rol === "residente" || req.user.rol === "alumno") &&
      req.user.id !== req.params.id
    ) {
      return res.status(403).json({ success: false, error: "No autorizado" });
    }

    const progresos = await ProgresoResidente.find({
      residente: req.params.id,
    }).sort({ createdAt: 1 });
    if (!progresos.every((p) => p.estadoGeneral === "validado")) {
      return res
        .status(400)
        .json({ success: false, error: "Existen fases sin validar" });
    }

    const lang = req.query.lang || "es";

    const uploadDir = path.join(__dirname, "../../public/uploads");
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    const fileName = `certificado_${usuario._id}_${Date.now()}.pdf`;
    const filePath = path.join(uploadDir, fileName);

    const templatePath = path.resolve(
      process.cwd(),
      "client/src/templates/certificado.html",
    );
    if (!fs.existsSync(templatePath)) {
      console.error(`Plantilla de certificado no encontrada: ${templatePath}`);
      return res
        .status(500)
        .json({ success: false, error: "Plantilla no encontrada" });
    }
    let html = fs.readFileSync(templatePath, "utf8");

    const signaturePath = path.resolve(
      process.cwd(),
      "client/public/firma-javier.png",
    );
    const signatureData = fs.readFileSync(signaturePath);
    const signatureBase64 = `data:image/png;base64,${signatureData.toString("base64")}`;

    let certificateStrings;
    try {
      const localePath = path.resolve(
        process.cwd(),
        `client/src/locales/${lang}.json`,
      );
      const localeData = JSON.parse(fs.readFileSync(localePath, "utf8"));
      certificateStrings = localeData.certificate;
    } catch (e) {
      const localeData = JSON.parse(
        fs.readFileSync(
          path.resolve(process.cwd(), "client/src/locales/es.json"),
          "utf8",
        ),
      );
      certificateStrings = localeData.certificate;
    }

    const programa =
      usuario.rol === "residente"
        ? "Programa Residentes"
        : usuario.rol === "alumno"
          ? "Programa Sociedades"
          : usuario.tipo;

    const corporateLogo = 'https://www.abexsl.es/images/logo.png';
    let logosHtml;
    if (programa === 'Programa Sociedades') {
      logosHtml = `<div class="logo-center"><img src="${corporateLogo}" alt="Logo" /></div>`;
    } else {
      const hospiLogo = usuario.hospital && usuario.hospital.urlHospiLogo
        ? `<img src="${usuario.hospital.urlHospiLogo}" alt="Logo Hospital" />`
        : '';
      logosHtml = `<div class="logos"><img src="${corporateLogo}" alt="Logo" />${hospiLogo}</div>`;
    }

    const formattedBody = certificateStrings.body
      .replace("{{name}}", `${usuario.nombre} ${usuario.apellidos}`)
      .replace("{{hospital}}", usuario.hospital ? usuario.hospital.nombre : "")
      .replace("{{date}}", new Date().toLocaleDateString(lang));

    html = html
      .replace("{{LOGOS}}", logosHtml)
      .replace("{{CERT_TITLE}}", certificateStrings.title)
      .replace("{{PROGRAMA}}", programa)
      .replace("{{CERT_BODY}}", formattedBody)
      .replace("{{CERT_FOOTER}}", certificateStrings.footer)
      .replace("{{LOGO_TOP}}", "https://www.abexsl.es/images/logo.png")
      .replace("{{SIGNATURE_LOGO}}", signatureBase64)
      .replace("{{LANG}}", lang);

    const pdfBuffer = await pdf.generatePdf(
      { content: html },
      { format: "A4" },
    );
    fs.writeFileSync(filePath, pdfBuffer);

    res.set("Content-Type", "application/pdf");
    res.download(filePath, "certificado.pdf", (err) => {
      fs.unlink(filePath, (unlinkErr) => {
        if (unlinkErr)
          console.error("Error eliminando certificado temporal", unlinkErr);
      });
      if (err) next(err);
    });
  } catch (err) {
    next(err);
  }
};

