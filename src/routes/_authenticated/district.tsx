import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ClipboardList, Loader2, Send, Users } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

type District = { id:string; name:string; code:string|null; description:string|null; history:string|null; commissioner_name:string|null; office_address:string|null; phone:string|null; professional_email:string|null; other_contacts:any; social_links:any };
type Group = { id:string; name:string; locality:string|null; description:string|null; young_members:number; adult_volunteers:number; status:string };
type Proposal = { id:string; change_type:string; status:string; review_note:string|null; created_at:string };
const blankDistrict={description:"",history:"",commissioner_name:"",office_address:"",phone:"",professional_email:"",other_contacts:"",social_links:""};
const blankGroup={name:"",locality:"",description:"",young_members:"",adult_volunteers:""};
function listText(value:any,key:"value"|"url"){
  let rows:any[]=value;
  if(typeof value==="string"){try{rows=JSON.parse(value)}catch{rows=[]}}
  if(!Array.isArray(rows))return "";
  return rows.map(row=>[row.label||row.name||"",row[key]||""].filter(Boolean).join("|")).join("\n");
}
function parseLines(value:string,key:"value"|"url"){
  return value.split("\n").map(line=>line.trim()).filter(Boolean).map(line=>{
    const parts=line.split("|");
    return {label:(parts.shift()||"").trim(),[key]:parts.join("|").trim()};
  });
}

export const Route=createFileRoute("/_authenticated/district")({
  beforeLoad:async({context})=>{
    const {data,error}=await supabase.from("district_commissioners").select("district_id").eq("user_id",context.user.id).eq("status","active").maybeSingle();
    if(error||!data)throw redirect({to:"/dashboard"});
    return {districtId:data.district_id as string};
  },
  head:()=>({meta:[{title:"Espace commissaire de district — ASNK"}]}),
  component:Page,
});

