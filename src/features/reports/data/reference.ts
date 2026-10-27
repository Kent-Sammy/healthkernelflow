/**
 * Reference (master) data for the reporting prototype.
 * Every name, facility, supplier and payer here is FICTIONAL demo data.
 */

export const ORG_NAME = 'Crestfield Health Group'

export interface Facility {
  id: string
  name: string
  short: string
  city: string
  /** Relative patient volume. */
  weight: number
  departments: string[]
}

export const DEPARTMENTS = [
  'General Outpatient',
  'Internal Medicine',
  'Paediatrics',
  'Obstetrics & Gynaecology',
  'Surgery',
  'Emergency',
  'Dental',
  'Ophthalmology',
  'Cardiology',
  'Orthopaedics',
] as const
export type Department = (typeof DEPARTMENTS)[number]

export const FACILITIES: Facility[] = [
  {
    id: 'LKI',
    name: 'Crestfield Lekki',
    short: 'Lekki',
    city: 'Lagos',
    weight: 1,
    departments: [...DEPARTMENTS],
  },
  {
    id: 'IKJ',
    name: 'Crestfield Ikeja',
    short: 'Ikeja',
    city: 'Lagos',
    weight: 0.72,
    departments: ['General Outpatient', 'Internal Medicine', 'Paediatrics', 'Obstetrics & Gynaecology', 'Emergency', 'Dental', 'Ophthalmology'],
  },
  {
    id: 'ABJ',
    name: 'Crestfield Abuja (Wuse)',
    short: 'Abuja',
    city: 'Abuja',
    weight: 0.64,
    departments: ['General Outpatient', 'Internal Medicine', 'Paediatrics', 'Obstetrics & Gynaecology', 'Surgery', 'Emergency', 'Cardiology', 'Orthopaedics'],
  },
  {
    id: 'PHC',
    name: 'Crestfield Port Harcourt',
    short: 'Port Harcourt',
    city: 'Port Harcourt',
    weight: 0.42,
    departments: ['General Outpatient', 'Paediatrics', 'Obstetrics & Gynaecology', 'Emergency', 'Dental'],
  },
]

export const facilityName = (id: string) => FACILITIES.find((f) => f.id === id)?.name ?? id

/** Relative visit share per department (before facility availability). */
export const DEPT_WEIGHT: Record<Department, number> = {
  'General Outpatient': 30,
  'Internal Medicine': 12,
  Paediatrics: 13,
  'Obstetrics & Gynaecology': 11,
  Surgery: 5,
  Emergency: 8,
  Dental: 7,
  Ophthalmology: 5,
  Cardiology: 4,
  Orthopaedics: 5,
}

export const CONSULT_FEE: Record<Department, number> = {
  'General Outpatient': 10000,
  'Internal Medicine': 18000,
  Paediatrics: 15000,
  'Obstetrics & Gynaecology': 20000,
  Surgery: 22000,
  Emergency: 25000,
  Dental: 15000,
  Ophthalmology: 18000,
  Cardiology: 30000,
  Orthopaedics: 22000,
}

export const SPECIALTY: Record<Department, string> = {
  'General Outpatient': 'Family Medicine',
  'Internal Medicine': 'Internal Medicine',
  Paediatrics: 'Paediatrics',
  'Obstetrics & Gynaecology': 'Obstetrics & Gynaecology',
  Surgery: 'General Surgery',
  Emergency: 'Emergency Medicine',
  Dental: 'Dentistry',
  Ophthalmology: 'Ophthalmology',
  Cardiology: 'Cardiology',
  Orthopaedics: 'Orthopaedic Surgery',
}

export const MALE_FIRST = [
  'Chinedu', 'Emeka', 'Oluwaseun', 'Tunde', 'Ibrahim', 'Musa', 'Babatunde', 'Obinna', 'Ikechukwu', 'Abdullahi',
  'Segun', 'Kelechi', 'Uchenna', 'Femi', 'Yusuf', 'Adewale', 'Chukwuemeka', 'Olumide', 'Sani', 'Efosa',
  'Nnamdi', 'Kayode', 'Bello', 'Gbenga', 'Osagie', 'Tobi', 'Damilare', 'Aliyu', 'Ifeanyi', 'Ebuka',
]
export const FEMALE_FIRST = [
  'Adaeze', 'Ngozi', 'Funmilayo', 'Aisha', 'Chiamaka', 'Folake', 'Zainab', 'Blessing', 'Temitope', 'Amaka',
  'Yetunde', 'Hauwa', 'Ifeoma', 'Bukola', 'Nkechi', 'Omolara', 'Halima', 'Chioma', 'Kemi', 'Esther',
  'Uju', 'Fatima', 'Titilayo', 'Ebere', 'Damilola', 'Osaretin', 'Ronke', 'Hadiza', 'Onyinye', 'Morenike',
]
export const SURNAMES = [
  'Okafor', 'Adeyemi', 'Bello', 'Okonkwo', 'Ibrahim', 'Adebayo', 'Eze', 'Ogunleye', 'Nwosu', 'Abubakar',
  'Olawale', 'Chukwu', 'Mohammed', 'Afolabi', 'Obi', 'Ojo', 'Uche', 'Balogun', 'Okeke', 'Yusuf',
  'Adeleke', 'Nwachukwu', 'Danjuma', 'Akinola', 'Ezeani', 'Lawal', 'Osagie', 'Odili', 'Bankole', 'Igwe',
  'Fashola', 'Anyanwu', 'Garba', 'Oyelaran', 'Umeh', 'Salami', 'Ekwueme', 'Ige', 'Onyeka', 'Aminu',
  'Ogbonna', 'Oladipo', 'Usman', 'Nnadi', 'Odukoya', 'Ekpo', 'Edet', 'Ndukwe', 'Adesina', 'Ayodele',
]

