// ---- Back to Top Button ----
const backToTopBtn = document.getElementById('backToTop');
window.addEventListener('scroll', () => {
  if (window.pageYOffset > 300) {
    backToTopBtn.classList.remove('opacity-0', 'invisible');
    backToTopBtn.classList.add('opacity-100', 'visible');
  } else {
    backToTopBtn.classList.remove('opacity-100', 'visible');
    backToTopBtn.classList.add('opacity-0', 'invisible');
  }
});
backToTopBtn?.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// ---- Emergency Modal ----
const emergencyBtn = document.querySelector('.emergency-btn');
const emergencyModal = document.getElementById('emergencyModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const closeModal = document.getElementById('closeModal');

if (emergencyBtn) {
  emergencyBtn.addEventListener('click', () => {
    emergencyModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  });
}
if (closeModalBtn) {
  closeModalBtn.addEventListener('click', () => {
    emergencyModal.classList.add('hidden');
    document.body.style.overflow = 'auto';
  });
}
if (closeModal) {
  closeModal.addEventListener('click', () => {
    emergencyModal.classList.add('hidden');
    document.body.style.overflow = 'auto';
  });
}

// (also show quick alert when emergency button clicked)
document.querySelectorAll('.emergency-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    // keep modal opening; also show quick alert (optional, can be removed)
    // alert('📞 Emergency Helpline: 181 (India), 1091 (Women\\'s Helpline)');
  });
});

// ---- Mobile menu toggle ----
const menuBtn = document.querySelector("nav button[aria-label='Toggle navigation menu']");
const navMenu = document.querySelector('.md\\:flex.space-x-8');
menuBtn?.addEventListener('click', function () {
  if (!navMenu) return;
  navMenu.classList.toggle('hidden');
  navMenu.classList.toggle('flex');
});

// ---- Contact Form: AJAX to /api/contact ----
document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("#contact form") || document.querySelector("form");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = {
      name: form.name?.value || '',
      email: form.email?.value || '',
      subject: form.subject?.value || '',
      message: form.message?.value || ''
    };

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      alert(data.msg || 'Response received');
      if (data.success) form.reset();
    } catch (err) {
      console.error('submit err', err);
      alert("Something went wrong!");
    }
  });
});

// ---- Subscribe form (footer) - demo ----
const footerForm = document.querySelector('footer form');
if (footerForm) {
  footerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    alert('Subscribed (demo).');
  });
}
