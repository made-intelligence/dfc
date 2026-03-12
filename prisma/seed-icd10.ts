import { PrismaClient } from "@prisma/client";

const codes = [
  // ===== A00-B99: INFECTIOUS DISEASES =====
  { code: "A00", name: "Cholera", chapter: "I — Certain infectious and parasitic diseases", block: "A00-A09", isNigerianTop: true, nigeriaWeighting: 60, isDSM5: false, searchTerms: "cholera,vibrio" },
  { code: "A01.0", name: "Typhoid fever", chapter: "I — Certain infectious and parasitic diseases", block: "A00-A09", isNigerianTop: true, nigeriaWeighting: 95, isDSM5: false, searchTerms: "typhoid,salmonella typhi,enteric fever" },
  { code: "A01.4", name: "Paratyphoid fever, unspecified", chapter: "I — Certain infectious and parasitic diseases", block: "A00-A09", isNigerianTop: true, nigeriaWeighting: 70, isDSM5: false, searchTerms: "paratyphoid" },
  { code: "A04.7", name: "Enterocolitis due to Clostridioides difficile", chapter: "I — Certain infectious and parasitic diseases", block: "A00-A09", isNigerianTop: false, nigeriaWeighting: 30, isDSM5: false, searchTerms: "c diff,cdiff,pseudomembranous colitis" },
  { code: "A06", name: "Amoebiasis", chapter: "I — Certain infectious and parasitic diseases", block: "A00-A09", isNigerianTop: true, nigeriaWeighting: 75, isDSM5: false, searchTerms: "amoeba,entamoeba,amoebic dysentery" },
  { code: "A09", name: "Infectious gastroenteritis and colitis, unspecified", chapter: "I — Certain infectious and parasitic diseases", block: "A00-A09", isNigerianTop: true, nigeriaWeighting: 90, isDSM5: false, searchTerms: "gastroenteritis,diarrhoea,diarrhea,AGE" },
  { code: "A15", name: "Respiratory tuberculosis", chapter: "I — Certain infectious and parasitic diseases", block: "A15-A19", isNigerianTop: true, nigeriaWeighting: 85, isDSM5: false, searchTerms: "TB,tuberculosis,PTB,pulmonary TB" },
  { code: "A16", name: "Respiratory tuberculosis, not confirmed bacteriologically", chapter: "I — Certain infectious and parasitic diseases", block: "A15-A19", isNigerianTop: true, nigeriaWeighting: 75, isDSM5: false, searchTerms: "TB,tuberculosis" },
  { code: "A38", name: "Scarlet fever", chapter: "I — Certain infectious and parasitic diseases", block: "A30-A49", isNigerianTop: false, nigeriaWeighting: 20, isDSM5: false, searchTerms: "scarlet fever,scarlatina" },
  { code: "A46", name: "Erysipelas", chapter: "I — Certain infectious and parasitic diseases", block: "A30-A49", isNigerianTop: false, nigeriaWeighting: 30, isDSM5: false, searchTerms: "erysipelas,skin infection" },
  { code: "A90", name: "Dengue fever", chapter: "I — Certain infectious and parasitic diseases", block: "A90-A99", isNigerianTop: false, nigeriaWeighting: 40, isDSM5: false, searchTerms: "dengue,dengue fever" },
  { code: "B02", name: "Zoster (herpes zoster)", chapter: "I — Certain infectious and parasitic diseases", block: "B00-B09", isNigerianTop: false, nigeriaWeighting: 40, isDSM5: false, searchTerms: "shingles,herpes zoster,zoster" },
  { code: "B15", name: "Acute hepatitis A", chapter: "I — Certain infectious and parasitic diseases", block: "B15-B19", isNigerianTop: true, nigeriaWeighting: 65, isDSM5: false, searchTerms: "hepatitis A,hep A,HAV" },
  { code: "B16", name: "Acute hepatitis B", chapter: "I — Certain infectious and parasitic diseases", block: "B15-B19", isNigerianTop: true, nigeriaWeighting: 85, isDSM5: false, searchTerms: "hepatitis B,hep B,HBV" },
  { code: "B17.1", name: "Acute hepatitis C", chapter: "I — Certain infectious and parasitic diseases", block: "B15-B19", isNigerianTop: true, nigeriaWeighting: 80, isDSM5: false, searchTerms: "hepatitis C,hep C,HCV" },
  { code: "B18.0", name: "Chronic viral hepatitis B with delta-agent", chapter: "I — Certain infectious and parasitic diseases", block: "B15-B19", isNigerianTop: true, nigeriaWeighting: 75, isDSM5: false, searchTerms: "chronic hepatitis B,chronic HBV" },
  { code: "B18.1", name: "Chronic viral hepatitis B without delta-agent", chapter: "I — Certain infectious and parasitic diseases", block: "B15-B19", isNigerianTop: true, nigeriaWeighting: 85, isDSM5: false, searchTerms: "chronic hepatitis B,chronic HBV" },
  { code: "B18.2", name: "Chronic viral hepatitis C", chapter: "I — Certain infectious and parasitic diseases", block: "B15-B19", isNigerianTop: true, nigeriaWeighting: 80, isDSM5: false, searchTerms: "chronic hepatitis C,chronic HCV" },
  { code: "B19", name: "Unspecified viral hepatitis", chapter: "I — Certain infectious and parasitic diseases", block: "B15-B19", isNigerianTop: true, nigeriaWeighting: 70, isDSM5: false, searchTerms: "hepatitis,viral hepatitis" },
  { code: "B20", name: "Human immunodeficiency virus [HIV] disease", chapter: "I — Certain infectious and parasitic diseases", block: "B20-B24", isNigerianTop: true, nigeriaWeighting: 90, isDSM5: false, searchTerms: "HIV,AIDS,human immunodeficiency virus,retroviral disease" },
  { code: "B24", name: "Unspecified human immunodeficiency virus [HIV] disease", chapter: "I — Certain infectious and parasitic diseases", block: "B20-B24", isNigerianTop: true, nigeriaWeighting: 85, isDSM5: false, searchTerms: "HIV,AIDS" },
  { code: "B35", name: "Dermatophytosis", chapter: "I — Certain infectious and parasitic diseases", block: "B35-B49", isNigerianTop: true, nigeriaWeighting: 60, isDSM5: false, searchTerms: "ringworm,tinea,dermatophyte,fungal skin" },
  { code: "B37", name: "Candidiasis", chapter: "I — Certain infectious and parasitic diseases", block: "B35-B49", isNigerianTop: true, nigeriaWeighting: 65, isDSM5: false, searchTerms: "candida,thrush,yeast infection,candidiasis" },
  { code: "B50", name: "Plasmodium falciparum malaria", chapter: "I — Certain infectious and parasitic diseases", block: "B50-B64", isNigerianTop: true, nigeriaWeighting: 100, isDSM5: false, searchTerms: "malaria,falciparum,MP,plasmodium" },
  { code: "B51", name: "Plasmodium vivax malaria", chapter: "I — Certain infectious and parasitic diseases", block: "B50-B64", isNigerianTop: true, nigeriaWeighting: 70, isDSM5: false, searchTerms: "malaria,vivax" },
  { code: "B54", name: "Unspecified malaria", chapter: "I — Certain infectious and parasitic diseases", block: "B50-B64", isNigerianTop: true, nigeriaWeighting: 95, isDSM5: false, searchTerms: "malaria,MP,unspecified malaria" },

  // ===== C00-D48: NEOPLASMS =====
  { code: "C16", name: "Malignant neoplasm of stomach", chapter: "II — Neoplasms", block: "C15-C26", isNigerianTop: true, nigeriaWeighting: 50, isDSM5: false, searchTerms: "stomach cancer,gastric cancer" },
  { code: "C18", name: "Malignant neoplasm of colon", chapter: "II — Neoplasms", block: "C15-C26", isNigerianTop: true, nigeriaWeighting: 55, isDSM5: false, searchTerms: "colon cancer,colorectal cancer,CRC" },
  { code: "C20", name: "Malignant neoplasm of rectum", chapter: "II — Neoplasms", block: "C15-C26", isNigerianTop: true, nigeriaWeighting: 50, isDSM5: false, searchTerms: "rectal cancer,colorectal" },
  { code: "C22", name: "Malignant neoplasm of liver and intrahepatic bile ducts", chapter: "II — Neoplasms", block: "C15-C26", isNigerianTop: true, nigeriaWeighting: 65, isDSM5: false, searchTerms: "liver cancer,hepatocellular carcinoma,HCC" },
  { code: "C34", name: "Malignant neoplasm of bronchus and lung", chapter: "II — Neoplasms", block: "C30-C39", isNigerianTop: true, nigeriaWeighting: 55, isDSM5: false, searchTerms: "lung cancer,bronchial carcinoma" },
  { code: "C50", name: "Malignant neoplasm of breast", chapter: "II — Neoplasms", block: "C50", isNigerianTop: true, nigeriaWeighting: 70, isDSM5: false, searchTerms: "breast cancer,mammary carcinoma" },
  { code: "C53", name: "Malignant neoplasm of cervix uteri", chapter: "II — Neoplasms", block: "C51-C58", isNigerianTop: true, nigeriaWeighting: 70, isDSM5: false, searchTerms: "cervical cancer,cervix cancer" },
  { code: "C56", name: "Malignant neoplasm of ovary", chapter: "II — Neoplasms", block: "C51-C58", isNigerianTop: true, nigeriaWeighting: 55, isDSM5: false, searchTerms: "ovarian cancer" },
  { code: "C61", name: "Malignant neoplasm of prostate", chapter: "II — Neoplasms", block: "C60-C63", isNigerianTop: true, nigeriaWeighting: 65, isDSM5: false, searchTerms: "prostate cancer,prostatic carcinoma" },
  { code: "C67", name: "Malignant neoplasm of bladder", chapter: "II — Neoplasms", block: "C64-C68", isNigerianTop: false, nigeriaWeighting: 40, isDSM5: false, searchTerms: "bladder cancer" },
  { code: "C73", name: "Malignant neoplasm of thyroid gland", chapter: "II — Neoplasms", block: "C73-C75", isNigerianTop: false, nigeriaWeighting: 45, isDSM5: false, searchTerms: "thyroid cancer" },
  { code: "D25", name: "Leiomyoma of uterus", chapter: "II — Neoplasms", block: "D10-D36", isNigerianTop: true, nigeriaWeighting: 80, isDSM5: false, searchTerms: "fibroids,uterine fibroids,myoma,leiomyoma" },

  // ===== D50-D89: BLOOD DISEASES =====
  { code: "D50", name: "Iron deficiency anaemia", chapter: "III — Diseases of the blood", block: "D50-D53", isNigerianTop: true, nigeriaWeighting: 90, isDSM5: false, searchTerms: "anaemia,anemia,iron deficiency,IDA" },
  { code: "D56", name: "Thalassaemia", chapter: "III — Diseases of the blood", block: "D55-D59", isNigerianTop: false, nigeriaWeighting: 35, isDSM5: false, searchTerms: "thalassemia,thalassaemia" },
  { code: "D57", name: "Sickle-cell disorders", chapter: "III — Diseases of the blood", block: "D55-D59", isNigerianTop: true, nigeriaWeighting: 95, isDSM5: false, searchTerms: "sickle cell,SCD,SCA,HbSS,sickle cell disease,sickle cell anaemia" },
  { code: "D57.0", name: "Sickle-cell anaemia with crisis", chapter: "III — Diseases of the blood", block: "D55-D59", isNigerianTop: true, nigeriaWeighting: 90, isDSM5: false, searchTerms: "sickle cell crisis,VOC,vaso-occlusive" },
  { code: "D64", name: "Other anaemias", chapter: "III — Diseases of the blood", block: "D60-D64", isNigerianTop: true, nigeriaWeighting: 75, isDSM5: false, searchTerms: "anaemia,anemia" },
  { code: "D65", name: "Disseminated intravascular coagulation", chapter: "III — Diseases of the blood", block: "D65-D69", isNigerianTop: false, nigeriaWeighting: 45, isDSM5: false, searchTerms: "DIC,coagulopathy" },
  { code: "D68", name: "Other coagulation defects", chapter: "III — Diseases of the blood", block: "D65-D69", isNigerianTop: false, nigeriaWeighting: 35, isDSM5: false, searchTerms: "coagulation defect,bleeding disorder" },

  // ===== E00-E90: ENDOCRINE =====
  { code: "E03", name: "Other hypothyroidism", chapter: "IV — Endocrine, nutritional and metabolic diseases", block: "E00-E07", isNigerianTop: true, nigeriaWeighting: 70, isDSM5: false, searchTerms: "hypothyroidism,underactive thyroid,low thyroid" },
  { code: "E05", name: "Thyrotoxicosis (hyperthyroidism)", chapter: "IV — Endocrine, nutritional and metabolic diseases", block: "E00-E07", isNigerianTop: true, nigeriaWeighting: 65, isDSM5: false, searchTerms: "hyperthyroidism,thyrotoxicosis,overactive thyroid,Graves" },
  { code: "E10", name: "Type 1 diabetes mellitus", chapter: "IV — Endocrine, nutritional and metabolic diseases", block: "E10-E14", isNigerianTop: true, nigeriaWeighting: 80, isDSM5: false, searchTerms: "type 1 diabetes,T1DM,insulin dependent,IDDM" },
  { code: "E11", name: "Type 2 diabetes mellitus", chapter: "IV — Endocrine, nutritional and metabolic diseases", block: "E10-E14", isNigerianTop: true, nigeriaWeighting: 95, isDSM5: false, searchTerms: "type 2 diabetes,T2DM,NIDDM,diabetes,sugar,DM" },
  { code: "E11.5", name: "Type 2 diabetes mellitus with peripheral circulatory complications", chapter: "IV — Endocrine, nutritional and metabolic diseases", block: "E10-E14", isNigerianTop: true, nigeriaWeighting: 70, isDSM5: false, searchTerms: "diabetic foot,peripheral vascular" },
  { code: "E11.7", name: "Type 2 diabetes mellitus with multiple complications", chapter: "IV — Endocrine, nutritional and metabolic diseases", block: "E10-E14", isNigerianTop: true, nigeriaWeighting: 75, isDSM5: false, searchTerms: "diabetes complications" },
  { code: "E66", name: "Obesity", chapter: "IV — Endocrine, nutritional and metabolic diseases", block: "E65-E68", isNigerianTop: true, nigeriaWeighting: 65, isDSM5: false, searchTerms: "obesity,overweight,BMI" },
  { code: "E78", name: "Disorders of lipoprotein metabolism and other lipidaemias", chapter: "IV — Endocrine, nutritional and metabolic diseases", block: "E70-E90", isNigerianTop: true, nigeriaWeighting: 75, isDSM5: false, searchTerms: "hyperlipidaemia,hypercholesterolaemia,dyslipidaemia,high cholesterol" },
  { code: "E86", name: "Volume depletion (dehydration)", chapter: "IV — Endocrine, nutritional and metabolic diseases", block: "E70-E90", isNigerianTop: true, nigeriaWeighting: 80, isDSM5: false, searchTerms: "dehydration,volume depletion" },
  { code: "E87", name: "Other disorders of fluid, electrolyte and acid-base balance", chapter: "IV — Endocrine, nutritional and metabolic diseases", block: "E70-E90", isNigerianTop: true, nigeriaWeighting: 70, isDSM5: false, searchTerms: "electrolyte imbalance,hypokalaemia,hyponatraemia" },

  // ===== F00-F99: MENTAL DISORDERS (isDSM5: true) =====
  { code: "F10", name: "Mental and behavioural disorders due to use of alcohol", chapter: "V — Mental and behavioural disorders", block: "F10-F19", isNigerianTop: true, nigeriaWeighting: 55, isDSM5: true, searchTerms: "alcoholism,alcohol use disorder,AUD,alcohol dependence" },
  { code: "F11", name: "Mental and behavioural disorders due to use of opioids", chapter: "V — Mental and behavioural disorders", block: "F10-F19", isNigerianTop: false, nigeriaWeighting: 40, isDSM5: true, searchTerms: "opioid use,tramadol abuse,codeine abuse" },
  { code: "F12", name: "Mental and behavioural disorders due to use of cannabinoids", chapter: "V — Mental and behavioural disorders", block: "F10-F19", isNigerianTop: true, nigeriaWeighting: 50, isDSM5: true, searchTerms: "cannabis use,marijuana" },
  { code: "F20", name: "Schizophrenia", chapter: "V — Mental and behavioural disorders", block: "F20-F29", isNigerianTop: true, nigeriaWeighting: 60, isDSM5: true, searchTerms: "schizophrenia,psychosis,psychotic" },
  { code: "F31", name: "Bipolar affective disorder", chapter: "V — Mental and behavioural disorders", block: "F30-F39", isNigerianTop: true, nigeriaWeighting: 55, isDSM5: true, searchTerms: "bipolar,manic depression,mania" },
  { code: "F32", name: "Depressive episode", chapter: "V — Mental and behavioural disorders", block: "F30-F39", isNigerianTop: true, nigeriaWeighting: 70, isDSM5: true, searchTerms: "depression,depressive episode,MDD,major depression" },
  { code: "F33", name: "Recurrent depressive disorder", chapter: "V — Mental and behavioural disorders", block: "F30-F39", isNigerianTop: true, nigeriaWeighting: 65, isDSM5: true, searchTerms: "recurrent depression,chronic depression" },
  { code: "F40", name: "Phobic anxiety disorders", chapter: "V — Mental and behavioural disorders", block: "F40-F48", isNigerianTop: false, nigeriaWeighting: 35, isDSM5: true, searchTerms: "phobia,social phobia,agoraphobia" },
  { code: "F41.0", name: "Panic disorder", chapter: "V — Mental and behavioural disorders", block: "F40-F48", isNigerianTop: true, nigeriaWeighting: 50, isDSM5: true, searchTerms: "panic attack,panic disorder" },
  { code: "F41.1", name: "Generalized anxiety disorder", chapter: "V — Mental and behavioural disorders", block: "F40-F48", isNigerianTop: true, nigeriaWeighting: 65, isDSM5: true, searchTerms: "GAD,anxiety,generalised anxiety,generalized anxiety" },
  { code: "F42", name: "Obsessive-compulsive disorder", chapter: "V — Mental and behavioural disorders", block: "F40-F48", isNigerianTop: false, nigeriaWeighting: 40, isDSM5: true, searchTerms: "OCD,obsessive compulsive" },
  { code: "F43.1", name: "Post-traumatic stress disorder", chapter: "V — Mental and behavioural disorders", block: "F40-F48", isNigerianTop: true, nigeriaWeighting: 50, isDSM5: true, searchTerms: "PTSD,post traumatic stress,trauma" },
  { code: "F50", name: "Eating disorders", chapter: "V — Mental and behavioural disorders", block: "F50-F59", isNigerianTop: false, nigeriaWeighting: 30, isDSM5: true, searchTerms: "anorexia,bulimia,eating disorder" },
  { code: "F60", name: "Specific personality disorders", chapter: "V — Mental and behavioural disorders", block: "F60-F69", isNigerianTop: false, nigeriaWeighting: 35, isDSM5: true, searchTerms: "personality disorder,BPD,borderline" },
  { code: "F84.0", name: "Childhood autism", chapter: "V — Mental and behavioural disorders", block: "F80-F89", isNigerianTop: true, nigeriaWeighting: 45, isDSM5: true, searchTerms: "autism,ASD,autistic spectrum" },
  { code: "F90", name: "Hyperkinetic disorders (ADHD)", chapter: "V — Mental and behavioural disorders", block: "F90-F98", isNigerianTop: true, nigeriaWeighting: 45, isDSM5: true, searchTerms: "ADHD,attention deficit,hyperactivity" },

  // ===== G00-G99: NERVOUS SYSTEM =====
  { code: "G20", name: "Parkinson disease", chapter: "VI — Diseases of the nervous system", block: "G20-G26", isNigerianTop: false, nigeriaWeighting: 40, isDSM5: false, searchTerms: "Parkinson,parkinsonism,PD" },
  { code: "G35", name: "Multiple sclerosis", chapter: "VI — Diseases of the nervous system", block: "G35-G37", isNigerianTop: false, nigeriaWeighting: 30, isDSM5: false, searchTerms: "MS,multiple sclerosis" },
  { code: "G40", name: "Epilepsy", chapter: "VI — Diseases of the nervous system", block: "G40-G47", isNigerianTop: true, nigeriaWeighting: 70, isDSM5: false, searchTerms: "epilepsy,seizure,convulsion,fits" },
  { code: "G43", name: "Migraine", chapter: "VI — Diseases of the nervous system", block: "G40-G47", isNigerianTop: true, nigeriaWeighting: 60, isDSM5: false, searchTerms: "migraine,headache" },
  { code: "G61", name: "Inflammatory polyneuropathy (Guillain-Barré)", chapter: "VI — Diseases of the nervous system", block: "G60-G64", isNigerianTop: false, nigeriaWeighting: 35, isDSM5: false, searchTerms: "GBS,Guillain-Barre,polyneuropathy" },

  // ===== H00-H59: EYE =====
  { code: "H10", name: "Conjunctivitis", chapter: "VII — Diseases of the eye", block: "H10-H13", isNigerianTop: true, nigeriaWeighting: 70, isDSM5: false, searchTerms: "conjunctivitis,pink eye,red eye,apollo" },
  { code: "H25", name: "Senile cataract", chapter: "VII — Diseases of the eye", block: "H25-H28", isNigerianTop: true, nigeriaWeighting: 60, isDSM5: false, searchTerms: "cataract" },
  { code: "H40", name: "Glaucoma", chapter: "VII — Diseases of the eye", block: "H40-H42", isNigerianTop: true, nigeriaWeighting: 60, isDSM5: false, searchTerms: "glaucoma,raised IOP" },

  // ===== I00-I99: CIRCULATORY =====
  { code: "I10", name: "Essential (primary) hypertension", chapter: "IX — Diseases of the circulatory system", block: "I10-I16", isNigerianTop: true, nigeriaWeighting: 100, isDSM5: false, searchTerms: "hypertension,high blood pressure,BP,HBP,HTN" },
  { code: "I11", name: "Hypertensive heart disease", chapter: "IX — Diseases of the circulatory system", block: "I10-I16", isNigerianTop: true, nigeriaWeighting: 80, isDSM5: false, searchTerms: "hypertensive heart disease,HHD" },
  { code: "I20", name: "Angina pectoris", chapter: "IX — Diseases of the circulatory system", block: "I20-I25", isNigerianTop: true, nigeriaWeighting: 65, isDSM5: false, searchTerms: "angina,chest pain,cardiac" },
  { code: "I21", name: "Acute myocardial infarction", chapter: "IX — Diseases of the circulatory system", block: "I20-I25", isNigerianTop: true, nigeriaWeighting: 75, isDSM5: false, searchTerms: "MI,heart attack,myocardial infarction,AMI,STEMI,NSTEMI" },
  { code: "I25", name: "Chronic ischaemic heart disease", chapter: "IX — Diseases of the circulatory system", block: "I20-I25", isNigerianTop: true, nigeriaWeighting: 65, isDSM5: false, searchTerms: "IHD,ischaemic heart,coronary artery disease,CAD" },
  { code: "I26", name: "Pulmonary embolism", chapter: "IX — Diseases of the circulatory system", block: "I26-I28", isNigerianTop: true, nigeriaWeighting: 55, isDSM5: false, searchTerms: "PE,pulmonary embolism,DVT complication" },
  { code: "I48", name: "Atrial fibrillation and flutter", chapter: "IX — Diseases of the circulatory system", block: "I44-I49", isNigerianTop: true, nigeriaWeighting: 60, isDSM5: false, searchTerms: "AF,atrial fibrillation,afib,arrhythmia" },
  { code: "I50", name: "Heart failure", chapter: "IX — Diseases of the circulatory system", block: "I50-I52", isNigerianTop: true, nigeriaWeighting: 85, isDSM5: false, searchTerms: "heart failure,CHF,CCF,congestive heart failure" },
  { code: "I63", name: "Cerebral infarction", chapter: "IX — Diseases of the circulatory system", block: "I60-I69", isNigerianTop: true, nigeriaWeighting: 75, isDSM5: false, searchTerms: "stroke,cerebral infarction,CVA,ischaemic stroke" },
  { code: "I64", name: "Stroke, not specified as haemorrhage or infarction", chapter: "IX — Diseases of the circulatory system", block: "I60-I69", isNigerianTop: true, nigeriaWeighting: 80, isDSM5: false, searchTerms: "stroke,CVA,cerebrovascular accident" },
  { code: "I67", name: "Other cerebrovascular diseases", chapter: "IX — Diseases of the circulatory system", block: "I60-I69", isNigerianTop: true, nigeriaWeighting: 60, isDSM5: false, searchTerms: "cerebrovascular disease" },
  { code: "I70", name: "Atherosclerosis", chapter: "IX — Diseases of the circulatory system", block: "I70-I79", isNigerianTop: true, nigeriaWeighting: 55, isDSM5: false, searchTerms: "atherosclerosis,peripheral vascular disease,PVD" },
  { code: "I80", name: "Phlebitis and thrombophlebitis", chapter: "IX — Diseases of the circulatory system", block: "I80-I89", isNigerianTop: true, nigeriaWeighting: 55, isDSM5: false, searchTerms: "DVT,deep vein thrombosis,phlebitis" },
  { code: "I83", name: "Varicose veins of lower extremities", chapter: "IX — Diseases of the circulatory system", block: "I80-I89", isNigerianTop: false, nigeriaWeighting: 40, isDSM5: false, searchTerms: "varicose veins" },

  // ===== J00-J99: RESPIRATORY =====
  { code: "J03", name: "Acute tonsillitis", chapter: "X — Diseases of the respiratory system", block: "J00-J06", isNigerianTop: true, nigeriaWeighting: 75, isDSM5: false, searchTerms: "tonsillitis,sore throat" },
  { code: "J06", name: "Acute upper respiratory infections of multiple and unspecified sites", chapter: "X — Diseases of the respiratory system", block: "J00-J06", isNigerianTop: true, nigeriaWeighting: 90, isDSM5: false, searchTerms: "URTI,upper respiratory infection,cold,coryza" },
  { code: "J11", name: "Influenza, virus not identified", chapter: "X — Diseases of the respiratory system", block: "J09-J18", isNigerianTop: true, nigeriaWeighting: 70, isDSM5: false, searchTerms: "flu,influenza" },
  { code: "J18", name: "Pneumonia, organism unspecified", chapter: "X — Diseases of the respiratory system", block: "J09-J18", isNigerianTop: true, nigeriaWeighting: 85, isDSM5: false, searchTerms: "pneumonia,chest infection,LRTI" },
  { code: "J20", name: "Acute bronchitis", chapter: "X — Diseases of the respiratory system", block: "J20-J22", isNigerianTop: true, nigeriaWeighting: 75, isDSM5: false, searchTerms: "bronchitis,acute bronchitis" },
  { code: "J35", name: "Chronic diseases of tonsils and adenoids", chapter: "X — Diseases of the respiratory system", block: "J30-J39", isNigerianTop: true, nigeriaWeighting: 60, isDSM5: false, searchTerms: "chronic tonsillitis,adenoid hypertrophy" },
  { code: "J44", name: "Other chronic obstructive pulmonary disease", chapter: "X — Diseases of the respiratory system", block: "J40-J47", isNigerianTop: true, nigeriaWeighting: 60, isDSM5: false, searchTerms: "COPD,chronic obstructive,emphysema" },
  { code: "J45", name: "Asthma", chapter: "X — Diseases of the respiratory system", block: "J40-J47", isNigerianTop: true, nigeriaWeighting: 80, isDSM5: false, searchTerms: "asthma,bronchial asthma,wheeze" },

  // ===== K00-K93: DIGESTIVE =====
  { code: "K21", name: "Gastro-oesophageal reflux disease", chapter: "XI — Diseases of the digestive system", block: "K20-K31", isNigerianTop: true, nigeriaWeighting: 70, isDSM5: false, searchTerms: "GORD,GERD,acid reflux,heartburn" },
  { code: "K25", name: "Gastric ulcer", chapter: "XI — Diseases of the digestive system", block: "K20-K31", isNigerianTop: true, nigeriaWeighting: 75, isDSM5: false, searchTerms: "stomach ulcer,gastric ulcer,PUD" },
  { code: "K26", name: "Duodenal ulcer", chapter: "XI — Diseases of the digestive system", block: "K20-K31", isNigerianTop: true, nigeriaWeighting: 75, isDSM5: false, searchTerms: "duodenal ulcer,DU,PUD" },
  { code: "K29", name: "Gastritis and duodenitis", chapter: "XI — Diseases of the digestive system", block: "K20-K31", isNigerianTop: true, nigeriaWeighting: 80, isDSM5: false, searchTerms: "gastritis,stomach inflammation" },
  { code: "K35", name: "Acute appendicitis", chapter: "XI — Diseases of the digestive system", block: "K35-K38", isNigerianTop: true, nigeriaWeighting: 80, isDSM5: false, searchTerms: "appendicitis,appendix" },
  { code: "K40", name: "Inguinal hernia", chapter: "XI — Diseases of the digestive system", block: "K40-K46", isNigerianTop: true, nigeriaWeighting: 70, isDSM5: false, searchTerms: "inguinal hernia,groin hernia" },
  { code: "K50", name: "Crohn disease", chapter: "XI — Diseases of the digestive system", block: "K50-K52", isNigerianTop: false, nigeriaWeighting: 35, isDSM5: false, searchTerms: "Crohn,IBD,inflammatory bowel" },
  { code: "K51", name: "Ulcerative colitis", chapter: "XI — Diseases of the digestive system", block: "K50-K52", isNigerianTop: false, nigeriaWeighting: 40, isDSM5: false, searchTerms: "ulcerative colitis,UC,IBD" },
  { code: "K70", name: "Alcoholic liver disease", chapter: "XI — Diseases of the digestive system", block: "K70-K77", isNigerianTop: true, nigeriaWeighting: 55, isDSM5: false, searchTerms: "alcoholic liver,ALD" },
  { code: "K74", name: "Fibrosis and cirrhosis of liver", chapter: "XI — Diseases of the digestive system", block: "K70-K77", isNigerianTop: true, nigeriaWeighting: 65, isDSM5: false, searchTerms: "cirrhosis,liver fibrosis,chronic liver disease,CLD" },
  { code: "K80", name: "Cholelithiasis", chapter: "XI — Diseases of the digestive system", block: "K80-K87", isNigerianTop: true, nigeriaWeighting: 60, isDSM5: false, searchTerms: "gallstones,cholelithiasis,biliary colic" },

  // ===== L00-L99: SKIN =====
  { code: "L20", name: "Atopic dermatitis", chapter: "XII — Diseases of the skin", block: "L20-L30", isNigerianTop: true, nigeriaWeighting: 55, isDSM5: false, searchTerms: "eczema,atopic dermatitis" },
  { code: "L30", name: "Other dermatitis", chapter: "XII — Diseases of the skin", block: "L20-L30", isNigerianTop: true, nigeriaWeighting: 50, isDSM5: false, searchTerms: "dermatitis,skin rash" },
  { code: "L40", name: "Psoriasis", chapter: "XII — Diseases of the skin", block: "L40-L45", isNigerianTop: false, nigeriaWeighting: 40, isDSM5: false, searchTerms: "psoriasis" },
  { code: "L50", name: "Urticaria", chapter: "XII — Diseases of the skin", block: "L50-L54", isNigerianTop: true, nigeriaWeighting: 55, isDSM5: false, searchTerms: "urticaria,hives,allergic rash" },
  { code: "L70", name: "Acne", chapter: "XII — Diseases of the skin", block: "L60-L75", isNigerianTop: true, nigeriaWeighting: 50, isDSM5: false, searchTerms: "acne,pimples,acne vulgaris" },

  // ===== M00-M99: MUSCULOSKELETAL =====
  { code: "M10", name: "Gout", chapter: "XIII — Diseases of the musculoskeletal system", block: "M05-M14", isNigerianTop: true, nigeriaWeighting: 60, isDSM5: false, searchTerms: "gout,gouty arthritis,uric acid" },
  { code: "M17", name: "Gonarthrosis (osteoarthritis of knee)", chapter: "XIII — Diseases of the musculoskeletal system", block: "M15-M19", isNigerianTop: true, nigeriaWeighting: 60, isDSM5: false, searchTerms: "knee osteoarthritis,OA knee,degenerative knee" },
  { code: "M54", name: "Dorsalgia (back pain)", chapter: "XIII — Diseases of the musculoskeletal system", block: "M50-M54", isNigerianTop: true, nigeriaWeighting: 65, isDSM5: false, searchTerms: "back pain,low back pain,LBP,dorsalgia,lumbago" },
  { code: "M79", name: "Other soft tissue disorders", chapter: "XIII — Diseases of the musculoskeletal system", block: "M70-M79", isNigerianTop: true, nigeriaWeighting: 55, isDSM5: false, searchTerms: "soft tissue,myalgia,fibromyalgia" },
  { code: "M81", name: "Osteoporosis without pathological fracture", chapter: "XIII — Diseases of the musculoskeletal system", block: "M80-M85", isNigerianTop: false, nigeriaWeighting: 40, isDSM5: false, searchTerms: "osteoporosis" },

  // ===== N00-N99: GENITOURINARY =====
  { code: "N18", name: "Chronic kidney disease", chapter: "XIV — Diseases of the genitourinary system", block: "N17-N19", isNigerianTop: true, nigeriaWeighting: 75, isDSM5: false, searchTerms: "CKD,chronic kidney disease,chronic renal failure,CRF" },
  { code: "N20", name: "Calculus of kidney and ureter", chapter: "XIV — Diseases of the genitourinary system", block: "N20-N23", isNigerianTop: true, nigeriaWeighting: 55, isDSM5: false, searchTerms: "kidney stone,renal calculus,urolithiasis,nephrolithiasis" },
  { code: "N39.0", name: "Urinary tract infection, site not specified", chapter: "XIV — Diseases of the genitourinary system", block: "N30-N39", isNigerianTop: true, nigeriaWeighting: 80, isDSM5: false, searchTerms: "UTI,urinary tract infection,cystitis" },
  { code: "N40", name: "Hyperplasia of prostate", chapter: "XIV — Diseases of the genitourinary system", block: "N40-N51", isNigerianTop: true, nigeriaWeighting: 75, isDSM5: false, searchTerms: "BPH,benign prostatic hyperplasia,prostate enlargement" },
  { code: "N76", name: "Other inflammation of vagina and vulva", chapter: "XIV — Diseases of the genitourinary system", block: "N70-N77", isNigerianTop: true, nigeriaWeighting: 60, isDSM5: false, searchTerms: "vaginitis,vulvovaginitis,vaginal discharge" },
  { code: "N80", name: "Endometriosis", chapter: "XIV — Diseases of the genitourinary system", block: "N80-N98", isNigerianTop: true, nigeriaWeighting: 55, isDSM5: false, searchTerms: "endometriosis" },

  // ===== O00-O99: PREGNANCY =====
  { code: "O03", name: "Spontaneous abortion", chapter: "XV — Pregnancy, childbirth and the puerperium", block: "O00-O08", isNigerianTop: true, nigeriaWeighting: 75, isDSM5: false, searchTerms: "miscarriage,spontaneous abortion" },
  { code: "O14", name: "Pre-eclampsia", chapter: "XV — Pregnancy, childbirth and the puerperium", block: "O10-O16", isNigerianTop: true, nigeriaWeighting: 90, isDSM5: false, searchTerms: "pre-eclampsia,preeclampsia,PET,pregnancy hypertension,toxaemia" },
  { code: "O24", name: "Diabetes mellitus in pregnancy", chapter: "XV — Pregnancy, childbirth and the puerperium", block: "O20-O29", isNigerianTop: true, nigeriaWeighting: 70, isDSM5: false, searchTerms: "gestational diabetes,GDM,pregnancy diabetes" },
  { code: "O44", name: "Placenta praevia", chapter: "XV — Pregnancy, childbirth and the puerperium", block: "O30-O48", isNigerianTop: true, nigeriaWeighting: 65, isDSM5: false, searchTerms: "placenta praevia,low-lying placenta" },
  { code: "O72", name: "Postpartum haemorrhage", chapter: "XV — Pregnancy, childbirth and the puerperium", block: "O60-O75", isNigerianTop: true, nigeriaWeighting: 85, isDSM5: false, searchTerms: "PPH,postpartum haemorrhage,postpartum bleeding" },
  { code: "O80", name: "Single spontaneous delivery", chapter: "XV — Pregnancy, childbirth and the puerperium", block: "O80-O84", isNigerianTop: true, nigeriaWeighting: 80, isDSM5: false, searchTerms: "normal delivery,SVD,spontaneous vaginal delivery" },
  { code: "O82", name: "Single delivery by caesarean section", chapter: "XV — Pregnancy, childbirth and the puerperium", block: "O80-O84", isNigerianTop: true, nigeriaWeighting: 80, isDSM5: false, searchTerms: "caesarean,C-section,CS,LSCS" },
  { code: "O99", name: "Other maternal diseases classifiable elsewhere but complicating pregnancy", chapter: "XV — Pregnancy, childbirth and the puerperium", block: "O94-O99", isNigerianTop: true, nigeriaWeighting: 60, isDSM5: false, searchTerms: "maternal disease,pregnancy complication" },

  // ===== P00-P96: PERINATAL =====
  { code: "P07", name: "Disorders related to short gestation and low birth weight", chapter: "XVI — Conditions originating in the perinatal period", block: "P05-P08", isNigerianTop: true, nigeriaWeighting: 70, isDSM5: false, searchTerms: "prematurity,preterm,low birth weight,LBW" },
  { code: "P22", name: "Respiratory distress of newborn", chapter: "XVI — Conditions originating in the perinatal period", block: "P20-P29", isNigerianTop: true, nigeriaWeighting: 70, isDSM5: false, searchTerms: "RDS,neonatal respiratory distress" },
  { code: "P36", name: "Bacterial sepsis of newborn", chapter: "XVI — Conditions originating in the perinatal period", block: "P35-P39", isNigerianTop: true, nigeriaWeighting: 75, isDSM5: false, searchTerms: "neonatal sepsis,newborn sepsis" },
  { code: "P59", name: "Neonatal jaundice from other and unspecified causes", chapter: "XVI — Conditions originating in the perinatal period", block: "P55-P59", isNigerianTop: true, nigeriaWeighting: 80, isDSM5: false, searchTerms: "neonatal jaundice,NNJ,newborn jaundice,hyperbilirubinaemia" },

  // ===== R00-R99: SYMPTOMS =====
  { code: "R05", name: "Cough", chapter: "XVIII — Symptoms, signs and abnormal clinical findings", block: "R00-R09", isNigerianTop: true, nigeriaWeighting: 70, isDSM5: false, searchTerms: "cough" },
  { code: "R10", name: "Abdominal and pelvic pain", chapter: "XVIII — Symptoms, signs and abnormal clinical findings", block: "R10-R19", isNigerianTop: true, nigeriaWeighting: 75, isDSM5: false, searchTerms: "abdominal pain,stomach ache,belly pain" },
  { code: "R11", name: "Nausea and vomiting", chapter: "XVIII — Symptoms, signs and abnormal clinical findings", block: "R10-R19", isNigerianTop: true, nigeriaWeighting: 70, isDSM5: false, searchTerms: "nausea,vomiting,emesis" },
  { code: "R50", name: "Fever of other and unknown origin", chapter: "XVIII — Symptoms, signs and abnormal clinical findings", block: "R50-R69", isNigerianTop: true, nigeriaWeighting: 85, isDSM5: false, searchTerms: "fever,pyrexia,PUO,fever of unknown origin" },
  { code: "R51", name: "Headache", chapter: "XVIII — Symptoms, signs and abnormal clinical findings", block: "R50-R69", isNigerianTop: true, nigeriaWeighting: 70, isDSM5: false, searchTerms: "headache,cephalalgia" },
  { code: "R53", name: "Malaise and fatigue", chapter: "XVIII — Symptoms, signs and abnormal clinical findings", block: "R50-R69", isNigerianTop: true, nigeriaWeighting: 60, isDSM5: false, searchTerms: "fatigue,tiredness,malaise,weakness" },

  // ===== S/T: INJURIES =====
  { code: "S72", name: "Fracture of femur", chapter: "XIX — Injury, poisoning and consequences of external causes", block: "S70-S79", isNigerianTop: true, nigeriaWeighting: 55, isDSM5: false, searchTerms: "femur fracture,hip fracture,fractured femur" },
  { code: "S82", name: "Fracture of lower leg, including ankle", chapter: "XIX — Injury, poisoning and consequences of external causes", block: "S80-S89", isNigerianTop: true, nigeriaWeighting: 50, isDSM5: false, searchTerms: "tibia fracture,fibula fracture,ankle fracture" },
  { code: "T78.4", name: "Allergy, unspecified", chapter: "XIX — Injury, poisoning and consequences of external causes", block: "T66-T78", isNigerianTop: true, nigeriaWeighting: 60, isDSM5: false, searchTerms: "allergic reaction,allergy,anaphylaxis" },

  // ===== Z CODES: FACTORS INFLUENCING HEALTH =====
  { code: "Z00", name: "General examination and investigation of persons without complaint or reported diagnosis", chapter: "XXI — Factors influencing health status", block: "Z00-Z13", isNigerianTop: true, nigeriaWeighting: 50, isDSM5: false, searchTerms: "general check-up,health screening,medical examination" },
  { code: "Z23", name: "Need for immunization against single bacterial diseases", chapter: "XXI — Factors influencing health status", block: "Z20-Z29", isNigerianTop: true, nigeriaWeighting: 55, isDSM5: false, searchTerms: "vaccination,immunization" },
  { code: "Z34", name: "Supervision of normal pregnancy", chapter: "XXI — Factors influencing health status", block: "Z30-Z39", isNigerianTop: true, nigeriaWeighting: 70, isDSM5: false, searchTerms: "antenatal,ANC,prenatal care,pregnancy supervision" },
];

export async function seedDiagnosisCodes(prisma: PrismaClient) {
  console.log(`Seeding ${codes.length} ICD-10 diagnosis codes...`);
  for (const code of codes) {
    await prisma.diagnosisCode.upsert({
      where: { code: code.code },
      update: code,
      create: code,
    });
  }
  console.log("ICD-10 diagnosis codes seeded.");
}
