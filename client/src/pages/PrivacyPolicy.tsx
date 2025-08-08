import React, { useEffect, useState } from "react";
import { Box, Container, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

const PrivacyPolicy: React.FC = () => {
  const { t, i18n } = useTranslation();
  const lastUpdated = "2025-08-30";
  const [content, setContent] = useState("");

  useEffect(() => {
    fetch(`/privacy/${i18n.language}.html`)
      .then((res) => res.text())
      .then(setContent)
      .catch(() => setContent(""));
  }, [i18n.language]);

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        {t("privacyPolicy.title")}
      </Typography>
      <Box
        sx={{ "& h2": { mt: 2, fontSize: "1.5rem" }, "& p": { mt: 1 } }}
        dangerouslySetInnerHTML={{ __html: content }}
      />
      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
        {t("privacyPolicy.lastUpdated", { date: lastUpdated })}
      </Typography>
    </Container>
  );
};

export default PrivacyPolicy;
