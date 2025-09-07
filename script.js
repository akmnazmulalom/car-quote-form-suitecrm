// Load car brands
fetch('data/makes.json')
  .then(res => res.json())
  .then(data => {
    const brandSelect = document.getElementById('car_brand_c');
    data.forEach(b => {
      const opt = document.createElement('option');
      opt.value = b.ID;
      opt.text = b.Make;
      brandSelect.add(opt);
    });
  });

// Load car models on brand select
$('#car_brand_c').on('change', function() {
  const brandID = $(this).val();
  const brandName = $('#car_brand_c option:selected').text();
  $("#quote-form input[name='carBrand']").remove();
  $("#quote-form").append(`<input type='hidden' name='carBrand' value='${brandName}'>`);

  if(brandID){
    fetch(`data/models_${brandID}.json`)
      .then(res => res.json())
      .then(models => {
        const modelSelect = document.getElementById('car_model_c');
        modelSelect.innerHTML = `<option value="">Select Model</option>`;
        models.forEach(m => {
          const opt = document.createElement('option');
          opt.value = m.MSRP;
          opt.text = m.Model;
          modelSelect.add(opt);
        });
      });
  }
});

// Save model & MSRP on select
$('#car_model_c').on('change', function() {
  const model = $('#car_model_c option:selected').text();
  const msrp = $('#car_model_c').val();
  $("#quote-form input[name='car-model']").remove();
  $("#quote-form input[name='msrp']").remove();
  $("#quote-form").append(`<input type='hidden' name='car-model' value='${model}'>`);
  $("#quote-form").append(`<input type='hidden' name='msrp' value='${msrp}'>`);
});

// Eligibility popup
let gauge, interval;
async function loadGaugeScripts(){
  if(!window.Raphael) await loadScript('https://cdnjs.cloudflare.com/ajax/libs/raphael/2.3.0/raphael.min.js');
  if(!window.JustGage) await loadScript('https://cdnjs.cloudflare.com/ajax/libs/justgage/1.3.5/justgage.min.js');
}
function loadScript(url){ return new Promise((resolve)=>{ const s=document.createElement('script'); s.src=url; s.onload=()=>resolve(); document.head.appendChild(s); }); }
async function initGauge(){ await loadGaugeScripts(); gauge=new JustGage({id:"rpmGauge",value:0,min:0,max:8,decimals:0,symbol:"k",title:"RPM",label:"x1000 rpm",pointer:true,relativeGaugeSize:true,customSectors:[{color:"#007dff",lo:0,hi:6},{color:"#ff0000",lo:6,hi:8}]}); }
function startRPMAnimation(callback){ let rpm=0; interval=setInterval(()=>{ rpm+=0.25; if(rpm>8){ clearInterval(interval); gauge.refresh(0); if(callback) callback(); } else gauge.refresh(rpm); },300); }
function openPopup(){ document.getElementById('rpmPopup').style.display='flex'; initGauge().then(()=>startRPMAnimation(()=>submitQuote())); }
function closePopup(){ document.getElementById('rpmPopup').style.display='none'; clearInterval(interval); }
document.getElementById('closePopup')?.addEventListener('click',closePopup);
document.getElementById('rpmPopup')?.addEventListener('click',e=>{ if(e.target.id==='rpmPopup') closePopup(); });

// Form validation
function validateForm(){
  const required=['first-name','last-name','email','car-year','milage','msrp'];
  for(const name of required){
    const el=document.querySelector(`input[name="${name}"]`);
    if(!el||!el.value.trim()){ alert(`Please fill the ${name.replace(/-/g,' ')}`); return false; }
  }
  const email=document.querySelector('input[name="email"]').value;
  if(!email.includes('@')){ alert("Please enter a valid email."); return false; }
  return true;
}

// Quote calculation
function calcQuote(milage,year,msrp){
  milage=parseInt(milage)||0; year=parseInt(year)||new Date().getFullYear(); msrp=parseFloat(msrp)||0;
  const base=msrp*0.05, mfg=Math.round(base+(milage*0.02)), ptrain=Math.round(base*0.75), ptrainplus=Math.round(base*0.9);
  const mfg_monthly=+(mfg/24).toFixed(2), ptrain_monthly=+(ptrain/24).toFixed(2), ptrainplus_monthly=+(ptrainplus/24).toFixed(2);
  let et=0; if(milage<30000) et=1; else if(milage<60000) et=2; else if(milage<100000) et=3; else if(milage<150000) et=4;
  return {mfg,ptrain,ptrainplus,mfg_monthly,ptrain_monthly,ptrainplus_monthly,et};
}

// Redirect after popup
function submitQuote(){
  if(!validateForm()) return;
  const milage=document.querySelector('input[name="milage"]').value;
  const year=document.querySelector('input[name="car-year"]').value;
  const msrp=document.querySelector('input[name="msrp"]').value;
  const carModel=document.querySelector('input[name="car-model"]').value;
  const carBrand=document.querySelector('input[name="carBrand"]').value;

  const {et}=calcQuote(milage,year,msrp);
  let redirectUrl="/not-eligible.html";
  if(et===1) redirectUrl="/offer-1.html";
  else if(et===2) redirectUrl="/offer-2.html";
  else if(et===3) redirectUrl="/offer-3.html";
  else if(et===4) redirectUrl="/offer-4.html";

  window.location.href=redirectUrl;
}

// Form submit
document.getElementById('quote-form').addEventListener('submit',e=>{ e.preventDefault(); openPopup(); });
