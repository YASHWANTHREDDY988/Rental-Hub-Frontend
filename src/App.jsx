import {useEffect,useMemo,useState} from 'react'
import * as api from './api'

const empty={title:'',location:'',price:'',description:'',ownerName:'',ownerEmail:'',ownerPhone:''}

function Nav({user,onLogout}){
  const dash=user.role==='ADMIN'?'/admin/dashboard':'/user/dashboard'
  return <nav>
    <div className="brand"><div className="brand-icon">R</div><div><strong>Rental Hub</strong><span>Rental Management</span></div></div>
    <div className="nav-right">
      <a href="/properties">Properties</a>
      <a href={dash}>Dashboard</a>
      <button onClick={onLogout}>Logout</button>
    </div>
  </nav>
}

function Auth({mode,setMode,msg,setMsg}){
  const [f,setF]=useState({name:'',email:'',password:''}); const [err,setErr]=useState('')
  async function submit(e){e.preventDefault();setErr('');try{
    if(mode==='register'){await api.register(f.name,f.email,f.password);setMsg('Registration successful. Please login.');setMode('login')}
    else {const u=await api.login(f.email,f.password);location.href='/dashboard'}
  }catch(x){setErr(x.message)}}
  return <div className="auth"><div className="auth-card">
    <div className="brand"><div className="brand-icon">R</div><div><strong>Rental Hub</strong><span>Rental Management System</span></div></div>
    <h1>{mode==='login'?'Login':'Register'}</h1>{msg&&<div className="success">{msg}</div>}{err&&<div className="error">{err}</div>}
    <form onSubmit={submit}>{mode==='register'&&<input placeholder="Full name" required value={f.name} onChange={e=>setF({...f,name:e.target.value})}/>}<input type="email" placeholder="Email" required value={f.email} onChange={e=>setF({...f,email:e.target.value})}/><input type="password" placeholder="Password" required value={f.password} onChange={e=>setF({...f,password:e.target.value})}/><button>{mode==='login'?'Login':'Register'}</button></form>
    <button className="link" onClick={()=>{setMode(mode==='login'?'register':'login');setMsg('')}}>{mode==='login'?'Create a user account':'Already have an account? Login'}</button>
  </div></div>
}

