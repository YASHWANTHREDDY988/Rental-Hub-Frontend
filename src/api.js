const API='https://rental-hub-backend-1.onrender.com/api'
function auth(){const t=sessionStorage.getItem('rhToken');return t?{Authorization:'Bearer '+t}:{} }
async function handle(r){if(r.status===401||r.status===403){sessionStorage.removeItem('rhToken');sessionStorage.removeItem('rhUser');if(location.pathname!=='/login'&&location.pathname!=='/register')location.href='/login';throw new Error('Your session is not authorized. Please login again.')}if(!r.ok){let m=`Request failed (${r.status})`;try{const d=await r.json();if(d.message)m=d.message}catch{}throw new Error(m)}return r.status===204?null:r.json()}
const req=(url,opt={})=>fetch(url,{...opt,headers:{...auth(),...(opt.headers||{})}}).then(handle)
export const getProperties=s=>req(`${API}/properties${s?`?search=${encodeURIComponent(s)}`:''}`)
export const createProperty=p=>req(`${API}/properties`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(p)})
export const updateProperty=(id,p)=>req(`${API}/properties/${id}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(p)})
export const deleteProperty=id=>req(`${API}/properties/${id}`,{method:'DELETE'})
export const login=async(email,password)=>{const r=await fetch(`${API}/auth/login`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password})});const data=await handle(r);const u={...data.user,token:data.token};sessionStorage.setItem('rhToken',data.token);sessionStorage.setItem('rhUser',JSON.stringify(u));sessionStorage.setItem('rhLastActivity',String(Date.now()));return u}
export const register=async(name,email,password)=>{const r=await fetch(`${API}/auth/register`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,email,password})});return handle(r)}
export const logout=()=>{sessionStorage.clear()}
export const applyForProperty=propertyId=>req(`${API}/applications`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({propertyId})})
export const getUserApplications=id=>req(`${API}/applications/user/${id}`)
export const getAllApplications=()=>req(`${API}/applications`)
export const approveApplication=id=>req(`${API}/applications/${id}/approve`,{method:'PUT'})
export const rejectApplication=id=>req(`${API}/applications/${id}/reject`,{method:'PUT'})
export const cancelApplication=id=>req(`${API}/applications/${id}/cancel`,{method:'PUT'})
export const cancelApproval=id=>req(`${API}/applications/${id}/cancel-approval`,{method:'PUT'})
export const getUsers=()=>req(`${API}/users`)
export const deleteUser=id=>req(`${API}/users/${id}`,{method:'DELETE'})
export const deleteMyAccount=id=>req(`${API}/users/${id}`,{method:'DELETE'})
