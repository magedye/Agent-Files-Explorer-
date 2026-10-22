# عقد بيانات — التفاصيل الكاملة

وحدات مستخرجة للمراجعة؛ ورود النص هنا لا يمنحه صلاحية أو قبولًا جديدًا. مصادر الحزمة تبقى مستقلة عن اقتراحات الترحيل.

## SCHEMA-EVIDENCE — schemas/EVIDENCE.schema.json

المصدر: [governance_packages/candidates/AGHR_Candidate_1.3.0/schemas/EVIDENCE.schema.json](../../../../governance_packages/candidates/AGHR_Candidate_1.3.0/schemas/EVIDENCE.schema.json).

الموضع: بيانات الكائن الجذري.

بصمة المصدر SHA-256: 3d89a181e072b0ebd398e5218599823a7de2179e4954136abdedcd6dc6105ad7

القوة المعلنة: غير محددة على مستوى هذا السجل؛ المقارنة: UNCHANGED_RECORD.

القواعد المرتبطة: لم يصرح المصدر بربط مباشر. الربط سياقي، ولا يثبت التطابق الدلالي.

### النص الأصلي

<pre dir="auto">{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "EVIDENCE",
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "minLength": 1
    },
    "criterion_ids": {
      "type": "array",
      "items": {
        "type": "string",
        "minLength": 1
      },
      "minItems": 1
    },
    "kind": {
      "type": "string",
      "enum": &#91;
        "TEST",
        "INSPECTION",
        "POLICY",
        "RUNTIME",
        "EVALUATION"
      &#93;
    },
    "result": {
      "type": "string",
      "enum": &#91;
        "PASS",
        "FAIL",
        "NOT_RUN",
        "BLOCKED",
        "ERROR",
        "NOT_APPLICABLE"
      &#93;
    },
    "candidate_sha256": {
      "type": "string",
      "pattern": "^&#91;0-9a-f&#93;{64}$"
    },
    "environment_id": {
      "type": "string",
      "minLength": 1
    },
    "started_at": {
      "anyOf": &#91;
        {
          "type": "string",
          "minLength": 1
        },
        {
          "type": "null"
        }
      &#93;
    },
    "finished_at": {
      "anyOf": &#91;
        {
          "type": "string",
          "minLength": 1
        },
        {
          "type": "null"
        }
      &#93;
    },
    "command_or_method": {
      "type": "string",
      "minLength": 1
    },
    "target_count": {
      "type": "integer",
      "minimum": 0
    },
    "tests_executed": {
      "type": "integer",
      "minimum": 0
    },
    "artifacts": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "path": {
            "type": "string",
            "minLength": 1
          },
          "sha256": {
            "type": "string",
            "pattern": "^&#91;0-9a-f&#93;{64}$"
          }
        },
        "required": &#91;
          "path",
          "sha256"
        &#93;,
        "additionalProperties": false
      },
      "minItems": 0
    },
    "limitations": {
      "type": "array",
      "items": {
        "type": "string",
        "minLength": 1
      },
      "minItems": 0
    },
    "producer": {
      "type": "string",
      "minLength": 1
    }
  },
  "required": &#91;
    "id",
    "criterion_ids",
    "kind",
    "result",
    "candidate_sha256",
    "environment_id",
    "started_at",
    "finished_at",
    "command_or_method",
    "target_count",
    "tests_executed",
    "artifacts",
    "limitations",
    "producer"
  &#93;,
  "additionalProperties": false
}</pre>

### بيانات السجل الأصلية كاملة

<pre dir="auto">{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "EVIDENCE",
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "minLength": 1
    },
    "criterion_ids": {
      "type": "array",
      "items": {
        "type": "string",
        "minLength": 1
      },
      "minItems": 1
    },
    "kind": {
      "type": "string",
      "enum": &#91;
        "TEST",
        "INSPECTION",
        "POLICY",
        "RUNTIME",
        "EVALUATION"
      &#93;
    },
    "result": {
      "type": "string",
      "enum": &#91;
        "PASS",
        "FAIL",
        "NOT_RUN",
        "BLOCKED",
        "ERROR",
        "NOT_APPLICABLE"
      &#93;
    },
    "candidate_sha256": {
      "type": "string",
      "pattern": "^&#91;0-9a-f&#93;{64}$"
    },
    "environment_id": {
      "type": "string",
      "minLength": 1
    },
    "started_at": {
      "anyOf": &#91;
        {
          "type": "string",
          "minLength": 1
        },
        {
          "type": "null"
        }
      &#93;
    },
    "finished_at": {
      "anyOf": &#91;
        {
          "type": "string",
          "minLength": 1
        },
        {
          "type": "null"
        }
      &#93;
    },
    "command_or_method": {
      "type": "string",
      "minLength": 1
    },
    "target_count": {
      "type": "integer",
      "minimum": 0
    },
    "tests_executed": {
      "type": "integer",
      "minimum": 0
    },
    "artifacts": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "path": {
            "type": "string",
            "minLength": 1
          },
          "sha256": {
            "type": "string",
            "pattern": "^&#91;0-9a-f&#93;{64}$"
          }
        },
        "required": &#91;
          "path",
          "sha256"
        &#93;,
        "additionalProperties": false
      },
      "minItems": 0
    },
    "limitations": {
      "type": "array",
      "items": {
        "type": "string",
        "minLength": 1
      },
      "minItems": 0
    },
    "producer": {
      "type": "string",
      "minLength": 1
    }
  },
  "required": &#91;
    "id",
    "criterion_ids",
    "kind",
    "result",
    "candidate_sha256",
    "environment_id",
    "started_at",
    "finished_at",
    "command_or_method",
    "target_count",
    "tests_executed",
    "artifacts",
    "limitations",
    "producer"
  &#93;,
  "additionalProperties": false
}</pre>

### استكمال المراجعة والترحيل

النوع المقترح: يحدد عند المراجعة؛ المسار: DATA_CONTRACT_REVIEW.

شاشات التطبيق المقترحة: Instruction Detail / Intake & Learning.

البيانات المطلوب استكمالها: classification_and_target_route، owning_item_or_procedure، review_disposition.

حالة المراجعة: PENDING_REVIEW. القرار: لم يحدد؛ السبب: لم يسجل. الاستيراد كسياسة حاكمة يحتاج قرارًا مخولًا خارج ملف المراجعة.

## SCHEMA-LESSON — schemas/LESSON.schema.json

المصدر: [governance_packages/candidates/AGHR_Candidate_1.3.0/schemas/LESSON.schema.json](../../../../governance_packages/candidates/AGHR_Candidate_1.3.0/schemas/LESSON.schema.json).

الموضع: بيانات الكائن الجذري.

بصمة المصدر SHA-256: e8fe8b12ee0c32f288f5e209f893b54a5b116de2778a623d2d5418485824c91f

القوة المعلنة: غير محددة على مستوى هذا السجل؛ المقارنة: UNCHANGED_RECORD.

القواعد المرتبطة: لم يصرح المصدر بربط مباشر. الربط سياقي، ولا يثبت التطابق الدلالي.

### النص الأصلي

