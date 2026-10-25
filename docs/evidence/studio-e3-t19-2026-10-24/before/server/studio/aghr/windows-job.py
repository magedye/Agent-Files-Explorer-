"""Windows-only resource adapter. Own the whole tree before its first instruction."""
import base64
import ctypes as c
from ctypes import wintypes as w
import json
import msvcrt
import os
import queue
import subprocess
import sys
import threading
import time

k = c.WinDLL('kernel32', use_last_error=True)
SIZE = c.c_size_t
U64 = c.c_ulonglong


class Basic(c.Structure):
    _fields_ = [('process_time', c.c_longlong), ('job_time', c.c_longlong), ('flags', w.DWORD),
                ('min_ws', SIZE), ('max_ws', SIZE), ('active', w.DWORD), ('affinity', SIZE),
                ('priority', w.DWORD), ('scheduling', w.DWORD)]


class IO(c.Structure):
    _fields_ = [(name, U64) for name in ('read', 'write', 'other', 'read_bytes', 'write_bytes', 'other_bytes')]


class Extended(c.Structure):
    _fields_ = [('basic', Basic), ('io', IO), ('process_memory', SIZE), ('job_memory', SIZE),
                ('peak_process', SIZE), ('peak_job', SIZE)]


class Accounting(c.Structure):
    _fields_ = [(name, c.c_longlong) for name in ('user', 'kernel', 'period_user', 'period_kernel')] + [
        (name, w.DWORD) for name in ('faults', 'total', 'active', 'terminated')]


class Completion(c.Structure):
    _fields_ = [('key', c.c_void_p), ('port', w.HANDLE)]


class Notification(c.Structure):
    _fields_ = [('read', U64), ('write', U64), ('time', c.c_longlong), ('memory', U64),
                ('tolerance', w.DWORD), ('interval', w.DWORD), ('flags', w.DWORD)]


class Violation(c.Structure):
    _fields_ = [('flags', w.DWORD), ('violations', w.DWORD)] + [
        (name, U64) for name in ('read', 'read_limit', 'write', 'write_limit', 'time', 'time_limit', 'memory', 'memory_limit')
    ] + [('tolerance', w.DWORD), ('tolerance_limit', w.DWORD)]


class Startup(c.Structure):
    _fields_ = [('cb', w.DWORD), ('reserved', w.LPWSTR), ('desktop', w.LPWSTR), ('title', w.LPWSTR)] + [
        (name, w.DWORD) for name in ('x', 'y', 'xs', 'ys', 'xc', 'yc', 'fill', 'flags')] + [
        ('show', w.WORD), ('reserved_size', w.WORD), ('reserved_bytes', c.c_void_p),
        ('stdin', w.HANDLE), ('stdout', w.HANDLE), ('stderr', w.HANDLE)]


class StartupEx(c.Structure):
    _fields_ = [('startup', Startup), ('attributes', c.c_void_p)]


class Process(c.Structure):
    _fields_ = [('process', w.HANDLE), ('thread', w.HANDLE), ('pid', w.DWORD), ('tid', w.DWORD)]


def api(name, args, result=w.BOOL):
    f = getattr(k, name)
    f.argtypes, f.restype = args, result
    return f


create_job = api('CreateJobObjectW', [c.c_void_p, w.LPCWSTR], w.HANDLE)
set_job = api('SetInformationJobObject', [w.HANDLE, c.c_int, c.c_void_p, w.DWORD])
query_job = api('QueryInformationJobObject', [w.HANDLE, c.c_int, c.c_void_p, w.DWORD, c.c_void_p])
terminate = api('TerminateJobObject', [w.HANDLE, w.UINT])
close = api('CloseHandle', [w.HANDLE])
create_port = api('CreateIoCompletionPort', [w.HANDLE, w.HANDLE, SIZE, w.DWORD], w.HANDLE)
get_port = api('GetQueuedCompletionStatus', [w.HANDLE, c.POINTER(w.DWORD), c.POINTER(SIZE), c.POINTER(c.c_void_p), w.DWORD])
init_attrs = api('InitializeProcThreadAttributeList', [c.c_void_p, w.DWORD, w.DWORD, c.POINTER(SIZE)])
update_attr = api('UpdateProcThreadAttribute', [c.c_void_p, w.DWORD, SIZE, c.c_void_p, SIZE, c.c_void_p, c.c_void_p])
delete_attrs = api('DeleteProcThreadAttributeList', [c.c_void_p], None)
create_process = api('CreateProcessW', [w.LPCWSTR, w.LPWSTR, c.c_void_p, c.c_void_p, w.BOOL, w.DWORD, c.c_void_p, w.LPCWSTR, c.c_void_p, c.POINTER(Process)])
resume = api('ResumeThread', [w.HANDLE], w.DWORD)
exit_code = api('GetExitCodeProcess', [w.HANDLE, c.POINTER(w.DWORD)])


