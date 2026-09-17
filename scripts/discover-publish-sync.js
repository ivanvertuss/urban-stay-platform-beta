(() => {
'use strict';

// Discover keeps its working data inside discover-manager.js. This bridge makes
// status actions durable immediately by triggering the manager's verified save
// after its own click handler has updated the recommendation in memory.
let saving = false;

function saveDiscoverSoon(message) {
  window.setTimeout(() => {
    if (saving) return;
    const save = document.querySelector('#saveDiscover');
    if (!save) return;
    saving = true;
    save.click();
    window.setTimeout(() => { saving = false; }, 700);
    if (message) window.setTimeout(() => {
      const toast = document.querySelector('#toast');
      if (!toast) return;
      toast.textContent = message;
      toast.classList.add('show');
      clearTimeout(window.__discoverPublishToast);
      window.__discoverPublishToast = window.setTimeout(() => toast.classList.remove('show'), 2400);
    }, 120);
  }, 40);
}

document.addEventListener('click', event => {
  const publish = event.target.closest?.('[data-rec-publish]');
  if (publish) {
    const wasPublished = publish.textContent.trim().toLowerCase().includes('despublicar');
    saveDiscoverSoon(wasPublished
      ? '✓ Recomendación despublicada y sincronizada'
      : '✓ Recomendación publicada y sincronizada con la propiedad');
    return;
  }

  const review = event.target.closest?.('[data-rec-review]');
  if (review) {
    saveDiscoverSoon('✓ Estado revisado y sincronizado');
    return;
  }

  const remove = event.target.closest?.('[data-rec-delete]');
  if (remove) {
    saveDiscoverSoon('✓ Recomendación eliminada y sincronizada');
  }
}, false);
})();