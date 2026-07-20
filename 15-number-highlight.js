(function(){
  'use strict';
  if (window.__epiResaltadoSoloNumeroV1) return;
  window.__epiResaltadoSoloNumeroV1 = true;

  function safe(v){
    try { return typeof esc === 'function' ? esc(v) : String(v || ''); }
    catch(e){ return String(v || ''); }
  }

  window.renderArmarioInteractivo = function(zona){
    var zs = (typeof zonasArmarioBase === 'function') ? zonasArmarioBase() : [];
    var activeKey = zona && zona.key ? zona.key : 'sin-asignar';
    var active = zs.find(function(z){ return z.key === activeKey; }) || null;

    var legendHtml = zs.map(function(z){
      var activo = !!active && z.key === active.key;
      return '<div class="flex items-center gap-2 rounded-xl border p-2 transition-all" style="border-color:'+
        (activo ? z.color : 'rgba(51,65,85,.75)')+';background:'+
        (activo ? z.color+'18' : 'rgba(15,23,42,.55)')+'">'+
        '<span class="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black text-white shrink-0" style="background:'+z.color+'dd">'+safe(z.n)+'</span>'+
        '<div class="min-w-0"><div class="text-[11px] font-black uppercase truncate" style="color:'+(activo ? z.color : '#cbd5e1')+'">'+safe(z.label)+'</div>'+
        '<div class="text-[10px] '+(activo ? 'text-slate-100' : 'text-slate-500')+' truncate">'+safe(z.detalle)+'</div></div>'+
        (activo ? '<i class="fa-solid fa-location-dot ml-auto text-base" style="color:'+z.color+'"></i>' : '')+
      '</div>';
    }).join('');

    var marker = '';
    if (active && active.box) {
      var cx = active.box.left + active.box.width / 2;
      var cy = active.box.top + active.box.height / 2;
      marker = '<div class="absolute pointer-events-none -translate-x-1/2 -translate-y-1/2" style="left:'+cx+'%;top:'+cy+'%;">'+
        '<div class="epi-numero-activo min-w-8 h-8 px-2 rounded-full flex items-center justify-center text-white text-sm font-black" '+
        'style="background:rgba(8,145,178,.86);border:2px solid rgba(207,250,254,.92);box-shadow:0 0 0 4px rgba(34,211,238,.13),0 2px 8px rgba(0,0,0,.35)">'+safe(active.n)+'</div></div>';
    }

    return '<div class="space-y-3">'+
      '<link rel="stylesheet" href="css/11-supabase.css">'+
      '<div class="rounded-2xl border border-slate-700 bg-black shadow-2xl overflow-hidden"><div class="relative w-full">'+
      '<img src="'+EPICHECK_ARMARIO_MAPA_SRC+'" alt="Imagen del armario furgoneta" class="w-full h-auto block" onerror="this.insertAdjacentHTML(\'afterend\',\'<div class=&quot;p-4 text-center text-red-300 text-xs&quot;>No se pudo cargar la imagen del armario.</div>\');this.style.display=\'none\';">'+marker+'</div></div>'+
      '<div class="rounded-2xl border '+(active ? 'border-cyan-800' : 'border-amber-700')+' bg-slate-950/95 p-3">'+
      (active ? '<div class="flex items-center gap-2"><span class="min-w-10 h-10 px-2 rounded-xl flex items-center justify-center text-white font-black" style="background:'+active.color+'">'+safe(active.n)+'</span><div class="min-w-0"><div class="text-xs uppercase font-black" style="color:'+active.color+'"><i class="fa-solid fa-location-dot mr-1"></i>'+safe(active.label)+'</div><div class="text-[11px] text-slate-300">'+safe(active.detalle)+'</div></div></div>' : '<div class="text-xs text-amber-300 font-bold"><i class="fa-solid fa-triangle-exclamation mr-1"></i>No hay una zona del plano asignada.</div>')+
      '</div><details class="epi-armario-details rounded-2xl border border-slate-800 bg-slate-950/95 overflow-hidden"><summary class="cursor-pointer select-none p-3 flex items-center gap-3 text-slate-100"><span class="w-9 h-9 rounded-xl bg-violet-950/70 border border-violet-700 text-violet-300 flex items-center justify-center"><i class="fa-solid fa-map-location-dot"></i></span><span class="min-w-0 flex-1"><span class="block text-xs font-black uppercase">Leyenda del armario</span><span class="block text-[11px] text-slate-400">Ver gavetas, cajones y zonas inferiores</span></span><i class="fa-solid fa-chevron-down text-slate-400"></i></summary><div class="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 pt-0">'+legendHtml+'</div></details></div>';
  };
  try { renderArmarioInteractivo = window.renderArmarioInteractivo; } catch(e){}
})();
