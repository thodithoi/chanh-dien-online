#!/usr/bin/env python3
"""Local macOS supervisor. No launch agent, paid hosting, or global installation."""
import fcntl, json, os, signal, subprocess, sys, time, urllib.request
from pathlib import Path
LIVE=Path(__file__).resolve().parents[1]
RUN=LIVE/'runtime'; RUN.mkdir(exist_ok=True)
lock=(RUN/'supervisor.lock').open('w')
try: fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
except BlockingIOError: sys.exit(0)
lock.write(str(os.getpid())); lock.flush()
node=sys.argv[1]
stopping=False
child=None

def stop(*_):
    global stopping
    stopping=True
    if child and child.poll() is None: child.terminate()
signal.signal(signal.SIGTERM,stop); signal.signal(signal.SIGINT,stop)
failures=0
while not stopping:
    logfile=RUN/'server.log'
    if logfile.exists() and logfile.stat().st_size>5_000_000: logfile.replace(RUN/'server.previous.log')
    with logfile.open('ab',buffering=0) as log:
        env={**os.environ,'PORT':'3481','HOST':'127.0.0.1','STATE_FILE':str(LIVE/'session-state.json')}
        child=subprocess.Popen([node,'server.mjs'],cwd=LIVE,env=env,stdout=log,stderr=log)
        (RUN/'server.pid').write_text(str(child.pid))
        start=time.monotonic(); missed=0
        while child.poll() is None and not stopping:
            time.sleep(2)
            try:
                with urllib.request.urlopen('http://127.0.0.1:3481/health',timeout=3) as r: h=json.load(r)
                if h.get('pid')!=child.pid: raise RuntimeError('port conflict')
                missed=0
            except Exception: missed+=1
            if missed>=5:
                child.terminate()
                try: child.wait(timeout=5)
                except subprocess.TimeoutExpired: child.kill()
        try: child.wait(timeout=5)
        except subprocess.TimeoutExpired: child.kill(); child.wait()
        if stopping: break
        failures=0 if time.monotonic()-start>60 else failures+1
        if failures>=5:
            log.write(b'Too many startup failures. Check port 3481 and server.log; restart manually.\n');break
        time.sleep(min(15,2**failures))
