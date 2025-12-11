/**
 * Discount Error Type Definitions
 * WDA-1020: Error types and messages for discount code validation
 */

/**
 * Possible error types when validating discount codes
 */
export type DiscountErrorType =
  | 'INVALID_CODE'
  | 'EXPIRED'
  | 'NO_USES_LEFT'
  | 'ALREADY_USED'
  | 'INACTIVE'
  | 'NETWORK_ERROR'
  | 'VALIDATION_ERROR';

/**
 * Error message configuration for UI display
 */
export interface DiscountErrorConfig {
  /** Short title for the error */
  title: string;
  /** Detailed description for user guidance */
  description: string;
  /** Icon identifier for visual feedback */
  icon: string;
  /** Severity level affects styling */
  severity: 'error' | 'warning' | 'info';
}

/**
 * Localized error messages for discount validation
 * Spanish as primary language for SAUWA sauna
 */
export const ERROR_MESSAGES: Record<DiscountErrorType, DiscountErrorConfig> = {
  INVALID_CODE: {
    title: 'Codigo no valido',
    description: 'El codigo de descuento introducido no existe. Por favor, verifica que lo has escrito correctamente.',
    icon: 'x-circle',
    severity: 'error'
  },
  EXPIRED: {
    title: 'Codigo expirado',
    description: 'Este codigo de descuento ya no es valido. Ha superado su fecha de caducidad.',
    icon: 'clock',
    severity: 'warning'
  },
  NO_USES_LEFT: {
    title: 'Codigo agotado',
    description: 'Este codigo de descuento ha alcanzado su limite maximo de usos.',
    icon: 'ban',
    severity: 'warning'
  },
  ALREADY_USED: {
    title: 'Codigo ya utilizado',
    description: 'Ya has utilizado este codigo de descuento anteriormente. Solo se permite un uso por usuario.',
    icon: 'user-x',
    severity: 'warning'
  },
  INACTIVE: {
    title: 'Codigo inactivo',
    description: 'Este codigo de descuento no esta activo actualmente.',
    icon: 'pause-circle',
    severity: 'info'
  },
  NETWORK_ERROR: {
    title: 'Error de conexion',
    description: 'No se ha podido validar el codigo. Por favor, comprueba tu conexion e intentalo de nuevo.',
    icon: 'wifi-off',
    severity: 'error'
  },
  VALIDATION_ERROR: {
    title: 'Error de validacion',
    description: 'Ha ocurrido un error al validar el codigo. Por favor, intentalo de nuevo.',
    icon: 'alert-triangle',
    severity: 'error'
  }
};

/**
 * Get error configuration by error type
 * @param errorType - The type of discount error
 * @returns Error configuration object with title, description, icon, and severity
 */
export function getErrorConfig(errorType: DiscountErrorType): DiscountErrorConfig {
  return ERROR_MESSAGES[errorType];
}

/**
 * Check if an error type indicates a user-recoverable error
 * @param errorType - The type of discount error
 * @returns true if user can potentially fix the issue
 */
export function isRecoverableError(errorType: DiscountErrorType): boolean {
  return errorType === 'INVALID_CODE' || errorType === 'NETWORK_ERROR';
}