export interface Clinician {
  id: string
  name: string
  department: Department
  facility: string
}

const DOCTOR_NAMES = [
  'Dr. Chinedu Okafor', 'Dr. Funmilayo Adeyemi', 'Dr. Ibrahim Danjuma', 'Dr. Ngozi Eze', 'Dr. Babatunde Akinola',
  'Dr. Aisha Mohammed', 'Dr. Obinna Nwosu', 'Dr. Yetunde Balogun', 'Dr. Musa Abubakar', 'Dr. Chiamaka Okeke',
  'Dr. Olumide Adesina', 'Dr. Hauwa Garba', 'Dr. Kelechi Anyanwu', 'Dr. Temitope Ojo', 'Dr. Efosa Osagie',
  'Dr. Ifeoma Nnadi', 'Dr. Segun Oladipo', 'Dr. Zainab Usman', 'Dr. Nnamdi Ogbonna', 'Dr. Folake Odukoya',
  'Dr. Adewale Fashola', 'Dr. Amaka Umeh', 'Dr. Yusuf Lawal', 'Dr. Omolara Ige', 'Dr. Ikechukwu Ekwueme',
  'Dr. Halima Aminu', 'Dr. Femi Bankole', 'Dr. Ebere Ndukwe', 'Dr. Kayode Salami', 'Dr. Uju Igwe',
  'Dr. Osaretin Edet', 'Dr. Gbenga Ayodele', 'Dr. Chioma Ezeani', 'Dr. Aliyu Bello', 'Dr. Morenike Oyelaran',
  'Dr. Tobi Afolabi', 'Dr. Onyinye Odili', 'Dr. Sani Yusuf', 'Dr. Ronke Adeleke', 'Dr. Ifeanyi Chukwu',
  'Dr. Hadiza Ibrahim', 'Dr. Damilare Olawale',
]

/** One or two clinicians per facility-department, assigned deterministically. */
export const DOCTORS: Clinician[] = (() => {
  const list: Clinician[] = []
  let i = 0
  for (const f of FACILITIES) {
    for (const d of f.departments) {
      const n = f.id === 'LKI' && ['General Outpatient', 'Paediatrics', 'Internal Medicine', 'Obstetrics & Gynaecology', 'Emergency'].includes(d) ? 2 : d === 'General Outpatient' && f.id !== 'PHC' ? 2 : 1
      for (let k = 0; k < n && i < DOCTOR_NAMES.length; k++) {
        list.push({ id: `DR${String(i + 1).padStart(3, '0')}`, name: DOCTOR_NAMES[i], department: d as Department, facility: f.id })
        i++
      }
    }
  }
  return list
})()

export interface Ward {
  id: string
  name: string
  facility: string
  department: Department
  beds: number
}

export const WARDS: Ward[] = [
  { id: 'LKI-MED', name: 'Medical Ward', facility: 'LKI', department: 'Internal Medicine', beds: 7 },
  { id: 'LKI-SUR', name: 'Surgical Ward', facility: 'LKI', department: 'Surgery', beds: 5 },
  { id: 'LKI-MAT', name: 'Maternity Ward', facility: 'LKI', department: 'Obstetrics & Gynaecology', beds: 4 },
  { id: 'LKI-PAE', name: 'Children’s Ward', facility: 'LKI', department: 'Paediatrics', beds: 4 },
  { id: 'LKI-ICU', name: 'Intensive Care Unit', facility: 'LKI', department: 'Emergency', beds: 2 },
  { id: 'IKJ-MED', name: 'Medical Ward', facility: 'IKJ', department: 'Internal Medicine', beds: 5 },
  { id: 'IKJ-MAT', name: 'Maternity Ward', facility: 'IKJ', department: 'Obstetrics & Gynaecology', beds: 3 },
  { id: 'IKJ-PAE', name: 'Children’s Ward', facility: 'IKJ', department: 'Paediatrics', beds: 3 },
  { id: 'ABJ-MED', name: 'Medical Ward', facility: 'ABJ', department: 'Internal Medicine', beds: 4 },
  { id: 'ABJ-SUR', name: 'Surgical Ward', facility: 'ABJ', department: 'Surgery', beds: 3 },
  { id: 'ABJ-MAT', name: 'Maternity Ward', facility: 'ABJ', department: 'Obstetrics & Gynaecology', beds: 2 },
  { id: 'PHC-GEN', name: 'General Ward', facility: 'PHC', department: 'General Outpatient', beds: 5 },
]

