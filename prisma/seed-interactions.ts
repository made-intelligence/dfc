import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ============================================
// 1. THERAPEUTIC CLASS HIERARCHY
// ============================================

const therapeuticClassHierarchy: Record<string, string[]> = {
  Cardiovascular: [
    "ACE Inhibitors", "ARBs", "Beta-Blockers", "Calcium Channel Blockers",
    "Diuretics (Loop)", "Diuretics (Thiazide)", "Diuretics (K-sparing)",
    "Statins", "Antiplatelets", "Anticoagulants", "Antiarrhythmics",
    "Nitrates", "Centrally-acting Antihypertensives",
  ],
  "Anti-infective": [
    "Penicillins", "Cephalosporins", "Macrolides", "Fluoroquinolones",
    "Aminoglycosides", "Carbapenems", "Tetracyclines", "Nitroimidazoles",
    "Sulfonamides", "Antifungals (Azoles)", "Antifungals (Polyenes)",
    "Antivirals", "Antiretrovirals", "Anti-TB", "Antimalarials", "Antiparasitics",
  ],
  Endocrine: [
    "Oral Hypoglycaemics (Biguanides)", "Oral Hypoglycaemics (Sulfonylureas)",
    "Insulins", "SGLT2 Inhibitors", "DPP-4 Inhibitors",
    "Thyroid Hormones", "Antithyroid", "Corticosteroids",
  ],
  CNS: [
    "Antidepressants (SSRIs)", "Antidepressants (TCAs)",
    "Antipsychotics (Typical)", "Antipsychotics (Atypical)",
    "Benzodiazepines", "Anticonvulsants", "Opioid Analgesics",
    "Non-opioid Analgesics", "NSAIDs", "Antiparkinson",
  ],
  Respiratory: [
    "Bronchodilators (SABA)", "Bronchodilators (LABA)",
    "Inhaled Corticosteroids", "Anticholinergics",
    "Leukotriene Antagonists", "Mucolytics", "Antitussives",
  ],
  GI: [
    "PPIs", "H2 Blockers", "Antiemetics", "Antispasmodics",
    "Laxatives", "Antidiarrhoeals",
  ],
  Oncology: [
    "Alkylating Agents", "Antimetabolites", "Anthracyclines",
    "Vinca Alkaloids", "Hormonal (Anti-oestrogen)", "Targeted Therapy",
  ],
  Obstetrics: ["Oxytocics", "Tocolytics", "Contraceptives"],
  Blood: [
    "Haematinics", "Anticoagulants (Oral)", "Anticoagulants (Parenteral)",
    "Antifibrinolytics",
  ],
  Immunology: ["Immunosuppressants", "Vaccines", "Immunoglobulins"],
};

// ============================================
// 2. DRUG-DRUG INTERACTIONS
// ============================================

interface InteractionSeed {
  drugA: string;
  drugB: string;
  severity: string;
  mechanism: string;
  clinicalEffect: string;
  management: string;
  evidence: string;
  source: string;
}

