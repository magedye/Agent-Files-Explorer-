"""Read-only SQL boundary, enforced again by SQLite's authorizer."""
import re
import sqlite3

def authorize(sql):
    if not isinstance(sql, str) or len(sql)>4096 or not re.match(r'^\s*SELECT\s',sql,re.I):
        raise PermissionError('SELECT_ONLY')
    if ';' in sql or '--' in sql or '/*' in sql:
        raise PermissionError('SINGLE_STATEMENT_ONLY')
    if re.search(r'\b(pragma|attach|detach|load_extension|sqlite_master|sqlite_schema)\b',sql,re.I):
        raise PermissionError('METADATA_OR_EXTENSION_DENIED')
    return sql

def sqlite_authorizer(action, first, second, database, origin):
    return sqlite3.SQLITE_OK if action in (sqlite3.SQLITE_SELECT,sqlite3.SQLITE_READ,sqlite3.SQLITE_FUNCTION) else sqlite3.SQLITE_DENY
