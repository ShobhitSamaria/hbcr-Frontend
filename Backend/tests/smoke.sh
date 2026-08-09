#!/usr/bin/env bash
# HBCR API smoke tests. Run after `tsx prisma/seed.ts`.
# Usage:
#   PORT=5050 BASE=http://localhost:5050/api ./tests/smoke.sh

set -e
BASE=${BASE:-http://localhost:5050/api}
PASS=0
FAIL=0

assert_ok() {
  local name="$1"; shift
  local resp
  resp=$(curl -s -w "\nHTTP:%{http_code}" "$@")
  local code=$(echo "$resp" | tail -n1 | cut -d: -f2)
  local body=$(echo "$resp" | sed '$d')
  local success=$(echo "$body" | python3 -c "import sys,json
try: print(json.loads(sys.stdin.read()).get('success'))
except: print(False)" 2>/dev/null)
  if [[ "$code" =~ ^2 && "$success" == "True" ]]; then
    echo "✅ $name"
    PASS=$((PASS+1))
  else
    echo "❌ $name -> code=$code body=$body"
    FAIL=$((FAIL+1))
  fi
}

assert_status() {
  local name="$1"; local want="$2"; shift 2
  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" "$@")
  if [[ "$code" == "$want" ]]; then
    echo "✅ $name (HTTP $code)"
    PASS=$((PASS+1))
  else
    echo "❌ $name -> want $want got $code"
    FAIL=$((FAIL+1))
  fi
}

echo "=== HEALTH ==="
assert_ok  "GET /api/health"         "$BASE/health"
assert_ok  "GET /api/health/live"    "$BASE/health/live"
assert_ok  "GET /api/health/ready"   "$BASE/health/ready"

echo "=== AUX ==="
assert_ok  "GET /api/centres"        "$BASE/centres"
assert_ok  "GET /api/hospitals"      "$BASE/hospitals"
assert_ok  "GET /api/users"          "$BASE/users"
assert_ok  "GET /api/dashboard/stats"      "$BASE/dashboard/stats"
assert_ok  "GET /api/dashboard/case-overview" "$BASE/dashboard/case-overview"
assert_ok  "GET /api/dashboard/recent"     "$BASE/dashboard/recent"
assert_ok  "GET /api/dashboard/monthly"    "$BASE/dashboard/monthly"

echo "=== PATIENTS ==="
assert_ok  "GET /api/patients"                "$BASE/patients?limit=5"
assert_ok  "GET /api/patients?search=Anita"   "$BASE/patients?search=Anita"
assert_ok  "GET /api/patients?gender=FEMALE"  "$BASE/patients?gender=FEMALE"
assert_ok  "GET /api/patients/101"            "$BASE/patients/101"

# Patient lifecycle
NEW=$(curl -s -X POST "$BASE/patients" -H "Content-Type: application/json" -d '{"fullName":"Smoke Tester","age":42,"gender":"MALE","dateOfBirth":"1982-01-15"}')
PID=$(echo "$NEW" | python3 -c "import sys,json;print(json.loads(sys.stdin.read())['data']['id'])")
assert_status "POST /api/patients (created)" 201 -X POST "$BASE/patients" -H "Content-Type: application/json" -d '{"fullName":"Another Patient","age":33,"gender":"FEMALE"}'

assert_status "POST /api/patients (bad)"      422 -X POST "$BASE/patients" -H "Content-Type: application/json" -d '{}'
assert_status "GET /api/patients/abc"         400 "$BASE/patients/abc"
assert_status "GET /api/patients/99999 (NF)"  404 "$BASE/patients/99999"
assert_status "DELETE /api/patients/$PID"     204 -X DELETE "$BASE/patients/$PID"

echo "=== PATIENT SIDE TABLES ==="
# We use existing patient 101 from the seed
assert_ok  "POST identifications"           -X POST "$BASE/patients/101/side/identifications" -H "Content-Type: application/json" -d '{"idType":"AADHAAR","number":"111122223333"}'
assert_ok  "POST relatives"                 -X POST "$BASE/patients/101/side/relatives"     -H "Content-Type: application/json" -d '{"relationship":"MOTHER","name":"X"}'
assert_ok  "POST addresses (good PIN)"      -X POST "$BASE/patients/101/side/addresses"     -H "Content-Type: application/json" -d '{"addressType":"RESIDENTIAL","city":"D","pinCode":"110001"}'
assert_status "POST addresses (bad PIN)"    422 -X POST "$BASE/patients/101/side/addresses" -H "Content-Type: application/json" -d '{"addressType":"PERMANENT","pinCode":"ABC"}'
assert_ok  "POST habits"                    -X POST "$BASE/patients/101/side/habits"        -H "Content-Type: application/json" -d '{"habit":"SMOKING","answer":"YES","durationMonths":12}'
assert_ok  "POST comorbidities"             -X POST "$BASE/patients/101/side/comorbidities" -H "Content-Type: application/json" -d '{"comorbidity":"DIABETES","answer":"NO"}'

echo "=== REGISTRATIONS ==="
REG=$(curl -s -X POST "$BASE/patients/101/registrations" -H "Content-Type: application/json" \
  -d '{"hbcrRegistrationNo":"HBCR-2024-7891","hospitalId":1,"dateOfReporting":"2024-07-01","dateOfFirstDiagnosis":"2024-06-25","referralType":"SELF","status":"ACTIVE"}')
RID=$(echo "$REG" | python3 -c "import sys,json;print(json.loads(sys.stdin.read())['data']['id'])")
assert_ok  "GET /api/registrations"   "$BASE/registrations?limit=3"
assert_ok  "GET /api/registrations/$RID" "$BASE/registrations/$RID"
assert_ok  "PATCH /api/registrations/$RID" -X PATCH "$BASE/registrations/$RID" -H "Content-Type: application/json" -d '{"status":"PENDING"}'
assert_status "POST reg (bad hbcr no)"  422 -X POST "$BASE/patients/101/registrations" -H "Content-Type: application/json" -d '{"hbcrRegistrationNo":"BAD","hospitalId":1}'
assert_status "POST reg (missing patient)"  404 -X POST "$BASE/patients/99999/registrations" -H "Content-Type: application/json" -d '{"hbcrRegistrationNo":"HBCR-2024-7799","hospitalId":1}'

echo "=== DIAGNOSTIC ==="
DM=$(curl -s -X POST "$BASE/registrations/$RID/diagnostic-methods" -H "Content-Type: application/json" -d '{"method":"MICROSCOPIC"}')
MID=$(echo "$DM" | python3 -c "import sys,json;print(json.loads(sys.stdin.read())['data']['id'])")
assert_ok  "GET methods"                       "$BASE/registrations/$RID/diagnostic-methods"
assert_ok  "POST procedure"                    -X POST "$BASE/diagnostic-methods/$MID/procedures" -H "Content-Type: application/json" -d '{"procedureName":"(a). X","procedureDate":"2024-06-26"}'
PID2=$(curl -s "$BASE/diagnostic-methods/$MID/procedures" | python3 -c "import sys,json;print(json.loads(sys.stdin.read())['data'][0]['id'])")
assert_ok  "PATCH procedure"                   -X PATCH "$BASE/diagnostic-procedures/$PID2" -H "Content-Type: application/json" -d '{"othersSpecify":"Updated"}'

echo "=== PATHOLOGY ==="
assert_ok  "POST pathology (upsert)"   -X POST "$BASE/registrations/$RID/pathological-diagnosis" -H "Content-Type: application/json" -d '{"icdoTopography":"C50","icdoMorphology":"8500/3","icd10Site":"C50","laterality":"PAIRED_SITE","pairedLaterality":"LEFT","sequence":"ONE_PRIMARY"}'
assert_ok  "GET pathology"             "$BASE/registrations/$RID/pathological-diagnosis"

echo "=== FAMILY HISTORY ==="
assert_ok  "POST family history"   -X POST "$BASE/registrations/$RID/family-history" -H "Content-Type: application/json" -d '{"familyHistory":"YES","relationshipWithCancer":"SAME_CANCER","degreeOfRelationship":"FIRST_DEGREE","primarySite":"BREAST","ageAtDiagnosis":40,"dateOfDiagnosis":"2010-01-01"}'
assert_ok  "GET family history"    "$BASE/registrations/$RID/family-history"

echo "=== TREATMENTS ==="
T1=$(curl -s -X POST "$BASE/registrations/$RID/treatments" -H "Content-Type: application/json" -d '{"treatmentStage":"PRIOR_REGISTRATION","treatmentGivenChoice":"YES","treatmentType":"ALLOPATHIC"}')
T1ID=$(echo "$T1" | python3 -c "import sys,json;print(json.loads(sys.stdin.read())['data']['id'])")
T2=$(curl -s -X POST "$BASE/registrations/$RID/treatments" -H "Content-Type: application/json" -d '{"treatmentStage":"AT_RI","treatmentGivenChoice":"YES","treatmentType":"ALLOPATHIC"}')
T2ID=$(echo "$T2" | python3 -c "import sys,json;print(json.loads(sys.stdin.read())['data']['id'])")
assert_ok  "GET treatments"          "$BASE/registrations/$RID/treatments"
MOD=$(curl -s -X POST "$BASE/treatments/$T2ID/modalities" -H "Content-Type: application/json" -d '{"modality":"SURGERY","isSelected":true,"details":"COMPLETED_TREATMENT","startDate":"2024-07-02"}')
MODID=$(echo "$MOD" | python3 -c "import sys,json;print(json.loads(sys.stdin.read())['data']['id'])")
assert_ok  "GET modalities"          "$BASE/treatments/$T2ID/modalities"
assert_ok  "PATCH modality"          -X PATCH "$BASE/treatment-modalities/$MODID" -H "Content-Type: application/json" -d '{"endDate":"2024-07-12"}'

echo "=== TEARDOWN ==="
assert_status "DELETE modality"          204 -X DELETE "$BASE/treatment-modalities/$MODID"
assert_status "DELETE treatment 1"       204 -X DELETE "$BASE/treatments/$T1ID"
assert_status "DELETE diagnostic-method" 204 -X DELETE "$BASE/diagnostic-methods/$MID"
assert_status "DELETE pathology"         204 -X DELETE "$BASE/registrations/$RID/pathological-diagnosis"
assert_status "DELETE family-history"    204 -X DELETE "$BASE/registrations/$RID/family-history"
assert_status "DELETE registration"      204 -X DELETE "$BASE/registrations/$RID"

echo
echo "===== RESULT ====="
echo "PASS: $PASS"
echo "FAIL: $FAIL"
[[ $FAIL -eq 0 ]] && echo "ALL OK ✅" || echo "SOME TESTS FAILED ❌"
exit $FAIL
