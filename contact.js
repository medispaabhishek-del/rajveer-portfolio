(function(){
var form=document.getElementById('form'),box=document.getElementById('cform'),note=document.getElementById('note'),send=document.getElementById('send'),SEND=document.getElementById('send').textContent;
var EMAIL=SITE.data.contact.email;
function fields(){return[].slice.call(form.querySelectorAll('input,select,textarea'))}
function valid(el){
  if(!el.required)return true;
  if(el.type==='email')return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value.trim());
  return el.value.trim()!=='';
}
fields().forEach(function(el){
  var clear=function(){el.closest('.fld').classList.remove('err');note.textContent=''};
  el.addEventListener('input',clear);el.addEventListener('change',clear);
});
function done(name,msg){
  document.getElementById('done-t').textContent='Thanks for reaching out'+(name?', '+name.split(' ')[0]:'')+'!';
  document.getElementById('done-p').textContent=msg;
  box.classList.add('sent');
  var d=document.getElementById('done');d.focus();
}
form.addEventListener('submit',function(e){
  e.preventDefault();
  var bad=fields().filter(function(el){var ok=valid(el);el.closest('.fld').classList.toggle('err',!ok);return !ok});
  if(bad.length){bad[0].focus();return}
  var d={};fields().forEach(function(el){d[el.name]=el.value.trim()});
  var endpoint=form.dataset.endpoint;
  if(endpoint){
    send.disabled=true;send.textContent='Sending...';
    fetch(endpoint,{method:'POST',headers:{'Accept':'application/json','Content-Type':'application/json'},body:JSON.stringify(d)})
      .then(function(r){if(!r.ok)throw 0;done(d.name,'Your message has been sent. I will reply within one working day.')})
      .catch(function(){send.disabled=false;send.textContent=SEND;note.textContent='Something went wrong. Please try again or email '+EMAIL+'.'});
    return;
  }
  /* No server configured: open the visitor's email app with the message ready to send */
  var body='Name: '+d.name+'\nEmail: '+d.email+'\nProject type: '+d.type+'\nBudget: '+(d.budget||'Not specified')+'\n\n'+d.message;
  location.href='mailto:'+EMAIL+'?subject='+encodeURIComponent('New project enquiry: '+d.type)+'&body='+encodeURIComponent(body);
  done(d.name,'Your email app should open with your message ready to send. If nothing opens, email me directly at '+EMAIL+'.');
});
})();