export interface Diagnosis {
  code: string
  name: string
}

export const DIAGNOSES: Record<Department, Diagnosis[]> = {
  'General Outpatient': [
    { code: 'B54', name: 'Malaria, unspecified' },
    { code: 'J06.9', name: 'Acute upper respiratory infection' },
    { code: 'A01.0', name: 'Typhoid fever' },
    { code: 'A09', name: 'Gastroenteritis and colitis' },
    { code: 'N39.0', name: 'Urinary tract infection' },
    { code: 'I10', name: 'Essential hypertension' },
    { code: 'K29.7', name: 'Gastritis, unspecified' },
    { code: 'M54.5', name: 'Low back pain' },
    { code: 'R51', name: 'Headache' },
    { code: 'L08.9', name: 'Local skin infection' },
  ],
  'Internal Medicine': [
    { code: 'I10', name: 'Essential hypertension' },
    { code: 'E11.9', name: 'Type 2 diabetes mellitus' },
    { code: 'B54', name: 'Malaria, unspecified' },
    { code: 'J18.9', name: 'Pneumonia, unspecified' },
    { code: 'N18.9', name: 'Chronic kidney disease' },
    { code: 'K27.9', name: 'Peptic ulcer' },
    { code: 'D64.9', name: 'Anaemia, unspecified' },
    { code: 'I50.9', name: 'Heart failure' },
  ],
  Paediatrics: [
    { code: 'B54', name: 'Malaria, unspecified' },
    { code: 'J06.9', name: 'Acute upper respiratory infection' },
    { code: 'A09', name: 'Gastroenteritis and colitis' },
    { code: 'H66.9', name: 'Otitis media' },
    { code: 'D57.0', name: 'Sickle-cell anaemia with crisis' },
    { code: 'J45.9', name: 'Asthma, unspecified' },
    { code: 'E44.0', name: 'Moderate protein-energy malnutrition' },
    { code: 'Z23', name: 'Encounter for immunization' },
  ],
  'Obstetrics & Gynaecology': [
    { code: 'Z34.9', name: 'Supervision of normal pregnancy' },
    { code: 'O14.9', name: 'Pre-eclampsia' },
    { code: 'O99.0', name: 'Anaemia complicating pregnancy' },
    { code: 'N73.9', name: 'Pelvic inflammatory disease' },
    { code: 'D25.9', name: 'Uterine fibroid (leiomyoma)' },
    { code: 'O80', name: 'Single spontaneous delivery' },
    { code: 'N97.9', name: 'Female infertility' },
  ],
  Surgery: [
    { code: 'K35.8', name: 'Acute appendicitis' },
    { code: 'K40.9', name: 'Inguinal hernia' },
    { code: 'N40', name: 'Benign prostatic hyperplasia' },
    { code: 'L02.9', name: 'Cutaneous abscess' },
    { code: 'K80.2', name: 'Gallstones without cholecystitis' },
    { code: 'T14.1', name: 'Open wound, unspecified' },
  ],
  Emergency: [
    { code: 'B54', name: 'Malaria, unspecified' },
    { code: 'S52.9', name: 'Fracture of forearm' },
    { code: 'T14.9', name: 'Injury, unspecified' },
    { code: 'R10.4', name: 'Abdominal pain' },
    { code: 'I10', name: 'Essential hypertension' },
    { code: 'J45.9', name: 'Asthma, unspecified' },
    { code: 'D57.0', name: 'Sickle-cell anaemia with crisis' },
  ],
  Dental: [
    { code: 'K02.9', name: 'Dental caries' },
    { code: 'K05.1', name: 'Chronic gingivitis' },
    { code: 'K04.7', name: 'Periapical abscess' },
    { code: 'K01.1', name: 'Impacted tooth' },
    { code: 'K03.6', name: 'Deposits (accretions) on teeth' },
    { code: 'K08.1', name: 'Loss of teeth' },
  ],
  Ophthalmology: [
    { code: 'H10.9', name: 'Conjunctivitis' },
    { code: 'H26.9', name: 'Cataract' },
    { code: 'H40.9', name: 'Glaucoma' },
    { code: 'H52.4', name: 'Presbyopia' },
    { code: 'H52.1', name: 'Myopia' },
  ],
  Cardiology: [
    { code: 'I10', name: 'Essential hypertension' },
    { code: 'I50.9', name: 'Heart failure' },
    { code: 'I48', name: 'Atrial fibrillation' },
    { code: 'I25.1', name: 'Atherosclerotic heart disease' },
    { code: 'I42.9', name: 'Cardiomyopathy' },
  ],
  Orthopaedics: [
    { code: 'M17.9', name: 'Osteoarthritis of knee' },
    { code: 'M54.5', name: 'Low back pain' },
    { code: 'S82.9', name: 'Fracture of lower leg' },
    { code: 'M75.1', name: 'Rotator cuff syndrome' },
    { code: 'M79.6', name: 'Pain in limb' },
  ],
}