<pre dir="auto">{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "LESSON",
  "type": "object",
  "additionalProperties": false,
  "required": &#91;
    "schema_version",
    "lesson_id",
    "title",
    "kind",
    "source",
    "problem",
    "root_cause",
    "evidence",
    "counterevidence",
    "detection_signal",
    "proposed_instruction",
    "applicability",
    "confidence",
    "knowledge_state",
    "execution_state",
    "reconciliation",
    "disposition",
    "authority",
    "effect",
    "supersedes"
  &#93;,
  "properties": {
    "schema_version": {
      "type": "string",
      "enum": &#91;
        "1.0"
      &#93;
    },
    "lesson_id": {
      "type": "string",
      "pattern": "^LES-&#91;A-Z0-9&#93;+(?:-&#91;A-Z0-9&#93;+)*$"
    },
    "title": {
      "type": "string",
      "minLength": 1
    },
    "kind": {
      "type": "string",
      "enum": &#91;
        "LESSON",
        "OBSERVATION",
        "RULE",
        "POLICY",
        "PROCEDURE",
        "SKILL",
        "TECHNICAL_CONTROL",
        "RECOMMENDATION",
        "RISK"
      &#93;
    },
    "source": {
      "type": "object",
      "additionalProperties": false,
      "required": &#91;
        "locator",
        "sha256",
        "channel_observed",
        "trust"
      &#93;,
      "properties": {
        "locator": {
          "type": "string",
          "minLength": 1
        },
        "sha256": {
          "type": "string",
          "pattern": "^&#91;0-9a-f&#93;{64}$"
        },
        "channel_observed": {
          "type": "string",
          "enum": &#91;
            "USER",
            "FILE_DATA",
            "TOOL_DATA",
            "UNKNOWN"
          &#93;
        },
        "trust": {
          "type": "string",
          "enum": &#91;
            "TRUSTED_FOR_SCOPE",
            "UNTRUSTED_DATA",
            "UNVERIFIED"
          &#93;
        }
      }
    },
    "problem": {
      "type": "string",
      "minLength": 1
    },
    "root_cause": {
      "type": "object",
      "additionalProperties": false,
      "required": &#91;
        "status",
        "explanation",
        "evidence_refs"
      &#93;,
      "properties": {
        "status": {
          "type": "string",
          "enum": &#91;
            "PROVEN",
            "UNPROVEN"
          &#93;
        },
        "explanation": {
          "type": "string",
          "minLength": 1
        },
        "evidence_refs": {
          "type": "array",
          "items": {
            "type": "string",
            "minLength": 1
          }
        }
      }
    },
    "evidence": {
      "type": "array",
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": &#91;
          "path",
          "sha256",
          "candidate_id",
          "result"
        &#93;,
        "properties": {
          "path": {
            "type": "string",
            "minLength": 1
          },
          "sha256": {
            "type": "string",
            "pattern": "^&#91;0-9a-f&#93;{64}$"
          },
          "candidate_id": {
            "type": "string",
            "minLength": 1
          },
          "result": {
            "type": "string",
            "enum": &#91;
              "PASS",
              "FAIL",
              "OBSERVATION"
            &#93;
          }
        }
      }
    },
    "counterevidence": {
      "type": "array",
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": &#91;
          "path",
          "resolution",
          "rationale",
          "resolution_refs"
        &#93;,
        "properties": {
          "path": {
            "type": "string",
            "minLength": 1
          },
          "resolution": {
            "type": "string",
            "enum": &#91;
              "UNRESOLVED",
              "RESOLVED"
            &#93;
          },
          "rationale": {
            "type": "string",
            "minLength": 1
          },
          "resolution_refs": {
            "type": "array",
            "items": {
              "type": "string",
              "minLength": 1
            }
          }
        }
      }
    },
    "detection_signal": {
      "type": "string",
      "minLength": 1
    },
    "proposed_instruction": {
      "type": "object",
      "additionalProperties": false,
      "required": &#91;
        "text",
        "force",
        "scope",
        "owner_ref",
        "target",
        "verification"
      &#93;,
      "properties": {
        "text": {
          "type": "string",
          "minLength": 1
        },
        "force": {
          "type": "string",
          "enum": &#91;
            "MUST",
            "MUST_NOT",
            "SHOULD",
            "SHOULD_NOT",
            "MAY",
            "INFORMATIVE",
            "UNRESOLVED"
          &#93;
        },
        "scope": {
          "type": "string",
          "enum": &#91;
            "PROJECT",
            "PACKAGE",
            "PERSONAL"
          &#93;
        },
        "owner_ref": {
          "type": "string",
          "minLength": 1
        },
        "target": {
          "type": "string",
          "minLength": 1
        },
        "verification": {
          "type": "string",
          "minLength": 1
        }
      }
    },
    "applicability": {
      "type": "object",
      "additionalProperties": false,
      "required": &#91;
        "candidate_id",
        "context",
        "review_after"
      &#93;,
      "properties": {
        "candidate_id": {
          "type": "string",
          "minLength": 1
        },
        "context": {
          "type": "string",
          "minLength": 1
        },
        "review_after": {
          "anyOf": &#91;
            {
              "type": "string",
              "minLength": 1
            },
            {
              "type": "null"
            }
          &#93;
        }
      }
    },
    "confidence": {
      "type": "object",
      "additionalProperties": false,
      "required": &#91;
        "level",
        "reason"
      &#93;,
      "properties": {
        "level": {
          "type": "string",
          "enum": &#91;
            "LOW",
            "MEDIUM",
            "HIGH"
          &#93;
        },
        "reason": {
          "type": "string",
          "minLength": 1
        }
      }
    },
    "knowledge_state": {
      "type": "string",
      "enum": &#91;
        "CANDIDATE",
        "SUPPORTED",
        "NEEDS_REVIEW",
        "STALE",
        "SUPERSEDED",
        "REJECTED"
      &#93;
    },
    "execution_state": {
      "type": "string",
      "enum": &#91;
        "NOT_APPLIED",
        "APPLIED",
        "DEFERRED",
        "NOT_APPLICABLE"
      &#93;
    },
    "reconciliation": {
      "type": "object",
      "additionalProperties": false,
      "required": &#91;
        "coverage",
        "coverage_refs",
        "conflicts",
        "duplicate_of",
        "rationale"
      &#93;,
      "properties": {
        "coverage": {
          "type": "string",
          "enum": &#91;
            "COVERED",
            "PARTIAL",
            "MISSING",
            "CONFLICT",
            "UNVERIFIED",
            "NOT_APPLICABLE"
          &#93;
        },
        "coverage_refs": {
          "type": "array",
          "items": {
            "type": "string",
            "minLength": 1
          }
        },
        "conflicts": {
          "type": "array",
          "items": {
            "type": "string",
            "minLength": 1
          }
        },
        "duplicate_of": {
          "anyOf": &#91;
            {
              "type": "string",
              "pattern": "^LES-&#91;A-Z0-9&#93;+(?:-&#91;A-Z0-9&#93;+)*$"
            },
            {
              "type": "null"
            }
          &#93;
        },
        "rationale": {
          "type": "string",
          "minLength": 1
        }
      }
    },
    "disposition": {
      "type": "string",
      "enum": &#91;
        "ADOPT",
        "RECONCILE",
        "REJECT",
        "DEFER",
        "HOLD",
        "REFERENCE_ONLY"
      &#93;
    },
    "authority": {
      "type": "object",
      "additionalProperties": false,
      "required": &#91;
        "capture_ref",
        "adoption_ref",
        "effect_ref"
      &#93;,
      "properties": {
        "capture_ref": {
          "type": "string",
          "minLength": 1
        },
        "adoption_ref": {
          "anyOf": &#91;
            {
              "type": "string",
              "minLength": 1
            },
            {
              "type": "null"
            }
          &#93;
        },
        "effect_ref": {
          "anyOf": &#91;
            {
              "type": "string",
              "minLength": 1
            },
            {
              "type": "null"
            }
          &#93;
        }
      }
    },
    "effect": {
      "type": "object",
      "additionalProperties": false,
      "required": &#91;
        "artifact_refs",
        "verification_refs"
      &#93;,
      "properties": {
        "artifact_refs": {
          "type": "array",
          "items": {
            "type": "string",
            "minLength": 1
          }
        },
        "verification_refs": {
          "type": "array",
          "items": {
            "type": "string",
            "minLength": 1
          }
        }
      }
    },
    "supersedes": {
      "anyOf": &#91;
        {
          "type": "string",
          "pattern": "^LES-&#91;A-Z0-9&#93;+(?:-&#91;A-Z0-9&#93;+)*$"
        },
        {
          "type": "null"
        }
      &#93;
    }
  }
}</pre>

### بيانات السجل الأصلية كاملة

<pre dir="auto">{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "LESSON",
  "type": "object",
  "additionalProperties": false,
  "required": &#91;
    "schema_version",
    "lesson_id",
    "title",
    "kind",
    "source",
    "problem",
    "root_cause",
    "evidence",
    "counterevidence",
    "detection_signal",
    "proposed_instruction",
    "applicability",
    "confidence",
    "knowledge_state",
    "execution_state",
    "reconciliation",
    "disposition",
    "authority",
    "effect",
    "supersedes"
  &#93;,
  "properties": {
    "schema_version": {
      "type": "string",
      "enum": &#91;
        "1.0"
      &#93;
    },
    "lesson_id": {
      "type": "string",
      "pattern": "^LES-&#91;A-Z0-9&#93;+(?:-&#91;A-Z0-9&#93;+)*$"
    },
    "title": {
      "type": "string",
      "minLength": 1
    },
    "kind": {
      "type": "string",
      "enum": &#91;
        "LESSON",
        "OBSERVATION",
        "RULE",
        "POLICY",
        "PROCEDURE",
        "SKILL",
        "TECHNICAL_CONTROL",
        "RECOMMENDATION",
        "RISK"
      &#93;
    },
    "source": {
      "type": "object",
      "additionalProperties": false,
      "required": &#91;
        "locator",
        "sha256",
        "channel_observed",
        "trust"
      &#93;,
      "properties": {
        "locator": {
          "type": "string",
          "minLength": 1
        },
        "sha256": {
          "type": "string",
          "pattern": "^&#91;0-9a-f&#93;{64}$"
        },
        "channel_observed": {
          "type": "string",
          "enum": &#91;
            "USER",
            "FILE_DATA",
            "TOOL_DATA",
            "UNKNOWN"
          &#93;
        },
        "trust": {
          "type": "string",
          "enum": &#91;
            "TRUSTED_FOR_SCOPE",
            "UNTRUSTED_DATA",
            "UNVERIFIED"
          &#93;
        }
      }
    },
    "problem": {
      "type": "string",
      "minLength": 1
    },
    "root_cause": {
      "type": "object",
      "additionalProperties": false,
      "required": &#91;
        "status",
        "explanation",
        "evidence_refs"
      &#93;,
      "properties": {
        "status": {
          "type": "string",
          "enum": &#91;
            "PROVEN",
            "UNPROVEN"
          &#93;
        },
        "explanation": {
          "type": "string",
          "minLength": 1
        },
        "evidence_refs": {
          "type": "array",
          "items": {
            "type": "string",
            "minLength": 1
          }
        }
      }
    },
    "evidence": {
      "type": "array",
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": &#91;
          "path",
          "sha256",
          "candidate_id",
          "result"
        &#93;,
        "properties": {
          "path": {
            "type": "string",
            "minLength": 1
          },
          "sha256": {
            "type": "string",
            "pattern": "^&#91;0-9a-f&#93;{64}$"
          },
          "candidate_id": {
            "type": "string",
            "minLength": 1
          },
          "result": {
            "type": "string",
            "enum": &#91;
              "PASS",
              "FAIL",
              "OBSERVATION"
            &#93;
          }
        }
      }
    },
    "counterevidence": {
      "type": "array",
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": &#91;
          "path",
          "resolution",
          "rationale",
          "resolution_refs"
        &#93;,
        "properties": {
          "path": {
            "type": "string",
            "minLength": 1
          },
          "resolution": {
            "type": "string",
            "enum": &#91;
              "UNRESOLVED",
              "RESOLVED"
            &#93;
          },
          "rationale": {
            "type": "string",
            "minLength": 1
          },
          "resolution_refs": {
            "type": "array",
            "items": {
              "type": "string",
              "minLength": 1
            }
          }
        }
      }
    },
    "detection_signal": {
      "type": "string",
      "minLength": 1
    },
    "proposed_instruction": {
      "type": "object",
      "additionalProperties": false,
      "required": &#91;
        "text",
        "force",
        "scope",
        "owner_ref",
        "target",
        "verification"
      &#93;,
      "properties": {
        "text": {
          "type": "string",
          "minLength": 1
        },
        "force": {
          "type": "string",
          "enum": &#91;
            "MUST",
            "MUST_NOT",
            "SHOULD",
            "SHOULD_NOT",
            "MAY",
            "INFORMATIVE",
            "UNRESOLVED"
          &#93;
        },
        "scope": {
          "type": "string",
          "enum": &#91;
            "PROJECT",
            "PACKAGE",
            "PERSONAL"
          &#93;
        },
        "owner_ref": {
          "type": "string",
          "minLength": 1
        },
        "target": {
          "type": "string",
          "minLength": 1
        },
        "verification": {
          "type": "string",
          "minLength": 1
        }
      }
    },
    "applicability": {
      "type": "object",
      "additionalProperties": false,
      "required": &#91;
        "candidate_id",
        "context",
        "review_after"
      &#93;,
      "properties": {
        "candidate_id": {
          "type": "string",
          "minLength": 1
        },
        "context": {
          "type": "string",
          "minLength": 1
        },
        "review_after": {
          "anyOf": &#91;
            {
              "type": "string",
              "minLength": 1
            },
            {
              "type": "null"
            }
          &#93;
        }
      }
    },
    "confidence": {
      "type": "object",
      "additionalProperties": false,
      "required": &#91;
        "level",
        "reason"
      &#93;,
      "properties": {
        "level": {
          "type": "string",
          "enum": &#91;
            "LOW",
            "MEDIUM",
            "HIGH"
          &#93;
        },
        "reason": {
          "type": "string",
          "minLength": 1
        }
      }
    },
    "knowledge_state": {
      "type": "string",
      "enum": &#91;
        "CANDIDATE",
        "SUPPORTED",
        "NEEDS_REVIEW",
        "STALE",
        "SUPERSEDED",
        "REJECTED"
      &#93;
    },
    "execution_state": {
      "type": "string",
      "enum": &#91;
        "NOT_APPLIED",
        "APPLIED",
        "DEFERRED",
        "NOT_APPLICABLE"
      &#93;
    },
    "reconciliation": {
      "type": "object",
      "additionalProperties": false,
      "required": &#91;
        "coverage",
        "coverage_refs",
        "conflicts",
        "duplicate_of",
        "rationale"
      &#93;,
      "properties": {
        "coverage": {
          "type": "string",
          "enum": &#91;
            "COVERED",
            "PARTIAL",
            "MISSING",
            "CONFLICT",
            "UNVERIFIED",
            "NOT_APPLICABLE"
          &#93;
        },
        "coverage_refs": {
          "type": "array",
          "items": {
            "type": "string",
            "minLength": 1
          }
        },
        "conflicts": {
          "type": "array",
          "items": {
            "type": "string",
            "minLength": 1
          }
        },
        "duplicate_of": {
          "anyOf": &#91;
            {
              "type": "string",
              "pattern": "^LES-&#91;A-Z0-9&#93;+(?:-&#91;A-Z0-9&#93;+)*$"
            },
            {
              "type": "null"
            }
          &#93;
        },
        "rationale": {
          "type": "string",
          "minLength": 1
        }
      }
    },
    "disposition": {
      "type": "string",
      "enum": &#91;
        "ADOPT",
        "RECONCILE",
        "REJECT",
        "DEFER",
        "HOLD",
        "REFERENCE_ONLY"
      &#93;
    },
    "authority": {
      "type": "object",
      "additionalProperties": false,
      "required": &#91;
        "capture_ref",
        "adoption_ref",
        "effect_ref"
      &#93;,
      "properties": {
        "capture_ref": {
          "type": "string",
          "minLength": 1
        },
        "adoption_ref": {
          "anyOf": &#91;
            {
              "type": "string",
              "minLength": 1
            },
            {
              "type": "null"
            }
          &#93;
        },
        "effect_ref": {
          "anyOf": &#91;
            {
              "type": "string",
              "minLength": 1
            },
            {
              "type": "null"
            }
          &#93;
        }
      }
    },
    "effect": {
      "type": "object",
      "additionalProperties": false,
      "required": &#91;
        "artifact_refs",
        "verification_refs"
      &#93;,
      "properties": {
        "artifact_refs": {
          "type": "array",
          "items": {
            "type": "string",
            "minLength": 1
          }
        },
        "verification_refs": {
          "type": "array",
          "items": {
            "type": "string",
            "minLength": 1
          }
        }
      }
    },
    "supersedes": {
      "anyOf": &#91;
        {
          "type": "string",
          "pattern": "^LES-&#91;A-Z0-9&#93;+(?:-&#91;A-Z0-9&#93;+)*$"
        },
        {
          "type": "null"
        }
      &#93;
    }
  }
}</pre>

