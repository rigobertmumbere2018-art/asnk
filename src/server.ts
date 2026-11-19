import "./lib/error-capture";
import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import { handleAsnkApi } from "./lib/cloudflare-api";
import type { AsnkEnv } from "./lib/cloudflare-api";
type ServerEntry={fetch:(request:Request,env:unknown,ctx:unknown)=>Promise<Response>|Response};
let serverEntryPromise:Promise<ServerEntry>|undefined;
async function getServerEntry():Promise<ServerEntry>{if(!serverEntryPromise)serverEntryPromise=import("@tanstack/react-start/server-entry").then(m=>(m.default??m) as ServerEntry);return serverEntryPromise}
async function normalize(response:Response):Promise<Response>{if(response.status<500)return response;const type=response.headers.get("content-type")??"";if(!type.includes("application/json"))return response;const body=await response.clone().text();if(!body.includes('"unhandled":true')||!body.includes('"message":"HTTPError"'))return response;console.error(consumeLastCapturedError()??new Error("h3 swallowed SSR error: "+body));return new Response(renderErrorPage(),{status:500,headers:{"content-type":"text/html; charset=utf-8"}})}
const FAVICON_KEY="favicon/asnk-official.svg";
export default {async fetch(request:Request,env:unknown,ctx:unknown){try{const asnkEnv=env as AsnkEnv;const url=new URL(request.url);if((url.pathname==="/favicon.ico"||url.pathname==="/favicon.svg")&&(request.method==="GET"||request.method==="HEAD")){const object=await asnkEnv.ASNK_MEDIA.get(FAVICON_KEY);if(!object?.body)return new Response("Favicon introuvable",{status:404});return new Response(request.method==="HEAD"?null:object.body,{status:200,headers:{"content-type":"image/svg+xml","cache-control":"public, max-age=86400","x-content-type-options":"nosniff"}})}const api=await handleAsnkApi(request,asnkEnv);if(api)return api;const handler=await getServerEntry();return await normalize(await handler.fetch(request,env,ctx))}catch(error){console.error(error);return new Response(renderErrorPage(),{status:500,headers:{"content-type":"text/html; charset=utf-8"}})}}};
