/* Admin Panel logic. Everything you change here is saved and shown on the website pages. */
(function(){
var S=window.SITE,esc=S.esc;
function $(s,c){return(c||document).querySelector(s)}
var LC='rm_admin_cred',SSK='rm_admin_ok';
var srvMax=500,srvChunk=1048576,UP={},pendingDel=[];
var mode='local',draft=null,dirty=false,cur='dash',srvDefault=false,openKey=null;

/* ---------- storage helpers (never crash if the browser blocks storage) ---------- */
var store={get:function(k){try{return localStorage.getItem(k)}catch(e){return null}},set:function(k,v){try{localStorage.setItem(k,v);return true}catch(e){return false}},del:function(k){try{localStorage.removeItem(k)}catch(e){}}};
var sess={get:function(k){try{return sessionStorage.getItem(k)}catch(e){return null}},set:function(k,v){try{sessionStorage.setItem(k,v)}catch(e){}},del:function(k){try{sessionStorage.removeItem(k)}catch(e){}}};

/* ---------- login (local test mode) ---------- */
function hash(s){var h1=0xdeadbeef,h2=0x41c6ce57,c;s='rm:'+s;for(var i=0;i<s.length;i++){c=s.charCodeAt(i);h1=Math.imul(h1^c,2654435761);h2=Math.imul(h2^c,1597334677)}h1=Math.imul(h1^(h1>>>16),2246822507)^Math.imul(h2^(h2>>>13),3266489909);h2=Math.imul(h2^(h2>>>16),2246822507)^Math.imul(h1^(h1>>>13),3266489909);return(4294967296*(2097151&h2)+(h1>>>0)).toString(36)}
var DEF={user:'admin',hash:hash('Admin@123')};
function cred(){try{var c=JSON.parse(store.get(LC));if(c&&c.user&&c.hash)return c}catch(e){}return DEF}
function localOK(u,p){var c=cred();return u===c.user&&hash(p)===c.hash}
function isDefault(){if(mode==='server')return srvDefault;var c=cred();return c.user===DEF.user&&c.hash===DEF.hash}

/* ---------- server (your hosting's api.php, used automatically when it exists) ---------- */
function api(a,body){return fetch('api.php?action='+a,{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json','X-Requested-With':'rm-admin'},body:JSON.stringify(body||{})}).then(function(r){return r.text().then(function(t){var j=null;try{j=JSON.parse(t)}catch(e){}return{status:r.status,json:j}})})}
function ping(){return fetch('api.php?action=ping',{cache:'no-store',credentials:'same-origin'}).then(function(r){return r.json()}).then(function(j){return j&&j.php?j:null}).catch(function(){return null})}

/* ---------- small utilities ---------- */
function getp(o,p){return p.split('.').reduce(function(a,k){return a==null?a:a[k]},o)}
function setp(o,p,v){var k=p.split('.'),l=k.pop(),t=k.reduce(function(a,x){return a[x]},o);t[l]=v}
var tt;function toast(m,err){var t=$('#toast');t.textContent=m;t.className='show'+(err?' err':'');clearTimeout(tt);tt=setTimeout(function(){t.className=''},err?6500:4200)}
function setDirty(v){dirty=v!==false;$('#dirty').hidden=!dirty;$('#save').disabled=!dirty}
addEventListener('beforeunload',function(e){if(dirty){e.preventDefault();e.returnValue=''}});
function download(name,text,type){var a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type:type||'text/plain'}));a.download=name;document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove()},500)}

/* ---------- definitions ---------- */
var NAV=[['dash','Dashboard'],['home','Home Page'],['portfolio','Portfolio Page'],['about','About Page'],['services','Services Page'],['awards','Awards Page'],['contact','Contact & Social'],['images','Images'],['themes','Color Themes'],['settings','Settings & Security']];
var FILE={home:'index.html',portfolio:'portfolio.html',about:'about.html',services:'services.html',awards:'awards.html',contact:'contact.html'};
var ICONLIST=[['cut','Scissors (editing)'],['reel','Phone (reels)'],['color','Sliders (color)'],['motion','Screen (motion)'],['sound','Speaker (sound)'],['grow','Growth chart'],['trophy','Trophy'],['star','Star'],['mic','Microphone']];
var LISTS={
 services:{noun:'service',t:function(i){return i.title||'Untitled service'},f:[['icon','Icon','icon'],['title','Service name'],['desc','Short description','long'],['price','Starting price (type it as it should appear, e.g. $150)'],['unit','Price unit (e.g. per video, per month)']],mk:function(){return{icon:'cut',title:'New service',desc:'',price:'$0',unit:'per project'}}},
 awards:{noun:'award',t:function(i){return i.title||'Untitled award'},f:[['icon','Icon','icon'],['year','Year (leave empty to hide it)'],['title','Award name'],['by','Given by'],['why','Why it matters','long']],mk:function(){return{icon:'trophy',year:'',title:'New award',by:'',why:''}}},
 projects:{noun:'project',t:function(i){return i.title||'Untitled project'},f:[['title','Project title'],['cat','Category','cat'],['desc','One-line description','long'],['detail','Longer description (shown when a visitor opens the project)','long'],['clientName','Client name (optional)'],['projectDate','Project date (optional)','date'],['home','Featured Project (shows in the Home page "Featured work")','bool'],['img','Thumbnail image (the cover picture)','image'],['video','Project video','video']],mk:function(){return{id:'p'+Date.now(),cat:'yt',t:1+Math.floor(Math.random()*6),img:'',title:'New project',desc:'',detail:'',clientName:'',projectDate:'',home:false,videoUrl:'',videoName:'',videoSize:0}}},
 testimonials:{noun:'testimonial',t:function(i){return i.name||'New testimonial'},f:[['quote','Quote','long'],['name','Client name'],['role','Client role / company']],mk:function(){return{quote:'',name:'Client name',role:''}}},
 timeline:{noun:'milestone',t:function(i){return i.title||'New milestone'},f:[['title','Milestone'],['desc','One-line description','long']],mk:function(){return{title:'New milestone',desc:''}}},
 skills:{noun:'skill',t:function(i){return i.name||'New skill'},f:[['name','Skill name'],['value','Skill level','range']],mk:function(){return{name:'New skill',value:80}}}
};

