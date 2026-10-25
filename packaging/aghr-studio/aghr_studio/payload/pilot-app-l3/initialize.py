"""One-off creation of sandbox business data; never production data."""
from pathlib import Path
import sqlite3
root=Path(__file__).resolve().parent
(root/'data').mkdir(exist_ok=True)
database=root/'data/inventory.sqlite'
if database.exists():raise SystemExit('Refusing to overwrite existing sandbox data')
with sqlite3.connect(database) as db:
    db.execute('CREATE TABLE inventory(sku TEXT PRIMARY KEY,quantity INTEGER NOT NULL,unit_price INTEGER NOT NULL)')
    db.executemany('INSERT INTO inventory VALUES(?,?,?)',[('PEN',12,3),('BOOK',7,20),('BAG',4,50)])
print('Created three actual sandbox inventory rows; no external data imported.')
