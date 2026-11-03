import React,{useCallback,useEffect,useMemo,useRef,useState} from 'react';
import './reading.css';

const BOOKS=[
 ['1ne','1 Néfi',22],['2ne','2 Néfi',33],['jac','Jacó',7],['eno','Enos',1],
 ['jar','Jarom',1],['omn','Ômni',1],['pdm','Palavras de Mórmon',1],['mos','Mosias',29],
 ['alm','Alma',63],['hel','Helamã',16],['3ne','3 Néfi',30],['4ne','4 Néfi',1],
 ['mrm','Mórmon',9],['eth','Éter',15],['mor','Morôni',10]
].map(([key,name,count])=>({key,name,count}));
const CHAPTERS=BOOKS.flatMap(book=>Array.from({length:book.count},(_,i)=>({book_key:book.key,book_name:book.name,chapter:i+1})));
const TOTAL=CHAPTERS.length;
const COLORS=['#2E7D32','#1565C0','#6A1B9A','#EF6C00','#00838F','#AD1457'];
const TODAY=()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')};
const QUEUE_KEY=id=>'reading-pending:'+id;
const parseQueue=id=>{try{return JSON.parse(localStorage.getItem(QUEUE_KEY(id))||'[]')}catch{return []}};
const writeQueue=(id,items)=>{try{localStorage.setItem(QUEUE_KEY(id),JSON.stringify(items))}catch{}};
const makeCells=(x,y,cols,rows,w,h,region)=>Array.from({length:cols*rows},(_,i)=>({x:x+(i%cols)*w,y:y+Math.floor(i/cols)*h,w:w-1.2,h:h-1.2,region}));
const GLYPHS={
 J:['00111','00010','00010','00010','10010','10010','01100'],
 A:['01110','10001','10001','11111','10001','10001','10001'],
 L:['10000','10000','10000','10000','10000','10000','11111'],
 I:['11111','00100','00100','00100','00100','00100','11111'],
 O:['01110','10001','10001','10001','10001','10001','01110'],
 V:['10001','10001','10001','10001','10001','01010','00100'],
 R:['11110','10001','10001','11110','10100','10010','10001'],
 D:['11110','10001','10001','10001','10001','10001','11110'],
 E:['11111','10000','10000','11110','10000','10000','11111'],
 M:['10001','11011','10101','10101','10001','10001','10001'],
 N:['10001','11001','10101','10011','10001','10001','10001']
};
function phraseCells(){
 const lines=['JÁ LI O','LIVRO DE','MÓRMON'],all=[];
 lines.forEach((line,lineIndex)=>{
  const chars=[...line],advance=38,cell=5.5,gap=1.1,totalWidth=chars.length*advance-advance*.18,start=(360-totalWidth)/2;
  chars.forEach((raw,ci)=>{
   const ch=raw.normalize('NFD').replace(/[\u0300-\u036f]/g,'');
   if(ch===' ')return;
   const glyph=GLYPHS[ch]||GLYPHS.O;
   glyph.forEach((row,ri)=>[...row].forEach((bit,xi)=>{if(bit==='1')all.push({x:start+ci*advance+xi*(cell+gap),y:12+lineIndex*69+ri*(cell+gap),w:cell,h:cell,region:'phrase-'+lineIndex})}));
   if(raw==='Á'||raw==='Ó')all.push({x:start+ci*advance+2*(cell+gap),y:12+lineIndex*69-7,w:cell,h:cell,region:'phrase-'+lineIndex});
  });
 });
 if(all.length<=TOTAL)return all;
 return Array.from({length:TOTAL},(_,i)=>all[Math.floor(i*all.length/TOTAL)]);
}
const PHRASE_CELLS=phraseCells();
const PHRASE_REGIONS=[0,1,2].map(i=>({id:'phrase-'+i,name:['JÁ LI O','LIVRO DE','MÓRMON'][i],chapters:PHRASE_CELLS.flatMap((cell,index)=>cell.region==='phrase-'+i?[CHAPTERS[index]]:[])}));
const TEMPLE_ZONES=[
 {id:'A',name:'Pináculo',count:9,cells:makeCells(174,18,1,9,12,10,'A')},
 {id:'B',name:'Torre',count:18,cells:makeCells(162,112,2,9,18,20,'B')},
 {id:'C',name:'Friso',count:16,cells:makeCells(144,248,4,4,18,20,'C')},
 {id:'D',name:'Corpo central',count:72,cells:makeCells(108,260,8,9,18,20,'D')},
 {id:'E1',name:'Ala esquerda',count:36,cells:makeCells(0,280,6,6,18,20,'E1')},
 {id:'E2',name:'Ala direita',count:36,cells:makeCells(252,280,6,6,18,20,'E2')},
 {id:'F',name:'Pórtico',count:24,cells:makeCells(126,440,6,4,18,20,'F')},
 {id:'G',name:'Base e degraus',count:28,cells:makeCells(54,520,14,2,18,20,'G')}
];
let cursor=0;
TEMPLE_ZONES.forEach(z=>{z.chapters=CHAPTERS.slice(cursor,cursor+z.count);cursor+=z.count;});
const CHAPEL_ZONES=[
 {id:'T',name:'Torre e pináculo',count:28,cells:makeCells(164,20,4,7,9,8,'T')},
 {id:'R',name:'Telhado e frontão',count:21,cells:makeCells(127,80,7,3,15,9,'R')},
 {id:'B',name:'Corpo da capela',count:144,cells:makeCells(18,112,18,8,18,9,'B')},
 {id:'L',name:'Ala esquerda',count:20,cells:makeCells(18,76,5,4,16,8,'L')},
 {id:'D',name:'Ala direita',count:20,cells:makeCells(262,76,5,4,16,8,'D')},
 {id:'S',name:'Base',count:6,cells:makeCells(126,187,6,1,18,8,'S')}
];
cursor=0;
CHAPEL_ZONES.forEach(z=>{z.chapters=CHAPTERS.slice(cursor,cursor+z.count);cursor+=z.count;});
function buildTempleCells(){let i=0;return TEMPLE_ZONES.flatMap(z=>z.cells.map(cell=>({...cell,chapter:CHAPTERS[i++],region:z.id})))}
function buildChapelCells(){let i=0;return CHAPEL_ZONES.flatMap(z=>z.cells.map(cell=>({...cell,chapter:CHAPTERS[i++],region:z.id})))}
const TEMPLE_CELLS=buildTempleCells(),CHAPEL_CELLS=buildChapelCells();
const fmtDate=s=>s?new Date(s+'T12:00:00').toLocaleDateString('pt-BR'):'—';