/* ---------- form builders ---------- */
function imgField(p,label,v,t,max,ph){
 return'<div class="f wide"><span>'+label+'</span><div class="imgrow"><div class="imgbox'+(ph?' tall':'')+'">'+(v?'<img src="'+esc(v)+'" alt="">':ph?'<img src="'+ph+'" alt=""><em>Placeholder</em>':'<span class="tb t'+(t||1)+'" style="position:absolute;inset:0"></span><em>Placeholder</em>')+'</div><div class="ib"><button type="button" class="btn sm" data-act="img-up" data-p="'+p+'" data-max="'+(max||1000)+'">Upload / change image</button>'+(v?'<button type="button" class="btn ghost sm" data-act="img-rm" data-p="'+p+'">Use placeholder</button>':'')+'</div></div></div>'}
function field(p,label,type,v,o){o=o||{};
 if(v==null)v='';
 if(type==='long')return'<label class="f wide"><span>'+label+'</span><textarea rows="3" data-p="'+p+'">'+esc(v)+'</textarea></label>';
 if(type==='icon')return'<label class="f"><span>'+label+'</span><select data-p="'+p+'">'+ICONLIST.map(function(i){return'<option value="'+i[0]+'"'+(i[0]===v?' selected':'')+'>'+i[1]+'</option>'}).join('')+'</select></label>';
 if(type==='cat')return'<label class="f"><span>'+label+'</span><select data-p="'+p+'">'+['yt','reels','cg'].map(function(k){return'<option value="'+k+'"'+(k===v?' selected':'')+'>'+esc(draft.text['portfolio.tab.'+k])+'</option>'}).join('')+'</select></label>';
 if(type==='bool')return'<label class="f chk wide"><input type="checkbox" data-p="'+p+'"'+(v?' checked':'')+'><span>'+label+'</span></label>';
 if(type==='range')return'<label class="f wide"><span>'+label+': <b class="rv">'+v+'</b>%</span><input type="range" min="0" max="100" data-p="'+p+'" data-num value="'+v+'"></label>';
 if(type==='image')return imgField(p,label,v,o.t,1000);
 if(type==='date')return'<label class="f"><span>'+label+'</span><input type="date" data-p="'+p+'" value="'+esc(v)+'"></label>';
 if(type==='video')return videoField(o.it,o.i);
 return'<label class="f"><span>'+label+'</span><input data-p="'+p+'" value="'+esc(v)+'"></label>'}
function texts(page,group){
 return'<div class="g2">'+S.SCHEMA.filter(function(r){return r[0]===page&&r[4]===group}).map(function(r){var v=draft.text[r[1]]==null?'':draft.text[r[1]];
  return r[3]==='long'?'<label class="f wide"><span>'+esc(r[2])+'</span><textarea rows="'+(String(v).length>130?4:2)+'" data-tk="'+r[1]+'">'+esc(v)+'</textarea></label>':'<label class="f"><span>'+esc(r[2])+'</span><input data-tk="'+r[1]+'" value="'+esc(v)+'"></label>'}).join('')+'</div>'}
function list(name){
 var L=LISTS[name],arr=draft[name];
 return'<div class="list">'+(arr.length?'':'<p class="empty">Nothing here yet. Use the button below to add one.</p>')+arr.map(function(it,i){
  var k=name+i,badge=name==='projects'?'<span class="pbadge'+(it.videoUrl?' v':'')+'">'+(it.videoUrl?'Thumbnail + Video':'Thumbnail only')+'</span>':'',mini=name==='projects'?'<span class="mini">'+(it.img?'<img src="'+esc(it.img)+'" alt="">':'<span class="tb t'+(it.t||1)+'" style="position:absolute;inset:0"></span>')+'</span>':'';
  return'<details class="item" data-k="'+k+'"'+(openKey===k?' open':'')+'><summary>'+mini+'<b>'+esc(L.t(it))+'</b>'+badge+'<span class="ia"><button type="button" data-act="up" data-l="'+name+'" data-i="'+i+'" title="Move up">&#9650;</button><button type="button" data-act="down" data-l="'+name+'" data-i="'+i+'" title="Move down">&#9660;</button><button type="button" class="del" data-act="del" data-l="'+name+'" data-i="'+i+'">Remove</button></span></summary><div class="g2">'+
  L.f.map(function(f){return field(name+'.'+i+'.'+f[0],f[1],f[2]||'text',it[f[0]],{t:it.t,it:it,i:i})}).join('')+'</div></details>'}).join('')+
  '<button type="button" class="btn sm" data-act="add" data-l="'+name+'">+ Add '+L.noun+'</button></div>'}
function sec(title,desc,body){return'<section class="card"><h3>'+title+'</h3>'+(desc?'<p class="d">'+desc+'</p>':'')+body+'</section>'}
function head(title,desc,page){return'<div class="ph"><div><h2>'+title+'</h2><p>'+desc+'</p></div>'+(FILE[page]?'<a class="btn ghost sm" href="'+FILE[page]+'" target="_blank" rel="noopener">View live page &#8599;</a>':'')+'</div>'}
function note(t){return'<div class="info">'+t+'</div>'}


