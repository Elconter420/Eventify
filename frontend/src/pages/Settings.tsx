import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import api from '../services/api';
import type { User } from '../types';

type AppSettings = {
  // comunicaciones
  autoAppendSignature: boolean;
  communicationSignature: string;

  // defaults para nuevos eventos
  defaultEventLocation: string;
  defaultEventCapacity: number;
  defaultEventTime: string; // HH:MM
};

const SETTINGS_KEY = 'settings';

const defaultSettings: AppSettings = {
  autoAppendSignature: false,
  communicationSignature: '',
  defaultEventLocation: '',
  defaultEventCapacity: 100,
  defaultEventTime: '12:00',
};

const readSettings = (): AppSettings => {
  const raw = localStorage.getItem(SETTINGS_KEY);
  if (!raw) return defaultSettings;
  try {
    const parsed = JSON.parse(raw);
    return {
      ...defaultSettings,
      ...parsed,
      defaultEventCapacity:
        typeof parsed?.defaultEventCapacity === 'number' && parsed.defaultEventCapacity > 0
          ? parsed.defaultEventCapacity
          : defaultSettings.defaultEventCapacity,
      defaultEventTime:
        typeof parsed?.defaultEventTime === 'string' && /^\d{2}:\d{2}$/.test(parsed.defaultEventTime)
          ? parsed.defaultEventTime
          : defaultSettings.defaultEventTime,
    };
  } catch {
    return defaultSettings;
  }
};

const Settings: React.FC = () => {
  const { user, login, logout } = useAuth();

  const [fullName, setFullName] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');

  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [prefsSaved, setPrefsSaved] = useState('');

  useEffect(() => {
    setFullName(user?.full_name || '');
  }, [user?.full_name]);

  useEffect(() => {
    setSettings(readSettings());
  }, []);

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    setPrefsSaved('Cambios guardados');
    const t = setTimeout(() => setPrefsSaved(''), 1500);
    return () => clearTimeout(t);
  }, [settings]);

  const saveName = async () => {
    setProfileError('');
    setProfileSuccess('');

    const currentToken = authService.getToken();
    if (!currentToken) {
      setProfileError('No hay sesión activa');
      return;
    }

    const trimmed = fullName.trim();
    if (trimmed.length < 2) {
      setProfileError('El nombre debe tener al menos 2 caracteres');
      return;
    }

    setSavingName(true);
    try {
      const response = await api.patch<{ message: string; user: User }>('/auth/profile', {
        full_name: trimmed,
      });
      login(currentToken, response.data.user);
      setProfileSuccess('Nombre actualizado');
    } catch (err: any) {
      setProfileError(err.response?.data?.message || 'No se pudo actualizar el nombre');
    } finally {
      setSavingName(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Cuenta</h3>
          </div>
          <div className="p-6 space-y-4">
            {(profileError || profileSuccess) && (
              <div
                className={`border px-4 py-3 rounded ${profileError ? 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/30 dark:border-red-700 dark:text-red-200' : 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/25 dark:border-green-700 dark:text-green-200'}`}
              >
                {profileError || profileSuccess}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nombre del organizador</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email (no editable)</label>
                <div className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100">
                  {user?.email || '—'}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={saveName}
                disabled={savingName}
                className="flex items-center justify-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                <span>{savingName ? 'Guardando...' : 'Guardar nombre'}</span>
              </button>

              <button
                type="button"
                onClick={logout}
                className="flex items-center justify-center gap-2 px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors"
              >
                <LogOut size={18} />
                <span>Cerrar sesión</span>
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Comunicaciones</h3>
          </div>
          <div className="p-6 space-y-4">
            {prefsSaved && <div className="text-sm text-green-700 dark:text-green-300">{prefsSaved}</div>}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-800 dark:text-gray-100">Añadir firma automáticamente</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Se agrega al final de cada mensaje en Comunicaciones.</p>
              </div>
              <input
                type="checkbox"
                checked={settings.autoAppendSignature}
                onChange={(e) => setSettings((s) => ({ ...s, autoAppendSignature: e.target.checked }))}
                className="w-5 h-5"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Firma</label>
              <textarea
                value={settings.communicationSignature}
                onChange={(e) => setSettings((s) => ({ ...s, communicationSignature: e.target.value }))}
                placeholder="Ej: \nDepartamento de Extensión\nUniversidad X"
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              />
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Se guarda en este navegador.</div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Eventos (valores por defecto)</h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Ubicación por defecto</label>
                <input
                  type="text"
                  value={settings.defaultEventLocation}
                  onChange={(e) => setSettings((s) => ({ ...s, defaultEventLocation: e.target.value }))}
                  placeholder="Ej: Auditorio Principal"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Capacidad por defecto</label>
                <input
                  type="number"
                  min={1}
                  value={settings.defaultEventCapacity}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      defaultEventCapacity: Number.parseInt(e.target.value, 10) || 1,
                    }))
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                />
              </div>
            </div>

            <div className="max-w-xs">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Hora por defecto</label>
              <input
                type="time"
                value={settings.defaultEventTime}
                onChange={(e) => setSettings((s) => ({ ...s, defaultEventTime: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              />
            </div>

            <div className="text-sm text-gray-600 dark:text-gray-400">
              Se aplican en “Crear Evento” como valores iniciales.
            </div>
          </div>
        </div>

        
      </div>
    </Layout>
  );
};

export default Settings;
