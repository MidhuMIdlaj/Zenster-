import re
from pathlib import Path

root = Path(r'c:/Web_Design/web designing/Second Project')
frontend = root / 'frontend' / 'src' / 'api'
backend = root / 'Backend' / 'src' / 'interfaces' / 'Routers'

frontend_paths = set()
for path in frontend.rglob('*.ts'):
    text = path.read_text(encoding='utf-8', errors='ignore')
    for pat in [r'axiosInstance\.(?:get|post|patch|put|delete)\(\s*`([^`]+)`',
                r'axiosInstance\.(?:get|post|patch|put|delete)\(\s*"([^"]+)"',
                r"axiosInstance\.(?:get|post|patch|put|delete)\(\s*'([^']+)'"]:
        for m in re.finditer(pat, text):
            frontend_paths.add(m.group(1).strip())
    # also collect direct axios calls to configManager.getApiEndpoint
    for m in re.finditer(r'configManager\.getApiEndpoint\(\s*"([^"]+)"\s*\)|configManager\.getApiEndpoint\(\s*\'([^']+)\'\s*\)', text):
        pass

backend_paths = set()
for path in backend.rglob('*.ts'):
    text = path.read_text(encoding='utf-8', errors='ignore')
    for pat in [r"router\.(?:get|post|patch|put|delete)\(\s*'([^']+)'",
                r'router\.(?:get|post|patch|put|delete)\(\s*"([^"]+)"']:
        for m in re.finditer(pat, text):
            backend_paths.add(m.group(1).strip())

print('Frontend paths count:', len(frontend_paths))
print('Backend paths count:', len(backend_paths))
print('--- Backend routes ---')
for p in sorted(backend_paths):
    print(p)
print('--- Frontend api calls ---')
for p in sorted(frontend_paths):
    print(p)

print('--- Missing frontend API routes ---')
missing = []
for f in sorted(frontend_paths):
    if any(f.startswith(prefix) for prefix in ['/admin', '/common', '/notification', '/chat', '/location', '/video-call', '/video-call-history', '/employee']):
        if not any(f == b or f.startswith(b.rstrip('*')) or b.startswith(f.rstrip('*')) for b in backend_paths):
            missing.append(f)
for p in missing:
    print(p)
print('Total missing:', len(missing))
