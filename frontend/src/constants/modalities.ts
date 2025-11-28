/**
 * Modality Constants
 * IDs de modalidades compartidos entre frontend y backend
 * IMPORTANTE: Estos IDs deben coincidir con los de la base de datos
 */

export const MODALITY_IDS = {
  PRESENTIAL: 1,
  VIRTUAL: 2,
  HYBRID: 3,
} as const;

export type ModalityId = typeof MODALITY_IDS[keyof typeof MODALITY_IDS];

/**
 * Verifica si una modalidad requiere ubicación física
 */
export const requiresLocation = (modalityId: number): boolean => {
  return modalityId === MODALITY_IDS.PRESENTIAL || modalityId === MODALITY_IDS.HYBRID;
};

/**
 * Verifica si una modalidad requiere acceso virtual
 */
export const requiresVirtualAccess = (modalityId: number): boolean => {
  return modalityId === MODALITY_IDS.VIRTUAL || modalityId === MODALITY_IDS.HYBRID;
};
