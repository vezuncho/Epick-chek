/* ================================================================
   EPI-CHECK · SUPABASE STORAGE · FOTOS
   - Bucket privado: Epi-check-file
   - Mantiene IndexedDB como copia local/offline
   - Sube fotos nuevas automáticamente
   - Migra fotos existentes bajo demanda
   - Recupera fotos de materiales y zonas en otro dispositivo
   ================================================================ */
(function(){
  'use strict';

  const BUCKET = 'Epi-check-file';
  const MAP_KEY = 'app_epicheck_photo_cloud_map';
  const PLAN_META_KEY = 'app_epicheck_cloud_plan_photos';
  const LAST_PHOTO_SYNC_KEY = 'app_epicheck_cloud_last_photo_sync';
  const MAX_PARALLEL = 2;
  let syncing = false;
  let hooksInstalled = false;

  function api(){ return window.EpiCloud || null; }
  function client(){ return api() && api().client; }
  function user(){ return api() && typeof api().getUser === 'function' ? api().getUser() : null; }
  function esc(v){ return String(v == null ? '' : v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
  function safe(v){ return String(v || 'sin-id').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9._-]+/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'').slice(0,100) || 'archivo'; }
  function loadJson(key, fallback){ try { return JSON.parse(localStorage.getItem(key) || '') || fallback; } catch { return fallback; } }
  function saveJson(key, value){ localStorage.setItem(key, JSON.stringify(value)); if(api() && api().scheduleSync) api().scheduleSync('fotos'); }
  function getMap(){ return loadJson(MAP_KEY, {}); }
  function setMap(map){ saveJson(MAP_KEY, map); }
  function dataUrlToBlob(data){
    const [head, body] = String(data || '').split(',');
    if(!head || body == null) throw new Error('Imagen local no válida');
    const mime = (head.match(/data:([^;]+)/)||[])[1] || 'image/jpeg';
    const bytes = atob(body); const arr = new Uint8Array(bytes.length);
    for(let i=0;i<bytes.length;i++) arr[i]=bytes.charCodeAt(i);
    return new Blob([arr], {type:mime});
  }
  function blobToDataUrl(blob){ return new Promise((resolve,reject)=>{ const r=new FileReader(); r.onload=()=>resolve(r.result); r.onerror=()=>reject(r.error); r.readAsDataURL(blob); }); }
  function cloudPathFor(photoId, meta={}){
    const u=user(); if(!u) throw new Error('Inicia sesión para subir fotos.');
    const type = meta.tipo === 'ubicacion' ? 'ubicaciones' : meta.tipo === 'inspeccion' ? 'inspecciones' : 'materiales';
    const owner = safe(meta.itemId || meta.zona || meta.inspeccionId || 'general');
    return `${u.id}/${type}/${owner}/${safe(photoId)}.jpg`;
  }
  async function uploadData(photoId, data, meta={}){
    const c=client(), u=user(); if(!c || !u || !navigator.onLine) return null;
    const map=getMap(); if(map[photoId] && map[photoId].path) return map[photoId];
    const path=cloudPathFor(photoId,meta); const blob=dataUrlToBlob(data);
    const {error}=await c.storage.from(BUCKET).upload(path, blob, {contentType:blob.type || 'image/jpeg', upsert:true, cacheControl:'3600'});
    if(error) throw error;
    map[photoId]={path, tipo:meta.tipo||'material', itemId:meta.itemId||'', zona:meta.zona||'', nombre:meta.nombre||'', size:blob.size, updatedAt:new Date().toISOString()};
    setMap(map); localStorage.setItem(LAST_PHOTO_SYNC_KEY,new Date().toISOString()); updatePanel();
    return map[photoId];
  }
  async function downloadByPhotoId(photoId){
    const c=client(); if(!c) return '';
    const entry=getMap()[photoId]; if(!entry || !entry.path) return '';
    const {data,error}=await c.storage.from(BUCKET).download(entry.path);
    if(error) throw error;
    return await blobToDataUrl(data);
  }
  async function deleteCloudPhoto(photoId){
    const c=client(); if(!c) return;
    const map=getMap(), entry=map[photoId]; if(!entry || !entry.path) return;
    const {error}=await c.storage.from(BUCKET).remove([entry.path]);
    if(error) throw error;
    delete map[photoId]; setMap(map); updatePanel();
  }

  function installHooks(){
    if(hooksInstalled) return; hooksInstalled=true;
    if(typeof window.guardarFotoDB === 'function'){
      const original=window.guardarFotoDB;
      window.guardarFotoDB=async function(photoId,data,meta={}){
        const result=await original.apply(this,arguments);
        uploadData(photoId,data,meta).catch(err=>{ console.warn('Foto pendiente de Supabase:',err); updatePanel('Pendiente'); });
        return result;
      };
    }
    if(typeof window.resolverDataFoto === 'function'){
      const original=window.resolverDataFoto;
      window.resolverDataFoto=async function(foto){
        let local=''; try{ local=await original.apply(this,arguments); }catch{}
        if(local) return local;
        if(!foto || !foto.photoId) return '';
        try{
          const data=await downloadByPhotoId(foto.photoId);
          if(data && typeof window.guardarFotoDB==='function') await window.guardarFotoDB(foto.photoId,data,{tipo:'material',nombre:foto.nombre||'foto.jpg'});
          return data;
        }catch(err){ console.warn('No se pudo recuperar foto:',err); return ''; }
      };
    }
    if(typeof window.borrarFotoDB === 'function'){
      const original=window.borrarFotoDB;
      window.borrarFotoDB=async function(photoId){
        const result=await original.apply(this,arguments);
        deleteCloudPhoto(photoId).catch(err=>console.warn('No se pudo borrar foto nube:',err));
        return result;
      };
    }
    if(typeof window.guardarFotosPlanoFurgoneta === 'function'){
      const original=window.guardarFotosPlanoFurgoneta;
      window.guardarFotosPlanoFurgoneta=function(fotos){
        const result=original.apply(this,arguments);
        syncPlanObject(fotos||{}).catch(err=>console.warn('Fotos de zonas pendientes:',err));
        return result;
      };
    }
  }

  async function syncPlanObject(fotos){
    if(!user() || !navigator.onLine) return;
    const metadata={};
    for(const [zona,arr] of Object.entries(fotos||{})){
      metadata[zona]=[];
      for(let i=0;i<(Array.isArray(arr)?arr:[]).length;i++){
        const f=arr[i]; if(!f) continue;
        const photoId=f.photoId || `zona_${safe(zona)}_${Date.now()}_${i}_${Math.random().toString(36).slice(2,7)}`;
        f.photoId=photoId;
        if(f.data) await uploadData(photoId,f.data,{tipo:'ubicacion',zona,nombre:f.nombre||'foto-interior.jpg'});
        const entry=getMap()[photoId];
        if(entry) metadata[zona].push({photoId,cloudPath:entry.path,nombre:f.nombre||'',fecha:f.fecha||'',sizeBytes:f.sizeBytes||entry.size||0});
      }
    }
    saveJson(PLAN_META_KEY,metadata);
  }

  async function migrateAll(){
    if(syncing) return; if(!user()) throw new Error('Inicia sesión primero.'); if(!navigator.onLine) throw new Error('No hay conexión.');
    syncing=true; updatePanel('Preparando…');
    try{
      const jobs=[];
      const inv=(typeof window.__epiGetInventario==='function' ? window.__epiGetInventario() : []);
      for(const item of inv){
        for(const f of (Array.isArray(item.fotos)?item.fotos:[])){
          if(!f || !f.photoId || getMap()[f.photoId]) continue;
          jobs.push(async()=>{ const data=await window.leerFotoDB(f.photoId); if(data) await uploadData(f.photoId,data,{tipo:'material',itemId:item.id,nombre:f.nombre||'foto.jpg'}); });
        }
      }
      let done=0;
      for(let i=0;i<jobs.length;i+=MAX_PARALLEL){
        await Promise.all(jobs.slice(i,i+MAX_PARALLEL).map(fn=>fn())); done=Math.min(i+MAX_PARALLEL,jobs.length); updatePanel(`Subiendo ${done}/${jobs.length}`);
      }
      if(typeof window.cargarFotosPlanoDesdeIndexedDB==='function'){
        const plan=await window.cargarFotosPlanoDesdeIndexedDB(); await syncPlanObject(plan||{});
      }
      if(api() && api().uploadState) await api().uploadState({manual:false,skipConfirm:true});
      localStorage.setItem(LAST_PHOTO_SYNC_KEY,new Date().toISOString()); updatePanel('Fotos sincronizadas');
      alert(`✅ Fotos sincronizadas con Supabase.\n\nFotos de materiales procesadas: ${jobs.length}\nTambién se han revisado las fotos interiores del plano.`);
    }finally{ syncing=false; }
  }

  async function restorePlanPhotos(){
    if(!user()) throw new Error('Inicia sesión primero.');
    const meta=loadJson(PLAN_META_KEY,{}); if(!Object.keys(meta).length) return 0;
    const result={}; let count=0;
    for(const [zona,arr] of Object.entries(meta)){
      result[zona]=[];
      for(const f of (Array.isArray(arr)?arr:[])){
        try{ const data=await downloadByPhotoId(f.photoId); if(data){ result[zona].push({...f,data}); count++; } }catch(err){ console.warn('Foto zona no recuperada',f,err); }
      }
    }
    if(count && typeof window.guardarFotosPlanoFurgoneta==='function') window.guardarFotosPlanoFurgoneta(result);
    return count;
  }

  function countCloud(){ return Object.keys(getMap()).length; }
  function updatePanel(status){
    const box=document.getElementById('epi-cloud-photos-card'); if(!box) return;
    const n=countCloud(); const last=localStorage.getItem(LAST_PHOTO_SYNC_KEY);
    const info=document.getElementById('epi-cloud-photos-info');
    if(info) info.textContent=status || `${n} fotos enlazadas · ${last ? new Date(last).toLocaleString('es-ES') : 'Sin sincronizar'}`;
  }
  function ensurePanel(){
    const logged=document.getElementById('epi-cloud-logged-in'); if(!logged || document.getElementById('epi-cloud-photos-card')) return;
    const card=document.createElement('div'); card.id='epi-cloud-photos-card'; card.className='rounded-2xl border border-cyan-800/70 bg-cyan-950/25 p-3 space-y-2';
    card.innerHTML=`<div class="flex items-center gap-2"><i class="fa-solid fa-images text-cyan-300"></i><div class="font-black text-xs text-cyan-100">Fotos en Supabase Storage</div></div><div id="epi-cloud-photos-info" class="text-[11px] text-cyan-200/75">Comprobando…</div><button type="button" onclick="sincronizarFotosSupabaseEpiCheck()" class="w-full rounded-xl bg-cyan-700 px-3 py-3 text-xs font-black text-white"><i class="fa-solid fa-cloud-arrow-up mr-1"></i> Subir y sincronizar todas las fotos</button><button type="button" onclick="recuperarFotosSupabaseEpiCheck()" class="w-full rounded-xl border border-cyan-700 bg-slate-950/50 px-3 py-3 text-xs font-bold text-cyan-200"><i class="fa-solid fa-cloud-arrow-down mr-1"></i> Recuperar fotos en este móvil</button><p class="text-[10px] leading-relaxed text-slate-500">Las fotos nuevas se guardan primero en el móvil y se suben automáticamente cuando hay sesión e internet.</p>`;
    const logout=logged.querySelector('button[onclick="cerrarSesionNubeEpiCheck()"]'); logged.insertBefore(card,logout||null); updatePanel();
  }

  window.sincronizarFotosSupabaseEpiCheck=()=>migrateAll().catch(err=>{console.error(err);alert(`No se pudieron sincronizar las fotos:\n${err.message}`);updatePanel('Error');});
  window.recuperarFotosSupabaseEpiCheck=async()=>{
    try{
      if(!user()) throw new Error('Inicia sesión primero.');
      updatePanel('Recuperando…');
      const inv=(typeof window.__epiGetInventario==='function' ? window.__epiGetInventario() : []);
      let items=0;
      for(const item of inv) for(const f of (item.fotos||[])) if(f.photoId && !(await window.leerFotoDB(f.photoId))){ const data=await downloadByPhotoId(f.photoId); if(data){ await window.guardarFotoDB(f.photoId,data,{tipo:'material',itemId:item.id,nombre:f.nombre||'foto.jpg'}); items++; } }
      const zones=await restorePlanPhotos(); updatePanel('Recuperadas');
      alert(`✅ Fotos recuperadas.\n\nMateriales: ${items}\nFotos interiores: ${zones}`); if(typeof window.renderApp==='function') window.renderApp();
    }catch(err){console.error(err);alert(`No se pudieron recuperar las fotos:\n${err.message}`);updatePanel('Error');}
  };

  function init(){ installHooks(); ensurePanel(); updatePanel(); if(user()) restorePlanPhotos().catch(()=>{}); }
  window.addEventListener('epicheck-cloud-ready',init);
  window.addEventListener('epicheck-cloud-session',()=>{ensurePanel();updatePanel();});
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>setTimeout(init,500),{once:true}); else setTimeout(init,500);
})();
