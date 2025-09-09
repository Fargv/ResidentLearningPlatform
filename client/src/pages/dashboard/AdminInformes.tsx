import React, { useState } from "react";
import {
  Box,
  Button,
  Backdrop,
  CircularProgress,
  Typography,
  List,
  ListItem,
  ListItemText,
  ButtonGroup,
  ListItemSecondaryAction,
} from "@mui/material";
import api from "../../api";
import { useTranslation } from "react-i18next";
import BackButton from "../../components/BackButton";

const AdminInformes: React.FC = () => {
  const { t } = useTranslation();
  const [downloadLoading, setDownloadLoading] = useState(false);

  // Exportar actividades sociedades
  const handleExport = async (format: "csv" | "xlsx") => {
    setDownloadLoading(true);
    try {
      const res = await api.get(
        `/informes/actividades-sociedades?format=${format}`,
        { responseType: "blob" },
      );
      const blob = new Blob([res.data], {
        type:
          res.headers["content-type"] ||
          (format === "csv"
            ? "text/csv"
            : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"),
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const timestamp = Date.now();
      link.setAttribute(
        "download",
        `ActividadesSociedades_${timestamp}.${format}`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    } finally {
      setDownloadLoading(false);
    }
  };

  // Exportar actividades residentes
  const handleExportActividadesResidentes = async () => {
    setDownloadLoading(true);
    try {
      const res = await api.get("/informes/actividades-residentes", {
        responseType: "blob",
      });
      const disposition = res.headers["content-disposition"];
      const fileName =
        disposition && disposition.split("filename=")[1]
          ? disposition.split("filename=")[1].replace(/"/g, "")
          : `ActividadesResidentes_${Date.now()}.xlsx`;

      const blob = new Blob([res.data], {
        type:
          res.headers["content-type"] ||
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error exportando actividades residentes", err);
    } finally {
      setDownloadLoading(false);
    }
  };

  // Exportar progreso usuarios
  const handleExportProgresoUsuarios = async (format: "csv" | "xlsx") => {
    setDownloadLoading(true);
    try {
      const res = await api.get(`/informes/progreso-usuarios`, {
        params: { formato: format },
        responseType: "blob",
      });
      const blob = new Blob([res.data], {
        type:
          format === "csv"
            ? "text/csv"
            : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `ProgresoUsuarios.${format}`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (err) {
      console.error(
        "Error al descargar informe de progreso usuarios",
        err,
      );
    } finally {
      setDownloadLoading(false);
    }
  };

  const handleExportHospitales = async (format: "csv" | "xlsx") => {
    setDownloadLoading(true);
    try {
      const res = await api.get(`/informes/hospitales`, {
        params: { format },
        responseType: "blob",
      });
      const blob = new Blob([res.data], {
        type:
          format === "csv"
            ? "text/csv"
            : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Hospitales.${format}`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (err) {
      console.error(err);
    } finally {
      setDownloadLoading(false);
    }
  };

  const reports = [
    {
      title: t("adminReports.exportHospitals", "Hospitales"),
      formats: [
        { label: "CSV", handler: () => handleExportHospitales("csv") },
        { label: "XLSX", handler: () => handleExportHospitales("xlsx") },
      ],
    },
    {
      title: t(
        "adminReports.exportSocietyActivities",
        "Actividades sociedades",
      ),
      formats: [
        { label: "CSV", handler: () => handleExport("csv") },
        { label: "XLSX", handler: () => handleExport("xlsx") },
      ],
    },
    {
      title: t(
        "adminReports.exportResidentsActivities",
        "Actividades residentes",
      ),
      formats: [
        { label: "XLSX", handler: handleExportActividadesResidentes },
      ],
    },
    {
      title: t(
        "adminReports.exportUserProgress",
        "Progreso de usuarios",
      ),
      formats: [
        { label: "CSV", handler: () => handleExportProgresoUsuarios("csv") },
        { label: "XLSX", handler: () => handleExportProgresoUsuarios("xlsx") },
      ],
    },
  ];

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
        <BackButton sx={{ mr: 2 }} />
        <Typography variant="h4">Informes</Typography>
      </Box>

      <List sx={{ maxWidth: 500 }}>
        {reports.map((report) => (
          <ListItem key={report.title} sx={{ pr: 0, mb: 1 }}>
            <ListItemText primary={report.title} />
            <ListItemSecondaryAction>
              <ButtonGroup variant="contained" size="small">
                {report.formats.map((fmt) => (
                  <Button
                    key={fmt.label}
                    onClick={fmt.handler}
                    disabled={downloadLoading}
                  >
                    {fmt.label}
                  </Button>
                ))}
              </ButtonGroup>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>

      <Backdrop
        open={downloadLoading}
        sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
    </Box>
  );
};

export default AdminInformes;
