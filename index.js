
const DEMO_PRODUCTS = [
  {
    id: 1,
    name: "منتج تجريبي",
    sku: "PRD-0001",
    price: 100,
    commission: 10,
    stock: 25,
    category: "عام",
    status: "active",
    description: "منتج تجريبي للنظام",
    created_at: new Date().toISOString()
  }
];

const DEMO_MARKETERS = [
  { id: 1, name: "مسوق تجريبي", phone: "0790000000", governorate: "عمّان", code: "SYR-0001", created_at: new Date().toISOString() }
];

function html(body, title = "Syria Commerce") {
  return `<!doctype html><html lang="ar" dir="rtl"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
<style>
*{box-sizing:border-box}body{margin:0;background:#f5f7fb;color:#172033;font-family:Arial,sans-serif}
header{background:#111827;color:#fff;padding:24px}main{max-width:1000px;margin:24px auto;padding:0 16px}
.card{background:#fff;border:1px solid #e5e7eb;border-radius:16px;padding:20px;margin-bottom:18px;box-shadow:0 4px 18px #00000008}
h1,h2{margin-top:0}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:14px}
.stat{font-size:28px;font-weight:700}.muted{color:#667085}.badge{display:inline-block;padding:6px 10px;border-radius:999px;background:#eef2ff}
table{width:100%;border-collapse:collapse}th,td{padding:12px;border-bottom:1px solid #eee;text-align:right}
a,button{display:inline-block;border:0;border-radius:10px;padding:11px 16px;text-decoration:none;cursor:pointer}
.btn{background:#111827;color:#fff}.btn2{background:#eef2ff;color:#111827}
input,select{width:100%;padding:12px;border:1px solid #d0d5dd;border-radius:10px;font-size:15px}
label{display:block;margin-bottom:6px;font-weight:600}.row{display:grid;grid-template-columns:1fr 1fr;gap:12px}
@media(max-width:650px){.row{grid-template-columns:1fr}}
.notice{padding:12px;border-radius:10px;background:#fff7ed;color:#9a3412}
</style></head><body>${body}</body></html>`;
}


function htmlResponse(body, title = "Syria Commerce") {
  return new Response(html(body, title), {
    headers: {"content-type":"text/html; charset=utf-8"}
  });
}

function json(data, status=200) {
  return new Response(JSON.stringify(data), {status, headers: {"content-type":"application/json; charset=utf-8"}});
}

function getStore(env) {
  // Phase 2 is deploy-safe before D1 is connected.
  // Once env.DB is added, all writes/reads become persistent.
  return env.DB || null;
}

async function nextCode(db) {
  if (!db) return `SYR-${String(DEMO_MARKETERS.length + 1).padStart(4,"0")}`;
  const r = await db.prepare("SELECT COUNT(*) AS n FROM marketers").first();
  return `SYR-${String(Number(r?.n || 0) + 1).padStart(4,"0")}`;
}

async function listMarketers(db) {
  if (!db) return DEMO_MARKETERS;
  const r = await db.prepare("SELECT id,name,phone,governorate,code,created_at FROM marketers ORDER BY id DESC").all();
  return r.results || [];
}

async function register(request, env) {
  const data = await request.json().catch(() => ({}));
  const name = String(data.name || "").trim();
  const phone = String(data.phone || "").trim();
  const governorate = String(data.governorate || "").trim();
  if (!name || !phone || !governorate) return json({ok:false,error:"الاسم والهاتف والمحافظة مطلوبة"},400);

  const db = getStore(env);
  const code = await nextCode(db);
  const row = {name, phone, governorate, code, created_at:new Date().toISOString()};

  if (db) {
    await db.prepare(
      "INSERT INTO marketers (name,phone,governorate,code,created_at) VALUES (?,?,?,?,?)"
    ).bind(name,phone,governorate,code,row.created_at).run();
  } else {
    DEMO_MARKETERS.push({id:DEMO_MARKETERS.length+1,...row});
  }
  return json({ok:true, marketer:row});
}


function esc(v) {
  return String(v ?? "").replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[c]));
}

async function listProducts(db) {
  if (!db) return DEMO_PRODUCTS;
  const r = await db.prepare(
    "SELECT id,name,sku,price,commission,stock,category,status,description,created_at FROM products ORDER BY id DESC"
  ).all();
  return r.results || [];
}

async function createProduct(request, env) {
  const d = await request.json().catch(() => ({}));
  const name = String(d.name || "").trim();
  const sku = String(d.sku || "").trim();
  const category = String(d.category || "عام").trim();
  const description = String(d.description || "").trim();
  const price = Number(d.price);
  const commission = Number(d.commission || 0);
  const stock = Number(d.stock || 0);
  const status = d.status === "inactive" ? "inactive" : "active";

  if (!name || !sku || !Number.isFinite(price) || price < 0 || !Number.isFinite(commission) || commission < 0 || !Number.isFinite(stock) || stock < 0) {
    return json({ok:false,error:"تحقق من الاسم والكود والسعر والعمولة والمخزون"},400);
  }

  const db = getStore(env);
  const created_at = new Date().toISOString();

  if (db) {
    await db.prepare(
      "INSERT INTO products (name,sku,price,commission,stock,category,status,description,created_at) VALUES (?,?,?,?,?,?,?,?,?)"
    ).bind(name,sku,price,commission,stock,category,status,description,created_at).run();
    return json({ok:true});
  }

  if (DEMO_PRODUCTS.some(x => x.sku.toLowerCase() === sku.toLowerCase())) {
    return json({ok:false,error:"كود المنتج مستخدم مسبقاً"},409);
  }

  const id = Math.max(0, ...DEMO_PRODUCTS.map(x => x.id)) + 1;
  DEMO_PRODUCTS.unshift({id,name,sku,price,commission,stock,category,status,description,created_at});
  return json({ok:true,product:DEMO_PRODUCTS[0]});
}

async function deleteProduct(request, env) {
  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!Number.isInteger(id)) return json({ok:false,error:"معرّف غير صالح"},400);

  const db = getStore(env);
  if (db) {
    await db.prepare("DELETE FROM products WHERE id=?").bind(id).run();
  } else {
    const i = DEMO_PRODUCTS.findIndex(x => x.id === id);
    if (i >= 0) DEMO_PRODUCTS.splice(i,1);
  }
  return json({ok:true});
}