export type LabCategory = 'Haematology' | 'Clinical Chemistry' | 'Microbiology' | 'Serology' | 'Urinalysis' | 'Histopathology' | 'Radiology'

export interface LabTest {
  name: string
  category: LabCategory
  price: number
  /** Target turnaround in hours. */
  targetTat: number
  /** Typical TAT in hours. */
  typicalTat: number
}

export const LAB_TESTS: LabTest[] = [
  { name: 'Full Blood Count', category: 'Haematology', price: 6500, targetTat: 4, typicalTat: 2.5 },
  { name: 'Malaria Parasite (Microscopy)', category: 'Haematology', price: 3500, targetTat: 2, typicalTat: 1.2 },
  { name: 'Packed Cell Volume', category: 'Haematology', price: 2500, targetTat: 2, typicalTat: 1 },
  { name: 'Blood Group & Genotype', category: 'Haematology', price: 5000, targetTat: 6, typicalTat: 3 },
  { name: 'Electrolytes, Urea & Creatinine', category: 'Clinical Chemistry', price: 12000, targetTat: 8, typicalTat: 5 },
  { name: 'Liver Function Test', category: 'Clinical Chemistry', price: 14000, targetTat: 8, typicalTat: 5.5 },
  { name: 'Fasting Blood Sugar', category: 'Clinical Chemistry', price: 3000, targetTat: 2, typicalTat: 1 },
  { name: 'HbA1c', category: 'Clinical Chemistry', price: 15000, targetTat: 24, typicalTat: 10 },
  { name: 'Lipid Profile', category: 'Clinical Chemistry', price: 15000, targetTat: 12, typicalTat: 6 },
  { name: 'Blood Culture', category: 'Microbiology', price: 18000, targetTat: 96, typicalTat: 72 },
  { name: 'Urine Microscopy, Culture & Sensitivity', category: 'Microbiology', price: 12000, targetTat: 72, typicalTat: 52 },
  { name: 'Stool Microscopy', category: 'Microbiology', price: 4000, targetTat: 24, typicalTat: 8 },
  { name: 'Widal Test', category: 'Serology', price: 4000, targetTat: 4, typicalTat: 2 },
  { name: 'HIV Screening', category: 'Serology', price: 5000, targetTat: 4, typicalTat: 1.5 },
  { name: 'Hepatitis B Surface Antigen', category: 'Serology', price: 5000, targetTat: 4, typicalTat: 1.5 },
  { name: 'Pregnancy Test (Serum β-hCG)', category: 'Serology', price: 4500, targetTat: 4, typicalTat: 1.5 },
  { name: 'Urinalysis', category: 'Urinalysis', price: 3000, targetTat: 2, typicalTat: 1 },
  { name: 'Histology (Tissue Biopsy)', category: 'Histopathology', price: 45000, targetTat: 168, typicalTat: 140 },
  { name: 'Pap Smear', category: 'Histopathology', price: 18000, targetTat: 120, typicalTat: 100 },
  { name: 'Chest X-Ray', category: 'Radiology', price: 15000, targetTat: 6, typicalTat: 3 },
  { name: 'Abdominal Ultrasound', category: 'Radiology', price: 20000, targetTat: 6, typicalTat: 3.5 },
  { name: 'Obstetric Ultrasound', category: 'Radiology', price: 18000, targetTat: 4, typicalTat: 2 },
]

export const DEPT_LAB_TESTS: Record<Department, string[]> = {
  'General Outpatient': ['Malaria Parasite (Microscopy)', 'Full Blood Count', 'Widal Test', 'Urinalysis', 'Urine Microscopy, Culture & Sensitivity', 'Stool Microscopy', 'Fasting Blood Sugar'],
  'Internal Medicine': ['Electrolytes, Urea & Creatinine', 'HbA1c', 'Lipid Profile', 'Full Blood Count', 'Liver Function Test', 'Chest X-Ray', 'Fasting Blood Sugar', 'Blood Culture'],
  Paediatrics: ['Malaria Parasite (Microscopy)', 'Full Blood Count', 'Packed Cell Volume', 'Blood Culture', 'Blood Group & Genotype', 'Urinalysis'],
  'Obstetrics & Gynaecology': ['Obstetric Ultrasound', 'Pregnancy Test (Serum β-hCG)', 'Packed Cell Volume', 'HIV Screening', 'Hepatitis B Surface Antigen', 'Blood Group & Genotype', 'Pap Smear', 'Urinalysis'],
  Surgery: ['Full Blood Count', 'Electrolytes, Urea & Creatinine', 'Abdominal Ultrasound', 'Histology (Tissue Biopsy)', 'Chest X-Ray', 'Blood Group & Genotype'],
  Emergency: ['Full Blood Count', 'Malaria Parasite (Microscopy)', 'Electrolytes, Urea & Creatinine', 'Chest X-Ray', 'Fasting Blood Sugar', 'Packed Cell Volume'],
  Dental: ['Full Blood Count'],
  Ophthalmology: ['Fasting Blood Sugar'],
  Cardiology: ['Lipid Profile', 'Electrolytes, Urea & Creatinine', 'Chest X-Ray', 'HbA1c', 'Full Blood Count'],
  Orthopaedics: ['Full Blood Count', 'Chest X-Ray'],
}

