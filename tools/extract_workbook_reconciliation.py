#!/usr/bin/env python3
"""
Extracts and reconciles data from QLE_Unified_Owner_Review_AR_v0_2.xlsx
using standard library zipfile and ElementTree.
"""
import os
import json
import zipfile
import xml.etree.ElementTree as ET

WB_PATH = 'D:/APP/OPA/QLE_Unified_Owner_Review_AR_v0_2.xlsx'
DATA_DIR = 'server/studio/sgo/data'
os.makedirs(DATA_DIR, exist_ok=True)

NS = '{http://schemas.openxmlformats.org/spreadsheetml/2006/main}'

def parse_sheet(z, sheet_filename):
    xml_data = z.read(sheet_filename)
    root = ET.fromstring(xml_data)
    rows_data = []
    for r in root.findall(f'.//{NS}row'):
        row_num = int(r.attrib.get('r', 0))
        cells = {}
        for c in r.findall(f'{NS}c'):
            ref = c.attrib.get('r', '')
            col = ''.join(ch for ch in ref if ch.isalpha())
            is_elem = c.find(f'{NS}is')
            val = ''
            if is_elem is not None:
                val = ''.join(t_el.text or '' for t_el in is_elem.iter(f'{NS}t'))
            else:
                v = c.find(f'{NS}v')
                if v is not None:
                    val = v.text or ''
            cells[col] = val
        rows_data.append((row_num, cells))
    return rows_data

def main():
    print(f"Reading workbook: {WB_PATH}")
    with zipfile.ZipFile(WB_PATH, 'r') as z:
        # 1. Parse Sheet 2: مراجعة المالك (451 items)
        print("Parsing Sheet 2: مراجعة المالك...")
        s2_rows = parse_sheet(z, 'xl/worksheets/sheet2.xml')
        items_451 = []
        additions_28 = []
        for r_num, cells in s2_rows:
            if r_num < 6:
                continue
            item_id = cells.get('A', '').strip()
            if not item_id:
                continue
            title = cells.get('B', '').strip()
            batch = cells.get('C', '').strip()
            priority = cells.get('D', '').strip()
            treatment = cells.get('E', '').strip()
            rec_opt = cells.get('F', '').strip()
            rationale = cells.get('G', '').strip()
            opt_a = cells.get('H', '').strip()
            opt_b = cells.get('I', '').strip()
            opt_c = cells.get('J', '').strip()
            original_statement = cells.get('M', '').strip()
            proposed_statement = cells.get('N', '').strip()
            
            # Determine family
            if item_id.startswith('QL4-') or item_id.startswith('QL4_'):
                family = 'QL4'
                origin = 'V4'
            elif item_id.startswith('V2-') or item_id.startswith('V2_'):
                family = 'V2'
                origin = 'V2'
            elif item_id.startswith('LISAN-') or item_id.startswith('LISAN_'):
                family = 'LISAN'
                origin = 'SOURCE_255'
            elif item_id.startswith('QLE-ADD') or 'ADD' in treatment:
                family = 'QLE'
                origin = 'QLE_ADD'
            else:
                family = 'OTHER'
                origin = 'OTHER'

            item_obj = {
                'row_number': r_num,
                'id': item_id,
                'title_ar': title,
                'family': family,
                'origin': origin,
                'batch': batch,
                'priority': priority,
                'treatment_proposed': treatment,
                'recommended_option': rec_opt,
                'recommendation_rationale': rationale,
                'options': {
                    'A': opt_a,
                    'B': opt_b,
                    'C': opt_c
                },
                'original_statement_ar': original_statement,
                'proposed_statement_ar': proposed_statement,
                'owner_decision_status': 'لم يراجع',
                'runtime_status': 'DRAFT / INACTIVE',
                'observed_impact': 'NOT_MEASURED'
            }
            items_451.append(item_obj)
            if origin == 'QLE_ADD' or item_id.startswith('QLE-ADD'):
                additions_28.append(item_obj)

        print(f"Extracted {len(items_451)} items (including {len(additions_28)} QLE-ADD additions).")
        with open(os.path.join(DATA_DIR, 'workbook_451_items.json'), 'w', encoding='utf-8') as f:
            json.dump(items_451, f, ensure_ascii=False, indent=2)
        with open(os.path.join(DATA_DIR, 'workbook_28_additions.json'), 'w', encoding='utf-8') as f:
            json.dump(additions_28, f, ensure_ascii=False, indent=2)

        # 2. Parse Sheet 7: العلاقات والدمج (294 relations)
        print("Parsing Sheet 7: العلاقات والدمج...")
        s7_rows = parse_sheet(z, 'xl/worksheets/sheet7.xml')
        relations_294 = []
        for r_num, cells in s7_rows:
            if r_num < 6:
                continue
            rel_id = cells.get('A', '').strip()
            if not rel_id:
                continue
            rel_type = cells.get('B', '').strip()
            source = cells.get('C', '').strip()
            target = cells.get('D', '').strip()
            basis = cells.get('E', '').strip() # FACT or INFERENCE
            evidence = cells.get('F', '').strip()
            recommendation = cells.get('G', '').strip()
            authority_required = cells.get('H', '').strip()

            relations_294.append({
                'row_number': r_num,
                'relation_id': rel_id,
                'relation_type': rel_type,
                'source': source,
                'target': target,
                'basis': basis,
                'evidence': evidence,
                'recommendation': recommendation,
                'authority_required': authority_required
            })

        print(f"Extracted {len(relations_294)} relations from Sheet 7.")
        with open(os.path.join(DATA_DIR, 'workbook_294_relations.json'), 'w', encoding='utf-8') as f:
            json.dump(relations_294, f, ensure_ascii=False, indent=2)

        # 3. Parse Sheet 8: اختبارات مقترحة (882 tests)
        print("Parsing Sheet 8: اختبارات مقترحة...")
        s8_rows = parse_sheet(z, 'xl/worksheets/sheet8.xml')
        tests_882 = []
        for r_num, cells in s8_rows:
            if r_num < 6:
                continue
            test_id = cells.get('A', '').strip()
            if not test_id:
                continue
            target_unit = cells.get('B', '').strip()
            origins = cells.get('C', '').strip()
            title = cells.get('D', '').strip()
            case_type = cells.get('E', '').strip() # POSITIVE, NEGATIVE, UNKNOWN
            preconditions = cells.get('F', '').strip()
            input_scenario = cells.get('G', '').strip()
            expected_oracle = cells.get('H', '').strip()

            tests_882.append({
                'row_number': r_num,
                'test_id': test_id,
                'target_unit': target_unit,
                'origins': origins,
                'title': title,
                'case_type': case_type,
                'preconditions': preconditions,
                'input_scenario': input_scenario,
                'expected_oracle': expected_oracle,
                'execution_status': 'DESIGNED_NOT_RUN'
            })

        print(f"Extracted {len(tests_882)} tests from Sheet 8.")
        with open(os.path.join(DATA_DIR, 'workbook_882_tests.json'), 'w', encoding='utf-8') as f:
            json.dump(tests_882, f, ensure_ascii=False, indent=2)

        print("Workbook extraction complete.")

if __name__ == '__main__':
    main()