async function productsPage(env) {
  const rows = await listProducts(getStore(env));
  const cards = rows.map(p => `
    <tr>
      <td><strong>${esc(p.name)}</strong><div class="muted">${esc(p.description || "")}</div></td>
      <td><span class="badge">${esc(p.sku)}</span></td>
      <td>${Number(p.price).toFixed(2)}</td>
      <td>${Number(p.commission).toFixed(2)}</td>
      <td>${Number(p.stock)}</td>
      <td>${esc(p.category)}</td>
      <td>${p.status === "active" ? '<span class="ok">نشط</span>' : '<span class="off">متوقف</span>'}</td>
      <td><button class="danger" onclick="delProduct(${p.id})">حذف</button></td>
    </tr>`).join("");

  return htmlResponse(`
<header class="top"><div class="wrap"><div class="brand">Syria Commerce</div><div class="sub">إدارة المنتجات</div></div></header>
<div class="layout">
<nav>
<a href="/">🏠 الرئيسية</a><a href="/dashboard">👥 المسوقون</a><a href="/products">📦 المنتجات</a>
<a href="/orders">🧾 الطلبات</a><a href="/commissions">💰 العمولات</a><a href="/customers">👤 العملاء</a>
<a href="/reports">📊 التقارير</a><a href="/settings">⚙️ الإعدادات</a><a href="/permissions">🔐 الصلاحيات</a><a href="/activity">📝 سجل النشاط</a>
</nav>
<main>
<div class="card hero"><span class="badge">المرحلة 4</span><h1>نظام المنتجات</h1>
<p class="muted">إضافة المنتجات وإدارتها قبل ربط قاعدة البيانات.</p></div>

<div class="card section">
<h2>إضافة منتج جديد</h2>
<form id="productForm">
<div class="row">
<div><label>اسم المنتج</label><input name="name" required></div>
<div><label>كود المنتج SKU</label><input name="sku" placeholder="PRD-0002" required></div>
</div>
<div class="row" style="margin-top:12px">
<div><label>السعر</label><input name="price" type="number" min="0" step="0.01" required></div>
<div><label>عمولة المسوق</label><input name="commission" type="number" min="0" step="0.01" value="0"></div>
</div>
<div class="row" style="margin-top:12px">
<div><label>المخزون</label><input name="stock" type="number" min="0" step="1" value="0"></div>
<div><label>التصنيف</label><input name="category" value="عام"></div>
</div>
<div class="row" style="margin-top:12px">
<div><label>الحالة</label><select name="status"><option value="active">نشط</option><option value="inactive">متوقف</option></select></div>
<div><label>الوصف</label><input name="description"></div>
</div>
<button class="btn" style="margin-top:14px">حفظ المنتج</button>
<span id="msg" class="muted"></span>
</form>
</div>

<div class="card section">
<h2>قائمة المنتجات <span class="muted">(${rows.length})</span></h2>
<div style="overflow:auto"><table>
<thead><tr><th>المنتج</th><th>SKU</th><th>السعر</th><th>العمولة</th><th>المخزون</th><th>التصنيف</th><th>الحالة</th><th></th></tr></thead>
<tbody>${cards || '<tr><td colspan="8">لا توجد منتجات</td></tr>'}</tbody>
</table></div>
</div>
</main></div>
<style>
*{box-sizing:border-box}body{margin:0;background:#f5f7fb;color:#172033;font-family:Arial,sans-serif}
.top{background:#111827;color:#fff;padding:18px 22px}.wrap{max-width:1100px;margin:auto}
.brand{font-size:24px;font-weight:700}.sub{opacity:.75;margin-top:5px}
.layout{display:grid;grid-template-columns:220px 1fr;gap:18px;max-width:1100px;margin:22px auto;padding:0 16px}
nav,.card{background:#fff;border:1px solid #e5e7eb;border-radius:16px;box-shadow:0 4px 18px #00000008}
nav{padding:10px;height:max-content}nav a{display:block;padding:13px;border-radius:10px;color:#172033;text-decoration:none}nav a:hover{background:#f1f5f9}
.hero,.section{padding:20px}.row{display:grid;grid-template-columns:1fr 1fr;gap:12px}
label{display:block;margin-bottom:6px;font-weight:600}input,select{width:100%;padding:12px;border:1px solid #d0d5dd;border-radius:10px;font-size:15px}
.btn,.danger{border:0;border-radius:10px;padding:11px 16px;cursor:pointer}.btn{background:#111827;color:#fff}.danger{background:#fee2e2;color:#991b1b}
.badge{display:inline-block;padding:6px 10px;border-radius:999px;background:#eef2ff}.muted{color:#667085}
table{width:100%;border-collapse:collapse}th,td{padding:12px;border-bottom:1px solid #eee;text-align:right;white-space:nowrap}
.ok{background:#dcfce7;color:#166534;padding:5px 9px;border-radius:999px}.off{background:#fee2e2;color:#991b1b;padding:5px 9px;border-radius:999px}
@media(max-width:700px){.layout{grid-template-columns:1fr}nav{display:grid;grid-template-columns:1fr 1fr}.row{grid-template-columns:1fr}}
</style>
<script>
document.querySelector("#productForm").addEventListener("submit",async e=>{
 e.preventDefault();
 const msg=document.querySelector("#msg"); msg.textContent="جاري الحفظ...";
 const r=await fetch("/api/products",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(Object.fromEntries(new FormData(e.target)))});
 const d=await r.json();
 if(d.ok){msg.textContent="تم حفظ المنتج";setTimeout(()=>location.reload(),500)}
 else msg.textContent=d.error||"حدث خطأ";
});
async function delProduct(id){
 if(!confirm("حذف المنتج؟")) return;
 const r=await fetch("/api/products?id="+id,{method:"DELETE"});
 const d=await r.json();
 if(d.ok) location.reload(); else alert(d.error||"حدث خطأ");
}
</script>`, "المنتجات");
}


const DEMO_ORDERS = [
  {id:1, order_no:"ORD-0001", product_id:1, product_name:"منتج تجريبي", marketer_code:"SYR-0001", customer_name:"عميل تجريبي", customer_phone:"0790000001", governorate:"عمّان", quantity:1, total:100, commission:10, status:"new", created_at:new Date().toISOString()}
];

async function listOrders(db) {
  if (!db) return DEMO_ORDERS;
  const r = await db.prepare("SELECT * FROM orders ORDER BY id DESC").all();
  return r.results || [];
}

async function createOrder(request, env) {
  const d=await request.json().catch(()=>({}));
  const product_id=Number(d.product_id), quantity=Number(d.quantity||1);
  const product=(await listProducts(getStore(env))).find(x=>x.id===product_id);
  if(!product) return json({ok:false,error:"المنتج غير موجود"},404);
  if(!Number.isInteger(quantity)||quantity<1) return json({ok:false,error:"الكمية غير صحيحة"},400);
  if(Number(product.stock)<quantity) return json({ok:false,error:"الكمية المطلوبة غير متوفرة"},400);

  const customer_name=String(d.customer_name||"").trim();
  const customer_phone=String(d.customer_phone||"").trim();
  const governorate=String(d.governorate||"").trim();
  const marketer_code=String(d.marketer_code||"").trim();
  if(!customer_name||!customer_phone||!governorate||!marketer_code)
    return json({ok:false,error:"بيانات العميل وكود المسوق مطلوبة"},400);

  const total=Number(product.price)*quantity;
  const commission=Number(product.commission)*quantity;
  const order_no="ORD-"+String(Date.now()).slice(-8);
  const created_at=new Date().toISOString();
  const row={order_no,product_id,product_name:product.name,marketer_code,customer_name,customer_phone,governorate,quantity,total,commission,status:"new",created_at};

  const db=getStore(env);
  if(db){
    await db.prepare(`INSERT INTO orders
      (order_no,product_id,product_name,marketer_code,customer_name,customer_phone,governorate,quantity,total,commission,status,created_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`).bind(order_no,product_id,product.name,marketer_code,customer_name,customer_phone,governorate,quantity,total,commission,"new",created_at).run();
  } else {
    DEMO_ORDERS.unshift({id:Math.max(0,...DEMO_ORDERS.map(x=>x.id))+1,...row});
  }
  return json({ok:true,order:row});
}

async function updateOrder(request,env){
  const d=await request.json().catch(()=>({}));
  const id=Number(d.id), status=String(d.status||"");
  const allowed=["new","confirmed","preparing","shipped","delivered","cancelled"];
  if(!Number.isInteger(id)||!allowed.includes(status)) return json({ok:false,error:"بيانات غير صالحة"},400);
  const db=getStore(env);
  if(db) await db.prepare("UPDATE orders SET status=? WHERE id=?").bind(status,id).run();
  else { const o=DEMO_ORDERS.find(x=>x.id===id); if(o)o.status=status; }
  return json({ok:true});
}

