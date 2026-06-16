import re

with open('frontend/src/pages/AccountPage.tsx', 'r') as f:
    content = f.read()

# Replace orders slice to show undelivered or last order
new_orders_logic = """                 const ordersData = await ordersRes.json();
                 let recentOrders = ordersData.filter(o => o.status !== 'delivered');
                 if (recentOrders.length === 0 && ordersData.length > 0) {
                   recentOrders = [ordersData[0]];
                 }
                 setOrders(recentOrders.slice(0, 3));"""

content = re.sub(r'const ordersData = await ordersRes\.json\(\);\s*setOrders\(ordersData\.slice\(0, 3\)\); \/\/ show only recent 3', new_orders_logic, content)

with open('frontend/src/pages/AccountPage.tsx', 'w') as f:
    f.write(content)
