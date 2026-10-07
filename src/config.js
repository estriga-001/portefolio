// Edit only this object to personalise the portfolio.
export const profile = {
  name: 'Miguel Estriga',
  initials: 'ME',
  email: 'miguelestrigaepic@gmail.com',
  linkedin: 'https://www.linkedin.com/in/mestriga1',
  github: 'https://github.com/estriga-001',
  location: '[LOCATION]',
};

const isPlaceholder = (value) => /^\[[A-Z_ ]+\]$/.test(value.trim());

const setMetaContent = (selector, value) => {
  const element = document.querySelector(selector);
  if (element) element.setAttribute('content', value);
};

export function applyProfile() {
  document.querySelectorAll('[data-profile-text]').forEach((element) => {
    const key = element.dataset.profileText;
    if (!profile[key]) return;
    element.textContent = key === 'initials'
      ? profile[key].replace(/^\[|\]$/g, '')
      : profile[key];
  });

  document.querySelectorAll('[data-profile-value]').forEach((element) => {
    const key = element.dataset.profileValue;
    if (profile[key]) element.textContent = profile[key];
  });

  document.querySelectorAll('[data-profile-link]').forEach((link) => {
    const key = link.dataset.profileLink;
    const value = profile[key]?.trim();

    if (!value || isPlaceholder(value)) {
      link.setAttribute('href', '#contact');
      link.setAttribute('aria-disabled', 'true');
      link.setAttribute('title', `Replace ${value || key} in src/config.js`);
      link.addEventListener('click', (event) => event.preventDefault());
      return;
    }

    link.removeAttribute('aria-disabled');
    link.removeAttribute('title');
    link.href = key === 'email' ? `mailto:${value}` : value;
  });

  const title = `${profile.name} — Cybersecurity & Networking`;
  document.title = title;
  setMetaContent('meta[property="og:title"]', title);

  document.querySelectorAll('[data-current-year]').forEach((element) => {
    element.textContent = String(new Date().getFullYear());
  });
}
