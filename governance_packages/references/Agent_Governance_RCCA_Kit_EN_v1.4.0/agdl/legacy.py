"""Explicit reuse of v1.2 source segmentation and G1/G2 metadata checks."""
from __future__ import annotations
import importlib.util
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
PATH = ROOT / 'compatibility/v1_2/scripts/08_RCCA_TRACE.py'
_spec = importlib.util.spec_from_file_location('agdl_v12_rcca', PATH)
if _spec is None or _spec.loader is None:
    raise RuntimeError('legacy_validator_missing')
module = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(module)
segment_source = module.segment_source
blank_template = module.blank_template
validate = module.validate
