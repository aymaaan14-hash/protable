import { useState, useMemo, useEffect } from "react";

const G_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
html,body{font-family:'Tajawal',sans-serif;direction:rtl;background:#0C1120;color:#E2E8F0;}
::-webkit-scrollbar{width:5px;height:5px;}::-webkit-scrollbar-track{background:#0C1120;}
::-webkit-scrollbar-thumb{background:#1E2840;border-radius:3px;}
input,select,textarea,button{font-family:'Tajawal',sans-serif;direction:rtl;}
input[type=range]{accent-color:#C9A84C;width:100%;}
`;

const C={bg:"#0C1120",surf:"#111827",surf2:"#0F1628",brd:"#1E2840",
  gold:"#C9A84C",txt:"#E2E8F0",sub:"#64748B",
  ok:"#22C55E",warn:"#F59E0B",err:"#EF4444",blue:"#3B82F6",pur:"#A855F7"};

const ST={
  new:    {label:"جديد",               c:C.sub,  bg:"#1A2030"},
  gypsum: {label:"جارٍ تنفيذ الجبس",   c:C.blue, bg:"#0D1F3C"},
  paint:  {label:"جارٍ تنفيذ الصبغ",   c:C.pur,  bg:"#1A0D3C"},
  touchup:{label:"Touch-up",           c:C.warn, bg:"#2D1E00"},
  done:   {label:"مكتمل",              c:C.ok,   bg:"#0A2010"},
};
const PS={
  paid:  {label:"مدفوع",    c:C.ok,  bg:"#0A2010"},
  unpaid:{label:"غير مدفوع",c:C.sub, bg:"#1A2030"},
  late:  {label:"متأخر",    c:C.err, bg:"#2D0A0A"},
};

const td=()=>new Date().toISOString().split("T")[0];
const addD=(ds,n)=>{if(!ds)return null;const d=new Date(ds);d.setDate(d.getDate()+n);return d.toISOString().split("T")[0];};
const fmt=(ds)=>{if(!ds)return"—";return new Date(ds).toLocaleDateString("ar-EG",{day:"numeric",month:"short",year:"numeric"});};
const isLate=(ds,st)=>!!ds&&st!=="paid"&&new Date(ds)<new Date();
const projOverdue=(p)=>!!p.endDate&&p.status!=="done"&&new Date(p.endDate)<new Date();

let _uid=20;
const uid=()=>++_uid;

const INIT_PROJECTS=[
  {id:1,client:"محمد العمري",number:"PRJ-001",location:"مسقط - الموالح",contractDate:"2026-04-01",
   startDate:"2026-04-10",endDate:"2026-05-05",gypsumDays:12,paintDays:8,touchupDays:2,
   status:"gypsum",gp:65,pp:0,responsible:"أحمد الرحبي",totalValue:2000,notes:"سقف ديكوري بتصميم خاص",issues:"",
   payments:[
     {id:1,label:"الدفعة 1 – عند التوقيع",      amount:500,dueDate:"2026-04-01",status:"paid"},
     {id:2,label:"الدفعة 2 – قبل بدء الجبس",     amount:500,dueDate:"2026-04-10",status:"paid"},
     {id:3,label:"الدفعة 3 – بعد انتهاء الجبس",  amount:500,dueDate:"2026-04-22",status:"unpaid"},
     {id:4,label:"الدفعة 4 – قبل بدء الصبغ",      amount:500,dueDate:"2026-04-30",status:"unpaid"},
   ],
   punchList:[{id:1,desc:"إصلاح تشقق في الزاوية الشمالية",resp:"أحمد الرحبي",due:"2026-05-03",closed:false}]},
  {id:2,client:"سالم البلوشي",number:"PRJ-002",location:"مسقط - بوشر",contractDate:"2026-04-15",
   startDate:"2026-05-10",endDate:"2026-06-05",gypsumDays:10,paintDays:7,touchupDays:2,
   status:"new",gp:0,pp:0,responsible:"محمد الفارسي",totalValue:3200,notes:"",issues:"",
   payments:[
     {id:1,label:"الدفعة 1 – عند التوقيع",      amount:800,dueDate:"2026-04-15",status:"paid"},
     {id:2,label:"الدفعة 2 – قبل بدء الجبس",     amount:800,dueDate:"2026-05-10",status:"unpaid"},
     {id:3,label:"الدفعة 3 – بعد انتهاء الجبس",  amount:800,dueDate:"2026-05-20",status:"unpaid"},
     {id:4,label:"الدفعة 4 – قبل بدء الصبغ",      amount:800,dueDate:"2026-05-28",status:"unpaid"},
   ],punchList:[]},
  {id:3,client:"خالد الحوسني",number:"PRJ-003",location:"مسقط - الخوض",contractDate:"2026-03-15",
   startDate:"2026-03-20",endDate:"2026-04-20",gypsumDays:15,paintDays:10,touchupDays:2,
   status:"done",gp:100,pp:100,responsible:"علي الحجري",totalValue:4800,notes:"تم التسليم بنجاح",issues:"",
   payments:[
     {id:1,label:"الدفعة 1",amount:1200,dueDate:"2026-03-15",status:"paid"},
     {id:2,label:"الدفعة 2",amount:1200,dueDate:"2026-03-20",status:"paid"},
     {id:3,label:"الدفعة 3",amount:1200,dueDate:"2026-04-04",status:"paid"},
     {id:4,label:"الدفعة 4",amount:1200,dueDate:"2026-04-15",status:"paid"},
   ],punchList:[]},
];

const INIT_TEAMS={
  gypsum:{workers:[{id:1,name:"أحمد الرحبي"},{id:2,name:"محمد الفارسي"},{id:3,name:"علي الحجري"},{id:4,name:"سعيد البلوشي"}],cap:100},
  paint: {workers:[{id:1,name:"عمر الشبلي"},{id:2,name:"ناصر الكيومي"},{id:3,name:"يوسف العبري"}],cap:150},
};

/* ── UI Atoms ── */
const Chip=({label,c,bg})=>(
  <span style={{display:"inline-block",padding:"3px 10px",borderRadius:20,fontSize:12,fontWeight:700,color:c,background:bg,border:`1px solid ${c}33`,whiteSpace:"nowrap"}}>{label}</span>
);
const SBadge=({s})=>{const x=ST[s];return x?<Chip label={x.label} c={x.c} bg={x.bg}/>:null;};
const PBadge=({s})=>{const x=PS[s];return x?<Chip label={x.label} c={x.c} bg={x.bg}/>:null;};

const Bar=({v,c=C.gold})=>(
  <div style={{background:C.brd,borderRadius:4,height:7,overflow:"hidden",minWidth:80}}>
    <div style={{height:"100%",width:`${v}%`,background:c,borderRadius:4,transition:"width .3s"}}/>
  </div>
);

const Card=({children,style={}})=>(
  <div style={{background:C.surf,border:`1px solid ${C.brd}`,borderRadius:12,padding:20,...style}}>{children}</div>
);

const StatCard=({icon,title,val,c=C.gold})=>(
  <Card style={{display:"flex",alignItems:"center",gap:14}}>
    <div style={{width:50,height:50,borderRadius:12,background:`${c}18`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{icon}</div>
    <div><div style={{fontSize:22,fontWeight:800,color:c,lineHeight:1.2}}>{val}</div><div style={{fontSize:13,color:C.sub,marginTop:3}}>{title}</div></div>
  </Card>
);

const Inp=({style={},...p})=>(
  <input style={{background:"#080C18",border:`1px solid ${C.brd}`,borderRadius:8,color:C.txt,padding:"8px 12px",fontSize:14,outline:"none",width:"100%",...style}} {...p}/>
);
const Sel=({children,style={},...p})=>(
  <select style={{background:"#080C18",border:`1px solid ${C.brd}`,borderRadius:8,color:C.txt,padding:"8px 12px",fontSize:14,outline:"none",width:"100%",...style}} {...p}>{children}</select>
);
const Txta=({style={},...p})=>(
  <textarea style={{background:"#080C18",border:`1px solid ${C.brd}`,borderRadius:8,color:C.txt,padding:"8px 12px",fontSize:14,outline:"none",width:"100%",resize:"vertical",fontFamily:"Tajawal,sans-serif",...style}} {...p}/>
);

const Btn=({children,onClick,v="primary",sm=false,style={}})=>{
  const vs={primary:{bg:C.gold,c:"#080C18",b:"none"},ghost:{bg:"transparent",c:C.txt,b:`1px solid ${C.brd}`},danger:{bg:`${C.err}1A`,c:C.err,b:`1px solid ${C.err}40`},ok:{bg:`${C.ok}1A`,c:C.ok,b:`1px solid ${C.ok}40`}};
  const x=vs[v]||vs.primary;
  return(
    <button onClick={onClick} style={{background:x.bg,color:x.c,border:x.b,borderRadius:8,padding:sm?"5px 12px":"8px 18px",fontSize:sm?13:14,fontWeight:700,cursor:"pointer",fontFamily:"Tajawal,sans-serif",whiteSpace:"nowrap",...style}}
      onMouseOver={e=>e.currentTarget.style.opacity=".8"} onMouseOut={e=>e.currentTarget.style.opacity="1"}>
      {children}
    </button>
  );
};

const SH=({title,action})=>(
  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
    <h2 style={{fontSize:20,fontWeight:800,color:C.txt}}>{title}</h2>
    {action}
  </div>
);

const TH=({cols})=>(
  <thead><tr style={{background:C.surf2}}>
    {cols.map(h=><th key={h} style={{padding:"10px 14px",textAlign:"right",color:C.sub,fontSize:12,fontWeight:700,whiteSpace:"nowrap",borderBottom:`1px solid ${C.brd}`}}>{h}</th>)}
  </tr></thead>
);
const TD=({children,style={}})=><td style={{padding:"11px 14px",borderBottom:`1px solid ${C.brd}90`,fontSize:14,...style}}>{children}</td>;

/* ── DASHBOARD ── */
function Dashboard({projects,teams}){
  const s=useMemo(()=>{
    const active=projects.filter(p=>p.status!=="done").length;
    const done=projects.filter(p=>p.status==="done").length;
    const late=projects.filter(projOverdue).length;
    const paid=projects.flatMap(p=>p.payments.filter(x=>x.status==="paid").map(x=>x.amount)).reduce((a,b)=>a+b,0);
    const total=projects.reduce((a,p)=>a+p.totalValue,0);
    const remaining=total-paid;
    const pending=projects.flatMap(p=>p.payments.filter(x=>x.status!=="paid").map(x=>({...x,client:p.client,pno:p.number})));
    const gypsumBusy=projects.some(p=>["gypsum","new"].includes(p.status)&&p.status!=="done");
    const paintBusy=projects.some(p=>["paint","touchup"].includes(p.status)&&p.status!=="done");
    return{active,done,late,paid,total,remaining,pending,gypsumBusy,paintBusy};
  },[projects]);

  const dateStr=new Date().toLocaleDateString("ar-EG",{weekday:"long",day:"numeric",month:"long",year:"numeric"});

  return(
    <div>
      <div style={{marginBottom:22}}>
        <div style={{fontSize:13,color:C.sub}}>{dateStr}</div>
        <h1 style={{fontSize:25,fontWeight:800,color:C.txt,marginTop:4}}>لوحة التحكم الرئيسية</h1>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(170px,1fr))",gap:14,marginBottom:22}}>
        <StatCard icon="📋" title="مشاريع نشطة"    val={s.active}   c={C.blue}/>
        <StatCard icon="⚠️" title="مشاريع متأخرة"  val={s.late}    c={C.err}/>
        <StatCard icon="✅" title="مشاريع مكتملة"  val={s.done}    c={C.ok}/>
        <StatCard icon="💰" title="إجمالي العقود"   val={`${s.total.toLocaleString()} ر.ع`} c={C.gold}/>
        <StatCard icon="💵" title="المبالغ المحصلة" val={`${s.paid.toLocaleString()} ر.ع`}  c={C.ok}/>
        <StatCard icon="⏳" title="المتبقي للتحصيل" val={`${s.remaining.toLocaleString()} ر.ع`} c={C.warn}/>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18,marginBottom:18}}>
        {/* Teams */}
        <Card>
          <div style={{fontWeight:700,fontSize:15,marginBottom:14,color:C.txt}}>حالة الفرق</div>
          {[["gypsum","🏗️ فريق الجبس",s.gypsumBusy],["paint","🎨 فريق الصبغ",s.paintBusy]].map(([k,lbl,busy])=>(
            <div key={k} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 14px",borderRadius:10,background:busy?`${C.warn}12`:`${C.ok}12`,border:`1px solid ${busy?C.warn:C.ok}30`,marginBottom:10}}>
              <div>
                <div style={{fontWeight:600,fontSize:14}}>{lbl}</div>
                <div style={{fontSize:12,color:C.sub,marginTop:2}}>{teams[k].workers.length} عمال · {teams[k].cap} م² / يوم</div>
              </div>
              <Chip label={busy?"🟡 مشغول":"🟢 متاح"} c={busy?C.warn:C.ok} bg={busy?`${C.warn}20`:`${C.ok}20`}/>
            </div>
          ))}
        </Card>

        {/* Pending payments */}
        <Card>
          <div style={{fontWeight:700,fontSize:15,marginBottom:14,color:C.txt}}>🔔 دفعات مستحقة ({s.pending.length})</div>
          <div style={{maxHeight:190,overflowY:"auto",display:"flex",flexDirection:"column",gap:8}}>
            {s.pending.length===0
              ?<div style={{color:C.sub,fontSize:14,textAlign:"center",padding:20}}>لا توجد دفعات مستحقة</div>
              :s.pending.map((pay,i)=>{
                const late=isLate(pay.dueDate,pay.status);
                return(
                  <div key={i} style={{padding:"8px 12px",borderRadius:8,background:late?`${C.err}15`:`${C.brd}80`,border:late?`1px solid ${C.err}40`:"none",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div><div style={{fontSize:13,fontWeight:600}}>{pay.client}</div><div style={{fontSize:12,color:C.sub}}>{pay.label}</div></div>
                    <div><div style={{fontSize:14,fontWeight:800,color:late?C.err:C.gold}}>{pay.amount.toLocaleString()} ر.ع</div><div style={{fontSize:11,color:C.sub}}>{fmt(pay.dueDate)}</div></div>
                  </div>
                );
              })
            }
          </div>
        </Card>
      </div>

      {/* Projects summary table */}
      <Card style={{padding:0,overflow:"hidden"}}>
        <div style={{padding:"14px 18px",borderBottom:`1px solid ${C.brd}`,fontWeight:700,fontSize:15}}>جميع المشاريع – نظرة عامة</div>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <TH cols={["العميل","الموقع","البداية","الانتهاء","إنجاز الجبس","إنجاز الصبغ","الحالة"]}/>
            <tbody>
              {projects.map(p=>(
                <tr key={p.id} style={{transition:"background .15s"}}
                    onMouseOver={e=>e.currentTarget.style.background="#ffffff08"}
                    onMouseOut={e=>e.currentTarget.style.background="transparent"}>
                  <TD><span style={{fontWeight:700,color:C.gold,marginLeft:6}}>{p.number}</span>{p.client}</TD>
                  <TD style={{color:C.sub,fontSize:13}}>{p.location}</TD>
                  <TD style={{fontSize:13}}>{fmt(p.startDate)}</TD>
                  <TD style={{fontSize:13,color:projOverdue(p)?C.err:C.txt}}>{projOverdue(p)?"⚠ ":""}{fmt(p.endDate)}</TD>
                  <TD><div style={{fontSize:11,color:C.blue,marginBottom:3}}>{p.gp}%</div><Bar v={p.gp} c={C.blue}/></TD>
                  <TD><div style={{fontSize:11,color:C.pur,marginBottom:3}}>{p.pp}%</div><Bar v={p.pp} c={C.pur}/></TD>
                  <TD><SBadge s={p.status}/></TD>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

/* ── ADD PROJECT MODAL ── */
function AddModal({projects,onSave,onClose}){
  const [f,setF]=useState({client:"",number:`PRJ-00${projects.length+1}`,location:"",contractDate:td(),gypsumDays:10,paintDays:7,touchupDays:2,totalValue:"",responsible:"",notes:""});
  const upd=(k)=>(e)=>setF(p=>({...p,[k]:e.target.value}));

  const sug=useMemo(()=>{
    const active=projects.filter(p=>p.status!=="done");
    const latestEnd=active.reduce((mx,p)=>{
      const e=p.endDate||addD(p.startDate,(p.gypsumDays||0)+(p.paintDays||0)+(p.touchupDays||0));
      return(e&&e>mx)?e:mx;
    },td());
    const gs=latestEnd>=td()?latestEnd:td();
    const ge=addD(gs,Number(f.gypsumDays)||0);
    const ps=addD(ge,1);
    const pe=addD(ps,Number(f.paintDays)||0);
    const te=addD(pe,Number(f.touchupDays)||0);
    return{gs,ge,ps,pe,te};
  },[projects,f.gypsumDays,f.paintDays,f.touchupDays]);

  const save=()=>{
    if(!f.client.trim()||!f.number.trim()||!f.totalValue){alert("يرجى ملء: اسم العميل، رقم المشروع، والقيمة الإجمالية");return;}
    const v=Number(f.totalValue);
    onSave({id:uid(),...f,
      gypsumDays:Number(f.gypsumDays),paintDays:Number(f.paintDays),touchupDays:Number(f.touchupDays),
      totalValue:v,startDate:sug.gs,endDate:sug.te,
      status:"new",gp:0,pp:0,issues:"",
      payments:[
        {id:1,label:"الدفعة 1 – عند التوقيع",      amount:Math.round(v*.25),dueDate:f.contractDate,status:"unpaid"},
        {id:2,label:"الدفعة 2 – قبل بدء الجبس",     amount:Math.round(v*.25),dueDate:sug.gs,        status:"unpaid"},
        {id:3,label:"الدفعة 3 – بعد انتهاء الجبس",  amount:Math.round(v*.25),dueDate:sug.ge,        status:"unpaid"},
        {id:4,label:"الدفعة 4 – قبل بدء الصبغ",      amount:Math.round(v*.25),dueDate:sug.ps,        status:"unpaid"},
      ],punchList:[]});
  };

  const InfoRow=({icon,lbl,val,c})=>(
    <div style={{display:"flex",justifyContent:"space-between",padding:"8px 12px",borderRadius:8,background:`${c}15`,border:`1px solid ${c}25`,marginBottom:7}}>
      <span style={{fontSize:13,color:C.sub}}>{icon} {lbl}</span>
      <strong style={{fontSize:13,color:c}}>{val}</strong>
    </div>
  );

  const FRow=({lbl,children})=>(
    <div style={{marginBottom:11}}>
      <label style={{display:"block",fontSize:12,color:C.sub,marginBottom:5}}>{lbl}</label>
      {children}
    </div>
  );

  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.75)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999,padding:16}}>
      <div style={{background:C.surf,border:`1px solid ${C.brd}`,borderRadius:16,width:"100%",maxWidth:700,maxHeight:"92vh",overflowY:"auto",padding:28}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}>
          <h2 style={{fontSize:19,fontWeight:800,color:C.gold}}>➕ إضافة مشروع جديد</h2>
          <Btn v="ghost" onClick={onClose} sm>✕ إغلاق</Btn>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
          <div>
            <div style={{fontSize:12,color:C.sub,fontWeight:700,marginBottom:12,letterSpacing:.5}}>معلومات العميل والمشروع</div>
            <FRow lbl="اسم العميل *"><Inp value={f.client} onChange={upd("client")} placeholder="محمد العمري"/></FRow>
            <FRow lbl="رقم المشروع *"><Inp value={f.number} onChange={upd("number")}/></FRow>
            <FRow lbl="الموقع"><Inp value={f.location} onChange={upd("location")} placeholder="مسقط - الموالح"/></FRow>
            <FRow lbl="تاريخ العقد"><Inp type="date" value={f.contractDate} onChange={upd("contractDate")}/></FRow>
            <FRow lbl="القيمة الإجمالية للعقد (ر.ع) *"><Inp type="number" value={f.totalValue} onChange={upd("totalValue")} placeholder="مثال: 2000"/></FRow>
            <FRow lbl="المسؤول"><Inp value={f.responsible} onChange={upd("responsible")}/></FRow>
            <FRow lbl="ملاحظات"><Txta value={f.notes} onChange={upd("notes")} rows={2}/></FRow>
          </div>
          <div>
            <div style={{fontSize:12,color:C.sub,fontWeight:700,marginBottom:12,letterSpacing:.5}}>مدة الأعمال</div>
            <FRow lbl="عدد أيام الجبس"><Inp type="number" value={f.gypsumDays} onChange={upd("gypsumDays")} min="1"/></FRow>
            <FRow lbl="عدد أيام الصبغ"><Inp type="number" value={f.paintDays} onChange={upd("paintDays")} min="1"/></FRow>
            <FRow lbl="عدد أيام التتش أب"><Inp type="number" value={f.touchupDays} onChange={upd("touchupDays")} min="1"/></FRow>

            <div style={{fontSize:12,color:C.sub,fontWeight:700,margin:"16px 0 12px",letterSpacing:.5}}>📅 المواعيد المحسوبة تلقائياً</div>
            <InfoRow icon="🏗️" lbl="بداية أعمال الجبس"   val={fmt(sug.gs)} c={C.blue}/>
            <InfoRow icon="✅" lbl="انتهاء الجبس"         val={fmt(sug.ge)} c={C.blue}/>
            <InfoRow icon="🎨" lbl="بداية أعمال الصبغ"   val={fmt(sug.ps)} c={C.pur}/>
            <InfoRow icon="🔧" lbl="بداية التتش أب"       val={fmt(sug.pe)} c={C.warn}/>
            <InfoRow icon="🏁" lbl="تاريخ التسليم النهائي" val={fmt(sug.te)} c={C.ok}/>

            {f.totalValue&&(
              <div style={{marginTop:10,padding:"10px 12px",borderRadius:8,background:`${C.gold}15`,border:`1px solid ${C.gold}30`}}>
                <div style={{fontSize:12,color:C.sub,marginBottom:6}}>توزيع الدفعات (25% لكل دفعة)</div>
                <div style={{fontSize:13,color:C.gold,fontWeight:700}}>{Math.round(Number(f.totalValue)*.25).toLocaleString()} ر.ع × 4 دفعات</div>
              </div>
            )}
          </div>
        </div>

        <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:22,paddingTop:18,borderTop:`1px solid ${C.brd}`}}>
          <Btn v="ghost" onClick={onClose}>إلغاء</Btn>
          <Btn onClick={save}>💾 حفظ المشروع</Btn>
        </div>
      </div>
    </div>
  );
}

/* ── PROJECTS TAB ── */
function ProjectsTab({projects,setProjects,teams}){
  const [showAdd,setShowAdd]=useState(false);
  const [filter,setFilter]=useState("all");

  const list=filter==="all"?projects:projects.filter(p=>p.status===filter);

  const del=(id)=>{if(window.confirm("هل تريد حذف هذا المشروع؟"))setProjects(ps=>ps.filter(p=>p.id!==id));};
  const save=(proj)=>{setProjects(ps=>[...ps,proj]);setShowAdd(false);};

  return(
    <div>
      <SH title="🗂️ جدولة المشاريع" action={<Btn onClick={()=>setShowAdd(true)}>➕ مشروع جديد</Btn>}/>

      <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
        {[["all","الكل"],...Object.entries(ST).map(([k,v])=>[k,v.label])].map(([k,lbl])=>(
          <button key={k} onClick={()=>setFilter(k)} style={{padding:"6px 14px",borderRadius:20,border:"none",
            background:filter===k?C.gold:C.brd,color:filter===k?"#080C18":C.txt,
            cursor:"pointer",fontSize:13,fontWeight:700,fontFamily:"Tajawal,sans-serif"}}>
            {lbl}
          </button>
        ))}
      </div>

      <Card style={{padding:0,overflow:"hidden"}}>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",minWidth:900}}>
            <TH cols={["رقم المشروع","العميل","الموقع","توقيع العقد","بداية المشروع","الانتهاء المتوقع","جبس","صبغ","تتش أب","إنجاز الجبس","إنجاز الصبغ","الحالة","إجراء"]}/>
            <tbody>
              {list.map(p=>(
                <tr key={p.id} onMouseOver={e=>e.currentTarget.style.background="#ffffff06"} onMouseOut={e=>e.currentTarget.style.background="transparent"}>
                  <TD><span style={{color:C.gold,fontWeight:800}}>{p.number}</span></TD>
                  <TD style={{fontWeight:600}}>{p.client}</TD>
                  <TD style={{color:C.sub,fontSize:13}}>{p.location}</TD>
                  <TD style={{fontSize:12}}>{fmt(p.contractDate)}</TD>
                  <TD style={{fontSize:12}}>{fmt(p.startDate)}</TD>
                  <TD style={{fontSize:12,color:projOverdue(p)?C.err:C.txt}}>{projOverdue(p)?"⚠ ":""}{fmt(p.endDate)}</TD>
                  <TD style={{fontSize:13}}>{p.gypsumDays}ي</TD>
                  <TD style={{fontSize:13}}>{p.paintDays}ي</TD>
                  <TD style={{fontSize:13}}>{p.touchupDays}ي</TD>
                  <TD style={{minWidth:100}}><div style={{fontSize:11,color:C.blue,marginBottom:3}}>{p.gp}%</div><Bar v={p.gp} c={C.blue}/></TD>
                  <TD style={{minWidth:100}}><div style={{fontSize:11,color:C.pur,marginBottom:3}}>{p.pp}%</div><Bar v={p.pp} c={C.pur}/></TD>
                  <TD><SBadge s={p.status}/></TD>
                  <TD><Btn v="danger" sm onClick={()=>del(p.id)}>حذف</Btn></TD>
                </tr>
              ))}
              {list.length===0&&<tr><td colSpan={13} style={{textAlign:"center",padding:30,color:C.sub}}>لا توجد مشاريع</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
      {showAdd&&<AddModal projects={projects} onSave={save} onClose={()=>setShowAdd(false)}/>}
    </div>
  );
}

/* ── TEAMS TAB ── */
function TeamsTab({teams,setTeams,projects}){
  const [addTo,setAddTo]=useState(null);
  const [wName,setWName]=useState("");

  const nextAvail=(type)=>{
    const active=projects.filter(p=>p.status!=="done");
    if(!active.length)return td();
    const lat=active.reduce((mx,p)=>{const e=p.endDate||addD(p.startDate,(p.gypsumDays||0)+(p.paintDays||0)+(p.touchupDays||0));return(e&&e>mx)?e:mx;},td());
    return lat>=td()?lat:td();
  };

  const addW=(type)=>{
    if(!wName.trim())return;
    setTeams(t=>({...t,[type]:{...t[type],workers:[...t[type].workers,{id:uid(),name:wName.trim()}]}}));
    setWName("");setAddTo(null);
  };
  const delW=(type,id)=>setTeams(t=>({...t,[type]:{...t[type],workers:t[type].workers.filter(w=>w.id!==id)}}));
  const setCap=(type,v)=>setTeams(t=>({...t,[type]:{...t[type],cap:Number(v)}}));

  const gypsumAvail=nextAvail("gypsum");
  const paintAvail=nextAvail("paint");

  return(
    <div>
      <SH title="👥 إدارة الفرق والتوفر"/>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18,marginBottom:20}}>
        {[{type:"gypsum",label:"🏗️ فريق الجبس",avail:gypsumAvail,c:C.blue},{type:"paint",label:"🎨 فريق الصبغ",avail:paintAvail,c:C.pur}].map(({type,label,avail,c})=>{
          const team=teams[type];
          const busy=avail>td();
          return(
            <Card key={type}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
                <div style={{fontSize:17,fontWeight:800,color:c}}>{label}</div>
                <Chip label={busy?"🟡 مشغول":"🟢 متاح"} c={busy?C.warn:C.ok} bg={busy?`${C.warn}20`:`${C.ok}20`}/>
              </div>

              <div style={{padding:"10px 14px",borderRadius:9,background:`${c}12`,border:`1px solid ${c}25`,marginBottom:14}}>
                <div style={{fontSize:12,color:C.sub,marginBottom:3}}>أقرب موعد متاح للفريق</div>
                <div style={{fontSize:18,fontWeight:800,color:c}}>{busy?fmt(avail):"متاح الآن"}</div>
              </div>

              <div style={{marginBottom:14}}>
                <label style={{fontSize:12,color:C.sub,display:"block",marginBottom:5}}>القدرة الإنتاجية اليومية (م²)</label>
                <Inp type="number" value={team.cap} onChange={e=>setCap(type,e.target.value)} style={{width:130}}/>
              </div>

              <div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:9}}>
                  <span style={{fontSize:14,fontWeight:700}}>العمال ({team.workers.length})</span>
                  <Btn sm onClick={()=>setAddTo(type)}>+ إضافة عامل</Btn>
                </div>
                {addTo===type&&(
                  <div style={{display:"flex",gap:8,marginBottom:9}}>
                    <Inp placeholder="اسم العامل" value={wName} onChange={e=>setWName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addW(type)}/>
                    <Btn sm onClick={()=>addW(type)}>حفظ</Btn>
                    <Btn sm v="ghost" onClick={()=>setAddTo(null)}>✕</Btn>
                  </div>
                )}
                <div style={{display:"flex",flexDirection:"column",gap:6,maxHeight:220,overflowY:"auto"}}>
                  {team.workers.map(w=>(
                    <div key={w.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 12px",borderRadius:8,background:"#ffffff07"}}>
                      <span style={{fontSize:14}}>👤 {w.name}</span>
                      <button onClick={()=>delW(type,w.id)} style={{background:"none",border:"none",color:C.err,cursor:"pointer",fontSize:16}}>×</button>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Card style={{padding:0,overflow:"hidden"}}>
        <div style={{padding:"14px 18px",borderBottom:`1px solid ${C.brd}`,fontWeight:700,fontSize:15}}>📅 جدول مشاريع الفرق</div>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <TH cols={["المشروع","العميل","بداية الجبس","نهاية الجبس","بداية الصبغ","نهاية الصبغ","التسليم","الحالة"]}/>
            <tbody>
              {projects.filter(p=>p.status!=="done").map(p=>{
                const ge=addD(p.startDate,p.gypsumDays);
                const ps=addD(ge,1);
                const pe=addD(ps,p.paintDays);
                const te=addD(pe,p.touchupDays);
                return(
                  <tr key={p.id} onMouseOver={e=>e.currentTarget.style.background="#ffffff06"} onMouseOut={e=>e.currentTarget.style.background="transparent"}>
                    <TD><span style={{color:C.gold,fontWeight:800}}>{p.number}</span></TD>
                    <TD style={{fontWeight:600}}>{p.client}</TD>
                    <TD style={{fontSize:13}}>{fmt(p.startDate)}</TD>
                    <TD style={{fontSize:13}}>{fmt(ge)}</TD>
                    <TD style={{fontSize:13}}>{fmt(ps)}</TD>
                    <TD style={{fontSize:13}}>{fmt(pe)}</TD>
                    <TD style={{fontSize:13}}>{fmt(te)}</TD>
                    <TD><SBadge s={p.status}/></TD>
                  </tr>
                );
              })}
              {projects.filter(p=>p.status!=="done").length===0&&<tr><td colSpan={8} style={{textAlign:"center",padding:24,color:C.sub}}>لا توجد مشاريع نشطة</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

/* ── PAYMENTS TAB ── */
function PaymentsTab({projects,setProjects}){
  const updPay=(pid,payId,st)=>{
    setProjects(ps=>ps.map(p=>p.id!==pid?p:{...p,payments:p.payments.map(pay=>pay.id!==payId?pay:{...pay,status:st})}));
  };

  const allPays=projects.flatMap(p=>p.payments.map(pay=>({...pay,pid:p.id,client:p.client,pno:p.number,pst:p.status})));
  const paid=allPays.filter(x=>x.status==="paid").reduce((a,b)=>a+b.amount,0);
  const pending=allPays.filter(x=>x.status!=="paid").reduce((a,b)=>a+b.amount,0);
  const overdueList=allPays.filter(x=>x.status!=="paid"&&x.dueDate&&new Date(x.dueDate)<new Date());

  return(
    <div>
      <SH title="💰 إدارة الدفعات"/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,marginBottom:20}}>
        <StatCard icon="✅" title="إجمالي المحصل"   val={`${paid.toLocaleString()} ر.ع`}    c={C.ok}/>
        <StatCard icon="⏳" title="إجمالي المعلق"   val={`${pending.toLocaleString()} ر.ع`}  c={C.warn}/>
        <StatCard icon="🔴" title="دفعات متأخرة"    val={overdueList.length}                c={C.err}/>
      </div>

      {overdueList.length>0&&(
        <div style={{background:`${C.err}12`,border:`1px solid ${C.err}35`,borderRadius:10,padding:"12px 16px",marginBottom:18}}>
          <div style={{color:C.err,fontWeight:800,marginBottom:8}}>⚠️ تنبيه: {overdueList.length} دفعة متأخرة عن موعد الاستحقاق</div>
          {overdueList.map((p,i)=>(
            <div key={i} style={{fontSize:13,color:C.txt,marginTop:4}}>• {p.client} – {p.label}: {p.amount.toLocaleString()} ر.ع (استحقت {fmt(p.dueDate)})</div>
          ))}
        </div>
      )}

      {projects.map(proj=>(
        <Card key={proj.id} style={{marginBottom:16}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <span style={{color:C.gold,fontWeight:800,fontSize:15}}>{proj.number}</span>
              <span style={{fontWeight:700,fontSize:16}}>{proj.client}</span>
              <span style={{color:C.sub,fontSize:13}}>{proj.location}</span>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <span style={{fontSize:13,color:C.sub}}>القيمة: <strong style={{color:C.gold}}>{proj.totalValue.toLocaleString()} ر.ع</strong></span>
              <SBadge s={proj.status}/>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(210px,1fr))",gap:12}}>
            {proj.payments.map(pay=>{
              const late=isLate(pay.dueDate,pay.status);
              const effSt=late?"late":pay.status;
              return(
                <div key={pay.id} style={{padding:"13px 15px",borderRadius:10,
                  background:effSt==="paid"?`${C.ok}10`:effSt==="late"?`${C.err}10`:`${C.brd}70`,
                  border:`1px solid ${effSt==="paid"?C.ok:effSt==="late"?C.err:C.brd}40`}}>
                  <div style={{fontSize:12,color:C.sub,marginBottom:6}}>{pay.label}</div>
                  <div style={{fontSize:22,fontWeight:800,color:C.gold}}>{pay.amount.toLocaleString()} <span style={{fontSize:13,fontWeight:400}}>ر.ع</span></div>
                  <div style={{fontSize:12,color:C.sub,margin:"5px 0"}}>الاستحقاق: {fmt(pay.dueDate)}</div>
                  <div style={{display:"flex",gap:8,alignItems:"center",marginTop:10,flexWrap:"wrap"}}>
                    <PBadge s={effSt}/>
                    {pay.status!=="paid"&&(
                      <Btn v="ok" sm onClick={()=>updPay(proj.id,pay.id,"paid")}>✓ تحصيل</Btn>
                    )}
                    {pay.status==="paid"&&(
                      <Btn v="ghost" sm onClick={()=>updPay(proj.id,pay.id,"unpaid")}>↩ إلغاء</Btn>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      ))}
    </div>
  );
}

/* ── PROGRESS TAB ── */
function ProgressTab({projects,setProjects}){
  const [sel,setSel]=useState(projects[0]?.id||null);
  const [note,setNote]=useState("");
  const [issue,setIssue]=useState("");

  const proj=projects.find(p=>p.id===sel);

  const upd=(k,v)=>setProjects(ps=>ps.map(p=>p.id===sel?{...p,[k]:v}:p));

  const addNote=()=>{
    if(!note.trim())return;
    const ts=new Date().toLocaleDateString("ar-EG")+": ";
    upd("notes",(proj.notes?proj.notes+"\n":"")+ts+note);
    setNote("");
  };

  const addIssue=()=>{
    if(!issue.trim())return;
    const ts=new Date().toLocaleDateString("ar-EG")+": ";
    upd("issues",(proj.issues?proj.issues+"\n":"")+ts+issue);
    setIssue("");
  };

  return(
    <div>
      <SH title="📊 متابعة الإنجاز اليومي"/>

      <div style={{display:"flex",gap:8,marginBottom:20,flexWrap:"wrap"}}>
        {projects.map(p=>(
          <button key={p.id} onClick={()=>setSel(p.id)} style={{padding:"8px 16px",borderRadius:8,border:"none",
            background:sel===p.id?C.gold:C.brd,color:sel===p.id?"#080C18":C.txt,
            cursor:"pointer",fontFamily:"Tajawal,sans-serif",fontWeight:700,fontSize:13}}>
            {p.number} – {p.client}
          </button>
        ))}
      </div>

      {proj&&(
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18}}>
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            <Card>
              <div style={{fontWeight:700,fontSize:15,marginBottom:14}}>🏗️ إنجاز أعمال الجبس</div>
              <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:12}}>
                <input type="range" min="0" max="100" value={proj.gp} onChange={e=>upd("gp",Number(e.target.value))} style={{flex:1}}/>
                <span style={{fontSize:26,fontWeight:800,color:C.blue,minWidth:55}}>{proj.gp}%</span>
              </div>
              <Bar v={proj.gp} c={C.blue}/>
            </Card>

            <Card>
              <div style={{fontWeight:700,fontSize:15,marginBottom:14}}>🎨 إنجاز أعمال الصبغ</div>
              <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:12}}>
                <input type="range" min="0" max="100" value={proj.pp} onChange={e=>upd("pp",Number(e.target.value))} style={{flex:1}}/>
                <span style={{fontSize:26,fontWeight:800,color:C.pur,minWidth:55}}>{proj.pp}%</span>
              </div>
              <Bar v={proj.pp} c={C.pur}/>
            </Card>

            <Card>
              <div style={{fontWeight:700,fontSize:15,marginBottom:12}}>🔄 تحديث حالة المشروع</div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {Object.entries(ST).map(([k,v])=>(
                  <button key={k} onClick={()=>upd("status",k)} style={{padding:"7px 13px",borderRadius:8,
                    background:proj.status===k?v.bg:"transparent",border:`1px solid ${v.c}`,
                    color:v.c,cursor:"pointer",fontSize:13,fontWeight:700,fontFamily:"Tajawal,sans-serif"}}>
                    {v.label}
                  </button>
                ))}
              </div>
            </Card>

            <Card>
              <div style={{fontWeight:700,fontSize:15,marginBottom:12}}>👤 المسؤول</div>
              <Inp value={proj.responsible} onChange={e=>upd("responsible",e.target.value)} placeholder="اسم المسؤول"/>
            </Card>
          </div>

          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            <Card>
              <div style={{fontWeight:700,fontSize:15,marginBottom:12}}>📝 إضافة ملاحظة يومية</div>
              <Txta value={note} onChange={e=>setNote(e.target.value)} placeholder="اكتب تقرير اليوم..." rows={3} style={{marginBottom:10}}/>
              <Btn onClick={addNote}>إضافة الملاحظة</Btn>
            </Card>

            {proj.notes&&(
              <Card style={{flex:1}}>
                <div style={{fontWeight:700,fontSize:15,marginBottom:10}}>📋 سجل الملاحظات</div>
                <div style={{whiteSpace:"pre-wrap",fontSize:13,color:C.txt,lineHeight:1.9,maxHeight:200,overflowY:"auto"}}>{proj.notes}</div>
              </Card>
            )}

            <Card>
              <div style={{fontWeight:700,fontSize:15,marginBottom:12}}>⚠️ تسجيل مشكلة أو تأخير</div>
              <Txta value={issue} onChange={e=>setIssue(e.target.value)} placeholder="وصف المشكلة أو سبب التأخير..." rows={2} style={{marginBottom:10}}/>
              <Btn v="danger" onClick={addIssue}>تسجيل المشكلة</Btn>
            </Card>

            {proj.issues&&(
              <Card style={{background:`${C.err}0A`,border:`1px solid ${C.err}25`}}>
                <div style={{fontWeight:700,fontSize:15,marginBottom:10,color:C.err}}>⚠️ المشاكل المسجلة</div>
                <div style={{whiteSpace:"pre-wrap",fontSize:13,lineHeight:1.9,maxHeight:160,overflowY:"auto"}}>{proj.issues}</div>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── TOUCHUP TAB ── */
function TouchUpTab({projects,setProjects}){
  const [sel,setSel]=useState(null);
  const [showForm,setShowForm]=useState(false);
  const [nItem,setNItem]=useState({desc:"",resp:"",due:addD(td(),2)});

  const proj=projects.find(p=>p.id===sel);
  const openItems=proj?.punchList.filter(i=>!i.closed)||[];
  const closedItems=proj?.punchList.filter(i=>i.closed)||[];
  const overdueItems=openItems.filter(i=>i.due&&new Date(i.due)<new Date());
  const canClose=proj&&proj.punchList.length>0&&openItems.length===0;

  const updProj=(fn)=>setProjects(ps=>ps.map(p=>p.id!==sel?p:fn(p)));

  const addItem=()=>{
    if(!nItem.desc.trim())return;
    updProj(p=>({...p,punchList:[...p.punchList,{id:uid(),...nItem,closed:false}]}));
    setNItem({desc:"",resp:"",due:addD(td(),2)});setShowForm(false);
  };

  const toggleItem=(iid)=>updProj(p=>({...p,punchList:p.punchList.map(i=>i.id!==iid?i:{...i,closed:!i.closed})}));
  const delItem=(iid)=>updProj(p=>({...p,punchList:p.punchList.filter(i=>i.id!==iid)}));
  const closeProject=()=>updProj(p=>({...p,status:"done"}));

  return(
    <div>
      <SH title="🔧 إدارة Touch-up — Punch List"/>

      <div style={{display:"flex",gap:8,marginBottom:20,flexWrap:"wrap"}}>
        {projects.map(p=>{
          const open=p.punchList.filter(i=>!i.closed).length;
          return(
            <button key={p.id} onClick={()=>setSel(p.id)} style={{padding:"8px 16px",borderRadius:8,border:"none",
              background:sel===p.id?C.gold:C.brd,color:sel===p.id?"#080C18":C.txt,
              cursor:"pointer",fontFamily:"Tajawal,sans-serif",fontWeight:700,fontSize:13,position:"relative"}}>
              {p.number} – {p.client}
              {open>0&&<span style={{position:"absolute",top:-6,left:-6,background:C.err,color:"#fff",borderRadius:"50%",width:20,height:20,fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center"}}>{open}</span>}
            </button>
          );
        })}
      </div>

      {!proj?(
        <Card><div style={{textAlign:"center",color:C.sub,padding:40}}>اختر مشروعاً من الأعلى</div></Card>
      ):(
        <>
          {overdueItems.length>0&&(
            <div style={{background:`${C.err}12`,border:`1px solid ${C.err}35`,borderRadius:10,padding:"12px 16px",marginBottom:16}}>
              <div style={{fontWeight:800,color:C.err,marginBottom:8}}>⏰ تنبيه: {overdueItems.length} ملاحظة تأخرت عن موعد الإنهاء!</div>
              {overdueItems.map(i=>(
                <div key={i.id} style={{fontSize:13,marginTop:4}}>• {i.desc} — {i.resp||"غير محدد"} — كان يجب إنهاؤها: {fmt(i.due)}</div>
              ))}
            </div>
          )}

          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <div style={{display:"flex",gap:18}}>
              <span style={{fontSize:14,color:C.sub}}>الإجمالي: <strong style={{color:C.txt}}>{proj.punchList.length}</strong></span>
              <span style={{fontSize:14,color:C.sub}}>مفتوح: <strong style={{color:C.warn}}>{openItems.length}</strong></span>
              <span style={{fontSize:14,color:C.sub}}>مغلق: <strong style={{color:C.ok}}>{closedItems.length}</strong></span>
            </div>
            <div style={{display:"flex",gap:10}}>
              {canClose&&proj.status!=="done"&&(
                <Btn v="ok" onClick={closeProject}>✅ إغلاق المشروع نهائياً</Btn>
              )}
              <Btn onClick={()=>setShowForm(true)}>+ إضافة ملاحظة</Btn>
            </div>
          </div>

          {showForm&&(
            <Card style={{marginBottom:14,border:`1px solid ${C.gold}35`}}>
              <div style={{fontWeight:700,color:C.gold,marginBottom:12}}>ملاحظة جديدة</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:12}}>
                <div><label style={{fontSize:12,color:C.sub,display:"block",marginBottom:4}}>وصف الملاحظة *</label><Inp value={nItem.desc} onChange={e=>setNItem(n=>({...n,desc:e.target.value}))} placeholder="وصف المشكلة..."/></div>
                <div><label style={{fontSize:12,color:C.sub,display:"block",marginBottom:4}}>المسؤول</label><Inp value={nItem.resp} onChange={e=>setNItem(n=>({...n,resp:e.target.value}))} placeholder="اسم المسؤول"/></div>
                <div><label style={{fontSize:12,color:C.sub,display:"block",marginBottom:4}}>موعد الإنهاء</label><Inp type="date" value={nItem.due} onChange={e=>setNItem(n=>({...n,due:e.target.value}))}/></div>
              </div>
              <div style={{display:"flex",gap:8}}><Btn onClick={addItem}>حفظ</Btn><Btn v="ghost" onClick={()=>setShowForm(false)}>إلغاء</Btn></div>
            </Card>
          )}

          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {proj.punchList.length===0?(
              <Card><div style={{textAlign:"center",color:C.ok,padding:30,fontSize:15}}>🎉 لا توجد ملاحظات — المشروع جاهز للتسليم!</div></Card>
            ):proj.punchList.map(item=>{
              const late=!item.closed&&item.due&&new Date(item.due)<new Date();
              return(
                <div key={item.id} style={{display:"flex",alignItems:"flex-start",gap:14,padding:"14px 18px",borderRadius:10,
                  background:item.closed?`${C.ok}08`:late?`${C.err}0C`:C.surf,
                  border:`1px solid ${item.closed?C.ok:late?C.err:C.brd}45`}}>
                  <button onClick={()=>toggleItem(item.id)} style={{width:26,height:26,borderRadius:"50%",flexShrink:0,
                    border:`2px solid ${item.closed?C.ok:C.sub}`,background:item.closed?C.ok:"transparent",
                    cursor:"pointer",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,marginTop:1}}>
                    {item.closed?"✓":""}
                  </button>
                  <div style={{flex:1}}>
                    <div style={{fontSize:15,fontWeight:600,textDecoration:item.closed?"line-through":"none",color:item.closed?C.sub:C.txt}}>{item.desc}</div>
                    <div style={{fontSize:12,color:C.sub,marginTop:5,display:"flex",gap:16,flexWrap:"wrap"}}>
                      <span>👤 {item.resp||"—"}</span>
                      <span style={{color:late?C.err:C.sub}}>📅 {fmt(item.due)} {late?"— متأخر!":""}</span>
                      {item.closed&&<span style={{color:C.ok}}>✅ مكتمل</span>}
                    </div>
                  </div>
                  <button onClick={()=>delItem(item.id)} style={{background:"none",border:"none",color:C.err,cursor:"pointer",fontSize:20,lineHeight:1,padding:"0 4px"}}>×</button>
                </div>
              );
            })}
          </div>

          {!canClose&&proj.punchList.length>0&&openItems.length>0&&(
            <div style={{marginTop:14,padding:"11px 15px",borderRadius:8,background:`${C.warn}12`,border:`1px solid ${C.warn}35`,fontSize:14,color:C.warn}}>
              🔒 لا يمكن إغلاق المشروع — يوجد {openItems.length} ملاحظة لم تُغلق بعد
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ── MAIN APP ── */
const TABS=[
  {id:"dashboard",label:"لوحة التحكم",icon:"📊"},
  {id:"projects", label:"المشاريع",   icon:"🗂️"},
  {id:"teams",    label:"الفرق",      icon:"👥"},
  {id:"payments", label:"الدفعات",   icon:"💰"},
  {id:"progress", label:"الإنجاز",   icon:"📈"},
  {id:"touchup",  label:"Touch-up",  icon:"🔧"},
];

export default function App(){
  const [tab,setTab]=useState("dashboard");
  const [projects,setProjects]=useState(INIT_PROJECTS);
  const [teams,setTeams]=useState(INIT_TEAMS);

  useEffect(()=>{
    const s=document.createElement("style");s.textContent=G_CSS;document.head.appendChild(s);
    return()=>document.head.removeChild(s);
  },[]);

  const alerts=useMemo(()=>{
    const latePays=projects.flatMap(p=>p.payments.filter(x=>x.status!=="paid"&&x.dueDate&&new Date(x.dueDate)<new Date())).length;
    const latePunch=projects.flatMap(p=>p.punchList.filter(i=>!i.closed&&i.due&&new Date(i.due)<new Date())).length;
    return latePays+latePunch;
  },[projects]);

  return(
    <div style={{minHeight:"100vh",background:C.bg,color:C.txt,fontFamily:"Tajawal,sans-serif",direction:"rtl"}}>
      {/* Header */}
      <header style={{background:C.surf,borderBottom:`1px solid ${C.brd}`,padding:"0 24px",display:"flex",alignItems:"center",justifyContent:"space-between",height:62,position:"sticky",top:0,zIndex:100}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:40,height:40,background:C.gold,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>🏛️</div>
          <div>
            <div style={{fontWeight:800,fontSize:15,color:C.txt,lineHeight:1.2}}>نظام إدارة المشاريع</div>
            <div style={{fontSize:11,color:C.sub}}>ديكور الأسقف الجبسية والأصباغ</div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          {alerts>0&&(
            <div style={{display:"flex",alignItems:"center",gap:7,background:`${C.err}18`,border:`1px solid ${C.err}35`,borderRadius:20,padding:"5px 13px"}}>
              <span style={{fontSize:12,color:C.err,fontWeight:700}}>🔔 {alerts} تنبيه مستحق</span>
            </div>
          )}
          <div style={{fontSize:13,color:C.sub}}>{new Date().toLocaleDateString("ar-EG",{day:"numeric",month:"long",year:"numeric"})}</div>
        </div>
      </header>

      {/* Nav */}
      <nav style={{background:C.surf,borderBottom:`1px solid ${C.brd}`,display:"flex",padding:"0 24px",overflowX:"auto"}}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{padding:"14px 18px",border:"none",cursor:"pointer",background:"transparent",
            color:tab===t.id?C.gold:C.sub,fontFamily:"Tajawal,sans-serif",fontSize:14,fontWeight:700,
            borderBottom:tab===t.id?`2px solid ${C.gold}`:"2px solid transparent",whiteSpace:"nowrap",transition:"color .2s"}}>
            {t.icon} {t.label}
          </button>
        ))}
      </nav>

      {/* Content */}
      <main style={{maxWidth:1400,margin:"0 auto",padding:"24px 24px 50px"}}>
        {tab==="dashboard"&&<Dashboard projects={projects} teams={teams}/>}
        {tab==="projects" &&<ProjectsTab projects={projects} setProjects={setProjects} teams={teams}/>}
        {tab==="teams"    &&<TeamsTab teams={teams} setTeams={setTeams} projects={projects}/>}
        {tab==="payments" &&<PaymentsTab projects={projects} setProjects={setProjects}/>}
        {tab==="progress" &&<ProgressTab projects={projects} setProjects={setProjects}/>}
        {tab==="touchup"  &&<TouchUpTab projects={projects} setProjects={setProjects}/>}
      </main>
    </div>
  );
}