/* ---------- project videos ---------- */
function fmt(n){return n>=1073741824?(n/1073741824).toFixed(2)+' GB':n>=1048576?(n/1048576).toFixed(1)+' MB':Math.max(1,Math.round(n/1024))+' KB'}
function baseName(u){try{return decodeURIComponent(String(u).split('?')[0].split('/').pop())}catch(e){return String(u)}}
function videoField(it,i){
 var id=it.id,u=UP[id]||{},has=!!it.videoUrl,idb=/^idb:/.test(it.videoUrl||''),info;
 if(u.busy)info='<div class="vinfo"><b>Uploading:</b> '+esc(u.name)+'<br><b>Size:</b> '+fmt(u.size)+'</div>';
 else if(has)info='<div class="vinfo"><b>Video:</b> '+esc(it.videoName||baseName(it.videoUrl))+'<br><b>Size:</b> '+(it.videoSize?fmt(it.videoSize):'Not known (linked file)')+'<br><b>Status:</b> '+(idb?'Stored in this browser (test mode)':'Uploaded')+'</div>';
 else info='<div class="vinfo none">No video yet. This project shows its thumbnail only.</div>';
 var prog='<div class="vprog"'+(u.busy?'':' hidden')+' data-vp="'+id+'"><i style="width:'+(u.pct||0)+'%"></i></div>';
 var stat='<p class="vstat'+(u.err?' bad':u.ok?' good':'')+'" data-vs="'+id+'">'+esc(u.msg||'')+'</p>';
 var btns=u.busy?'<button type="button" class="btn ghost sm" data-act="vid-cancel" data-id="'+id+'">Cancel upload</button>':has?'<button type="button" class="btn sm" data-act="vid-up" data-id="'+id+'">Replace Video</button><button type="button" class="btn ghost sm danger" data-act="vid-rm" data-id="'+id+'">Delete Video</button>':'<button type="button" class="btn sm" data-act="vid-up" data-id="'+id+'">Upload Project Video</button>';
 var note=mode==='server'?'Max '+fmt(srvMax*1048576)+'. MP4, MOV or WebM. Large files upload in small pieces, so they are safe to send.':'Test mode: the video is kept in this browser only. Once your website is on hosting with PHP, videos upload to your server automatically.';
 return'<div class="f wide vwid"><span>Project video (actual video file)</span>'+info+prog+stat+'<div class="ib">'+btns+'</div><small class="vnote">'+note+'</small>'+
  '<label class="f vlink"><span>Or link a video that is already online (a path like uploads/videos/my-edit.mp4, or a https:// link to your storage service)</span><input data-p="projects.'+i+'.videoUrl" placeholder="uploads/videos/my-edit.mp4" value="'+(idb?'':esc(it.videoUrl||''))+'"></label></div>'}
function validVideo(f){
 var ext=(f.name.split('.').pop()||'').toLowerCase();
 if(['mp4','mov','webm'].indexOf(ext)<0||(f.type&&['video/mp4','video/quicktime','video/webm'].indexOf(f.type)<0))return'That file type is not supported. Please choose an MP4, MOV or WebM video.';
 if(!f.size)return'That file is empty.';
 var max=(mode==='server'?srvMax:2048)*1048576;
 if(f.size>max)return'This video is '+fmt(f.size)+' but the limit here is '+fmt(max)+'. Compress it first (a free tool such as HandBrake works well), or upload it elsewhere and paste its link below.';
 return''}
function prog(id,pct,msg){var u=UP[id];if(!u)return;u.pct=pct;u.msg=msg;var bar=document.querySelector('[data-vp="'+id+'"]'),s=document.querySelector('[data-vs="'+id+'"]');if(bar){bar.hidden=false;bar.firstChild.style.width=pct+'%'}if(s)s.textContent=msg}
function fatal(m){var e=new Error(m);e.fatal=1;return e}
function sleep(ms){return new Promise(function(r){setTimeout(r,ms)})}
async function sendChunks(f,id){
 var CH=srvChunk,total=Math.max(1,Math.ceil(f.size/CH)),uid='',k;
 for(k=0;k<16;k++)uid+='0123456789abcdef'.charAt(Math.floor(Math.random()*16));
 for(var i=0;i<total;i++){
  if(UP[id].cancel)throw{cancel:1};
  var end=Math.min(f.size,(i+1)*CH),fd=new FormData(),ok=false;
  fd.append('uid',uid);fd.append('index',i);fd.append('chunk',f.slice(i*CH,end),'chunk.bin');
  for(var t=0;t<3&&!ok;t++){
   try{var r=await fetch('api.php?action=video_chunk',{method:'POST',credentials:'same-origin',headers:{'X-Requested-With':'rm-admin'},body:fd}),j=null;try{j=await r.json()}catch(x){}
    if(r.ok&&j&&j.ok){ok=true;break}
    if(r.status===401)throw fatal('Your session expired. Please sign in again.');
    if(j&&j.error&&r.status<500)throw fatal(j.error);
   }catch(e){if(e.fatal)throw e}
   await sleep(700*(t+1));
  }
  if(!ok)throw fatal('The upload was interrupted. Check your connection and try again.');
  var pc=Math.round(end/f.size*95);prog(id,pc,'Uploading\u2026 '+pc+'%  ('+fmt(end)+' of '+fmt(f.size)+')');
 }
 prog(id,97,'Finishing\u2026');
 var d=await api('video_done',{uid:uid,total:total,name:f.name,size:f.size});
 if(!(d.json&&d.json.ok))throw fatal((d.json&&d.json.error)||'The server could not finish the upload.');
 return{url:d.json.path,size:d.json.size}}
async function storeLocal(f,id){
 if(!window.indexedDB)throw fatal('This browser cannot keep videos in test mode. Use another browser, or upload to your hosting.');
 var key='v'+Date.now().toString(36)+Math.random().toString(36).slice(2,8);
 prog(id,40,'Saving the video in this browser\u2026');
 try{await S.VID.put(key,f)}catch(e){throw fatal('This browser ran out of storage for the video. Try a smaller file, or use hosting with PHP so videos are stored on the server.')}
 return{url:'idb:'+key,size:f.size}}
