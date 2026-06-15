const fs = require('fs');
const file = 'frontend/src/pages/ProductPage.tsx';
let code = fs.readFileSync(file, 'utf8');

const search = `        {product.enableColors && product.colors && product.colors.length > 0 && (
          <div className="pt-4 border-t border-border">
            <h3 className="font-bold mb-2">Color</h3>
            <div className="flex flex-wrap gap-2">
              {product.colors.map(c => (
                <button
                  key={c}
                  onClick={() => setSelectedColor(c)}
                  className={\`border px-4 py-2 text-sm font-medium rounded transition-colors \${selectedColor === c ? 'border-foreground bg-foreground text-white' : 'border-slate-300 hover:border-slate-500'}\`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        )}`;

const replace = `        {product.enableColors && product.colors && product.colors.length > 0 && (
          <div className="pt-4 border-t border-border">
            <h3 className="font-bold mb-2">Color</h3>
            <div className="flex flex-wrap gap-3">
              {product.colors.map(c => (
                <button
                  key={c}
                  onClick={() => setSelectedColor(c)}
                  className={\`w-8 h-8 rounded-full border-2 transition-all \${selectedColor === c ? 'border-foreground shadow-sm scale-110' : 'border-transparent hover:scale-105'}\`}
                  style={{ backgroundColor: c.toLowerCase() }}
                  title={c}
                  aria-label={\`Select \${c}\`}
                />
              ))}
            </div>
          </div>
        )}`;

code = code.replace(search, replace);
fs.writeFileSync(file, code);
