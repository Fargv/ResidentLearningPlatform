import React from 'react';
import { IconButton } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';
import { SxProps, Theme } from '@mui/material/styles';

interface BackButtonProps {
  sx?: SxProps<Theme>;
}

const BackButton: React.FC<BackButtonProps> = ({ sx }) => {
  const navigate = useNavigate();

  return (
    <IconButton color="primary" onClick={() => navigate(-1)} sx={sx} aria-label="volver">
      <ArrowBackIcon />
    </IconButton>
  );
};

export default BackButton;
