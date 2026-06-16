import re

with open('frontend/src/pages/AccountPage.tsx', 'r') as f:
    content = f.read()

# Add edit button logic for profile details
edit_html = """             <div className="flex justify-between items-center mb-4 border-b border-border pb-2">
               <h2 className="text-sm font-bold uppercase tracking-widest">Profile Details</h2>
               <Link to="/settings" className="text-xs text-secondary-text hover:text-foreground">EDIT</Link>
             </div>"""

content = re.sub(r'<h2 className="text-sm font-bold uppercase tracking-widest mb-4 border-b border-border pb-2">Profile Details</h2>', edit_html, content)

with open('frontend/src/pages/AccountPage.tsx', 'w') as f:
    f.write(content)
