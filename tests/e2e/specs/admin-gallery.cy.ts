describe('merged admin layout and photo galleries', () => {
  it('searches destinations and saves gallery edits from the modal', () => {
    cy.viewport(1280, 900);
    const userId = '11111111-1111-4111-8111-111111111111';
    const spotId = '22222222-2222-4222-8222-222222222222';
    const user = { id: userId, aud: 'authenticated', role: 'authenticated', email: 'admin@example.com', app_metadata: { provider: 'email' }, user_metadata: {}, created_at: '2026-01-01T00:00:00Z' };
    let spot = { id: spotId, name: 'Naujan Lake', category: 'Nature', description: 'A lakeside destination.', address: 'Naujan, Oriental Mindoro',
      latitude: null, longitude: null, image_url: '/test-spot-photos/one.png', image_urls: ['/test-spot-photos/one.png', '/test-spot-photos/two.png'],
      entrance_fee: null, opening_hours: null, best_time_to_visit: null, bucket_list: [], created_by: userId, created_at: '2026-01-01T00:00:00Z' };
    // This test never signs into or writes to the hosted Supabase project.
    cy.intercept('**/auth/v1/**', user);
    cy.intercept('GET', '**/rest/v1/profiles*', { id: userId, username: 'admin_test', role: 'admin' });
    cy.intercept('GET', '**/rest/v1/tourist_spots*', req => req.reply([spot]));
    cy.intercept('PATCH', '**/rest/v1/tourist_spots*', req => {
      expect(req.body.image_urls).to.have.length(2);
      expect(req.body.image_url).to.equal(req.body.image_urls[0]);
      expect(req.body.image_urls[0]).to.contain('/storage/v1/object/public/tourist-images/spots/');
      expect(req.body.image_urls[1]).to.equal('/test-spot-photos/two.png');
      spot = { ...spot, ...req.body };
      req.reply({ id: spotId });
    }).as('saveGallery');
    cy.intercept('GET', '**/rest/v1/nearby_places*', []);
    cy.intercept('DELETE', '**/rest/v1/nearby_places*', { statusCode: 204 });
    cy.intercept('POST', '**/storage/v1/object/tourist-images/**', { Key: 'tourist-images/test.png', Id: 'upload-1' });
    cy.intercept('GET', '**/test-spot-photos/*', { headers: { 'content-type': 'image/png' }, fixture: 'avatar.png' });
    cy.intercept('GET', '**/storage/v1/object/public/tourist-images/**', { headers: { 'content-type': 'image/png' }, fixture: 'avatar.png' });

    cy.readFile('.env', { log: false }).then((env: string) => {
      const url = /^VITE_SUPABASE_URL\s*=\s*["']?([^\r\n"']+)/m.exec(env)?.[1]?.trim();
      if (!url) throw new Error('VITE_SUPABASE_URL is needed to identify the fixture session key.');
      const storageKey = `sb-${new URL(url).hostname.split('.')[0]}-auth-token`;
      cy.visit('/admin', { onBeforeLoad(win) {
        win.localStorage.clear();
        win.localStorage.setItem('lakbaynaujan-theme', 'light');
        const expires = Math.floor(Date.now() / 1000) + 3600;
        const token = `${btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))}.${btoa(JSON.stringify({ sub: userId, exp: expires, role: 'authenticated' }))}.test-signature`;
        win.localStorage.setItem(storageKey, JSON.stringify({ access_token: token, refresh_token: 'test-refresh', token_type: 'bearer', expires_in: 3600, expires_at: expires, user }));
      } });
    });

    cy.contains('h1', 'Tourism & Destinations Management').should('be.visible');
    cy.contains('tbody tr', 'Naujan Lake').should('contain.text', '2 saved photos');
    cy.get('[aria-label="Search destinations"] input').type('no matching spot');
    cy.get('tbody').should('not.contain.text', 'Naujan Lake');
    cy.get('[aria-label="Search destinations"] input').clear().type('lake');
    cy.contains('tbody tr', 'Naujan Lake').contains('ion-button', 'Edit').click();
    cy.get('ion-modal').should('be.visible').within(() => {
      cy.get('.photo-draft').should('have.length', 2);
      cy.get('[aria-label="Remove photo 1"]').click();
      cy.get('#spot-photos').selectFile('tests/e2e/fixtures/avatar.png');
      cy.get('.photo-draft').should('have.length', 2);
      cy.get('[aria-label="Move photo 2 earlier"]').click();
      cy.contains('ion-button', 'Save changes').then($el => $el[0].scrollIntoView({ block: 'center' }));
      cy.contains('ion-button', 'Save changes').click();
    });
    cy.wait('@saveGallery');
    cy.get('ion-modal').should('not.be.visible');
    cy.contains('Tourist spot saved successfully.').should('be.visible');
    cy.reload();
    cy.contains('tbody tr', 'Naujan Lake').should('contain.text', '2 saved photos').contains('ion-button', 'Edit').click();
    cy.get('ion-modal').within(() => {
      cy.get('.photo-draft').should('have.length', 2);
      cy.get('.photo-draft img').first().should('have.attr', 'src').and('contain', '/tourist-images/spots/');
      cy.get('.modal-x-close-btn').click();
    });
    cy.get('ion-modal').should('not.be.visible');
    cy.get('.add-spot-btn').click();
    cy.get('ion-modal').should('be.visible').within(() => {
      cy.get('.photo-draft').should('not.exist');
      cy.get('ion-input').first().should('have.prop', 'value', '');
    });
  });
});