async function ordersPage(env){
 const rows=await listOrders(getStore(env));
 const labels={new:"جديد",confirmed:"مؤكد",preparing:"قيد التجهيز",shipped:"تم الشحن",delivered:"تم التسليم",cancelled:"ملغي"};
 const tr=rows.map(o=>`<tr><td>${esc(o.order_no)}</td><td>${esc(o.product_name)}</td><td>${esc(o.customer_name)}<div class="muted">${esc(o.customer_phone)}</div></td><td>${esc(o.marketer_code)}</td><td>${o.quantity}</td><td>${Number(o.total).toFixed(2)}</td><td>${Number(o.commission).toFixed(2)}</td><td><select onchange="setStatus(${o.id},this.value)">${Object.entries(labels).map(([k,v])=>`<option value="${k}" ${o.status===k?"selected":""}>${v}</option>`).join("")}</select></td></tr>`).join("");
 const products=await listProducts(getStore(env));
 const opts=products.map(x=>`<option value="${x.id}">${esc(x.name)} — ${x.price}</option>`).join("");
 return htmlResponse(`<header class="top"><div class="wrap"><div class="brand">Syria Commerce</div><div class="sub">إدارة الطلبات</div></div></header>
 <div class="layout"><nav><a href="/">🏠 الرئيسية</a><a href="/dashboard">👥 المسوقون</a><a href="/products">📦 المنتجات</a><a href="/orders">🧾 الطلبات</a><a href="/commissions">💰 العمولات</a><a href="/customers">👤 العملاء</a><a href="/reports">📊 التقارير</a><a href="/settings">⚙️ الإعدادات</a><a href="/permissions">🔐 الصلاحيات</a><a href="/activity">📝 سجل النشاط</a></nav>
 <main><div class="card section"><span class="badge">المرحلة 5</span><h1>نظام الطلبات</h1><p class="muted">تسجيل الطلب، ربطه بالمنتج والمسوق، ومتابعة حالته حتى التسليم.</p></div>
 <div class="card section"><h2>تسجيل طلب</h2><form id="orderForm"><div class="row"><div><label>المنتج</label><select name="product_id" required>${opts}</select></div><div><label>الكمية</label><input name="quantity" type="number" min="1" value="1" required></div></div>
 <div class="row"><div><label>اسم العميل</label><input name="customer_name" required></div><div><label>هاتف العميل</label><input name="customer_phone" required></div></div>
 <div class="row"><div><label>المحافظة</label><input name="governorate" required></div><div><label>كود المسوق</label><input name="marketer_code" placeholder="SYR-0001" required></div></div>
 <button class="btn" style="margin-top:14px">تسجيل الطلب</button> <span id="msg" class="muted"></span></form></div>
 <div class="card section"><h2>الطلبات (${rows.length})</h2><div style="overflow:auto"><table><thead><tr><th>رقم الطلب</th><th>المنتج</th><th>العميل</th><th>المسوق</th><th>الكمية</th><th>الإجمالي</th><th>العمولة</th><th>الحالة</th></tr></thead><tbody>${tr||"<tr><td colspan=8>لا توجد طلبات</td></tr>"}</tbody></table></div></div>
 </main></div><style>
 *{box-sizing:border-box}body{margin:0;background:#f5f7fb;color:#172033;font-family:Arial,sans-serif}.top{background:#111827;color:#fff;padding:18px 22px}.wrap{max-width:1100px;margin:auto}.brand{font-size:24px;font-weight:700}.sub{opacity:.75;margin-top:5px}.layout{display:grid;grid-template-columns:220px 1fr;gap:18px;max-width:1100px;margin:22px auto;padding:0 16px}nav,.card{background:#fff;border:1px solid #e5e7eb;border-radius:16px;box-shadow:0 4px 18px #00000008}nav{padding:10px;height:max-content}nav a{display:block;padding:13px;border-radius:10px;color:#172033;text-decoration:none}nav a:hover{background:#f1f5f9}.section{padding:20px}.row{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px}label{display:block;margin-bottom:6px;font-weight:600}input,select{width:100%;padding:12px;border:1px solid #d0d5dd;border-radius:10px;font-size:15px}.btn{border:0;border-radius:10px;padding:11px 16px;background:#111827;color:#fff;cursor:pointer}.badge{display:inline-block;padding:6px 10px;border-radius:999px;background:#eef2ff}.muted{color:#667085}table{width:100%;border-collapse:collapse}th,td{padding:12px;border-bottom:1px solid #eee;text-align:right;white-space:nowrap}@media(max-width:700px){.layout{grid-template-columns:1fr}nav{display:grid;grid-template-columns:1fr 1fr}.row{grid-template-columns:1fr}}
 </style><script>
 document.querySelector("#orderForm").addEventListener("submit",async e=>{e.preventDefault();let m=document.querySelector("#msg");m.textContent="جاري الحفظ...";let r=await fetch("/api/orders",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(Object.fromEntries(new FormData(e.target)))});let d=await r.json();m.textContent=d.ok?"تم تسجيل الطلب: "+d.order.order_no:(d.error||"حدث خطأ");if(d.ok)setTimeout(()=>location.reload(),600)});
 async function setStatus(id,status){let r=await fetch("/api/orders",{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({id,status})});let d=await r.json();if(!d.ok)alert(d.error||"حدث خطأ");}
 </script>`,"الطلبات");
}


async function commissionsPage(env){
  const orders = await listOrders(getStore(env));
  const delivered = orders.filter(o => o.status === "delivered");
  const pending = orders.filter(o => !["delivered","cancelled"].includes(o.status));
  const cancelled = orders.filter(o => o.status === "cancelled");

  const due = delivered.reduce((sum,o) => sum + Number(o.commission || 0), 0);
  const waiting = pending.reduce((sum,o) => sum + Number(o.commission || 0), 0);
  const cancelledAmount = cancelled.reduce((sum,o) => sum + Number(o.commission || 0), 0);

  const marketers = {};
  for (const o of delivered) {
    const code = o.marketer_code || "غير محدد";
    if (!marketers[code]) marketers[code] = {code, orders:0, amount:0};
    marketers[code].orders++;
    marketers[code].amount += Number(o.commission || 0);
  }

  const rows = Object.values(marketers).sort((a,b)=>b.amount-a.amount).map(m=>`
    <tr>
      <td><strong>${esc(m.code)}</strong></td>
      <td>${m.orders}</td>
      <td>${m.amount.toFixed(2)}</td>
      <td><span class="ok">مستحقة</span></td>
    </tr>`).join("");

  return htmlResponse(`<!doctype html><html lang="ar" dir="rtl">
  <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>العمولات | Syria Commerce</title>
  <style>
  *{box-sizing:border-box}body{margin:0;background:#f5f7fb;color:#172033;font-family:Arial,sans-serif}
  .top{background:#111827;color:#fff;padding:18px 22px}.wrap{max-width:1100px;margin:auto}
  .brand{font-size:24px;font-weight:700}.sub{opacity:.75;margin-top:5px}
  .layout{display:grid;grid-template-columns:220px 1fr;gap:18px;max-width:1100px;margin:22px auto;padding:0 16px}
  nav,.card{background:#fff;border:1px solid #e5e7eb;border-radius:16px;box-shadow:0 4px 18px #00000008}
  nav{padding:10px;height:max-content}nav a{display:block;padding:13px;border-radius:10px;color:#172033;text-decoration:none}
  nav a:hover{background:#f1f5f9}.section,.stat{padding:20px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:14px;margin:14px 0}
  .num{font-size:28px;font-weight:700;margin-top:8px}.muted{color:#667085}.badge{display:inline-block;padding:6px 10px;border-radius:999px;background:#eef2ff}
  .ok{background:#dcfce7;color:#166534;padding:5px 9px;border-radius:999px}
  table{width:100%;border-collapse:collapse}th,td{padding:12px;border-bottom:1px solid #eee;text-align:right;white-space:nowrap}
  @media(max-width:700px){.layout{grid-template-columns:1fr}nav{display:grid;grid-template-columns:1fr 1fr}}
  </style></head><body>
  <header class="top"><div class="wrap"><div class="brand">Syria Commerce</div><div class="sub">نظام العمولات</div></div></header>
  <div class="layout">
  <nav>
    <a href="/">🏠 الرئيسية</a><a href="/dashboard">👥 المسوقون</a><a href="/products">📦 المنتجات</a>
    <a href="/orders">🧾 الطلبات</a><a href="/commissions">💰 العمولات</a>
  </nav>
  <main>
    <div class="card section"><span class="badge">Phase 6</span>
      <h1>العمولات</h1>
      <p class="muted">العمولة تصبح مستحقة للمسوق فقط بعد تسليم الطلب.</p>
    </div>
    <div class="grid">
      <div class="card stat"><div class="muted">عمولات مستحقة</div><div class="num">${due.toFixed(2)}</div></div>
      <div class="card stat"><div class="muted">قيد الانتظار</div><div class="num">${waiting.toFixed(2)}</div></div>
      <div class="card stat"><div class="muted">ملغاة</div><div class="num">${cancelledAmount.toFixed(2)}</div></div>
      <div class="card stat"><div class="muted">طلبات مسلّمة</div><div class="num">${delivered.length}</div></div>
    </div>
    <div class="card section">
      <h2>عمولات المسوقين المستحقة</h2>
      <div style="overflow:auto"><table>
      <thead><tr><th>المسوق</th><th>طلبات مسلّمة</th><th>العمولة</th><th>الحالة</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="4">لا توجد عمولات مستحقة بعد</td></tr>'}</tbody>
      </table></div>
    </div>
  </main></div></body></html>`,"العمولات");
}


async function listCustomers(db) {
  if (!db) {
    const map = new Map();
    for (const o of DEMO_ORDERS) {
      const phone = String(o.customer_phone || "").trim();
      if (!phone) continue;
      if (!map.has(phone)) {
        map.set(phone,{name:o.customer_name,phone,governorate:o.governorate,orders:0,total:0,last_order:o.created_at});
      }
      const c=map.get(phone);
      c.orders++;
      c.total += Number(o.total || 0);
      if (new Date(o.created_at) > new Date(c.last_order)) c.last_order=o.created_at;
    }
    return [...map.values()].sort((a,b)=>b.orders-a.orders);
  }

  const r=await db.prepare(`
    SELECT customer_name AS name, customer_phone AS phone, governorate,
           COUNT(*) AS orders, COALESCE(SUM(total),0) AS total,
           MAX(created_at) AS last_order
    FROM orders
    GROUP BY customer_phone, customer_name, governorate
    ORDER BY last_order DESC
  `).all();
  return r.results || [];
}