function Page(){
  const {user,districtId}=Route.useRouteContext();
  const [district,setDistrict]=useState<District|null>(null);
  const [groups,setGroups]=useState<Group[]>([]);
  const [proposals,setProposals]=useState<Proposal[]>([]);
  const [districtDraft,setDistrictDraft]=useState(blankDistrict);
  const [groupDraft,setGroupDraft]=useState(blankGroup);
  const [editingGroup,setEditingGroup]=useState<Group|null>(null);
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const field="mt-1 w-full rounded-xl border border-white/10 bg-scout-deep px-3 py-2.5 text-sm text-white outline-none focus:border-scout-green/60";
  const label="block text-xs font-medium text-white/60";

  async function refresh(){
    setLoading(true);
    const [d,g,p]=await Promise.all([
      supabase.from("districts").select("*").eq("id",districtId).maybeSingle(),
      supabase.from("scout_groups").select("*").eq("district_id",districtId).order("name",{ascending:true}),
      supabase.from("district_change_requests").select("*").eq("district_id",districtId).order("created_at",{ascending:false}),
    ]);
    if(d.error||!d.data){toast.error(d.error?.message||"Fiche de district introuvable");setLoading(false);return}
    setDistrict(d.data as District);
    setDistrictDraft({description:d.data.description||"",history:d.data.history||"",commissioner_name:d.data.commissioner_name||"",office_address:d.data.office_address||"",phone:d.data.phone||"",professional_email:d.data.professional_email||"",other_contacts:listText(d.data.other_contacts,"value"),social_links:listText(d.data.social_links,"url")});
    setGroups((g.data||[]) as Group[]);
    setProposals((p.data||[]) as Proposal[]);
    if(g.error)toast.error(g.error.message);
    if(p.error)toast.error(p.error.message);
    setLoading(false);
  }
  useEffect(()=>{void refresh()},[districtId]);

  async function submit(type:string,data:any){
    setSaving(true);
    const {error}=await supabase.from("district_change_requests").insert({district_id:districtId,change_type:type,proposed_data:data});
    setSaving(false);
    if(error)return toast.error(error.message);
    toast.success("Proposition transmise. Elle ne sera publiée qu'après validation centrale.");
    setEditingGroup(null);
    await refresh();
  }
  async function proposeDistrict(){
    if(districtDraft.professional_email&&!/^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/.test(districtDraft.professional_email))return toast.error("Adresse email professionnelle invalide.");
    const social=parseLines(districtDraft.social_links,"url");
    if(social.some(link=>link.url&&!(link.url.startsWith("https://")||link.url.startsWith("http://"))))return toast.error("Les liens sociaux doivent commencer par http:// ou https://.");
    await submit("district_update",{...districtDraft,other_contacts:parseLines(districtDraft.other_contacts,"value"),social_links:social});
  }
  async function proposeGroup(){
    const y=Number(groupDraft.young_members),a=Number(groupDraft.adult_volunteers);
    if(!groupDraft.name.trim()||groupDraft.young_members.trim()===""||groupDraft.adult_volunteers.trim()===""||!Number.isInteger(y)||y<0||!Number.isInteger(a)||a<0)return toast.error("Nom du groupe et deux effectifs obligatoires.");
    await submit("group_create",{...groupDraft,young_members:y,adult_volunteers:a});
    setGroupDraft(blankGroup);
  }
  async function proposeGroupUpdate(){
    if(!editingGroup)return;
    const y=Number(editingGroup.young_members),a=Number(editingGroup.adult_volunteers);
    if(!Number.isInteger(y)||y<0||!Number.isInteger(a)||a<0)return toast.error("Effectifs invalides.");
    await submit("group_update",{group_id:editingGroup.id,name:editingGroup.name,locality:editingGroup.locality,description:editingGroup.description,young_members:y,adult_volunteers:a});
  }

  return <div className="px-5 py-10 lg:px-10 lg:py-12">
    <AdminPageHeader eyebrow="Espace décentralisé" title={district?.name||"Espace commissaire"} description="Proposez des mises à jour pour votre district. Elles restent privées jusqu'à leur validation par l'administration centrale."/>
    {loading?<div className="flex justify-center py-16"><Loader2 className="size-6 animate-spin text-white/60"/></div>:!district?<p className="mt-6 text-sm text-white/55">Aucune fiche de district associée à ce compte.</p>:<>
      <div className="mt-6 rounded-2xl border border-white/10 bg-card p-5"><p className="text-xs uppercase tracking-wider text-white/45">Compte connecté</p><p className="mt-1 text-sm">{user.email}</p><p className="mt-2 text-xs text-white/50">District autorisé : {district.name} · {district.code||"Code à renseigner"}</p></div>
      <section className="mt-6 rounded-2xl border border-white/10 bg-card p-5 sm:p-7">
        <h2 className="text-lg font-semibold">Proposer une mise à jour de la fiche</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className={label}>Description<textarea rows={3} className={field} value={districtDraft.description} onChange={e=>setDistrictDraft({...districtDraft,description:e.target.value})}/></label>
          <label className={label}>Historique<textarea rows={3} className={field} value={districtDraft.history} onChange={e=>setDistrictDraft({...districtDraft,history:e.target.value})}/></label>
          <label className={label}>Commissaire<input className={field} value={districtDraft.commissioner_name} onChange={e=>setDistrictDraft({...districtDraft,commissioner_name:e.target.value})}/></label>
          <label className={label}>Adresse du bureau<input className={field} value={districtDraft.office_address} onChange={e=>setDistrictDraft({...districtDraft,office_address:e.target.value})}/></label>
          <label className={label}>Téléphone<input className={field} value={districtDraft.phone} onChange={e=>setDistrictDraft({...districtDraft,phone:e.target.value})}/></label>
          <label className={label}>Email professionnel<input type="email" className={field} value={districtDraft.professional_email} onChange={e=>setDistrictDraft({...districtDraft,professional_email:e.target.value})}/></label>
          <label className={label}>Autres contacts — Nom|Valeur<textarea rows={3} className={field} value={districtDraft.other_contacts} onChange={e=>setDistrictDraft({...districtDraft,other_contacts:e.target.value})}/></label>
          <label className={label}>Réseaux sociaux — Nom|URL<textarea rows={3} className={field} value={districtDraft.social_links} onChange={e=>setDistrictDraft({...districtDraft,social_links:e.target.value})}/></label>
        </div>
        <div className="mt-5 flex justify-end"><button disabled={saving} onClick={proposeDistrict} className="inline-flex items-center gap-2 rounded-full bg-scout-green px-5 py-2.5 text-sm font-semibold text-scout-deep"><Send className="size-4"/>Soumettre la proposition</button></div>
      </section>
      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-card p-5 sm:p-7">
          <h2 className="text-lg font-semibold">Proposer un groupe scout</h2>
          <div className="mt-4 space-y-3">
            <label className={label}>Nom du groupe<input className={field} value={groupDraft.name} onChange={e=>setGroupDraft({...groupDraft,name:e.target.value})}/></label>
            <label className={label}>Localité<input className={field} value={groupDraft.locality} onChange={e=>setGroupDraft({...groupDraft,locality:e.target.value})}/></label>
            <label className={label}>Description<textarea rows={2} className={field} value={groupDraft.description} onChange={e=>setGroupDraft({...groupDraft,description:e.target.value})}/></label>
            <div className="grid grid-cols-2 gap-3"><label className={label}>Jeunes<input type="number" min="0" required className={field} value={groupDraft.young_members} onChange={e=>setGroupDraft({...groupDraft,young_members:e.target.value})}/></label><label className={label}>Adultes bénévoles<input type="number" min="0" required className={field} value={groupDraft.adult_volunteers} onChange={e=>setGroupDraft({...groupDraft,adult_volunteers:e.target.value})}/></label></div>
          </div>
          <div className="mt-5 flex justify-end"><button disabled={saving} onClick={proposeGroup} className="inline-flex items-center gap-2 rounded-full border border-scout-green/40 px-5 py-2.5 text-sm text-scout-green"><Users className="size-4"/>Soumettre le groupe</button></div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-card p-5 sm:p-7">
          <h2 className="text-lg font-semibold">Groupes de votre district</h2>
          <div className="mt-4 space-y-3">{groups.map(g=><div key={g.id} className="rounded-xl border border-white/10 p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-medium">{g.name}</p><p className="text-xs text-white/45">{g.locality||"Localité à renseigner"} · {g.status}</p></div><button onClick={()=>setEditingGroup({...g})} className="text-xs text-scout-green">Proposer une correction</button></div><p className="mt-2 text-xs text-white/55">{g.young_members} jeunes · {g.adult_volunteers} adultes bénévoles</p></div>)}{groups.length===0&&<p className="text-sm text-white/50">Aucun groupe enregistré pour ce district.</p>}</div>
          {editingGroup&&<div className="mt-5 border-t border-white/10 pt-5"><h3 className="font-semibold">Corriger {editingGroup.name}</h3><div className="mt-3 space-y-3"><label className={label}>Nom<input className={field} value={editingGroup.name} onChange={e=>setEditingGroup({...editingGroup,name:e.target.value})}/></label><label className={label}>Localité<input className={field} value={editingGroup.locality||""} onChange={e=>setEditingGroup({...editingGroup,locality:e.target.value})}/></label><label className={label}>Description<textarea rows={2} className={field} value={editingGroup.description||""} onChange={e=>setEditingGroup({...editingGroup,description:e.target.value})}/></label><div className="grid grid-cols-2 gap-3"><label className={label}>Jeunes<input type="number" min="0" className={field} value={editingGroup.young_members} onChange={e=>setEditingGroup({...editingGroup,young_members:Number(e.target.value)})}/></label><label className={label}>Adultes<input type="number" min="0" className={field} value={editingGroup.adult_volunteers} onChange={e=>setEditingGroup({...editingGroup,adult_volunteers:Number(e.target.value)})}/></label></div></div><div className="mt-4 flex justify-end gap-2"><button onClick={()=>setEditingGroup(null)} className="rounded-full border border-white/10 px-4 py-2 text-xs">Annuler</button><button disabled={saving} onClick={proposeGroupUpdate} className="rounded-full bg-scout-green px-4 py-2 text-xs font-semibold text-scout-deep">Soumettre</button></div></div>}
        </div>
      </section>
      <section className="mt-6 rounded-2xl border border-white/10 bg-card p-5 sm:p-7">
        <h2 className="flex items-center gap-2 text-lg font-semibold"><ClipboardList className="size-5 text-scout-green"/>Historique des propositions</h2>
        <div className="mt-4 space-y-3">{proposals.map(p=><div key={p.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-3"><div><p className="text-sm font-medium">{p.change_type.replaceAll("_"," ")}</p><p className="text-xs text-white/45">{new Date(p.created_at).toLocaleString("fr-FR")}</p>{p.review_note&&<p className="mt-1 text-xs text-white/60">Note : {p.review_note}</p>}</div><span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/65">{p.status}</span></div>)}{proposals.length===0&&<p className="text-sm text-white/50">Aucune proposition envoyée.</p>}</div>
      </section>
    </>}
  </div>;
}
