const userId = '11111111-1111-4111-8111-111111111111';
const spotId = '22222222-2222-4222-8222-222222222222';

function openDashboard(tab = '') {
  const user = { id: userId, aud: 'authenticated', role: 'authenticated', email: 'maria@example.com', app_metadata: { provider: 'email', providers: ['email'] }, user_metadata: {}, created_at: '2026-01-01T00:00:00Z' };
  let profile = { id: userId, username: 'maria_cruz', display_name: 'Maria Cruz', role: 'user', avatar_path: null };
  let saved: string[] = [];
  let signedOut = false;
  const spots = [
    { id: spotId, name: 'Naujan Lake', category: 'Nature', description: 'A peaceful lakeside destination.', address: 'Naujan, Oriental Mindoro', image_url: '/test-spot-photos/lake-1.png', image_urls: ['/test-spot-photos/lake-1.png', '/test-spot-photos/lake-2.png'], latitude: null, longitude: null, bucket_list: ['Bird watching'], created_at: '2026-10-01T00:00:00Z' },
    { id: '33333333-3333-4333-8333-333333333333', name: 'Town Heritage Park', category: 'Heritage', description: 'Discover local stories and heritage.', address: 'Poblacion, Naujan', image_url: null, latitude: null, longitude: null, bucket_list: ['Walking'], created_at: '2026-10-01T00:00:00Z' },
  ];
  // All account requests are fixtures: these tests never contact the live database.
  cy.intercept('GET', '**/test-spot-photos/*', { headers: { 'content-type': 'image/png' }, fixture: 'avatar.png' });
  cy.intercept('**/auth/v1/**', req => {
    if (req.url.includes('/logout')) { signedOut = true; req.reply(204); }
    else if (signedOut) req.reply(401, { message: 'No session', code: 'session_not_found' });
    else req.reply(user);
  }).as('auth');
  cy.intercept('**/rest/v1/profiles*', req => {
    if (req.method === 'PATCH') profile = { ...profile, ...req.body };
    req.reply(profile);
  }).as('profile');
  cy.intercept('GET', '**/rest/v1/tourist_spots*', req => {
    const id = new URL(req.url).searchParams.get('id')?.replace('eq.', '');
    req.reply(id ? spots.find(spot => spot.id === id) : spots);
  });
  cy.intercept('GET', '**/rest/v1/nearby_places*', []);
  cy.intercept('**/rest/v1/saved_spots*', req => {
    if (req.method === 'POST') { saved = [...new Set([...saved, req.body.spot_id])]; req.reply(201, ''); }
    else if (req.method === 'DELETE') { saved = saved.filter(id => `eq.${id}` !== new URL(req.url).searchParams.get('spot_id')); req.reply(204); }
    else req.reply(saved.map(spot_id => ({ spot_id })));
  }).as('bookmarks');
  cy.intercept('POST', '**/storage/v1/object/profile-avatars/**', { Key: 'profile-avatars/test.png', Id: 'picture-1' }).as('upload');
  cy.intercept('DELETE', '**/storage/v1/object/profile-avatars', []);
  cy.intercept('POST', '**/storage/v1/object/sign/profile-avatars/**', { signedURL: '/object/sign/profile-avatars/test.png?token=fake' }).as('signedPicture');
  cy.intercept('GET', '**/storage/v1/object/sign/profile-avatars/**', { headers: { 'content-type': 'image/png' }, fixture: 'avatar.png' });
  cy.readFile('.env', { log: false }).then((env: string) => {
    const url = /^VITE_SUPABASE_URL\s*=\s*["']?([^\r\n"']+)/m.exec(env)?.[1]?.trim();
    if (!url) throw new Error('The test needs VITE_SUPABASE_URL in .env to identify the session storage key.');
    const storageKey = `sb-${new URL(url).hostname.split('.')[0]}-auth-token`;
    cy.visit(`/tourists${tab ? `?tab=${tab}` : ''}`, {
      onBeforeLoad(win) {
        win.localStorage.clear();
        win.localStorage.setItem('lakbaynaujan-theme', 'light');
        const expires = Math.floor(Date.now() / 1000) + 3600;
        const token = `${btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))}.${btoa(JSON.stringify({ sub: userId, exp: expires, role: 'authenticated' }))}.test-signature`;
        win.localStorage.setItem(storageKey, JSON.stringify({ access_token: token, refresh_token: 'test-refresh', token_type: 'bearer', expires_in: 3600, expires_at: expires, user }));
      },
    });
  });
  cy.contains('.header-greeting', 'Maria Cruz', { timeout: 15000 }).should('exist');
  cy.get('.dashboard-loading').should('not.exist');
}

describe('user dashboard', () => {
  it('fetches gallery pictures and slides through them on cards and details on mobile', () => {
    cy.viewport(390, 844);
    openDashboard('explore');
    cy.contains('.destination-card', 'Naujan Lake').within(() => {
      cy.get('.photo-count').should('have.text', '1 / 2');
      cy.get('[aria-label="Next photo of Naujan Lake"]').click();
      cy.get('.photo-count').should('have.text', '2 / 2');
      cy.get('.photo-slide').eq(1).find('img').should('have.attr', 'src', '/test-spot-photos/lake-2.png');
      cy.get('.photo-slide').eq(1).find('img').should($img => { expect(($img[0] as HTMLImageElement).naturalWidth).to.be.greaterThan(0); });
      cy.contains('View details').click();
    });
    cy.location('pathname').should('eq', `/tourists/${spotId}`);
    cy.get('.page-shell > .photo-slider').within(() => {
      cy.get('.photo-count').should('have.text', '1 / 2');
      cy.get('.photo-track').scrollTo('right', { duration: 150 });
      cy.get('.photo-count').should('have.text', '2 / 2');
      cy.get('[aria-label="Previous photo of Naujan Lake"]').click();
      cy.get('.photo-count').should('have.text', '1 / 2');
    });
    cy.reload();
    cy.get('.photo-slide img').should('have.length', 2);
    cy.get('.photo-slide img').first().should($img => { expect(($img[0] as HTMLImageElement).naturalWidth).to.be.greaterThan(0); });
    cy.get('.photo-count').should('have.text', '1 / 2');
    cy.get('.page-shell').then($el => { expect($el[0].scrollWidth).to.be.at.most(390); });
    cy.screenshot('destination-gallery-mobile', { capture: 'viewport' });
  });

  it('shows the overview, searches destinations, and keeps bookmarks after reload', () => {
    cy.viewport(1280, 900);
    openDashboard();
    cy.contains('h1', 'Welcome, Maria Cruz.').should('be.visible');
    cy.get('.overview-stat').eq(0).should('contain.text', '2');
    cy.screenshot('dashboard-home-desktop', { capture: 'viewport' });
    cy.get('.dashboard-navigation').contains('Explore').click();
    cy.get('[aria-label="Search destinations"]').type('Bird watching');
    cy.get('.destination-card').should('have.length', 1).and('contain.text', 'Naujan Lake');
    cy.get('[aria-label="Save Naujan Lake"]').click();
    cy.get('[aria-label="Unsave Naujan Lake"]').should('have.attr', 'aria-pressed', 'true');
    cy.get('.dashboard-navigation').contains('Saved').click();
    cy.location('search').should('eq', '?tab=saved');
    cy.get('.destination-card').should('have.length', 1);
    cy.reload();
    cy.contains('.destination-card', 'Naujan Lake').should('be.visible');
    cy.get('[aria-label="Unsave Naujan Lake"]').click();
    cy.contains('Your next adventure starts with a save.').should('be.visible');
  });

  it('edits the profile, uploads a picture, switches theme, and logs out on mobile', () => {
    cy.viewport(390, 844);
    openDashboard('profile');
    cy.get('#profile-name').clear().type('Maria Santos');
    cy.get('#profile-username').clear().type('maria_santos');
    cy.contains('button', 'Save profile').click();
    // Native scrolling reaches Ionic's scroll container inside the shadow root.
    cy.contains('Your profile has been updated.').then($el => $el[0].scrollIntoView({ block: 'center' }));
    cy.contains('Your profile has been updated.').should('be.visible');
    cy.get('#profile-menu-trigger').should('contain.text', 'MS');
    cy.get('#profile-photo').selectFile('tests/e2e/fixtures/avatar.png', { force: true });
    cy.contains('button', 'Save picture').click();
    cy.contains('Profile picture saved.').then($el => $el[0].scrollIntoView({ block: 'center' }));
    cy.contains('Profile picture saved.').should('be.visible');
    cy.get('#profile-menu-trigger img').should('have.attr', 'src').and('include', 'token=fake');
    cy.get('#profile-menu-trigger img').should($img => { expect(($img[0] as HTMLImageElement).naturalWidth).to.be.greaterThan(0); });
    cy.get('[role="switch"]').click();
    cy.get('html').should('have.class', 'ion-palette-dark');
    cy.reload();
    cy.get('html').should('have.class', 'ion-palette-dark');
    cy.contains('.profile-summary', 'Maria Santos').should('be.visible');
    cy.get('#profile-menu-trigger img').should($img => { expect(($img[0] as HTMLImageElement).naturalWidth).to.be.greaterThan(0); });
    cy.get('.dashboard-shell').then($el => { expect($el[0].scrollWidth).to.be.at.most(390); });
    cy.screenshot('dashboard-profile-mobile-dark', { capture: 'viewport' });
    cy.get('#profile-menu-trigger').click();
    cy.get('ion-popover .profile-menu').should('be.visible').contains('Log out').click();
    cy.location('pathname').should('eq', '/login');
  });

  it('shows a failed bookmark save without falsely marking the spot saved', () => {
    openDashboard('explore');
    cy.intercept('POST', '**/rest/v1/saved_spots*', { statusCode: 403, body: { code: '42501', message: 'Save unavailable' } });
    cy.get('[aria-label="Save Naujan Lake"]').click();
    cy.get('[aria-label="Save Naujan Lake"]').should('have.attr', 'aria-pressed', 'false');
    cy.get('[role="alert"]').should('be.visible');
  });

  it('validates password confirmation and only clears fields after success', () => {
    openDashboard('profile');
    cy.get('#current-password').type('old-password');
    cy.get('#new-password').type('new-password');
    cy.get('#confirm-password').type('different-password');
    cy.contains('button', 'Update password').click();
    cy.contains('The new passwords do not match.').should('be.visible');
    cy.get('#new-password').should('have.value', 'new-password');
    cy.get('#confirm-password').clear().type('new-password');
    cy.contains('button', 'Update password').click();
    cy.contains('Your password has been updated.').should('be.visible');
    cy.get('#current-password').should('have.value', '');
    cy.get('#new-password').should('have.value', '');
  });

  it('loads a bookmark saved on the destination detail page when returning to the dashboard', () => {
    openDashboard('explore');
    cy.get('.destination-card').first().contains('View details').click();
    cy.location('pathname').should('eq', `/tourists/${spotId}`);
    cy.contains('ion-button', 'Save spot').click();
    cy.contains('ion-button', 'Saved spot').should('have.attr', 'aria-pressed', 'true');
    cy.get('ion-back-button').click();
    cy.location('pathname').should('eq', '/tourists');
    cy.get('.dashboard-navigation').contains('Saved').click();
    cy.location('search').should('eq', '?tab=saved');
    cy.get('.destination-card').should('have.length', 1).and('contain.text', 'Naujan Lake');
  });
});
