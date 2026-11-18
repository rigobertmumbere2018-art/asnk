type ApiError={message:string;code?:string};
type Result<T=any>={data:T|null;error:ApiError|null;count?:number};
async function request<T>(path:string,init?:RequestInit):Promise<T>{const r=await fetch(path,{credentials:"same-origin",...init,headers:{"content-type":"application/json",...(init?.headers??{})}});const data=await r.json().catch(()=>({error:"Réponse serveur invalide"}));if(!r.ok)throw new Error(data.error??"Erreur serveur");return data as T}
class Query implements PromiseLike<Result<any>>{
 private op="select";private values:any;private filters:any[]=[];private sort:any;private max?:number;private cardinality:"many"|"single"|"maybe"="many";
 constructor(private table:string,private columns="*"){}
 select(columns="*"){this.columns=columns;return this}
 insert(values:any){this.op="insert";this.values=values;return this}
 update(values:any){this.op="update";this.values=values;return this}
 delete(){this.op="delete";return this}
 eq(column:string,value:any){this.filters.push({column,op:"eq",value});return this}
 neq(column:string,value:any){this.filters.push({column,op:"neq",value});return this}
 gt(column:string,value:any){this.filters.push({column,op:"gt",value});return this}
 gte(column:string,value:any){this.filters.push({column,op:"gte",value});return this}
 lt(column:string,value:any){this.filters.push({column,op:"lt",value});return this}
 lte(column:string,value:any){this.filters.push({column,op:"lte",value});return this}
 in(column:string,value:any[]){this.filters.push({column,op:"in",value});return this}
 is(column:string,value:any){this.filters.push({column,op:"is",value});return this}
 order(column:string,options?:{ascending?:boolean}){this.sort={column,ascending:options?.ascending??true};return this}
 limit(value:number){this.max=value;return this}
 single(){this.cardinality="single";return this}
 maybeSingle(){this.cardinality="maybe";return this}
 then<TResult1=Result<any>,TResult2=never>(onfulfilled?:((value:Result<any>)=>TResult1|PromiseLike<TResult1>)|null,onrejected?:((reason:any)=>TResult2|PromiseLike<TResult2>)|null):PromiseLike<TResult1|TResult2>{return this.execute().then(onfulfilled,onrejected)}
 private async execute():Promise<Result<any>>{try{const result=await request<{data:any;count?:number}>("/api/db",{method:"POST",body:JSON.stringify({table:this.table,op:this.op,values:this.values,filters:this.filters,columns:this.columns,order:this.sort,limit:this.max})});let data=result.data;if(this.cardinality!=="many"&&Array.isArray(data)){if(data.length>1&&this.cardinality==="single")throw new Error("Plusieurs résultats retournés");data=data[0]??null;if(data===null&&this.cardinality==="single")throw new Error("Aucun résultat");}return {data,error:null,count:result.count}}catch(e){return {data:null,error:{message:e instanceof Error?e.message:"Erreur inconnue"}}}}
}
const activeChannels=new Set<any>();
const auth={
 async getSession(){try{const r=await request<any>("/api/auth/session");return {data:{session:r.user?{user:r.user,access_token:"cloudflare-session",token_type:"bearer"}:null},error:null}}catch(e){return {data:{session:null},error:{message:String(e)}}}},
 async getUser(){try{const r=await request<any>("/api/auth/session");return {data:{user:r.user??null},error:null}}catch(e){return {data:{user:null},error:{message:String(e)}}}},
 async signInWithPassword({email,password,remember}:any){try{const r=await request<any>("/api/auth/login",{method:"POST",body:JSON.stringify({email,password,remember:remember!==false})});return {data:{user:r.user,session:{user:r.user,access_token:"cloudflare-session"}},error:null}}catch(e){return {data:{user:null,session:null},error:{message:e instanceof Error?e.message:"Connexion impossible"}}}},
 async signUp({email,password,options}:any){try{const r=await request<any>("/api/auth/signup",{method:"POST",body:JSON.stringify({email,password,full_name:options?.data?.full_name})});return {data:{user:{email},session:null},error:null}}catch(e){return {data:{user:null,session:null},error:{message:e instanceof Error?e.message:"Inscription impossible"}}}},
 async signOut(){try{await request("/api/auth/logout",{method:"POST",body:"{}"});return {error:null}}catch(e){return {error:{message:String(e)}}}},
 async resetPasswordForEmail(){return {error:{message:"La réinitialisation par email sera activée après configuration du service d'envoi ASNK."}}}
};
const storage={from(bucket:string){return {async upload(path:string,file:File){try{const form=new FormData();form.append("file",file);form.append("path",path);form.append("bucket",bucket);const r=await fetch("/api/storage/upload",{method:"POST",body:form,credentials:"same-origin"});const d=await r.json();if(!r.ok)throw new Error(d.error);return {data:{path},error:null}}catch(e){return {data:null,error:{message:String(e)}}}},async createSignedUrl(path:string){return {data:{signedUrl:path.startsWith("http")?path:"https://pub-09215c6a4e1441598c606e92ab2a3793.r2.dev/"+path},error:null}},async remove(paths:string[]){try{await request("/api/storage/delete",{method:"POST",body:JSON.stringify({bucket,paths})});return {data:[],error:null}}catch(e){return {data:null,error:{message:String(e)}}}}}}};
class PollChannel{
 private handlers:{event:string;filter:any;callback:(payload:any)=>void}[]=[];
 private timer:any=null;private snapshot:any[]=[];
 on(_type:string,filter:any,callback:(payload:any)=>void){this.handlers.push({event:filter?.event??"*",filter,callback});return this}
 subscribe(){if(this.timer)return this;this.timer=setInterval(()=>void this.poll(),4000);activeChannels.add(this);return this}
 private async poll(){const h=this.handlers[0];if(!h?.filter?.table)return;try{const r=await request<any>("/api/db",{method:"POST",body:JSON.stringify({table:h.filter.table,op:"select",filters:[],limit:300,order:{column:"created_at",ascending:true}})});const next=r.data??[];if(this.snapshot.length){const before=new Map(this.snapshot.map((x:any)=>[x.id,x]));const after=new Map(next.map((x:any)=>[x.id,x]));for(const row of next){if(!before.has(row.id))for(const item of this.handlers)if(item.event==="*"||item.event==="INSERT")item.callback({eventType:"INSERT",new:row,old:{}})}for(const row of this.snapshot){if(!after.has(row.id))for(const item of this.handlers)if(item.event==="*"||item.event==="DELETE")item.callback({eventType:"DELETE",new:{},old:row})}}this.snapshot=next}catch{}}
 unsubscribe(){if(this.timer)clearInterval(this.timer);this.timer=null;activeChannels.delete(this);return Promise.resolve("ok")}
}
export const supabase:any={from:(table:string)=>new Query(table),auth,storage,channel:(_name:string)=>new PollChannel(),removeChannel:async(channel:any)=>channel?.unsubscribe?.()};
