#!/usr/bin/env python3
"""Timeout wrapper: run-to.py <seconds> <cmd...>.

Runs <cmd> in its own process group. On timeout, sends SIGTERM to the group,
waits up to 10s, then SIGKILL.

Exit codes:
  124 - graceful kill on timeout (SIGTERM honoured)
  137 - hard kill on timeout (SIGKILL required)
  *   - child's exit code otherwise
"""
import os
import signal
import subprocess
import sys

if len(sys.argv) < 3:
    print("usage: run-to.py <seconds> <cmd...>", file=sys.stderr)
    sys.exit(2)

secs = int(sys.argv[1])
cmd = sys.argv[2:]

p = subprocess.Popen(cmd, preexec_fn=os.setsid)
try:
    rc = p.wait(timeout=secs)
    sys.exit(rc)
except subprocess.TimeoutExpired:
    try:
        os.killpg(p.pid, signal.SIGTERM)
    except ProcessLookupError:
        pass
    try:
        p.wait(timeout=10)
        sys.exit(124)
    except subprocess.TimeoutExpired:
        try:
            os.killpg(p.pid, signal.SIGKILL)
        except ProcessLookupError:
            pass
        p.wait()
        sys.exit(137)