async function reportsPage(env) {
  const orders = await listOrders(getStore(env));
  const products = await listProducts(getStore(env));

  const delivered = orders.filter(o => o.status === "delivered");
  const cancelled = orders.filter(o => o.status === "cancelled");
  const active = orders.filter(o => !["delivered","cancelled"].includes(o.status));

  const sales = delivered.reduce((a,o)=>a+Number(o.total||0),0);
  const allSales = orders.reduce((a,o)=>a+Number(o.total||0),0);
  const dueCommission = delivered.reduce((a,o)=>a+Number(o.commission||0),0);

  const statusNames = {
    new:"جديد", confirmed:"مؤكد", preparing:"قيد التجهيز",
    shipped:"تم الشحن", delivered:"تم التسليم", cancelled:"ملغي"
  };
  const statusMap = {};
  for (const o of orders) {
    const key=o.status||"new";
    statusMap[key]=(statusMap[key]||0)+1;
  }

  const productMap = {};
  for (const o of delivered) {
    const key=o.product_name||"غير محدد";
    if(!productMap[key]) productMap[key]={name:key,orders:0,qty:0,sales:0};
    productMap[key].orders++;
    productMap[key].qty += Number(o.quantity||0);
    productMap[key].sales += Number(o.total||0);
  }

  const marketerMap = {};
  for (const o of orders) {
    const key=o.marketer_code||"غير محدد";
    if(!marketerMap[key]) marketerMap[key]={code:key,orders:0,sales:0};
    marketerMap[key].orders++;
    marketerMap[key].sales += Number(o.total||0);
  }

  const statusRows=Object.entries(statusMap).map(([k,n])=>`
    <tr><td>${esc(statusNames[k]||k)}</td><td>${n}</td><td>${orders.length ? ((n/orders.length)*100).toFixed(1) : "0.0"}%</td></tr>
  `).join("");

  const productRows=Object.values(productMap).sort((a,b)=>b.sales-a.sales).map(x=>`
    <tr><td><strong>${esc(x.name)}</strong></td><td>${x.orders}</td><td>${x.qty}</td><td>${x.sales.toFixed(2)}</td></tr>
  `).join("");

  const marketerRows=Object.values(marketerMap).sort((a,b)=>b.sales-a.sales).map(x=>`
    <tr><td><strong>${esc(x.code)}</strong></td><td>${x.orders}</td><td>${x.sales.toFixed(2)}</td></tr>
  `).join("");

  return htmlResponse(`<!doctype html><html lang="ar" dir="rtl">
  <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>التقارير | Syria Commerce</title>
  <style>
  *{box-sizing:border-box}body{margin:0;background:#f5f7fb;color:#172033;font-family:Arial,sans-serif}
  .top{background:#111827;color:#fff;padding:18px 22px}.wrap{max-width:1100px;margin:auto}
  .brand{font-size:24px;font-weight:700}.sub{opacity:.75;margin-top:5px}
  .layout{display:grid;grid-template-columns:220px 1fr;gap:18px;max-width:1100px;margin:22px auto;padding:0 16px}
  nav,.card{background:#fff;border:1px solid #e5e7eb;border-radius:16px;box-shadow:0 4px 18px #00000008}
  nav{padding:10px;height:max-content}nav a{display:block;padding:13px;border-radius:10px;color:#172033;text-decoration:none}
  nav a:hover{background:#f1f5f9}.section,.stat{padding:20px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:14px;margin:14px 0}
  .num{font-size:28px;font-weight:700;margin-top:8px}.muted{color:#667085}.badge{display:inline-block;padding:6px 10px;border-radius:999px;background:#eef2ff}
  table{width:100%;border-collapse:collapse}th,td{padding:12px;border-bottom:1px solid #eee;text-align:right}
  @media(max-width:700px){.layout{grid-template-columns:1fr}nav{display:grid;grid-template-columns:1fr 1fr}}
  </style></head><body>
  <header class="top"><div class="wrap"><div class="brand">Syria Commerce</div><div class="sub">التقارير والإحصائيات</div></div></header>
  <div class="layout">
  <nav>
    <a href="/">🏠 الرئيسية</a><a href="/dashboard">👥 المسوقون</a><a href="/products">📦 المنتجات</a>
    <a href="/orders">🧾 الطلبات</a><a href="/commissions">💰 العمولات</a><a href="/customers">👤 العملاء</a>
    <a href="/reports">📊 التقارير</a><a href="/settings">⚙️ الإعدادات</a><a href="/permissions">🔐 الصلاحيات</a><a href="/activity">📝 سجل النشاط</a>
  </nav>
  <main>
    <div class="card section"><span class="badge">Phase 8</span><h1>التقارير</h1>
      <p class="muted">ملخص المبيعات والطلبات والمنتجات والمسوقين. البيانات حالياً تعمل بدون قاعدة بيانات.</p>
    </div>
    <div class="grid">
      <div class="card stat"><div class="muted">إجمالي الطلبات</div><div class="num">${orders.length}</div></div>
      <div class="card stat"><div class="muted">تم التسليم</div><div class="num">${delivered.length}</div></div>
      <div class="card stat"><div class="muted">طلبات قيد المتابعة</div><div class="num">${active.length}</div></div>
      <div class="card stat"><div class="muted">ملغاة</div><div class="num">${cancelled.length}</div></div>
      <div class="card stat"><div class="muted">مبيعات المسلّم</div><div class="num">${sales.toFixed(2)}</div></div>
      <div class="card stat"><div class="muted">عمولات مستحقة</div><div class="num">${dueCommission.toFixed(2)}</div></div>
    </div>

    <div class="card section"><h2>حالة الطلبات</h2>
      <div style="overflow:auto"><table><thead><tr><th>الحالة</th><th>العدد</th><th>النسبة</th></tr></thead>
      <tbody>${statusRows || '<tr><td colspan="3">لا توجد بيانات</td></tr>'}</tbody></table></div>
    </div>

    <div class="card section"><h2>أداء المنتجات</h2>
      <div style="overflow:auto"><table><thead><tr><th>المنتج</th><th>الطلبات</th><th>الكمية</th><th>المبيعات المسلّمة</th></tr></thead>
      <tbody>${productRows || '<tr><td colspan="4">لا توجد مبيعات مسلّمة بعد</td></tr>'}</tbody></table></div>
    </div>

    <div class="card section"><h2>أداء المسوقين</h2>
      <div style="overflow:auto"><table><thead><tr><th>كود المسوق</th><th>الطلبات</th><th>قيمة الطلبات</th></tr></thead>
      <tbody>${marketerRows || '<tr><td colspan="3">لا توجد بيانات</td></tr>'}</tbody></table></div>
    </div>
  </main></div></body></html>`,"التقارير");
}

async function customersPage(env) {
  const rows=await listCustomers(getStore(env));
  const total=rows.reduce((a,c)=>a+Number(c.total||0),0);

  const tr=rows.map(c=>`
    <tr>
      <td><strong>${esc(c.name)}</strong></td>
      <td>${esc(c.phone)}</td>
      <td>${esc(c.governorate)}</td>
      <td>${c.orders}</td>
      <td>${Number(c.total).toFixed(2)}</td>
      <td>${c.last_order ? new Date(c.last_order).toLocaleDateString("ar-JO") : "-"}</td>
    </tr>`).join("");

  return htmlResponse(`<!doctype html><html lang="ar" dir="rtl">
  <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>العملاء | Syria Commerce</title>
  <style>
  *{box-sizing:border-box}body{margin:0;background:#f5f7fb;color:#172033;font-family:Arial,sans-serif}
  .top{background:#111827;color:#fff;padding:18px 22px}.wrap{max-width:1100px;margin:auto}
  .brand{font-size:24px;font-weight:700}.sub{opacity:.75;margin-top:5px}
  .layout{display:grid;grid-template-columns:220px 1fr;gap:18px;max-width:1100px;margin:22px auto;padding:0 16px}
  nav,.card{background:#fff;border:1px solid #e5e7eb;border-radius:16px;box-shadow:0 4px 18px #00000008}
  nav{padding:10px;height:max-content}nav a{display:block;padding:13px;border-radius:10px;color:#172033;text-decoration:none}
  nav a:hover{background:#f1f5f9}.section,.stat{padding:20px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:14px;margin:14px 0}
  .num{font-size:28px;font-weight:700;margin-top:8px}.muted{color:#667085}.badge{display:inline-block;padding:6px 10px;border-radius:999px;background:#eef2ff}
  table{width:100%;border-collapse:collapse}th,td{padding:12px;border-bottom:1px solid #eee;text-align:right;white-space:nowrap}
  @media(max-width:700px){.layout{grid-template-columns:1fr}nav{display:grid;grid-template-columns:1fr 1fr}}
  </style></head><body>
  <header class="top"><div class="wrap"><div class="brand">Syria Commerce</div><div class="sub">إدارة العملاء</div></div></header>
  <div class="layout">
  <nav>
    <a href="/">🏠 الرئيسية</a><a href="/dashboard">👥 المسوقون</a><a href="/products">📦 المنتجات</a>
    <a href="/orders">🧾 الطلبات</a><a href="/commissions">💰 العمولات</a><a href="/customers">👤 العملاء</a>
  </nav>
  <main>
    <div class="card section"><span class="badge">Phase 7</span>
      <h1>العملاء</h1>
      <p class="muted">يتم تجميع العميل تلقائياً من الطلبات باستخدام رقم الهاتف.</p>
    </div>
    <div class="grid">
      <div class="card stat"><div class="muted">عدد العملاء</div><div class="num">${rows.length}</div></div>
      <div class="card stat"><div class="muted">إجمالي المشتريات</div><div class="num">${total.toFixed(2)}</div></div>
    </div>
    <div class="card section">
      <h2>قائمة العملاء</h2>
      <div style="overflow:auto"><table>
      <thead><tr><th>الاسم</th><th>الهاتف</th><th>المحافظة</th><th>الطلبات</th><th>إجمالي الشراء</th><th>آخر طلب</th></tr></thead>
      <tbody>${tr || '<tr><td colspan="6">لا يوجد عملاء بعد</td></tr>'}</tbody>
      </table></div>
    </div>
  </main></div></body></html>`,"العملاء");
}


