export type DistrictActivity = {
  id: string;
  districtSlug: string;
  districtName: string;
  title: string;
  date: string;
  time?: string;
  location: string;
  description: string;
  image?: string;
};

export const DISTRICT_ACTIVITIES: DistrictActivity[] = [
  {
    id: "lubero-assainissement-kavetya-2026-11-20",
    districtSlug: "lubero",
    districtName: "District Scout de Lubero",
    title: "Assainissement de la structure sanitaire de Kavetya",
    date: "2026-11-20",
    location: "Commune de Lubero",
    description: "La Troupe Éléphant Dynamique et le Groupe Scout Notre-Dame de Bon Secours de Vuhali prennent part à une activité d’assainissement de la structure sanitaire de Kavetya.",
  },
  {
    id: "nyiragongo-marche-sante-2026-11-29",
    districtSlug: "nyiragongo",
    districtName: "District Scout de Nyiragongo",
    title: "Marche de Santé – 10 000 Pas",
    date: "2026-11-29",
    time: "07 h 00",
    location: "Départ : EP BYAHI · Arrivée : Children Voice Kibati",
    description: "Le District Scout de Nyiragongo organise cette marche de santé avec Health Fitness Coaching (HFC). Rendez-vous à 7 h 00.",
  },
  {
    id: "goma-atelier-charte-fesco-2026-10-25",
    districtSlug: "goma",
    districtName: "District Scout Ville de Goma",
    title: "Atelier de vulgarisation de la charte graphique FESCO et d’innovation scoute",
    date: "2026-10-25",
    time: "11 h 00 – 13 h 00",
    location: "Siège de l’ASNK",
    description: "Un atelier consacré à la vulgarisation de la charte graphique FESCO et à l’innovation scoute.",
  },
  {
    id: "goma-agenda-2026-11-29",
    districtSlug: "goma",
    districtName: "District Scout Ville de Goma",
    title: "À vos agendas, Scouts de Goma !",
    date: "2026-11-29",
    location: "Chez les Pallottins",
    description: "Le District Scout Ville de Goma annonce un rendez-vous pour les scouts le 29 novembre 2026. Les précisions sur la nature de l’activité seront communiquées ultérieurement.",
  },
];

export function formatActivityDate(date: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date + "T12:00:00"));
}
