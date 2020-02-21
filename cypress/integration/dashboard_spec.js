describe('Viking Dashboard', function(){
    it('Opens up', function(){
        cy.visit('http://localhost:8080/dashboard');
        cy.get('a').contains('Posts').click();

        cy.url()
            .should('include', '/dashboard/posts');

        cy.get('a').contains('New Post').click();

        cy.url()
            .should('include', '/dashboard/posts/create');

        cy.get('a').contains('Dashboard').click();

            cy.url()
                .should('include', '/dashboard');

    });
})