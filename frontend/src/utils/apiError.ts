type ApiErrorData = {
  error?: string;
  message?: unknown;
  details?: unknown;
};

const MESSAGE_MAP: Record<string, string> = {
  'Invalid email or password': 'Correo o contraseña inválidos',
  'Email and password are required': 'El correo y la contraseña son obligatorios',
  'Email, password, and full name are required': 'El correo, la contraseña y el nombre completo son obligatorios',
  'Email already registered': 'El correo ya está registrado',
  'Password must be at least 6 characters long': 'La contraseña debe tener al menos 6 caracteres',
  'Internal server error during login': 'Error interno al iniciar sesión',
  'Internal server error during registration': 'Error interno al registrarse',
  'Login successful': 'Inicio de sesión exitoso',
  'Organizer registered successfully': 'Registro exitoso',

  'Email is required': 'El correo es obligatorio',
  'Token is required': 'El token es obligatorio',
  'Password is required': 'La contraseña es obligatoria',
  'Invalid or expired token': 'Token inválido o expirado',
  'Invalid token': 'Token inválido',
  'User not found': 'Usuario no encontrado',
  'Could not update password': 'No se pudo actualizar la contraseña',
  'Password updated successfully': 'Contraseña actualizada correctamente',
  'Internal server error': 'Error interno del servidor',

  'Invalid event data': 'Datos del evento inválidos',
  'Access token required': 'Se requiere token de acceso',
  'User authentication required': 'Debes iniciar sesión para continuar',
  'Full name must be at least 2 characters': 'El nombre debe tener al menos 2 caracteres',
  'Event ID is required': 'El ID del evento es obligatorio',
  'Event not found or access denied': 'Evento no encontrado o sin acceso',
  'Event not found or not available': 'Evento no encontrado o no disponible',
  'No fields to update provided': 'No se proporcionaron campos para actualizar',
  'Error fetching events': 'Error al obtener los eventos',
  'Error fetching event': 'Error al obtener el evento',
  'Error updating event': 'Error al actualizar el evento',
  'Error deleting event': 'Error al eliminar el evento',
  'Internal server error during event creation': 'Error interno al crear el evento',
  'Subject is required': 'El asunto es obligatorio',
  'Message is required': 'El mensaje es obligatorio',
  'Error sending communication': 'Error al enviar la comunicación',
};

const CODE_MAP: Record<string, string> = {
  MISSING_FIELDS: 'Faltan campos obligatorios',
  WEAK_PASSWORD: 'La contraseña debe tener al menos 6 caracteres',
  EMAIL_EXISTS: 'El correo ya está registrado',
  INVALID_CREDENTIALS: 'Correo o contraseña inválidos',
  UNAUTHORIZED: 'No autorizado',

  MISSING_EMAIL: 'El correo es obligatorio',
  MISSING_TOKEN: 'Falta el token',
  MISSING_PASSWORD: 'La contraseña es obligatoria',
  INVALID_TOKEN: 'Token inválido o expirado',

  USER_NOT_FOUND: 'Usuario no encontrado',
  PASSWORD_UPDATE_FAILED: 'No se pudo actualizar la contraseña',
};

const isNonEmptyString = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;

export const getApiErrorMessage = (err: any, fallback: string): string => {
  const data = (err?.response?.data || {}) as ApiErrorData;
  const code = isNonEmptyString(data.error) ? data.error : '';
  const rawMessage = isNonEmptyString(data.message) ? data.message : '';

  if (code && CODE_MAP[code]) return CODE_MAP[code];
  if (rawMessage && MESSAGE_MAP[rawMessage]) return MESSAGE_MAP[rawMessage];

  // Si ya viene en español (o no tenemos mapping), al menos mostramos algo.
  if (rawMessage) return rawMessage;

  return fallback;
};