async function settingsPage(env) {
  return htmlResponse(`<!doctype html><html lang="ar" dir="rtl">
  <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>الإعدادات | Syria Commerce</title>
  <style>
  *{box-sizing:border-box}body{margin:0;background:#f5f7fb;color:#172033;font-family:Arial,sans-serif}
  .top{background:#111827;color:#fff;padding:18px 22px}.wrap{max-width:1100px;margin:auto}
  .brand{font-size:24px;font-weight:700}.sub{opacity:.75;margin-top:5px}
  .layout{display:grid;grid-template-columns:220px 1fr;gap:18px;max-width:1100px;margin:22px auto;padding:0 16px}
  nav,.card{background:#fff;border:1px solid #e5e7eb;border-radius:16px;box-shadow:0 4px 18px #00000008}
  nav{padding:10px;height:max-content}nav a{display:block;padding:13px;border-radius:10px;color:#172033;text-decoration:none}
  nav a:hover{background:#f1f5f9}.section{padding:20px;margin-bottom:14px}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
  label{display:block;font-weight:600;margin-bottom:7px}input,select{width:100%;padding:12px;border:1px solid #d0d5dd;border-radius:10px;font-size:15px}
  .row{margin-bottom:14px}.check{display:flex;align-items:center;gap:10px;padding:12px 0}.check input{width:auto}
  button{border:0;border-radius:10px;padding:12px 18px;background:#111827;color:#fff;cursor:pointer;font-size:15px}
  .secondary{background:#eef2ff;color:#111827;margin-right:8px}.notice{padding:12px;border-radius:10px;background:#fffbeb;color:#92400e;margin-bottom:16px}
  .ok{display:none;padding:12px;border-radius:10px;background:#ecfdf3;color:#067647;margin-top:12px}
  @media(max-width:700px){.layout{grid-template-columns:1fr}.grid{grid-template-columns:1fr}nav{display:grid;grid-template-columns:1fr 1fr}}
  </style></head><body>
  <header class="top"><div class="wrap"><div class="brand">Syria Commerce</div><div class="sub">إعدادات النظام</div></div></header>
  <div class="layout">
  <nav>
    <a href="/">🏠 الرئيسية</a><a href="/dashboard">👥 المسوقون</a><a href="/products">📦 المنتجات</a>
    <a href="/orders">🧾 الطلبات</a><a href="/commissions">💰 العمولات</a><a href="/customers">👤 العملاء</a>
    <a href="/reports">📊 التقارير</a><a href="/settings">⚙️ الإعدادات</a><a href="/permissions">🔐 الصلاحيات</a><a href="/activity">📝 سجل النشاط</a>
  </nav>
  <main>
    <div class="card section"><h1>إعدادات المتجر</h1>
      <p style="color:#667085">المرحلة 9: تجهيز مركز التحكم قبل ربط قاعدة البيانات.</p>
      <div class="notice">حالياً يتم حفظ الإعدادات على هذا المتصفح فقط. عند مرحلة قاعدة البيانات سيتم نقلها للحفظ المركزي.</div>
      <form id="settingsForm">
        <div class="grid">
          <div class="row"><label>اسم المتجر</label><input id="storeName" value="Syria Commerce"></div>
          <div class="row"><label>العملة</label><select id="currency"><option value="USD">USD — دولار</option><option value="JOD">JOD — دينار أردني</option><option value="SYP">SYP — ليرة سورية</option></select></div>
          <div class="row"><label>هاتف المتجر</label><input id="phone" placeholder="07xxxxxxxx"></div>
          <div class="row"><label>نسبة العمولة الافتراضية %</label><input id="commission" type="number" min="0" step="0.1" value="10"></div>
        </div>
        <div class="card section" style="box-shadow:none;background:#fafafa">
          <h2>تشغيل الإشعارات</h2>
          <label class="check"><input id="newOrder" type="checkbox" checked> تنبيه عند وصول طلب جديد</label>
          <label class="check"><input id="delivered" type="checkbox" checked> تنبيه عند تسليم الطلب</label>
          <label class="check"><input id="commissionNotice" type="checkbox" checked> تنبيه عند استحقاق العمولة</label>
        </div>
        <button type="submit">حفظ الإعدادات</button>
        <button type="button" class="secondary" id="reset">إعادة الافتراضي</button>
        <div id="ok" class="ok">تم حفظ الإعدادات على هذا الجهاز ✅</div>
      </form>
    </div>
  </main></div>
  <script>
  const ids=["storeName","currency","phone","commission","newOrder","delivered","commissionNotice"];
  const defaults={storeName:"Syria Commerce",currency:"USD",phone:"",commission:10,newOrder:true,delivered:true,commissionNotice:true};
  function load(){
    let x={...defaults,...JSON.parse(localStorage.getItem("sc_settings")||"{}")};
    ids.forEach(id=>document.getElementById(id).type==="checkbox"
      ? document.getElementById(id).checked=!!x[id]
      : document.getElementById(id).value=x[id]);
  }
  document.getElementById("settingsForm").onsubmit=e=>{
    e.preventDefault();let x={};
    ids.forEach(id=>x[id]=document.getElementById(id).type==="checkbox"
      ? document.getElementById(id).checked : document.getElementById(id).value);
    localStorage.setItem("sc_settings",JSON.stringify(x));
    document.getElementById("ok").style.display="block";
    setTimeout(()=>document.getElementById("ok").style.display="none",2200);
  };
  document.getElementById("reset").onclick=()=>{localStorage.removeItem("sc_settings");load()};
  load();
  </script></body></html>`,"الإعدادات");
}

