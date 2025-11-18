import React, { useState, useEffect, useMemo } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  CssBaseline,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Badge,
  useMediaQuery,
  useTheme,
  alpha,
  Fade
} from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  School as SchoolIcon,
  Assignment as AssignmentIcon,
  Notifications as NotificationsIcon,
  ExitToApp as LogoutIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  Brightness4 as Brightness4Icon,
  Brightness7 as Brightness7Icon,
  Description as DescriptionIcon,
  PushPin as PushPinIcon,
  PushPinOutlined as PushPinOutlinedIcon,
  Menu as MenuIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { getNotificacionesNoLeidas } from '../api';
import { useTranslation } from 'react-i18next';
import { useColorMode } from '../context/ColorModeContext';

// Páginas del dashboard
import DashboardHome from './dashboard/DashboardHome';
import TutorValidaciones from './dashboard/TutorValidaciones';
import Usuarios from './dashboard/Usuarios';
import AdminHospitales from './dashboard/AdminHospitales';
import AdminFases from './dashboard/AdminFases';
import AdminFasesSoc from './dashboard/AdminFasesSoc';
import AdminSociedades from './dashboard/AdminSociedades';
import AdminProgresoDetalle from './dashboard/AdminProgresoDetalle';
import Perfil from './dashboard/Perfil';
import Notificaciones from './dashboard/Notificaciones';
import DebugDashboard from './DebugDashboard';
import ResidenteFases from './dashboard/ResidenteFases';
import AdminAccessCodes from './dashboard/AdminAccessCodes';
import AdminConfiguracion from './dashboard/AdminConfiguracion';
import AdminCirugias from './dashboard/AdminCirugias';
import LanguageSelector from '../components/LanguageSelector';
import AdminInformes from './dashboard/AdminInformes';

