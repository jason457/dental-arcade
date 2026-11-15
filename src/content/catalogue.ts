/**
 * Curriculum catalogue: specialty → procedure.
 * This is the full planned library. An entry here is a plan, not a lesson.
 * Only entries marked "demo" or "published" have playable content, and only "published"
 * content has been approved by a clinician.
 */
import type { CatalogueStatus } from "@/engines/types";

export interface ProcedureEntry {
  slug: string;
  name: string;
  status: CatalogueStatus;
  /** Case slug when a playable case exists. */
  caseSlug?: string;
}
export interface SpecialtyEntry {
  slug: string;
  name: string;
  crossSpecialty?: boolean;
  procedures: ProcedureEntry[];
}
const p = (name: string, slug: string, status: CatalogueStatus = "planned", caseSlug?: string): ProcedureEntry => ({ slug, name, status, caseSlug });

export const CATALOGUE: SpecialtyEntry[] = [
  {
    slug: "oral-and-maxillofacial-surgery",
    name: "Oral and maxillofacial surgery",
    procedures: [
      p("Simple extraction", "simple-extraction", "demo", "simple-extraction-46"),
      p("Surgical extraction", "surgical-extraction"),
      p("Impacted third molars", "impacted-third-molars"),
      p("Impacted canine exposure", "impacted-canine-exposure"),
      p("Supernumerary teeth", "supernumerary-teeth"),
      p("Retained roots", "retained-roots"),
      p("Flap design", "flap-design"),
      p("Bone removal concepts", "bone-removal-concepts"),
      p("Tooth sectioning", "tooth-sectioning"),
      p("Suturing techniques", "suturing-techniques"),
      p("Wound closure", "wound-closure"),
      p("Biopsy", "biopsy"),
      p("Frenectomy", "frenectomy"),
      p("Cyst management", "cyst-management"),
      p("Odontogenic infections", "odontogenic-infections"),
      p("Fascial space infections", "fascial-space-infections"),
      p("Mandibular fractures", "mandibular-fractures"),
      p("Midface fractures", "midface-fractures"),
      p("Facial trauma assessment", "facial-trauma-assessment"),
      p("ORIF", "orif"),
      p("Plate and screw fixation planning", "plate-and-screw-fixation-planning"),
      p("Arch bars", "arch-bars"),
      p("Maxillomandibular fixation", "maxillomandibular-fixation"),
      p("Orthognathic surgery", "orthognathic-surgery"),
      p("Le Fort I", "le-fort-i"),
      p("BSSO", "bsso"),
      p("Genioplasty", "genioplasty"),
      p("Implant surgery", "implant-surgery"),
      p("TMJ disorders", "tmj-disorders"),
      p("Reconstructive surgery", "reconstructive-surgery"),
    ],
  },
  {
    slug: "endodontics",
    name: "Endodontics",
    procedures: [
      p("Pulp diagnosis", "pulp-diagnosis"),
      p("Periapical diagnosis", "periapical-diagnosis"),
      p("Access cavity", "access-cavity"),
      p("Canal location", "canal-location"),
      p("Working length determination", "working-length-determination"),
      p("Cleaning and shaping", "cleaning-and-shaping"),
      p("Irrigation", "irrigation"),
      p("Obturation", "obturation"),
      p("Retreatment", "retreatment"),
      p("Calcified canals", "calcified-canals"),
      p("MB2 identification", "mb2-identification"),
      p("Instrument separation", "instrument-separation"),
      p("Perforation", "perforation"),
      p("Ledge formation", "ledge-formation"),
      p("Apical transportation", "apical-transportation"),
      p("Endodontic microsurgery", "endodontic-microsurgery"),
      p("Apicoectomy", "apicoectomy"),
      p("Dental trauma", "dental-trauma"),
      p("Apexification", "apexification"),
      p("Regenerative endodontics", "regenerative-endodontics"),
    ],
  },
  {
    slug: "restorative-dentistry",
    name: "Restorative dentistry",
    procedures: [
      p("Caries assessment", "caries-assessment"),
      p("Class I to VI restorations", "class-i-to-vi-restorations"),
      p("Composite restoration", "composite-restoration"),
      p("Amalgam restoration principles", "amalgam-restoration-principles"),
      p("Matrix systems", "matrix-systems"),
      p("Rubber dam isolation", "rubber-dam-isolation"),
      p("Adhesive dentistry", "adhesive-dentistry"),
      p("Deep caries management", "deep-caries-management"),
      p("Pulp preservation", "pulp-preservation"),
      p("Anterior aesthetic restoration", "anterior-aesthetic-restoration"),
      p("Posterior restoration", "posterior-restoration"),
      p("Direct veneers", "direct-veneers"),
      p("Inlays", "inlays"),
      p("Onlays", "onlays"),
      p("Tooth wear", "tooth-wear"),
      p("Restoration failure", "restoration-failure"),
      p("CAD/CAM restorative workflows", "cad-cam-restorative-workflows"),
    ],
  },
  {
    slug: "prosthodontics",
    name: "Prosthodontics",
    procedures: [
      p("Complete dentures", "complete-dentures"),
      p("Partial dentures", "partial-dentures"),
      p("RPD surveying", "rpd-surveying"),
      p("RPD design", "rpd-design"),
      p("Crown preparation", "crown-preparation"),
      p("Bridge preparation", "bridge-preparation"),
      p("Impression techniques", "impression-techniques"),
      p("Jaw relation", "jaw-relation"),
      p("Occlusion", "occlusion"),
      p("Vertical dimension", "vertical-dimension"),
      p("Try-in procedures", "try-in-procedures"),
      p("Denture insertion", "denture-insertion"),
      p("Implant prosthodontics", "implant-prosthodontics"),
      p("Full mouth rehabilitation", "full-mouth-rehabilitation"),
      p("Digital prosthodontics", "digital-prosthodontics"),
      p("Prosthetic complications", "prosthetic-complications"),
    ],
  },
  {
    slug: "periodontology",
    name: "Periodontology",
    procedures: [
      p("Periodontal examination", "periodontal-examination"),
      p("Periodontal charting", "periodontal-charting"),
      p("Staging and grading", "staging-and-grading"),
      p("Scaling", "scaling"),
      p("Root surface debridement", "root-surface-debridement"),
      p("Periodontal maintenance", "periodontal-maintenance"),
      p("Flap surgery", "flap-surgery"),
      p("Regenerative periodontal procedures", "regenerative-periodontal-procedures"),
      p("Mucogingival surgery", "mucogingival-surgery"),
      p("Gingival recession", "gingival-recession"),
      p("Crown lengthening", "crown-lengthening"),
      p("Peri-implant diseases", "peri-implant-diseases"),
      p("Periodontal complications", "periodontal-complications"),
    ],
  },
  {
    slug: "paediatric-dentistry",
    name: "Paediatric dentistry",
    procedures: [
      p("Behaviour management", "behaviour-management"),
      p("Caries prevention", "caries-prevention"),
      p("Fluoride application", "fluoride-application"),
      p("Fissure sealants", "fissure-sealants"),
      p("Primary tooth restoration", "primary-tooth-restoration"),
      p("Stainless steel crowns", "stainless-steel-crowns"),
      p("Pulpotomy", "pulpotomy"),
      p("Pulpectomy", "pulpectomy"),
      p("Space maintainers", "space-maintainers"),
      p("Early childhood caries", "early-childhood-caries"),
      p("Paediatric dental trauma", "paediatric-dental-trauma"),
      p("Special care considerations", "special-care-considerations"),
    ],
  },
  {
    slug: "orthodontics",
    name: "Orthodontics",
    procedures: [
      p("Orthodontic diagnosis", "orthodontic-diagnosis"),
      p("Cephalometric analysis", "cephalometric-analysis"),
      p("Malocclusion assessment", "malocclusion-assessment"),
      p("Treatment planning", "treatment-planning"),
      p("Fixed appliances", "fixed-appliances"),
      p("Bracket positioning", "bracket-positioning"),
      p("Archwire concepts", "archwire-concepts"),
      p("Removable appliances", "removable-appliances"),
      p("Clear aligners", "clear-aligners"),
      p("Impacted canine management", "impacted-canine-management"),
      p("Anchorage", "anchorage"),
      p("Temporary anchorage devices", "temporary-anchorage-devices"),
      p("Orthodontic complications", "orthodontic-complications"),
      p("Retention and relapse", "retention-and-relapse"),
    ],
  },
  {
    slug: "oral-medicine-and-pathology",
    name: "Oral medicine and pathology",
    procedures: [
      p("Oral lesion recognition", "oral-lesion-recognition"),
      p("Differential diagnosis", "differential-diagnosis"),
      p("Oral potentially malignant disorders", "oral-potentially-malignant-disorders"),
      p("Oral cancer warning signs", "oral-cancer-warning-signs"),
      p("Salivary gland disorders", "salivary-gland-disorders"),
      p("Orofacial pain", "orofacial-pain"),
      p("Temporomandibular disorders", "temporomandibular-disorders"),
      p("Biopsy decisions", "biopsy-decisions"),
      p("Pathology referral", "pathology-referral"),
    ],
  },
  {
    slug: "oral-and-maxillofacial-radiology",
    name: "Oral and maxillofacial radiology",
    procedures: [
      p("Periapical radiographs", "periapical-radiographs"),
      p("Bitewing radiographs", "bitewing-radiographs"),
      p("Panoramic radiographs", "panoramic-radiographs"),
      p("CBCT interpretation", "cbct-interpretation"),
      p("Anatomical landmark identification", "anatomical-landmark-identification"),
      p("Pathology recognition", "pathology-recognition"),
      p("Radiographic errors", "radiographic-errors"),
      p("Radiation protection", "radiation-protection"),
    ],
  },
  {
    slug: "special-care-and-emergencies",
    name: "Special care and emergencies",
    procedures: [
      p("Medically compromised patients", "medically-compromised-patients"),
      p("Diabetes", "diabetes"),
      p("Anticoagulant considerations", "anticoagulant-considerations"),
      p("Pregnancy", "pregnancy"),
      p("Disability and accessibility", "disability-and-accessibility"),
      p("Dental anxiety", "dental-anxiety"),
      p("Syncope", "syncope"),
      p("Anaphylaxis", "anaphylaxis"),
      p("Hypoglycaemia", "hypoglycaemia"),
      p("Basic life support", "basic-life-support"),
      p("Emergency recognition and escalation", "emergency-recognition-and-escalation"),
    ],
  },
  {
    slug: "cross-specialty",
    name: "Cross-specialty",
    crossSpecialty: true,
    procedures: [
      p("Local anaesthesia", "local-anaesthesia"),
      p("Pharmacology", "pharmacology"),
      p("Infection control", "infection-control"),
      p("Dental materials", "dental-materials"),
      p("Consent", "consent"),
      p("Ethics", "ethics"),
      p("Patient communication", "patient-communication"),
    ],
  },
];

export const allProcedures = () => CATALOGUE.flatMap((s) => s.procedures.map((proc) => ({ ...proc, specialty: s.slug })));
export const findProcedure = (slug: string) => allProcedures().find((x) => x.slug === slug);
export const catalogueCounts = () => {
  const all = allProcedures();
  return { specialties: CATALOGUE.length, procedures: all.length, demo: all.filter((x) => x.status === "demo").length, published: all.filter((x) => x.status === "published").length };
};
