"""
测试 Supabase 连接
"""
import socket
import sys

# 测试 DNS 解析
hosts = [
    'ozshflujnxonhfwdtunp.supabase.co',
    'db.ozshflujnxonhfwdtunp.supabase.co',
    'ozshflujnxonhfwdtunp.pooler.supabase.com',  # Supabase Connection Pooler
    'aws-0-ap-southeast-1.pooler.supabase.com'   # Supabase 区域 Pooler
]

print("测试 DNS 解析:")
for host in hosts:
    try:
        ip = socket.gethostbyname(host)
        print(f"[OK] {host} -> {ip}")
    except socket.gaierror as e:
        print(f"[FAIL] {host} -> DNS 解析失败: {e}")

# 测试不同端口连接
print("\n测试端口连接:")
test_cases = [
    ('ozshflujnxonhfwdtunp.supabase.co', 5432),
    ('ozshflujnxonhfwdtunp.supabase.co', 6543),
]

for host, port in test_cases:
    try:
        ip = socket.gethostbyname(host)
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(5)
        result = sock.connect_ex((ip, port))
        if result == 0:
            print(f"[OK] 可以连接到 {host}:{port} ({ip})")
        else:
            print(f"[FAIL] 无法连接到 {host}:{port} ({ip}) - 错误码: {result}")
        sock.close()
    except Exception as e:
        print(f"[FAIL] {host}:{port} -> {e}")