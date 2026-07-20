// ── Fase 3: pulido visual y experiencia ────────────────────────────────
        (function(){
            const $ = (s, r=document) => r.querySelector(s);
            const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));

            function toast(msg){
                try{
                    const old = $('.epi-toast');
                    if(old) old.remove();
                    const el = document.createElement('div');
                    el.className = 'epi-toast';
                    el.innerHTML = msg;
                    document.body.appendChild(el);
                    setTimeout(()=>{ el.style.opacity='0'; el.style.transform='translateX(-50%) translateY(10px) scale(.98)'; }, 2200);
                    setTimeout(()=>el.remove(), 2700);
                }catch(e){}
            }
            window.epiToast = toast;

            function addScrollTop(){
                if($('#epi-floating-top')) return;
                const btn = document.createElement('button');
                btn.id='epi-floating-top';
                btn.type='button';
                btn.innerHTML='<i class="fa-solid fa-arrow-up"></i>';
                btn.setAttribute('aria-label','Volver arriba');
                btn.onclick=()=>window.scrollTo({top:0, behavior:'smooth'});
                document.body.appendChild(btn);
                const update=()=> btn.classList.toggle('visible', window.scrollY>420);
                window.addEventListener('scroll', update, {passive:true});
                update();
            }

            function marcarMenuActivo(){
                const pest = window.pestanaActual || 'inicio';
                $$('.menu-nav-btn').forEach(btn=>btn.classList.remove('is-active'));
                $$('.menu-nav-btn').forEach(btn=>{
                    const txt=(btn.textContent||'').toLowerCase();
                    if((pest==='personal' && txt.includes('epi')) ||
                       (pest==='furgoneta' && txt.includes('furgoneta')) ||
                       (pest==='herramienta' && txt.includes('herram')) ||
                       (pest==='grua' && txt.includes('grúa'))){
                        btn.classList.add('is-active');
                    }
                });
            }
            window.epiMarcarMenuActivo = marcarMenuActivo;

            function mejorarAjustes(){
                // Agrupa visualmente botones existentes del panel sin tocar la lógica.
                $$('#sidebar-panel button').forEach(btn=>{
                    const txt=(btn.textContent||'').trim().toLowerCase();
                    if(txt.includes('copia') || txt.includes('export') || txt.includes('import') || txt.includes('qr') || txt.includes('apariencia') || txt.includes('notific') || txt.includes('información')){
                        btn.classList.add('settings-card-btn');
                    }
                });
                const panel=$('#sidebar-panel');
                if(panel && !$('#fase3-ajustes-badge')){
                    const first=panel.querySelector('.space-y-5');
                    if(first){
                        const badge=document.createElement('div');
                        badge.id='fase3-ajustes-badge';
                        badge.className='bg-slate-900/80 border border-slate-700 rounded-2xl p-3 text-xs text-slate-300';
                        badge.innerHTML='<div class="font-black text-emerald-400 mb-1"><i class="fa-solid fa-sparkles mr-1"></i> Interfaz pulida</div><div class="text-slate-400 leading-tight">Accesos agrupados, botones más cómodos y transiciones suaves.</div>';
                        first.insertBefore(badge, first.children[1] || null);
                    }
                }
            }

            function hookFunciones(){
                const wrap = (name, after) => {
                    const old = window[name];
                    if(typeof old !== 'function' || old.__fase3) return;
                    const fn = function(...args){
                        const res = old.apply(this,args);
                        try{ after && after.apply(this,args); }catch(e){}
                        return res;
                    };
                    fn.__fase3=true;
                    window[name]=fn;
                };
                wrap('cambiarPestana', function(){ setTimeout(()=>{marcarMenuActivo();}, 30); });
                wrap('toggleSidebar', function(open){ if(open) setTimeout(()=>{mejorarAjustes(); marcarMenuActivo();}, 60); });
                wrap('guardarFormulario', function(){ toast('<i class="fa-solid fa-circle-check text-emerald-400 mr-1"></i> Cambios guardados'); });
                wrap('guardarVehiculo', function(){ toast('<i class="fa-solid fa-truck-ramp-box text-sky-400 mr-1"></i> Vehículo actualizado'); });
                wrap('renovarRevision', function(){ toast('<i class="fa-solid fa-calendar-check text-emerald-400 mr-1"></i> Inspección marcada como OK'); });
                wrap('ejecutarExport', function(){ toast('<i class="fa-solid fa-file-arrow-down text-sky-400 mr-1"></i> Exportación preparada'); });
            }

            function versionFase3(){
                document.querySelectorAll('*').forEach(el=>{
                    if(el.childNodes.length===1 && el.childNodes[0].nodeType===3){
                        el.textContent = el.textContent
                            .replace('Versión: Fase 3 · Pulido visual','Versión: Fase 3 · Pulido visual')
                            .replace('Pulido visual: transiciones, botones más cómodos, menú activo, espaciado y feedback de acciones.','Pulido visual: transiciones, botones más cómodos, menú activo, espaciado y feedback de acciones.');
                    }
                });
            }

            window.addEventListener('load', ()=>{
                addScrollTop();
                mejorarAjustes();
                hookFunciones();
                marcarMenuActivo();
                versionFase3();
                setTimeout(()=>document.body.classList.add('epi-ready'), 60);
            });
        })();