async function permissionsPage(env) {
  return htmlResponse(`<!doctype html><html lang="ar" dir="rtl">
  <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>الصلاحيات | Syria Commerce</title>
  <style>
  *{box-sizing:border-box}body{margin:0;background:#f5f7fb;color:#172033;font-family:Arial,sans-serif}
  .top{background:#111827;color:#fff;padding:18px 22px}.wrap{max-width:1100px;margin:auto}
  .brand{font-size:24px;font-weight:700}.sub{opacity:.75;margin-top:5px}
  .layout{display:grid;grid-template-columns:220px 1fr;gap:18px;max-width:1100px;margin:22px auto;padding:0 16px}
  nav,.card{background:#fff;border:1px solid #e5e7eb;border-radius:16px;box-shadow:0 4px 18px #00000008}
  nav{padding:10px;height:max-content}nav a{display:block;padding:13px;border-radius:10px;color:#172033;text-decoration:none}
  nav a:hover{background:#f1f5f9}.section{padding:20px;margin-bottom:14px}
  .badge{display:inline-block;padding:6px 10px;border-radius:999px;background:#eef2ff}
  .muted{color:#667085}.notice{padding:12px;border-radius:10px;background:#fffbeb;color:#92400e;margin-bottom:16px}
  table{width:100%;border-collapse:collapse}th,td{padding:12px;border-bottom:1px solid #eee;text-align:right}
  .check{display:flex;align-items:center;gap:8px;justify-content:center}.check input{width:18px;height:18px}
  button{border:0;border-radius:10px;padding:12px 18px;background:#111827;color:#fff;cursor:pointer;font-size:15px}
  .secondary{background:#eef2ff;color:#111827;margin-right:8px}.ok{display:none;padding:12px;border-radius:10px;background:#ecfdf3;color:#067647;margin-top:12px}
  .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:14px}
  .role{padding:16px;border:1px solid #e5e7eb;border-radius:12px}.role h3{margin-top:0}
  @media(max-width:700px){.layout{grid-template-columns:1fr}nav{display:grid;grid-template-columns:1fr 1fr}}
  </style></head><body>
  <header class="top"><div class="wrap"><div class="brand">Syria Commerce</div><div class="sub">إدارة الصلاحيات</div></div></header>
  <div class="layout">
  <nav>
    <a href="/">🏠 الرئيسية</a><a href="/dashboard">👥 المسوقون</a><a href="/products">📦 المنتجات</a>
    <a href="/orders">🧾 الطلبات</a><a href="/commissions">💰 العمولات</a><a href="/customers">👤 العملاء</a>
    <a href="/reports">📊 التقارير</a><a href="/settings">⚙️ الإعدادات</a><a href="/permissions">🔐 الصلاحيات</a><a href="/activity">📝 سجل النشاط</a><a href="/permissions">🔐 الصلاحيات</a><a href="/activity">📝 سجل النشاط</a>
  </nav>
  <main>
    <div class="card section"><span class="badge">Phase 10</span>
      <h1>الصلاحيات والأدوار</h1>
      <p class="muted">تجهيز نظام التحكم بصلاحيات المستخدمين قبل ربط قاعدة البيانات.</p>
      <div class="notice">حالياً يتم حفظ الصلاحيات على هذا المتصفح فقط. عند ربط قاعدة البيانات سيتم نقلها للحفظ المركزي.</div>
    </div>

    <div class="grid">
      <div class="card role"><h3>👑 مدير النظام</h3><p class="muted">صلاحية كاملة على جميع الأنظمة.</p></div>
      <div class="card role"><h3>📦 مدير المنتجات</h3><p class="muted">المنتجات والمخزون والطلبات.</p></div>
      <div class="card role"><h3>💰 المحاسبة</h3><p class="muted">العمولات والتقارير المالية.</p></div>
      <div class="card role"><h3>👥 خدمة العملاء</h3><p class="muted">العملاء والطلبات والمتابعة.</p></div>
    </div>

    <div class="card section" style="margin-top:14px">
      <h2>صلاحيات الأدوار</h2>
      <div style="overflow:auto"><table>
      <thead><tr><th>النظام</th><th>مدير النظام</th><th>المنتجات</th><th>المحاسبة</th><th>خدمة العملاء</th></tr></thead>
      <tbody>
        <tr><td>المسوقون</td><td><input type="checkbox" data-k="admin-marketers" checked></td><td><input type="checkbox" data-k="products-marketers"></td><td><input type="checkbox" data-k="finance-marketers"></td><td><input type="checkbox" data-k="support-marketers" checked></td></tr>
        <tr><td>المنتجات</td><td><input type="checkbox" data-k="admin-products" checked></td><td><input type="checkbox" data-k="products-products" checked></td><td><input type="checkbox" data-k="finance-products"></td><td><input type="checkbox" data-k="support-products"></td></tr>
        <tr><td>الطلبات</td><td><input type="checkbox" data-k="admin-orders" checked></td><td><input type="checkbox" data-k="products-orders" checked></td><td><input type="checkbox" data-k="finance-orders" checked></td><td><input type="checkbox" data-k="support-orders" checked></td></tr>
        <tr><td>العمولات</td><td><input type="checkbox" data-k="admin-commissions" checked></td><td><input type="checkbox" data-k="products-commissions"></td><td><input type="checkbox" data-k="finance-commissions" checked></td><td><input type="checkbox" data-k="support-commissions"></td></tr>
        <tr><td>العملاء</td><td><input type="checkbox" data-k="admin-customers" checked></td><td><input type="checkbox" data-k="products-customers"></td><td><input type="checkbox" data-k="finance-customers"></td><td><input type="checkbox" data-k="support-customers" checked></td></tr>
        <tr><td>التقارير</td><td><input type="checkbox" data-k="admin-reports" checked></td><td><input type="checkbox" data-k="products-reports"></td><td><input type="checkbox" data-k="finance-reports" checked></td><td><input type="checkbox" data-k="support-reports" checked></td></tr>
        <tr><td>الإعدادات</td><td><input type="checkbox" data-k="admin-settings" checked></td><td><input type="checkbox" data-k="products-settings"></td><td><input type="checkbox" data-k="finance-settings"></td><td><input type="checkbox" data-k="support-settings"></td></tr>
      </tbody></table></div>
      <button id="save" style="margin-top:14px">حفظ الصلاحيات</button>
      <button id="reset" class="secondary">إعادة الافتراضي</button>
      <div id="ok" class="ok">تم حفظ الصلاحيات على هذا الجهاز ✅</div>
    </div>
  </main></div>
  <script>
  const boxes=[...document.querySelectorAll('input[type="checkbox"]')];
  function load(){const x=JSON.parse(localStorage.getItem("sc_permissions")||"{}");boxes.forEach(b=>{if(Object.prototype.hasOwnProperty.call(x,b.dataset.k))b.checked=!!x[b.dataset.k]})}
  document.getElementById("save").onclick=()=>{const x={};boxes.forEach(b=>x[b.dataset.k]=b.checked);localStorage.setItem("sc_permissions",JSON.stringify(x));document.getElementById("ok").style.display="block";setTimeout(()=>document.getElementById("ok").style.display="none",2200)};
  document.getElementById("reset").onclick=()=>{localStorage.removeItem("sc_permissions");location.reload()};
  load();
  </script></body></html>`,"الصلاحيات");
}

async function activityPage(env) {
  return htmlResponse(`<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>سجل النشاط | Syria Commerce</title>
  <style>*{box-sizing:border-box}body{margin:0;background:#f5f7fb;color:#172033;font-family:Arial,sans-serif}.top{background:#111827;color:#fff;padding:18px 22px}.wrap{max-width:1100px;margin:auto}.brand{font-size:24px;font-weight:700}.sub{opacity:.75;margin-top:5px}.layout{display:grid;grid-template-columns:220px 1fr;gap:18px;max-width:1100px;margin:22px auto;padding:0 16px}nav,.card{background:#fff;border:1px solid #e5e7eb;border-radius:16px;box-shadow:0 4px 18px #00000008}nav{padding:10px;height:max-content}nav a{display:block;padding:13px;border-radius:10px;color:#172033;text-decoration:none}nav a:hover{background:#f1f5f9}.section{padding:20px}.badge{display:inline-block;padding:6px 10px;border-radius:999px;background:#eef2ff}.muted{color:#667085}.notice{padding:12px;border-radius:10px;background:#fffbeb;color:#92400e;margin-bottom:16px}.toolbar{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px}button{border:0;border-radius:10px;padding:11px 16px;background:#111827;color:#fff;cursor:pointer}.secondary{background:#eef2ff;color:#111827}table{width:100%;border-collapse:collapse}th,td{padding:12px;border-bottom:1px solid #eee;text-align:right}td.time{white-space:nowrap;color:#667085}.empty{text-align:center;padding:30px;color:#667085}.danger{background:#b42318}@media(max-width:700px){.layout{grid-template-columns:1fr}nav{display:grid;grid-template-columns:1fr 1fr}table{font-size:13px}}
  </style></head><body><header class="top"><div class="wrap"><div class="brand">Syria Commerce</div><div class="sub">مركز متابعة نشاط النظام</div></div></header><div class="layout"><nav>
  <a href="/">🏠 الرئيسية</a><a href="/dashboard">👥 المسوقون</a><a href="/products">📦 المنتجات</a><a href="/orders">🧾 الطلبات</a><a href="/commissions">💰 العمولات</a><a href="/customers">👤 العملاء</a><a href="/reports">📊 التقارير</a><a href="/settings">⚙️ الإعدادات</a><a href="/permissions">🔐 الصلاحيات</a><a href="/activity">📝 سجل النشاط</a>
  </nav><main><div class="card section"><span class="badge">Phase 11</span><h1>سجل النشاط</h1><p class="muted">مركز موحّد لمراجعة الأحداث المهمة في لوحة الإدارة قبل تفعيل قاعدة البيانات.</p><div class="notice">هذه النسخة تحفظ السجل على هذا المتصفح فقط. عند ربط قاعدة البيانات سيتم تحويله إلى سجل مركزي دائم.</div><div class="toolbar"><button id="add">＋ إضافة حدث تجريبي</button><button id="seed" class="secondary">إضافة أحداث النظام الأساسية</button><button id="clear" class="danger">مسح السجل</button></div><div class="card" style="box-shadow:none"><div style="overflow:auto"><table><thead><tr><th>الوقت</th><th>النوع</th><th>الحدث</th><th>المستخدم</th></tr></thead><tbody id="rows"></tbody></table></div><div id="empty" class="empty">لا توجد أحداث مسجلة حالياً.</div></div></div></main></div>
  <script>
  const KEY="sc_activity";
  const base=[{type:"SYSTEM",event:"تم تشغيل مركز النشاط",user:"النظام"},{type:"SETTINGS",event:"تم تجهيز نظام الإعدادات",user:"المدير"},{type:"PERMISSIONS",event:"تم تجهيز نظام الصلاحيات",user:"المدير"}];
  function get(){try{return JSON.parse(localStorage.getItem(KEY)||"[]")}catch{return []}}
  function save(x){localStorage.setItem(KEY,JSON.stringify(x.slice(0,200)));render()}
  function add(type,event,user="المدير"){save([{type,event,user,time:new Date().toISOString()},...get()])}
   function render(){const data=get(), body=document.getElementById("rows"), empty=document.getElementById("empty");body.innerHTML=data.map(function(x){var ev=String(x.event||"").replace(/[&<>]/g,function(m){return {"&":"&amp;","<":"&lt;",">":"&gt;"}[m]});return "<tr><td class=\"time\">"+new Date(x.time).toLocaleString("ar-JO")+"</td><td><span class=\"badge\">"+String(x.type||"")+"</span></td><td>"+ev+"</td><td>"+String(x.user||"—")+"</td></tr>"}).join("");empty.style.display=data.length?"none":"block"}
  document.getElementById("add").onclick=()=>add("ACTION","تمت إضافة حدث تجريبي");
  document.getElementById("seed").onclick=()=>{const now=Date.now();save(base.map((x,i)=>({...x,time:new Date(now-i*60000).toISOString()})).concat(get()))};
  document.getElementById("clear").onclick=()=>{if(confirm("مسح سجل النشاط من هذا الجهاز؟")){localStorage.removeItem(KEY);render()}};
  render();
  </script></body></html>`,`سجل النشاط`);
}