export const EXTERNAL_LABS = ['Meridian Reference Laboratory', 'Apex Diagnostics', 'Palmview Pathology Services']

export type StockKind = 'Medication' | 'Consumable'

export interface StockItemDef {
  code: string
  name: string
  kind: StockKind
  category: string
  unit: string
  unitCost: number
  unitPrice: number
  /** Typical units per prescription / issue. */
  typicalQty: number
}

export const MEDICATIONS: StockItemDef[] = [
  { code: 'MED-001', name: 'Artemether/Lumefantrine 80/480mg', category: 'Antimalarials', unit: 'pack', unitCost: 1800, unitPrice: 3200, typicalQty: 1 },
  { code: 'MED-002', name: 'Artesunate Injection 60mg', category: 'Antimalarials', unit: 'vial', unitCost: 1500, unitPrice: 2800, typicalQty: 3 },
  { code: 'MED-003', name: 'Amoxicillin/Clavulanate 625mg', category: 'Antibiotics', unit: 'pack', unitCost: 3200, unitPrice: 5500, typicalQty: 1 },
  { code: 'MED-004', name: 'Ciprofloxacin 500mg', category: 'Antibiotics', unit: 'pack', unitCost: 1200, unitPrice: 2400, typicalQty: 1 },
  { code: 'MED-005', name: 'Ceftriaxone Injection 1g', category: 'Antibiotics', unit: 'vial', unitCost: 900, unitPrice: 2000, typicalQty: 4 },
  { code: 'MED-006', name: 'Metronidazole 400mg', category: 'Antibiotics', unit: 'pack', unitCost: 450, unitPrice: 1000, typicalQty: 1 },
  { code: 'MED-007', name: 'Azithromycin 500mg', category: 'Antibiotics', unit: 'pack', unitCost: 1600, unitPrice: 3000, typicalQty: 1 },
  { code: 'MED-008', name: 'Paracetamol 500mg', category: 'Analgesics', unit: 'pack', unitCost: 250, unitPrice: 600, typicalQty: 2 },
  { code: 'MED-009', name: 'Ibuprofen 400mg', category: 'Analgesics', unit: 'pack', unitCost: 400, unitPrice: 900, typicalQty: 1 },
  { code: 'MED-010', name: 'Diclofenac Injection 75mg', category: 'Analgesics', unit: 'ampoule', unitCost: 300, unitPrice: 800, typicalQty: 2 },
  { code: 'MED-011', name: 'Tramadol 50mg', category: 'Analgesics', unit: 'pack', unitCost: 900, unitPrice: 2000, typicalQty: 1 },
  { code: 'MED-012', name: 'Amlodipine 10mg', category: 'Antihypertensives', unit: 'pack', unitCost: 900, unitPrice: 2200, typicalQty: 1 },
  { code: 'MED-013', name: 'Lisinopril 10mg', category: 'Antihypertensives', unit: 'pack', unitCost: 1100, unitPrice: 2500, typicalQty: 1 },
  { code: 'MED-014', name: 'Losartan 50mg', category: 'Antihypertensives', unit: 'pack', unitCost: 1400, unitPrice: 3000, typicalQty: 1 },
  { code: 'MED-015', name: 'Hydrochlorothiazide 25mg', category: 'Antihypertensives', unit: 'pack', unitCost: 500, unitPrice: 1200, typicalQty: 1 },
  { code: 'MED-016', name: 'Metformin 500mg', category: 'Antidiabetics', unit: 'pack', unitCost: 700, unitPrice: 1600, typicalQty: 2 },
  { code: 'MED-017', name: 'Glibenclamide 5mg', category: 'Antidiabetics', unit: 'pack', unitCost: 400, unitPrice: 1000, typicalQty: 1 },
  { code: 'MED-018', name: 'Insulin (Soluble) 100IU/ml', category: 'Antidiabetics', unit: 'vial', unitCost: 5500, unitPrice: 9000, typicalQty: 1 },
  { code: 'MED-019', name: 'Omeprazole 20mg', category: 'Gastrointestinal', unit: 'pack', unitCost: 600, unitPrice: 1500, typicalQty: 1 },
  { code: 'MED-020', name: 'Oral Rehydration Salts', category: 'Gastrointestinal', unit: 'sachet', unitCost: 100, unitPrice: 300, typicalQty: 4 },
  { code: 'MED-021', name: 'Zinc Sulphate 20mg', category: 'Gastrointestinal', unit: 'pack', unitCost: 350, unitPrice: 800, typicalQty: 1 },
  { code: 'MED-022', name: 'Salbutamol Inhaler', category: 'Respiratory', unit: 'inhaler', unitCost: 1800, unitPrice: 3500, typicalQty: 1 },
  { code: 'MED-023', name: 'Cetirizine 10mg', category: 'Respiratory', unit: 'pack', unitCost: 300, unitPrice: 800, typicalQty: 1 },
  { code: 'MED-024', name: 'Folic Acid 5mg', category: 'Supplements', unit: 'pack', unitCost: 150, unitPrice: 400, typicalQty: 1 },
  { code: 'MED-025', name: 'Ferrous Sulphate 200mg', category: 'Supplements', unit: 'pack', unitCost: 250, unitPrice: 600, typicalQty: 1 },
  { code: 'MED-026', name: 'Prenatal Multivitamin', category: 'Supplements', unit: 'pack', unitCost: 1200, unitPrice: 2500, typicalQty: 1 },
  { code: 'MED-027', name: 'Hydroxyurea 500mg', category: 'Haematology', unit: 'pack', unitCost: 3500, unitPrice: 6000, typicalQty: 1 },
  { code: 'MED-028', name: 'Oxytocin Injection 10IU', category: 'Obstetric', unit: 'ampoule', unitCost: 400, unitPrice: 1000, typicalQty: 2 },
  { code: 'MED-029', name: 'Magnesium Sulphate 50%', category: 'Obstetric', unit: 'ampoule', unitCost: 700, unitPrice: 1500, typicalQty: 4 },
  { code: 'MED-030', name: 'Chloramphenicol Eye Drops', category: 'Ophthalmic', unit: 'bottle', unitCost: 500, unitPrice: 1200, typicalQty: 1 },
  { code: 'MED-031', name: 'Timolol Eye Drops 0.5%', category: 'Ophthalmic', unit: 'bottle', unitCost: 1800, unitPrice: 3500, typicalQty: 1 },
  { code: 'MED-032', name: 'Chlorhexidine Mouthwash', category: 'Dental', unit: 'bottle', unitCost: 900, unitPrice: 2000, typicalQty: 1 },
  { code: 'MED-033', name: 'Lidocaine 2% with Adrenaline', category: 'Dental', unit: 'cartridge', unitCost: 350, unitPrice: 900, typicalQty: 2 },
  { code: 'MED-034', name: 'Normal Saline 0.9% 500ml', category: 'IV Fluids', unit: 'bag', unitCost: 450, unitPrice: 1200, typicalQty: 3 },
  { code: 'MED-035', name: 'Dextrose 5% 500ml', category: 'IV Fluids', unit: 'bag', unitCost: 450, unitPrice: 1200, typicalQty: 2 },
  { code: 'MED-036', name: 'Ringer’s Lactate 500ml', category: 'IV Fluids', unit: 'bag', unitCost: 500, unitPrice: 1300, typicalQty: 2 },
  { code: 'MED-037', name: 'Furosemide 40mg', category: 'Cardiovascular', unit: 'pack', unitCost: 400, unitPrice: 1000, typicalQty: 1 },
  { code: 'MED-038', name: 'Atorvastatin 20mg', category: 'Cardiovascular', unit: 'pack', unitCost: 1500, unitPrice: 3200, typicalQty: 1 },
  { code: 'MED-039', name: 'Clopidogrel 75mg', category: 'Cardiovascular', unit: 'pack', unitCost: 2200, unitPrice: 4200, typicalQty: 1 },
  { code: 'MED-040', name: 'Prednisolone 5mg', category: 'Respiratory', unit: 'pack', unitCost: 300, unitPrice: 700, typicalQty: 1 },
].map((m) => ({ ...m, kind: 'Medication' as const }))