### استكمال المراجعة والترحيل

النوع المقترح: يحدد عند المراجعة؛ المسار: LEARNING_CONTRACT_REVIEW.

شاشات التطبيق المقترحة: Intake & Learning / Change Package Detail.

البيانات المطلوب استكمالها: classification_and_target_route، owning_item_or_procedure، review_disposition.

حالة المراجعة: PENDING_REVIEW. القرار: لم يحدد؛ السبب: لم يسجل. الاستيراد كسياسة حاكمة يحتاج قرارًا مخولًا خارج ملف المراجعة.

## SCHEMA-PROJECT — schemas/PROJECT.schema.json

المصدر: [governance_packages/candidates/AGHR_Candidate_1.3.0/schemas/PROJECT.schema.json](../../../../governance_packages/candidates/AGHR_Candidate_1.3.0/schemas/PROJECT.schema.json).

الموضع: بيانات الكائن الجذري.

بصمة المصدر SHA-256: e4b1b447fd92fc61fae75d6db5c59446a5ecdab4afe4b00d2d8f6c2e815ded08

القوة المعلنة: غير محددة على مستوى هذا السجل؛ المقارنة: UNCHANGED_RECORD.

القواعد المرتبطة: لم يصرح المصدر بربط مباشر. الربط سياقي، ولا يثبت التطابق الدلالي.

### النص الأصلي

<pre dir="auto">{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "PROJECT",
  "type": "object",
  "properties": {
    "schema_version": {
      "type": "string",
      "enum": &#91;
        "1.0"
      &#93;
    },
    "project_id": {
      "type": "string",
      "minLength": 1
    },
    "name": {
      "type": "string",
      "minLength": 1
    },
    "owner": {
      "type": "string",
      "minLength": 1
    },
    "profile": {
      "type": "string",
      "enum": &#91;
        "LITE",
        "STANDARD",
        "CONTROLLED"
      &#93;
    },
    "artifact_kind": {
      "type": "string",
      "enum": &#91;
        "APPLICATION",
        "SERVICE",
        "LIBRARY",
        "DOCUMENTATION",
        "UNKNOWN"
      &#93;
    },
    "repository_ref": {
      "type": "string",
      "minLength": 0
    },
    "stack": {
      "type": "array",
      "items": {
        "type": "string",
        "minLength": 1
      },
      "minItems": 0
    },
    "architecture": {
      "type": "string",
      "minLength": 0
    },
    "system_flow": {
      "type": "array",
      "items": {
        "type": "string",
        "minLength": 1
      },
      "minItems": 0
    },
    "provider": {
      "type": "object",
      "properties": {
        "id": {
          "type": "string",
          "enum": &#91;
            "OPENAI",
            "ANTHROPIC",
            "GOOGLE",
            "MISTRAL",
            "DEEPSEEK",
            "QWEN"
          &#93;
        },
        "model": {
          "anyOf": &#91;
            {
              "type": "string",
              "minLength": 1
            },
            {
              "type": "null"
            }
          &#93;
        },
        "endpoint": {
          "anyOf": &#91;
            {
              "type": "string",
              "minLength": 1
            },
            {
              "type": "null"
            }
          &#93;
        }
      },
      "required": &#91;
        "id",
        "model",
        "endpoint"
      &#93;,
      "additionalProperties": false
    },
    "host": {
      "type": "object",
      "properties": {
        "id": {
          "type": "string",
          "enum": &#91;
            "CODEX",
            "CLAUDE_CODE",
            "GEMINI_CLI",
            "OPENCODE",
            "GITHUB_COPILOT",
            "GENERIC_API"
          &#93;
        },
        "version": {
          "anyOf": &#91;
            {
              "type": "string",
              "minLength": 1
            },
            {
              "type": "null"
            }
          &#93;
        },
        "os": {
          "anyOf": &#91;
            {
              "type": "string",
              "minLength": 1
            },
            {
              "type": "null"
            }
          &#93;
        },
        "qualification_ref": {
          "anyOf": &#91;
            {
              "type": "string",
              "minLength": 1
            },
            {
              "type": "null"
            }
          &#93;
        }
      },
      "required": &#91;
        "id",
        "version",
        "os",
        "qualification_ref"
      &#93;,
      "additionalProperties": false
    },
    "adoption": {
      "type": "object",
      "properties": {
        "state": {
          "type": "string",
          "enum": &#91;
            "PREPARED",
            "CONFIGURED",
            "EFFECTIVE"
          &#93;
        },
        "decision_ref": {
          "anyOf": &#91;
            {
              "type": "string",
              "minLength": 1
            },
            {
              "type": "null"
            }
          &#93;
        },
        "effective_scope": {
          "type": "array",
          "items": {
            "type": "string",
            "minLength": 1
          },
          "minItems": 0
        }
      },
      "required": &#91;
        "state",
        "decision_ref",
        "effective_scope"
      &#93;,
      "additionalProperties": false
    },
    "security": {
      "type": "object",
      "properties": {
        "data_class": {
          "type": "string",
          "enum": &#91;
            "UNKNOWN",
            "PUBLIC",
            "INTERNAL_NON_SENSITIVE",
            "CONFIDENTIAL",
            "RESTRICTED"
          &#93;
        },
        "production_access": {
          "type": "boolean"
        },
        "irreversible_operations": {
          "type": "boolean"
        },
        "external_mutations": {
          "type": "boolean"
        },
        "independent_review_required": {
          "type": "boolean"
        },
        "allowed_destinations": {
          "type": "array",
          "items": {
            "type": "string",
            "minLength": 1
          },
          "minItems": 0
        }
      },
      "required": &#91;
        "data_class",
        "production_access",
        "irreversible_operations",
        "external_mutations",
        "independent_review_required",
        "allowed_destinations"
      &#93;,
      "additionalProperties": false
    },
    "budgets": {
      "type": "object",
      "properties": {
        "max_steps": {
          "type": "integer",
          "minimum": 1
        },
        "max_seconds": {
          "type": "integer",
          "minimum": 1
        },
        "max_retries": {
          "type": "integer",
          "minimum": 0
        },
        "max_output_bytes": {
          "type": "integer",
          "minimum": 1
        }
      },
      "required": &#91;
        "max_steps",
        "max_seconds",
        "max_retries",
        "max_output_bytes"
      &#93;,
      "additionalProperties": false
    },
    "commands": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "minLength": 1
          },
          "argv": {
            "type": "array",
            "items": {
              "type": "string",
              "minLength": 1
            },
            "minItems": 1
          },
          "cwd": {
            "type": "string",
            "minLength": 1
          },
          "prerequisites": {
            "type": "array",
            "items": {
              "type": "string",
              "minLength": 1
            },
            "minItems": 0
          },
          "effects": {
            "type": "array",
            "items": {
              "type": "string",
              "minLength": 1
            },
            "minItems": 0
          },
          "verification_status": {
            "type": "string",
            "enum": &#91;
              "NOT_RUN",
              "REVIEWED",
              "TESTED"
            &#93;
          },
          "evidence_ref": {
            "anyOf": &#91;
              {
                "type": "string",
                "minLength": 1
              },
              {
                "type": "null"
              }
            &#93;
          }
        },
        "required": &#91;
          "id",
          "argv",
          "cwd",
          "prerequisites",
          "effects",
          "verification_status",
          "evidence_ref"
        &#93;,
        "additionalProperties": false
      },
      "minItems": 0
    },
    "canonical_backend": {
      "type": "string",
      "enum": &#91;
        "LOCAL_JSON",
        "DECLARED_EXTERNAL"
      &#93;
    },
    "external_backend_ref": {
      "anyOf": &#91;
        {
          "type": "string",
          "minLength": 1
        },
        {
          "type": "null"
        }
      &#93;
    }
  },
  "required": &#91;
    "schema_version",
    "project_id",
    "name",
    "owner",
    "profile",
    "artifact_kind",
    "repository_ref",
    "stack",
    "architecture",
    "system_flow",
    "provider",
    "host",
    "adoption",
    "security",
    "budgets",
    "commands",
    "canonical_backend",
    "external_backend_ref"
  &#93;,
  "additionalProperties": false
}</pre>

