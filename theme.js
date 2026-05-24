(function () {
  var btn = document.getElementById('theme-toggle');
  if (btn) {
    btn.addEventListener('click', function () {
      var cur = document.documentElement.dataset.theme
        || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      var next = cur === 'dark' ? 'light' : 'dark';
      document.documentElement.dataset.theme = next;
      localStorage.setItem('theme', next);
      document.dispatchEvent(new CustomEvent('theme-changed', { detail: { theme: next } }));
    });
  }
  document.querySelectorAll('aside a').forEach(function (a) {
    try {
      if (new URL(a.href).pathname === location.pathname) a.classList.add('active');
    } catch (e) {}
  });
})();