export const CONSUMABLES: StockItemDef[] = [
  { code: 'CON-001', name: 'Disposable Syringe 5ml', category: 'Injection Supplies', unit: 'box of 100', unitCost: 3500, unitPrice: 0, typicalQty: 2 },
  { code: 'CON-002', name: 'IV Cannula 22G', category: 'Injection Supplies', unit: 'box of 50', unitCost: 7500, unitPrice: 0, typicalQty: 1 },
  { code: 'CON-003', name: 'Infusion Giving Set', category: 'Injection Supplies', unit: 'box of 25', unitCost: 6000, unitPrice: 0, typicalQty: 1 },
  { code: 'CON-004', name: 'Examination Gloves (M)', category: 'PPE', unit: 'box of 100', unitCost: 4500, unitPrice: 0, typicalQty: 3 },
  { code: 'CON-005', name: 'Sterile Surgical Gloves 7.5', category: 'PPE', unit: 'box of 50 pairs', unitCost: 12000, unitPrice: 0, typicalQty: 1 },
  { code: 'CON-006', name: 'Surgical Face Masks', category: 'PPE', unit: 'box of 50', unitCost: 2500, unitPrice: 0, typicalQty: 2 },
  { code: 'CON-007', name: 'Gauze Swabs 10x10cm', category: 'Dressings', unit: 'pack of 100', unitCost: 3000, unitPrice: 0, typicalQty: 2 },
  { code: 'CON-008', name: 'Crepe Bandage 10cm', category: 'Dressings', unit: 'pack of 12', unitCost: 3600, unitPrice: 0, typicalQty: 1 },
  { code: 'CON-009', name: 'Adhesive Plaster Roll', category: 'Dressings', unit: 'roll', unitCost: 900, unitPrice: 0, typicalQty: 3 },
  { code: 'CON-010', name: 'EDTA Sample Bottles', category: 'Laboratory Supplies', unit: 'pack of 100', unitCost: 5000, unitPrice: 0, typicalQty: 1 },
  { code: 'CON-011', name: 'Malaria RDT Kits', category: 'Laboratory Supplies', unit: 'box of 25', unitCost: 8500, unitPrice: 0, typicalQty: 1 },
  { code: 'CON-012', name: 'Glucose Test Strips', category: 'Laboratory Supplies', unit: 'box of 50', unitCost: 6500, unitPrice: 0, typicalQty: 1 },
  { code: 'CON-013', name: 'Haematology Reagent Pack', category: 'Laboratory Supplies', unit: 'kit', unitCost: 48000, unitPrice: 0, typicalQty: 1 },
  { code: 'CON-014', name: 'Urinary Catheter 16Fr', category: 'Ward Supplies', unit: 'box of 10', unitCost: 5500, unitPrice: 0, typicalQty: 1 },
  { code: 'CON-015', name: 'Disposable Bed Sheets', category: 'Ward Supplies', unit: 'pack of 20', unitCost: 7000, unitPrice: 0, typicalQty: 1 },
  { code: 'CON-016', name: 'Hand Sanitiser 500ml', category: 'Infection Control', unit: 'bottle', unitCost: 1800, unitPrice: 0, typicalQty: 4 },
  { code: 'CON-017', name: 'Sharps Container 5L', category: 'Infection Control', unit: 'unit', unitCost: 2200, unitPrice: 0, typicalQty: 2 },
  { code: 'CON-018', name: 'Dental Impression Material', category: 'Dental Supplies', unit: 'pack', unitCost: 9500, unitPrice: 0, typicalQty: 1 },
  { code: 'CON-019', name: 'Composite Filling Kit', category: 'Dental Supplies', unit: 'kit', unitCost: 22000, unitPrice: 0, typicalQty: 1 },
  { code: 'CON-020', name: 'X-Ray Film 14x17', category: 'Imaging Supplies', unit: 'box of 100', unitCost: 38000, unitPrice: 0, typicalQty: 1 },
].map((m) => ({ ...m, kind: 'Consumable' as const }))

