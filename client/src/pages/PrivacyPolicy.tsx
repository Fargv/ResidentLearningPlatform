import React from 'react';
import { Container, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

const PrivacyPolicy: React.FC = () => {
  const { t } = useTranslation();
  const lastUpdated = '2025-08-30';

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        {t('privacyPolicy.title')}
      </Typography>
      <Typography variant="body1" paragraph>
        {t('privacyPolicy.intro')}
      </Typography>
      <Typography variant="h5" gutterBottom>
        {t('privacyPolicy.dataCollectionTitle')}
      </Typography>
      <Typography variant="body1" paragraph>
        {t('privacyPolicy.dataCollection')}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {t('privacyPolicy.lastUpdated', { date: lastUpdated })}
      </Typography>
    </Container>
  );
};

export default PrivacyPolicy;

