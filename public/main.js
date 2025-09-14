// 年表示
document.getElementById('year').textContent = new Date().getFullYear();

// スムーススクロール（内部リンク）
document.querySelectorAll('a[href^="#"]').forEach((a) => {
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

// スクロール表示アニメーション
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

// モバイルナビ開閉
const toggle = document.querySelector('.nav-toggle');
const nav = document.getElementById('primary-nav');
if (toggle && nav) {
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(open));
  });
}

// 画像の自動差し替え（Unsplash Source）
(() => {
  const stepImages = [
    'https://source.unsplash.com/1280x720/?meeting,notebook,brainstorm',
    'https://source.unsplash.com/1280x720/?wireframe,ux,sketch',
    'https://source.unsplash.com/1280x720/?design,typography,moodboard',
    'https://source.unsplash.com/1280x720/?collaboration,feedback,design',
    'https://source.unsplash.com/1280x720/?code,frontend,developer',
    'https://source.unsplash.com/1280x720/?testing,usability,mobile',
    'https://source.unsplash.com/1280x720/?launch,rocket,website',
  ];
  const workImages = [
    'https://source.unsplash.com/1280x720/?landing,website,design',
    'https://source.unsplash.com/1280x720/?corporate,website,design',
    'https://source.unsplash.com/1280x720/?campaign,landing,form',
  ];
  document.querySelectorAll('.step__media img').forEach((img, i) => {
    if (stepImages[i]) img.src = stepImages[i];
    img.referrerPolicy = 'no-referrer';
  });
  document.querySelectorAll('.work__media img').forEach((img, i) => {
    if (workImages[i]) img.src = workImages[i];
    img.referrerPolicy = 'no-referrer';
  });
})();
