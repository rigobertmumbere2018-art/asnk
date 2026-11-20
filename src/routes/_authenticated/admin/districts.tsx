import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Loader2, Save, UserPlus, Users, Check, X } from "lucide-react";

type District = { id:string; name:string; code:string|null; description:string|null; history:string|null; commissioner_name:string|null; office_address:string|null; phone:string|null; professional_email:string|null; other_contacts:any; social_links:any };
type Group = { id:string; district_id:string; name:string; locality:string|null; description:string|null; young_members:number; adult_volunteers:number; status:string };
type User = { id:string; email:string; disabled:boolean };
type Assignment = { id:string; district_id:string; user_id:string; status:string; created_at:string };
type Proposal = { id:string; district_id:string; change_type:string; proposed_data:any; previous_data:any; status:string; review_note:string|null; created_at:string };
type AuditLog = { id:string; district_id:string; actor_id:string|null; action:string; entity_type:string; entity_id:string; details:any; created_at:string };

export const Route = createFileRoute("/_authenticated/admin/districts")({
  head: () => ({ meta: [{ title: "Gestion des districts — Administration ASNK" }] }),
  component: Page,
});

const emptyDistrict = {description:"",history:"",commissioner_name:"",office_address:"",phone:"",professional_email:"",other_contacts:"",social_links:""};
const emptyGroup = {name:"",locality:"",description:"",young_members:"",adult_volunteers:""};

function listText(value:any,key:"value"|"url") {
  let rows:any[] = value;
  if (typeof value === "string") { try { rows = JSON.parse(value); } catch { rows = []; } }
  if (!Array.isArray(rows)) return "";
  return rows.map(row => [row.label || row.name || "", row[key] || ""].filter(Boolean).join("|")).join("\n");
}
function parseLines(value:string,key:"value"|"url") {
  return value.split("\n").map(line=>line.trim()).filter(Boolean).map(line=>{
    const parts=line.split("|");
    return {label:(parts.shift()||"").trim(),[key]:parts.join("|").trim()};
  });
}

