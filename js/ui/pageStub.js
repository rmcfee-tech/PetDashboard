// ui/pageStub.js
// Shared renderer for pages that don't have their full feature build yet.
// Keeps every unfinished page visually consistent instead of blank screens,
// and confirms the routing + layout shell works end-to-end before Stage 3.

export function renderStubPage(container, { title, description }) {
  container.innerHTML = `
    <div class="page-heading"><h1>${title}</h1></div>
    <div class="empty-state">
      <h2>${title} is coming in a later stage</h2>
      <p>${description}</p>
    </div>
  `;
}