### بيانات السجل الأصلية كاملة

<pre dir="auto">{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "PROJECT",
  "type": "object",
  "properties": {
    "schema_version": {
      "type": "string",
      "enum": &#91;
        "1.0"
      &#93;
    },
    "project_id": {
      "type": "string",
      "minLength": 1
    },
    "name": {
      "type": "string",
      "minLength": 1
    },
    "owner": {
      "type": "string",
      "minLength": 1
    },
    "profile": {
      "type": "string",
      "enum": &#91;
        "LITE",
        "STANDARD",
        "CONTROLLED"
      &#93;
    },
    "artifact_kind": {
      "type": "string",
      "enum": &#91;
        "APPLICATION",
        "SERVICE",
        "LIBRARY",
        "DOCUMENTATION",
        "UNKNOWN"
      &#93;
    },
    "repository_ref": {
      "type": "string",
      "minLength": 0
    },
    "stack": {
      "type": "array",
      "items": {
        "type": "string",
        "minLength": 1
      },
      "minItems": 0
    },
    "architecture": {
      "type": "string",
      "minLength": 0
    },
    "system_flow": {
      "type": "array",
      "items": {
        "type": "string",
        "minLength": 1
      },
      "minItems": 0
    },
    "provider": {
      "type": "object",
      "properties": {
        "id": {
          "type": "string",
          "enum": &#91;
            "OPENAI",
            "ANTHROPIC",
            "GOOGLE",
            "MISTRAL",
            "DEEPSEEK",
            "QWEN"
          &#93;
        },
        "model": {
          "anyOf": &#91;
            {
              "type": "string",
              "minLength": 1
            },
            {
              "type": "null"
            }
          &#93;
        },
        "endpoint": {
          "anyOf": &#91;
            {
              "type": "string",
              "minLength": 1
            },
            {
              "type": "null"
            }
          &#93;
        }
      },
      "required": &#91;
        "id",
        "model",
        "endpoint"
      &#93;,
      "additionalProperties": false
    },
    "host": {
      "type": "object",
      "properties": {
        "id": {
          "type": "string",
          "enum": &#91;
            "CODEX",
            "CLAUDE_CODE",
            "GEMINI_CLI",
            "OPENCODE",
            "GITHUB_COPILOT",
            "GENERIC_API"
          &#93;
        },
        "version": {
          "anyOf": &#91;
            {
              "type": "string",
              "minLength": 1
            },
            {
              "type": "null"
            }
          &#93;
        },
        "os": {
          "anyOf": &#91;
            {
              "type": "string",
              "minLength": 1
            },
            {
              "type": "null"
            }
          &#93;
        },
        "qualification_ref": {
          "anyOf": &#91;
            {
              "type": "string",
              "minLength": 1
            },
            {
              "type": "null"
            }
          &#93;
        }
      },
      "required": &#91;
        "id",
        "version",
        "os",
        "qualification_ref"
      &#93;,
      "additionalProperties": false
    },
    "adoption": {
      "type": "object",
      "properties": {
        "state": {
          "type": "string",
          "enum": &#91;
            "PREPARED",
            "CONFIGURED",
            "EFFECTIVE"
          &#93;
        },
        "decision_ref": {
          "anyOf": &#91;
            {
              "type": "string",
              "minLength": 1
            },
            {
              "type": "null"
            }
          &#93;
        },
        "effective_scope": {
          "type": "array",
          "items": {
            "type": "string",
            "minLength": 1
          },
          "minItems": 0
        }
      },
      "required": &#91;
        "state",
        "decision_ref",
        "effective_scope"
      &#93;,
      "additionalProperties": false
    },
    "security": {
      "type": "object",
      "properties": {
        "data_class": {
          "type": "string",
          "enum": &#91;
            "UNKNOWN",
            "PUBLIC",
            "INTERNAL_NON_SENSITIVE",
            "CONFIDENTIAL",
            "RESTRICTED"
          &#93;
        },
        "production_access": {
          "type": "boolean"
        },
        "irreversible_operations": {
          "type": "boolean"
        },
        "external_mutations": {
          "type": "boolean"
        },
        "independent_review_required": {
          "type": "boolean"
        },
        "allowed_destinations": {
          "type": "array",
          "items": {
            "type": "string",
            "minLength": 1
          },
          "minItems": 0
        }
      },
      "required": &#91;
        "data_class",
        "production_access",
        "irreversible_operations",
        "external_mutations",
        "independent_review_required",
        "allowed_destinations"
      &#93;,
      "additionalProperties": false
    },
    "budgets": {
      "type": "object",
      "properties": {
        "max_steps": {
          "type": "integer",
          "minimum": 1
        },
        "max_seconds": {
          "type": "integer",
          "minimum": 1
        },
        "max_retries": {
          "type": "integer",
          "minimum": 0
        },
        "max_output_bytes": {
          "type": "integer",
          "minimum": 1
        }
      },
      "required": &#91;
        "max_steps",
        "max_seconds",
        "max_retries",
        "max_output_bytes"
      &#93;,
      "additionalProperties": false
    },
    "commands": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "minLength": 1
          },
          "argv": {
            "type": "array",
            "items": {
              "type": "string",
              "minLength": 1
            },
            "minItems": 1
          },
          "cwd": {
            "type": "string",
            "minLength": 1
          },
          "prerequisites": {
            "type": "array",
            "items": {
              "type": "string",
              "minLength": 1
            },
            "minItems": 0
          },
          "effects": {
            "type": "array",
            "items": {
              "type": "string",
              "minLength": 1
            },
            "minItems": 0
          },
          "verification_status": {
            "type": "string",
            "enum": &#91;
              "NOT_RUN",
              "REVIEWED",
              "TESTED"
            &#93;
          },
          "evidence_ref": {
            "anyOf": &#91;
              {
                "type": "string",
                "minLength": 1
              },
              {
                "type": "null"
              }
            &#93;
          }
        },
        "required": &#91;
          "id",
          "argv",
          "cwd",
          "prerequisites",
          "effects",
          "verification_status",
          "evidence_ref"
        &#93;,
        "additionalProperties": false
      },
      "minItems": 0
    },
    "canonical_backend": {
      "type": "string",
      "enum": &#91;
        "LOCAL_JSON",
        "DECLARED_EXTERNAL"
      &#93;
    },
    "external_backend_ref": {
      "anyOf": &#91;
        {
          "type": "string",
          "minLength": 1
        },
        {
          "type": "null"
        }
      &#93;
    }
  },
  "required": &#91;
    "schema_version",
    "project_id",
    "name",
    "owner",
    "profile",
    "artifact_kind",
    "repository_ref",
    "stack",
    "architecture",
    "system_flow",
    "provider",
    "host",
    "adoption",
    "security",
    "budgets",
    "commands",
    "canonical_backend",
    "external_backend_ref"
  &#93;,
  "additionalProperties": false
}</pre>

### استكمال المراجعة والترحيل

النوع المقترح: يحدد عند المراجعة؛ المسار: DATA_CONTRACT_REVIEW.

شاشات التطبيق المقترحة: Instruction Detail / Intake & Learning.

البيانات المطلوب استكمالها: classification_and_target_route، owning_item_or_procedure، review_disposition.

حالة المراجعة: PENDING_REVIEW. القرار: لم يحدد؛ السبب: لم يسجل. الاستيراد كسياسة حاكمة يحتاج قرارًا مخولًا خارج ملف المراجعة.

## SCHEMA-REQUEST — schemas/REQUEST.schema.json

المصدر: [governance_packages/candidates/AGHR_Candidate_1.3.0/schemas/REQUEST.schema.json](../../../../governance_packages/candidates/AGHR_Candidate_1.3.0/schemas/REQUEST.schema.json).

الموضع: بيانات الكائن الجذري.

بصمة المصدر SHA-256: 8f7586df5c04a9663cdace6a2c42e9f1bf60b618152e0b515250f1a7d1d36d12

القوة المعلنة: غير محددة على مستوى هذا السجل؛ المقارنة: UNCHANGED_RECORD.

القواعد المرتبطة: لم يصرح المصدر بربط مباشر. الربط سياقي، ولا يثبت التطابق الدلالي.

### النص الأصلي