const interactions: InteractionSeed[] = [
  // ========== CRITICAL INTERACTIONS ==========

  // Warfarin interactions
  {
    drugA: "Warfarin", drugB: "Metronidazole", severity: "CRITICAL",
    mechanism: "CYP2C9 inhibition by metronidazole reduces warfarin metabolism",
    clinicalEffect: "Significantly elevated INR with high risk of major haemorrhage",
    management: "Avoid combination. If essential, reduce warfarin dose by 25-50% and monitor INR every 2-3 days",
    evidence: "ESTABLISHED", source: "BNF, Lexicomp",
  },
  {
    drugA: "Warfarin", drugB: "Ciprofloxacin", severity: "CRITICAL",
    mechanism: "CYP1A2 inhibition by ciprofloxacin and disruption of gut flora reducing vitamin K synthesis",
    clinicalEffect: "Markedly increased INR with risk of serious bleeding",
    management: "Avoid combination. Use alternative antibiotic. If unavoidable, monitor INR within 3 days and adjust warfarin dose",
    evidence: "ESTABLISHED", source: "BNF, UpToDate",
  },
  {
    drugA: "Warfarin", drugB: "Co-trimoxazole", severity: "CRITICAL",
    mechanism: "CYP2C9 inhibition by sulfamethoxazole potentiates warfarin anticoagulant effect",
    clinicalEffect: "Dangerously elevated INR with risk of life-threatening haemorrhage",
    management: "Avoid combination. If essential, reduce warfarin dose by 50% and monitor INR every 2 days",
    evidence: "ESTABLISHED", source: "BNF, Lexicomp, ISMP",
  },
  {
    drugA: "Warfarin", drugB: "Fluconazole", severity: "CRITICAL",
    mechanism: "CYP2C9 inhibition by fluconazole significantly reduces warfarin metabolism",
    clinicalEffect: "Markedly elevated INR with risk of major bleeding",
    management: "Avoid combination or reduce warfarin dose by 50%. Monitor INR closely at 3-5 day intervals",
    evidence: "ESTABLISHED", source: "BNF, Lexicomp",
  },

  // Methotrexate interactions
  {
    drugA: "Methotrexate", drugB: "Co-trimoxazole", severity: "CRITICAL",
    mechanism: "Co-trimoxazole reduces renal clearance of methotrexate and both drugs are folate antagonists (additive antifolate effect)",
    clinicalEffect: "Severe pancytopenia, mucositis, and potentially fatal bone marrow suppression",
    management: "Combination is CONTRAINDICATED. Use alternative antibiotic",
    evidence: "ESTABLISHED", source: "BNF, Lexicomp, ISMP",
  },
  {
    drugA: "Methotrexate", drugB: "Ibuprofen", severity: "CRITICAL",
    mechanism: "NSAIDs reduce renal clearance of methotrexate by decreasing renal blood flow",
    clinicalEffect: "Methotrexate toxicity: pancytopenia, mucositis, hepatotoxicity, renal failure",
    management: "Avoid NSAIDs with high-dose methotrexate. With low-dose weekly methotrexate, use with extreme caution and monitor FBC/renal function",
    evidence: "ESTABLISHED", source: "BNF, UpToDate",
  },
  {
    drugA: "Methotrexate", drugB: "Diclofenac", severity: "CRITICAL",
    mechanism: "NSAIDs reduce renal clearance of methotrexate by decreasing renal blood flow",
    clinicalEffect: "Methotrexate toxicity: pancytopenia, mucositis, hepatotoxicity, renal failure",
    management: "Avoid NSAIDs with high-dose methotrexate. With low-dose weekly MTX, use with extreme caution",
    evidence: "ESTABLISHED", source: "BNF, Lexicomp",
  },

  // ACE Inhibitor + potassium/spironolactone
  {
    drugA: "Lisinopril", drugB: "Potassium Chloride", severity: "CRITICAL",
    mechanism: "ACE inhibitors reduce aldosterone secretion, decreasing potassium excretion; additive hyperkalaemia with potassium supplementation",
    clinicalEffect: "Life-threatening hyperkalaemia with risk of cardiac arrhythmia and cardiac arrest",
    management: "Avoid combination unless documented hypokalaemia. If used, monitor serum potassium within 1 week and regularly thereafter",
    evidence: "ESTABLISHED", source: "BNF, UpToDate",
  },
  {
    drugA: "Enalapril", drugB: "Potassium Chloride", severity: "CRITICAL",
    mechanism: "ACE inhibitors reduce aldosterone, decreasing potassium excretion; additive with potassium supplements",
    clinicalEffect: "Life-threatening hyperkalaemia with cardiac arrhythmia risk",
    management: "Avoid unless hypokalaemia documented. Monitor K+ within 1 week",
    evidence: "ESTABLISHED", source: "BNF",
  },
  {
    drugA: "Lisinopril", drugB: "Spironolactone", severity: "CRITICAL",
    mechanism: "Both ACE inhibitors and spironolactone independently increase serum potassium (additive effect)",
    clinicalEffect: "Severe hyperkalaemia with risk of fatal cardiac arrhythmia, especially in renal impairment",
    management: "If combination essential (e.g. heart failure), use low-dose spironolactone (25mg), monitor K+ and renal function within 1 week and monthly",
    evidence: "ESTABLISHED", source: "BNF, NICE, UpToDate",
  },
  {
    drugA: "Enalapril", drugB: "Spironolactone", severity: "CRITICAL",
    mechanism: "Additive potassium retention via dual RAAS blockade and mineralocorticoid antagonism",
    clinicalEffect: "Severe hyperkalaemia with risk of cardiac arrest",
    management: "Use low-dose spironolactone only. Monitor K+ and creatinine closely",
    evidence: "ESTABLISHED", source: "BNF, UpToDate",
  },

  // Digoxin interactions
  {
    drugA: "Digoxin", drugB: "Amiodarone", severity: "CRITICAL",
    mechanism: "Amiodarone inhibits P-glycoprotein and renal tubular secretion of digoxin, increasing digoxin plasma concentration by 70-100%",
    clinicalEffect: "Digoxin toxicity: nausea, vomiting, visual disturbances, bradycardia, fatal arrhythmias",
    management: "Reduce digoxin dose by 50% when starting amiodarone. Monitor digoxin levels within 1 week. Target level 0.5-1.0 ng/mL",
    evidence: "ESTABLISHED", source: "BNF, Lexicomp, UpToDate",
  },
  {
    drugA: "Digoxin", drugB: "Furosemide", severity: "CRITICAL",
    mechanism: "Furosemide-induced hypokalaemia and hypomagnesaemia increase myocardial sensitivity to digoxin",
    clinicalEffect: "Digoxin toxicity even at therapeutic levels: fatal arrhythmias, heart block",
    management: "Monitor and maintain serum potassium >4.0 mmol/L and magnesium >0.8 mmol/L. Consider adding potassium-sparing diuretic",
    evidence: "ESTABLISHED", source: "BNF, UpToDate",
  },

  // Statin + macrolide
  {
    drugA: "Atorvastatin", drugB: "Clarithromycin", severity: "CRITICAL",
    mechanism: "CYP3A4 inhibition by clarithromycin markedly increases statin plasma concentration",
    clinicalEffect: "Rhabdomyolysis: muscle pain, weakness, dark urine, acute renal failure, potentially fatal",
    management: "Suspend statin during clarithromycin course. Use azithromycin as alternative (does not inhibit CYP3A4)",
    evidence: "ESTABLISHED", source: "BNF, FDA, Lexicomp",
  },

  // Carbamazepine interactions
  {
    drugA: "Carbamazepine", drugB: "Erythromycin", severity: "CRITICAL",
    mechanism: "CYP3A4 inhibition by erythromycin reduces carbamazepine metabolism",
    clinicalEffect: "Carbamazepine toxicity: diplopia, ataxia, nystagmus, drowsiness, seizures, cardiac arrhythmias",
    management: "Avoid combination. Use azithromycin as macrolide alternative. If unavoidable, reduce carbamazepine dose and monitor levels",
    evidence: "ESTABLISHED", source: "BNF, Lexicomp",
  },
  {
    drugA: "Carbamazepine", drugB: "Clarithromycin", severity: "CRITICAL",
    mechanism: "CYP3A4 inhibition by clarithromycin reduces carbamazepine metabolism",
    clinicalEffect: "Carbamazepine toxicity: ataxia, diplopia, drowsiness, cardiac conduction abnormalities",
    management: "Avoid combination. Use azithromycin as alternative macrolide",
    evidence: "ESTABLISHED", source: "BNF, Lexicomp",
  },

  // Cisplatin + aminoglycoside
  {
    drugA: "Cisplatin", drugB: "Gentamicin", severity: "CRITICAL",
    mechanism: "Additive nephrotoxicity and ototoxicity — both drugs are independently nephrotoxic and ototoxic",
    clinicalEffect: "Irreversible sensorineural hearing loss, acute kidney injury, potentially permanent renal failure",
    management: "Avoid combination. If essential, ensure adequate hydration, monitor audiometry, renal function and aminoglycoside levels",
    evidence: "ESTABLISHED", source: "BNF, Lexicomp, UpToDate",
  },

  // Lithium interactions
  {
    drugA: "Lithium Carbonate", drugB: "Ibuprofen", severity: "CRITICAL",
    mechanism: "NSAIDs reduce renal prostaglandin synthesis, decreasing lithium renal clearance by 15-25%",
    clinicalEffect: "Lithium toxicity: tremor, ataxia, confusion, seizures, renal failure, potentially fatal",
    management: "Avoid NSAIDs. Use paracetamol for analgesia. If NSAID essential, monitor lithium levels within 5 days and adjust dose",
    evidence: "ESTABLISHED", source: "BNF, Lexicomp, UpToDate",
  },
  {
    drugA: "Lithium Carbonate", drugB: "Diclofenac", severity: "CRITICAL",
    mechanism: "NSAIDs reduce renal prostaglandin synthesis, decreasing lithium clearance",
    clinicalEffect: "Lithium toxicity: coarse tremor, confusion, seizures, renal failure",
    management: "Avoid combination. Use paracetamol. If unavoidable, monitor lithium levels within 5 days",
    evidence: "ESTABLISHED", source: "BNF, UpToDate",
  },
  {
    drugA: "Lithium Carbonate", drugB: "Lisinopril", severity: "CRITICAL",
    mechanism: "ACE inhibitors reduce renal lithium clearance by decreasing GFR and enhancing proximal tubular reabsorption",
    clinicalEffect: "Lithium toxicity: tremor, ataxia, confusion, seizures, renal failure",
    management: "If combination essential, reduce lithium dose and monitor levels within 1 week. Monitor renal function",
    evidence: "ESTABLISHED", source: "BNF, UpToDate",
  },
  {
    drugA: "Lithium Carbonate", drugB: "Enalapril", severity: "CRITICAL",
    mechanism: "ACE inhibitors reduce GFR and enhance proximal tubular reabsorption of lithium",
    clinicalEffect: "Lithium toxicity with risk of permanent neurological damage",
    management: "Monitor lithium levels within 1 week of starting/changing ACE inhibitor dose. Adjust lithium dose accordingly",
    evidence: "ESTABLISHED", source: "BNF, Lexicomp",
  },

  // Ergometrine interactions
  {
    drugA: "Ergometrine", drugB: "Erythromycin", severity: "CRITICAL",
    mechanism: "CYP3A4 inhibition by erythromycin increases ergot alkaloid levels",
    clinicalEffect: "Severe peripheral vasospasm, gangrene of extremities",
    management: "Combination is CONTRAINDICATED. Use alternative uterotonic (oxytocin) or alternative antibiotic",
    evidence: "ESTABLISHED", source: "BNF, Lexicomp",
  },

  // QT-prolonging combinations
  {
    drugA: "Haloperidol", drugB: "Amiodarone", severity: "CRITICAL",
    mechanism: "Additive QT interval prolongation — both drugs independently prolong the QT interval via potassium channel blockade",
    clinicalEffect: "Torsades de Pointes (polymorphic ventricular tachycardia), cardiac arrest, sudden death",
    management: "Avoid combination. If essential, obtain baseline ECG, monitor QTc, maintain K+ >4.0 and Mg2+ >0.8",
    evidence: "ESTABLISHED", source: "CredibleMeds, BNF, UpToDate",
  },
  {
    drugA: "Chlorpromazine", drugB: "Ondansetron", severity: "CRITICAL",
    mechanism: "Additive QT prolongation — both drugs block hERG potassium channels",
    clinicalEffect: "Torsades de Pointes, ventricular arrhythmia, sudden cardiac death",
    management: "Avoid combination. Use metoclopramide as antiemetic alternative. If unavoidable, obtain ECG and monitor QTc",
    evidence: "ESTABLISHED", source: "CredibleMeds, BNF",
  },
  {
    drugA: "Ciprofloxacin", drugB: "Haloperidol", severity: "CRITICAL",
    mechanism: "Additive QT prolongation from both agents",
    clinicalEffect: "Torsades de Pointes, cardiac arrest",
    management: "Avoid combination. Use alternative antibiotic (e.g. amoxicillin-clavulanate) or alternative antipsychotic",
    evidence: "ESTABLISHED", source: "CredibleMeds, BNF",
  },

  // Serotonin syndrome
  {
    drugA: "Fluoxetine", drugB: "Tramadol", severity: "CRITICAL",
    mechanism: "Both drugs increase serotonin activity — SSRI inhibits serotonin reuptake, tramadol inhibits serotonin reuptake and enhances release",
    clinicalEffect: "Serotonin syndrome: hyperthermia, rigidity, myoclonus, autonomic instability, seizures, potentially fatal",
    management: "Avoid combination. Use alternative analgesic (paracetamol, NSAIDs, or non-serotonergic opioid). If unavoidable, start tramadol at low dose and monitor",
    evidence: "ESTABLISHED", source: "BNF, FDA, UpToDate",
  },
  {
    drugA: "Sertraline", drugB: "Tramadol", severity: "CRITICAL",
    mechanism: "Additive serotonergic effects — dual serotonin reuptake inhibition plus tramadol serotonin release",
    clinicalEffect: "Serotonin syndrome: agitation, hyperthermia, clonus, diaphoresis, seizures",
    management: "Avoid combination. Use non-serotonergic analgesic alternatives",
    evidence: "ESTABLISHED", source: "BNF, UpToDate",
  },

  // Additional CRITICAL
  {
    drugA: "Warfarin", drugB: "Rifampicin", severity: "CRITICAL",
    mechanism: "Rifampicin is a potent CYP2C9 and CYP3A4 inducer, dramatically increasing warfarin metabolism",
    clinicalEffect: "Profound reduction in INR rendering anticoagulation ineffective; risk of thromboembolism. Rebound over-anticoagulation when rifampicin stopped",
    management: "Avoid combination if possible. If essential, increase warfarin dose (often 2-3x) and monitor INR twice weekly during and 2 weeks after rifampicin",
    evidence: "ESTABLISHED", source: "BNF, Lexicomp",
  },
  {
    drugA: "Methotrexate", drugB: "Piroxicam", severity: "CRITICAL",
    mechanism: "NSAIDs reduce renal clearance of methotrexate",
    clinicalEffect: "Methotrexate toxicity: severe pancytopenia, mucositis, organ damage",
    management: "Avoid combination with high-dose methotrexate. Extreme caution with low-dose",
    evidence: "ESTABLISHED", source: "BNF, Lexicomp",
  },

  // ========== MAJOR INTERACTIONS ==========

  // Warfarin + aspirin
  {
    drugA: "Warfarin", drugB: "Aspirin", severity: "MAJOR",
    mechanism: "Aspirin inhibits platelet aggregation and may cause GI mucosal erosion, compounding warfarin's anticoagulant effect",
    clinicalEffect: "Significantly increased risk of major bleeding, especially GI haemorrhage",
    management: "Avoid unless specific indication (e.g. mechanical heart valve). If used, add PPI gastroprotection. Monitor INR closely",
    evidence: "ESTABLISHED", source: "BNF, NICE, UpToDate",
  },
  {
    drugA: "Warfarin", drugB: "Paracetamol (Acetaminophen)", severity: "MAJOR",
    mechanism: "Paracetamol at doses >2g/day inhibits vitamin K-dependent clotting factor synthesis (VKORC1 pathway interference)",
    clinicalEffect: "Increased INR and risk of bleeding, particularly with regular high-dose paracetamol (>2g/day for >3 days)",
    management: "Use paracetamol at lowest effective dose (<2g/day). Monitor INR if regular paracetamol use >1 week",
    evidence: "PROBABLE", source: "BNF, UpToDate",
  },

  // ACE + ARB dual blockade
  {
    drugA: "Lisinopril", drugB: "Losartan", severity: "MAJOR",
    mechanism: "Dual RAAS blockade causes excessive reduction in angiotensin II activity",
    clinicalEffect: "Hyperkalaemia, acute kidney injury, hypotension. ONTARGET trial showed increased harm with no benefit",
    management: "Combination is NOT recommended. Use one agent only. If unavoidable (specialist only), monitor K+ and renal function weekly",
    evidence: "ESTABLISHED", source: "BNF, NICE, ONTARGET trial",
  },
  {
    drugA: "Enalapril", drugB: "Losartan", severity: "MAJOR",
    mechanism: "Dual RAAS blockade with additive hyperkalaemia and nephrotoxicity",
    clinicalEffect: "Hyperkalaemia, acute renal failure, symptomatic hypotension",
    management: "Avoid dual RAAS blockade. Use single agent",
    evidence: "ESTABLISHED", source: "BNF, NICE",
  },

  // Beta-blocker + calcium channel blocker (rate-limiting)
  {
    drugA: "Atenolol", drugB: "Nifedipine", severity: "MAJOR",
    mechanism: "Additive negative chronotropic and inotropic effects. Verapamil/diltiazem increase beta-blocker levels via CYP inhibition",
    clinicalEffect: "Severe bradycardia, heart block, hypotension, heart failure",
    management: "Nifedipine (dihydropyridine) with beta-blocker is generally safe. Avoid verapamil/diltiazem with beta-blockers",
    evidence: "ESTABLISHED", source: "BNF, UpToDate",
  },
  {
    drugA: "Propranolol", drugB: "Nifedipine", severity: "MAJOR",
    mechanism: "Additive negative inotropic effects; nifedipine (DHP) generally safer than non-DHP CCBs with beta-blockers",
    clinicalEffect: "Hypotension, bradycardia. Less risk than with verapamil/diltiazem",
    management: "Can be used together with caution. Monitor heart rate and blood pressure. Avoid if LVEF <40%",
    evidence: "ESTABLISHED", source: "BNF",
  },

  // Clopidogrel + omeprazole
  {
    drugA: "Clopidogrel", drugB: "Omeprazole", severity: "MAJOR",
    mechanism: "CYP2C19 inhibition by omeprazole reduces conversion of clopidogrel prodrug to active metabolite",
    clinicalEffect: "Reduced antiplatelet effect of clopidogrel, increased risk of cardiovascular events (stent thrombosis)",
    management: "Use pantoprazole or rabeprazole instead (minimal CYP2C19 inhibition). Avoid omeprazole and esomeprazole",
    evidence: "ESTABLISHED", source: "FDA, BNF, UpToDate",
  },

  // Phenytoin interactions
  {
    drugA: "Phenytoin", drugB: "Fluconazole", severity: "MAJOR",
    mechanism: "CYP2C9 and CYP2C19 inhibition by fluconazole reduces phenytoin metabolism",
    clinicalEffect: "Phenytoin toxicity: nystagmus, ataxia, lethargy, seizure paradox, cardiac arrhythmias",
    management: "Monitor phenytoin levels. Reduce phenytoin dose by 25-50%. Consider alternative antifungal",
    evidence: "ESTABLISHED", source: "BNF, Lexicomp",
  },
  {
    drugA: "Phenytoin", drugB: "Carbamazepine", severity: "MAJOR",
    mechanism: "Mutual CYP3A4 enzyme induction — each drug increases metabolism of the other",
    clinicalEffect: "Reduced levels of both drugs leading to breakthrough seizures. Unpredictable pharmacokinetics",
    management: "Monitor levels of both drugs. Adjust doses based on clinical response and drug levels",
    evidence: "ESTABLISHED", source: "BNF, UpToDate",
  },

  // Rifampicin interactions (potent CYP3A4 inducer)
  {
    drugA: "Rifampicin", drugB: "Combined Oral Contraceptive", severity: "MAJOR",
    mechanism: "Potent CYP3A4 induction by rifampicin dramatically increases oestrogen/progestogen metabolism",
    clinicalEffect: "Contraceptive failure and unintended pregnancy",
    management: "Use alternative contraception (DMPA injection, copper IUD, or condoms). Combined OCP is NOT reliable during and for 28 days after rifampicin",
    evidence: "ESTABLISHED", source: "BNF, WHO, FSRH",
  },
  {
    drugA: "Rifampicin", drugB: "Atorvastatin", severity: "MAJOR",
    mechanism: "CYP3A4 induction reduces atorvastatin plasma levels by up to 80%",
    clinicalEffect: "Loss of lipid-lowering effect, increased cardiovascular risk",
    management: "Increase statin dose or use rosuvastatin (less CYP3A4 dependent). Monitor lipid levels",
    evidence: "ESTABLISHED", source: "BNF, Lexicomp",
  },
  {
    drugA: "Rifampicin", drugB: "Amlodipine", severity: "MAJOR",
    mechanism: "CYP3A4 induction by rifampicin reduces amlodipine plasma levels",
    clinicalEffect: "Loss of blood pressure control",
    management: "Increase amlodipine dose or use alternative antihypertensive less affected by CYP3A4 induction (e.g. lisinopril)",
    evidence: "ESTABLISHED", source: "BNF, Lexicomp",
  },
  {
    drugA: "Rifampicin", drugB: "Dexamethasone", severity: "MAJOR",
    mechanism: "CYP3A4 induction by rifampicin increases dexamethasone metabolism",
    clinicalEffect: "Reduced corticosteroid efficacy, potential adrenal crisis in dependent patients",
    management: "Increase corticosteroid dose by 2-3x. Monitor clinical response. Consider prednisolone as alternative (less CYP3A4 dependent)",
    evidence: "ESTABLISHED", source: "BNF, Lexicomp",
  },
  {
    drugA: "Rifampicin", drugB: "Atazanavir/Ritonavir", severity: "MAJOR",
    mechanism: "Potent CYP3A4 induction reduces protease inhibitor levels by >90%",
    clinicalEffect: "HIV treatment failure, viral resistance development",
    management: "Combination is CONTRAINDICATED. Use rifabutin as alternative anti-TB drug with PI-based ART",
    evidence: "ESTABLISHED", source: "BNF, WHO HIV guidelines",
  },
  {
    drugA: "Rifampicin", drugB: "Lopinavir/Ritonavir", severity: "MAJOR",
    mechanism: "CYP3A4 induction by rifampicin reduces lopinavir levels by >75%",
    clinicalEffect: "HIV treatment failure and resistance",
    management: "Combination is CONTRAINDICATED. Use rifabutin with adjusted dose, or consider efavirenz-based regimen",
    evidence: "ESTABLISHED", source: "BNF, WHO",
  },
  {
    drugA: "Rifampicin", drugB: "Efavirenz", severity: "MAJOR",
    mechanism: "CYP2B6 induction by rifampicin moderately reduces efavirenz levels",
    clinicalEffect: "Reduced efavirenz efficacy, potential HIV treatment failure",
    management: "WHO recommends standard dose efavirenz 600mg. Some guidelines suggest increasing to 800mg if weight >60kg. Monitor viral load",
    evidence: "ESTABLISHED", source: "WHO, BNF",
  },

  // Chelation interactions
  {
    drugA: "Doxycycline", drugB: "Ferrous Sulphate + Folic Acid", severity: "MAJOR",
    mechanism: "Iron chelates with tetracyclines forming insoluble complexes in GI tract",
    clinicalEffect: "Reduced absorption of both doxycycline (up to 80-90% reduction) and iron",
    management: "Separate doses by at least 2-3 hours. Take doxycycline 1 hour before or 2 hours after iron",
    evidence: "ESTABLISHED", source: "BNF, Lexicomp",
  },
  {
    drugA: "Ciprofloxacin", drugB: "Ferrous Sulphate + Folic Acid", severity: "MAJOR",
    mechanism: "Iron chelates with fluoroquinolones forming insoluble complexes, preventing absorption",
    clinicalEffect: "Reduced ciprofloxacin absorption by 30-60%, risk of treatment failure",
    management: "Separate doses by at least 2 hours (ciprofloxacin 2h before or 6h after iron)",
    evidence: "ESTABLISHED", source: "BNF, Lexicomp",
  },
  {
    drugA: "Ciprofloxacin", drugB: "Calcium + Vitamin D", severity: "MAJOR",
    mechanism: "Calcium chelates with fluoroquinolones forming insoluble complexes",
    clinicalEffect: "Reduced ciprofloxacin absorption, risk of antibiotic treatment failure",
    management: "Separate doses by at least 2 hours",
    evidence: "ESTABLISHED", source: "BNF, Lexicomp",
  },
  {
    drugA: "Ciprofloxacin", drugB: "Magnesium Trisilicate", severity: "MAJOR",
    mechanism: "Antacid cations (Mg2+, Al3+) chelate with fluoroquinolones preventing GI absorption",
    clinicalEffect: "Markedly reduced ciprofloxacin absorption (up to 90%), treatment failure",
    management: "Separate doses by at least 2 hours (ciprofloxacin 2h before or 6h after antacid)",
    evidence: "ESTABLISHED", source: "BNF, Lexicomp",
  },
  {
    drugA: "Doxycycline", drugB: "Magnesium Trisilicate", severity: "MAJOR",
    mechanism: "Antacid cations chelate with tetracyclines forming insoluble complexes",
    clinicalEffect: "Reduced doxycycline absorption, risk of treatment failure",
    management: "Separate doses by at least 2-3 hours",
    evidence: "ESTABLISHED", source: "BNF",
  },
  {
    drugA: "Doxycycline", drugB: "Calcium + Vitamin D", severity: "MAJOR",
    mechanism: "Calcium chelates with tetracyclines forming insoluble complexes",
    clinicalEffect: "Reduced doxycycline absorption by 50% or more",
    management: "Separate doses by at least 2-3 hours",
    evidence: "ESTABLISHED", source: "BNF",
  },

  // Metformin
  {
    drugA: "Metformin", drugB: "Furosemide", severity: "MAJOR",
    mechanism: "Furosemide increases metformin plasma levels (mechanism not fully elucidated) and can cause dehydration increasing lactic acidosis risk",
    clinicalEffect: "Increased metformin levels, dehydration-associated lactic acidosis risk",
    management: "Ensure adequate hydration. Monitor renal function. Withhold metformin if patient dehydrated or acutely unwell",
    evidence: "PROBABLE", source: "BNF, Lexicomp",
  },

  // Insulin + beta-blockers
  {
    drugA: "Insulin (Soluble/Regular)", drugB: "Propranolol", severity: "MAJOR",
    mechanism: "Beta-blockers mask adrenergic symptoms of hypoglycaemia (tachycardia, tremor) and impair glycogenolysis, prolonging hypoglycaemia",
    clinicalEffect: "Unrecognised and prolonged hypoglycaemia. Only sweating is preserved as warning sign",
    management: "Use cardioselective beta-blocker (atenolol, bisoprolol) if beta-blocker needed. Educate patient on alternative hypoglycaemia symptoms",
    evidence: "ESTABLISHED", source: "BNF, UpToDate",
  },
  {
    drugA: "Insulin (Soluble/Regular)", drugB: "Atenolol", severity: "MAJOR",
    mechanism: "Even cardioselective beta-blockers can mask hypoglycaemia symptoms at higher doses",
    clinicalEffect: "Masked hypoglycaemia symptoms, though less than non-selective beta-blockers",
    management: "Use lowest effective beta-blocker dose. Educate patient to monitor blood glucose frequently",
    evidence: "ESTABLISHED", source: "BNF",
  },

  // Furosemide + Gentamicin
  {
    drugA: "Furosemide", drugB: "Gentamicin", severity: "MAJOR",
    mechanism: "Additive ototoxicity — both drugs damage cochlear hair cells. Furosemide-induced volume depletion increases aminoglycoside nephrotoxicity",
    clinicalEffect: "Irreversible sensorineural hearing loss, acute kidney injury",
    management: "Avoid combination if possible. If essential, ensure adequate hydration, monitor aminoglycoside levels (trough <1 mg/L), and renal function",
    evidence: "ESTABLISHED", source: "BNF, Lexicomp",
  },

  // Ketoconazole as CYP3A4 inhibitor
  {
    drugA: "Ketoconazole", drugB: "Atorvastatin", severity: "MAJOR",
    mechanism: "Potent CYP3A4 inhibition by ketoconazole markedly increases statin levels",
    clinicalEffect: "Rhabdomyolysis with acute renal failure",
    management: "Avoid combination. Use topical ketoconazole if antifungal needed, or use rosuvastatin/pravastatin (not CYP3A4 substrates)",
    evidence: "ESTABLISHED", source: "BNF, FDA",
  },
  {
    drugA: "Ketoconazole", drugB: "Carbamazepine", severity: "MAJOR",
    mechanism: "Complex bidirectional interaction — ketoconazole inhibits CYP3A4 (increasing carbamazepine) while carbamazepine induces CYP3A4 (reducing ketoconazole)",
    clinicalEffect: "Carbamazepine toxicity and/or ketoconazole treatment failure",
    management: "Avoid combination. Use alternative antifungal (fluconazole with monitoring) or alternative anticonvulsant",
    evidence: "ESTABLISHED", source: "BNF, Lexicomp",
  },

  // Warfarin + additional
  {
    drugA: "Warfarin", drugB: "Ketoconazole", severity: "MAJOR",
    mechanism: "CYP3A4 inhibition by ketoconazole reduces warfarin metabolism",
    clinicalEffect: "Increased INR and bleeding risk",
    management: "Monitor INR closely. Consider dose reduction. Use alternative antifungal if possible",
    evidence: "ESTABLISHED", source: "BNF",
  },
  {
    drugA: "Warfarin", drugB: "Erythromycin", severity: "MAJOR",
    mechanism: "CYP3A4 inhibition by erythromycin and disruption of gut flora reducing vitamin K",
    clinicalEffect: "Increased INR with bleeding risk",
    management: "Monitor INR within 3-5 days. Consider azithromycin as alternative",
    evidence: "ESTABLISHED", source: "BNF, Lexicomp",
  },
  {
    drugA: "Warfarin", drugB: "Omeprazole", severity: "MAJOR",
    mechanism: "CYP2C19 inhibition by omeprazole may reduce warfarin R-enantiomer metabolism",
    clinicalEffect: "Modestly increased INR and bleeding risk",
    management: "Monitor INR. Effect usually modest; clinical significance debated",
    evidence: "PROBABLE", source: "BNF",
  },

  // Ergometrine + clarithromycin
  {
    drugA: "Ergometrine", drugB: "Clarithromycin", severity: "MAJOR",
    mechanism: "CYP3A4 inhibition by clarithromycin increases ergot alkaloid levels",
    clinicalEffect: "Vasospasm, peripheral ischaemia, gangrene",
    management: "Combination is CONTRAINDICATED",
    evidence: "ESTABLISHED", source: "BNF",
  },

  // Lithium + furosemide
  {
    drugA: "Lithium Carbonate", drugB: "Furosemide", severity: "MAJOR",
    mechanism: "Furosemide-induced sodium and volume depletion increases proximal tubular lithium reabsorption",
    clinicalEffect: "Elevated lithium levels with toxicity risk",
    management: "If essential, monitor lithium levels within 5 days and regularly. Ensure adequate hydration and sodium intake",
    evidence: "ESTABLISHED", source: "BNF, UpToDate",
  },

  // Lithium + hydrochlorothiazide
  {
    drugA: "Lithium Carbonate", drugB: "Hydrochlorothiazide", severity: "MAJOR",
    mechanism: "Thiazide diuretics reduce renal lithium clearance by 25% via compensatory proximal tubular reabsorption",
    clinicalEffect: "Lithium toxicity: tremor, confusion, renal impairment",
    management: "If combination necessary, reduce lithium dose by 25-50% and monitor levels within 5 days. Monitor renal function",
    evidence: "ESTABLISHED", source: "BNF, UpToDate",
  },

  // Additional serotonergic
  {
    drugA: "Fluoxetine", drugB: "Lithium Carbonate", severity: "MAJOR",
    mechanism: "SSRIs may increase lithium levels and additive serotonergic effects may cause serotonin syndrome",
    clinicalEffect: "Lithium toxicity and/or serotonin syndrome",
    management: "Monitor lithium levels. Start SSRI at low dose. Watch for serotonin syndrome symptoms",
    evidence: "PROBABLE", source: "BNF, UpToDate",
  },

  // Haloperidol + lithium
  {
    drugA: "Haloperidol", drugB: "Lithium Carbonate", severity: "MAJOR",
    mechanism: "Rare neurotoxic interaction — mechanism unclear but may involve dopamine-serotonin imbalance",
    clinicalEffect: "Encephalopathic syndrome: confusion, hyperthermia, EPS, irreversible brain damage (rare but serious)",
    management: "Combination can be used but monitor closely for neurotoxicity. Keep lithium in therapeutic range",
    evidence: "SUSPECTED", source: "BNF, Lexicomp",
  },

  // Amiodarone + digoxin (already covered as CRITICAL), additional amiodarone
  {
    drugA: "Amiodarone", drugB: "Warfarin", severity: "MAJOR",
    mechanism: "CYP2C9 inhibition by amiodarone reduces warfarin metabolism; effect persists weeks after amiodarone discontinuation",
    clinicalEffect: "Significantly increased INR with bleeding risk. Interaction onset delayed and prolonged",
    management: "Reduce warfarin dose by 33-50% when starting amiodarone. Monitor INR weekly for first month, then regularly",
    evidence: "ESTABLISHED", source: "BNF, Lexicomp, UpToDate",
  },
  {
    drugA: "Amiodarone", drugB: "Atorvastatin", severity: "MAJOR",
    mechanism: "CYP3A4 inhibition by amiodarone increases statin levels",
    clinicalEffect: "Increased risk of myopathy and rhabdomyolysis",
    management: "Limit atorvastatin to 20mg/day with amiodarone. Monitor for muscle symptoms. Check CK if symptomatic",
    evidence: "ESTABLISHED", source: "BNF, FDA",
  },

  // Phenytoin + additional
  {
    drugA: "Phenytoin", drugB: "Rifampicin", severity: "MAJOR",
    mechanism: "CYP2C9 and CYP3A4 induction by rifampicin increases phenytoin metabolism",
    clinicalEffect: "Reduced phenytoin levels leading to breakthrough seizures",
    management: "Monitor phenytoin levels. Increase dose as needed. Monitor closely when rifampicin stopped (levels will rise)",
    evidence: "ESTABLISHED", source: "BNF, Lexicomp",
  },

  // Cyclophosphamide interactions
  {
    drugA: "Cyclophosphamide", drugB: "Furosemide", severity: "MAJOR",
    mechanism: "Possible increased formation of toxic cyclophosphamide metabolite (acrolein) due to renal handling",
    clinicalEffect: "Enhanced pulmonary and haemorrhagic cystitis toxicity",
    management: "Ensure mesna prophylaxis. Maintain adequate hydration. Monitor for haematuria",
    evidence: "PROBABLE", source: "Lexicomp",
  },

  // Additional MAJOR
  {
    drugA: "Glibenclamide", drugB: "Fluconazole", severity: "MAJOR",
    mechanism: "CYP2C9 inhibition by fluconazole reduces sulfonylurea metabolism",
    clinicalEffect: "Prolonged severe hypoglycaemia",
    management: "Reduce glibenclamide dose. Monitor blood glucose frequently. Consider gliclazide (less affected)",
    evidence: "ESTABLISHED", source: "BNF, Lexicomp",
  },
  {
    drugA: "Gliclazide", drugB: "Fluconazole", severity: "MAJOR",
    mechanism: "CYP2C9 inhibition by fluconazole increases sulfonylurea levels",
    clinicalEffect: "Hypoglycaemia",
    management: "Monitor blood glucose. Reduce gliclazide dose if needed",
    evidence: "ESTABLISHED", source: "BNF",
  },
  {
    drugA: "Clarithromycin", drugB: "Digoxin", severity: "MAJOR",
    mechanism: "P-glycoprotein inhibition by clarithromycin and elimination of gut bacteria that inactivate digoxin (Eubacterium lentum)",
    clinicalEffect: "Increased digoxin levels with toxicity risk",
    management: "Monitor digoxin levels. Consider dose reduction. Use azithromycin as alternative",
    evidence: "ESTABLISHED", source: "BNF, Lexicomp",
  },
  {
    drugA: "Erythromycin", drugB: "Digoxin", severity: "MAJOR",
    mechanism: "P-glycoprotein inhibition and gut flora alteration increasing digoxin bioavailability",
    clinicalEffect: "Digoxin toxicity: nausea, arrhythmias",
    management: "Monitor digoxin levels when starting/stopping erythromycin",
    evidence: "ESTABLISHED", source: "BNF",
  },

  // Chlorpromazine + haloperidol (additive EPS)
  {
    drugA: "Chlorpromazine", drugB: "Haloperidol", severity: "MAJOR",
    mechanism: "Additive dopamine D2 blockade and QT prolongation",
    clinicalEffect: "Severe extrapyramidal symptoms, QT prolongation, NMS risk",
    management: "Avoid dual antipsychotic therapy unless under specialist supervision. Monitor ECG",
    evidence: "ESTABLISHED", source: "BNF, UpToDate",
  },

  // Prednisolone + NSAIDs
  {
    drugA: "Prednisolone", drugB: "Ibuprofen", severity: "MAJOR",
    mechanism: "Both drugs impair GI mucosal protection — corticosteroids inhibit mucus/prostaglandin synthesis, NSAIDs inhibit COX-1",
    clinicalEffect: "Significantly increased risk of GI bleeding and peptic ulceration (3-4x higher than either alone)",
    management: "Avoid combination if possible. If essential, add PPI gastroprotection. Monitor for GI symptoms",
    evidence: "ESTABLISHED", source: "BNF, UpToDate",
  },
  {
    drugA: "Prednisolone", drugB: "Diclofenac", severity: "MAJOR",
    mechanism: "Additive GI mucosal damage — corticosteroids and NSAIDs both impair mucosal protection",
    clinicalEffect: "GI bleeding, peptic ulceration (significantly increased risk)",
    management: "Add PPI prophylaxis. Monitor for GI symptoms. Use lowest effective doses",
    evidence: "ESTABLISHED", source: "BNF",
  },
  {
    drugA: "Dexamethasone", drugB: "Ibuprofen", severity: "MAJOR",
    mechanism: "Additive GI mucosal damage from corticosteroid and NSAID",
    clinicalEffect: "Increased GI bleeding and ulceration risk",
    management: "Add PPI. Avoid combination if possible",
    evidence: "ESTABLISHED", source: "BNF",
  },

  // Rifampicin + prednisolone
  {
    drugA: "Rifampicin", drugB: "Prednisolone", severity: "MAJOR",
    mechanism: "CYP3A4 induction by rifampicin increases prednisolone metabolism",
    clinicalEffect: "Reduced corticosteroid efficacy, potential adrenal crisis",
    management: "May need to double corticosteroid dose. Monitor clinical response",
    evidence: "ESTABLISHED", source: "BNF",
  },

  // Digoxin + clarithromycin (already covered as MAJOR above with different name)

  // ========== MODERATE INTERACTIONS ==========

  // ACE Inhibitor + NSAIDs
  {
    drugA: "Lisinopril", drugB: "Ibuprofen", severity: "MODERATE",
    mechanism: "NSAIDs inhibit renal prostaglandin synthesis, reducing renal blood flow and opposing ACE inhibitor vasodilatory effect",
    clinicalEffect: "Reduced antihypertensive effect (average 5-10 mmHg increase), increased risk of AKI in susceptible patients",
    management: "Monitor blood pressure. Use lowest NSAID dose for shortest duration. Monitor renal function in elderly/CKD",
    evidence: "ESTABLISHED", source: "BNF, NICE, UpToDate",
  },
  {
    drugA: "Lisinopril", drugB: "Diclofenac", severity: "MODERATE",
    mechanism: "NSAIDs oppose renal prostaglandin-mediated vasodilation, reducing ACE inhibitor efficacy",
    clinicalEffect: "Reduced antihypertensive effect and increased nephrotoxicity risk",
    management: "Use lowest dose, shortest duration. Monitor BP and renal function",
    evidence: "ESTABLISHED", source: "BNF",
  },
  {
    drugA: "Enalapril", drugB: "Ibuprofen", severity: "MODERATE",
    mechanism: "NSAIDs reduce renal prostaglandin synthesis, opposing ACE inhibitor antihypertensive effect",
    clinicalEffect: "Attenuated BP reduction, AKI risk in dehydrated/elderly patients",
    management: "Monitor BP and renal function. Use short course of NSAID",
    evidence: "ESTABLISHED", source: "BNF",
  },
  {
    drugA: "Enalapril", drugB: "Diclofenac", severity: "MODERATE",
    mechanism: "NSAIDs oppose ACE inhibitor renal and cardiovascular effects",
    clinicalEffect: "Reduced antihypertensive effect, nephrotoxicity risk",
    management: "Monitor BP and renal function. Shortest NSAID course possible",
    evidence: "ESTABLISHED", source: "BNF",
  },

  // Diuretics + NSAIDs
  {
    drugA: "Furosemide", drugB: "Ibuprofen", severity: "MODERATE",
    mechanism: "NSAIDs reduce renal prostaglandin-mediated sodium and water excretion, opposing diuretic effect",
    clinicalEffect: "Reduced diuretic and antihypertensive effect, increased AKI risk (triple whammy with ACE inhibitor)",
    management: "Avoid if possible. Monitor weight, oedema, renal function. Paracetamol preferred analgesic",
    evidence: "ESTABLISHED", source: "BNF, UpToDate",
  },
  {
    drugA: "Furosemide", drugB: "Diclofenac", severity: "MODERATE",
    mechanism: "NSAIDs reduce prostaglandin-mediated renal blood flow, opposing diuretic effect",
    clinicalEffect: "Reduced diuresis, fluid retention, AKI risk",
    management: "Use shortest NSAID course. Monitor renal function and fluid balance",
    evidence: "ESTABLISHED", source: "BNF",
  },
  {
    drugA: "Hydrochlorothiazide", drugB: "Ibuprofen", severity: "MODERATE",
    mechanism: "NSAIDs oppose diuretic and antihypertensive effect of thiazides",
    clinicalEffect: "Reduced BP control, fluid retention",
    management: "Monitor BP. Use paracetamol as analgesic alternative",
    evidence: "ESTABLISHED", source: "BNF",
  },
  {
    drugA: "Hydrochlorothiazide", drugB: "Diclofenac", severity: "MODERATE",
    mechanism: "NSAIDs oppose thiazide diuretic effect via renal prostaglandin inhibition",
    clinicalEffect: "Reduced antihypertensive effect, fluid retention",
    management: "Monitor BP. Use shortest NSAID course",
    evidence: "ESTABLISHED", source: "BNF",
  },

  // Ciprofloxacin + theophylline/aminophylline
  {
    drugA: "Ciprofloxacin", drugB: "Aminophylline", severity: "MODERATE",
    mechanism: "CYP1A2 inhibition by ciprofloxacin reduces theophylline/aminophylline metabolism",
    clinicalEffect: "Theophylline toxicity: nausea, vomiting, tachycardia, seizures, arrhythmias",
    management: "Reduce aminophylline dose by 30-50%. Monitor theophylline levels. Use alternative antibiotic if possible",
    evidence: "ESTABLISHED", source: "BNF, Lexicomp",
  },

  // Atorvastatin + amlodipine
  {
    drugA: "Atorvastatin", drugB: "Amlodipine", severity: "MODERATE",
    mechanism: "Amlodipine is a weak CYP3A4 inhibitor, modestly increasing atorvastatin exposure (by ~18%)",
    clinicalEffect: "Slightly increased statin levels with modestly higher myopathy risk",
    management: "Generally safe combination but limit atorvastatin to 40mg with amlodipine. Monitor for muscle symptoms",
    evidence: "ESTABLISHED", source: "BNF, FDA",
  },

  // Chlorpheniramine + sedatives
  {
    drugA: "Chlorpheniramine", drugB: "Diazepam", severity: "MODERATE",
    mechanism: "Additive CNS depression — both drugs cause sedation via different mechanisms (H1 blockade and GABA enhancement)",
    clinicalEffect: "Excessive sedation, drowsiness, impaired psychomotor function, respiratory depression, increased fall risk",
    management: "Warn patient about additive sedation. Avoid driving/operating machinery. Consider non-sedating antihistamine (cetirizine, loratadine)",
    evidence: "ESTABLISHED", source: "BNF",
  },
  {
    drugA: "Chlorpheniramine", drugB: "Morphine", severity: "MODERATE",
    mechanism: "Additive CNS depression from first-generation antihistamine and opioid",
    clinicalEffect: "Excessive sedation, respiratory depression",
    management: "Use non-sedating antihistamine if possible. Monitor respiratory rate",
    evidence: "ESTABLISHED", source: "BNF",
  },
  {
    drugA: "Chlorpheniramine", drugB: "Tramadol", severity: "MODERATE",
    mechanism: "Additive CNS depression; tramadol also has serotonergic effect and chlorpheniramine may have weak serotonin reuptake inhibition",
    clinicalEffect: "Excessive sedation, seizure risk",
    management: "Use non-sedating antihistamine. Monitor for excessive sedation",
    evidence: "PROBABLE", source: "BNF",
  },

  // Azithromycin + digoxin
  {
    drugA: "Azithromycin", drugB: "Digoxin", severity: "MODERATE",
    mechanism: "Azithromycin eliminates gut bacteria (Eubacterium lentum) that normally inactivate digoxin, increasing bioavailability",
    clinicalEffect: "Increased digoxin levels with possible toxicity: nausea, arrhythmias",
    management: "Monitor for digoxin toxicity. Check digoxin levels if symptoms develop. Generally lower risk than clarithromycin/erythromycin",
    evidence: "PROBABLE", source: "BNF, Lexicomp",
  },

  // Iron/Calcium + Levothyroxine
  {
    drugA: "Ferrous Sulphate + Folic Acid", drugB: "Levothyroxine", severity: "MODERATE",
    mechanism: "Iron binds to levothyroxine in GI tract forming insoluble complexes that prevent absorption",
    clinicalEffect: "Reduced levothyroxine absorption leading to hypothyroidism symptoms and elevated TSH",
    management: "Separate doses by at least 4 hours. Take levothyroxine on empty stomach in the morning, iron at a different time",
    evidence: "ESTABLISHED", source: "BNF, UpToDate",
  },
  {
    drugA: "Calcium + Vitamin D", drugB: "Levothyroxine", severity: "MODERATE",
    mechanism: "Calcium binds to levothyroxine in GI tract reducing absorption",
    clinicalEffect: "Reduced levothyroxine effect, rising TSH, hypothyroidism symptoms",
    management: "Separate doses by at least 4 hours. Take levothyroxine on empty stomach",
    evidence: "ESTABLISHED", source: "BNF, UpToDate",
  },

  // Antacids + many drugs
  {
    drugA: "Magnesium Trisilicate", drugB: "Levothyroxine", severity: "MODERATE",
    mechanism: "Antacids adsorb levothyroxine in GI tract, reducing absorption",
    clinicalEffect: "Reduced levothyroxine efficacy, hypothyroidism",
    management: "Separate doses by at least 4 hours",
    evidence: "ESTABLISHED", source: "BNF",
  },
  {
    drugA: "Magnesium Trisilicate", drugB: "Phenytoin", severity: "MODERATE",
    mechanism: "Antacids reduce phenytoin absorption by adsorption and alteration of GI pH",
    clinicalEffect: "Reduced phenytoin levels, risk of breakthrough seizures",
    management: "Separate doses by at least 2 hours. Monitor phenytoin levels",
    evidence: "ESTABLISHED", source: "BNF",
  },

  // Sodium Valproate + Carbamazepine
  {
    drugA: "Sodium Valproate", drugB: "Carbamazepine", severity: "MODERATE",
    mechanism: "Complex interaction: carbamazepine induces valproate metabolism (lowering levels) while valproate inhibits epoxide hydrolase (increasing carbamazepine-10,11-epoxide toxic metabolite)",
    clinicalEffect: "Reduced valproate levels AND increased toxic carbamazepine metabolite causing neurotoxicity (nausea, ataxia, diplopia)",
    management: "Monitor levels of both drugs. Watch for signs of carbamazepine toxicity even if carbamazepine level appears normal (epoxide not measured routinely)",
    evidence: "ESTABLISHED", source: "BNF, UpToDate",
  },

  // Metformin + alcohol (conceptual — alcohol is not a drug, but important)
  // Skip — alcohol is not in formulary

  // Beta-blocker + metformin (masked hypo)
  {
    drugA: "Metformin", drugB: "Propranolol", severity: "MODERATE",
    mechanism: "Beta-blockers mask adrenergic symptoms of hypoglycaemia, though metformin alone rarely causes hypoglycaemia",
    clinicalEffect: "Masked hypoglycaemia symptoms if metformin combined with sulfonylurea/insulin and beta-blocker",
    management: "Risk is low with metformin monotherapy. Counsel patients on alternative hypoglycaemia symptoms. Prefer cardioselective beta-blocker",
    evidence: "PROBABLE", source: "BNF",
  },

  // Glibenclamide + propranolol
  {
    drugA: "Glibenclamide", drugB: "Propranolol", severity: "MODERATE",
    mechanism: "Beta-blockers mask adrenergic hypoglycaemia symptoms and may prolong hypoglycaemia",
    clinicalEffect: "Unrecognised hypoglycaemia in patients on sulfonylureas",
    management: "Use cardioselective beta-blocker. Educate patient. Monitor blood glucose more frequently",
    evidence: "ESTABLISHED", source: "BNF",
  },

  // Omeprazole + other drugs
  {
    drugA: "Omeprazole", drugB: "Phenytoin", severity: "MODERATE",
    mechanism: "CYP2C19 inhibition by omeprazole reduces phenytoin metabolism",
    clinicalEffect: "Increased phenytoin levels with possible toxicity (nystagmus, ataxia)",
    management: "Monitor phenytoin levels when starting/stopping omeprazole. Consider dose adjustment",
    evidence: "PROBABLE", source: "BNF, Lexicomp",
  },

  // Fluconazole + phenytoin (already MAJOR above)

  // Digoxin + amiodarone (already CRITICAL above)

  // Spironolactone + losartan
  {
    drugA: "Spironolactone", drugB: "Losartan", severity: "MODERATE",
    mechanism: "Both increase serum potassium — ARB reduces aldosterone, spironolactone is aldosterone antagonist",
    clinicalEffect: "Hyperkalaemia, especially in renal impairment",
    management: "Monitor K+ and renal function closely. Use low-dose spironolactone",
    evidence: "ESTABLISHED", source: "BNF",
  },

  // Ciprofloxacin + prednisolone
  {
    drugA: "Ciprofloxacin", drugB: "Prednisolone", severity: "MODERATE",
    mechanism: "Both fluoroquinolones and corticosteroids independently increase tendon damage risk",
    clinicalEffect: "Increased risk of tendinitis and tendon rupture, especially Achilles tendon",
    management: "Avoid combination if possible, especially in elderly (>60 years). Discontinue if tendon pain occurs",
    evidence: "ESTABLISHED", source: "BNF, FDA, UpToDate",
  },

  // Levofloxacin + prednisolone (same mechanism as cipro)
  {
    drugA: "Levofloxacin", drugB: "Prednisolone", severity: "MODERATE",
    mechanism: "Additive tendon damage risk — fluoroquinolone + corticosteroid",
    clinicalEffect: "Tendinitis and Achilles tendon rupture",
    management: "Avoid in elderly. Stop fluoroquinolone at first sign of tendon pain",
    evidence: "ESTABLISHED", source: "BNF, FDA",
  },

  // Amitriptyline interactions
  {
    drugA: "Amitriptyline", drugB: "Tramadol", severity: "MODERATE",
    mechanism: "TCAs and tramadol both lower seizure threshold; TCA anticholinergic + tramadol serotonergic effects",
    clinicalEffect: "Increased seizure risk, serotonin syndrome, additive CNS depression",
    management: "Use alternative analgesic if possible. If combination essential, use low doses and monitor",
    evidence: "PROBABLE", source: "BNF, Lexicomp",
  },
  {
    drugA: "Amitriptyline", drugB: "Fluoxetine", severity: "MODERATE",
    mechanism: "Fluoxetine inhibits CYP2D6, markedly increasing amitriptyline and nortriptyline levels. Additive serotonergic effects",
    clinicalEffect: "TCA toxicity: sedation, anticholinergic effects, cardiac arrhythmia. Serotonin syndrome risk",
    management: "Avoid combination or reduce TCA dose. Monitor ECG. Be aware of fluoxetine long half-life (active metabolite persists weeks)",
    evidence: "ESTABLISHED", source: "BNF, UpToDate",
  },

  // Ciprofloxacin + NSAIDs (seizure threshold)
  {
    drugA: "Ciprofloxacin", drugB: "Ibuprofen", severity: "MODERATE",
    mechanism: "NSAIDs may increase fluoroquinolone CNS penetration and both lower seizure threshold",
    clinicalEffect: "Increased seizure risk, CNS stimulation",
    management: "Use with caution, especially in patients with epilepsy history. Consider alternative antibiotic or analgesic",
    evidence: "PROBABLE", source: "BNF",
  },

  // Morphine + diazepam
  {
    drugA: "Morphine", drugB: "Diazepam", severity: "MODERATE",
    mechanism: "Additive CNS and respiratory depression from opioid + benzodiazepine",
    clinicalEffect: "Excessive sedation, respiratory depression, death",
    management: "Avoid combination if possible. If essential, use lowest effective doses. Monitor respiratory rate and oxygen saturation",
    evidence: "ESTABLISHED", source: "BNF, FDA Black Box Warning",
  },

  // Tramadol + diazepam
  {
    drugA: "Tramadol", drugB: "Diazepam", severity: "MODERATE",
    mechanism: "Additive CNS depression; both lower seizure threshold",
    clinicalEffect: "Excessive sedation, respiratory depression, seizures",
    management: "Use lowest effective doses. Monitor for sedation. Avoid in patients with seizure history",
    evidence: "ESTABLISHED", source: "BNF",
  },

  // Aspirin + clopidogrel (dual antiplatelet — intentional but risky)
  {
    drugA: "Aspirin", drugB: "Clopidogrel", severity: "MODERATE",
    mechanism: "Additive inhibition of platelet aggregation via different pathways (COX-1 and P2Y12)",
    clinicalEffect: "Increased bleeding risk, especially GI. However, DAPT is intentional post-ACS/PCI",
    management: "Standard of care post-ACS for 12 months. Add PPI gastroprotection. Monitor for bleeding",
    evidence: "ESTABLISHED", source: "BNF, ESC guidelines",
  },

  // Metformin + iodinated contrast
  // Skip — contrast dye not in formulary

  // Ondansetron + haloperidol (QT)
  {
    drugA: "Ondansetron", drugB: "Haloperidol", severity: "MODERATE",
    mechanism: "Additive QT prolongation from both agents",
    clinicalEffect: "Increased risk of Torsades de Pointes and cardiac arrhythmia",
    management: "Avoid combination if possible. If essential, check baseline ECG and QTc. Use metoclopramide as antiemetic alternative",
    evidence: "ESTABLISHED", source: "CredibleMeds, BNF",
  },

  // Additional moderate — Omeprazole + iron
  {
    drugA: "Omeprazole", drugB: "Ferrous Sulphate + Folic Acid", severity: "MODERATE",
    mechanism: "PPIs raise gastric pH, reducing conversion of ferric to ferrous iron needed for absorption",
    clinicalEffect: "Reduced iron absorption, poor response to oral iron therapy",
    management: "Consider parenteral iron if on long-term PPI. Take iron with vitamin C to enhance absorption",
    evidence: "PROBABLE", source: "BNF, UpToDate",
  },

  // Ciprofloxacin + omeprazole (reduced cipro absorption is debated)
  // Not clinically significant enough for inclusion

  // Phenytoin + omeprazole (already above)

  // Ketoconazole + omeprazole
  {
    drugA: "Ketoconazole", drugB: "Omeprazole", severity: "MODERATE",
    mechanism: "Ketoconazole requires acidic gastric pH for dissolution and absorption; PPIs raise gastric pH",
    clinicalEffect: "Markedly reduced ketoconazole absorption and antifungal treatment failure",
    management: "Administer ketoconazole with acidic beverage (cola). Consider fluconazole or itraconazole oral solution as alternatives",
    evidence: "ESTABLISHED", source: "BNF, Lexicomp",
  },

  // Insulin NPH + additional
  {
    drugA: "Insulin (NPH/Isophane)", drugB: "Propranolol", severity: "MODERATE",
    mechanism: "Non-selective beta-blockade masks adrenergic hypoglycaemia symptoms and impairs glycogenolysis",
    clinicalEffect: "Unrecognised and prolonged hypoglycaemia",
    management: "Use cardioselective beta-blocker. Educate patient on alternative hypoglycaemia signs (sweating preserved)",
    evidence: "ESTABLISHED", source: "BNF",
  },

  // Fluoxetine + carbamazepine
  {
    drugA: "Fluoxetine", drugB: "Carbamazepine", severity: "MODERATE",
    mechanism: "Fluoxetine inhibits CYP2C19 and CYP3A4, potentially increasing carbamazepine levels. Carbamazepine may induce fluoxetine metabolism",
    clinicalEffect: "Possible carbamazepine toxicity (ataxia, diplopia) or reduced fluoxetine efficacy",
    management: "Monitor carbamazepine levels when starting/stopping fluoxetine. Monitor for toxicity and clinical response",
    evidence: "PROBABLE", source: "BNF, Lexicomp",
  },

  // Sertraline + carbamazepine
  {
    drugA: "Sertraline", drugB: "Carbamazepine", severity: "MODERATE",
    mechanism: "Carbamazepine induces CYP3A4, potentially reducing sertraline levels",
    clinicalEffect: "Reduced antidepressant effect",
    management: "May need higher sertraline dose. Monitor clinical response to antidepressant",
    evidence: "PROBABLE", source: "BNF",
  },

  // Phenytoin + prednisolone
  {
    drugA: "Phenytoin", drugB: "Prednisolone", severity: "MODERATE",
    mechanism: "Phenytoin induces CYP3A4, increasing corticosteroid metabolism",
    clinicalEffect: "Reduced corticosteroid efficacy",
    management: "May need increased corticosteroid dose. Monitor clinical response",
    evidence: "ESTABLISHED", source: "BNF",
  },

  // Carbamazepine + prednisolone
  {
    drugA: "Carbamazepine", drugB: "Prednisolone", severity: "MODERATE",
    mechanism: "Carbamazepine induces CYP3A4, reducing prednisolone levels",
    clinicalEffect: "Reduced corticosteroid efficacy",
    management: "May need to increase corticosteroid dose. Monitor clinical response",
    evidence: "ESTABLISHED", source: "BNF",
  },

  // Carbamazepine + combined OCP
  {
    drugA: "Carbamazepine", drugB: "Combined Oral Contraceptive", severity: "MODERATE",
    mechanism: "CYP3A4 induction by carbamazepine increases oestrogen/progestogen metabolism",
    clinicalEffect: "Contraceptive failure, breakthrough bleeding",
    management: "Use non-enzyme-inducing AED if possible. If carbamazepine essential, use IUD, DMPA, or additional barrier method",
    evidence: "ESTABLISHED", source: "BNF, FSRH",
  },

  // Phenytoin + combined OCP
  {
    drugA: "Phenytoin", drugB: "Combined Oral Contraceptive", severity: "MODERATE",
    mechanism: "CYP3A4 induction by phenytoin increases contraceptive hormone metabolism",
    clinicalEffect: "Contraceptive failure, unintended pregnancy",
    management: "Use alternative contraception or use high-dose OCP with specialist guidance",
    evidence: "ESTABLISHED", source: "BNF, FSRH",
  },

  // Glibenclamide + rifampicin
  {
    drugA: "Glibenclamide", drugB: "Rifampicin", severity: "MODERATE",
    mechanism: "CYP2C9 induction by rifampicin increases sulfonylurea metabolism",
    clinicalEffect: "Reduced hypoglycaemic effect, hyperglycaemia",
    management: "Monitor blood glucose. May need increased sulfonylurea dose or switch to insulin during TB treatment",
    evidence: "ESTABLISHED", source: "BNF",
  },

  // Losartan + ibuprofen
  {
    drugA: "Losartan", drugB: "Ibuprofen", severity: "MODERATE",
    mechanism: "NSAIDs oppose ARB antihypertensive effect and increase nephrotoxicity risk",
    clinicalEffect: "Reduced BP control, AKI risk especially with concurrent diuretic (triple whammy)",
    management: "Use shortest NSAID course at lowest dose. Monitor BP and renal function. Paracetamol preferred",
    evidence: "ESTABLISHED", source: "BNF",
  },
  {
    drugA: "Losartan", drugB: "Diclofenac", severity: "MODERATE",
    mechanism: "NSAIDs oppose ARB antihypertensive and renoprotective effects",
    clinicalEffect: "Reduced BP control, increased nephrotoxicity",
    management: "Avoid prolonged NSAID use. Monitor BP and renal function",
    evidence: "ESTABLISHED", source: "BNF",
  },

  // Spironolactone + potassium chloride
  {
    drugA: "Spironolactone", drugB: "Potassium Chloride", severity: "MODERATE",
    mechanism: "Spironolactone is potassium-sparing; additive hyperkalaemia with potassium supplements",
    clinicalEffect: "Hyperkalaemia with risk of cardiac arrhythmia",
    management: "Avoid combination unless documented hypokalaemia despite spironolactone. Monitor K+ closely",
    evidence: "ESTABLISHED", source: "BNF",
  },

  // Metformin + atenolol
  {
    drugA: "Metformin", drugB: "Atenolol", severity: "MODERATE",
    mechanism: "Beta-blockers may mask hypoglycaemia symptoms, though risk low with metformin alone",
    clinicalEffect: "Masked hypoglycaemia if combined with sulfonylurea",
    management: "Generally safe. Counsel patient if also on sulfonylurea/insulin",
    evidence: "PROBABLE", source: "BNF",
  },

  // Fluoxetine + haloperidol
  {
    drugA: "Fluoxetine", drugB: "Haloperidol", severity: "MODERATE",
    mechanism: "Fluoxetine inhibits CYP2D6 which metabolises haloperidol, increasing haloperidol levels",
    clinicalEffect: "Increased EPS, QT prolongation risk",
    management: "Monitor for EPS. Consider ECG. May need haloperidol dose reduction",
    evidence: "ESTABLISHED", source: "BNF, Lexicomp",
  },

  // Aspirin + furosemide
  {
    drugA: "Aspirin", drugB: "Furosemide", severity: "MODERATE",
    mechanism: "Aspirin reduces prostaglandin-mediated renal blood flow and opposes diuretic effect",
    clinicalEffect: "Reduced diuretic response; low-dose aspirin (75-150mg) effect is minimal",
    management: "Low-dose antiplatelet aspirin (75-100mg) is generally safe. High-dose analgesic aspirin should be avoided with diuretics",
    evidence: "ESTABLISHED", source: "BNF",
  },

  // Warfarin + atorvastatin
  {
    drugA: "Warfarin", drugB: "Atorvastatin", severity: "MODERATE",
    mechanism: "Statins may modestly increase warfarin effect via CYP interaction",
    clinicalEffect: "Slightly increased INR",
    management: "Monitor INR when starting/stopping statin. Usually minor effect",
    evidence: "PROBABLE", source: "BNF",
  },

  // ========== MINOR INTERACTIONS ==========

  // Paracetamol + metoclopramide (beneficial)
  {
    drugA: "Paracetamol (Acetaminophen)", drugB: "Metoclopramide", severity: "MINOR",
    mechanism: "Metoclopramide accelerates gastric emptying, increasing rate of paracetamol absorption from small intestine",
    clinicalEffect: "Faster onset of paracetamol analgesic effect. This is clinically beneficial, not harmful",
    management: "No action needed. This interaction is exploited therapeutically (e.g. Paramax = paracetamol + metoclopramide for migraine)",
    evidence: "ESTABLISHED", source: "BNF",
  },

  // Vitamin C + Iron (beneficial)
  {
    drugA: "Vitamin C (Ascorbic Acid)", drugB: "Ferrous Sulphate + Folic Acid", severity: "MINOR",
    mechanism: "Ascorbic acid reduces ferric (Fe3+) to ferrous (Fe2+) iron in the GI tract, enhancing absorption",
    clinicalEffect: "Enhanced iron absorption by 2-3 fold. This is a beneficial interaction",
    management: "Encourage co-administration. Taking iron with vitamin C or orange juice improves absorption",
    evidence: "ESTABLISHED", source: "BNF, UpToDate",
  },

  // Paracetamol + omeprazole (minimal)
  {
    drugA: "Paracetamol (Acetaminophen)", drugB: "Omeprazole", severity: "MINOR",
    mechanism: "Omeprazole may slightly delay paracetamol absorption but no clinically significant effect",
    clinicalEffect: "Negligible clinical effect",
    management: "No action needed",
    evidence: "THEORETICAL", source: "BNF",
  },

  // Aspirin + paracetamol (minor)
  {
    drugA: "Aspirin", drugB: "Paracetamol (Acetaminophen)", severity: "MINOR",
    mechanism: "Aspirin may slightly reduce paracetamol absorption, but combination is widely used safely",
    clinicalEffect: "Minimal clinical significance. Often combined for analgesia",
    management: "No special precautions needed",
    evidence: "THEORETICAL", source: "BNF",
  },

  // Omeprazole + amlodipine (CYP2C19/3A4)
  {
    drugA: "Omeprazole", drugB: "Amlodipine", severity: "MINOR",
    mechanism: "Theoretical CYP3A4 interaction but clinically insignificant",
    clinicalEffect: "No clinically relevant effect",
    management: "No action needed",
    evidence: "THEORETICAL", source: "Lexicomp",
  },

  // Additional interactions to reach 150+

  // Ceftriaxone + calcium
  {
    drugA: "Ceftriaxone", drugB: "Calcium + Vitamin D", severity: "MAJOR",
    mechanism: "Ceftriaxone and calcium can form insoluble precipitates in neonates (via IV); oral calcium in adults is less risky",
    clinicalEffect: "Fatal cardiopulmonary reactions in neonates (IV co-administration). In adults, risk is with IV calcium",
    management: "NEVER co-administer IV ceftriaxone and IV calcium in neonates. In adults, separate IV infusions by at least 48 hours if using same line",
    evidence: "ESTABLISHED", source: "FDA, BNF, WHO",
  },

  // Gentamicin + amphotericin (if present)
  // Skip — amphotericin not confirmed in formulary

  // Ciprofloxacin + warfarin (already CRITICAL above)

  // Metoclopramide + haloperidol
  {
    drugA: "Metoclopramide", drugB: "Haloperidol", severity: "MODERATE",
    mechanism: "Additive dopamine D2 receptor blockade in CNS and periphery",
    clinicalEffect: "Increased risk of extrapyramidal side effects (acute dystonia, akathisia, tardive dyskinesia)",
    management: "Avoid combination. Use ondansetron or domperidone as antiemetic alternative with antipsychotics",
    evidence: "ESTABLISHED", source: "BNF",
  },

  // Metoclopramide + chlorpromazine
  {
    drugA: "Metoclopramide", drugB: "Chlorpromazine", severity: "MODERATE",
    mechanism: "Additive dopamine blockade causing enhanced EPS",
    clinicalEffect: "Extrapyramidal symptoms, especially in young adults",
    management: "Avoid combination. Use alternative antiemetic",
    evidence: "ESTABLISHED", source: "BNF",
  },

  // Erythromycin + carbamazepine (already CRITICAL above)

  // Fluoxetine + ondansetron
  {
    drugA: "Fluoxetine", drugB: "Ondansetron", severity: "MODERATE",
    mechanism: "Ondansetron (5-HT3 antagonist) may reduce efficacy of SSRI antidepressant effect; additive QT prolongation possible",
    clinicalEffect: "Possible reduced antidepressant efficacy. QT prolongation",
    management: "Monitor QTc if prolonged co-use. Short-term antiemetic use unlikely to affect antidepressant efficacy",
    evidence: "PROBABLE", source: "Lexicomp",
  },

  // Carbamazepine + doxycycline
  {
    drugA: "Carbamazepine", drugB: "Doxycycline", severity: "MODERATE",
    mechanism: "Carbamazepine induces CYP3A4, increasing doxycycline metabolism and reducing half-life by ~50%",
    clinicalEffect: "Subtherapeutic doxycycline levels, antibiotic treatment failure",
    management: "Use alternative antibiotic or increase doxycycline dose. Consider azithromycin or amoxicillin",
    evidence: "ESTABLISHED", source: "BNF, Lexicomp",
  },

  // Phenytoin + dexamethasone
  {
    drugA: "Phenytoin", drugB: "Dexamethasone", severity: "MODERATE",
    mechanism: "Phenytoin induces CYP3A4, reducing dexamethasone levels. Dexamethasone may also affect phenytoin levels",
    clinicalEffect: "Reduced corticosteroid effect. May need dose adjustment of both drugs",
    management: "Increase dexamethasone dose if needed. Monitor phenytoin levels",
    evidence: "ESTABLISHED", source: "BNF",
  },

  // Rifampicin + metformin
  {
    drugA: "Rifampicin", drugB: "Metformin", severity: "MODERATE",
    mechanism: "Rifampicin induces organic cation transporters (OCT1), potentially increasing metformin hepatic uptake",
    clinicalEffect: "Altered metformin pharmacokinetics; clinical significance debated",
    management: "Monitor blood glucose. Adjust metformin dose as needed",
    evidence: "SUSPECTED", source: "Lexicomp",
  },

  // Fluoxetine + phenytoin
  {
    drugA: "Fluoxetine", drugB: "Phenytoin", severity: "MODERATE",
    mechanism: "Fluoxetine inhibits CYP2C9, reducing phenytoin metabolism",
    clinicalEffect: "Increased phenytoin levels, risk of toxicity",
    management: "Monitor phenytoin levels. Reduce dose if needed",
    evidence: "PROBABLE", source: "BNF, Lexicomp",
  },

  // Atenolol + amlodipine
  {
    drugA: "Atenolol", drugB: "Amlodipine", severity: "MODERATE",
    mechanism: "Additive negative chronotropic and antihypertensive effects. DHP CCBs are generally safe with beta-blockers",
    clinicalEffect: "Enhanced BP reduction, mild bradycardia. Generally a beneficial combination",
    management: "Monitor heart rate and BP. This combination is commonly used and generally well-tolerated",
    evidence: "ESTABLISHED", source: "BNF, NICE",
  },

  // Losartan + spironolactone (already covered above)

  // Hydrocortisone + diclofenac
  {
    drugA: "Hydrocortisone", drugB: "Diclofenac", severity: "MODERATE",
    mechanism: "Additive GI mucosal damage from corticosteroid and NSAID",
    clinicalEffect: "Increased GI bleeding and ulceration risk",
    management: "Add PPI. Monitor for GI symptoms. Use shortest courses possible",
    evidence: "ESTABLISHED", source: "BNF",
  },

  // Hydrocortisone + ibuprofen
  {
    drugA: "Hydrocortisone", drugB: "Ibuprofen", severity: "MODERATE",
    mechanism: "Additive GI mucosal damage from corticosteroid and NSAID",
    clinicalEffect: "Increased risk of peptic ulceration and GI bleeding",
    management: "Add PPI gastroprotection. Use shortest NSAID course",
    evidence: "ESTABLISHED", source: "BNF",
  },

  // Warfarin + amoxicillin
  {
    drugA: "Warfarin", drugB: "Amoxicillin", severity: "MODERATE",
    mechanism: "Amoxicillin may alter gut flora, reducing vitamin K production and potentiating warfarin",
    clinicalEffect: "Modestly increased INR in some patients",
    management: "Monitor INR if antibiotic course >5 days. Risk is lower than with macrolides/fluoroquinolones",
    evidence: "PROBABLE", source: "BNF",
  },

  // Clarithromycin + carbamazepine (already CRITICAL above)

  // Additional furosemide interactions
  {
    drugA: "Furosemide", drugB: "Digoxin", severity: "CRITICAL",
    mechanism: "Furosemide-induced hypokalaemia and hypomagnesaemia increase cardiac sensitivity to digoxin",
    clinicalEffect: "Digoxin toxicity: arrhythmias, heart block even at therapeutic digoxin levels",
    management: "Maintain K+ >4.0 mmol/L. Consider K-sparing diuretic. Monitor Mg2+",
    evidence: "ESTABLISHED", source: "BNF",
  },

  // Amiodarone + phenytoin
  {
    drugA: "Amiodarone", drugB: "Phenytoin", severity: "MODERATE",
    mechanism: "Amiodarone inhibits CYP2C9 (increasing phenytoin levels) while phenytoin induces CYP3A4 (reducing amiodarone levels)",
    clinicalEffect: "Phenytoin toxicity and/or reduced amiodarone efficacy",
    management: "Monitor phenytoin levels. Reduce phenytoin dose by 25-50%. Monitor amiodarone efficacy",
    evidence: "ESTABLISHED", source: "BNF, Lexicomp",
  },

  // Nitrofurantoin + magnesium trisilicate
  {
    drugA: "Nitrofurantoin", drugB: "Magnesium Trisilicate", severity: "MODERATE",
    mechanism: "Antacids reduce nitrofurantoin absorption by adsorption",
    clinicalEffect: "Reduced nitrofurantoin efficacy for UTI treatment",
    management: "Separate doses by at least 2 hours",
    evidence: "ESTABLISHED", source: "BNF",
  },

  // Chloramphenicol + phenytoin
  {
    drugA: "Chloramphenicol", drugB: "Phenytoin", severity: "MODERATE",
    mechanism: "Chloramphenicol inhibits CYP2C9, reducing phenytoin metabolism. Phenytoin may increase chloramphenicol metabolism",
    clinicalEffect: "Phenytoin toxicity and/or reduced chloramphenicol efficacy",
    management: "Monitor phenytoin levels. Adjust doses as needed",
    evidence: "ESTABLISHED", source: "BNF",
  },

  // Sodium Valproate + phenytoin
  {
    drugA: "Sodium Valproate", drugB: "Phenytoin", severity: "MODERATE",
    mechanism: "Valproate displaces phenytoin from protein binding (transiently increases free phenytoin) and inhibits its metabolism. Phenytoin induces valproate metabolism",
    clinicalEffect: "Complex: Total phenytoin may appear low but free level elevated. Valproate levels reduced",
    management: "Monitor free phenytoin levels (not total). Monitor valproate levels. Clinical correlation essential",
    evidence: "ESTABLISHED", source: "BNF, UpToDate",
  },

  // Phenytoin + folic acid
  {
    drugA: "Phenytoin", drugB: "Ferrous Sulphate + Folic Acid", severity: "MODERATE",
    mechanism: "Folic acid supplementation may increase phenytoin metabolism and reduce phenytoin levels",
    clinicalEffect: "Reduced phenytoin levels, risk of breakthrough seizures",
    management: "Monitor phenytoin levels when starting folic acid. May need phenytoin dose adjustment",
    evidence: "PROBABLE", source: "BNF",
  },
];

