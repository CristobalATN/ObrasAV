(function(w) {
  const _k1 = '87fN';
  const _k2 = 'o4mc';
  const _k3 = 'k!Yb';
  const _k4 = 'z2J';
  const _gk = () => _k1 + _k2 + _k3 + _k4;
  function _d(e, k = _gk()) {
    if (!e) return '';
    try {
      const b = atob(e);
      const by = new Uint8Array(b.length);
      for (let i = 0; i < b.length; i++) by[i] = b.charCodeAt(i);
      const kb = new TextEncoder().encode(k);
      const db = new Uint8Array(by.length);
      for (let i = 0; i < by.length; i++) db[i] = by[i] ^ kb[i % kb.length];
      return new TextDecoder('utf-8').decode(db);
    } catch (x) { return ''; }
  }
  async function _l() {
    try {
      const r = await fetch('assets/core-data.json');
      if (!r.ok) throw 0;
      const d = await r.json();
      // Decrypt keys dynamic
      const n = _d('dlgLLB1RTQAETCkOH0Yl');
      const c = _d('e1gUPApbTQYHRDoWCPH5Vl4FIQ==');
      return d.map(i => ({
        [n]: _d(i.d1),
        [c]: _d(i.d2)
      }));
    } catch (x) {
      return [];
    }
  }
  w.AppSecurity = { loadData: _l };
})(window);
