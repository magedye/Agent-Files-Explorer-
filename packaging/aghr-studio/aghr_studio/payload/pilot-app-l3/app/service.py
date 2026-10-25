from app.repository import query

def inventory(database):
    return query(database,'SELECT sku,quantity,unit_price FROM inventory ORDER BY sku')

def totals(database):
    rows=inventory(database)
    return {'products':len(rows),'units':sum(r['quantity'] for r in rows),'value':sum(r['quantity']*r['unit_price'] for r in rows)}