const drawerWidth = 240;

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isPinned, setIsPinned] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const { toggleColorMode } = useColorMode();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const env = process.env.REACT_APP_ENV || (window as any).REACT_APP_ENV;
  const isDev = env === 'dev';

  const refreshUnreadCount = async () => {
    try {
      const res = await getNotificacionesNoLeidas();
      setUnreadCount(res.data.count || 0);
    } catch (err) {
      console.error('Error obteniendo notificaciones no leidas', err);
    }
  };

  useEffect(() => {
    refreshUnreadCount();
  }, []);

  useEffect(() => {
    setDrawerOpen(false);
  }, [isMobile]);

  const hoverTransitionDuration = 350;
  const handleDrawerToggle = () => setDrawerOpen((prev) => !prev);
  const handleDrawerClose = () => setDrawerOpen(false);
  const handleMenuOpen = (e: React.MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);
  const handleLogout = async () => {
    handleMenuClose();
    await logout();
    navigate('/login');
  };
  const handleProfileClick = () => {
    handleMenuClose();
    navigate('/dashboard/perfil');
  };

  const getMenuItems = () => {
    const items = [
      {
        text: t('actions.dashboard'),
        icon: <DashboardIcon />,
        path: '/dashboard',
        roles: ['administrador', 'tutor', 'csm', 'residente', 'participante']
      }
    ];

    if (user?.rol === 'residente' || user?.rol === 'participante' || user?.rol === 'profesor') {
      items.push({ text: t('actions.trainingPhases'), icon: <AssignmentIcon />, path: '/dashboard/fases', roles: ['residente', 'participante', 'profesor'] });
    }

    if (user?.rol === 'tutor' || user?.rol === 'csm' || user?.rol === 'profesor') {
      items.push({ text: t('actions.validations'), icon: <SchoolIcon />, path: '/dashboard/validaciones', roles: ['tutor', 'csm', 'profesor'] });
    }

    if (user?.rol === 'tutor' || user?.rol === 'csm' || user?.rol === 'profesor') {
      items.push({ text: t('actions.myUsers'), icon: <PeopleIcon />, path: '/dashboard/usuarios', roles: ['tutor', 'csm', 'profesor'] });
    }

    if (user?.rol === 'administrador') {
      items.push(
        { text: t('actions.users'), icon: <PeopleIcon />, path: '/dashboard/usuarios', roles: ['administrador'] },
        { text: 'Informes', icon: <DescriptionIcon />, path: '/dashboard/informes', roles: ['administrador'] },
        { text: t('actions.settings'), icon: <SettingsIcon />, path: '/dashboard/config', roles: ['administrador'] }
      );
    }

    return items;
  };


  const menuItems = getMenuItems();

  const collapsedWidth = useMemo(() => parseInt(theme.spacing(9), 10), [theme]);
  const sidebarWidth = isMobile ? 0 : isPinned ? drawerWidth : collapsedWidth;
  const sidebarWidthCss = `${sidebarWidth}px`;

  const handleSidebarHover = () => {
    if (!isMobile && !isPinned) {
      setIsHovering(true);
    }
  };

  const handleSidebarLeave = () => {
    if (!isMobile && !isPinned) {
      setIsHovering(false);
    }
  };

  const togglePin = () => {
    if (!isMobile) {
      setIsPinned((prev) => !prev);
    }
  };

  useEffect(() => {
    if (isPinned) {
      setIsHovering(false);
    }
  }, [isPinned]);

  useEffect(() => {
    if (isMobile) {
      setIsPinned(false);
      setIsHovering(false);
    }
  }, [isMobile]);

  const location = useLocation();
  const isPathActive = (path: string) =>
    path === '/dashboard'
      ? location.pathname === path
      : location.pathname === path || location.pathname.startsWith(`${path}/`);

  const renderListItems = (showLabels: boolean, closeOnSelect?: boolean) => (
  <>
    {menuItems.map((item) => (
      <ListItemButton
        key={item.path}
        onClick={() => {
          navigate(item.path);
          if (isMobile && closeOnSelect) handleDrawerClose();
        }}
        sx={{
          justifyContent: showLabels ? 'flex-start' : 'center',
          px: showLabels ? 2 : 1.25,
          transition: theme.transitions.create(['padding', 'background-color'], {
            duration: hoverTransitionDuration
          }),
          borderLeft: isPathActive(item.path) ? `3px solid ${theme.palette.primary.main}` : '3px solid transparent',
          '&.Mui-selected': {
            backgroundColor: alpha(theme.palette.primary.main, 0.12),
            '&:hover': {
              backgroundColor: alpha(theme.palette.primary.main, 0.18)
            }
          },
          '& .MuiListItemIcon-root': {
            color: isPathActive(item.path) ? theme.palette.primary.main : 'inherit'
          }
        }}
        selected={isPathActive(item.path)}
      >
        <ListItemIcon
          sx={{
            minWidth: showLabels ? 40 : 'auto',
            justifyContent: 'center'
          }}
        >
          {item.icon}
        </ListItemIcon>

        <ListItemText
          primary={item.text}
          sx={{
            opacity: showLabels ? 1 : 0,
            transition: theme.transitions.create(['opacity', 'margin'], {
              duration: hoverTransitionDuration
            }),
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            ml: showLabels ? 0 : -1,
            width: showLabels ? 'auto' : 0
          }}
        />
      </ListItemButton>
    ))}
  </>
);


  const SidebarContent: React.FC<{ showLabels: boolean; isMobileView?: boolean; onClose?: () => void }> = ({
    showLabels,
    isMobileView,
    onClose
  }) => (
    <>
      <Toolbar
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: showLabels ? 'space-between' : 'center',
          px: showLabels ? 1.5 : 1,
          transition: theme.transitions.create(['padding'], { duration: hoverTransitionDuration })
        }}
      >
        <Box
          sx={{
            flexGrow: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: showLabels ? 'flex-start' : 'center'
          }}
        >
          <Box
            component="img"
            src="/logo-small.png"
            alt="Logo"
            sx={{
              height: showLabels ? 48 : 40,
              maxWidth: '100%',
              width: 'auto',
              mx: showLabels ? 'auto' : 0,
              transition: theme.transitions.create(['height', 'margin'], { duration: hoverTransitionDuration })
            }}
          />
        </Box>
        {isMobileView ? (
          <IconButton onClick={onClose}>
            <ChevronLeftIcon />
          </IconButton>
        ) : (
          <Fade in={showLabels} unmountOnExit mountOnEnter>
            <IconButton
              onClick={togglePin}
              size="small"
              color={isPinned ? 'primary' : 'default'}
              sx={{ ml: 1 }}
            >
              {isPinned ? <PushPinIcon fontSize="small" /> : <PushPinOutlinedIcon fontSize="small" />}
            </IconButton>
          </Fade>
        )}
      </Toolbar>
      <Divider />
      <List>{renderListItems(showLabels, isMobileView)}</List>
      <Divider />
      <List>
        <ListItemButton
          onClick={() => {
            navigate('/dashboard/perfil');
            if (isMobile && isMobileView) handleDrawerClose();
          }}
          sx={{
            justifyContent: showLabels ? 'flex-start' : 'center',
            px: showLabels ? 2 : 1.25,
            transition: theme.transitions.create(['padding', 'background-color'], {
              duration: hoverTransitionDuration
            }),
            borderLeft: isPathActive('/dashboard/perfil') ? `3px solid ${theme.palette.primary.main}` : '3px solid transparent',
            '&.Mui-selected': {
              backgroundColor: alpha(theme.palette.primary.main, 0.12),
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.18)
              }
            },
            '& .MuiListItemIcon-root': {
              color: isPathActive('/dashboard/perfil') ? theme.palette.primary.main : 'inherit'
            }
          }}
          selected={isPathActive('/dashboard/perfil')}
        >
          <ListItemIcon sx={{ minWidth: showLabels ? 40 : 'auto', justifyContent: 'center' }}><PersonIcon /></ListItemIcon>
          <ListItemText
            primary={t('actions.myProfile')}
            sx={{
              opacity: showLabels ? 1 : 0,
              transition: theme.transitions.create(['opacity', 'margin'], { duration: hoverTransitionDuration }),
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              ml: showLabels ? 0 : -1,
              width: showLabels ? 'auto' : 0
            }}
          />
        </ListItemButton>
        <ListItemButton
          onClick={() => {
            navigate('/dashboard/notificaciones');
            if (isMobile && isMobileView) handleDrawerClose();
          }}
          sx={{
            justifyContent: showLabels ? 'flex-start' : 'center',
            px: showLabels ? 2 : 1.25,
            transition: theme.transitions.create(['padding', 'background-color'], {
              duration: hoverTransitionDuration
            }),
            borderLeft: isPathActive('/dashboard/notificaciones')
              ? `3px solid ${theme.palette.primary.main}`
              : '3px solid transparent',
            '&.Mui-selected': {
              backgroundColor: alpha(theme.palette.primary.main, 0.12),
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.18)
              }
            },
            '& .MuiListItemIcon-root': {
              color: isPathActive('/dashboard/notificaciones') ? theme.palette.primary.main : 'inherit'
            }
          }}
          selected={isPathActive('/dashboard/notificaciones')}
        >
          <ListItemIcon sx={{ minWidth: showLabels ? 40 : 'auto', justifyContent: 'center' }}>
            <Badge badgeContent={unreadCount} color="secondary">
              <NotificationsIcon />
            </Badge>
          </ListItemIcon>
          <ListItemText
            primary={t('actions.notifications')}
            sx={{
              opacity: showLabels ? 1 : 0,
              transition: theme.transitions.create(['opacity', 'margin'], { duration: hoverTransitionDuration }),
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              ml: showLabels ? 0 : -1,
              width: showLabels ? 'auto' : 0
            }}
          />
        </ListItemButton>
        <ListItemButton
          onClick={handleLogout}
          sx={{
            justifyContent: showLabels ? 'flex-start' : 'center',
            px: showLabels ? 2 : 1.25,
            transition: theme.transitions.create(['padding', 'background-color'], {
              duration: hoverTransitionDuration
            }),
            '&:hover .MuiListItemIcon-root': {
              color: theme.palette.primary.main
            }
          }}
        >
          <ListItemIcon sx={{ minWidth: showLabels ? 40 : 'auto', justifyContent: 'center' }}><LogoutIcon /></ListItemIcon>
          <ListItemText
            primary={t('actions.logout')}
            sx={{
              opacity: showLabels ? 1 : 0,
              transition: theme.transitions.create(['opacity', 'margin'], { duration: hoverTransitionDuration }),
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              ml: showLabels ? 0 : -1,
              width: showLabels ? 'auto' : 0
            }}
          />
        </ListItemButton>
      </List>
    </>
  );

  return (
    <Box sx={{ display: 'flex', backgroundColor: 'background.default', minHeight: '100vh' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          zIndex: theme.zIndex.drawer - 1,
          transition: theme.transitions.create(['width', 'margin'], {
            duration: hoverTransitionDuration
          }),
          width: isMobile ? '100%' : `calc(100% - ${sidebarWidthCss})`,
          ml: isMobile ? 0 : sidebarWidthCss
        }}
      >
        <Toolbar>
          {!isMobile && <Box sx={{ width: theme.spacing(6) }} />}
          {isMobile && (
            <IconButton color="inherit" onClick={handleDrawerToggle} edge="start" sx={{ mr: 3 }}>
              <MenuIcon />
            </IconButton>
          )}
          <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>
            Academic Program daVinci
          </Typography>
          <LanguageSelector
            sx={{
              mr: 2,
              color: 'inherit',
              '.MuiSelect-select': { color: 'inherit' },
              '.MuiOutlinedInput-notchedOutline': {
                borderColor: (theme) => alpha(theme.palette.common.white, 0.5),
              },
              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'common.white' },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'common.white' },
              '.MuiSvgIcon-root': { color: 'inherit' }
            }}
          />
          <IconButton
            color="inherit"
            onClick={toggleColorMode}
            sx={{ mr: 1, color: 'inherit' }}
          >
            {theme.palette.mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
          </IconButton>
          <IconButton color="inherit" onClick={() => navigate('/dashboard/notificaciones')}>
            <Badge badgeContent={unreadCount} color="secondary">
              <NotificationsIcon />
            </Badge>
          </IconButton>
          <IconButton onClick={handleMenuOpen} color="inherit" sx={{ ml: 1 }}>
            <Avatar alt={`${user?.nombre} ${user?.apellidos}`} src={user?.avatar} sx={{ width: 32, height: 32 }}>
              {user?.nombre?.charAt(0)}
            </Avatar>
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            onClick={handleMenuClose}
            PaperProps={{
              elevation: 0,
              sx: {
                overflow: 'visible',
                filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                mt: 1.5,
                '& .MuiAvatar-root': { width: 32, height: 32, ml: -0.5, mr: 1 },
                '&:before': {
                  content: '""',
                  display: 'block',
                  position: 'absolute',
                  top: 0,
                  right: 14,
                  width: 10,
                  height: 10,
                  bgcolor: 'background.paper',
                  transform: 'translateY(-50%) rotate(45deg)',
                  zIndex: 0
                }
              }
            }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <MenuItem onClick={handleProfileClick}>
              <ListItemIcon><PersonIcon fontSize="small" /></ListItemIcon>
              {t('actions.profile')}
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
              {t('actions.logout')}
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      {!isMobile && (
        <Box sx={{ position: 'relative' }}>
          <Drawer
            variant="permanent"
            open
            sx={{
              width: sidebarWidthCss,
              flexShrink: 0,
              display: { xs: 'none', md: 'block' },
              [`& .MuiDrawer-paper`]: {
                width: sidebarWidthCss,
                boxSizing: 'border-box',
                overflowX: 'hidden',
                transition: theme.transitions.create('width', {
                  duration: hoverTransitionDuration
                }),
                zIndex: theme.zIndex.appBar + 2
              }
            }}
            PaperProps={{
              onMouseEnter: handleSidebarHover,
              onMouseLeave: handleSidebarLeave,
              sx: { zIndex: theme.zIndex.appBar + 2 }
            }}
          >
            <SidebarContent showLabels={isPinned} />
          </Drawer>
          {!isPinned && (
            <Drawer
              variant="temporary"
              open={isHovering}
              onClose={handleSidebarLeave}
              ModalProps={{ keepMounted: true }}
              hideBackdrop
              sx={{
                [`& .MuiDrawer-paper`]: {
                  width: drawerWidth,
                  boxSizing: 'border-box',
                  overflowX: 'hidden',
                  transition: theme.transitions.create(['transform', 'width'], {
                    duration: hoverTransitionDuration
                  })
                },
                zIndex: theme.zIndex.appBar + 2
              }}
              PaperProps={{ onMouseEnter: handleSidebarHover, onMouseLeave: handleSidebarLeave }}
            >
              <SidebarContent showLabels />
            </Drawer>
          )}
        </Box>
      )}
      {isMobile && (
        <Drawer
          variant="temporary"
          open={drawerOpen}
          onClose={handleDrawerClose}
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            display: { xs: 'block', md: 'none' },
            [`& .MuiDrawer-paper`]: {
              width: drawerWidth,
              boxSizing: 'border-box',
              overflowX: 'hidden'
            }
          }}
          ModalProps={{ keepMounted: true }}
        >
          <SidebarContent showLabels isMobileView onClose={handleDrawerClose} />
        </Drawer>
      )}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 2.5,
          width: '100%',
          backgroundColor: 'background.default',
          minHeight: '100vh',
          transition: theme.transitions.create('margin', {
            duration: hoverTransitionDuration
          })
        }}
      >
        <Toolbar />
        <Routes>
          <Route path="/" element={<DashboardHome />} />
          <Route path="/validaciones" element={<TutorValidaciones />} />
          <Route path="/usuarios" element={<Usuarios />} />
          <Route path="/hospitals" element={<AdminHospitales />} />
          {user?.rol === 'administrador' && (
            <Route path="/fases" element={<AdminFases />} />
          )}
          {user?.rol === 'administrador' && (
            <Route path="/access-codes" element={<AdminAccessCodes />} />
          )}
          {user?.rol === 'administrador' && (
            <Route path="/cirugias" element={<AdminCirugias />} />
          )}
          {user?.rol === 'administrador' && (
            <Route path="/fases-soc" element={<AdminFasesSoc />} />
          )}
          {user?.rol === 'administrador' && (
            <Route path="/informes" element={<AdminInformes />} />
          )}
          {user?.rol === 'administrador' && (
            <Route path="/progreso-usuarios" element={<Navigate to="/dashboard/usuarios" />} />
          )}
          <Route
            path="/dashboard/progreso"
            element={<Navigate to="/dashboard" replace />}
          />
          {user?.rol === 'administrador' && (
            <Route path="/config" element={<AdminConfiguracion />} />
          )}
          {user?.rol === 'administrador' && (
            <Route path="/progreso-usuario/:userId" element={<AdminProgresoDetalle />} />
          )}
          <Route path="/sociedades" element={<AdminSociedades />} />
          {user?.rol === 'residente' || user?.rol === 'participante' || user?.rol === 'profesor' ? (
            <Route path="/fases" element={<ResidenteFases />} />
          ) : null}
          <Route path="/perfil" element={<Perfil />} />
          <Route path="/notificaciones" element={<Notificaciones onChange={refreshUnreadCount} />} />
          {isDev && <Route path="/debug" element={<DebugDashboard />} />}
        </Routes>

      </Box>
    </Box>
  );
};

export default Dashboard;