<pre dir="auto">{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "REQUEST",
  "type": "object",
  "properties": {
    "schema_version": {
      "type": "string",
      "enum": &#91;
        "1.0"
      &#93;
    },
    "request_id": {
      "type": "string",
      "pattern": "^&#91;A-Za-z0-9&#93;&#91;A-Za-z0-9_-&#93;{0,79}$"
    },
    "mode": {
      "type": "string",
      "enum": &#91;
        "REVIEW",
        "PLAN",
        "IMPLEMENT",
        "ADOPT",
        "CHANGE_RULE",
        "INFORMATION"
      &#93;
    },
    "source": {
      "type": "object",
      "properties": {
        "locator": {
          "type": "string",
          "minLength": 1
        },
        "sha256": {
          "anyOf": &#91;
            {
              "type": "string",
              "pattern": "^&#91;0-9a-f&#93;{64}$"
            },
            {
              "type": "null"
            }
          &#93;
        },
        "captured_at": {
          "type": "string",
          "minLength": 1
        },
        "available_scope": {
          "type": "string",
          "minLength": 1
        }
      },
      "required": &#91;
        "locator",
        "sha256",
        "captured_at",
        "available_scope"
      &#93;,
      "additionalProperties": false
    },
    "original_text": {
      "type": "string",
      "minLength": 1
    },
    "goal": {
      "type": "string",
      "minLength": 1
    },
    "scope": {
      "type": "array",
      "items": {
        "type": "string",
        "minLength": 1
      },
      "minItems": 1
    },
    "exclusions": {
      "type": "array",
      "items": {
        "type": "string",
        "minLength": 1
      },
      "minItems": 0
    },
    "authority_ref": {
      "anyOf": &#91;
        {
          "type": "string",
          "minLength": 1
        },
        {
          "type": "null"
        }
      &#93;
    },
    "acceptance_criteria": {
      "type": "array",
      "items": {
        "type": "string",
        "minLength": 1
      },
      "minItems": 0
    },
    "items": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "minLength": 1
          },
          "original_text": {
            "type": "string",
            "minLength": 1
          },
          "kind": {
            "type": "string",
            "enum": &#91;
              "PRINCIPLE",
              "POLICY",
              "RULE",
              "REQUIREMENT",
              "CONSTRAINT",
              "RECOMMENDATION",
              "PREFERENCE",
              "OBSERVATION",
              "RISK",
              "ASSUMPTION",
              "QUESTION",
              "DECISION",
              "PROCEDURE"
            &#93;
          },
          "force": {
            "type": "string",
            "enum": &#91;
              "MUST",
              "MUST_NOT",
              "SHOULD",
              "SHOULD_NOT",
              "MAY",
              "INFORMATIVE",
              "UNRESOLVED"
            &#93;
          },
          "authority_ref": {
            "anyOf": &#91;
              {
                "type": "string",
                "minLength": 1
              },
              {
                "type": "null"
              }
            &#93;
          },
          "trust": {
            "type": "string",
            "enum": &#91;
              "TRUSTED_FOR_SCOPE",
              "UNTRUSTED_DATA",
              "UNVERIFIED"
            &#93;
          },
          "approval": {
            "type": "string",
            "enum": &#91;
              "PROPOSED",
              "APPROVED",
              "REJECTED",
              "DEFERRED"
            &#93;
          },
          "applicability": {
            "type": "string",
            "enum": &#91;
              "APPLICABLE",
              "NOT_APPLICABLE",
              "UNRESOLVED"
            &#93;
          },
          "impact": {
            "type": "string",
            "enum": &#91;
              "CRITICAL",
              "HIGH",
              "MEDIUM",
              "LOW",
              "INFORMATIONAL",
              "UNASSESSED"
            &#93;
          },
          "disposition": {
            "type": "string",
            "enum": &#91;
              "ADD",
              "MERGE",
              "STRENGTHEN",
              "REPLACE",
              "LINK",
              "REJECT",
              "DEFER",
              "NEEDS_INFORMATION"
            &#93;
          },
          "target_ids": {
            "type": "array",
            "items": {
              "type": "string",
              "minLength": 1
            },
            "minItems": 0
          },
          "rationale": {
            "type": "string",
            "minLength": 1
          }
        },
        "required": &#91;
          "id",
          "original_text",
          "kind",
          "force",
          "authority_ref",
          "trust",
          "approval",
          "applicability",
          "impact",
          "disposition",
          "target_ids",
          "rationale"
        &#93;,
        "additionalProperties": false
      },
      "minItems": 0
    },
    "clarifications": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "minLength": 1
          },
          "question": {
            "type": "string",
            "minLength": 1
          },
          "material": {
            "type": "boolean"
          },
          "source_refs": {
            "type": "array",
            "items": {
              "type": "string",
              "minLength": 1
            },
            "minItems": 0
          },
          "options": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "id": {
                  "type": "string",
                  "minLength": 1
                },
                "label": {
                  "type": "string",
                  "minLength": 1
                },
                "impact": {
                  "type": "string",
                  "minLength": 1
                }
              },
              "required": &#91;
                "id",
                "label",
                "impact"
              &#93;,
              "additionalProperties": false
            },
            "minItems": 0
          },
          "recommendation_id": {
            "anyOf": &#91;
              {
                "type": "string",
                "minLength": 1
              },
              {
                "type": "null"
              }
            &#93;
          },
          "recommendation_reason": {
            "anyOf": &#91;
              {
                "type": "string",
                "minLength": 1
              },
              {
                "type": "null"
              }
            &#93;
          },
          "affected_work_ids": {
            "type": "array",
            "items": {
              "type": "string",
              "minLength": 1
            },
            "minItems": 0
          },
          "status": {
            "type": "string",
            "enum": &#91;
              "UNRESOLVED",
              "RESOLVED",
              "BOUNDED_ASSUMPTION"
            &#93;
          },
          "decision_ref": {
            "anyOf": &#91;
              {
                "type": "string",
                "minLength": 1
              },
              {
                "type": "null"
              }
            &#93;
          }
        },
        "required": &#91;
          "id",
          "question",
          "material",
          "source_refs",
          "options",
          "recommendation_id",
          "recommendation_reason",
          "affected_work_ids",
          "status",
          "decision_ref"
        &#93;,
        "additionalProperties": false
      },
      "minItems": 0
    }
  },
  "required": &#91;
    "schema_version",
    "request_id",
    "mode",
    "source",
    "original_text",
    "goal",
    "scope",
    "exclusions",
    "authority_ref",
    "acceptance_criteria",
    "items"
  &#93;,
  "additionalProperties": false
}</pre>

### بيانات السجل الأصلية كاملة

<pre dir="auto">{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "REQUEST",
  "type": "object",
  "properties": {
    "schema_version": {
      "type": "string",
      "enum": &#91;
        "1.0"
      &#93;
    },
    "request_id": {
      "type": "string",
      "pattern": "^&#91;A-Za-z0-9&#93;&#91;A-Za-z0-9_-&#93;{0,79}$"
    },
    "mode": {
      "type": "string",
      "enum": &#91;
        "REVIEW",
        "PLAN",
        "IMPLEMENT",
        "ADOPT",
        "CHANGE_RULE",
        "INFORMATION"
      &#93;
    },
    "source": {
      "type": "object",
      "properties": {
        "locator": {
          "type": "string",
          "minLength": 1
        },
        "sha256": {
          "anyOf": &#91;
            {
              "type": "string",
              "pattern": "^&#91;0-9a-f&#93;{64}$"
            },
            {
              "type": "null"
            }
          &#93;
        },
        "captured_at": {
          "type": "string",
          "minLength": 1
        },
        "available_scope": {
          "type": "string",
          "minLength": 1
        }
      },
      "required": &#91;
        "locator",
        "sha256",
        "captured_at",
        "available_scope"
      &#93;,
      "additionalProperties": false
    },
    "original_text": {
      "type": "string",
      "minLength": 1
    },
    "goal": {
      "type": "string",
      "minLength": 1
    },
    "scope": {
      "type": "array",
      "items": {
        "type": "string",
        "minLength": 1
      },
      "minItems": 1
    },
    "exclusions": {
      "type": "array",
      "items": {
        "type": "string",
        "minLength": 1
      },
      "minItems": 0
    },
    "authority_ref": {
      "anyOf": &#91;
        {
          "type": "string",
          "minLength": 1
        },
        {
          "type": "null"
        }
      &#93;
    },
    "acceptance_criteria": {
      "type": "array",
      "items": {
        "type": "string",
        "minLength": 1
      },
      "minItems": 0
    },
    "items": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "minLength": 1
          },
          "original_text": {
            "type": "string",
            "minLength": 1
          },
          "kind": {
            "type": "string",
            "enum": &#91;
              "PRINCIPLE",
              "POLICY",
              "RULE",
              "REQUIREMENT",
              "CONSTRAINT",
              "RECOMMENDATION",
              "PREFERENCE",
              "OBSERVATION",
              "RISK",
              "ASSUMPTION",
              "QUESTION",
              "DECISION",
              "PROCEDURE"
            &#93;
          },
          "force": {
            "type": "string",
            "enum": &#91;
              "MUST",
              "MUST_NOT",
              "SHOULD",
              "SHOULD_NOT",
              "MAY",
              "INFORMATIVE",
              "UNRESOLVED"
            &#93;
          },
          "authority_ref": {
            "anyOf": &#91;
              {
                "type": "string",
                "minLength": 1
              },
              {
                "type": "null"
              }
            &#93;
          },
          "trust": {
            "type": "string",
            "enum": &#91;
              "TRUSTED_FOR_SCOPE",
              "UNTRUSTED_DATA",
              "UNVERIFIED"
            &#93;
          },
          "approval": {
            "type": "string",
            "enum": &#91;
              "PROPOSED",
              "APPROVED",
              "REJECTED",
              "DEFERRED"
            &#93;
          },
          "applicability": {
            "type": "string",
            "enum": &#91;
              "APPLICABLE",
              "NOT_APPLICABLE",
              "UNRESOLVED"
            &#93;
          },
          "impact": {
            "type": "string",
            "enum": &#91;
              "CRITICAL",
              "HIGH",
              "MEDIUM",
              "LOW",
              "INFORMATIONAL",
              "UNASSESSED"
            &#93;
          },
          "disposition": {
            "type": "string",
            "enum": &#91;
              "ADD",
              "MERGE",
              "STRENGTHEN",
              "REPLACE",
              "LINK",
              "REJECT",
              "DEFER",
              "NEEDS_INFORMATION"
            &#93;
          },
          "target_ids": {
            "type": "array",
            "items": {
              "type": "string",
              "minLength": 1
            },
            "minItems": 0
          },
          "rationale": {
            "type": "string",
            "minLength": 1
          }
        },
        "required": &#91;
          "id",
          "original_text",
          "kind",
          "force",
          "authority_ref",
          "trust",
          "approval",
          "applicability",
          "impact",
          "disposition",
          "target_ids",
          "rationale"
        &#93;,
        "additionalProperties": false
      },
      "minItems": 0
    },
    "clarifications": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "minLength": 1
          },
          "question": {
            "type": "string",
            "minLength": 1
          },
          "material": {
            "type": "boolean"
          },
          "source_refs": {
            "type": "array",
            "items": {
              "type": "string",
              "minLength": 1
            },
            "minItems": 0
          },
          "options": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "id": {
                  "type": "string",
                  "minLength": 1
                },
                "label": {
                  "type": "string",
                  "minLength": 1
                },
                "impact": {
                  "type": "string",
                  "minLength": 1
                }
              },
              "required": &#91;
                "id",
                "label",
                "impact"
              &#93;,
              "additionalProperties": false
            },
            "minItems": 0
          },
          "recommendation_id": {
            "anyOf": &#91;
              {
                "type": "string",
                "minLength": 1
              },
              {
                "type": "null"
              }
            &#93;
          },
          "recommendation_reason": {
            "anyOf": &#91;
              {
                "type": "string",
                "minLength": 1
              },
              {
                "type": "null"
              }
            &#93;
          },
          "affected_work_ids": {
            "type": "array",
            "items": {
              "type": "string",
              "minLength": 1
            },
            "minItems": 0
          },
          "status": {
            "type": "string",
            "enum": &#91;
              "UNRESOLVED",
              "RESOLVED",
              "BOUNDED_ASSUMPTION"
            &#93;
          },
          "decision_ref": {
            "anyOf": &#91;
              {
                "type": "string",
                "minLength": 1
              },
              {
                "type": "null"
              }
            &#93;
          }
        },
        "required": &#91;
          "id",
          "question",
          "material",
          "source_refs",
          "options",
          "recommendation_id",
          "recommendation_reason",
          "affected_work_ids",
          "status",
          "decision_ref"
        &#93;,
        "additionalProperties": false
      },
      "minItems": 0
    }
  },
  "required": &#91;
    "schema_version",
    "request_id",
    "mode",
    "source",
    "original_text",
    "goal",
    "scope",
    "exclusions",
    "authority_ref",
    "acceptance_criteria",
    "items"
  &#93;,
  "additionalProperties": false
}</pre>