def checked(ok):
    if not ok:
        raise c.WinError(c.get_last_error())
    return ok


def emit(value):
    print(json.dumps(value, separators=(',', ':')), flush=True)


def run(config):
    job = port = attrs = None
    watchdog = None
    closing, timed_out = threading.Event(), threading.Event()
    termination_lock = threading.Lock()
    def kill_tree():
        with termination_lock:
            if job and not closing.is_set():
                terminate(job, 1)
    process = Process()
    fds, readers = [], []
    started = time.monotonic()
    try:
        job = checked(create_job(None, None))
        limit = Extended()
        limit.basic.flags = 0x2000 | 0x200  # KILL_ON_JOB_CLOSE | JOB_MEMORY; no breakaway
        limit.job_memory = config['memory_bytes']
        checked(set_job(job, 9, c.byref(limit), c.sizeof(limit)))
        port = checked(create_port(w.HANDLE(-1), None, 0, 1))
        completion = Completion(None, port)
        checked(set_job(job, 7, c.byref(completion), c.sizeof(completion)))
        notification = Notification()
        notification.memory, notification.flags = config['memory_bytes'], 0x200
        checked(set_job(job, 12, c.byref(notification), c.sizeof(notification)))
        checked(query_job(job, 9, c.byref(limit), c.sizeof(limit), None))
        if limit.job_memory != config['memory_bytes'] or limit.basic.flags & 0x2200 != 0x2200:
            raise RuntimeError('JOB_HARD_LIMIT_READBACK_MISMATCH')
        size = SIZE()
        init_attrs(None, 2, 0, c.byref(size))
        attrs = c.create_string_buffer(size.value)
        checked(init_attrs(attrs, 2, 0, c.byref(size)))
        jobs = (w.HANDLE * 1)(job)
        # PROC_THREAD_ATTRIBUTE_JOB_LIST assigns atomically during creation.
        checked(update_attr(attrs, 0, 0x2000D, jobs, c.sizeof(jobs), None, None))
        out_r, out_w = os.pipe()
        err_r, err_w = os.pipe()
        null_fd = os.open('nul', os.O_RDONLY)
        fds = [out_r, out_w, err_r, err_w, null_fd]
        for fd in (out_w, err_w, null_fd):
            os.set_inheritable(fd, True)
        handles = (w.HANDLE * 3)(*[msvcrt.get_osfhandle(fd) for fd in (null_fd, out_w, err_w)])
        checked(update_attr(attrs, 0, 0x20002, handles, c.sizeof(handles), None, None))
        startup = StartupEx()
        startup.startup.cb = c.sizeof(startup)
        startup.startup.flags = 0x100  # STARTF_USESTDHANDLES
        startup.startup.stdin, startup.startup.stdout, startup.startup.stderr = handles
        startup.attributes = c.cast(attrs, c.c_void_p)
        command = c.create_unicode_buffer(subprocess.list2cmdline([config['executable'], *config['args']]))
        checked(create_process(config['executable'], command, None, None, True,
                               0x08000000 | 0x80000 | 4, None, config['cwd'], c.byref(startup), c.byref(process)))
        for fd in (out_w, err_w, null_fd):
            os.close(fd)
            fds.remove(fd)
        events = queue.Queue(maxsize=512)
        def capture(fd, stream):
            try:
                while True:
                    data = os.read(fd, 4096)
                    if not data:
                        break
                    events.put((stream, data))
            except OSError:
                pass
        for fd, stream in ((out_r, 'stdout'), (err_r, 'stderr')):
            thread = threading.Thread(target=capture, args=(fd, stream), daemon=True)
            thread.start()
            readers.append(thread)
        cancelled = threading.Event()
        def control():
            # Controller EOF is also cancellation; a dead host leaves no child.
            # Raw OS pipe read avoids a buffered-stdin lock during interpreter
            # shutdown while the daemon control thread is waiting for a host.
            os.read(sys.stdin.fileno(), 64)
            cancelled.set()
            kill_tree()
        threading.Thread(target=control, daemon=True).start()
        if resume(process.thread) == 0xFFFFFFFF:
            raise c.WinError(c.get_last_error())
        started = time.monotonic()
        def timeout():
            timed_out.set()
            kill_tree()
        watchdog = threading.Timer(config['timeout_ms'] / 1000, timeout)
        watchdog.daemon = True
        watchdog.start()
        emit({'event': 'started', 'pid': process.pid, 'adapter': 'windows-job-list', 'hard_memory_bytes': limit.job_memory, 'limit_flags': limit.basic.flags})
        reason, output_bytes, code, peak, pids = None, 0, w.DWORD(259), None, [process.pid]
        memory_events = []
        def drain():
            nonlocal output_bytes, reason
            while not events.empty():
                stream, data = events.get_nowait()
                available = max(0, config['max_output_bytes'] - output_bytes)
                output_bytes += len(data)
                if available:
                    emit({'event': 'output', 'stream': stream, 'base64': base64.b64encode(data[:available]).decode('ascii')})
                if output_bytes > config['max_output_bytes'] and reason is None:
                    reason = 'output_limit'
        while True:
            drain()
            message, key, overlapped = w.DWORD(), SIZE(), c.c_void_p()
            wait = 20
            while get_port(port, c.byref(message), c.byref(key), c.byref(overlapped), wait):
                if message.value == 6 and overlapped.value and overlapped.value not in pids:
                    pids.append(overlapped.value)
                if message.value in (9, 10):
                    reason = reason or 'memory_limit'
                    if len(memory_events) < 16:
                        memory_events.append({'message': message.value})
                if message.value == 11:
                    violation = Violation()
                    checked(query_job(job, 13, c.byref(violation), c.sizeof(violation), None))
                    if violation.violations & 0x200:
                        reason = reason or 'memory_limit'
                    if len(memory_events) < 16:
                        memory_events.append({'message': 11, 'flags': violation.violations, 'job_memory': violation.memory, 'notification_limit': violation.memory_limit})
                wait = 0
            if c.get_last_error() not in (0, 258):
                raise c.WinError(c.get_last_error())
            if cancelled.is_set():
                reason = reason or 'user_cancelled'
            if timed_out.is_set() or (time.monotonic() - started) * 1000 >= config['timeout_ms']:
                reason = reason or 'timeout'
            checked(exit_code(process.process, c.byref(code)))
            if reason or code.value != 259:
                break
        # Always reap surviving descendants, including normal root exit.
        checked(terminate(job, 1 if reason else 0))
        account = Accounting()
        for _ in range(200):
            checked(query_job(job, 1, c.byref(account), c.sizeof(account), None))
            if account.active == 0:
                break
            time.sleep(0.01)
        if account.active:
            raise RuntimeError('JOB_TREE_NOT_REAPED')
        finish = time.monotonic() + 2
        while any(t.is_alive() for t in readers) and time.monotonic() < finish:
            drain()
            time.sleep(0.01)
        drain()
        if any(t.is_alive() for t in readers):
            raise RuntimeError('OUTPUT_PIPE_NOT_DRAINED')
        if query_job(job, 9, c.byref(limit), c.sizeof(limit), None):
            peak = limit.peak_job / (1024 * 1024)
        emit({'event': 'finished', 'status': 'resource_limit_exceeded' if reason in ('timeout', 'memory_limit', 'output_limit') else 'errored' if reason else 'passed' if code.value == 0 else 'failed',
              'reason': reason, 'exit_code': None if reason else code.value,
              'resource_peak_mb': peak, 'duration_ms': round((time.monotonic() - started) * 1000),
              'active_processes_after': account.active, 'observed_pids': pids, 'memory_events': memory_events})
    finally:
        closing.set()
        if watchdog:
            watchdog.cancel()
            watchdog.join(timeout=1)
        if job:
            with termination_lock:
                terminate(job, 1)
        for handle in (process.thread, process.process, port, job):
            if handle:
                close(handle)
        if attrs:
            delete_attrs(attrs)
        for fd in fds:
            try:
                os.close(fd)
            except OSError:
                pass


try:
    raw = sys.stdin.buffer.readline(65537)
    if len(raw) > 65536:
        raise ValueError('JOB_CONFIG_LIMIT')
    run(json.loads(raw))
except Exception as error:
    emit({'event': 'adapter_error', 'reason': str(error)[:2000]})
    sys.exit(2)