function Dashboard({user}){
  const admin=user.role==='ADMIN'; const [apps,setApps]=useState([]),[users,setUsers]=useState([]),[props,setProps]=useState([]),[form,setForm]=useState(empty),[editing,setEditing]=useState(null),[msg,setMsg]=useState(''),[err,setErr]=useState('')
  async function load(){try{if(admin){setApps(await api.getAllApplications());setUsers(await api.getUsers());setProps(await api.getProperties())}else setApps(await api.getUserApplications(user.id))}catch(e){setErr(e.message)}}
  useEffect(()=>{load()},[])
  async function save(e){e.preventDefault();try{const p={...form,price:Number(form.price)};editing?await api.updateProperty(editing,p):await api.createProperty(p);setForm(empty);setEditing(null);setMsg('Property saved');load()}catch(e){setErr(e.message)}}
  async function removeUser(id){if(confirm('Delete this user?')){try{await api.deleteUser(id);setMsg('User deleted');load()}catch(e){setErr(e.message)}}}
  async function removeProp(id){if(confirm('Delete property?')){try{await api.deleteProperty(id);setMsg('Property deleted');load()}catch(e){setErr(e.message)}}}
  async function act(fn,id){try{await fn(id);setMsg('Updated successfully');load()}catch(e){setErr(e.message)}}
  async function deleteMe(){if(confirm('Delete your account?')){try{await api.deleteMyAccount(user.id);api.logout();location.href='/login'}catch(e){setErr(e.message)}}}
  const counts=useMemo(()=>({pending:apps.filter(a=>a.status==='PENDING').length,approved:apps.filter(a=>a.status==='APPROVED').length,rejected:apps.filter(a=>a.status==='REJECTED').length}),[apps])
  return <div className="app"><header><Nav user={user} onLogout={()=>{api.logout();location.href='/login'}}/><div className="hero"><p>{admin?'ADMIN DASHBOARD':'USER DASHBOARD'}</p><h1>{admin?'Admin Dashboard':'User Dashboard'}</h1><span>{admin?'Manage users, properties and every rental application.':'View your account and rental application details.'}</span></div></header>
  <main><div className="notice">{msg&&<span className="success">{msg}</span>}{err&&<span className="error">{err}</span>}</div>
    <section className="stats"><div className="panel"><h3>{admin?'Total Users':'My Applications'}</h3><strong>{admin?users.filter(u=>u.role!=='ADMIN').length:apps.length}</strong></div><div className="panel"><h3>{admin?'Total Properties':'Approved'}</h3><strong>{admin?props.length:counts.approved}</strong></div><div className="panel"><h3>{admin?'Applications':'Pending'}</h3><strong>{admin?apps.length:counts.pending}</strong></div></section>
    {!admin&&<section className="panel"><h2>My Applications</h2>{apps.length===0?<p>No applications yet. <a href="/properties">Browse properties</a>.</p>:apps.map(a=><div className="application" key={a.id}><div><b>{a.property?.title}</b><span>{a.property?.location}</span></div><strong className={a.status.toLowerCase()}>{a.status}</strong>{(a.status==='PENDING'||a.status==='APPROVED')&&<button className="danger" onClick={()=>act(api.cancelApplication,a.id)}>Cancel Application</button>}{a.status==='APPROVED'&&<div className="owner-details"><b>Property Owner Details</b><span>Owner: {a.property?.ownerName}</span><span>Phone: {a.property?.ownerPhone}</span><span>Email: {a.property?.ownerEmail}</span></div>}</div>)}</section>}
    {admin&&<>
      <section className="panel"><div className="section-head"><h2>Rental Applications</h2><button onClick={load}>Refresh</button></div>{apps.length===0?<p>No applications.</p>:apps.map(a=><div className="application" key={a.id}><div><b>{a.property?.title}</b><span>{a.property?.location}</span><span>Applicant: {a.user?.name} ({a.user?.email})</span></div><strong className={a.status.toLowerCase()}>{a.status}</strong><div>{a.status==='PENDING'&&<><button onClick={()=>act(api.approveApplication,a.id)}>Approve</button><button className="danger" onClick={()=>act(api.rejectApplication,a.id)}>Reject</button></>}{a.status==='APPROVED'&&<button className="danger" onClick={()=>act(api.cancelApproval,a.id)}>Cancel Approval</button>}</div></div>)}</section>
      <section className="panel"><h2>All Users</h2>{users.filter(u=>u.role!=='ADMIN').map(u=><div className="user-row" key={u.id}><span><b>{u.name}</b> · {u.email}</span><button className="danger" onClick={()=>removeUser(u.id)}>Delete User</button></div>)}</section>
      <section className="panel"><h2>{editing?'Update Property':'Add Property'}</h2><form className="grid" onSubmit={save}><input placeholder="Title" required value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/><input placeholder="Location" required value={form.location} onChange={e=>setForm({...form,location:e.target.value})}/><input type="number" placeholder="Monthly rent" required value={form.price} onChange={e=>setForm({...form,price:e.target.value})}/><input placeholder="Description" required value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/><input placeholder="Owner name" required value={form.ownerName} onChange={e=>setForm({...form,ownerName:e.target.value})}/><input type="email" placeholder="Owner email" required value={form.ownerEmail} onChange={e=>setForm({...form,ownerEmail:e.target.value})}/><input placeholder="Owner phone" required value={form.ownerPhone} onChange={e=>setForm({...form,ownerPhone:e.target.value})}/><button>{editing?'Update':'Add Property'}</button>{editing&&<button type="button" className="secondary" onClick={()=>{setEditing(null);setForm(empty)}}>Cancel</button>}</form></section>
      <section className="panel"><h2>Property Management</h2>{props.map(p=><div className="user-row" key={p.id}><span><b>{p.title}</b> · {p.location} · ₹{Number(p.price).toLocaleString('en-IN')}</span><div><button onClick={()=>{setEditing(p.id);setForm(p)}}>Edit</button> <button className="danger" onClick={()=>removeProp(p.id)}>Delete</button></div></div>)}</section>
    </>}
    {!admin&&<section className="panel account"><h2>My Account</h2><p><b>{user.name}</b> · {user.email}</p><button className="danger" onClick={deleteMe}>Delete My Account</button></section>}
  </main></div>
}

