/* ================================================================
   EPI-CHECK · SUPABASE FASE 1
   - Auth por correo y contraseña
   - Migración manual segura de los datos locales
   - Restauración manual desde la nube
   - Sincronización automática tras enlazar el dispositivo
   - Las fotos originales de IndexedDB quedan para la Fase 2
   ================================================================ */
(function () {
  'use strict';

  const EPICHECK_SUPABASE_URL = 'https://xrufmywaomkxkdfvldhp.supabase.co';
  const EPICHECK_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_PU78L6q7NnrkwWDiBgAJew_OjQ7lr39';
  const EPICHECK_CLOUD_TABLE = 'epi_check_state';
  const EPICHECK_CLOUD_SCHEMA_VERSION = 1;
  const CLOUD_LINKED_KEY = 'app_epicheck_cloud_linked_user';
  const CLOUD_LAST_SYNC_KEY = 'app_epicheck_cloud_last_sync';
  const CLOUD_LAST_LOCAL_CHANGE_KEY = 'app_epicheck_cloud_last_local_change';

  let cloudClient = null;
  let cloudSession = null;
  let cloudSyncTimer = null;
  let cloudSyncInFlight = false;
  let cloudApplyingRemote = false;
  let cloudRemoteRowExists = false;

  function cloudEsc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function cloudNowIso() { return new Date().toISOString(); }
  function cloudFriendlyDate(value) {
    if (!value) return 'Nunca';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return 'Nunca';
    return d.toLocaleString('es-ES', { dateStyle:'short', timeStyle:'short' });
  }

  function setCloudStatus(kind, text) {
    const dot = document.getElementById('epi-cloud-status-dot');
    const label = document.getElementById('epi-cloud-status-text');
    const menuIcon = document.getElementById('epi-cloud-menu-icon');
    const menuText = document.getElementById('epi-cloud-menu-text');
    const palette = {
      ok: ['bg-emerald-400', 'text-emerald-400', 'fa-cloud-circle-check'],
      wait: ['bg-amber-400', 'text-amber-400', 'fa-cloud-arrow-up'],
      error: ['bg-red-400', 'text-red-400', 'fa-cloud-circle-xmark'],
      offline: ['bg-slate-500', 'text-slate-400', 'fa-cloud-slash'],
      idle: ['bg-sky-400', 'text-sky-400', 'fa-cloud']
    };
    const p = palette[kind] || palette.idle;
    if (dot) dot.className = `w-2.5 h-2.5 rounded-full ${p[0]}`;
    if (label) label.textContent = text;
    if (menuIcon) {
      menuIcon.className = `fa-solid ${p[2]} ${p[1]}`;
    }
    if (menuText) menuText.textContent = cloudSession ? `Nube · ${text}` : 'Cuenta y sincronización';
  }

  function currentUser() { return cloudSession && cloudSession.user ? cloudSession.user : null; }
  function isLinkedToCurrentUser() {
    const user = currentUser();
    return !!user && localStorage.getItem(CLOUD_LINKED_KEY) === user.id;
  }

  function collectCloudLocalStorage() {
    const result = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      if (!(key.startsWith('app_epicheck_') || key.startsWith('epicheck_'))) continue;
      if (key.startsWith('app_epicheck_cloud_')) continue;
      // Sesiones internas de Supabase nunca deben copiarse dentro de la fila de estado.
      if (key.startsWith('sb-')) continue;
      result[key] = localStorage.getItem(key);
    }
    // Forzamos el inventario actual en memoria para no subir una copia antigua.
    try {
      if (typeof prepararInventarioParaGuardar === 'function') {
        result.app_epicheck_pestanas_ordenadas = JSON.stringify(prepararInventarioParaGuardar());
      } else if (typeof inventario !== 'undefined') {
        result.app_epicheck_pestanas_ordenadas = JSON.stringify(inventario);
      }
    } catch (error) { console.warn('No se pudo preparar el inventario para nube', error); }
    try {
      if (typeof datosVehiculo !== 'undefined') result.app_epicheck_vehiculo = JSON.stringify(datosVehiculo || {});
    } catch (error) {}
    return result;
  }

  function buildCloudSnapshot() {
    const user = currentUser();
    return {
      app: 'EPI-Check',
      schema_version: EPICHECK_CLOUD_SCHEMA_VERSION,
      exported_at: cloudNowIso(),
      user_id: user ? user.id : null,
      local_storage: collectCloudLocalStorage(),
      photos: {
        originals_synced: false,
        note: 'Las fotos originales de IndexedDB se sincronizarán en la Fase 2. Se conservan localmente en este dispositivo.'
      },
      environment: {
        origin: location.origin,
        path: location.pathname,
        user_agent: navigator.userAgent
      }
    };
  }

  function snapshotSummary(snapshot) {
    let materials = 0;
    try {
      materials = JSON.parse(snapshot.local_storage.app_epicheck_pestanas_ordenadas || '[]').length;
    } catch (error) {}
    return { materials, keys: Object.keys(snapshot.local_storage || {}).length };
  }

  async function fetchRemoteState() {
    const user = currentUser();
    if (!user || !cloudClient) return null;
    const { data, error } = await cloudClient
      .from(EPICHECK_CLOUD_TABLE)
      .select('data, schema_version, device_name, created_at, updated_at')
      .eq('user_id', user.id)
      .maybeSingle();
    if (error) throw error;
    cloudRemoteRowExists = !!data;
    return data;
  }

  async function uploadCurrentState(options = {}) {
    const user = currentUser();
    if (!user) { abrirPanelNubeEpiCheck(); throw new Error('Inicia sesión primero.'); }
    if (!navigator.onLine) throw new Error('No hay conexión. Los cambios siguen guardados en el móvil.');
    if (cloudSyncInFlight) return false;
    cloudSyncInFlight = true;
    setCloudStatus('wait', options.manual ? 'Subiendo copia…' : 'Sincronizando…');
    try {
      const snapshot = buildCloudSnapshot();
      const summary = snapshotSummary(snapshot);
      if (options.manual && !options.skipConfirm) {
        const ok = confirm(`Se va a subir la copia actual del móvil.\n\nMateriales: ${summary.materials}\nBloques de datos: ${summary.keys}\n\nLas fotos originales todavía no se subirán en esta fase.\n\n¿Continuar?`);
        if (!ok) return false;
      }
      const payload = {
        user_id: user.id,
        data: snapshot,
        schema_version: EPICHECK_CLOUD_SCHEMA_VERSION,
        device_name: `${navigator.platform || 'Dispositivo'} · ${new Date().toLocaleDateString('es-ES')}`
      };
      const { error } = await cloudClient.from(EPICHECK_CLOUD_TABLE).upsert(payload, { onConflict: 'user_id' });
      if (error) throw error;
      const now = cloudNowIso();
      localStorage.setItem(CLOUD_LINKED_KEY, user.id);
      localStorage.setItem(CLOUD_LAST_SYNC_KEY, now);
      cloudRemoteRowExists = true;
      setCloudStatus('ok', 'Sincronizado');
      refreshCloudPanel();
      if (options.manual) alert(`✅ Datos guardados en Supabase.\n\nMateriales: ${summary.materials}\nÚltima sincronización: ${cloudFriendlyDate(now)}\n\nLas fotos originales se añadirán en la siguiente fase.`);
      return true;
    } finally {
      cloudSyncInFlight = false;
    }
  }

  async function restoreRemoteState() {
    const user = currentUser();
    if (!user) throw new Error('Inicia sesión primero.');
    setCloudStatus('wait', 'Leyendo nube…');
    const row = await fetchRemoteState();
    if (!row || !row.data || !row.data.local_storage) {
      setCloudStatus('idle', 'Sin copia remota');
      throw new Error('Todavía no existe una copia en la nube para esta cuenta.');
    }
    const summary = snapshotSummary(row.data);
    const ok = confirm(`Esto sustituirá los datos locales de este móvil por la copia de Supabase.\n\nCopia remota: ${cloudFriendlyDate(row.updated_at)}\nMateriales: ${summary.materials}\n\nLas fotos originales locales no se borrarán, pero solo se mostrarán las que estén referenciadas por la copia restaurada.\n\n¿Restaurar?`);
    if (!ok) { setCloudStatus('idle', 'Restauración cancelada'); return false; }

    cloudApplyingRemote = true;
    try {
      const remoteKeys = row.data.local_storage || {};
      const toRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('app_epicheck_') || key.startsWith('epicheck_')) && !key.startsWith('app_epicheck_cloud_')) {
          toRemove.push(key);
        }
      }
      toRemove.forEach(k => localStorage.removeItem(k));
      Object.entries(remoteKeys).forEach(([key, value]) => {
        if (typeof value === 'string') localStorage.setItem(key, value);
      });
      localStorage.setItem(CLOUD_LINKED_KEY, user.id);
      localStorage.setItem(CLOUD_LAST_SYNC_KEY, row.updated_at || cloudNowIso());
      alert('✅ Copia restaurada. La aplicación se recargará ahora.');
      location.reload();
      return true;
    } finally {
      cloudApplyingRemote = false;
    }
  }

  function scheduleCloudSync(reason) {
    if (cloudApplyingRemote || !cloudSession || !isLinkedToCurrentUser()) return;
    localStorage.setItem(CLOUD_LAST_LOCAL_CHANGE_KEY, cloudNowIso());
    clearTimeout(cloudSyncTimer);
    setCloudStatus(navigator.onLine ? 'wait' : 'offline', navigator.onLine ? 'Cambios pendientes' : 'Pendiente sin conexión');
    cloudSyncTimer = setTimeout(() => {
      uploadCurrentState({ manual:false, skipConfirm:true }).catch(error => {
        console.error('Sincronización automática:', error);
        setCloudStatus(navigator.onLine ? 'error' : 'offline', navigator.onLine ? 'Error de sincronización' : 'Pendiente sin conexión');
      });
    }, 1800);
  }

  function installSaveHooks() {
    if (window.__epiCloudHooksInstalled) return;
    window.__epiCloudHooksInstalled = true;

    if (typeof window.guardarEnLocalStorage === 'function') {
      const original = window.guardarEnLocalStorage;
      window.guardarEnLocalStorage = function () {
        const result = original.apply(this, arguments);
        scheduleCloudSync('inventario');
        return result;
      };
    }
    if (typeof window.guardarDatosVehiculo === 'function') {
      const originalVehicle = window.guardarDatosVehiculo;
      window.guardarDatosVehiculo = function () {
        const result = originalVehicle.apply(this, arguments);
        scheduleCloudSync('vehiculo');
        return result;
      };
    }

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden' && isLinkedToCurrentUser()) {
        uploadCurrentState({ manual:false, skipConfirm:true }).catch(() => {});
      }
    });
    window.addEventListener('online', () => {
      setCloudStatus('wait', 'Conexión recuperada');
      if (isLinkedToCurrentUser()) scheduleCloudSync('online');
    });
    window.addEventListener('offline', () => setCloudStatus('offline', 'Pendiente sin conexión'));
    setInterval(() => {
      if (isLinkedToCurrentUser() && navigator.onLine && !cloudSyncInFlight) {
        uploadCurrentState({ manual:false, skipConfirm:true }).catch(() => {});
      }
    }, 60000);
  }

  function ensureCloudPanel() {
    if (document.getElementById('epi-cloud-overlay')) return;
    const overlay = document.createElement('div');
    overlay.id = 'epi-cloud-overlay';
    overlay.className = 'fixed inset-0 z-[120] hidden bg-black/75 backdrop-blur-sm p-3 items-end sm:items-center justify-center';
    overlay.innerHTML = `
      <section id="epi-cloud-panel" class="w-full max-w-md max-h-[calc(100dvh-24px)] overflow-y-auto rounded-3xl border border-slate-700 bg-slate-900 shadow-2xl">
        <header class="sticky top-0 z-10 flex items-center justify-between border-b border-slate-700 bg-slate-900/95 px-4 py-4 backdrop-blur">
          <div>
            <h2 class="font-black text-slate-100"><i class="fa-solid fa-cloud text-emerald-400 mr-2"></i>Cuenta y sincronización</h2>
            <div class="mt-1 flex items-center gap-2 text-[11px] text-slate-400"><span id="epi-cloud-status-dot" class="w-2.5 h-2.5 rounded-full bg-slate-500"></span><span id="epi-cloud-status-text">Comprobando…</span></div>
          </div>
          <button type="button" onclick="cerrarPanelNubeEpiCheck()" class="h-10 w-10 rounded-xl border border-slate-700 bg-slate-800 text-slate-300"><i class="fa-solid fa-xmark"></i></button>
        </header>
        <div class="p-4 space-y-4">
          <div id="epi-cloud-logged-out" class="space-y-3">
            <div class="rounded-2xl border border-sky-800/70 bg-sky-950/30 p-3 text-xs text-sky-100">
              <div class="font-black mb-1">Protege tus datos</div>
              <p class="text-sky-200/80 leading-relaxed">Inicia sesión para guardar el inventario, ubicaciones, historial y configuración en Supabase. Las fotos originales se incorporarán en la siguiente fase.</p>
            </div>
            <label class="block text-xs font-bold text-slate-300">Correo electrónico
              <input id="epi-cloud-email" type="email" autocomplete="email" class="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white outline-none focus:border-emerald-500" placeholder="tu@correo.com">
            </label>
            <label class="block text-xs font-bold text-slate-300">Contraseña
              <input id="epi-cloud-password" type="password" autocomplete="current-password" minlength="6" class="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white outline-none focus:border-emerald-500" placeholder="Mínimo 6 caracteres">
            </label>
            <div class="grid grid-cols-2 gap-2">
              <button type="button" onclick="iniciarSesionNubeEpiCheck()" class="rounded-xl bg-emerald-600 px-3 py-3 text-xs font-black text-white"><i class="fa-solid fa-right-to-bracket mr-1"></i> Entrar</button>
              <button type="button" onclick="registrarCuentaNubeEpiCheck()" class="rounded-xl border border-sky-700 bg-sky-950/40 px-3 py-3 text-xs font-black text-sky-200"><i class="fa-solid fa-user-plus mr-1"></i> Crear cuenta</button>
            </div>
            <p class="text-[10px] leading-relaxed text-slate-500">Si Supabase exige confirmar el correo, abre el mensaje recibido antes de iniciar sesión.</p>
          </div>

          <div id="epi-cloud-logged-in" class="hidden space-y-3">
            <div class="rounded-2xl border border-slate-700 bg-slate-950/70 p-3">
              <div class="text-[10px] uppercase font-black tracking-wider text-slate-500">Cuenta conectada</div>
              <div id="epi-cloud-user-email" class="mt-1 break-all text-sm font-bold text-slate-100"></div>
              <div id="epi-cloud-last-sync" class="mt-1 text-[11px] text-slate-400"></div>
              <div id="epi-cloud-remote-info" class="mt-1 text-[11px] text-slate-400"></div>
            </div>
            <button type="button" onclick="subirDatosActualesNubeEpiCheck()" class="w-full rounded-xl bg-emerald-600 px-3 py-3 text-xs font-black text-white"><i class="fa-solid fa-cloud-arrow-up mr-1"></i> Subir los datos actuales de este móvil</button>
            <button type="button" onclick="restaurarDatosNubeEpiCheck()" class="w-full rounded-xl border border-sky-700 bg-sky-950/40 px-3 py-3 text-xs font-black text-sky-200"><i class="fa-solid fa-cloud-arrow-down mr-1"></i> Restaurar copia desde Supabase</button>
            <div class="rounded-2xl border border-amber-800/70 bg-amber-950/25 p-3 text-[11px] leading-relaxed text-amber-200/90">
              <b>Primera vez:</b> pulsa primero “Subir los datos actuales”. Después quedará activado el guardado automático para esta cuenta.
            </div>
            <button type="button" onclick="cerrarSesionNubeEpiCheck()" class="w-full rounded-xl border border-red-800 bg-red-950/30 px-3 py-3 text-xs font-bold text-red-300"><i class="fa-solid fa-right-from-bracket mr-1"></i> Cerrar sesión</button>
          </div>
        </div>
      </section>`;
    overlay.addEventListener('click', event => { if (event.target === overlay) cerrarPanelNubeEpiCheck(); });
    document.body.appendChild(overlay);
  }

  async function refreshCloudPanel() {
    ensureCloudPanel();
    const loggedOut = document.getElementById('epi-cloud-logged-out');
    const loggedIn = document.getElementById('epi-cloud-logged-in');
    const user = currentUser();
    loggedOut.classList.toggle('hidden', !!user);
    loggedIn.classList.toggle('hidden', !user);
    if (!user) { setCloudStatus('idle', navigator.onLine ? 'Sin iniciar sesión' : 'Sin conexión'); return; }
    document.getElementById('epi-cloud-user-email').textContent = user.email || user.id;
    document.getElementById('epi-cloud-last-sync').textContent = `Última sincronización local: ${cloudFriendlyDate(localStorage.getItem(CLOUD_LAST_SYNC_KEY))}`;
    try {
      const remote = await fetchRemoteState();
      document.getElementById('epi-cloud-remote-info').textContent = remote
        ? `Copia en Supabase: ${cloudFriendlyDate(remote.updated_at)}`
        : 'Todavía no hay una copia en Supabase.';
      if (isLinkedToCurrentUser()) setCloudStatus('ok', 'Sincronización automática activa');
      else setCloudStatus('idle', remote ? 'Copia remota disponible' : 'Pendiente de primera subida');
    } catch (error) {
      document.getElementById('epi-cloud-remote-info').textContent = `No se pudo consultar la nube: ${error.message}`;
      setCloudStatus('error', 'Error al consultar Supabase');
    }
  }

  window.abrirPanelNubeEpiCheck = function () {
    ensureCloudPanel();
    const overlay = document.getElementById('epi-cloud-overlay');
    overlay.classList.remove('hidden');
    overlay.classList.add('flex');
    refreshCloudPanel();
  };
  window.cerrarPanelNubeEpiCheck = function () {
    const overlay = document.getElementById('epi-cloud-overlay');
    if (!overlay) return;
    overlay.classList.add('hidden');
    overlay.classList.remove('flex');
  };

  window.iniciarSesionNubeEpiCheck = async function () {
    const email = document.getElementById('epi-cloud-email').value.trim();
    const password = document.getElementById('epi-cloud-password').value;
    if (!email || !password) { alert('Introduce correo y contraseña.'); return; }
    setCloudStatus('wait', 'Iniciando sesión…');
    const { data, error } = await cloudClient.auth.signInWithPassword({ email, password });
    if (error) { setCloudStatus('error', 'No se pudo entrar'); alert(`No se pudo iniciar sesión:\n${error.message}`); return; }
    cloudSession = data.session;
    await refreshCloudPanel();
  };

  window.registrarCuentaNubeEpiCheck = async function () {
    const email = document.getElementById('epi-cloud-email').value.trim();
    const password = document.getElementById('epi-cloud-password').value;
    if (!email || password.length < 6) { alert('Introduce un correo válido y una contraseña de al menos 6 caracteres.'); return; }
    setCloudStatus('wait', 'Creando cuenta…');
    const { data, error } = await cloudClient.auth.signUp({
      email, password,
      options: { emailRedirectTo: location.origin + location.pathname }
    });
    if (error) { setCloudStatus('error', 'No se pudo crear'); alert(`No se pudo crear la cuenta:\n${error.message}`); return; }
    cloudSession = data.session || null;
    alert(data.session ? '✅ Cuenta creada e iniciada.' : '✅ Cuenta creada. Revisa tu correo y confirma la cuenta antes de entrar.');
    await refreshCloudPanel();
  };

  window.cerrarSesionNubeEpiCheck = async function () {
    await cloudClient.auth.signOut();
    cloudSession = null;
    setCloudStatus('idle', 'Sesión cerrada');
    await refreshCloudPanel();
  };
  window.subirDatosActualesNubeEpiCheck = function () {
    uploadCurrentState({ manual:true }).catch(error => { setCloudStatus('error', 'Error al subir'); alert(`No se pudieron subir los datos:\n${error.message}`); });
  };
  window.restaurarDatosNubeEpiCheck = function () {
    restoreRemoteState().catch(error => { setCloudStatus('error', 'Error al restaurar'); alert(`No se pudo restaurar:\n${error.message}`); });
  };

  async function initCloud() {
    ensureCloudPanel();
    if (!window.supabase || typeof window.supabase.createClient !== 'function') {
      setCloudStatus('error', 'No cargó Supabase');
      console.error('No se pudo cargar supabase-js desde el CDN.');
      return;
    }
    cloudClient = window.supabase.createClient(EPICHECK_SUPABASE_URL, EPICHECK_SUPABASE_PUBLISHABLE_KEY, {
      auth: { persistSession:true, autoRefreshToken:true, detectSessionInUrl:true }
    });
    const { data, error } = await cloudClient.auth.getSession();
    if (error) console.warn('Sesión Supabase:', error);
    cloudSession = data && data.session ? data.session : null;
    cloudClient.auth.onAuthStateChange((_event, session) => {
      cloudSession = session;
      if (window.EpiCloud) window.EpiCloud.session = session;
      refreshCloudPanel();
      window.dispatchEvent(new CustomEvent('epicheck-cloud-session', { detail:{ session } }));
    });
    window.EpiCloud = {
      client: cloudClient,
      session: cloudSession,
      getUser: currentUser,
      isLinked: isLinkedToCurrentUser,
      scheduleSync: scheduleCloudSync,
      uploadState: uploadCurrentState,
      refreshPanel: refreshCloudPanel
    };
    window.dispatchEvent(new CustomEvent('epicheck-cloud-ready', { detail:{ session: cloudSession } }));
    installSaveHooks();
    await refreshCloudPanel();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initCloud, { once:true });
  else initCloud();
})();