async function dashboard(env) {
  const rows = await listMarketers(getStore(env));
  const dbState = getStore(env) ? "متصل" : "وضع تجريبي — قاعدة البيانات لم تُربط بعد";
  const tr = rows.map(x => `<tr><td>${x.code}</td><td>${x.name}</td><td>${x.phone}</td><td>${x.governorate}</td><td>${new Date(x.created_at).toLocaleString("ar-JO")}</td></tr>`).join("");
  return htmlResponse(`<header><main><h1>Syria Commerce</h1><span class="badge">لوحة المسوقين — المرحلة 2</span></main></header>
<main>
<div class="card"><div class="notice">${dbState}</div></div>
<div class="grid">
<div class="card"><div class="muted">عدد المسوقين</div><div class="stat">${rows.length}</div></div>
<div class="card"><div class="muted">حالة النظام</div><div class="stat">✓</div></div>
</div>
<div class="card"><h2>إضافة مسوق</h2>
<form id="f"><div class="row">
<div><label>الاسم</label><input name="name" required></div>
<div><label>الهاتف</label><input name="phone" required></div>
</div><div style="margin-top:12px"><label>المحافظة</label><select name="governorate" required>
<option value="">اختر المحافظة</option><option>دمشق</option><option>ريف دمشق</option><option>حلب</option><option>حمص</option><option>حماة</option><option>اللاذقية</option><option>طرطوس</option><option>إدلب</option><option>درعا</option><option>السويداء</option><option>القنيطرة</option><option>دير الزور</option><option>الرقة</option><option>الحسكة</option>
</select></div><button class="btn" style="margin-top:14px">تسجيل المسوق</button></form>
<p id="msg" class="muted"></p></div>
<div class="card"><h2>المسوقون</h2><div style="overflow:auto"><table><thead><tr><th>الكود</th><th>الاسم</th><th>الهاتف</th><th>المحافظة</th><th>التاريخ</th></tr></thead><tbody>${tr || "<tr><td colspan=5>لا يوجد مسوقون</td></tr>"}</tbody></table></div></div>
</main>
<script>
document.querySelector("#f").addEventListener("submit",async e=>{
 e.preventDefault(); const f=new FormData(e.target); const msg=document.querySelector("#msg");
 const r=await fetch("/api/marketers",{headers:{"content-type":"application/json"},method:"POST",body:JSON.stringify(Object.fromEntries(f))});
 const d=await r.json(); msg.textContent=d.ok?"تم التسجيل — الكود: "+d.marketer.code:(d.error||"حدث خطأ");
 if(d.ok) setTimeout(()=>location.reload(),700);
});
</script>`, "لوحة المسوقين");
}