### استكمال المراجعة والترحيل

النوع المقترح: يحدد عند المراجعة؛ المسار: DATA_CONTRACT_REVIEW.

شاشات التطبيق المقترحة: Instruction Detail / Intake & Learning.

البيانات المطلوب استكمالها: classification_and_target_route، owning_item_or_procedure، review_disposition.

حالة المراجعة: PENDING_REVIEW. القرار: لم يحدد؛ السبب: لم يسجل. الاستيراد كسياسة حاكمة يحتاج قرارًا مخولًا خارج ملف المراجعة.

## SCHEMA-RULE — schemas/RULE.schema.json

المصدر: [governance_packages/candidates/AGHR_Candidate_1.3.0/schemas/RULE.schema.json](../../../../governance_packages/candidates/AGHR_Candidate_1.3.0/schemas/RULE.schema.json).

الموضع: بيانات الكائن الجذري.

بصمة المصدر SHA-256: c472ce3f64ed20ddf7e45b5f744a3c3eec42e18e75857a816f133ea6e588e1a1

القوة المعلنة: غير محددة على مستوى هذا السجل؛ المقارنة: UNCHANGED_RECORD.

القواعد المرتبطة: لم يصرح المصدر بربط مباشر. الربط سياقي، ولا يثبت التطابق الدلالي.

### النص الأصلي

<pre dir="auto">{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "RULE",
  "type": "object",
  "properties": {
    "schema_version": {
      "type": "string",
      "enum": &#91;
        "1.0"
      &#93;
    },
    "id": {
      "type": "string",
      "minLength": 1
    },
    "original_text": {
      "type": "string",
      "minLength": 1
    },
    "source_ref": {
      "type": "string",
      "minLength": 1
    },
    "host_channel_observed": {
      "type": "string",
      "enum": &#91;
        "UNKNOWN",
        "SYSTEM",
        "DEVELOPER",
        "USER",
        "TOOL_DATA",
        "FILE_DATA"
      &#93;
    },
    "institutional_authority_ref": {
      "anyOf": &#91;
        {
          "type": "string",
          "minLength": 1
        },
        {
          "type": "null"
        }
      &#93;
    },
    "kind": {
      "type": "string",
      "minLength": 1
    },
    "force": {
      "type": "string",
      "enum": &#91;
        "MUST",
        "MUST_NOT",
        "SHOULD",
        "SHOULD_NOT",
        "MAY",
        "INFORMATIVE",
        "UNRESOLVED"
      &#93;
    },
    "trust": {
      "type": "string",
      "enum": &#91;
        "TRUSTED_FOR_SCOPE",
        "UNTRUSTED_DATA",
        "UNVERIFIED"
      &#93;
    },
    "lifecycle": {
      "type": "string",
      "enum": &#91;
        "CAPTURED",
        "CLASSIFIED",
        "PROPOSED",
        "APPROVED",
        "EFFECTIVE",
        "SUPERSEDED",
        "RETIRED",
        "REJECTED",
        "DEFERRED"
      &#93;
    },
    "applies_when": {
      "type": "string",
      "minLength": 1
    },
    "waivable": {
      "type": "boolean"
    },
    "enforcement": {
      "type": "string",
      "minLength": 1
    },
    "verification": {
      "type": "string",
      "minLength": 1
    },
    "decision_ref": {
      "anyOf": &#91;
        {
          "type": "string",
          "minLength": 1
        },
        {
          "type": "null"
        }
      &#93;
    }
  },
  "required": &#91;
    "schema_version",
    "id",
    "original_text",
    "source_ref",
    "host_channel_observed",
    "institutional_authority_ref",
    "kind",
    "force",
    "trust",
    "lifecycle",
    "applies_when",
    "waivable",
    "enforcement",
    "verification",
    "decision_ref"
  &#93;,
  "additionalProperties": false
}</pre>

### بيانات السجل الأصلية كاملة

<pre dir="auto">{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "RULE",
  "type": "object",
  "properties": {
    "schema_version": {
      "type": "string",
      "enum": &#91;
        "1.0"
      &#93;
    },
    "id": {
      "type": "string",
      "minLength": 1
    },
    "original_text": {
      "type": "string",
      "minLength": 1
    },
    "source_ref": {
      "type": "string",
      "minLength": 1
    },
    "host_channel_observed": {
      "type": "string",
      "enum": &#91;
        "UNKNOWN",
        "SYSTEM",
        "DEVELOPER",
        "USER",
        "TOOL_DATA",
        "FILE_DATA"
      &#93;
    },
    "institutional_authority_ref": {
      "anyOf": &#91;
        {
          "type": "string",
          "minLength": 1
        },
        {
          "type": "null"
        }
      &#93;
    },
    "kind": {
      "type": "string",
      "minLength": 1
    },
    "force": {
      "type": "string",
      "enum": &#91;
        "MUST",
        "MUST_NOT",
        "SHOULD",
        "SHOULD_NOT",
        "MAY",
        "INFORMATIVE",
        "UNRESOLVED"
      &#93;
    },
    "trust": {
      "type": "string",
      "enum": &#91;
        "TRUSTED_FOR_SCOPE",
        "UNTRUSTED_DATA",
        "UNVERIFIED"
      &#93;
    },
    "lifecycle": {
      "type": "string",
      "enum": &#91;
        "CAPTURED",
        "CLASSIFIED",
        "PROPOSED",
        "APPROVED",
        "EFFECTIVE",
        "SUPERSEDED",
        "RETIRED",
        "REJECTED",
        "DEFERRED"
      &#93;
    },
    "applies_when": {
      "type": "string",
      "minLength": 1
    },
    "waivable": {
      "type": "boolean"
    },
    "enforcement": {
      "type": "string",
      "minLength": 1
    },
    "verification": {
      "type": "string",
      "minLength": 1
    },
    "decision_ref": {
      "anyOf": &#91;
        {
          "type": "string",
          "minLength": 1
        },
        {
          "type": "null"
        }
      &#93;
    }
  },
  "required": &#91;
    "schema_version",
    "id",
    "original_text",
    "source_ref",
    "host_channel_observed",
    "institutional_authority_ref",
    "kind",
    "force",
    "trust",
    "lifecycle",
    "applies_when",
    "waivable",
    "enforcement",
    "verification",
    "decision_ref"
  &#93;,
  "additionalProperties": false
}</pre>

### استكمال المراجعة والترحيل

النوع المقترح: يحدد عند المراجعة؛ المسار: DATA_CONTRACT_REVIEW.

شاشات التطبيق المقترحة: Instruction Detail / Intake & Learning.

البيانات المطلوب استكمالها: classification_and_target_route، owning_item_or_procedure، review_disposition.

حالة المراجعة: PENDING_REVIEW. القرار: لم يحدد؛ السبب: لم يسجل. الاستيراد كسياسة حاكمة يحتاج قرارًا مخولًا خارج ملف المراجعة.

## SCHEMA-STATE — schemas/STATE.schema.json

المصدر: [governance_packages/candidates/AGHR_Candidate_1.3.0/schemas/STATE.schema.json](../../../../governance_packages/candidates/AGHR_Candidate_1.3.0/schemas/STATE.schema.json).

الموضع: بيانات الكائن الجذري.

بصمة المصدر SHA-256: 55d53f2a083404cc91ec497e6a0ee62f66087e023316a5c155a946577ed9d447

القوة المعلنة: غير محددة على مستوى هذا السجل؛ المقارنة: UNCHANGED_RECORD.

القواعد المرتبطة: لم يصرح المصدر بربط مباشر. الربط سياقي، ولا يثبت التطابق الدلالي.

### النص الأصلي

