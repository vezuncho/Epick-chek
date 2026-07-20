(function(){
  'use strict';
  if (window.__epiResaltadosFinalesEstables) return;
  window.__epiResaltadosFinalesEstables = true;

  function norm(v){
    return String(v || '').toLowerCase().normalize('NFD')
      .replace(/[\u0300-\u036f]/g,'').replace(/ñ/g,'n')
      .replace(/[^a-z0-9]+/g,' ').trim();
  }
  function inventarioActual(){
    // Primero usa la variable viva de la app. window.inventario puede ser una copia antigua
    // y no incluir materiales recién creados o editados hasta recargar.
    try { if (Array.isArray(inventario)) return inventario; } catch(e){}
    try { if (Array.isArray(window.inventario)) return window.inventario; } catch(e){}
    return [];
  }
  function zonas(){
    try { if (typeof zonasArmarioBase === 'function') return zonasArmarioBase(); } catch(e){}
    return [];
  }
  function textoItem(item){
    if (!item) return '';
    return [item.donde,item.ubicacionFisica,item.ubicacionArmario,item.localizacion,item.zona,item.cajon,item.posicion,item.lugar,item.detalleUbicacion,item.ubicacionExacta]
      .filter(Boolean).join(' ');
  }
  function resolverTexto(texto){
    var t=norm(texto), zs=zonas();
    if(!t) return null;
    function by(k){ return zs.find(function(z){return z.key===k;}) || null; }
    var m;
    if ((m=t.match(/(?:gaveta|bandeja|balda)\s*(?:n(?:umero)?\s*)?(\d{1,2})/))) {
      var n=Math.max(1,Math.min(9,Number(m[1]))); return by('bandeja-'+n);
    }
    if ((m=t.match(/cajon\s*(?:n(?:umero)?\s*)?(\d{1,2})/))) {
      var c=Math.max(1,Math.min(8,Number(m[1]))); return by('cajon-'+c);
    }
    if (/saco|bolsa.*epi|epi.*saco/.test(t)) return by('saco-epis');
    if (/zona\s*10|inferior|parte baja|parte inferior/.test(t)) return by('inferior-10');
    try {
      if (typeof leerNombresPlanoFurgoneta === 'function') {
        var labels=leerNombresPlanoFurgoneta();
        for (var i=0;i<zs.length;i++) {
          var nlabel=norm(labels[zs[i].key] || zs[i].label);
          if(nlabel && nlabel.length>=3 && (t===nlabel || t.indexOf(nlabel)!==-1)) return zs[i];
        }
      }
    } catch(e){}
    try { if (typeof zonaArmarioDesdeTexto === 'function') return zonaArmarioDesdeTexto(texto); } catch(e){}
    return null;
  }
  function resolverItem(item){
    // ÚNICA fuente de verdad: la casilla "Dónde exactamente".
    // Nunca se deduce la ubicación por nombre, categoría ni campos heredados.
    var texto=String(item&&item.donde||'').trim();
    if(!texto){
      return {key:'sin-asignar',n:'?',label:'Sin ubicación',detalle:'La casilla “Dónde exactamente” está vacía.',color:'#64748b',icon:'fa-location-dot'};
    }
    var z=resolverTexto(texto);
    return (z&&z.key&&z.key!=='sin-asignar')
      ? z
      : {key:'sin-asignar',n:'?',label:texto,detalle:'Ubicación guardada, pero no vinculada a una zona del plano.',color:'#22d3ee',icon:'fa-location-dot'};
  }
  window.zonaArmarioDesdeItem = resolverItem;

  function actualizarPines(){
    var inv=inventarioActual();
    document.querySelectorAll('#material-list [data-item-id]').forEach(function(card){
      var item=inv.find(function(x){return String(x&&x.id)===String(card.dataset.itemId);});
      if(!item || item.ubicacion!=='furgoneta') return;
      // El pin depende únicamente de que item.donde tenga contenido.
      // No exige que el texto coincida con un patrón del plano.
      var ok=(typeof tieneUbicacionAsignada==='function')
        ? tieneUbicacionAsignada(item)
        : String(item&&item.donde||'').trim().length>0;
      var z=ok ? resolverItem(item) : null;
      var btn=card.querySelector('button[data-action="mapa-armario"]');
      if(!btn) return;
      btn.classList.remove('bg-slate-900','text-slate-400','border-slate-700','bg-cyan-800/80','border-cyan-400','text-cyan-50');
      var ico=btn.querySelector('i');
      if(ok){
        btn.classList.add('bg-cyan-800/80','border-cyan-400','text-cyan-50');
        btn.style.boxShadow='0 0 0 1px rgba(34,211,238,.22), 0 0 10px rgba(34,211,238,.16)';
        btn.title='Ver '+((z&&z.label)||String(item.donde||'').trim()||'ubicación asignada');
        btn.setAttribute('aria-label','Ubicación asignada: '+((z&&z.label)||String(item.donde||'').trim()));
        if(ico){ ico.classList.remove('text-slate-500'); ico.classList.add('text-cyan-200'); }
      }else{
        btn.classList.add('bg-slate-900','text-slate-400','border-slate-700');
        btn.style.boxShadow='none';
        btn.title='Ubicación sin asignar';
        btn.setAttribute('aria-label','Ubicación sin asignar');
        if(ico){ ico.classList.remove('text-cyan-200'); ico.classList.add('text-slate-500'); }
      }
    });
  }

  var renderOriginal=null;
  try { renderOriginal=window.renderApp || renderApp; } catch(e){}
  if(typeof renderOriginal==='function'){
    window.renderApp=function(){
      var r=renderOriginal.apply(this,arguments);
      setTimeout(actualizarPines,0);
      return r;
    };
    try { renderApp=window.renderApp; } catch(e){}
  }

  var observer=new MutationObserver(function(){ actualizarPines(); });
  document.addEventListener('DOMContentLoaded',function(){
    var list=document.getElementById('material-list');
    if(list) observer.observe(list,{childList:true,subtree:true});
    actualizarPines();
  });

  var abrirOriginal=null;
  try { abrirOriginal=window.abrirMapaArmarioItem || abrirMapaArmarioItem; } catch(e){}
  window.abrirMapaArmarioItem=function(id){
    var item=inventarioActual().find(function(x){return String(x&&x.id)===String(id);});
    if(!item){ if(typeof feedbackEpi==='function') feedbackEpi('Material no encontrado','warn'); return; }
    var zona=resolverItem(item);
    var old=document.getElementById('modal-mapa-armario-overlay'); if(old) old.remove();
    var overlay=document.createElement('div');
    overlay.id='modal-mapa-armario-overlay';
    overlay.className='fixed inset-0 bg-black/90 z-[9999] flex items-end justify-center';
    document.body.appendChild(overlay);
    var html='';
    try { html=(typeof renderArmarioInteractivo==='function') ? renderArmarioInteractivo(zona) : ''; } catch(e){ console.error(e); }
    overlay.innerHTML='<div class="w-full max-w-md bg-slate-950 rounded-t-2xl border-t border-slate-700 shadow-2xl overflow-hidden max-h-[94vh] flex flex-col">'+
      '<div class="p-3 border-b border-slate-800 bg-slate-900 flex items-center justify-between gap-3 shrink-0">'+
      '<div class="min-w-0"><div class="text-[10px] uppercase tracking-wider font-black text-cyan-400">Ubicación en el armario</div><div class="text-sm font-black text-slate-100 truncate">'+(typeof esc==='function'?esc(item.equipo||item.nombre||'Material'):(item.equipo||item.nombre||'Material'))+'</div></div>'+
      '<button type="button" onclick="document.getElementById(\'modal-mapa-armario-overlay\')?.remove()" class="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 text-slate-300"><i class="fa-solid fa-xmark"></i></button></div>'+
      '<div class="overflow-auto p-3 grow overscroll-contain">'+html+'</div></div>';
    if(zona.key==='sin-asignar' && typeof feedbackEpi==='function') feedbackEpi('No se reconoce la ubicación exacta','warn');
  };
  try { abrirMapaArmarioItem=window.abrirMapaArmarioItem; } catch(e){}

  // Expone el refresco para poder ejecutarlo inmediatamente tras altas y ediciones.
  window.actualizarPinesUbicacionTarjetas = actualizarPines;

  // El formulario guarda y después vuelve a renderizar. Repite el cálculo cuando el DOM
  // y el inventario ya contienen el valor nuevo, sin obligar a cerrar o recargar la app.
  document.addEventListener('click', function(ev){
    var el = ev.target && ev.target.closest ? ev.target.closest('button') : null;
    if (!el) return;
    var txt = String(el.textContent || '').toLowerCase();
    var esGuardar = el.id === 'btn-guardar-equipo' || el.id === 'btn-guardar-formulario' ||
      /guardar equipo|guardar material|guardar cambios/.test(txt);
    if (esGuardar) {
      setTimeout(actualizarPines, 30);
      setTimeout(actualizarPines, 180);
      setTimeout(actualizarPines, 500);
    }
  }, true);

  // También responde a cambios programáticos y al cierre del formulario.
  document.addEventListener('change', function(ev){
    if (ev.target && (ev.target.id === 'form-donde' || ev.target.id === 'form-ubicacion')) {
      setTimeout(actualizarPines, 0);
    }
  }, true);

  setTimeout(actualizarPines,300);
})();
