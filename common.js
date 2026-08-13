(function(){
  const revealNodes = document.querySelectorAll('.reveal');
  if(revealNodes.length){
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if(entry.isIntersecting) entry.target.classList.add('visible');
      });
    }, { threshold: 0.15 });
    revealNodes.forEach((el) => observer.observe(el));
  }

  // Mobile nav toggle
  const toggle = document.getElementById('navToggle');
  const links = document.getElementById('navLinks');
  if(toggle && links){
    toggle.addEventListener('click', () => {
      const isOpen = links.classList.toggle('open');
      toggle.classList.toggle('open', isOpen);
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
    links.querySelectorAll('a').forEach((a) => {
      a.addEventListener('click', () => {
        links.classList.remove('open');
        toggle.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }
})();