<pre dir="auto">{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "STATE",
  "type": "object",
  "properties": {
    "schema_version": {
      "type": "string",
      "enum": &#91;
        "1.0"
      &#93;
    },
    "project_id": {
      "type": "string",
      "minLength": 1
    },
    "revision": {
      "type": "integer",
      "minimum": 0
    },
    "candidate_sha256": {
      "anyOf": &#91;
        {
          "type": "string",
          "pattern": "^&#91;0-9a-f&#93;{64}$"
        },
        {
          "type": "null"
        }
      &#93;
    },
    "environment_id": {
      "type": "string",
      "minLength": 0
    },
    "goals": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "minLength": 1
          },
          "outcome": {
            "type": "string",
            "minLength": 1
          },
          "criteria": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "id": {
                  "type": "string",
                  "minLength": 1
                },
                "description": {
                  "type": "string",
                  "minLength": 1
                },
                "required": {
                  "type": "boolean"
                }
              },
              "required": &#91;
                "id",
                "description",
                "required"
              &#93;,
              "additionalProperties": false
            },
            "minItems": 1
          }
        },
        "required": &#91;
          "id",
          "outcome",
          "criteria"
        &#93;,
        "additionalProperties": false
      },
      "minItems": 0
    },
    "work": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "minLength": 1
          },
          "description": {
            "type": "string",
            "minLength": 1
          },
          "goal_id": {
            "type": "string",
            "minLength": 1
          },
          "status": {
            "type": "string",
            "enum": &#91;
              "NOT_STARTED",
              "IN_PROGRESS",
              "IMPLEMENTED",
              "VERIFIED",
              "BLOCKED",
              "CANCELLED"
            &#93;
          },
          "criterion_ids": {
            "type": "array",
            "items": {
              "type": "string",
              "minLength": 1
            },
            "minItems": 1
          },
          "depends_on": {
            "type": "array",
            "items": {
              "type": "string",
              "minLength": 1
            },
            "minItems": 0
          },
          "blocker": {
            "anyOf": &#91;
              {
                "type": "string",
                "minLength": 1
              },
              {
                "type": "null"
              }
            &#93;
          }
        },
        "required": &#91;
          "id",
          "description",
          "goal_id",
          "status",
          "criterion_ids",
          "depends_on",
          "blocker"
        &#93;,
        "additionalProperties": false
      },
      "minItems": 0
    },
    "checks": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "minLength": 1
          },
          "criterion_ids": {
            "type": "array",
            "items": {
              "type": "string",
              "minLength": 1
            },
            "minItems": 1
          },
          "kind": {
            "type": "string",
            "enum": &#91;
              "TEST",
              "INSPECTION",
              "POLICY",
              "RUNTIME",
              "EVALUATION"
            &#93;
          },
          "result": {
            "type": "string",
            "enum": &#91;
              "PASS",
              "FAIL",
              "NOT_RUN",
              "BLOCKED",
              "ERROR",
              "NOT_APPLICABLE"
            &#93;
          },
          "candidate_sha256": {
            "type": "string",
            "pattern": "^&#91;0-9a-f&#93;{64}$"
          },
          "environment_id": {
            "type": "string",
            "minLength": 1
          },
          "started_at": {
            "anyOf": &#91;
              {
                "type": "string",
                "minLength": 1
              },
              {
                "type": "null"
              }
            &#93;
          },
          "finished_at": {
            "anyOf": &#91;
              {
                "type": "string",
                "minLength": 1
              },
              {
                "type": "null"
              }
            &#93;
          },
          "command_or_method": {
            "type": "string",
            "minLength": 1
          },
          "target_count": {
            "type": "integer",
            "minimum": 0
          },
          "tests_executed": {
            "type": "integer",
            "minimum": 0
          },
          "artifacts": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "path": {
                  "type": "string",
                  "minLength": 1
                },
                "sha256": {
                  "type": "string",
                  "pattern": "^&#91;0-9a-f&#93;{64}$"
                }
              },
              "required": &#91;
                "path",
                "sha256"
              &#93;,
              "additionalProperties": false
            },
            "minItems": 0
          },
          "limitations": {
            "type": "array",
            "items": {
              "type": "string",
              "minLength": 1
            },
            "minItems": 0
          },
          "producer": {
            "type": "string",
            "minLength": 1
          }
        },
        "required": &#91;
          "id",
          "criterion_ids",
          "kind",
          "result",
          "candidate_sha256",
          "environment_id",
          "started_at",
          "finished_at",
          "command_or_method",
          "target_count",
          "tests_executed",
          "artifacts",
          "limitations",
          "producer"
        &#93;,
        "additionalProperties": false
      },
      "minItems": 0
    },
    "pending": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "minLength": 1
          },
          "work_id": {
            "type": "string",
            "minLength": 1
          },
          "description": {
            "type": "string",
            "minLength": 1
          },
          "status": {
            "type": "string",
            "enum": &#91;
              "OPEN",
              "RESOLVED",
              "DEFERRED",
              "WITHDRAWN"
            &#93;
          },
          "blocking": {
            "type": "boolean"
          },
          "owner": {
            "type": "string",
            "minLength": 1
          },
          "resume_condition": {
            "type": "string",
            "minLength": 0
          },
          "resolution_ref": {
            "anyOf": &#91;
              {
                "type": "string",
                "minLength": 1
              },
              {
                "type": "null"
              }
            &#93;
          }
        },
        "required": &#91;
          "id",
          "work_id",
          "description",
          "status",
          "blocking",
          "owner",
          "resume_condition",
          "resolution_ref"
        &#93;,
        "additionalProperties": false
      },
      "minItems": 0
    },
    "decisions": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "minLength": 1
          },
          "kind": {
            "type": "string",
            "enum": &#91;
              "ADOPTION",
              "CHANGE",
              "EXCEPTION",
              "ACCEPTANCE",
              "ACTIVATION",
              "DEFER",
              "WITHDRAW"
            &#93;
          },
          "authority": {
            "type": "string",
            "minLength": 1
          },
          "scope": {
            "type": "string",
            "minLength": 1
          },
          "reference": {
            "type": "string",
            "minLength": 1
          }
        },
        "required": &#91;
          "id",
          "kind",
          "authority",
          "scope",
          "reference"
        &#93;,
        "additionalProperties": false
      },
      "minItems": 0
    },
    "next_action": {
      "type": "string",
      "minLength": 1
    },
    "delivery": {
      "type": "object",
      "properties": {
        "phase": {
          "type": "string",
          "enum": &#91;
            "UNKNOWN",
            "INTAKE",
            "REQUIREMENTS",
            "DESIGN",
            "PLANNING",
            "IMPLEMENTATION",
            "VERIFICATION",
            "REVIEW",
            "MERGE",
            "RELEASE",
            "OPERATION",
            "MAINTENANCE",
            "RETIREMENT"
          &#93;
        },
        "execution_mode": {
          "type": "string",
          "enum": &#91;
            "GUIDED",
            "CONTINUOUS_WITHIN_GRANT",
            "UNSELECTED"
          &#93;
        },
        "grant_ref": {
          "anyOf": &#91;
            {
              "type": "string",
              "minLength": 1
            },
            {
              "type": "null"
            }
          &#93;
        },
        "plan_baseline_ref": {
          "anyOf": &#91;
            {
              "type": "string",
              "minLength": 1
            },
            {
              "type": "null"
            }
          &#93;
        },
        "measurement_scope_complete": {
          "type": "boolean"
        },
        "git_observation": {
          "type": "object",
          "properties": {
            "branch": {
              "anyOf": &#91;
                {
                  "type": "string",
                  "minLength": 1
                },
                {
                  "type": "null"
                }
              &#93;
            },
            "default_branch": {
              "anyOf": &#91;
                {
                  "type": "string",
                  "minLength": 1
                },
                {
                  "type": "null"
                }
              &#93;
            },
            "observed_at": {
              "anyOf": &#91;
                {
                  "type": "string",
                  "minLength": 1
                },
                {
                  "type": "null"
                }
              &#93;
            },
            "remote_checked": {
              "type": "boolean"
            },
            "unmerged_branches": {
              "type": "array",
              "items": {
                "type": "string",
                "minLength": 1
              },
              "minItems": 0
            },
            "evidence_ref": {
              "anyOf": &#91;
                {
                  "type": "string",
                  "minLength": 1
                },
                {
                  "type": "null"
                }
              &#93;
            }
          },
          "required": &#91;
            "branch",
            "default_branch",
            "observed_at",
            "remote_checked",
            "unmerged_branches",
            "evidence_ref"
          &#93;,
          "additionalProperties": false
        },
        "findings": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "id": {
                "type": "string",
                "minLength": 1
              },
              "rule_id": {
                "type": "string",
                "minLength": 1
              },
              "kind": {
                "type": "string",
                "enum": &#91;
                  "OBSERVED_VIOLATION",
                  "SUSPECTED_DEVIATION",
                  "MONITORING_GAP",
                  "APPROVED_REPLAN",
                  "EXTERNAL_BLOCKER"
                &#93;
              },
              "severity": {
                "type": "string",
                "enum": &#91;
                  "CRITICAL",
                  "HIGH",
                  "MEDIUM",
                  "LOW",
                  "UNASSESSED"
                &#93;
              },
              "expected": {
                "type": "string",
                "minLength": 1
              },
              "observed": {
                "type": "string",
                "minLength": 1
              },
              "evidence_ids": {
                "type": "array",
                "items": {
                  "type": "string",
                  "minLength": 1
                },
                "minItems": 0
              },
              "status": {
                "type": "string",
                "enum": &#91;
                  "OPEN",
                  "RESOLVED",
                  "ACCEPTED_LIMITATION"
                &#93;
              },
              "decision_ref": {
                "anyOf": &#91;
                  {
                    "type": "string",
                    "minLength": 1
                  },
                  {
                    "type": "null"
                  }
                &#93;
              },
              "retest_evidence_ids": {
                "type": "array",
                "items": {
                  "type": "string",
                  "minLength": 1
                },
                "minItems": 0
              }
            },
            "required": &#91;
              "id",
              "rule_id",
              "kind",
              "severity",
              "expected",
              "observed",
              "evidence_ids",
              "status",
              "decision_ref",
              "retest_evidence_ids"
            &#93;,
            "additionalProperties": false
          },
          "minItems": 0
        }
      },
      "required": &#91;
        "phase",
        "execution_mode",
        "grant_ref",
        "plan_baseline_ref",
        "measurement_scope_complete",
        "git_observation",
        "findings"
      &#93;,
      "additionalProperties": false
    }
  },
  "required": &#91;
    "schema_version",
    "project_id",
    "revision",
    "candidate_sha256",
    "environment_id",
    "goals",
    "work",
    "checks",
    "pending",
    "decisions",
    "next_action"
  &#93;,
  "additionalProperties": false
}</pre>

### بيانات السجل الأصلية كاملة

