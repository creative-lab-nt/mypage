// 蟷ｴ陦ｨ遉ｺ
document.getElementById('year').textContent = new Date().getFullYear();

// 繧ｹ繝繝ｼ繧ｹ繧ｹ繧ｯ繝ｭ繝ｼ繝ｫ・亥・驛ｨ繝ｪ繝ｳ繧ｯ・・document.querySelectorAll('a[href^="#"]').forEach((a) => {
  a.addEventListener('click', (e) => {
    const id = a.getAttribute('href');
    if (!id || id === '#' || id.length === 1) return;
    const el = document.querySelector(id);
    if (!el) return;
    e.preventDefault();
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    history.pushState(null, '', id);
  });
});

// 繧ｹ繧ｯ繝ｭ繝ｼ繝ｫ陦ｨ遉ｺ繧｢繝九Γ繝ｼ繧ｷ繝ｧ繝ｳ
const io = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.1 }
);

document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

// 繝｢繝舌う繝ｫ繝翫ン髢矩哩
const toggle = document.querySelector('.nav-toggle');
const nav = document.getElementById('primary-nav');
if (toggle && nav) {
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(open));
  });
}

// 逕ｻ蜒上・繝ｭ繝ｼ繧ｫ繝ｫ繧呈里螳夊｡ｨ遉ｺ・亥崋螳壼喧蠕後・srcset縺ｫ閾ｪ蜍輔〒蛻・崛貂医∩諠ｳ螳夲ｼ・