function Properties({user}){
 const admin=user.role==='ADMIN'; const [props,setProps]=useState([]),[search,setSearch]=useState(''),[apps,setApps]=useState([]),[msg,setMsg]=useState(''),[err,setErr]=useState('')
 async function load(){try{setProps(await api.getProperties(search));if(!admin)setApps(await api.getUserApplications(user.id))}catch(e){setErr(e.message)}}
 useEffect(()=>{load()},[])
 async function apply(id){try{await api.applyForProperty(id);setMsg('Application submitted successfully');load()}catch(e){setErr(e.message)}}
 return <div className="app"><header><Nav user={user} onLogout={()=>{api.logout();location.href='/login'}}/><div className="hero"><p>RENTAL PROPERTIES</p><h1>Find a place you'll love.</h1><span>Browse available rental properties and apply.</span></div></header><main>
   {msg&&<div className="success">{msg}</div>}{err&&<div className="error">{err}</div>}
   <section className="toolbar"><h2>Available Properties</h2><form onSubmit={e=>{e.preventDefault();load()}}><input placeholder="Search location or title" value={search} onChange={e=>setSearch(e.target.value)}/><button>Search</button></form></section>
   <section className="cards">{props.map(p=><article className="card" key={p.id}><div className="house">🏠</div><h3>{p.title}</h3><p>📍 {p.location}</p><strong>₹{Number(p.price).toLocaleString('en-IN')} / month</strong><p>{p.description}</p>{!admin&&<div className="actions"><button onClick={()=>apply(p.id)}>Apply for House</button></div>}</article>)}</section>
   {!admin&&<section className="panel"><h2>My Applications</h2>{apps.length===0?<p>No applications yet.</p>:apps.map(a=><div className="application" key={a.id}><div><b>{a.property?.title}</b><span>{a.property?.location}</span></div><strong className={a.status.toLowerCase()}>{a.status}</strong></div>)}</section>}
 </main></div>
}

function App(){
 const user=JSON.parse(sessionStorage.getItem('rhUser')||'null');
 useEffect(()=>{
   if(!user) return;
   const last=Number(sessionStorage.getItem('rhLastActivity')||Date.now());
   if(Date.now()-last>30*60*1000){sessionStorage.clear(); location.href='/login'; return;}
   const touch=()=>sessionStorage.setItem('rhLastActivity',String(Date.now()));
   touch();
   const events=['click','keydown','mousemove','scroll','touchstart'];
   events.forEach(e=>window.addEventListener(e,touch,{passive:true}));
   const timer=setInterval(()=>{const t=Number(sessionStorage.getItem('rhLastActivity')||Date.now()); if(Date.now()-t>30*60*1000){sessionStorage.clear();location.href='/login';}},60000);
   return ()=>{events.forEach(e=>window.removeEventListener(e,touch));clearInterval(timer)};
 },[user?.id]); const [mode,setMode]=useState(location.pathname==='/register'?'register':'login'); const [msg,setMsg]=useState(''); const path=location.pathname
 if(!user) return <Auth mode={mode} setMode={setMode} msg={msg} setMsg={setMsg}/>
 if(path==='/login'||path==='/register') return <Redirect to="/dashboard"/>
 if(path==='/dashboard'||path==='/admin'||path==='/admin/'||path==='/admin/dashboard'||path==='/user'||path==='/user/'||path==='/user/dashboard'){
   if(path.startsWith('/admin')&&user.role!=='ADMIN') return <Redirect to="/user/dashboard"/>
   if(path.startsWith('/user')&&user.role==='ADMIN') return <Redirect to="/admin/dashboard"/>
   return <Dashboard user={user}/>
 }
 if(path==='/properties'||path==='/properties/') return <Properties user={user}/>
 return <Redirect to="/dashboard"/>
}
function Redirect({to}){useEffect(()=>{location.href=to},[to]);return <div className="auth"><div className="auth-card"><h2>Opening Dashboard...</h2></div></div>}
export default App
