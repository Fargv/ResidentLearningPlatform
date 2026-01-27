import { TFunction } from 'i18next';

type FollowUpPhaseSummary = {
  estadoGeneral?: string;
  fase?: { numero?: number } | null;
};

export const getCurrentPhaseLabel = (
  t: TFunction,
  progresos: FollowUpPhaseSummary[]
): string | undefined => {
  if (!progresos.length) {
    return 'Sin iniciar';
  }

  const enProgreso = progresos.filter((progreso) => progreso.estadoGeneral === 'en progreso');
  if (enProgreso.length > 0) {
    const numeros = enProgreso
      .map((progreso) => progreso.fase?.numero)
      .filter((numero): numero is number => typeof numero === 'number');
    if (numeros.length > 0) {
      const numero = Math.max(...numeros);
      return `${t('adminPhases.phase')} ${numero}`;
    }
  }

  if (progresos.every((progreso) => progreso.estadoGeneral === 'validado')) {
    return 'Programa Completado';
  }

  return undefined;
};
