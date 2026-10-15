'use strict';
const menu = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#navigation');
function closeMenu() { menu.setAttribute('aria-expanded', 'false'); navigation.classList.remove('open'); }
menu.addEventListener('click', () => { const open = menu.getAttribute('aria-expanded') !== 'true'; menu.setAttribute('aria-expanded', String(open)); navigation.classList.toggle('open', open); });
navigation.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
document.addEventListener('keydown', event => { if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') { closeMenu(); menu.focus(); } });
window.matchMedia('(min-width: 701px)').addEventListener('change', closeMenu);
const architecture = document.querySelector('.architecture');
const architectureCopy = {
 before: ['Tightly coupled monolithic integrations', 'Integrations share one monolithic deployment boundary. Changes require a coupled release.', 'Monolith · shared deployment', 'Before: integrations share a tightly coupled deployment. Changes must move through a common release lifecycle.'],
 after: ['Independent Kubernetes connectors', 'Three reusable connectors have separate deployment boundaries within Kubernetes.', 'Kubernetes · independent deployments', 'After: reusable connectors deploy and scale independently. A change to one connector does not require a shared release.']
};
document.querySelectorAll('[data-architecture]').forEach(button => button.addEventListener('click', () => {
 const mode = button.dataset.architecture;
 architecture.dataset.mode = mode;
 document.querySelectorAll('[data-architecture]').forEach(control => control.setAttribute('aria-pressed', String(control === button)));
 ['arch-title', 'arch-desc', 'boundary-label', 'architecture-caption'].forEach((id, index) => { document.getElementById(id).textContent = architectureCopy[mode][index]; });
}));
const steps = [...document.querySelectorAll('[data-step]')];
function selectStep(button) {
 steps.forEach(control => control.setAttribute('aria-pressed', String(control === button)));
 document.querySelectorAll('.workflow-panel').forEach(panel => { panel.hidden = panel.id !== button.dataset.step; });
}
steps.forEach(button => { button.setAttribute('aria-controls', button.dataset.step); button.addEventListener('click', () => selectStep(button)); });
selectStep(steps[0]);

// An explanatory interaction: highlights deployment scope, never simulates live traffic.
const releaseDemo = document.querySelector('.release-demo');
const releaseButton = document.querySelector('.release-button');
const releaseExplanation = document.querySelector('.release-explanation');
releaseDemo.hidden = false;
function updateReleaseScope() {
 const active = releaseButton.getAttribute('aria-pressed') === 'true';
 architecture.dataset.tracing = String(active);
 releaseExplanation.textContent = !active
  ? 'See which connectors need a release when Connector B changes.'
  : architecture.dataset.mode === 'before'
   ? 'A, B and C must be deployed together, even when only Connector B changes.'
   : 'Only Connector B needs a release. A and C keep their existing deployments.';
}
releaseButton.addEventListener('click', () => {
 releaseButton.setAttribute('aria-pressed', String(releaseButton.getAttribute('aria-pressed') !== 'true'));
 updateReleaseScope();
});
document.querySelectorAll('[data-architecture]').forEach(button => button.addEventListener('click', updateReleaseScope));

// Native scrolling drives a single persistent illustration; no wheel interception.
const storyStage = document.querySelector('.story-stage');
const storyChapters = [...document.querySelectorAll('.story-chapter')];
const storyLinks = [...document.querySelectorAll('.story-navigation a')];
function showChapter(chapter) {
 const index = storyChapters.indexOf(chapter);
 storyStage.dataset.chapter = chapter.dataset.scene;
 document.querySelector('.story-counter').textContent = `0${index + 1} / 03`;
 storyLinks.forEach((link, i) => { if (i === index) link.setAttribute('aria-current', 'step'); else link.removeAttribute('aria-current'); });
}
let storyTick = false;
function updateStory() {
 const anchor = innerHeight * (innerWidth <= 700 ? .72 : .5);
 const nearest = storyChapters.reduce((best, chapter) => {
  const box = chapter.getBoundingClientRect();
  const distance = Math.abs(box.top + box.height / 2 - anchor);
  return !best || distance < best.distance ? { chapter, distance } : best;
 }, null);
 showChapter(nearest.chapter);
 storyTick = false;
}
window.addEventListener('scroll', () => { if (!storyTick) { storyTick = true; requestAnimationFrame(updateStory); } }, { passive:true });
window.addEventListener('resize', updateStory);
updateStory();

const contactForm = document.querySelector('#contact-form');
const contactSubmit = contactForm.querySelector('[type=submit]');
const contactStatus = document.querySelector('#contact-status');
const contactEndpoint = window.contactConfig?.endpoint || '';
let sendingContact = false;
let validContactEndpoint = false;
try {
 const endpoint = new URL(contactEndpoint);
 validContactEndpoint = endpoint.origin === 'https://formspree.io' && /^\/f\/[a-zA-Z0-9]+$/.test(endpoint.pathname) && !endpoint.search && !endpoint.hash;
} catch {}
if (validContactEndpoint) {
 contactForm.action = contactEndpoint;
 contactSubmit.disabled = false;
 contactStatus.textContent = '';
}
contactForm.addEventListener('submit', async event => {
 event.preventDefault();
 if (!validContactEndpoint || sendingContact || !contactForm.reportValidity()) return;
 sendingContact = true; contactSubmit.disabled = true;
 contactForm.setAttribute('aria-busy','true');
 contactStatus.textContent = 'Sending your message…';
 const controller = new AbortController();
 const timeout = setTimeout(() => controller.abort(), 15000);
 try {
  const response = await fetch(contactEndpoint, {method:'POST', body:new FormData(contactForm), headers:{Accept:'application/json'}, signal:controller.signal});
  const result = await response.json();
  if (!response.ok || result.ok !== true) throw new Error('Submission rejected');
  contactForm.reset();
  contactStatus.textContent = 'Thank you. Your message has been sent.';
 } catch {
  contactStatus.textContent = 'Delivery could not be confirmed. Your message is still here. Please try again or contact me on LinkedIn.';
 } finally {
  clearTimeout(timeout); sendingContact = false;
  contactSubmit.disabled = false; contactForm.removeAttribute('aria-busy');
  contactStatus.focus({preventScroll:true});
 }
});
