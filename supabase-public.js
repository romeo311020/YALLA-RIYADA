(() => {
 const db=window.yrSupabase;if(!db)return;const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));const safeUrl=u=>{try{const x=new URL(u);return x.protocol==='https:'||x.protocol==='http:'?x.href:''}catch{return''}};const httpsUrl=u=>{try{const x=new URL(u);return x.protocol==='https:'?x.href:''}catch{return''}};const date=s=>s?new Date(s).toLocaleString('ar-EG',{dateStyle:'medium',timeStyle:'short'}):'الموعد لم يحدد';
 if(location.pathname.endsWith('match.html')){
  /* مباراة يدوية (من لوحة الأدمن): لا تحتاج أي طلب API، فتعمل حتى لو الحد اليومي خلص */
  (async()=>{
   const id=new URLSearchParams(location.search).get('id'); if(!id)return;
   const cols='id,home_team,away_team,league,kickoff,status,home_score,away_score';
   let r=await db.from('matches').select(cols+',home_logo,away_logo').eq('id',id).eq('is_published',true).maybeSingle();
   if(r.error) r=await db.from('matches').select(cols).eq('id',id).eq('is_published',true).maybeSingle();
   const m=r.data; if(r.error||!m)return;
   const tn=n=>window.YR_NAMES?window.YR_NAMES.team(n):n;
   const crest=(l)=>{const u=httpsUrl(l||'');return u?`<img src="${esc(u)}" alt="" loading="lazy">`:'⚽'};
   const title=document.getElementById('match-title'); if(title)title.textContent=tn(m.home_team)+' × '+tn(m.away_team);
   document.title=tn(m.home_team)+' × '+tn(m.away_team)+' | يلا رياضة';
   const score=document.getElementById('match-score');
   if(score){const has=m.home_score!=null&&m.away_score!=null;
    score.innerHTML=`<div class="team"><span class="crest">${crest(m.home_logo)}</span><span class="team-name">${esc(tn(m.home_team))}</span></div>${has?`<div class="score" dir="ltr">${esc(m.away_score)} : ${esc(m.home_score)}</div>`:`<div class="kick">${m.kickoff?new Date(m.kickoff).toLocaleTimeString('ar-EG',{timeZone:'Africa/Cairo',hour:'2-digit',minute:'2-digit'}):'—'}</div>`}<div class="team"><span class="crest">${crest(m.away_logo)}</span><span class="team-name">${esc(tn(m.away_team))}</span></div>`;}
   const note=document.querySelector('main .panel .note');
   if(note)note.textContent=date(m.kickoff);window.yrHero&&window.yrHero({league:m.league,kickoff:m.kickoff,status:m.status});
   const player=document.getElementById('match-player'), box=document.getElementById('match-player-frame');
   if(!player||!box)return;
   const {data:sess}=await db.auth.getSession();
   if(sess?.session?.user){
    const e=await db.from('matches').select('embed_url').eq('id',id).maybeSingle();
    const url=httpsUrl(e.data?.embed_url||''); if(!url)return;
    window.yrMountPlayer(url,'مشغّل مباراة '+tn(m.home_team)+' ضد '+tn(m.away_team));
    if(note&&!document.getElementById('watch-btn')){const b=document.createElement('button');b.type='button';b.id='watch-btn';b.className='btn primary watch-btn';b.textContent='▶ شاهد المباراة';b.addEventListener('click',()=>player.scrollIntoView({behavior:'smooth',block:'start'}));note.after(b);}
   }else{
    const h=await db.rpc('match_has_stream',{p_id:id});
    if(h.data===true){box.innerHTML=window.yrLockBox?window.yrLockBox('المشغّل للأعضاء فقط','سجّل دخولك بحسابك لمشاهدة هذه المباراة.'):'';player.hidden=false;}
   }
  })();
 }
 if(location.pathname.endsWith('product.html')){
  (async()=>{const id=new URLSearchParams(location.search).get('id');if(!id||!id.match(/^[0-9a-f-]{36}$/i))return;const {data:p,error}=await db.from('products').select('*').eq('id',id).eq('is_published',true).maybeSingle();if(error||!p)return;const title=document.getElementById('product-name');if(title)title.textContent=p.name;const art=document.getElementById('product-detail');if(art)art.innerHTML=safeUrl(p.image_url)?`<img src="${esc(safeUrl(p.image_url))}" alt="${esc(p.name)}" style="max-width:100%;max-height:300px;object-fit:contain">`:'🏅';const panel=document.querySelector('main .panel');if(panel){const ps=panel.querySelectorAll('p');if(ps[0])ps[0].textContent=p.description||'لا يوجد وصف متاح.';if(ps[1])ps[1].textContent=p.price==null?'السعر عند التواصل':'السعر: '+p.price+' ج.م';const buy=safeUrl(p.buy_url);if(buy){const a=document.createElement('a');a.className='btn primary';a.href=buy;a.target='_blank';a.rel='noopener noreferrer';a.textContent='الشراء من الموقع الرسمي ↗';panel.insertBefore(a,panel.querySelector('a[href="store.html"]'));}}})();
 }
 if(location.pathname.endsWith('store.html')){
  (async()=>{const host=document.getElementById('products');if(!host)return;const {data,error}=await db.from('products').select('id,name,description,price,image_url').eq('is_published',true).order('created_at',{ascending:false});if(error){host.innerHTML='<p class="note">تعذّر تحميل المنتجات.</p>';return;}host.innerHTML=(data||[]).map(p=>`<a class="product" href="product.html?id=${encodeURIComponent(p.id)}"><div class="product-art">${safeUrl(p.image_url)?`<img src="${esc(safeUrl(p.image_url))}" alt="" style="width:100%;height:100%;object-fit:cover">`:'🏅'}</div><div class="product-content"><span class="tag">منتج</span><h3>${esc(p.name)}</h3><p>${esc(p.description)}</p><b class="product-price">${p.price==null?'السعر عند التواصل':esc(p.price)+' ج.م'}</b></div></a>`).join('')||'<p class="note">لا توجد منتجات منشورة حاليًا.</p>';})();
 }
})();