// ============================================
// 3. FORMULARY DRUG CLINICAL FIELD UPDATES
// ============================================

interface DrugUpdate {
  genericName: string;
  data: Record<string, unknown>;
}

const drugUpdates: DrugUpdate[] = [
  {
    genericName: "Warfarin",
    data: {
      pregnancyCategory: "X",
      isHighAlert: true,
      maxDosePerDay: "10mg (individual titration based on INR)",
      renalAdjustment: { mild: "No adjustment", moderate: "Use with caution — monitor INR closely", severe: "Use with caution — bleeding risk increased", dialysis: "Not removed by dialysis; use with caution" },
      hepaticAdjustment: { mild: "Reduce dose — enhanced response", moderate: "Avoid — significant bleeding risk", severe: "Contraindicated" },
      formularyTier: "FIRST_LINE",
      blackBoxWarnings: ["Major or fatal bleeding risk. Regular INR monitoring required.", "Tissue necrosis and/or gangrene (rare, usually within first few days)", "Teratogenic — contraindicated in pregnancy (Category X)"],
      contraindications: ["Pregnancy", "Active major bleeding", "Severe hepatic impairment", "Unsupervised patients with poor compliance"],
    },
  },
  {
    genericName: "Metformin",
    data: {
      pregnancyCategory: "B",
      maxDosePerDay: "2550mg (850mg TDS) or 2000mg (1000mg BD)",
      renalAdjustment: { mild: "No adjustment (eGFR 45-60)", moderate: "Reduce dose to max 1000mg/day (eGFR 30-45)", severe: "CONTRAINDICATED (eGFR <30)", dialysis: "Contraindicated — not removed by dialysis" },
      hepaticAdjustment: { mild: "Use with caution", moderate: "Avoid — lactic acidosis risk", severe: "Contraindicated" },
      formularyTier: "FIRST_LINE",
      contraindications: ["eGFR <30 ml/min", "Metabolic acidosis including DKA", "Conditions predisposing to tissue hypoxia (cardiac failure, respiratory failure)", "Acute alcohol intoxication", "Hepatic insufficiency"],
    },
  },
  {
    genericName: "Methotrexate",
    data: {
      pregnancyCategory: "X",
      isHighAlert: true,
      maxDosePerDay: "25mg once weekly (rheumatology); higher in oncology per protocol",
      blackBoxWarnings: [
        "ONCE WEEKLY dosing only for RA/psoriasis — daily dosing has caused fatal toxicity",
        "Hepatotoxicity including fibrosis and cirrhosis — monitor LFTs",
        "Bone marrow suppression — monitor FBC",
        "Pulmonary toxicity — potentially fatal pneumonitis",
        "Teratogenic — Category X. Contraception required during and 3 months after treatment",
        "Renal impairment increases toxicity risk significantly",
      ],
      renalAdjustment: { mild: "Reduce dose by 25-50%", moderate: "Reduce dose by 50-75% with close monitoring", severe: "Contraindicated", dialysis: "Contraindicated" },
      hepaticAdjustment: { mild: "Use with caution — monitor LFTs frequently", moderate: "Avoid", severe: "Contraindicated" },
      contraindications: ["Pregnancy and breastfeeding", "Significant hepatic impairment", "Significant renal impairment", "Pre-existing blood dyscrasias", "Active infection", "Immunodeficiency"],
    },
  },
  {
    genericName: "Insulin (Soluble/Regular)",
    data: {
      isHighAlert: true,
      contraindications: ["Hypoglycaemia"],
    },
  },
  {
    genericName: "Insulin (NPH/Isophane)",
    data: {
      isHighAlert: true,
      contraindications: ["Hypoglycaemia"],
    },
  },
  {
    genericName: "Insulin (Pre-mixed 70/30)",
    data: {
      isHighAlert: true,
      contraindications: ["Hypoglycaemia"],
    },
  },
  {
    genericName: "Insulin Glargine",
    data: {
      isHighAlert: true,
      contraindications: ["Hypoglycaemia"],
    },
  },
  {
    genericName: "Digoxin",
    data: {
      pregnancyCategory: "C",
      isHighAlert: true,
      maxDosePerDay: "0.25mg (0.125mg in elderly or renal impairment)",
      renalAdjustment: { mild: "0.125-0.25mg daily", moderate: "0.125mg daily or alternate days", severe: "0.0625-0.125mg daily; monitor levels closely", dialysis: "Not removed by dialysis; dose based on levels" },
      hepaticAdjustment: { mild: "No significant adjustment", moderate: "No significant adjustment — hepatic metabolism minimal", severe: "No significant adjustment" },
      contraindications: ["Hypertrophic obstructive cardiomyopathy", "Ventricular tachycardia/fibrillation", "Hypokalaemia (correct before use)", "Hypercalcaemia"],
    },
  },
  {
    genericName: "Gentamicin",
    data: {
      pregnancyCategory: "D",
      isHighAlert: true,
      maxDosePerDay: "5-7mg/kg once daily (adjusted body weight); reduce in renal impairment",
      renalAdjustment: { mild: "Extend dosing interval to 36h; monitor levels", moderate: "Extend to 48h; monitor trough levels", severe: "Use only if essential — single dose then levels to guide redosing", dialysis: "Supplemental dose after dialysis; monitor levels" },
      contraindications: ["Myasthenia gravis (relative)", "Known hypersensitivity"],
    },
  },
  {
    genericName: "Morphine",
    data: {
      pregnancyCategory: "C",
      isHighAlert: true,
      maxDosePerDay: "No absolute max — titrate to pain; typical 60-200mg/day oral",
      renalAdjustment: { mild: "Reduce dose by 25%", moderate: "Reduce dose by 50%; active metabolites accumulate", severe: "Avoid — use oxycodone or fentanyl (no active renal metabolites)", dialysis: "Avoid — metabolites accumulate" },
      hepaticAdjustment: { mild: "Reduce dose by 25-50%", moderate: "Reduce dose by 50-75%; increased sensitivity", severe: "Avoid or use with extreme caution" },
      contraindications: ["Respiratory depression", "Acute alcoholism", "Head injury with raised ICP", "Paralytic ileus"],
    },
  },
  {
    genericName: "Tramadol",
    data: {
      maxDosePerDay: "400mg (300mg in elderly)",
      renalAdjustment: { mild: "No adjustment", moderate: "200mg max/day; extend interval to 12-hourly", severe: "100mg max/day; avoid sustained release", dialysis: "100mg max; not removed by dialysis" },
      hepaticAdjustment: { mild: "No adjustment", moderate: "Reduce dose; avoid sustained release", severe: "Avoid" },
      contraindications: ["Uncontrolled epilepsy", "MAOIs or within 14 days of stopping", "Acute alcohol/sedative intoxication"],
    },
  },
  {
    genericName: "Potassium Chloride",
    data: {
      isHighAlert: true,
      blackBoxWarnings: ["IV potassium must ALWAYS be diluted before administration — undiluted IV push causes fatal cardiac arrest", "Maximum IV infusion rate: 10 mmol/hour via peripheral line; 20 mmol/hour via central line with cardiac monitoring"],
      contraindications: ["Hyperkalaemia", "Addison's disease (untreated)", "Severe renal impairment with oliguria"],
    },
  },
  {
    genericName: "Heparin (Unfractionated)",
    data: {
      isHighAlert: true,
      blackBoxWarnings: ["Risk of heparin-induced thrombocytopenia (HIT) — monitor platelet count", "Risk of major haemorrhage — monitor APTT"],
      contraindications: ["Active major bleeding", "Severe thrombocytopenia", "HIT history", "Severe uncontrolled hypertension"],
    },
  },
  {
    genericName: "Enoxaparin",
    data: {
      isHighAlert: true,
      renalAdjustment: { mild: "No adjustment", moderate: "Monitor anti-Xa levels", severe: "Reduce dose by 50% (1mg/kg once daily instead of twice daily) or use UFH", dialysis: "Use UFH instead" },
      blackBoxWarnings: ["Spinal/epidural haematoma risk with neuraxial anaesthesia — can cause permanent paralysis", "Do not use interchangeably with other LMWHs"],
      contraindications: ["Active major bleeding", "HIT history", "Severe renal impairment (relative — dose adjust)"],
    },
  },
  {
    genericName: "Amiodarone",
    data: {
      pregnancyCategory: "D",
      isHighAlert: true,
      blackBoxWarnings: [
        "Pulmonary toxicity (pneumonitis/fibrosis) — can be fatal. Baseline and annual chest X-ray and PFTs",
        "Hepatotoxicity — monitor LFTs at baseline and 6-monthly",
        "Thyroid dysfunction (both hypo- and hyperthyroidism) — monitor TFTs at baseline, 6-monthly, and 6 months after stopping",
        "QT prolongation and proarrhythmic effects",
        "Corneal microdeposits (nearly universal) — baseline and annual ophthalmology review",
        "Peripheral neuropathy — long-term use",
      ],
      contraindications: ["Sinus node disease", "2nd/3rd degree heart block (without pacemaker)", "Severe thyroid dysfunction", "Iodine sensitivity"],
    },
  },
  {
    genericName: "Phenytoin",
    data: {
      pregnancyCategory: "D",
      renalAdjustment: { mild: "No adjustment but monitor free levels", moderate: "Use free phenytoin levels (not total) — protein binding reduced", severe: "Use free levels; dose may need reduction", dialysis: "Not removed; use free levels" },
      hepaticAdjustment: { mild: "Reduce dose — increased free fraction", moderate: "Significant dose reduction; monitor free levels", severe: "Avoid — unpredictable pharmacokinetics" },
      blackBoxWarnings: ["IV phenytoin: cardiac arrhythmias and hypotension with rapid IV administration — max rate 50mg/min", "Purple glove syndrome with IV extravasation"],
      contraindications: ["Sinus bradycardia, SA block, 2nd/3rd degree heart block", "Stokes-Adams syndrome", "Porphyria"],
    },
  },
  {
    genericName: "Carbamazepine",
    data: {
      pregnancyCategory: "D",
      hepaticAdjustment: { mild: "Use with caution — monitor LFTs", moderate: "Reduce dose; monitor closely", severe: "Avoid" },
      blackBoxWarnings: [
        "Stevens-Johnson Syndrome (SJS) and Toxic Epidermal Necrolysis (TEN) — strongly associated with HLA-B*1502 allele (prevalent in Southeast/South Asian populations). Screen before initiating",
        "Aplastic anaemia and agranulocytosis — monitor FBC",
        "Hyponatraemia (SIADH) — monitor sodium, especially in elderly",
      ],
      contraindications: ["AV block", "History of bone marrow depression", "Porphyria", "MAOIs (within 14 days)"],
    },
  },
  {
    genericName: "Sodium Valproate",
    data: {
      pregnancyCategory: "X",
      blackBoxWarnings: [
        "TERATOGENICITY — major risk of neural tube defects (spina bifida), craniofacial, cardiac malformations (up to 10%). Contraindicated in pregnancy unless no alternative for epilepsy",
        "Fetal Valproate Syndrome — reduced IQ, autism spectrum disorder in exposed children",
        "Hepatotoxicity — fatal hepatic failure, especially in children <2 years on polytherapy. Monitor LFTs",
        "Pancreatitis — potentially fatal. Discontinue if pancreatitis diagnosed",
        "Pregnancy Prevention Programme mandatory for women of childbearing potential",
      ],
      hepaticAdjustment: { mild: "Use with caution — monitor LFTs", moderate: "Avoid — significant hepatotoxicity risk", severe: "Contraindicated" },
      contraindications: ["Active liver disease or family history of severe hepatic dysfunction", "Pregnancy (unless no suitable alternative for epilepsy and on PPP)", "Known mitochondrial disorder (POLG mutation)", "Porphyria"],
    },
  },
  {
    genericName: "Lithium Carbonate",
    data: {
      pregnancyCategory: "D",
      isHighAlert: true,
      maxDosePerDay: "Titrated to serum levels (target 0.6-0.8 mmol/L maintenance; 0.8-1.0 acute)",
      renalAdjustment: { mild: "Reduce dose; monitor levels more frequently", moderate: "Use with extreme caution; low dose with frequent monitoring", severe: "Contraindicated", dialysis: "Contraindicated for chronic use; dialysis removes lithium in overdose" },
      blackBoxWarnings: ["Narrow therapeutic index — toxicity can be fatal. Serum level monitoring mandatory", "Nephrogenic diabetes insipidus and chronic renal impairment with long-term use", "Thyroid dysfunction (hypothyroidism) — monitor TFTs"],
      contraindications: ["Severe renal impairment", "Addison's disease", "Brugada syndrome", "Conditions with sodium depletion"],
    },
  },
  // NSAIDs — pregnancyCategory
  {
    genericName: "Ibuprofen",
    data: {
      pregnancyCategory: "C",
      contraindications: ["3rd trimester pregnancy (Category D — premature ductus arteriosus closure)", "Active GI bleeding", "Severe renal impairment", "Severe heart failure"],
      geriatricNotes: "Increased GI bleeding, renal impairment, and cardiovascular risk. Use lowest dose for shortest duration.",
    },
  },
  {
    genericName: "Diclofenac",
    data: {
      pregnancyCategory: "C",
      contraindications: ["3rd trimester pregnancy (Category D)", "Active GI ulceration/bleeding", "Ischaemic heart disease, cerebrovascular disease, PAD", "Severe renal/hepatic impairment", "Severe heart failure"],
      geriatricNotes: "High GI and cardiovascular risk. Avoid in elderly if possible. Use topical preparation if NSAID needed.",
    },
  },
  {
    genericName: "Piroxicam",
    data: {
      pregnancyCategory: "C",
      contraindications: ["3rd trimester pregnancy (Category D)", "Active GI bleeding", "Inflammatory bowel disease"],
      geriatricNotes: "Long half-life increases risk of accumulation and adverse effects in elderly. Avoid.",
    },
  },
  {
    genericName: "Celecoxib",
    data: {
      pregnancyCategory: "C",
      contraindications: ["3rd trimester pregnancy (Category D)", "Sulfonamide allergy", "Ischaemic heart disease", "Active GI bleeding"],
    },
  },
  // Ciprofloxacin
  {
    genericName: "Ciprofloxacin",
    data: {
      pregnancyCategory: "C",
      paediatricDosing: { weightBased: "10-20mg/kg/day", maxPaed: "750mg/dose", minAge: "Generally avoided in <18 years due to arthropathy risk; can be used for serious infections where benefit outweighs risk" },
      contraindications: ["History of tendon disorder with fluoroquinolone use", "Concurrent tizanidine (CYP1A2 substrate)"],
    },
  },
  // Corticosteroids
  {
    genericName: "Prednisolone",
    data: {
      pregnancyCategory: "C",
      contraindications: ["Systemic fungal infection (relative)", "Live vaccines during immunosuppressive doses"],
    },
  },
  {
    genericName: "Dexamethasone",
    data: {
      pregnancyCategory: "C",
      contraindications: ["Systemic fungal infection (relative)", "Live vaccines during immunosuppressive doses"],
    },
  },
  {
    genericName: "Hydrocortisone",
    data: {
      pregnancyCategory: "C",
    },
  },
  // Misoprostol
  {
    genericName: "Misoprostol",
    data: {
      pregnancyCategory: "X",
      blackBoxWarnings: ["Contraindicated in pregnancy — causes uterine contractions, miscarriage, premature labour, birth defects", "Women of childbearing potential must have negative pregnancy test and use effective contraception"],
      contraindications: ["Pregnancy (unless used for obstetric indication under supervision)", "Known allergy to prostaglandins"],
    },
  },
  // Cyclophosphamide
  {
    genericName: "Cyclophosphamide",
    data: {
      pregnancyCategory: "D",
      isHighAlert: true,
      blackBoxWarnings: ["Haemorrhagic cystitis — ensure adequate hydration and mesna prophylaxis", "Immunosuppression with risk of serious infections", "Secondary malignancies with long-term use", "Gonadal toxicity — infertility risk"],
      renalAdjustment: { mild: "No adjustment", moderate: "Reduce dose by 25%", severe: "Reduce dose by 50%; monitor closely", dialysis: "Supplemental dose after dialysis" },
      hepaticAdjustment: { mild: "No adjustment", moderate: "Reduce dose", severe: "Avoid — reduced activation of prodrug and increased toxicity" },
      contraindications: ["Severe bone marrow depression", "Active UTI (haemorrhagic cystitis risk)", "Pregnancy"],
    },
  },
  // HIV ARVs — formularyTier
  {
    genericName: "Tenofovir/Lamivudine/Dolutegravir (TLD)",
    data: {
      formularyTier: "FIRST_LINE",
    },
  },
  {
    genericName: "Atazanavir/Ritonavir",
    data: {
      formularyTier: "SECOND_LINE",
    },
  },
  {
    genericName: "Lopinavir/Ritonavir",
    data: {
      formularyTier: "SECOND_LINE",
    },
  },
  {
    genericName: "Efavirenz",
    data: {
      pregnancyCategory: "D",
      formularyTier: "FIRST_LINE",
    },
  },
  {
    genericName: "Tenofovir/Emtricitabine",
    data: {
      formularyTier: "FIRST_LINE",
    },
  },
  // Aspirin
  {
    genericName: "Aspirin",
    data: {
      pregnancyCategory: "C",
      contraindications: ["3rd trimester pregnancy (Category D)", "Active GI bleeding", "Haemophilia and other bleeding disorders", "Children <16 years (Reye's syndrome risk — except Kawasaki disease)"],
    },
  },
  // Fluoxetine
  {
    genericName: "Fluoxetine",
    data: {
      pregnancyCategory: "C",
      blackBoxWarnings: ["Increased risk of suicidal thinking and behaviour in children, adolescents, and young adults (18-24 years)"],
    },
  },
  // Sertraline
  {
    genericName: "Sertraline",
    data: {
      pregnancyCategory: "C",
      blackBoxWarnings: ["Increased risk of suicidal thinking and behaviour in children, adolescents, and young adults"],
    },
  },
  // Amitriptyline
  {
    genericName: "Amitriptyline",
    data: {
      pregnancyCategory: "C",
      blackBoxWarnings: ["Increased risk of suicidal thinking and behaviour in children and young adults", "Overdose can be fatal — cardiotoxicity (wide QRS, arrhythmias)"],
      contraindications: ["Recent MI", "Heart block", "Mania", "Concurrent MAOIs"],
    },
  },
  // Haloperidol
  {
    genericName: "Haloperidol",
    data: {
      pregnancyCategory: "C",
      blackBoxWarnings: ["Increased mortality in elderly patients with dementia-related psychosis — not approved for this use"],
      contraindications: ["Comatose states", "CNS depression", "Parkinson's disease", "QT prolongation"],
    },
  },
  // Chlorpromazine
  {
    genericName: "Chlorpromazine",
    data: {
      pregnancyCategory: "C",
      blackBoxWarnings: ["Increased mortality in elderly patients with dementia-related psychosis"],
      contraindications: ["Comatose states", "CNS depression", "Phaeochromocytoma"],
    },
  },
  // Cisplatin
  {
    genericName: "Cisplatin",
    data: {
      pregnancyCategory: "D",
      isHighAlert: true,
      blackBoxWarnings: ["Cumulative nephrotoxicity — aggressive hydration with saline required", "Ototoxicity — irreversible hearing loss, especially high-frequency", "Severe nausea and vomiting — pre-medication with antiemetics mandatory", "Myelosuppression"],
    },
  },
  // Ergometrine
  {
    genericName: "Ergometrine",
    data: {
      pregnancyCategory: "X",
      contraindications: ["Hypertension", "Pre-eclampsia/eclampsia", "Cardiovascular disease", "Hepatic impairment", "Renal impairment", "First and second stages of labour (before delivery of placenta for PPH prevention)"],
    },
  },
  // Clopidogrel
  {
    genericName: "Clopidogrel",
    data: {
      pregnancyCategory: "B",
      contraindications: ["Active pathological bleeding", "Severe hepatic impairment"],
    },
  },
  // Furosemide
  {
    genericName: "Furosemide",
    data: {
      pregnancyCategory: "C",
      renalAdjustment: { mild: "No adjustment; higher doses may be needed", moderate: "Higher doses often required (80-250mg)", severe: "High doses may be required; monitor electrolytes closely", dialysis: "May be used; not removed by haemodialysis" },
    },
  },
  // Omeprazole
  {
    genericName: "Omeprazole",
    data: {
      pregnancyCategory: "C",
      geriatricNotes: "Long-term PPI use associated with osteoporosis, hypomagnesaemia, C. difficile infection, and vitamin B12 deficiency. Review ongoing need regularly.",
    },
  },
  // Magnesium Sulphate
  {
    genericName: "Magnesium Sulphate",
    data: {
      isHighAlert: true,
      blackBoxWarnings: ["Overdose causes respiratory depression, loss of reflexes, cardiac arrest", "Monitor patellar reflexes, respiratory rate, and urine output during infusion"],
      contraindications: ["Myasthenia gravis", "Heart block"],
    },
  },
];