function Page() {
  const [districts,setDistricts]=useState<District[]>([]);
  const [groups,setGroups]=useState<Group[]>([]);
  const [users,setUsers]=useState<User[]>([]);
  const [assignments,setAssignments]=useState<Assignment[]>([]);
  const [proposals,setProposals]=useState<Proposal[]>([]);
  const [logs,setLogs]=useState<AuditLog[]>([]);
  const [selectedDistrictId,setSelectedDistrictId]=useState("");
  const [districtDraft,setDistrictDraft]=useState(emptyDistrict);
  const [groupDraft,setGroupDraft]=useState(emptyGroup);
  const [assignUserId,setAssignUserId]=useState("");
  const [notes,setNotes]=useState<Record<string,string>>({});
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);

  async function refresh() {
    setLoading(true);
    const results=await Promise.all([
      supabase.from("districts").select("*").order("name",{ascending:true}),
      supabase.from("scout_groups").select("*").order("name",{ascending:true}),
      supabase.from("users").select("id,email,disabled").order("email",{ascending:true}),
      supabase.from("district_commissioners").select("*").order("created_at",{ascending:false}),
      supabase.from("district_change_requests").select("*").order("created_at",{ascending:false}),
      supabase.from("district_audit_log").select("*").order("created_at",{ascending:false}).limit(100),
    ]);
    const d=results[0],g=results[1],u=results[2],a=results[3],p=results[4],l=results[5];
    const firstError=d.error||g.error||u.error||a.error||p.error||l.error;
    if(firstError) toast.error(firstError.message);
    const rows=(d.data||[]) as District[];
    setDistricts(rows);
    setGroups((g.data||[]) as Group[]);
    setUsers(((u.data||[]) as User[]).filter(x=>!x.disabled));
    setAssignments((a.data||[]) as Assignment[]);
    setProposals((p.data||[]) as Proposal[]);
    setLogs((l.data||[]) as AuditLog[]);
    setSelectedDistrictId(current=>current||rows[0]?.id||"");
    setLoading(false);
  }
  useEffect(()=>{void refresh()},[]);
  const selected=districts.find(d=>d.id===selectedDistrictId)||null;
  useEffect(()=>{
    if(!selected)return;
    setDistrictDraft({
      description:selected.description||"",history:selected.history||"",commissioner_name:selected.commissioner_name||"",
      office_address:selected.office_address||"",phone:selected.phone||"",professional_email:selected.professional_email||"",
      other_contacts:listText(selected.other_contacts,"value"),social_links:listText(selected.social_links,"url"),
    });
    setGroupDraft(current=>({...current,district_id:selected.id}));
  },[selectedDistrictId,districts]);

  const approved=groups.filter(g=>g.status==="approved");
  const young=approved.reduce((n,g)=>n+(Number(g.young_members)||0),0);
  const adults=approved.reduce((n,g)=>n+(Number(g.adult_volunteers)||0),0);
  const pending=proposals.filter(p=>p.status==="pending"||p.status==="revision_requested");
  const field="mt-1 w-full rounded-xl border border-white/10 bg-scout-deep px-3 py-2.5 text-sm text-white outline-none focus:border-scout-green/60";
  const label="block text-xs font-medium text-white/60";

  async function saveDistrict() {
    if(!selected)return;
    setSaving(true);
    const payload={...districtDraft,other_contacts:parseLines(districtDraft.other_contacts,"value"),social_links:parseLines(districtDraft.social_links,"url"),updated_at:new Date().toISOString()};
    const {error}=await supabase.from("districts").update(payload).eq("id",selected.id);
    setSaving(false);
    if(error)return toast.error(error.message);
    toast.success("Fiche du district mise à jour.");
    await refresh();
  }

  async function addGroup() {
    if(!groupDraft.district_id||!groupDraft.name.trim())return toast.error("District et nom du groupe obligatoires.");
    const youngCount=Number(groupDraft.young_members),adultCount=Number(groupDraft.adult_volunteers);
    if(groupDraft.young_members.trim()===""||groupDraft.adult_volunteers.trim()===""||!Number.isInteger(youngCount)||youngCount<0||!Number.isInteger(adultCount)||adultCount<0)return toast.error("Les deux effectifs doivent être renseignés avec des nombres entiers positifs.");
    setSaving(true);
    const {error}=await supabase.from("scout_groups").insert({
      district_id:groupDraft.district_id,name:groupDraft.name.trim(),locality:groupDraft.locality.trim()||null,
      description:groupDraft.description.trim()||null,young_members:youngCount,adult_volunteers:adultCount,status:"approved",
    });
    setSaving(false);
    if(error)return toast.error(error.message);
    toast.success("Groupe ajouté et approuvé.");
    setGroupDraft({...emptyGroup,district_id:selectedDistrictId});
    await refresh();
  }

  async function setGroupStatus(group:Group,status:"approved"|"rejected") {
    const {error}=await supabase.from("scout_groups").update({status,updated_at:new Date().toISOString()}).eq("id",group.id);
    if(error)return toast.error(error.message);
    toast.success("Statut du groupe mis à jour.");
    await refresh();
  }

  async function assignCommissioner() {
    if(!selectedDistrictId||!assignUserId)return toast.error("Sélectionnez un district et un compte.");
    setSaving(true);
    try {
      const response=await fetch("/api/districts/assign",{method:"POST",credentials:"same-origin",headers:{"content-type":"application/json"},body:JSON.stringify({district_id:selectedDistrictId,user_id:assignUserId})});
      const result=await response.json();
      if(!response.ok)throw new Error(result.error||"Affectation impossible");
      toast.success(result.already_assigned?"Ce compte est déjà affecté à ce district.":"Affectation enregistrée. Les anciennes affectations sont conservées.");
      setAssignUserId("");
      await refresh();
    } catch(e) { toast.error(e instanceof Error?e.message:"Affectation impossible"); }
    finally { setSaving(false); }
  }

  async function review(proposal:Proposal,decision:"approve"|"reject"|"request_revision") {
    const note=notes[proposal.id]||"";
    if(decision==="request_revision"&&!note.trim())return toast.error("Indiquez la correction attendue.");
    setSaving(true);
    try {
      const response=await fetch("/api/districts/review",{method:"POST",credentials:"same-origin",headers:{"content-type":"application/json"},body:JSON.stringify({request_id:proposal.id,decision,note})});
      const result=await response.json();
      if(!response.ok)throw new Error(result.error||"Traitement impossible");
      toast.success(decision==="approve"?"Proposition approuvée et appliquée.":decision==="reject"?"Proposition rejetée.":"Correction demandée.");
      await refresh();
    } catch(e) { toast.error(e instanceof Error?e.message:"Traitement impossible"); }
    finally { setSaving(false); }
  }

  return (
    <div className="px-5 py-10 lg:px-10 lg:py-12">
      <AdminPageHeader eyebrow="Administration centrale" title="Gestion des districts" description="Gérez les fiches officielles, les groupes scouts, les commissaires et les propositions de modification." />
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-card p-5"><p className="text-2xl font-semibold">{districts.length}</p><p className="mt-1 text-xs text-white/50">Districts enregistrés</p></div>
        <div className="rounded-2xl border border-white/10 bg-card p-5"><p className="text-2xl font-semibold">{approved.length}</p><p className="mt-1 text-xs text-white/50">Groupes approuvés</p></div>
        <div className="rounded-2xl border border-white/10 bg-card p-5"><p className="text-2xl font-semibold">{pending.length}</p><p className="mt-1 text-xs text-white/50">Propositions à examiner</p></div>
      </div>
      <div className="mt-4 rounded-2xl border border-white/10 bg-card p-5">
        <p className="text-xs uppercase tracking-wider text-white/45">Effectifs approuvés de l'ASNK</p>
        <p className="mt-1 text-xl font-semibold">{approved.length? (young+adults).toLocaleString("fr-FR"):"À renseigner"}</p>
        <p className="mt-1 text-xs text-white/50">{approved.length?young.toLocaleString("fr-FR")+" jeunes · "+adults.toLocaleString("fr-FR")+" adultes bénévoles":"Les effectifs seront affichés après validation des données."}</p>
      </div>

      {loading?<div className="flex justify-center py-16"><Loader2 className="size-6 animate-spin text-white/60"/></div>:(
        <>
          <section className="mt-8 rounded-2xl border border-white/10 bg-card p-5 sm:p-7">
            <h2 className="text-lg font-semibold">Fiche officielle du district</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className={label}>District<select className={field} value={selectedDistrictId} onChange={e=>setSelectedDistrictId(e.target.value)}>{districts.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}</select></label>
              <label className={label}>Commissaire<input className={field} value={districtDraft.commissioner_name} onChange={e=>setDistrictDraft({...districtDraft,commissioner_name:e.target.value})}/></label>
              <label className={label}>Description<textarea rows={3} className={field} value={districtDraft.description} onChange={e=>setDistrictDraft({...districtDraft,description:e.target.value})}/></label>
              <label className={label}>Historique<textarea rows={3} className={field} value={districtDraft.history} onChange={e=>setDistrictDraft({...districtDraft,history:e.target.value})}/></label>
              <label className={label}>Adresse du bureau<input className={field} value={districtDraft.office_address} onChange={e=>setDistrictDraft({...districtDraft,office_address:e.target.value})}/></label>
              <label className={label}>Téléphone<input className={field} value={districtDraft.phone} onChange={e=>setDistrictDraft({...districtDraft,phone:e.target.value})}/></label>
              <label className={label}>Email professionnel<input type="email" className={field} value={districtDraft.professional_email} onChange={e=>setDistrictDraft({...districtDraft,professional_email:e.target.value})}/></label>
              <label className={label}>Autres contacts — Nom|Valeur<textarea rows={3} className={field} value={districtDraft.other_contacts} onChange={e=>setDistrictDraft({...districtDraft,other_contacts:e.target.value})}/></label>
              <label className={label}>Réseaux sociaux — Nom|URL<textarea rows={3} className={field} value={districtDraft.social_links} onChange={e=>setDistrictDraft({...districtDraft,social_links:e.target.value})}/></label>
            </div>
            <div className="mt-5 flex justify-end"><button disabled={saving||!selected} onClick={saveDistrict} className="inline-flex items-center gap-2 rounded-full bg-scout-green px-5 py-2.5 text-sm font-semibold text-scout-deep disabled:opacity-50"><Save className="size-4"/>Enregistrer la fiche</button></div>
          </section>

          <section className="mt-6 rounded-2xl border border-white/10 bg-card p-5 sm:p-7">
            <h2 className="text-lg font-semibold">Groupes scouts</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <label className={label}>District<select className={field} value={groupDraft.district_id||selectedDistrictId} onChange={e=>setGroupDraft({...groupDraft,district_id:e.target.value})}>{districts.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}</select></label>
              <label className={label}>Nom du groupe<input className={field} value={groupDraft.name} onChange={e=>setGroupDraft({...groupDraft,name:e.target.value})}/></label>
              <label className={label}>Localité<input className={field} value={groupDraft.locality} onChange={e=>setGroupDraft({...groupDraft,locality:e.target.value})}/></label>
              <label className={label}>Description<input className={field} value={groupDraft.description} onChange={e=>setGroupDraft({...groupDraft,description:e.target.value})}/></label>
              <label className={label}>Jeunes membres<input type="number" min="0" step="1" required className={field} value={groupDraft.young_members} onChange={e=>setGroupDraft({...groupDraft,young_members:e.target.value})}/></label>
              <label className={label}>Adultes bénévoles<input type="number" min="0" step="1" required className={field} value={groupDraft.adult_volunteers} onChange={e=>setGroupDraft({...groupDraft,adult_volunteers:e.target.value})}/></label>
            </div>
            <div className="mt-4 flex justify-end"><button disabled={saving} onClick={addGroup} className="inline-flex items-center gap-2 rounded-full border border-scout-green/40 px-5 py-2.5 text-sm text-scout-green"><Users className="size-4"/>Ajouter le groupe approuvé</button></div>
            <div className="mt-6 overflow-x-auto"><table className="w-full min-w-[700px] text-left text-sm"><thead className="text-xs uppercase tracking-wider text-white/45"><tr><th className="p-3">Groupe</th><th className="p-3">District</th><th className="p-3">Jeunes</th><th className="p-3">Adultes</th><th className="p-3">Statut</th><th className="p-3">Action</th></tr></thead><tbody className="divide-y divide-white/5">
              {groups.map(g=><tr key={g.id}><td className="p-3">{g.name}<div className="text-xs text-white/45">{g.locality||"Localité à renseigner"}</div></td><td className="p-3">{districts.find(d=>d.id===g.district_id)?.name||"District"}</td><td className="p-3">{g.young_members}</td><td className="p-3">{g.adult_volunteers}</td><td className="p-3">{g.status}</td><td className="p-3"><div className="flex gap-2">{g.status!=="approved"&&<button onClick={()=>setGroupStatus(g,"approved")} className="rounded-full bg-scout-green/15 px-3 py-1 text-xs text-scout-green">Approuver</button>}{g.status!=="rejected"&&<button onClick={()=>setGroupStatus(g,"rejected")} className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/65">Rejeter</button>}</div></td></tr>)}
              {groups.length===0&&<tr><td colSpan={6} className="p-6 text-center text-white/50">Aucun groupe enregistré pour le moment.</td></tr>}
            </tbody></table></div>
          </section>

          <section className="mt-6 rounded-2xl border border-white/10 bg-card p-5 sm:p-7">
            <h2 className="text-lg font-semibold">Affectation des commissaires</h2>
            {users.length===0?<p className="mt-3 text-sm text-white/55">Aucun compte utilisateur actif n'est disponible. Les comptes pourront être affectés après leur création.</p>:(
              <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
                <select className={field} value={selectedDistrictId} onChange={e=>setSelectedDistrictId(e.target.value)}>{districts.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}</select>
                <select className={field} value={assignUserId} onChange={e=>setAssignUserId(e.target.value)}><option value="">Choisir un compte</option>{users.map(u=><option key={u.id} value={u.id}>{u.email}</option>)}</select>
                <button disabled={saving||!assignUserId} onClick={assignCommissioner} className="inline-flex items-center justify-center gap-2 rounded-full bg-scout-green px-5 py-2.5 text-sm font-semibold text-scout-deep"><UserPlus className="size-4"/>Affecter</button>
              </div>
            )}
            <div className="mt-5 space-y-2">{assignments.map(a=><div key={a.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-3 text-sm"><div>{users.find(u=>u.id===a.user_id)?.email||"Compte utilisateur"}<p className="text-xs text-white/45">{districts.find(d=>d.id===a.district_id)?.name||"District"}</p></div><span className={a.status==="active"?"text-xs text-scout-green":"text-xs text-white/45"}>{a.status==="active"?"Affectation active":"Ancienne affectation"}</span></div>)}</div>
          </section>

          <section className="mt-6 space-y-4">
            <h2 className="text-lg font-semibold">Propositions à examiner</h2>
            {pending.length===0?<div className="rounded-2xl border border-white/10 bg-card p-6 text-sm text-white/55">Aucune proposition en attente.</div>:pending.map(p=><article key={p.id} className="rounded-2xl border border-white/10 bg-card p-5">
              <div className="flex flex-wrap justify-between gap-2"><div><p className="text-xs uppercase tracking-wider text-scout-green">{p.change_type.replaceAll("_"," ")}</p><p className="mt-1 font-semibold">{districts.find(d=>d.id===p.district_id)?.name||"District"}</p><p className="text-xs text-white/45">{new Date(p.created_at).toLocaleString("fr-FR")}</p></div><span className="text-xs text-white/60">{p.status}</span></div>
              <div className="mt-4 grid gap-3 md:grid-cols-2"><div className="rounded-xl bg-scout-deep p-3"><p className="text-xs text-white/45">Avant</p><pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap break-words text-xs text-white/65">{JSON.stringify(p.previous_data||{},null,2)}</pre></div><div className="rounded-xl bg-scout-deep p-3"><p className="text-xs text-white/45">Proposition</p><pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap break-words text-xs text-white/65">{JSON.stringify(p.proposed_data||{},null,2)}</pre></div></div>
              <label className={label+" mt-4"}>Note<textarea rows={2} className={field} value={notes[p.id]||""} onChange={e=>setNotes({...notes,[p.id]:e.target.value})}/></label>
              <div className="mt-4 flex flex-wrap justify-end gap-2"><button disabled={saving} onClick={()=>review(p,"request_revision")} className="rounded-full border border-white/15 px-4 py-2 text-xs text-white/70">Demander une correction</button><button disabled={saving} onClick={()=>review(p,"reject")} className="inline-flex items-center gap-1 rounded-full border border-red-400/30 px-4 py-2 text-xs text-red-300"><X className="size-3.5"/>Rejeter</button><button disabled={saving} onClick={()=>review(p,"approve")} className="inline-flex items-center gap-1 rounded-full bg-scout-green px-4 py-2 text-xs font-semibold text-scout-deep"><Check className="size-3.5"/>Approuver</button></div>
            </article>)}
          </section>

          <section className="mt-6 rounded-2xl border border-white/10 bg-card p-5 sm:p-7">
            <h2 className="text-lg font-semibold">Journal d'audit des districts</h2>
            <p className="mt-1 text-xs text-white/45">Les affectations, propositions, validations et modifications sont conservées ici.</p>
            <div className="mt-4 space-y-3">
              {logs.map(log=><div key={log.id} className="rounded-xl border border-white/10 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium">{log.action.replaceAll("_"," ")}</p>
                  <time className="text-xs text-white/45">{new Date(log.created_at).toLocaleString("fr-FR")}</time>
                </div>
                <p className="mt-1 text-xs text-white/55">{districts.find(d=>d.id===log.district_id)?.name||"District"} · {log.entity_type} · {log.actor_id||"Système"}</p>
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs text-scout-green">Détails de l'opération</summary>
                  <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-scout-deep p-3 text-[11px] text-white/60">{JSON.stringify(log.details||{},null,2)}</pre>
                </details>
              </div>)}
              {logs.length===0&&<p className="text-sm text-white/50">Aucune opération enregistrée pour le moment.</p>}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
