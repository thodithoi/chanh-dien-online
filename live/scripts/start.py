#!/usr/bin/env python3
import json, os, shutil, subprocess, sys, urllib.request, time
from pathlib import Path
LIVE=Path(__file__).resolve().parents[1]
URL='http://127.0.0.1:3481'
def health():
    try:
        with urllib.request.urlopen(URL+'/health',timeout=2) as r:return json.load(r)
    except Exception:return None
h=health()
if h and h.get('app')=='thien-an':
    print('Chánh Điện đang chạy: '+URL+'/live/control.html');sys.exit(0)
try:
    with urllib.request.urlopen(URL+'/live/control.html',timeout=2) as r:
        print('Cổng 3481 đang chạy phiên bản cũ hoặc ứng dụng khác. Không tự đổi cổng. Cần dừng đúng phiên bản cũ trước.');sys.exit(1)
except SystemExit:raise
except Exception:pass
node=os.environ.get('CHANH_NODE') or shutil.which('node')
fallback=Path.home()/'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node'
if not node and fallback.exists():node=str(fallback)
if not node:print('Chưa tìm thấy Node.js. Cài Node.js LTS từ nodejs.org rồi mở lại.');sys.exit(1)
if not (LIVE/'node_modules/youtubei.js').exists():print('Chưa cài thư viện. Trong thư mục live, chạy npm ci.');sys.exit(1)
run=LIVE/'runtime';run.mkdir(exist_ok=True)
with (run/'supervisor.log').open('ab') as log:
    subprocess.Popen([sys.executable,str(LIVE/'scripts/supervisor.py'),node],stdin=subprocess.DEVNULL,stdout=log,stderr=log,start_new_session=True)
for _ in range(30):
    h=health()
    if h and h.get('app')=='thien-an':print('Đã sẵn sàng: '+URL+'/live/control.html');sys.exit(0)
    time.sleep(.5)
print('Chưa khởi động được. Kiểm tra live/runtime/server.log.');sys.exit(1)
