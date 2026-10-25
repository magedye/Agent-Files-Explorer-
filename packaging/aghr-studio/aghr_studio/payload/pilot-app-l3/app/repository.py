import sqlite3
from app.security import authorize,sqlite_authorizer

def query(database,sql):
    authorize(sql)
    with sqlite3.connect(database.resolve().as_uri()+'?mode=ro',uri=True) as db:
        db.set_authorizer(sqlite_authorizer)
        result=db.execute(sql)
        names=[c[0] for c in result.description]
        return [dict(zip(names,row)) for row in result.fetchmany(100)]