export const ALL_ITEMS: StockItemDef[] = [...MEDICATIONS, ...CONSUMABLES]

export const DEPT_MEDS: Record<Department, string[]> = {
  'General Outpatient': ['MED-001', 'MED-008', 'MED-004', 'MED-006', 'MED-003', 'MED-019', 'MED-023', 'MED-009', 'MED-012'],
  'Internal Medicine': ['MED-012', 'MED-013', 'MED-014', 'MED-016', 'MED-017', 'MED-018', 'MED-038', 'MED-019', 'MED-005', 'MED-037', 'MED-015'],
  Paediatrics: ['MED-001', 'MED-002', 'MED-020', 'MED-021', 'MED-008', 'MED-003', 'MED-022', 'MED-027', 'MED-024'],
  'Obstetrics & Gynaecology': ['MED-026', 'MED-024', 'MED-025', 'MED-028', 'MED-029', 'MED-006', 'MED-003'],
  Surgery: ['MED-005', 'MED-010', 'MED-011', 'MED-006', 'MED-034', 'MED-035', 'MED-003'],
  Emergency: ['MED-002', 'MED-034', 'MED-036', 'MED-010', 'MED-005', 'MED-022', 'MED-040', 'MED-008'],
  Dental: ['MED-032', 'MED-033', 'MED-009', 'MED-007', 'MED-006'],
  Ophthalmology: ['MED-030', 'MED-031', 'MED-023'],
  Cardiology: ['MED-012', 'MED-014', 'MED-037', 'MED-038', 'MED-039', 'MED-013'],
  Orthopaedics: ['MED-009', 'MED-011', 'MED-010', 'MED-040'],
}

export interface Supplier {
  id: string
  name: string
  categories: StockKind[]
  leadDays: number
  reliability: number
}

