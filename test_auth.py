import requests

try:
    resp = requests.post("http://localhost:5000/api/auth/login", json={"identifier": "test", "password": "test"})
    print(resp.status_code)
    print(resp.json())
except Exception as e:
    print(e)