// ============================================
// MAIN SEED FUNCTION
// ============================================

async function main() {
  console.log("Starting clinical decision support seed...\n");

  // ---- STEP 1: Seed TherapeuticClass hierarchy ----
  console.log("=== Step 1: Seeding TherapeuticClass hierarchy ===");
  let classCount = 0;

  for (const [category, children] of Object.entries(therapeuticClassHierarchy)) {
    // Create or find parent
    const parent = await prisma.therapeuticClass.upsert({
      where: { name: category },
      update: {},
      create: {
        name: category,
        category,
        description: `${category} therapeutic class`,
      },
    });

    // Create children
    for (const childName of children) {
      await prisma.therapeuticClass.upsert({
        where: { name: childName },
        update: { parentId: parent.id, category },
        create: {
          name: childName,
          category,
          parentId: parent.id,
        },
      });
      classCount++;
    }
  }

  const parentCount = Object.keys(therapeuticClassHierarchy).length;
  console.log(`  Created/verified ${parentCount} parent classes and ${classCount} child classes`);

  // ---- STEP 2: Seed DrugInteraction records ----
  console.log("\n=== Step 2: Seeding DrugInteraction records ===");

  // Build a lookup map of genericName -> id for all FormularyDrugs
  const allDrugs = await prisma.formularyDrug.findMany({
    select: { id: true, genericName: true },
  });
  const drugMap = new Map<string, string>();
  for (const d of allDrugs) {
    drugMap.set(d.genericName, d.id);
  }
  console.log(`  Found ${allDrugs.length} drugs in formulary`);

  let interactionCount = 0;
  let skippedCount = 0;

  for (const ix of interactions) {
    const drugAId = drugMap.get(ix.drugA);
    const drugBId = drugMap.get(ix.drugB);

    if (!drugAId) {
      console.warn(`  [SKIP] Drug A not found in formulary: "${ix.drugA}"`);
      skippedCount++;
      continue;
    }
    if (!drugBId) {
      console.warn(`  [SKIP] Drug B not found in formulary: "${ix.drugB}"`);
      skippedCount++;
      continue;
    }

    // Ensure consistent ordering (alphabetical by ID) to avoid duplicate pairs
    const [orderedAId, orderedBId] = drugAId < drugBId ? [drugAId, drugBId] : [drugBId, drugAId];

    try {
      await prisma.drugInteraction.upsert({
        where: {
          drugAId_drugBId: { drugAId: orderedAId, drugBId: orderedBId },
        },
        update: {
          severity: ix.severity,
          mechanism: ix.mechanism,
          clinicalEffect: ix.clinicalEffect,
          management: ix.management,
          evidence: ix.evidence,
          source: ix.source,
        },
        create: {
          drugAId: orderedAId,
          drugBId: orderedBId,
          severity: ix.severity,
          mechanism: ix.mechanism,
          clinicalEffect: ix.clinicalEffect,
          management: ix.management,
          evidence: ix.evidence,
          source: ix.source,
        },
      });
      interactionCount++;
    } catch (err) {
      console.error(`  [ERROR] Failed to upsert interaction ${ix.drugA} + ${ix.drugB}:`, err);
    }
  }

  console.log(`  Created/updated ${interactionCount} interactions (${skippedCount} skipped — drugs not in formulary)`);

  // ---- STEP 3: Update FormularyDrug clinical fields ----
  console.log("\n=== Step 3: Updating FormularyDrug clinical fields ===");
  let updateCount = 0;
  let updateSkipped = 0;

  for (const update of drugUpdates) {
    const drug = await prisma.formularyDrug.findFirst({
      where: { genericName: update.genericName },
    });

    if (!drug) {
      console.warn(`  [SKIP] Drug not found for update: "${update.genericName}"`);
      updateSkipped++;
      continue;
    }

    await prisma.formularyDrug.update({
      where: { id: drug.id },
      data: update.data,
    });
    updateCount++;
  }

  console.log(`  Updated ${updateCount} drugs (${updateSkipped} skipped — not in formulary)`);

  // ---- Summary ----
  console.log("\n=== Seed Complete ===");
  console.log(`  TherapeuticClass: ${parentCount} parents + ${classCount} children`);
  console.log(`  DrugInteractions: ${interactionCount} created/updated, ${skippedCount} skipped`);
  console.log(`  FormularyDrug updates: ${updateCount} updated, ${updateSkipped} skipped`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
