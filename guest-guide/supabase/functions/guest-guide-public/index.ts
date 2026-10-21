// Guest guide public-feed candidate. Keep JWT verification enabled until audited.
// Requires server-only SUPABASE_SERVICE_ROLE_KEY; never expose it to browser.
// Publication and approval are checked on every request.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const headers={"content-type":"application/json; charset=utf-8","access-control-allow-origin":"*","access-control-allow-methods":"GET, OPTIONS","access-control-allow-headers":"content-type, apikey, authorization","cache-control":"no-store"};
const respond=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers});
const validUrl=(value:unknown)=>{if(typeof value!=="string")return null;try{const u=new URL(value);return u.protocol==="https:"?u.href:null}catch{return null}};
const norm=(v:unknown)=>String(v??"").trim().toLocaleLowerCase("es");
const applicable=(x:Record<string,unknown>)=>{
 const type=norm(x.partner_type);
 const city=norm(x.city),region=norm(x.region),country=norm(x.country);
 if(type==="global")return true;
 if(type==="national")return !country||["españa","espana","spain","es"].includes(country);
 if(type==="regional")return region==="galicia";
 if(type==="provincial")return ["pontevedra","vigo"].includes(city)||region==="pontevedra";
 return city==="vigo";
};
Deno.serve(async req=>{
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers});
 if(req.method!=="GET")return respond({error:"Method not allowed"},405);
 const u=new URL(req.url);
 if(u.searchParams.get("property")!=="el-almendro")return respond({error:"Not found"},404);
 const url=Deno.env.get("SUPABASE_URL"),key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
 if(!url||!key)return respond({error:"Service unavailable"},503);
 const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data:pub,error:pubError}=await db.from("property_publications").select("property_id,slug,is_published").eq("slug","el-almendro-509ab578").maybeSingle();
 if(pubError)return respond({error:"Service unavailable"},503);
 if(!pub?.is_published)return respond({error:"Not found"},404);
 const {data:property,error:propertyError}=await db.from("properties").select("id,city,status,review_status").eq("id",pub.property_id).maybeSingle();
 if(propertyError)return respond({error:"Service unavailable"},503);
 if(!property||norm(property.city)!=="vigo"||property.status!=="published"||property.review_status!=="approved")return respond({error:"Not found"},404);
 const [approvals,events,collaborators,partners]=await Promise.all([
  db.from("guest_guide_item_publications").select("item_type,item_id").eq("property_id",property.id).eq("approved_for_guests",true).limit(500),
  db.from("events").select("id,title,description,starts_at,ends_at,source_url,city").eq("property_id",property.id).gte("starts_at",new Date().toISOString()).order("starts_at",{ascending:true}).limit(30),
  db.from("property_collaborators").select("id,name,description,promotion,website,is_active,city").eq("property_id",property.id).eq("is_active",true).limit(30),
  db.from("urban_stay_partners").select("id,name,description,promotion,website,is_active,partner_type,city,region,country,starts_at,ends_at").eq("is_active",true).limit(100)
 ]);
 if(approvals.error||events.error||collaborators.error||partners.error)return respond({error:"Service unavailable"},503);
 const allowed=new Set((approvals.data||[]).map(x=>x.item_type+":"+x.item_id));
 const isApproved=(type:string,id:string)=>allowed.has(type+":"+id);
 const now=Date.now();
 const agenda=(events.data||[]).filter(x=>isApproved("event",x.id)&&(!x.city||norm(x.city)==="vigo")).map(x=>({title:x.title,description:x.description,url:validUrl(x.source_url),published:true,active:true,expiresAt:x.ends_at||null}));
 const own=(collaborators.data||[]).filter(x=>isApproved("property_collaborator",x.id)&&norm(x.city)==="vigo")).map(x=>({title:x.name,description:x.description,url:validUrl(x.website),published:true,active:true}));
 const activePartners=(partners.data||[]).filter(x=>isApproved("urban_stay_partner",x.id)&&applicable(x)&&(!x.starts_at||Date.parse(x.starts_at)<=now)&&(!x.ends_at||Date.parse(x.ends_at)>=now));
 const commercial=activePartners.map(x=>({title:x.name,description:x.description,url:validUrl(x.website),published:true,active:true,expiresAt:x.ends_at||null}));
 const promotions=[...(collaborators.data||[]).filter(x=>isApproved("property_collaborator",x.id)&&x.is_active&&norm(x.city)==="vigo"&&x.promotion).map(x=>({title:x.name,description:x.promotion,published:true,active:true})),...activePartners.filter(x=>x.promotion).map(x=>({title:x.name,description:x.promotion,published:true,active:true,expiresAt:x.ends_at||null}))];
 return respond({property:{slug:"el-almendro",city:"Vigo"},agenda,collaborators:[...own,...commercial],promotions});
});
