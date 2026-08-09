#!/usr/bin/env bash
# End-to-end: simulate the Frontend's submitRegistration pipeline by hitting
# the same endpoints in the same order the form-capture now emits them.
#
# Run AFTER `tsx src/server.ts` is up.

set -e
BASE=${BASE:-http://localhost:5050/api}

RAND=$(printf '%04d' $((RANDOM % 10000)))
HBCR_ID="HBCR-2024-${RAND}"

# Body collector: prints a single line to stdout (JSON) and a confirmation
# line to stderr, so callers can do `var=$(req ...)`.
ok() {
  local desc="$1"
  shift
  local resp
  resp=$(curl -s -w $'\nHTTP:%{http_code}' "$@")
  local code body
  code=$(printf '%s' "$resp" | tail -n1)
  code=${code#HTTP:}
  body=$(printf '%s' "$resp" | sed '$d' | tr -d '\n')
  if [[ "$code" =~ ^[2] ]]; then
    echo "✅ $desc (HTTP $code)" >&2
  else
    echo "❌ $desc -> $code $body" >&2
    exit 1
  fi
  printf '%s' "$body"
}

P_ID=$(ok "POST /patients" -X POST "$BASE/patients" -H "Content-Type: application/json" -d "{\"fullName\":\"E2E Tester ${RAND}\",\"age\":42,\"gender\":\"FEMALE\",\"dateOfBirth\":\"1982-04-12\"}" | python3 -c "import sys,json; d=json.loads(sys.stdin.read()); print(d.get('data',{}).get('id',''))")
echo "  P_ID=$P_ID" >&2

ok "POST /patients/$P_ID/side/addresses" -X POST "$BASE/patients/$P_ID/side/addresses" -H "Content-Type: application/json" -d '{"addressType":"RESIDENTIAL","city":"New Delhi","state":"Delhi","pinCode":"110001","mobileNumber":"9876543210","email":"e2e@test.com"}' > /dev/null
ok "POST /patients/$P_ID/side/relatives" -X POST "$BASE/patients/$P_ID/side/relatives" -H "Content-Type: application/json" -d '{"relationship":"FATHER","name":"R Sharma","mobileNumber":"9876543211"}' > /dev/null
ok "POST /patients/$P_ID/side/habits" -X POST "$BASE/patients/$P_ID/side/habits" -H "Content-Type: application/json" -d '{"habit":"SMOKING","answer":"YES","durationMonths":24}' > /dev/null
ok "POST /patients/$P_ID/side/comorbidities" -X POST "$BASE/patients/$P_ID/side/comorbidities" -H "Content-Type: application/json" -d '{"comorbidity":"DIABETES","answer":"YES","durationMonths":60}' > /dev/null
ok "POST /patients/$P_ID/side/identifications" -X POST "$BASE/patients/$P_ID/side/identifications" -H "Content-Type: application/json" -d '{"idType":"AADHAAR","number":"111122223333"}' > /dev/null

R_ID=$(ok "POST /patients/$P_ID/registrations" -X POST "$BASE/patients/$P_ID/registrations" -H "Content-Type: application/json" -d "{\"hbcrRegistrationNo\":\"$HBCR_ID\",\"hospitalId\":1,\"departmentName\":\"Oncology\",\"dateOfReporting\":\"2024-08-01\",\"caseRegisteredThrough\":\"OUT_PATIENT\",\"referralType\":\"SELF\",\"dateOfFirstDiagnosis\":\"2024-07-25\",\"anthropometricHeightCm\":165,\"anthropometricWeightKg\":72,\"maritalStatus\":\"MARRIED\",\"education\":\"GRADUATE_AND_ABOVE\",\"status\":\"ACTIVE\"}" | python3 -c "import sys,json; d=json.loads(sys.stdin.read()); print(d.get('data',{}).get('id',''))")
echo "  R_ID=$R_ID" >&2

ok "POST /registrations/$R_ID/pathological-diagnosis" -X POST "$BASE/registrations/$R_ID/pathological-diagnosis" -H "Content-Type: application/json" -d '{"icdoTopography":"C50.9","icdoMorphology":"8500/3","icd10Site":"C50","laterality":"PAIRED_SITE","pairedLaterality":"LEFT","sequence":"ONE_PRIMARY"}' > /dev/null
ok "POST /registrations/$R_ID/family-history" -X POST "$BASE/registrations/$R_ID/family-history" -H "Content-Type: application/json" -d '{"familyHistory":"YES","relationshipWithCancer":"SAME_CANCER","degreeOfRelationship":"FIRST_DEGREE","primarySite":"BREAST","ageAtDiagnosis":40,"dateOfDiagnosis":"2010-01-01"}' > /dev/null

DM=$(ok "POST diagnostic-methods" -X POST "$BASE/registrations/$R_ID/diagnostic-methods" -H "Content-Type: application/json" -d '{"method":"MICROSCOPIC"}' | python3 -c "import sys,json; d=json.loads(sys.stdin.read()); print(d.get('data',{}).get('id',''))")
ok "POST procedures" -X POST "$BASE/diagnostic-methods/$DM/procedures" -H "Content-Type: application/json" -d '{"procedureName":"(a). Histology of Primary","procedureDate":"2024-08-01"}' > /dev/null

ok "POST treatments (prior)" -X POST "$BASE/registrations/$R_ID/treatments" -H "Content-Type: application/json" -d '{"treatmentStage":"PRIOR_REGISTRATION","treatmentGivenChoice":"YES","treatmentType":"ALLOPATHIC","stagingSystem":"TNM","tnmT":"T2","tnmN":"N1","tnmM":"M0","compositeStage":"IIB","ecogStatus":"KNOWN","ecogGrade":"GRADE_1","targetedTherapyType":"NOT_GIVEN"}' > /dev/null
ok "POST treatments (at_ri)" -X POST "$BASE/registrations/$R_ID/treatments" -H "Content-Type: application/json" -d '{"treatmentStage":"AT_RI","treatmentGivenChoice":"YES","treatmentType":"ALLOPATHIC","stagingSystem":"TNM","tnmT":"T2","tnmN":"N1","tnmM":"M0","compositeStage":"IIB","ecogStatus":"KNOWN","ecogGrade":"GRADE_1","targetedTherapyType":"NOT_GIVEN"}' > /dev/null

echo
echo "=== Dashboard reflects new patient ===" >&2
ok "GET /dashboard/stats" "$BASE/dashboard/stats" > /dev/null
curl -s "$BASE/dashboard/stats" | python3 -m json.tool
echo
echo "=== Read back the registration (proves data in DB) ===" >&2
curl -s "$BASE/registrations/$R_ID" | python3 -c "
import sys, json
d=json.loads(sys.stdin.read())['data']
print('  Patient in registration:', d['patientId'])
print('  Hospital:', d['hospital']['name'])
print('  HBCR ID:', d['hbcrRegistrationNo'])
print('  Status:', d['status'])
print('  Pathology:', d['pathologicalDiagnosis']['icdoTopography'] if d['pathologicalDiagnosis'] else 'MISSING')
print('  Family history:', d['familialCancerHistory']['familyHistory'] if d['familialCancerHistory'] else 'MISSING')
print('  Diagnostic methods:', len(d['diagnosticMethods']))
print('  Treatments:', len(d['treatments']))
"

echo
echo "===== E2E PASS =====" >&2