async function startVideo(id){
 var pr=draft.projects.filter(function(p){return p.id===id})[0];if(!pr)return;
 var f=await pickFile('video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm');if(!f)return;
 var bad=validVideo(f),u=UP[id]={busy:false,pct:0,msg:'',name:f.name,size:f.size};
 if(bad){u.err=true;u.msg=bad;draw(true);toast(bad,true);return}
 u.busy=true;u.msg='Starting upload\u2026';draw(true);
 try{
  var res=mode==='server'?await sendChunks(f,id):await storeLocal(f,id);
  if(pr.videoUrl&&pr.videoUrl!==res.url)pendingDel.push(pr.videoUrl);
  pr.videoUrl=res.url;pr.videoName=f.name.replace(/[<>"']/g,'');pr.videoSize=res.size||f.size;
  u.busy=false;u.ok=true;u.err=false;u.pct=100;u.msg=mode==='server'?'Upload complete. Click Save changes to put it on your website.':'Stored in this browser. Click Save changes.';
  setDirty();toast('Video uploaded. Click Save changes to put it on your website.');
 }catch(e){u.busy=false;u.ok=false;if(e&&e.cancel){u.msg='Upload cancelled.'}else{u.err=true;u.msg=(e&&e.fatal&&e.message)||'The upload failed. Please try again.';toast(u.msg,true)}}
 draw(true)}
async function flushDeletes(){
 var used={};draft.projects.forEach(function(p){if(p.videoUrl)used[p.videoUrl]=1});
 var todo=pendingDel.filter(function(u){return u&&!used[u]});pendingDel=[];
 for(var i=0;i<todo.length;i++){var u=todo[i];
  if(/^idb:/.test(u)){try{await S.VID.del(u.slice(4))}catch(e){}}
  else if(mode==='server'&&/^uploads\/videos\/[a-f0-9]{16}\.(mp4|mov|webm)$/.test(u)){try{await api('video_delete',{path:u})}catch(e){}}}}


/* ---------- publish bundle: one zip with data/site-data.js plus every image and video as a real file ---------- */
var CRCT=(function(){var t=[],c,n,k;for(n=0;n<256;n++){c=n;for(k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0}return t})();
function crc32(u){var c=0xFFFFFFFF;for(var i=0;i<u.length;i++)c=CRCT[(c^u[i])&255]^(c>>>8);return(c^0xFFFFFFFF)>>>0}
function zipStore(files){
 var parts=[],cen=[],off=0,csz=0,enc=new TextEncoder();
 files.forEach(function(f){var nm=enc.encode(f.name),crc=crc32(f.data),sz=f.data.length;
  var h=new DataView(new ArrayBuffer(30));h.setUint32(0,0x04034b50,true);h.setUint16(4,20,true);h.setUint16(6,0x0800,true);h.setUint16(12,0x21,true);h.setUint32(14,crc,true);h.setUint32(18,sz,true);h.setUint32(22,sz,true);h.setUint16(26,nm.length,true);
  parts.push(h.buffer,nm,f.data);
  var c=new DataView(new ArrayBuffer(46));c.setUint32(0,0x02014b50,true);c.setUint16(4,20,true);c.setUint16(6,20,true);c.setUint16(8,0x0800,true);c.setUint16(14,0x21,true);c.setUint32(16,crc,true);c.setUint32(20,sz,true);c.setUint32(24,sz,true);c.setUint16(28,nm.length,true);c.setUint32(42,off,true);
  cen.push(c.buffer,nm);csz+=46+nm.length;off+=30+nm.length+sz});
 var e=new DataView(new ArrayBuffer(22));e.setUint32(0,0x06054b50,true);e.setUint16(8,files.length,true);e.setUint16(10,files.length,true);e.setUint32(12,csz,true);e.setUint32(16,off,true);
 return new Blob(parts.concat(cen,[e.buffer]),{type:'application/zip'})}
function hex(n){var o='';for(var i=0;i<n;i++)o+='0123456789abcdef'.charAt(Math.floor(Math.random()*16));return o}
function dataBytes(u){var b=atob(u.split(',')[1]),a=new Uint8Array(b.length);for(var i=0;i<b.length;i++)a[i]=b.charCodeAt(i);return a}
async function buildBundle(){
 var ex=S.clone(draft),files=[],big=[],lost=0;
 function img(o,k){var v=o[k];if(v&&/^data:image\//.test(v)){var n='uploads/img-'+hex(10)+'.jpg';files.push({name:n,data:dataBytes(v)});o[k]=n}}
 img(ex.images,'profile');ex.projects.forEach(function(p){img(p,'img')});
 for(var i=0;i<ex.projects.length;i++){var p=ex.projects[i];
  if(/^idb:/.test(p.videoUrl||'')){
   var b=null;try{b=await S.VID.get(p.videoUrl.slice(4))}catch(e){}
   if(!b){p.videoUrl='';p.videoName='';p.videoSize=0;lost++;continue}
   var ext=((p.videoName||'').split('.').pop()||'').toLowerCase();if(['mp4','mov','webm'].indexOf(ext)<0)ext=b.type==='video/webm'?'webm':'mp4';
   var n='uploads/videos/'+hex(16)+'.'+ext;files.push({name:n,data:new Uint8Array(await b.arrayBuffer())});p.videoUrl=n;p.videoSize=b.size;if(b.size>95*1048576)big.push(p.title)}}
 files.unshift({name:'data/site-data.js',data:new TextEncoder().encode('/* Published website data. */\nwindow.SITE_DATA='+JSON.stringify(ex)+';\n')});
 return{blob:zipStore(files),count:files.length,big:big,lost:lost}}

/* ---------- the screens ---------- */
var V={};
V.dash=function(){
 var m=mode==='server';
 var cards=[['home','Home Page','Hero text, key numbers, services teaser, testimonials, brands, closing section','Edit Home'],['portfolio','Portfolio Page',draft.projects.length+' projects, category names and page text','Edit Portfolio'],['about','About Page','Your story, timeline ('+draft.timeline.length+' milestones) and skills ('+draft.skills.length+')','Edit About'],['services','Services Page',draft.services.length+' services with prices','Edit Services'],['awards','Awards Page',draft.awards.length+' achievements','Edit Awards'],['contact','Contact & Social','Email, WhatsApp, Instagram, YouTube, LinkedIn, X and footer text','Edit Contact'],['images','Images','Profile photo and every project thumbnail','Manage Images'],['themes','Color Themes','Active: '+S.THEMES[draft.theme].name,'Change Theme'],['settings','Settings & Security','Password, publishing, backup and reset','Open Settings']];
 return'<div class="ph"><div><h2>Dashboard</h2><p>Welcome back. Pick what you want to edit.</p></div></div>'+
 (isDefault()?'<div class="warn"><span><b>Change your password before going live.</b> You are still using the default login (admin / Admin@123).</span><button type="button" data-act="go" data-go="settings">Change it now</button></div>':'')+
 note(m?'<b>Connected to your hosting.</b> When you click <b>Save changes</b>, your live website is updated for every visitor straight away.':'<b>Test mode.</b> Your changes are saved in this browser and show instantly on your pages here. To put them online for all visitors, go to <b>Settings &amp; Security &rarr; Publish</b>.')+
 '<div class="dash">'+cards.map(function(c){return'<button type="button" class="dc" data-act="go" data-go="'+c[0]+'"><b>'+c[1]+'</b><span>'+c[2]+'</span><em>'+c[3]+' &rarr;</em></button>'}).join('')+'</div>'+
 sec('View your live pages','Open any page in a new tab to see your saved changes.','<div class="links2">'+Object.keys(FILE).map(function(k){return'<a href="'+FILE[k]+'" target="_blank" rel="noopener">'+k.charAt(0).toUpperCase()+k.slice(1)+' &#8599;</a>'}).join('')+'</div>')};
V.home=function(){
 var st='<div>'+draft.stats.map(function(s,i){return'<div class="row4"><label class="f"><span>Number '+(i+1)+'</span><input type="number" step="any" data-num data-p="stats.'+i+'.to" value="'+s.to+'"></label><label class="f"><span>Ending (e.g. + or /5)</span><input data-p="stats.'+i+'.suf" value="'+esc(s.suf)+'"></label><label class="f"><span>Label</span><input data-tk="home.stat'+(i+1)+'" value="'+esc(draft.text['home.stat'+(i+1)])+'"></label></div>'}).join('')+'</div>';
 return head('Home Page','Everything visitors see first.','home')+
 sec('Hero','The big opening section. Change your profile photo under Images.',texts('home','Hero'))+
 sec('Key numbers','The four animated counters.',st)+
 sec('Services teaser','Six short service highlights. For prices and the full list, use the Services page.',texts('home','Services teaser'))+
 sec('Featured work','Text only. To choose which projects appear here (and change their pictures), open Portfolio Page &rarr; Projects and tick &ldquo;Show in Home page Featured work&rdquo;.',texts('home','Featured work'))+
 sec('Testimonials','Client quotes in the sliding cards.',texts('home','Testimonials')+list('testimonials'))+
 sec('Brands marquee','The scrolling row of brand names. One brand per line.',texts('home','Brands')+'<label class="f"><span>Brand names (one per line)</span><textarea rows="7" data-brands>'+esc(draft.brands.join('\n'))+'</textarea></label>')+
 sec('Closing section','',texts('home','Closing call to action'))};
V.portfolio=function(){return head('Portfolio Page','Page text and every project.','portfolio')+
 sec('Page text','',texts('portfolio','Page text'))+
 sec('Filter tab names','These names also appear on each project card and in the Home page featured work.',texts('portfolio','Filter tab names'))+
 sec('Projects','Add, remove, reorder and edit projects. Click a project to open it. Each project has a thumbnail (the cover picture) <b>and</b> its real video. Order here is the order on the website.',list('projects'))+
 sec('Closing section','',texts('portfolio','Closing call to action'))};
V.about=function(){return head('About Page','Your story, journey and skills.','about')+
 sec('Top of page','Change the photo under Images.',texts('about','Top of page'))+
 sec('Your story','',texts('about','Your story'))+
 sec('Timeline','',texts('about','Timeline')+list('timeline'))+
 sec('Skills','The meters fill up to the level you set.',texts('about','Skills')+list('skills'))+
 sec('Closing section','',texts('about','Closing call to action'))};
V.services=function(){return head('Services Page','Add, remove and price your services.','services')+
 sec('Page text','',texts('services','Page text'))+
 sec('Your services &amp; prices','Open a service to edit its description and starting price. Changes appear on the Services page after you save.',list('services'))+
 sec('Closing section','',texts('services','Closing call to action'))};
V.awards=function(){return head('Awards Page','Awards and achievements.','awards')+
 sec('Page text','',texts('awards','Page text'))+
 sec('Awards &amp; achievements','Add or remove any time.',list('awards'))+
 sec('Closing section','',texts('awards','Closing call to action'))};
V.contact=function(){var c=draft.contact;return head('Contact &amp; Social','Your contact details, social links and form text.','contact')+
 sec('Contact details','Shown on the Contact page.','<div class="g2">'+field('contact.email','Email address','text',c.email)+field('contact.whatsapp','WhatsApp number (or a short message)','text',c.whatsapp)+'</div>')+
 sec('Social media links','Paste the full link to each profile. Leave empty if you do not use one. The icons appear on the Contact page and in the footer of every page.','<div class="g2">'+field('contact.instagram','Instagram link','text',c.instagram)+field('contact.youtube','YouTube link','text',c.youtube)+field('contact.linkedin','LinkedIn link','text',c.linkedin)+field('contact.x','X link','text',c.x)+'</div>')+
 sec('Contact page text','',texts('contact','Page text')+texts('contact','Form'))+
 sec('Footer (every page)','',texts('global','Footer (shown on every page)'))};
V.images=function(){return head('Images','Upload or change every picture on your website. Images are shrunk automatically so pages stay fast.')+
 sec('Profile photo','Used on the Home page and the About page. A portrait (tall) photo works best.',imgField('images.profile','Profile photo',draft.images.profile,1,1000,'assets/profile-placeholder.svg'))+
 sec('Project thumbnails','These appear on the Portfolio page, in the larger view, and on the Home page for projects marked as featured.',draft.projects.length?'<div class="igrid">'+draft.projects.map(function(p,i){return'<div class="icard"><h4>'+esc(p.title)+'</h4><small>'+esc(draft.text['portfolio.tab.'+p.cat])+(p.home?' &middot; Featured on Home':'')+'</small>'+imgField('projects.'+i+'.img','Thumbnail',p.img,p.t,1000)+'</div>'}).join('')+'</div>':'<p class="empty">No projects yet. Add one under Portfolio Page.</p>')};
V.themes=function(){return head('Color Themes','Pick a theme. It changes the colors on every page of your website. (Selecting one also saves any other pending changes.)')+
 '<div class="themes">'+Object.keys(S.THEMES).map(function(id){var t=S.THEMES[id],on=draft.theme===id;return'<button type="button" class="theme'+(on?' on':'')+'" data-act="theme" data-id="'+id+'"><span class="sw"><i style="background:'+t.v['--bg']+'"></i><i style="background:'+t.v['--card']+'"></i><i style="background:'+t.v['--o']+'"></i><i style="background:'+t.v['--b']+'"></i></span><b>'+t.name+'</b><small>'+(on?'Currently active':'Click to apply')+'</small></button>'}).join('')+'</div>'};
V.settings=function(){var m=mode==='server',c=cred();
 return head('Settings &amp; Security','Password, publishing and backups.')+
 (isDefault()?'<div class="warn"><span><b>You are still using the default login.</b> Change it below before your website goes live.</span></div>':'')+
 sec('Change username &amp; password','Use at least 8 characters. Pick something only you know.','<form id="pwform" autocomplete="off"><div class="g2"><label class="f"><span>Current password</span><input name="old" type="password" autocomplete="current-password" required></label><label class="f"><span>New username</span><input name="user" value="'+esc(m?'admin':c.user)+'" required></label><label class="f"><span>New password</span><input name="new" type="password" autocomplete="new-password" required></label><label class="f"><span>Repeat new password</span><input name="new2" type="password" autocomplete="new-password" required></label></div><button class="btn sm" type="submit">Update login</button></form>')+
 (m?sec('Publishing','Your changes go live the moment you click Save changes, with nothing to upload.',''):
 sec('Publish to the internet','You are in test mode. Your changes already show on the pages in this browser. To show them to every visitor (GitHub Pages or any normal web hosting), publish them like this:','<ol class="steps"><li>Click <b>Save changes</b> (top right).</li><li>Click <b>Download publish bundle</b> below. You get one zip.</li><li>Unzip it. It contains a <b>data</b> folder and, if you added pictures or videos, an <b>uploads</b> folder.</li><li>Upload those folders into your website (on GitHub: open your repository, choose <b>Add file &rarr; Upload files</b>, drag the folders in, then click <b>Commit changes</b>). Files with the same name are replaced.</li></ol><div class="btns"><button type="button" class="btn sm" data-act="export-bundle">Download publish bundle</button><button type="button" class="btn ghost sm" data-act="export-js">Only data/site-data.js</button></div>'))+
 sec('Backup &amp; restore','Keep a copy of all your content, or restore one.','<div class="btns"><button type="button" class="btn ghost sm" data-act="export-json">Download backup</button><button type="button" class="btn ghost sm" data-act="import-json">Restore from backup</button></div>')+
 sec('Reset website content','Replaces everything you edited with the original sample content. Cannot be undone.','<div class="btns"><button type="button" class="btn ghost sm danger" data-act="reset">Reset all content</button></div>')};

/* ---------- drawing ---------- */
function draw(keepScroll){var y=window.scrollY;$('#main').innerHTML=V[cur]();$('#ttl').textContent=(NAV.filter(function(n){return n[0]===cur})[0]||[0,''])[1];
 $('#nav').innerHTML=NAV.map(function(n){return'<button type="button" data-act="go" data-go="'+n[0]+'" class="'+(n[0]===cur?'on':'')+'">'+n[1]+'</button>'}).join('');
 window.scrollTo(0,keepScroll?y:0);$('#side').classList.remove('open')}
function go(id){cur=id;draw(false)}

/* ---------- saving ---------- */
function normalize(){var c=draft.contact;['instagram','youtube','linkedin','x'].forEach(function(k){var v=(c[k]||'').trim();if(v&&!/^https?:\/\//i.test(v))v='https://'+v;c[k]=v});c.email=(c.email||'').trim();c.whatsapp=(c.whatsapp||'').trim()}
async function save(){
 normalize();
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.contact.email)){toast('Please enter a valid email address under Contact & Social.',true);go('contact');return false}
 for(var vi=0;vi<draft.projects.length;vi++){var vp=draft.projects[vi];vp.videoUrl=(vp.videoUrl||'').trim();if(vp.videoUrl&&!S.hasVideo(vp)){toast('The video link for "'+vp.title+'" is not valid. Use a path or link ending in .mp4, .mov or .webm.',true);go('portfolio');openKey='projects'+vi;draw(true);return false}}
 if(mode==='server'){
  var r=null;try{r=await api('save',draft)}catch(e){}
  if(r&&r.json&&r.json.ok){store.del(S.KEY);await flushDeletes();setDirty(false);draw(true);toast('Saved. Your live website is updated for every visitor.');return true}
  if(r&&r.status===401){toast('Your session expired. Please sign in again.',true);showLogin();return false}
  if(!store.set(S.KEY,JSON.stringify(draft))){toast('Could not save. Check your hosting folder permissions.',true);return false}
  setDirty(false);draw(true);toast('The server could not be reached, so your changes were saved in this browser only.',true);return true}
 if(!store.set(S.KEY,JSON.stringify(draft))){toast('Browser storage is full. Remove or replace some large images, then save again.',true);return false}
 await flushDeletes();setDirty(false);draw(true);toast('Saved. Your pages now show the changes. Use Settings \u2192 Publish to put them online.');return true}

/* ---------- images ---------- */
function pickFile(accept){return new Promise(function(res){var fp=$('#filepick');fp.accept=accept;fp.value='';fp.onchange=function(){res(fp.files&&fp.files[0]||null)};fp.click()})}
function toJpeg(file,max){return new Promise(function(res){var r=new FileReader();r.onerror=function(){res(null)};r.onload=function(){var im=new Image();im.onerror=function(){res(null)};im.onload=function(){var k=Math.min(1,max/Math.max(im.width,im.height)),c=document.createElement('canvas');c.width=Math.max(1,Math.round(im.width*k));c.height=Math.max(1,Math.round(im.height*k));var x=c.getContext('2d');x.fillStyle='#16181d';x.fillRect(0,0,c.width,c.height);x.drawImage(im,0,0,c.width,c.height);res(c.toDataURL('image/jpeg',.82))};im.src=r.result};r.readAsDataURL(file)})}
async function uploadImage(p,max){
 var f=await pickFile('image/*');if(!f)return;
 if(!/^image\//.test(f.type)){toast('Please choose an image file (JPG, PNG or WebP).',true);return}
 var url=await toJpeg(f,max);if(!url){toast('That image could not be read. Try a different file.',true);return}
 if(mode==='server'){try{var r=await api('upload',{dataUrl:url});if(r.json&&r.json.ok)url=r.json.path}catch(e){}}
 setp(draft,p,url);setDirty();draw(true);toast('Image added. Click Save changes to put it on your website.')}

/* ---------- events ---------- */
var main=$('#main');
main.addEventListener('input',function(e){
 var t=e.target;
 if(t.dataset.tk!=null){draft.text[t.dataset.tk]=t.value;setDirty();return}
 if(t.dataset.brands!=null){draft.brands=t.value.split('\n').map(function(s){return s.trim()}).filter(Boolean);setDirty();return}
 var p=t.dataset.p;if(!p)return;
 var v=t.type==='checkbox'?t.checked:t.dataset.num!=null?(parseFloat(t.value)||0):t.value;
 setp(draft,p,v);setDirty();
 if(/\.videoUrl$/.test(p)){var pp=p.split('.'),pq=draft.projects[+pp[1]];pq.videoName=baseName(v);pq.videoSize=0}
 var det=t.closest('details.item'),parts=p.split('.');
 if(det&&LISTS[parts[0]])det.querySelector('summary b').textContent=LISTS[parts[0]].t(draft[parts[0]][+parts[1]]);
 if(t.type==='range'){var o=t.closest('label').querySelector('.rv');if(o)o.textContent=v}
});
document.addEventListener('click',async function(e){
 var b=e.target.closest('[data-act]');if(!b)return;
 var a=b.dataset.act,L=b.dataset.l,i=+b.dataset.i;
 if(b.closest('summary'))e.preventDefault();
 if(a==='go'){if(b.dataset.go){go(b.dataset.go)}return}
 if(a==='add'){draft[L].push(LISTS[L].mk());openKey=L+(draft[L].length-1);setDirty();draw(true);return}
 if(a==='del'){if(confirm('Remove "'+LISTS[L].t(draft[L][i])+'"? This takes effect when you click Save changes.')){if(L==='projects'&&draft[L][i].videoUrl)pendingDel.push(draft[L][i].videoUrl);draft[L].splice(i,1);openKey=null;setDirty();draw(true)}return}
 if(a==='up'||a==='down'){var j=a==='up'?i-1:i+1;if(j<0||j>=draft[L].length)return;var x=draft[L];var tmp=x[i];x[i]=x[j];x[j]=tmp;openKey=L+j;setDirty();draw(true);return}
 if(a==='vid-up'){await startVideo(b.dataset.id);return}
 if(a==='vid-cancel'){if(UP[b.dataset.id])UP[b.dataset.id].cancel=true;return}
 if(a==='vid-rm'){var pj=draft.projects.filter(function(p){return p.id===b.dataset.id})[0];if(pj&&confirm('Delete the video from "'+pj.title+'"? The project will show its thumbnail only. This takes effect when you click Save changes.')){pendingDel.push(pj.videoUrl);pj.videoUrl='';pj.videoName='';pj.videoSize=0;UP[pj.id]=null;setDirty();draw(true);toast('Video removed. Click Save changes to apply it.')}return}
 if(a==='img-up'){await uploadImage(b.dataset.p,+b.dataset.max||1000);return}
 if(a==='img-rm'){setp(draft,b.dataset.p,'');setDirty();draw(true);return}
 if(a==='theme'){draft.theme=b.dataset.id;S.applyTheme(draft.theme);await save();return}
 if(a==='export-bundle'){if(dirty&&!(await save()))return;toast('Preparing your files\u2026');var bd=await buildBundle();download('publish-bundle.zip',bd.blob,'application/zip');toast('Downloaded publish-bundle.zip ('+bd.count+' files). Unzip it and upload the "data" and "uploads" folders to your website.'+(bd.big.length?' Note: '+bd.big.join(', ')+' is over 95 MB, which GitHub does not accept. Host that video elsewhere and paste its link instead.':'')+(bd.lost?' '+bd.lost+' video(s) were missing from this browser and left out.':''),bd.big.length>0||bd.lost>0);return}
 if(a==='export-js'){if(dirty&&!(await save()))return;var ex=S.clone(draft),skipped=0;ex.projects.forEach(function(p){if(/^idb:/.test(p.videoUrl||'')){p.videoUrl='';p.videoName='';p.videoSize=0;skipped++}});download('site-data.js','window.SITE_DATA='+JSON.stringify(ex)+';','text/javascript');toast(skipped?'Downloaded. '+skipped+' video(s) kept only in this browser were left out. Upload those files to uploads/videos on your hosting and paste each path under Portfolio, then the project, then "Or link a video".':'Downloaded. Now upload it into the "data" folder on your hosting.',skipped>0);return}
 if(a==='export-json'){download('website-backup.json',JSON.stringify(draft,null,1),'application/json');return}
 if(a==='import-json'){var f=await pickFile('application/json,.json');if(!f)return;try{var o=JSON.parse(await f.text());if(!o||typeof o!=='object'||!o.text)throw 0;draft=S.merge(S.clone(S.DEFAULTS),o);S.applyTheme(draft.theme);setDirty();draw(true);toast('Backup loaded. Click Save changes to apply it.')}catch(x){toast('That file is not a valid backup.',true)}return}
 if(a==='reset'){if(confirm('Replace ALL your content with the original sample content? This cannot be undone.')){draft=S.clone(S.DEFAULTS);S.applyTheme(draft.theme);await save();go('dash')}return}
});
document.addEventListener('submit',async function(e){
 if(e.target.id!=='pwform')return;e.preventDefault();
 var f=e.target,u=f.user.value.trim(),o=f.old.value,n=f.new.value,n2=f.new2.value;
 if(!u)return toast('Please enter a username.',true);
 if(n.length<8)return toast('The new password needs at least 8 characters.',true);
 if(n!==n2)return toast('The two new passwords do not match.',true);
 if(n==='Admin@123')return toast('Please choose a password different from the default one.',true);
 if(mode==='server'){var r=null;try{r=await api('passwd',{user:u,old:o,new:n})}catch(x){}
  if(r&&r.json&&r.json.ok){srvDefault=false;f.reset();draw(true);toast('Login updated. Use the new username and password next time.')}else toast((r&&r.json&&r.json.error)||'Could not update the login.',true);return}
 if(!localOK(cred().user,o))return toast('Your current password is not correct.',true);
 if(!store.set(LC,JSON.stringify({user:u,hash:hash(n)})))return toast('Could not store the new login in this browser.',true);
 f.reset();draw(true);toast('Login updated. Use the new username and password next time.')});
main.addEventListener('change',function(e){if(e.target.dataset&&/\.videoUrl$/.test(e.target.dataset.p||''))draw(true)});
main.addEventListener('toggle',function(e){var d=e.target;if(!d.matches||!d.matches('details.item'))return;var k=d.getAttribute('data-k');if(d.open)openKey=k;else if(openKey===k)openKey=null},true);
$('#save').addEventListener('click',save);
$('#menu').addEventListener('click',function(){$('#side').classList.toggle('open')});
$('#logout').addEventListener('click',async function(){if(dirty&&!confirm('You have unsaved changes. Sign out anyway?'))return;dirty=false;if(mode==='server'){try{await api('logout')}catch(e){}}sess.del(SSK);location.reload()});

/* ---------- login / start ---------- */
function showLogin(){$('#app').hidden=true;$('#login').hidden=false;$('#lp').value='';setTimeout(function(){$('#lu').focus()},50)}
async function enter(){
 if(mode==='server'){var r=await api('load');if(r.status===401){showLogin();return}draft=S.merge(S.clone(S.DEFAULTS),(r.json&&r.json.data)||{});store.del(S.KEY)}
 else draft=S.clone(S.data);
 S.applyTheme(draft.theme);$('#login').hidden=true;$('#app').hidden=false;
 var bd=$('#badge');bd.textContent=mode==='server'?'\u25CF Live on your hosting':'Test mode (this browser)';bd.className='badge'+(mode==='server'?' live':'');
 setDirty(false);dirty=false;$('#dirty').hidden=true;go('dash')}
$('#lform').addEventListener('submit',async function(e){
 e.preventDefault();var u=$('#lu').value.trim(),p=$('#lp').value,ok=false,err=$('#lerr');err.textContent='';
 if(mode==='server'){try{var r=await api('login',{user:u,pass:p});if(r.json&&r.json.ok){ok=true;srvDefault=!!r.json.default}else if(r.status===401){ok=false}else throw 0}catch(x){mode='local';ok=localOK(u,p)}}
 else ok=localOK(u,p);
 if(!ok){err.textContent='Incorrect username or password.';$('#lp').select();return}
 if(mode==='local')sess.set(SSK,'1');
 await enter()});
(async function boot(){
 var pg=await ping();
 if(pg){mode='server';srvDefault=!!pg.default;if(pg.maxVideoMb)srvMax=pg.maxVideoMb;if(pg.chunk)srvChunk=pg.chunk;if(pg.auth){await enter();return}}
 else if(sess.get(SSK)){await enter();return}
 showLogin()})();
})();
