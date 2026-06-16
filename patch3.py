import re

with open('frontend/src/pages/AccountPage.tsx', 'r') as f:
    content = f.read()

# Replace "/settings" with a basic prompt for edit feature (since there is no edit page)
edit_html = """               <button onClick={() => alert('Profile editing is currently available during checkout. Standalone profile editing coming soon.')} className="text-xs text-secondary-text hover:text-foreground">EDIT</button>"""

content = re.sub(r'<Link to="/settings" className="text-xs text-secondary-text hover:text-foreground">EDIT</Link>', edit_html, content)

with open('frontend/src/pages/AccountPage.tsx', 'w') as f:
    f.write(content)