export default function ReadingPage({supabase,session,profile,onMessage=()=>{}}){
 const userId=session?.user?.id;
 const [progress,setProgress]=useState([]);
 const [settings,setSettings]=useState({active_color:COLORS[0],layout:'frase',started_on:null,goal_on:null,finished_on:null});
 const [pending,setPending]=useState([]);
 const [loading,setLoading]=useState(true);
 const [saving,setSaving]=useState(false);
 const [syncing,setSyncing]=useState(false);
 const [error,setError]=useState('');
 const [view,setView]=useState('desenho');
 const [activeRegion,setActiveRegion]=useState(null);
 const [showSettings,setShowSettings]=useState(false);
 const syncLock=useRef(false);
 const pendingRef=useRef([]);
 const done=progress.length;
 const progressMap=useMemo(()=>new Set(progress.map(p=>p.book_key+':'+p.chapter)),[progress]);
 const percent=Math.round(done/TOTAL*100);
 const groupedBooks=useMemo(()=>BOOKS.map(b=>({...b,chapters:CHAPTERS.filter(c=>c.book_key===b.key),read:progress.filter(p=>p.book_key===b.key).length})),[progress]);
 const applyQueue=(base,items)=>{let next=[...base];items.forEach(item=>{if(item.type==='settings')return;if(item.type==='delete')next=next.filter(p=>!(p.book_key===item.book_key&&p.chapter===item.chapter));else{next=next.filter(p=>!(p.book_key===item.row.book_key&&p.chapter===item.row.chapter));next.push(item.row)}});return next};
 const setQueue=items=>{pendingRef.current=items;setPending(items);if(userId)writeQueue(userId,items)};
 const load=useCallback(async()=>{
  if(!userId||!supabase)return;
  setLoading(true);setError('');
  const localQueue=parseQueue(userId);setQueue(localQueue);
  try{
   const [p,s]=await Promise.all([
    supabase.from('reading_progress').select('book_key,chapter,color,read_on').eq('user_id',userId),
    supabase.from('reading_settings').select('active_color,layout,started_on,goal_on,finished_on').eq('user_id',userId).maybeSingle()
   ]);
   if(p.error)throw p.error;if(s.error)throw s.error;
   const serverRows=p.data||[],visibleRows=applyQueue(serverRows,localQueue);
   setProgress(visibleRows);
   const defaults={active_color:COLORS[0],layout:'frase',started_on:null,goal_on:null,finished_on:null};
   const serverSettings={...defaults,...(s.data||{})},queuedSettings=localQueue.filter(x=>x.type==='settings').at(-1)?.settings||{};
   const stored={...serverSettings,...queuedSettings};
   const corrected={...stored,started_on:visibleRows.length&&!stored.started_on?TODAY():stored.started_on,finished_on:serverRows.length===TOTAL?(stored.finished_on||TODAY()):null};
   setSettings(corrected);
   if(JSON.stringify(corrected)!==JSON.stringify(serverSettings)){
    const {error:dateError}=await supabase.from('reading_settings').upsert({user_id:userId,...corrected,updated_at:new Date().toISOString()},{onConflict:'user_id'});
    if(dateError){setError('As datas de início/conclusão precisam ser sincronizadas: '+dateError.message);if(!localQueue.some(x=>x.type==='settings'))setQueue([...localQueue,{id:Date.now()+Math.random(),type:'settings',settings:corrected}]);}
    else setQueue(localQueue.filter(x=>x.type!=='settings'));
   }
  }catch(e){setError('Não foi possível consultar o Supabase. Confira se o SQL da Leitura já foi aplicado. '+(e.message||''));setProgress(applyQueue([],localQueue));const queuedSettings=localQueue.filter(x=>x.type==='settings').at(-1)?.settings;if(queuedSettings)setSettings(v=>({...v,...queuedSettings}));}
  finally{setLoading(false)}
 },[userId,supabase]);
 useEffect(()=>{load()},[load]);
 const reconcileDates=async(base)=>{
  const {count,error:countError}=await supabase.from('reading_progress').select('chapter',{count:'exact',head:true}).eq('user_id',userId);
  if(countError)return;
  const next={...base,started_on:base.started_on||(count>0?TODAY():null),finished_on:count===TOTAL?(base.finished_on||TODAY()):null};
  setSettings(next);
  const {error:saveError}=await supabase.from('reading_settings').upsert({user_id:userId,...next,updated_at:new Date().toISOString()},{onConflict:'user_id'});
  if(saveError){const item={id:Date.now()+Math.random(),type:'settings',settings:next};setQueue([...pendingRef.current.filter(x=>x.type!=='settings'),item]);}
  else setQueue(pendingRef.current.filter(x=>x.type!=='settings'));
 };
 const flushPending=useCallback(async()=>{
  if(!userId||!supabase||!navigator.onLine||syncLock.current||!pendingRef.current.length)return;
  syncLock.current=true;setSyncing(true);
  let remaining=[...pendingRef.current];
  for(const item of [...remaining]){
   let result;
   if(item.type==='settings')result=await supabase.from('reading_settings').upsert({user_id:userId,...item.settings,updated_at:new Date().toISOString()},{onConflict:'user_id'});
   else if(item.type==='delete')result=await supabase.from('reading_progress').delete().eq('user_id',userId).eq('book_key',item.book_key).eq('chapter',item.chapter);
   else result=await supabase.from('reading_progress').upsert(item.row,{onConflict:'user_id,book_key,chapter'});
   if(result.error)break;
   remaining=remaining.filter(x=>x.id!==item.id);setQueue(remaining);
  }
  syncLock.current=false;setSyncing(false);
  if(!remaining.length){await reconcileDates(settings);onMessage('Leitura sincronizada com o Supabase.');}
 },[userId,supabase,onMessage,settings]);
 useEffect(()=>{const online=()=>flushPending();window.addEventListener('online',online);const id=window.setInterval(()=>flushPending(),15000);return()=>{window.removeEventListener('online',online);window.clearInterval(id)}},[flushPending]);
 const saveSettings=async next=>{
  setSettings(next);setSaving(true);
  const {error:e}=await supabase.from('reading_settings').upsert({user_id:userId,...next,updated_at:new Date().toISOString()},{onConflict:'user_id'});
  setSaving(false);
  if(e){const item={id:Date.now()+Math.random(),type:'settings',settings:next};setQueue([...pendingRef.current.filter(x=>x.type!=='settings'),item]);setError('Configurações pendentes de sincronização: '+e.message);return false}
  setQueue(pendingRef.current.filter(x=>x.type!=='settings'));return true;
 };
 const toggleChapter=async chapter=>{
  const key=chapter.book_key+':'+chapter.chapter,wasRead=progressMap.has(key),nextRead=!wasRead;
  const now=TODAY(),nextRows=nextRead?[...progress.filter(p=>p.book_key!==chapter.book_key||p.chapter!==chapter.chapter),{user_id:userId,book_key:chapter.book_key,chapter:chapter.chapter,color:settings.active_color,read_on:now}]:progress.filter(p=>p.book_key!==chapter.book_key||p.chapter!==chapter.chapter);
  setProgress(nextRows);
  const nextSettings={...settings,started_on:settings.started_on||now,finished_on:nextRead&&nextRows.length===TOTAL?now:nextRows.length<TOTAL?null:settings.finished_on};
  if(nextRows.length===TOTAL&&!settings.finished_on)nextSettings.finished_on=now;
  setSettings(nextSettings);
  const row={user_id:userId,book_key:chapter.book_key,chapter:chapter.chapter,color:settings.active_color,read_on:now};
  const item=nextRead?{id:Date.now()+Math.random(),type:'upsert',row}:{id:Date.now()+Math.random(),type:'delete',book_key:chapter.book_key,chapter:chapter.chapter};
  const nextQueue=[...pendingRef.current.filter(x=>!(x.type==='upsert'?x.row.book_key===chapter.book_key&&x.row.chapter===chapter.chapter:x.book_key===chapter.book_key&&x.chapter===chapter.chapter)),item];
  setQueue(nextQueue);
  if(navigator.onLine){
   const result=nextRead?await supabase.from('reading_progress').upsert(row,{onConflict:'user_id,book_key,chapter'}):await supabase.from('reading_progress').delete().eq('user_id',userId).eq('book_key',chapter.book_key).eq('chapter',chapter.chapter);
   if(!result.error){setQueue(pendingRef.current.filter(x=>x.id!==item.id));await reconcileDates(nextSettings);}
   else setError('Marcação pendente de sincronização: '+result.error.message);
  }else setError('Sem conexão: marcação pendente no aparelho, ainda não confirmada pelo Supabase.');
  const {error:settingsError}=await supabase.from('reading_settings').upsert({user_id:userId,...nextSettings,updated_at:new Date().toISOString()},{onConflict:'user_id'});
  if(settingsError){const item={id:Date.now()+Math.random(),type:'settings',settings:nextSettings};setQueue([...pendingRef.current.filter(x=>x.type!=='settings'),item]);setError('Progresso marcado, mas as datas/configurações aguardam sincronização: '+settingsError.message);}
 };
 const colorChapter=async(chapter,color)=>{
  const row={user_id:userId,book_key:chapter.book_key,chapter:chapter.chapter,color,read_on:TODAY()};
  setProgress(old=>old.map(p=>p.book_key===chapter.book_key&&p.chapter===chapter.chapter?{...p,color}:p));
  const result=await supabase.from('reading_progress').upsert(row,{onConflict:'user_id,book_key,chapter'});
  if(result.error){const item={id:Date.now()+Math.random(),type:'upsert',row};setQueue([...pendingRef.current.filter(x=>!(x.type==='upsert'&&x.row.book_key===row.book_key&&x.row.chapter===row.chapter)),item]);setError('Cor pendente de sincronização.');}
 };
 const openRegion=(id,name,chapters)=>setActiveRegion({id,name,chapters});
 const renderPhrase=()=>{
  const lines=['JÁ LI O','LIVRO DE','MÓRMON'];
  return <svg className="reading-art phrase-art" viewBox="0 0 360 210" role="img" aria-label="Frase Já li o Livro de Mórmon formada por 239 capítulos">
   {lines.map((line,i)=><text key={line} x="180" y={59+i*69} textAnchor="middle" className="phrase-label">{line}</text>)}
   {PHRASE_CELLS.map((cell,i)=>{const chapter=CHAPTERS[i],read=progressMap.has(chapter.book_key+':'+chapter.chapter),region=PHRASE_REGIONS.find(r=>r.id===cell.region);return <rect key={i} x={cell.x} y={cell.y} width={cell.w} height={cell.h} rx="1" fill={read?settings.active_color:'#fff'} stroke={read?settings.active_color:'#9baca1'} strokeWidth=".8" onClick={()=>openRegion(region.id,region.name,region.chapters)} className="reading-cell" aria-label={chapter.book_name+' capítulo '+chapter.chapter}/>})}
  </svg>
 };
 const renderTemple=()=> <svg className="reading-art temple-art" viewBox="0 0 360 560" role="img" aria-label="Templo de Teresina dividido em 239 capítulos">
  <g className="temple-outline" fill="none" stroke="#6e8b7b" strokeWidth="2"><path d="M176 8h8v104h-8z M162 112h36v136h-36z M72 248h216v12H72z M108 260h144v180H108z M0 280h108v120H0z M252 280h108v120H252z M126 440h108v80H126z M54 520h252v40H54z"/><path d="M180 8l-8 10h16z M72 248l36-22h144l36 22"/></g>
  {TEMPLE_CELLS.map((cell,i)=>{const chapter=cell.chapter,read=progressMap.has(chapter.book_key+':'+chapter.chapter),zone=TEMPLE_ZONES.find(z=>z.id===cell.region);return <rect key={i} x={cell.x} y={cell.y} width={cell.w} height={cell.h} rx="1" fill={read?settings.active_color:'#fff'} stroke={read?settings.active_color:'#9baca1'} strokeWidth=".8" className="reading-cell" onClick={()=>openRegion(cell.region,zone.name,zone.chapters)}/>})}
 </svg>;
 const renderChapel=()=> <svg className="reading-art chapel-art" viewBox="0 0 360 230" role="img" aria-label="Logo oficial da Estaca Horto dividida em 239 capítulos">
  <image href="/logo-estaca.svg" x="0" y="0" width="360" height="230" opacity=".62"/>
  {CHAPEL_CELLS.map((cell,i)=>{const chapter=cell.chapter,read=progressMap.has(chapter.book_key+':'+chapter.chapter),zone=CHAPEL_ZONES.find(z=>z.id===cell.region);return <rect key={i} x={cell.x} y={cell.y} width={cell.w} height={cell.h} rx="1" fill={read?settings.active_color:'#ffffff'} fillOpacity={read ? 0.9 : 0.48} stroke={read?settings.active_color:'#82988c'} strokeWidth=".6" className="reading-cell" onClick={()=>openRegion(cell.region,zone.name,zone.chapters)}/>})}
 </svg>;
 const currentLayout=settings.layout||'frase';
 const regions=currentLayout==='templo'?TEMPLE_ZONES:currentLayout==='capela'?CHAPEL_ZONES:null;
 const activeRegionData=activeRegion;
 const regionDone=activeRegionData?.chapters.filter(c=>progressMap.has(c.book_key+':'+c.chapter)).length||0;
 const bulk=async(chapters,read)=>{
  const selected=new Set(chapters.map(c=>c.book_key+':'+c.chapter));
  const current=new Map(progress.map(p=>[p.book_key+':'+p.chapter,p]));
  const now=TODAY(),nextRows=progress.filter(p=>!selected.has(p.book_key+':'+p.chapter));
  const ops=[];
  chapters.forEach(ch=>{
   const key=ch.book_key+':'+ch.chapter,exists=current.has(key);
   if(read&&!exists){const row={user_id:userId,book_key:ch.book_key,chapter:ch.chapter,color:settings.active_color,read_on:now};nextRows.push(row);ops.push({type:'upsert',row});}
   if(!read&&exists)ops.push({type:'delete',book_key:ch.book_key,chapter:ch.chapter});
  });
  if(!ops.length)return;
  setProgress(nextRows);
  const nextSettings={...settings,started_on:settings.started_on||(read?now:null),finished_on:read&&nextRows.length===TOTAL?now:nextRows.length<TOTAL?null:settings.finished_on};
  setSettings(nextSettings);
  let queue=[...pendingRef.current];
  for(const op of ops){const key=op.type==='upsert'?op.row.book_key+':'+op.row.chapter:op.book_key+':'+op.chapter;queue=queue.filter(x=>(x.type==='upsert'?x.row.book_key+':'+x.row.chapter:x.book_key+':'+x.chapter)!==key);queue.push({id:Date.now()+Math.random(),...op});}
  setQueue(queue);
  if(navigator.onLine){
   let remaining=[...queue];
   for(const item of queue){
    const result=item.type==='upsert'?await supabase.from('reading_progress').upsert(item.row,{onConflict:'user_id,book_key,chapter'}):await supabase.from('reading_progress').delete().eq('user_id',userId).eq('book_key',item.book_key).eq('chapter',item.chapter);
    if(result.error){setError('Algumas marcações da região aguardam sincronização: '+result.error.message);break;}
    remaining=remaining.filter(x=>x.id!==item.id);setQueue(remaining);
   }
  }else setError('Sem conexão: alterações da região aguardam confirmação do Supabase.');
  const {error:settingsError}=await supabase.from('reading_settings').upsert({user_id:userId,...nextSettings,updated_at:new Date().toISOString()},{onConflict:'user_id'});
  if(settingsError){const item={id:Date.now()+Math.random(),type:'settings',settings:nextSettings};setQueue([...pendingRef.current.filter(x=>x.type!=='settings'),item]);setError('Datas do progresso aguardam sincronização: '+settingsError.message);}
 };
 const goalText=()=>{
  if(!settings.goal_on)return 'Defina uma data-meta para acompanhar seu ritmo.';
  const remain=TOTAL-done,goal=new Date(settings.goal_on+'T12:00:00'),today=new Date(TODAY()+'T12:00:00'),days=Math.ceil((goal-today)/86400000);
  if(remain===0)return 'Livro concluído!';
  if(days<0)return 'Meta vencida: faltam '+remain+' capítulos.';
  if(days===0)return 'Meta é hoje: faltam '+remain+' capítulos.';
  return 'Faltam '+remain+' capítulos · aproximadamente '+Math.ceil(remain/days)+' por dia.';
 };
 if(loading)return <section className="reading-page"><p>Carregando seu progresso de leitura…</p></section>;
 return <section className="reading-page">
  <div className="reading-heading"><div><span className="reading-eyebrow">PROGRESSO PESSOAL</span><h2>Leitura do Livro de Mórmon</h2><p>Uma jornada pessoal, capítulo por capítulo.</p></div><button className="reading-secondary" onClick={()=>setShowSettings(v=>!v)}>{showSettings?'Fechar ajustes':'Ajustes'}</button></div>
  {error&&<div className="reading-alert">{error}</div>}
  <div className="reading-progress-card"><div className="reading-progress-top"><strong>{done} de {TOTAL} capítulos</strong><b>{percent}%</b></div><div className="reading-progress-track"><span style={{width:percent+'%',background:settings.active_color}}/></div><div className="reading-progress-foot"><span>Início: {fmtDate(settings.started_on)}</span><span>Conclusão: {fmtDate(settings.finished_on)}</span></div><p>{goalText()}</p></div>
  {showSettings&&<div className="reading-settings"><label>Visualização<select value={settings.layout} onChange={e=>saveSettings({...settings,layout:e.target.value})}><option value="frase">Frase</option><option value="templo">Templo de Teresina</option><option value="capela">Logo da Estaca Horto</option></select></label><label>Cor das marcações<div className="reading-colors">{COLORS.map(c=><button key={c} aria-label={'Selecionar cor '+c} className={settings.active_color===c?'chosen':''} style={{background:c}} onClick={()=>saveSettings({...settings,active_color:c})}/>)}</div></label><label>Data-meta<input type="date" value={settings.goal_on||''} onChange={e=>saveSettings({...settings,goal_on:e.target.value||null})}/></label><small>{saving?'Salvando ajustes…':'Os ajustes são pessoais e ficam vinculados à sua conta.'}</small></div>}
  <div className="reading-view-tabs"><button className={view==='desenho'?'active':''} onClick={()=>setView('desenho')}>Desenho</button><button className={view==='lista'?'active':''} onClick={()=>setView('lista')}>Lista de capítulos</button></div>
  {view==='desenho'&&<div className="reading-art-card">
   {currentLayout==='frase'?renderPhrase():currentLayout==='templo'?renderTemple():renderChapel()}
   <p>Toque em uma região para ampliar e marcar os capítulos. Os três desenhos usam o mesmo progresso.</p>
   {regions&&<div className="reading-region-links">{regions.map(z=><button key={z.id} onClick={()=>openRegion(z.id,z.name,z.chapters)}>{z.name} <span>{z.chapters.filter(c=>progressMap.has(c.book_key+':'+c.chapter)).length}/{z.count}</span></button>)}</div>}
  </div>}
  {view==='lista'&&<div className="reading-book-list">{groupedBooks.map(book=><details key={book.key}><summary><span>{book.name}</span><b>{book.read}/{book.count}</b></summary><div className="reading-chapter-grid">{book.chapters.map(c=>{const read=progressMap.has(c.book_key+':'+c.chapter);return <button key={c.chapter} className={read?'read':''} style={read?{background:settings.active_color,borderColor:settings.active_color}:undefined} onClick={()=>toggleChapter(c)} aria-label={book.name+' capítulo '+c.chapter}>{c.chapter}</button>})}</div></details>)}</div>}
  {pending.length>0&&<div className="reading-pending"><span>{pending.length} alteração(ões) aguardando confirmação do Supabase.</span><button onClick={flushPending} disabled={syncing}>{syncing?'Sincronizando…':'Tentar sincronizar'}</button></div>}
  {activeRegionData&&<div className="reading-sheet-backdrop" onClick={()=>setActiveRegion(null)}><section className="reading-sheet" onClick={e=>e.stopPropagation()}><div className="reading-sheet-grab"/><div className="reading-sheet-head"><div><small>REGIÃO AMPLIADA</small><h3>{activeRegionData.name}</h3><p>{regionDone} de {activeRegionData.chapters.length} capítulos lidos</p></div><button onClick={()=>setActiveRegion(null)} aria-label="Fechar">×</button></div><div className="reading-sheet-actions"><button onClick={()=>bulk(activeRegionData.chapters,true)}>Marcar região como lida</button><button onClick={()=>bulk(activeRegionData.chapters,false)}>Desmarcar região</button></div><div className="reading-sheet-grid">{activeRegionData.chapters.map(c=>{const read=progressMap.has(c.book_key+':'+c.chapter);return <button key={c.book_key+':'+c.chapter} className={read?'read':''} style={read?{background:settings.active_color,borderColor:settings.active_color}:undefined} onClick={()=>toggleChapter(c)}><b>{c.chapter}</b><small>{c.book_name}</small></button>})}</div></section></div>}
 </section>
}