export const SUPPLIERS: Supplier[] = [
  { id: 'SUP-01', name: 'Harbourline Pharmaceuticals Ltd', categories: ['Medication'], leadDays: 4, reliability: 0.92 },
  { id: 'SUP-02', name: 'Savanna Meds Distribution', categories: ['Medication'], leadDays: 6, reliability: 0.8 },
  { id: 'SUP-03', name: 'Eastgate Medical Supplies', categories: ['Consumable'], leadDays: 5, reliability: 0.88 },
  { id: 'SUP-04', name: 'Kola Nut Healthcare Logistics', categories: ['Medication', 'Consumable'], leadDays: 7, reliability: 0.72 },
  { id: 'SUP-05', name: 'Bright Delta Diagnostics', categories: ['Consumable'], leadDays: 8, reliability: 0.85 },
  { id: 'SUP-06', name: 'Northstar Generics Nigeria', categories: ['Medication'], leadDays: 5, reliability: 0.9 },
]

export const HMOS = [
  'Crestview Health HMO',
  'Greenfield Care HMO',
  'Unity Shield Health',
  'Novalife HMO',
  'Sterling Path Health',
  'Harmony Care Plan',
]

export const CORPORATES = ['Lagoon Petroleum Ltd', 'Zenara Telecoms', 'Bluewater Logistics', 'Kanem Agro Industries', 'Ridgeview Bank Plc']

export const PAYMENT_METHODS = ['Cash', 'POS / Card', 'Bank Transfer', 'USSD / Mobile', 'HMO Remittance', 'Corporate Remittance', 'Patient Credit'] as const

export interface ProcedureDef {
  name: string
  category: 'Imaging' | 'Minor Surgery' | 'Dental' | 'Physiotherapy' | 'Diagnostics' | 'Maternity' | 'Ophthalmic' | 'Preventive'
  price: number
  departments: Department[]
}

export const PROCEDURES: ProcedureDef[] = [
  { name: 'ECG (12-lead)', category: 'Diagnostics', price: 15000, departments: ['Cardiology', 'Internal Medicine', 'Emergency'] },
  { name: 'Echocardiogram', category: 'Diagnostics', price: 45000, departments: ['Cardiology'] },
  { name: 'Wound Dressing', category: 'Minor Surgery', price: 6000, departments: ['Surgery', 'Emergency', 'General Outpatient'] },
  { name: 'Incision & Drainage', category: 'Minor Surgery', price: 35000, departments: ['Surgery', 'Emergency'] },
  { name: 'Suturing (Laceration Repair)', category: 'Minor Surgery', price: 25000, departments: ['Emergency', 'Surgery'] },
  { name: 'POP Cast Application', category: 'Minor Surgery', price: 30000, departments: ['Orthopaedics', 'Emergency'] },
  { name: 'Physiotherapy Session', category: 'Physiotherapy', price: 12000, departments: ['Orthopaedics'] },
  { name: 'Antenatal Booking Package', category: 'Maternity', price: 40000, departments: ['Obstetrics & Gynaecology'] },
  { name: 'Childhood Immunization', category: 'Preventive', price: 8000, departments: ['Paediatrics'] },
  { name: 'Nebulisation', category: 'Preventive', price: 7000, departments: ['Paediatrics', 'Emergency'] },
  { name: 'Scaling & Polishing', category: 'Dental', price: 25000, departments: ['Dental'] },
  { name: 'Tooth Extraction', category: 'Dental', price: 20000, departments: ['Dental'] },
  { name: 'Composite Filling', category: 'Dental', price: 30000, departments: ['Dental'] },
  { name: 'Root Canal Treatment', category: 'Dental', price: 85000, departments: ['Dental'] },
  { name: 'Surgical Extraction (Impacted Tooth)', category: 'Dental', price: 65000, departments: ['Dental'] },
  { name: 'Dental X-Ray (Periapical)', category: 'Dental', price: 8000, departments: ['Dental'] },
  { name: 'Visual Acuity & Refraction', category: 'Ophthalmic', price: 10000, departments: ['Ophthalmology'] },
  { name: 'Tonometry', category: 'Ophthalmic', price: 8000, departments: ['Ophthalmology'] },
  { name: 'Mammography', category: 'Imaging', price: 35000, departments: ['Obstetrics & Gynaecology', 'Surgery'] },
  { name: 'CT Scan (Head)', category: 'Imaging', price: 120000, departments: ['Emergency', 'Internal Medicine'] },
]

export const STAFF_ROLES = ['Doctor', 'Nurse', 'Pharmacist', 'Laboratory Scientist', 'Cashier', 'Records Officer', 'Radiographer', 'Facility Admin', 'Dentist', 'Accountant'] as const

export const INTEGRATIONS = [
  { name: 'HMO Claims Exchange', direction: 'Outbound' },
  { name: 'Payment Gateway', direction: 'Inbound' },
  { name: 'Lab Analyzer Interface (LIS)', direction: 'Inbound' },
  { name: 'SMS & WhatsApp Notifications', direction: 'Outbound' },
  { name: 'General Ledger Export', direction: 'Outbound' },
  { name: 'PACS Imaging Archive', direction: 'Bidirectional' },
] as const
