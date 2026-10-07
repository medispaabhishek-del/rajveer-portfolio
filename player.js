/* Shared project viewer (Portfolio page + Home page featured work).
   Shows the thumbnail first; the real video is only loaded when the visitor presses play. */
(function(){
var S=window.SITE,esc=S.esc,lb,list=[],idx=0,last,objUrl=null,token=0;
function $(s,c){return(c||document).querySelector(s)}
function build(){
 if(lb)return;
 lb=document.createElement('div');lb.className='lb';lb.id='lb';lb.hidden=true;
 lb.setAttribute('role','dialog');lb.setAttribute('aria-modal','true');lb.setAttribute('aria-labelledby','lb-t');
 lb.innerHTML='<div class="lb-bg" data-close></div><div class="lb-box"><button class="lb-x" type="button" data-close aria-label="Close project">&times;</button><div class="lb-img" id="lb-img"></div><div class="lb-body"><em id="lb-c"></em><h3 id="lb-t"></h3><p class="lb-meta" id="lb-m"></p><p id="lb-d"></p><div class="lb-nav"><button type="button" id="lb-p">&#8249; Previous</button><button type="button" id="lb-n">Next &#8250;</button></div></div></div>';
 document.body.appendChild(lb);
 [].forEach.call(lb.querySelectorAll('[data-close]'),function(el){el.addEventListener('click',close)});
 $('#lb-p').addEventListener('click',function(){step(-1)});
 $('#lb-n').addEventListener('click',function(){step(1)});
 document.addEventListener('keydown',function(e){
  if(lb.hidden)return;
  var typing=e.target&&e.target.tagName==='VIDEO';
  if(e.key==='Escape'&&!document.fullscreenElement)close();
  else if(e.key==='ArrowLeft'&&!typing)step(-1);
  else if(e.key==='ArrowRight'&&!typing)step(1);
  else if(e.key==='Tab'){
   var f=[].slice.call(lb.querySelectorAll('button:not([hidden]),video[controls]')),a=f[0],z=f[f.length-1];
   if(e.shiftKey&&document.activeElement===a){e.preventDefault();z.focus()}
   else if(!e.shiftKey&&document.activeElement===z){e.preventDefault();a.focus()}
  }
 });
}
function stop(){
 token++;var v=$('#lb-img video');
 if(v){try{v.pause()}catch(e){}v.removeAttribute('src');v.load()}
 if(objUrl){URL.revokeObjectURL(objUrl);objUrl=null}
}
function show(auto){
 stop();var p=list[idx],im=$('#lb-img'),has=S.hasVideo(p);
 im.className='lb-img'+(has?' isvid':'');im.style.aspectRatio='';
 im.innerHTML=S.thumb(p)+(has?'<button type="button" class="vplay" aria-label="Play video"><span class="vp-c"><svg class="ic"><use href="#i-play"/></svg></span><span class="vp-t">Watch Video</span></button>':'');
 if(has)$('.vplay',im).addEventListener('click',function(){play(p)});
 $('#lb-c').textContent=S.data.text['portfolio.tab.'+p.cat]||'';
 $('#lb-t').textContent=p.title;
 $('#lb-d').textContent=p.detail||p.desc||'';
 var m=[];if(p.clientName)m.push('Client: '+p.clientName);
 if(p.projectDate){var d=new Date(p.projectDate+'T00:00:00');if(!isNaN(d))m.push(d.toLocaleDateString(undefined,{year:'numeric',month:'long',day:'numeric'}))}
 $('#lb-m').textContent=m.join('  \u00B7  ');
 $('#lb-p').hidden=$('#lb-n').hidden=list.length<2;
 if(has&&auto)play(p);
}
function fail(p){var im=$('#lb-img');im.className='lb-img isvid';im.style.aspectRatio='';im.innerHTML=S.thumb(p)+'<p class="vfail">This video could not be loaded right now. Please try again in a moment.</p>'}
function play(p){
 var my=++token,im=$('#lb-img');
 S.videoSrc(p.videoUrl).then(function(src){
  if(my!==token)return;
  if(/^blob:/.test(src))objUrl=src;
  im.className='lb-img playing';
  im.innerHTML='<video controls playsinline preload="metadata" controlsList="nodownload"'+(p.img?' poster="'+esc(p.img)+'"':'')+'></video>';
  var v=$('video',im);
  v.addEventListener('error',function(){if(my===token)fail(p)});
  v.addEventListener('loadedmetadata',function(){if(v.videoWidth&&v.videoHeight)im.style.aspectRatio=v.videoWidth+'/'+v.videoHeight});
  v.src=src;
  var pr=v.play();if(pr&&pr.catch)pr.catch(function(){});
 }).catch(function(){if(my===token)fail(p)});
}
function open(l,i,trigger){
 build();list=l;idx=i;last=trigger||document.activeElement;
 show(true);lb.hidden=false;document.body.style.overflow='hidden';
 requestAnimationFrame(function(){requestAnimationFrame(function(){lb.classList.add('open')})});
 $('.lb-x').focus();
}
function close(){
 stop();lb.classList.remove('open');document.body.style.overflow='';
 setTimeout(function(){if(!lb.classList.contains('open'))lb.hidden=true},450);
 if(last&&last.focus)last.focus();
}
function step(d){idx=(idx+d+list.length)%list.length;show(false)}
window.RMPlayer={open:open};

/* Home page: featured projects that have a video open straight into the player */
document.addEventListener('click',function(e){
 var a=e.target.closest&&e.target.closest('#hwork .thumb.has-vid');if(!a)return;
 var ps=S.data.projects.filter(function(p){return p.home}),id=a.getAttribute('data-pid');
 for(var i=0;i<ps.length;i++)if(ps[i].id===id){e.preventDefault();open(ps,i,a);return}
});
})();
