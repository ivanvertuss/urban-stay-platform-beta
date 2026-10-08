import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders={
 "Access-Control-Allow-Origin":"*",
 "Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type",
 "Access-Control-Allow-Methods":"POST, OPTIONS",
};

serve(async(req)=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers:corsHeaders});
 try{
  const body=await req.json();
  const city=String(body?.city||"").trim(),country=String(body?.country||"").trim();
  if(!city)return json({error:"city_required"},400);

  // Ticketmaster is proxied through this Edge Function so the browser never
  // calls app.ticketmaster.com directly (which can fail because of CORS/network policy).
  if(body?.provider==="ticketmaster"){
   const ticketmasterKey=String(body?.apiKey||Deno.env.get("TICKETMASTER_API_KEY")||"").trim();
   if(!ticketmasterKey)return json({error:"ticketmaster_key_required"},400);
   const cc=String(body?.countryCode||"").trim().toUpperCase();
   const params=new URLSearchParams({apikey:ticketmasterKey,city,sort:"date,asc",size:"12",locale:"*"});
   if(cc)params.set("countryCode",cc);
   params.set("startDateTime",new Date().toISOString().replace(/\.\d{3}Z$/,"Z"));
   const tmResponse=await fetch(`https://app.ticketmaster.com/discovery/v2/events.json?${params}`,{headers:{Accept:"application/json"}});
   const tmResult=await tmResponse.json().catch(()=>({}));
   if(!tmResponse.ok)return json({error:"ticketmaster_request_failed",detail:tmResult?.fault?.faultstring||tmResult?.message||`HTTP ${tmResponse.status}`},502);
   return json({city,country,updatedAt:new Date().toISOString(),events:tmResult?._embedded?.events||[]},200);
  }

  const apiKey=Deno.env.get("OPENAI_API_KEY");
  if(!apiKey)throw new Error("OPENAI_API_KEY is not configured");
  const today=new Date().toISOString().slice(0,10);
  const prompt=`Find current public events for visitors in ${city}, ${country}. Today is ${today}.
Prioritize official city/tourism/cultural venue sources and local public events that global ticketing sites often miss: popular festivals and traditions, gastronomy, fairs, culture, family activities, sport and municipal events.
Return only events whose date can be verified and is today or in the future. Prefer events in the next 120 days. Do not invent information. Deduplicate the same event. Write names and venue names as officially used. Category must be one of: Fiestas y tradiciones, Música, Cultura, Gastronomía, Ferias, Deporte, Familiar, Otros. URL must be the best public source for that event. Return at most 18 events.`;
  const response=await fetch("https://api.openai.com/v1/responses",{
   method:"POST",headers:{"Authorization":`Bearer ${apiKey}`,"Content-Type":"application/json"},
   body:JSON.stringify({
    model:"gpt-5.6-luna",tools:[{type:"web_search"}],input:prompt,
    text:{format:{type:"json_schema",name:"city_agenda",strict:true,schema:{
     type:"object",additionalProperties:false,properties:{
      events:{type:"array",items:{type:"object",additionalProperties:false,properties:{
       name:{type:"string"},date:{type:"string"},time:{type:"string"},venue:{type:"string"},
       city:{type:"string"},url:{type:"string"},category:{type:"string",enum:["Fiestas y tradiciones","Música","Cultura","Gastronomía","Ferias","Deporte","Familiar","Otros"]},
       source:{type:"string"},description:{type:"string"}
      },required:["name","date","time","venue","city","url","category","source","description"]}}
     },required:["events"]
    }}}
   })
  });
  const result=await response.json();
  if(!response.ok)return json({error:"openai_request_failed",detail:result?.error?.message||"Unknown error"},502);
  const text=result?.output_text||result?.output?.flatMap((o:any)=>o?.content||[]).find((c:any)=>c?.type==="output_text")?.text;
  if(!text)return json({error:"empty_ai_response"},502);
  const parsed=JSON.parse(text),events=Array.isArray(parsed?.events)?parsed.events:[];
  return json({city,country,updatedAt:new Date().toISOString(),events},200);
 }catch(error){
  console.error(error);return json({error:"agenda_city_failed",detail:String(error?.message||error)},500);
 }
});
function json(body:unknown,status=200){return new Response(JSON.stringify(body),{status,headers:{...corsHeaders,"Content-Type":"application/json"}})}
