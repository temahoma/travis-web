import { test } from 'qunit';
import moduleForAcceptance from 'travis/tests/helpers/module-for-acceptance';
import profilePage from 'travis/tests/pages/profile';
import signInUser from 'travis/tests/helpers/sign-in-user';

moduleForAcceptance('Acceptance | profile/billing', {
  beforeEach() {
    this.user = server.create('user', {
      name: 'User Name of exceeding length',
      login: 'user-login',
      github_id: 1974,
      avatar_url: 'http://example.com/jorty'
    });

    signInUser(this.user);

    let plan = server.create('plan', {
      name: 'Small Business Plan',
      builds: 5,
      annual: false,
      currency: 'USD',
      price: 6900
    });
    this.plan = plan;

    server.create('plan', { id: 'travis-ci-one-build', name: 'AM', builds: 1, price: 6900, currency: 'USD' });
    server.create('plan', { id: 'travis-ci-two-builds', name: 'BM', builds: 2, price: 12900, currency: 'USD' });
    server.create('plan', { id: 'travis-ci-five-builds', name: 'CM', builds: 5, price: 24900, currency: 'USD' });
    server.create('plan', { id: 'travis-ci-ten-builds', name: 'DM', builds: 10, price: 48900, currency: 'USD' });

    server.create('plan', { id: 'travis-ci-one-build-annual', name: 'AA', builds: 1, price: 75900, currency: 'USD', annual: true });
    server.create('plan', { id: 'travis-ci-two-builds-annual', name: 'BA', builds: 2, price: 141900, currency: 'USD', annual: true });
    server.create('plan', { id: 'travis-ci-five-builds-annual', name: 'CA', builds: 5, price: 273900, currency: 'USD', annual: true });
    server.create('plan', { id: 'travis-ci-ten-builds-annual', name: 'DA', builds: 10, price: 537900, currency: 'USD', annual: true });

    let subscription = server.create('subscription', {
      plan,
      owner: this.user,
      status: 'subscribed',
      valid_to: new Date(),
      source: 'stripe'
    });
    this.subscription = subscription;

    subscription.createBillingInfo({
      first_name: 'User',
      last_name: 'Name',
      company: 'Travis CI GmbH',
      address: 'Rigaerstraße 8',
      address2: 'Address 2',
      city: 'Berlin',
      state: 'Berlin',
      zip_code: '10987',
      country: 'Germany',
      vat_id: '12345'
    });

    subscription.createCreditCardInfo({
      last_digits: '1919'
    });

    subscription.createInvoice({
      id: '1919',
      created_at: new Date(1919, 4, 15),
      url: 'https://example.com/1919.pdf'
    });

    subscription.createInvoice({
      id: '2010',
      created_at: new Date(2010, 1, 14),
      url: 'https://example.com/2010.pdf'
    });

    // create organization
    let organization = server.create('organization', {
      name: 'Org Name',
      type: 'organization',
      login: 'org-login'
    });
    this.organization = organization;
  }
});

test('view billing information', function (assert) {
  profilePage.visit({ username: 'user-login' });
  profilePage.billing.visit();

  andThen(() => {
    percySnapshot(assert);

    assert.equal(profilePage.billing.plan.name, 'Small Business Plan');
    assert.equal(profilePage.billing.plan.concurrency, '5 concurrent builds');

    assert.equal(profilePage.billing.address.text, 'User Name Travis CI GmbH Rigaerstraße 8 Address 2 Berlin, Berlin 10987 Germany VAT: 12345');
    assert.equal(profilePage.billing.source, 'This plan is paid through Stripe.');
    assert.equal(profilePage.billing.creditCardNumber.text, '•••• •••• •••• 1919');
    assert.equal(profilePage.billing.price.text, '$69 per month');

    assert.ok(profilePage.billing.annualInvitation.isVisible, 'expected the invitation to switch to annual billing to be visible');

    assert.equal(profilePage.billing.invoices.length, 2);

    profilePage.billing.invoices[1].as(i1919 => {
      assert.equal(i1919.text, '1919 May 1919');
      assert.equal(i1919.href, 'https://example.com/1919.pdf');
    });

    assert.equal(profilePage.billing.invoices[0].text, '2010 February 2010');
  });
});

test('view billing on a manual plan', function (assert) {
  this.subscription.source = 'manual';

  profilePage.visit({ username: 'user-login'});
  profilePage.billing.visit();

  andThen(() => {
    assert.ok(profilePage.billing.plan.isHidden);
    assert.ok(profilePage.billing.address.isHidden);
    assert.ok(profilePage.billing.creditCardNumber.isHidden);
    assert.ok(profilePage.billing.price.isHidden);
    assert.equal(profilePage.billing.source, 'This is a manual subscription.');
    assert.ok(profilePage.billing.annualInvitation.isHidden);
  });
});

test('view billing on a marketplace plan', function (assert) {
  this.subscription.source = 'github';

  profilePage.visit({ username: 'user-login'});
  profilePage.billing.visit();

  andThen(() => {
    assert.ok(profilePage.billing.address.isHidden);
    assert.ok(profilePage.billing.creditCardNumber.isHidden);
    assert.equal(profilePage.billing.source, 'This subscription is managed by GitHub Marketplace.');
    assert.ok(profilePage.billing.annualInvitation.isHidden);
  });
});

test('view billing on an annual plan', function (assert) {
  this.plan.annual = true;
  this.plan.price = 10000;

  profilePage.visit({ username: 'user-login'});
  profilePage.billing.visit();

  andThen(() => {
    assert.equal(profilePage.billing.price.text, '$100 per year');
    assert.ok(profilePage.billing.annualInvitation.isHidden, 'expected the invitation to switch to annual billing to be hidden');
  });
});

test('view billing tab when there is no subscription', function (assert) {
  profilePage.visit({ username: 'org-login' });
  profilePage.billing.visit();

  andThen(() => {
    percySnapshot(assert);
    assert.dom('[data-test-no-subscription]').hasText('no subscription found');
  });
});

test('switching to another account’s billing tab loads the subscription properly', function (assert) {
  profilePage.visit({ username: 'user-login' });
  profilePage.billing.visit();
  profilePage.accounts[1].visit();

  andThen(() => {
    assert.dom('[data-test-no-subscription]').hasText('no subscription found');
  });
});