const ADMIN_MODULES = [
  ["dashboard","📊","الرئيسية","/dashboard"],["marketers","👥","المسوقون","/dashboard"],["products","📦","المنتجات","/products"],
  ["orders","🧾","الطلبات","/orders"],["customers","👤","العملاء","/customers"],["commissions","💰","العمولات","/commissions"],
  ["reports","📈","التقارير","/reports"],["withdrawals","💸","سحب العمولات","/withdrawals"],["coupons","🏷️","الكوبونات","/coupons"],
  ["offers","🎯","العروض والبنرات","/offers"],["delivery","🚚","الدفع والتوصيل","/delivery"],["locations","📍","المحافظات والمناطق","/locations"],
  ["users","🔐","المستخدمون والصلاحيات","/users"],["support","💬","دعم العملاء","/support"],["activity","📝","سجل النشاط","/activity"],
  ["notifications","🔔","الإشعارات","/notifications"],["settings","⚙️","الإعدادات","/settings"],["system","🛡️","مراقبة النظام","/system"]
];
function navHtml(){return ADMIN_MODULES.map(x=>`<a href="${x[3]}">${x[1]} ${x[2]}</a>`).join("")}
function adminPage(title,content,script="") { return htmlResponse(`<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)} | Syria Commerce</title><style>
*{box-sizing:border-box}body{margin:0;background:#f5f7fb;color:#172033;font-family:Arial,sans-serif}.top{background:#111827;color:#fff;padding:18px 22px}.wrap{max-width:1200px;margin:auto}.brand{font-size:24px;font-weight:700}.sub{opacity:.75;margin-top:5px}.layout{display:grid;grid-template-columns:230px 1fr;gap:18px;max-width:1200px;margin:22px auto;padding:0 16px}nav,.card{background:#fff;border:1px solid #e5e7eb;border-radius:16px;box-shadow:0 4px 18px #00000008}nav{padding:10px;height:max-content}nav a{display:block;padding:11px;border-radius:10px;color:#172033;text-decoration:none;font-size:14px}nav a:hover{background:#f1f5f9}.card{padding:20px;margin-bottom:14px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:14px}.num{font-size:28px;font-weight:700;margin-top:7px}.muted{color:#667085}.badge,.pill{display:inline-block;padding:6px 10px;border-radius:999px;background:#eef2ff}.toolbar{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px}button{border:0;border-radius:10px;padding:11px 16px;background:#111827;color:#fff;cursor:pointer}.secondary{background:#eef2ff;color:#111827}.danger{background:#b42318}input,select,textarea{width:100%;padding:11px;border:1px solid #d0d5dd;border-radius:10px;font-size:15px}label{display:block;font-weight:600;margin-bottom:6px}.row{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px}table{width:100%;border-collapse:collapse}th,td{padding:11px;border-bottom:1px solid #eee;text-align:right;white-space:nowrap}.ok{color:#067647;background:#ecfdf3;padding:5px 8px;border-radius:999px}.warn{color:#92400e;background:#fffbeb;padding:5px 8px;border-radius:999px}.empty{text-align:center;padding:28px;color:#667085}@media(max-width:760px){.layout{grid-template-columns:1fr}nav{display:grid;grid-template-columns:1fr 1fr}.row{grid-template-columns:1fr}}
</style></head><body><header class="top"><div class="wrap"><div class="brand">Syria Commerce</div><div class="sub">لوحة الإدارة الكاملة</div></div></header><div class="layout"><nav>${navHtml()}</nav><main>${content}</main></div><script>${script}</script></body></html>`,title)}
function localModulePage(title,key,fields,columns){
 const form=fields.map(f=>`<div><label>${esc(f.label)}</label><input id="f_${f.key}" placeholder="${esc(f.placeholder||'')}" ${f.type==='number'?'type="number"':''}></div>`).join('');
 const th=columns.map(c=>`<th>${esc(c.label)}</th>`).join('');
 const js=`const K='sc_${key}';function get(){try{return JSON.parse(localStorage.getItem(K)||'[]')}catch{return[]}}function save(a){localStorage.setItem(K,JSON.stringify(a));render()}function esc2(v){return String(v??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]))}function render(){const a=get(),b=document.getElementById('rows');b.innerHTML=a.map((x,i)=>'<tr>${columns.map(c=>'<td>'+esc2(x['${c.key}'])+'</td>').join('')}<td><button class="danger" onclick="del('+i+')">حذف</button></td></tr>').join('');document.getElementById('empty').style.display=a.length?'none':'block'}function del(i){const a=get();a.splice(i,1);save(a)}document.getElementById('form').onsubmit=e=>{e.preventDefault();const x={};${fields.map(f=>`x['${f.key}']=document.getElementById('f_${f.key}').value`).join('')}x.created_at=new Date().toISOString();save([x,...get()]);e.target.reset()};render();`;
 return adminPage(title,`<div class="card"><span class="badge">لوحة الإدارة</span><h1>${esc(title)}</h1><p class="muted">إدارة كاملة للبيانات من الواجهة. سيتم تحويل التخزين إلى قاعدة البيانات عند مرحلة الربط.</p></div><div class="card"><h2>إضافة</h2><form id="form"><div class="row">${form}</div><button>حفظ</button></form></div><div class="card"><h2>القائمة</h2><div style="overflow:auto"><table><thead><tr>${th}<th>إجراء</th></tr></thead><tbody id="rows"></tbody></table></div><div id="empty" class="empty">لا توجد بيانات.</div></div>`,js)
}
async function withdrawalsPage(){return localModulePage('سحب العمولات','withdrawals',[{key:'marketer',label:'كود المسوق'},{key:'amount',label:'المبلغ',type:'number'},{key:'method',label:'طريقة السحب'}],[{key:'marketer',label:'المسوق'},{key:'amount',label:'المبلغ'},{key:'method',label:'الطريقة'}])}
async function couponsPage(){return localModulePage('الكوبونات والخصومات','coupons',[{key:'code',label:'الكود'},{key:'discount',label:'الخصم',type:'number'},{key:'status',label:'الحالة',placeholder:'فعال / متوقف'}],[{key:'code',label:'الكود'},{key:'discount',label:'الخصم'},{key:'status',label:'الحالة'}])}
async function offersPage(){return localModulePage('العروض والبنرات','offers',[{key:'title',label:'العنوان'},{key:'image',label:'رابط الصورة'},{key:'status',label:'الحالة'}],[{key:'title',label:'العنوان'},{key:'image',label:'الصورة'},{key:'status',label:'الحالة'}])}
async function deliveryPage(){return localModulePage('الدفع والتوصيل','delivery',[{key:'name',label:'الاسم'},{key:'fee',label:'الرسوم',type:'number'},{key:'status',label:'الحالة'}],[{key:'name',label:'الاسم'},{key:'fee',label:'الرسوم'},{key:'status',label:'الحالة'}])}
async function locationsPage(){return localModulePage('المحافظات والمناطق','locations',[{key:'governorate',label:'المحافظة'},{key:'area',label:'المنطقة'}],[{key:'governorate',label:'المحافظة'},{key:'area',label:'المنطقة'}])}
async function usersPage(){return localModulePage('المستخدمون والصلاحيات','users',[{key:'name',label:'الاسم'},{key:'email',label:'البريد'},{key:'role',label:'الدور'}],[{key:'name',label:'الاسم'},{key:'email',label:'البريد'},{key:'role',label:'الدور'}])}
async function supportPage(){return localModulePage('دعم العملاء','support',[{key:'customer',label:'العميل'},{key:'subject',label:'الموضوع'},{key:'status',label:'الحالة'}],[{key:'customer',label:'العميل'},{key:'subject',label:'الموضوع'},{key:'status',label:'الحالة'}])}
async function notificationsPage(){return localModulePage('الإشعارات','notifications',[{key:'title',label:'العنوان'},{key:'message',label:'الرسالة'},{key:'type',label:'النوع'}],[{key:'title',label:'العنوان'},{key:'message',label:'الرسالة'},{key:'type',label:'النوع'}])}
async function systemPage(){return adminPage('مراقبة النظام',`<div class="card"><span class="badge">System</span><h1>مراقبة النظام</h1><div class="grid"><div class="card"><div class="muted">Worker</div><div class="num" id="worker">...</div></div><div class="card"><div class="muted">API</div><div class="num" id="api">...</div></div><div class="card"><div class="muted">قاعدة البيانات</div><div class="num">غير مربوطة</div></div></div><button onclick="check()">فحص الآن</button><p id="msg" class="muted"></p></div>`,`async function check(){document.getElementById('worker').textContent='✓ يعمل';try{const r=await fetch('/api/health');const d=await r.json();document.getElementById('api').textContent=d.ok?'✓ OK':'✕';document.getElementById('msg').textContent='تم فحص API بنجاح'}catch(e){document.getElementById('api').textContent='✕'}}check();`)}

export default { async fetch(request,env){ const url=new URL(request.url);
 if(request.method==='GET'&&url.pathname==='/') return adminPage('الرئيسية',`<div class="card"><span class="badge">Admin Complete</span><h1>لوحة الإدارة</h1><p class="muted">جميع أقسام الإدارة في مكان واحد. الموقع العام وقاعدة البيانات سيتم ربطهما لاحقاً.</p></div><div class="grid">${ADMIN_MODULES.map(x=>`<a class="card" href="${x[3]}" style="color:#172033;text-decoration:none"><div style="font-size:25px">${x[1]}</div><h3>${x[2]}</h3><div class="muted">فتح القسم</div></a>`).join('')}</div>`);
 if(request.method==='GET'&&url.pathname==='/withdrawals') return withdrawalsPage();
 if(request.method==='GET'&&url.pathname==='/coupons') return couponsPage();
 if(request.method==='GET'&&url.pathname==='/offers') return offersPage();
 if(request.method==='GET'&&url.pathname==='/delivery') return deliveryPage();
 if(request.method==='GET'&&url.pathname==='/locations') return locationsPage();
 if(request.method==='GET'&&url.pathname==='/users') return usersPage();
 if(request.method==='GET'&&url.pathname==='/support') return supportPage();
 if(request.method==='GET'&&url.pathname==='/notifications') return notificationsPage();
 if(request.method==='GET'&&url.pathname==='/system') return systemPage();
 if(request.method==='GET'&&url.pathname==='/api/health') return json({ok:true,service:'syria-commerce',mode:'admin-complete'});
 if(request.method==='GET'&&url.pathname==='/dashboard') return dashboard(env);
 if(request.method==='GET'&&url.pathname==='/products') return productsPage(env);
 if(request.method==='GET'&&url.pathname==='/orders') return ordersPage(env);
 if(request.method==='GET'&&url.pathname==='/commissions') return commissionsPage(env);
 if(request.method==='GET'&&url.pathname==='/customers') return customersPage(env);
 if(request.method==='GET'&&url.pathname==='/reports') return reportsPage(env);
 if(request.method==='GET'&&url.pathname==='/settings') return settingsPage(env);
 if(request.method==='GET'&&url.pathname==='/permissions') return permissionsPage(env);
 if(request.method==='GET'&&url.pathname==='/activity') return activityPage(env);
 if(request.method==='GET'&&url.pathname==='/api/marketers') return json({ok:true,marketers:await listMarketers(getStore(env))});
 if(request.method==='GET'&&url.pathname==='/api/products') return json({ok:true,products:await listProducts(getStore(env))});
 if(request.method==='GET'&&url.pathname==='/api/orders') return json({ok:true,orders:await listOrders(getStore(env))});
 if(request.method==='POST'&&url.pathname==='/api/orders') return createOrder(request,env);
 if(request.method==='PATCH'&&url.pathname==='/api/orders') return updateOrder(request,env);
 if(request.method==='POST'&&url.pathname==='/api/products') return createProduct(request,env);
 if(request.method==='DELETE'&&url.pathname==='/api/products') return deleteProduct(request,env);
 if(request.method==='POST'&&url.pathname==='/api/marketers') return register(request,env);
 return json({ok:false,error:'Not Found'},404);
 }};
