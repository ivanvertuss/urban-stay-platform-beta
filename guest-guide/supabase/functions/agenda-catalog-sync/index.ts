// Server-only city event importer. Never expose the service role key to a browser.
// Invoke through a trusted scheduler with Authorization: Bearer <service role key>.
// The importer does NOT approve any event for guest publication.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const reply=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{"content-type":"application/json"}});
const norm=(v:unknown)=>String(v??"").trim();
const date=(v:unknown)=>{const s=norm(v);if(!/^\d{4}-\d{2}-\d{2}$/.test(s))return null;const d=new Date(s+"T12:00:00Z");return Number.isNaN(d.getTime())||d.toISOString().slice(0,10)!==s?null:d.toISOString()};
const safeUrl=(v:unknown)=>{try{const u=new URL(norm(v));return u.protocol==="https:"?u.href:null}catch{return null}};
Deno.serve(async req=>{
 if(req.method!=="POST")return reply({error:"Method not allowed"},405);
 const url=Deno.env.get("SUPABASE_URL"),secret=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
 if(!url||!secret)return reply({error:"Server configuration missing"},503);
 if(req.headers.get("authorization")!=="Bearer "+secret)return reply({error:"Unauthorized"},401);
 const requestedProvider=(()=>{try{return new URL(req.url).searchParams.get("provider")}catch{return null}})();
 if(requestedProvider!==null&&!["ticketmaster","city"].includes(requestedProvider))return reply({error:"Invalid provider"},400);
 const db=createClient(url,secret,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data:pubs,error:pubError}=await db.from("property_publications").select("property_id").eq("is_published",true);
 if(pubError)return reply({error:"Publications unavailable"},503);
 const ids=(pubs||[]).map(x=>x.property_id);
 if(!ids.length)return reply({properties:0,imported:0});
 const {data:props,error:propsError}=await db.from("properties").select("id,city,country,status,review_status").in("id",ids).eq("status","published").eq("review_status","approved");
 if(propsError)return reply({error:"Properties unavailable"},503);
 let imported=0;const failures:string[]=[];
 for(const p of props||[]){
  if(!p.city)continue;
  for(const provider of (requestedProvider?[requestedProvider]:["ticketmaster","city"])){
   try{
    const response=await fetch(url+"/functions/v1/agenda-city",{
     method:"POST",headers:{"authorization":"Bearer "+secret,"apikey":secret,"content-type":"application/json"},
     body:JSON.stringify(provider==="ticketmaster"?{provider:"ticketmaster",city:p.city,country:p.country||"",countryCode:p.country==="España"?"ES":undefined}:{city:p.city,country:p.country||""})
    });
    if(!response.ok){failures.push(p.id+":"+provider+":"+response.status);continue}
    const body=await response.json();if(!Array.isArray(body.events))continue;
    const candidates=[];
    for(const e of body.events){
     const isTm=provider==="ticketmaster";
     const title=norm(isTm?e.name:e.name),day=date(isTm?e.dates?.start?.localDate:e.date);
     if(!title||!day||Date.parse(day)<Date.now()-86400000)continue;
     const venue=norm(isTm?e._embedded?.venues?.[0]?.name:e.venue);
     const source=isTm?"ticketmaster":"city";
     const external_id=norm(isTm?e.id:e.id)||[title.toLowerCase(),day.slice(0,10),venue.toLowerCase()].join("|");
     candidates.push({property_id:p.id,source,external_id,title,description:norm(e.description),venue,city:p.city,starts_at:day,source_url:safeUrl(e.url),category:norm(isTm?e.classifications?.[0]?.segment?.name:e.category)});
    }
    if(candidates.length){
     const {error}=await db.from("events").upsert(candidates,{onConflict:"property_id,source,external_id"});
     if(error){failures.push(p.id+":"+provider+":database");continue}
     imported+=candidates.length;
    }
   }catch{failures.push(p.id+":"+provider+":fetch")}
  }
 }
 return reply({properties:props?.length||0,imported,failures});
});
