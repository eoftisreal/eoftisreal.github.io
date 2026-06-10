
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, UserCog, Database, Settings, Package, Tags, Ticket, Library, ShoppingBag } from 'lucide-react';

const navItems = [
  { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
  { name: 'Orders', path: '/admin/orders', icon: ShoppingBag },
  { name: 'Users', path: '/admin/users', icon: Users },
  { name: 'Admins', path: '/admin/admins', icon: UserCog },
  {
    name: 'Master',
    icon: Database,
    subItems: [
      { name: 'Categories', path: '/admin/categories', icon: Library },
      { name: 'Brands', path: '/admin/brands', icon: Tags },
      { name: 'Coupons', path: '/admin/coupons', icon: Ticket },
    ]
  },
  { name: 'Products', path: '/admin/products', icon: Package },
  { name: 'Settings', path: '/admin/settings', icon: Settings },
];

export default function AdminSidebar() {
  const location = useLocation();

  return (
    <aside className="w-64 bg-white border-r border-slate-200 h-full flex flex-col">
      <div className="p-4 border-b border-slate-200 flex items-center justify-between">
        <Link to="/" className="text-xl font-black text-foreground">
          Admin Panel
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {navItems.map((item) => (
          <div key={item.name}>
            {item.subItems ? (
              <div className="space-y-1">
                <div className="flex items-center gap-3 px-3 py-2 text-sm font-semibold text-slate-500 uppercase tracking-wider mt-4 mb-2">
                  <item.icon className="w-4 h-4" />
                  {item.name}
                </div>
                {item.subItems.map((sub) => {
                  const isActive = location.pathname === sub.path;
                  return (
                    <Link
                      key={sub.name}
                      to={sub.path}
                      className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-foreground text-white '
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <sub.icon className="w-4 h-4" />
                      {sub.name}
                    </Link>
                  );
                })}
              </div>
            ) : (
              <Link
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === item.path
                    ? 'bg-foreground text-white '
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.name}
              </Link>
            )}
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-foreground text-white flex items-center justify-center font-bold">
            A
          </div>
          <div className="text-sm">
            <p className="font-semibold text-slate-800">Admin User</p>
            <Link to="/" className="text-xs text-foreground hover:underline">Return to Store</Link>
          </div>
        </div>
      </div>
    </aside>
  );
}
