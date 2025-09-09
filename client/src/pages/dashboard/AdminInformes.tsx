import React, { useState } from "react";
import {
  Box,
  Button,
  Backdrop,
  CircularProgress,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import api from "../../api";
import { useTranslation } from "react-i18next";
import BackButton from "../../components/BackButton";

const AdminInformes: React.FC = () => {
  const { t } = useTranslation();
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [formatoProgreso, setFormatoProgreso] = useState<"csv" | "xlsx">("xlsx");

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

  // NUEVO: Exportar progreso usuarios
  const handleExportProgresoUsuarios = async () => {
    setDownloadLoading(true);
    try {
      const res = await api.get(`/informes/progreso-usuarios`, {
        params: { formato: formatoProgreso },
        responseType: "blob",
      });
      const blob = new Blob([res.data], {
        type:
          formatoProgreso === "csv"
            ? "text/csv"
            : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `ProgresoUsuarios.${formatoProgreso}`,
      );
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (err) {
      console.error("Error al descargar informe de progreso usuarios", err);
    } finally {
      setDownloadLoading(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
        <BackButton sx={{ mr: 2 }} />
        <Typography variant="h4">Informes</Typography>
      </Box>

      {/* Botones existentes */}
      <Button
        variant="contained"
        color="primary"
        startIcon={<DownloadIcon />}
        sx={{ mr: 2, mb: 2 }}
        onClick={() => handleExport("csv")}
        disabled={downloadLoading}
      >
        {t(
          "adminReports.exportSocietyActivitiesCsv",
          "Exportar actividades sociedades (CSV)",
        )}
      </Button>
      <Button
        variant="contained"
        color="primary"
        startIcon={<DownloadIcon />}
        sx={{ mb: 2, mr: 2 }}
        onClick={() => handleExport("xlsx")}
        disabled={downloadLoading}
      >
        {t(
          "adminReports.exportSocietyActivitiesXlsx",
          "Exportar actividades sociedades (XLSX)",
        )}
      </Button>

      {/* Botón actividades residentes */}
      <Button
        variant="outlined"
        color="primary"
        startIcon={<DownloadIcon />}
        sx={{ mb: 2, mr: 2 }}
        onClick={handleExportActividadesResidentes}
        disabled={downloadLoading}
      >
        {t(
          "adminReports.exportResidentsActivitiesXlsx",
          "Exportar actividades residentes (XLSX)",
        )}
      </Button>

      {/* NUEVO: sección progreso usuarios */}
      <Box sx={{ mt: 3 }}>
        <FormControl sx={{ minWidth: 120, mr: 2 }}>
          <InputLabel id="formato-label">Formato</InputLabel>
          <Select
            labelId="formato-label"
            value={formatoProgreso}
            label="Formato"
            onChange={(e) =>
              setFormatoProgreso(e.target.value as "csv" | "xlsx")
            }
          >
            <MenuItem value="xlsx">XLSX</MenuItem>
            <MenuItem value="csv">CSV</MenuItem>
          </Select>
        </FormControl>
        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          onClick={handleExportProgresoUsuarios}
          disabled={downloadLoading}
        >
          Exportar progreso usuarios
        </Button>
      </Box>

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
