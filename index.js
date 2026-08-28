const page = `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Syria Commerce</title>
<style>
*{box-sizing:border-box}body{margin:0;font-family:Arial,Tahoma,sans-serif;background:#f5f7fb;color:#172033}
.nav{height:68px;background:#fff;border-bottom:1px solid #e7eaf0;display:flex;align-items:center;justify-content:space-between;padding:0 7%}
.brand{font-size:22px;font-weight:800}.brand span{color:#2563eb}.nav a{color:#334155;text-decoration:none;margin-right:20px;font-size:14px}
.hero{padding:65px 7%;background:linear-gradient(135deg,#eef5ff,#fff)}.wrap{max-width:1100px;margin:auto}
.hero h1{font-size:46px;margin:0 0 15px}.lead{font-size:19px;line-height:1.9;color:#64748b;max-width:700px}
.btn{display:inline-block;background:#2563eb;color:white;border:0;padding:14px 22px;border-radius:11px;font-weight:700;cursor:pointer;text-decoration:none}
section{padding:55px 7%}.title{text-align:center;margin-bottom:30px}.title h2{font-size:30px}.title p{color:#64748b}
.features{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}.card{background:#fff;border:1px solid #e5e9f0;border-radius:18px;padding:24px;box-shadow:0 10px 35px #0f172a0b}
.form{max-width:650px;margin:auto}.grid{display:grid;gap:13px}label{font-weight:700;font-size:14px}input,select{width:100%;padding:13px;border:1px solid #d8dee8;border-radius:10px;font-size:15px;margin-top:6px}
.msg{margin-top:15px;padding:13px;border-radius:10px;display:none}.success{background:#ecfdf5;color:#047857}.error{background:#fef2f2;color:#b91c1c}
.badge{display:inline-block;background:#dbeafe;color:#1d4ed8;padding:7px 12px;border-radius:30px;font-size:13px;font-weight:700;margin-bottom:15px}
footer{text-align:center;padding:30px;color:#64748b}
@media(max-width:800px){.features{grid-template-columns:1fr}.hero h1{font-size:36px}.nav{padding:0 4%}.nav a{display:none}section,.hero{padding-left:4%;padding-right:4%}}
</style>
</head>
<body>
<nav class="nav"><div class="brand">Syria <span>Commerce</span></div><div><a href="#features">المميزات</a><a href="#register">التسجيل</a></div></nav>

<header class="hero"><div class="wrap">
<span class="badge">نظام المسوقين</span>
<h1>ابدأ كمسوق معنا</h1>
<p class="lead">سجّل بياناتك للحصول على كود مسوق خاص بك. هذه هي المرحلة الأولى من نظام المسوقين، والنسخة الحالية مجهزة للانتقال لاحقاً إلى التخزين الدائم ولوحة المسوق.</p>
<a class="btn" href="#register">تسجيل مسوق</a>
</div></header>

<section id="features"><div class="wrap">
<div class="title"><h2>النظام الذي سنبنيه</h2><p>نضيف كل مرحلة فوق الأساس الحالي بدون تغيير إعدادات Cloudflare الشغالة.</p></div>
<div class="features">
<div class="card"><h3>👤 حساب المسوق</h3><p>بيانات المسوق وكود خاص قابل للربط بالطلبات.</p></div>
<div class="card"><h3>🔗 رابط المسوق</h3><p>رابط إحالة خاص لكل مسوق لتتبع المبيعات.</p></div>
<div class="card"><h3>💰 العمولات</h3><p>احتساب العمولة وربطها بالطلبات لاحقاً.</p></div>
</div></div></section>

<section id="register"><div class="wrap"><div class="card form">
<h2>تسجيل مسوق جديد</h2>
<p style="color:#64748b">املأ البيانات التالية.</p>
<form id="reg" class="grid">
<div><label>الاسم الكامل</label><input id="name" required placeholder="مثال: أحمد محمد"></div>
<div><label>رقم الهاتف</label><input id="phone" required placeholder="07xxxxxxxx"></div>
<div><label>المحافظة</label><select id="city" required><option value="">اختر المحافظة</option><option>دمشق</option><option>ريف دمشق</option><option>حلب</option><option>حمص</option><option>حماة</option><option>اللاذقية</option><option>طرطوس</option><option>إدلب</option><option>درعا</option><option>السويداء</option><option>القنيطرة</option><option>دير الزور</option><option>الرقة</option><option>الحسكة</option></select></div>
<button class="btn" type="submit">إنشاء حساب المسوق</button>
</form>
<div id="msg" class="msg"></div>
</div></div></section>
<footer>© 2026 Syria Commerce</footer>
<script>
const form=document.getElementById("reg"),msg=document.getElementById("msg");
form.addEventListener("submit",async(e)=>{
 e.preventDefault(); msg.style.display="block"; msg.className="msg"; msg.textContent="جاري إنشاء كود المسوق...";
 try{
  const r=await fetch("/api/register",{method:"POST",headers:{"content-type":"application/json"},
   body:JSON.stringify({name:document.getElementById("name").value.trim(),phone:document.getElementById("phone").value.trim(),city:document.getElementById("city").value})});
  const d=await r.json(); if(!r.ok) throw new Error(d.error||"تعذر التسجيل");
  msg.className="msg success"; msg.innerHTML="تم تجهيز حساب المسوق بنجاح.<br>كود المسوق: <strong>"+d.marketer_code+"</strong>";
  form.reset();
 }catch(err){msg.className="msg error";msg.textContent=err.message}
});
</script>
</body></html>`;

function code() {
  return "M-" + Math.random().toString(36).slice(2,8).toUpperCase();
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    if (request.method === "GET" && url.pathname === "/api/health") {
      return Response.json({ok:true, service:"syria-commerce", phase:"marketer-registration"});
    }
    if (request.method === "POST" && url.pathname === "/api/register") {
      try {
        const body = await request.json();
        if (!body.name || !body.phone || !body.city) {
          return Response.json({error:"الاسم ورقم الهاتف والمحافظة مطلوبة"}, {status:400});
        }
        return Response.json({
          ok:true,
          marketer_code:code(),
          name:body.name,
          phone:body.phone,
          city:body.city,
          message:"تم إنشاء كود المسوق. التخزين الدائم سيتم في المرحلة التالية."
        });
      } catch {
        return Response.json({error:"بيانات غير صالحة"}, {status:400});
      }
    }
    return new Response(page, {headers:{"content-type":"text/html; charset=UTF-8"}});
  }
};
