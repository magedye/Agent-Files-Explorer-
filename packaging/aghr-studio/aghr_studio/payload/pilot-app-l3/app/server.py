import json
from http.server import BaseHTTPRequestHandler,ThreadingHTTPServer
from app.service import inventory,totals

def create_server(database):
    class Handler(BaseHTTPRequestHandler):
        def do_GET(self):
            if self.path=='/health':value={'project':'pilot-app-l3','status':'ok'}
            elif self.path=='/inventory':value={'project':'pilot-app-l3','rows':inventory(database)}
            elif self.path=='/totals':value={'project':'pilot-app-l3',**totals(database)}
            else:self.send_error(404);return
            raw=json.dumps(value).encode('utf-8');self.send_response(200);self.send_header('Content-Type','application/json');self.send_header('Content-Length',str(len(raw)));self.end_headers();self.wfile.write(raw)
        def log_message(self,*args):pass
    return ThreadingHTTPServer(('127.0.0.1',0),Handler)
