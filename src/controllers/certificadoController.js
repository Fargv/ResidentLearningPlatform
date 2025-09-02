const pdf = require("html-pdf-node");
const path = require("path");
const fs = require("fs");
const User = require("../models/User");
const ProgresoResidente = require("../models/ProgresoResidente");

exports.descargarCertificado = async (req, res, next) => {
  try {
    const usuario = await User.findById(req.params.id)
      .populate("hospital")
      .populate("tutor", "nombre apellidos");
    if (!usuario) {
      return res
        .status(404)
        .json({ success: false, error: "Usuario no encontrado" });    }

    if (
      (req.user.rol === "residente" || req.user.rol === "participante") &&
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

    const programa =
      usuario.rol === "residente"
        ? "Programa Residentes"
        : usuario.rol === "participante"
          ? "Programa Sociedades"
          : usuario.tipo;

    const uploadDir = path.join(__dirname, "../../public/uploads");
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    const fileName = `certificado_${usuario._id}_${Date.now()}.pdf`;
    const filePath = path.join(uploadDir, fileName);

    const templateFile =
      programa === "Programa Residentes"
        ? "certificado_residente.html"
        : "certificado.html";
    const templatePath = path.resolve(
      process.cwd(),
      `client/src/templates/${templateFile}`,
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

    const corporateLogo = "https://www.abexsl.es/images/logo.png";
    let logosHtml;
    if (programa === "Programa Sociedades") {
      logosHtml = `<div class="logo-center"><img src="${corporateLogo}" alt="Logo" /></div>`;
    } else if (programa !== "Programa Residentes") {
      const hospiLogo =
        usuario.hospital && usuario.hospital.urlHospiLogo
          ? `<img src="${usuario.hospital.urlHospiLogo}" alt="Logo Hospital" />`
          : "";
      logosHtml = `<div class="logos"><img src="${corporateLogo}" alt="Logo" />${hospiLogo}</div>`;
    }

    const formattedBody = certificateStrings.body
      .replace("{{name}}", `${usuario.nombre} ${usuario.apellidos}`)
      .replace("{{hospital}}", usuario.hospital ? usuario.hospital.nombre : "");

    const formattedDate = new Intl.DateTimeFormat(lang, {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date());
    const dateLine = certificateStrings.dateLine.replace("{{date}}", formattedDate);

    let tutorName =
      certificateStrings.tutorPrefix +
      (usuario.hospital ? usuario.hospital.nombre : "");
    let tutorRoleLine = certificateStrings.tutorPlaceholder;

    if (programa === "Programa Residentes") {
      tutorName = usuario.tutor
        ? `${usuario.tutor.nombre} ${usuario.tutor.apellidos}`
        : certificateStrings.tutorPlaceholder;
      tutorRoleLine = usuario.tutor
        ? `Tutor del programa de residentes del ${usuario.hospital.nombre}`
        : "";
      html = html
        .replace(
          "{{HOSPITAL_LOGO}}",
          `<img src="${usuario.hospital.urlHospiLogo}" alt="Logo Hospital" />`,
        )
        .replace("{{TUTOR_NAME}}", tutorName)
        .replace("{{TUTOR_ROLE_LINE}}", tutorRoleLine);
    } else {
      html = html.replace("{{LOGOS}}", logosHtml);
    }

    html = html
      .replace("{{CERT_TITLE}}", certificateStrings.title)
      .replace("{{PROGRAMA}}", programa)
      .replace("{{CERT_BODY}}", formattedBody)
      .replace("{{CERT_DATE}}", dateLine)
      .replace("{{CERT_FOOTER}}", certificateStrings.footer)
      .replace("{{LOGO_TOP}}", "https://www.abexsl.es/images/logo.png")
      .replace("{{SIGNATURE_LOGO}}", signatureBase64)
      .replace("{{LANG}}", lang);

    if (programa === "Programa Residentes" && html.includes("{{")) {
      return res.status(500).json({
        success: false,
        error: "Marcadores sin reemplazar en la plantilla",
      });
    }
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