<pre dir="auto">{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "STATE",
  "type": "object",
  "properties": {
    "schema_version": {
      "type": "string",
      "enum": &#91;
        "1.0"
      &#93;
    },
    "project_id": {
      "type": "string",
      "minLength": 1
    },
    "revision": {
      "type": "integer",
      "minimum": 0
    },
    "candidate_sha256": {
      "anyOf": &#91;
        {
          "type": "string",
          "pattern": "^&#91;0-9a-f&#93;{64}$"
        },
        {
          "type": "null"
        }
      &#93;
    },
    "environment_id": {
      "type": "string",
      "minLength": 0
    },
    "goals": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "minLength": 1
          },
          "outcome": {
            "type": "string",
            "minLength": 1
          },
          "criteria": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "id": {
                  "type": "string",
                  "minLength": 1
                },
                "description": {
                  "type": "string",
                  "minLength": 1
                },
                "required": {
                  "type": "boolean"
                }
              },
              "required": &#91;
                "id",
                "description",
                "required"
              &#93;,
              "additionalProperties": false
            },
            "minItems": 1
          }
        },
        "required": &#91;
          "id",
          "outcome",
          "criteria"
        &#93;,
        "additionalProperties": false
      },
      "minItems": 0
    },
    "work": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "minLength": 1
          },
          "description": {
            "type": "string",
            "minLength": 1
          },
          "goal_id": {
            "type": "string",
            "minLength": 1
          },
          "status": {
            "type": "string",
            "enum": &#91;
              "NOT_STARTED",
              "IN_PROGRESS",
              "IMPLEMENTED",
              "VERIFIED",
              "BLOCKED",
              "CANCELLED"
            &#93;
          },
          "criterion_ids": {
            "type": "array",
            "items": {
              "type": "string",
              "minLength": 1
            },
            "minItems": 1
          },
          "depends_on": {
            "type": "array",
            "items": {
              "type": "string",
              "minLength": 1
            },
            "minItems": 0
          },
          "blocker": {
            "anyOf": &#91;
              {
                "type": "string",
                "minLength": 1
              },
              {
                "type": "null"
              }
            &#93;
          }
        },
        "required": &#91;
          "id",
          "description",
          "goal_id",
          "status",
          "criterion_ids",
          "depends_on",
          "blocker"
        &#93;,
        "additionalProperties": false
      },
      "minItems": 0
    },
    "checks": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "minLength": 1
          },
          "criterion_ids": {
            "type": "array",
            "items": {
              "type": "string",
              "minLength": 1
            },
            "minItems": 1
          },
          "kind": {
            "type": "string",
            "enum": &#91;
              "TEST",
              "INSPECTION",
              "POLICY",
              "RUNTIME",
              "EVALUATION"
            &#93;
          },
          "result": {
            "type": "string",
            "enum": &#91;
              "PASS",
              "FAIL",
              "NOT_RUN",
              "BLOCKED",
              "ERROR",
              "NOT_APPLICABLE"
            &#93;
          },
          "candidate_sha256": {
            "type": "string",
            "pattern": "^&#91;0-9a-f&#93;{64}$"
          },
          "environment_id": {
            "type": "string",
            "minLength": 1
          },
          "started_at": {
            "anyOf": &#91;
              {
                "type": "string",
                "minLength": 1
              },
              {
                "type": "null"
              }
            &#93;
          },
          "finished_at": {
            "anyOf": &#91;
              {
                "type": "string",
                "minLength": 1
              },
              {
                "type": "null"
              }
            &#93;
          },
          "command_or_method": {
            "type": "string",
            "minLength": 1
          },
          "target_count": {
            "type": "integer",
            "minimum": 0
          },
          "tests_executed": {
            "type": "integer",
            "minimum": 0
          },
          "artifacts": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "path": {
                  "type": "string",
                  "minLength": 1
                },
                "sha256": {
                  "type": "string",
                  "pattern": "^&#91;0-9a-f&#93;{64}$"
                }
              },
              "required": &#91;
                "path",
                "sha256"
              &#93;,
              "additionalProperties": false
            },
            "minItems": 0
          },
          "limitations": {
            "type": "array",
            "items": {
              "type": "string",
              "minLength": 1
            },
            "minItems": 0
          },
          "producer": {
            "type": "string",
            "minLength": 1
          }
        },
        "required": &#91;
          "id",
          "criterion_ids",
          "kind",
          "result",
          "candidate_sha256",
          "environment_id",
          "started_at",
          "finished_at",
          "command_or_method",
          "target_count",
          "tests_executed",
          "artifacts",
          "limitations",
          "producer"
        &#93;,
        "additionalProperties": false
      },
      "minItems": 0
    },
    "pending": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "minLength": 1
          },
          "work_id": {
            "type": "string",
            "minLength": 1
          },
          "description": {
            "type": "string",
            "minLength": 1
          },
          "status": {
            "type": "string",
            "enum": &#91;
              "OPEN",
              "RESOLVED",
              "DEFERRED",
              "WITHDRAWN"
            &#93;
          },
          "blocking": {
            "type": "boolean"
          },
          "owner": {
            "type": "string",
            "minLength": 1
          },
          "resume_condition": {
            "type": "string",
            "minLength": 0
          },
          "resolution_ref": {
            "anyOf": &#91;
              {
                "type": "string",
                "minLength": 1
              },
              {
                "type": "null"
              }
            &#93;
          }
        },
        "required": &#91;
          "id",
          "work_id",
          "description",
          "status",
          "blocking",
          "owner",
          "resume_condition",
          "resolution_ref"
        &#93;,
        "additionalProperties": false
      },
      "minItems": 0
    },
    "decisions": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "minLength": 1
          },
          "kind": {
            "type": "string",
            "enum": &#91;
              "ADOPTION",
              "CHANGE",
              "EXCEPTION",
              "ACCEPTANCE",
              "ACTIVATION",
              "DEFER",
              "WITHDRAW"
            &#93;
          },
          "authority": {
            "type": "string",
            "minLength": 1
          },
          "scope": {
            "type": "string",
            "minLength": 1
          },
          "reference": {
            "type": "string",
            "minLength": 1
          }
        },
        "required": &#91;
          "id",
          "kind",
          "authority",
          "scope",
          "reference"
        &#93;,
        "additionalProperties": false
      },
      "minItems": 0
    },
    "next_action": {
      "type": "string",
      "minLength": 1
    },
    "delivery": {
      "type": "object",
      "properties": {
        "phase": {
          "type": "string",
          "enum": &#91;
            "UNKNOWN",
            "INTAKE",
            "REQUIREMENTS",
            "DESIGN",
            "PLANNING",
            "IMPLEMENTATION",
            "VERIFICATION",
            "REVIEW",
            "MERGE",
            "RELEASE",
            "OPERATION",
            "MAINTENANCE",
            "RETIREMENT"
          &#93;
        },
        "execution_mode": {
          "type": "string",
          "enum": &#91;
            "GUIDED",
            "CONTINUOUS_WITHIN_GRANT",
            "UNSELECTED"
          &#93;
        },
        "grant_ref": {
          "anyOf": &#91;
            {
              "type": "string",
              "minLength": 1
            },
            {
              "type": "null"
            }
          &#93;
        },
        "plan_baseline_ref": {
          "anyOf": &#91;
            {
              "type": "string",
              "minLength": 1
            },
            {
              "type": "null"
            }
          &#93;
        },
        "measurement_scope_complete": {
          "type": "boolean"
        },
        "git_observation": {
          "type": "object",
          "properties": {
            "branch": {
              "anyOf": &#91;
                {
                  "type": "string",
                  "minLength": 1
                },
                {
                  "type": "null"
                }
              &#93;
            },
            "default_branch": {
              "anyOf": &#91;
                {
                  "type": "string",
                  "minLength": 1
                },
                {
                  "type": "null"
                }
              &#93;
            },
            "observed_at": {
              "anyOf": &#91;
                {
                  "type": "string",
                  "minLength": 1
                },
                {
                  "type": "null"
                }
              &#93;
            },
            "remote_checked": {
              "type": "boolean"
            },
            "unmerged_branches": {
              "type": "array",
              "items": {
                "type": "string",
                "minLength": 1
              },
              "minItems": 0
            },
            "evidence_ref": {
              "anyOf": &#91;
                {
                  "type": "string",
                  "minLength": 1
                },
                {
                  "type": "null"
                }
              &#93;
            }
          },
          "required": &#91;
            "branch",
            "default_branch",
            "observed_at",
            "remote_checked",
            "unmerged_branches",
            "evidence_ref"
          &#93;,
          "additionalProperties": false
        },
        "findings": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "id": {
                "type": "string",
                "minLength": 1
              },
              "rule_id": {
                "type": "string",
                "minLength": 1
              },
              "kind": {
                "type": "string",
                "enum": &#91;
                  "OBSERVED_VIOLATION",
                  "SUSPECTED_DEVIATION",
                  "MONITORING_GAP",
                  "APPROVED_REPLAN",
                  "EXTERNAL_BLOCKER"
                &#93;
              },
              "severity": {
                "type": "string",
                "enum": &#91;
                  "CRITICAL",
                  "HIGH",
                  "MEDIUM",
                  "LOW",
                  "UNASSESSED"
                &#93;
              },
              "expected": {
                "type": "string",
                "minLength": 1
              },
              "observed": {
                "type": "string",
                "minLength": 1
              },
              "evidence_ids": {
                "type": "array",
                "items": {
                  "type": "string",
                  "minLength": 1
                },
                "minItems": 0
              },
              "status": {
                "type": "string",
                "enum": &#91;
                  "OPEN",
                  "RESOLVED",
                  "ACCEPTED_LIMITATION"
                &#93;
              },
              "decision_ref": {
                "anyOf": &#91;
                  {
                    "type": "string",
                    "minLength": 1
                  },
                  {
                    "type": "null"
                  }
                &#93;
              },
              "retest_evidence_ids": {
                "type": "array",
                "items": {
                  "type": "string",
                  "minLength": 1
                },
                "minItems": 0
              }
            },
            "required": &#91;
              "id",
              "rule_id",
              "kind",
              "severity",
              "expected",
              "observed",
              "evidence_ids",
              "status",
              "decision_ref",
              "retest_evidence_ids"
            &#93;,
            "additionalProperties": false
          },
          "minItems": 0
        }
      },
      "required": &#91;
        "phase",
        "execution_mode",
        "grant_ref",
        "plan_baseline_ref",
        "measurement_scope_complete",
        "git_observation",
        "findings"
      &#93;,
      "additionalProperties": false
    }
  },
  "required": &#91;
    "schema_version",
    "project_id",
    "revision",
    "candidate_sha256",
    "environment_id",
    "goals",
    "work",
    "checks",
    "pending",
    "decisions",
    "next_action"
  &#93;,
  "additionalProperties": false
}</pre>

### استكمال المراجعة والترحيل

النوع المقترح: يحدد عند المراجعة؛ المسار: DATA_CONTRACT_REVIEW.

شاشات التطبيق المقترحة: Instruction Detail / Intake & Learning.

البيانات المطلوب استكمالها: classification_and_target_route، owning_item_or_procedure، review_disposition.

حالة المراجعة: PENDING_REVIEW. القرار: لم يحدد؛ السبب: لم يسجل. الاستيراد كسياسة حاكمة يحتاج قرارًا مخولًا خارج ملف المراجعة.
