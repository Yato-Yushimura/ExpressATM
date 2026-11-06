import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SavingsAccount,
  CheckingAccount,
  ATMService,
  formatPHP,
  maskAccountNumber,
  generateCardNumber,
  ATMTransactionError,
} from './atmLogic.js';

test('maskAccountNumber masks correctly keeping last 3 digits', () => {
  assert.equal(maskAccountNumber('100000248'), '••••••248');
  assert.equal(maskAccountNumber('123'), '123');
});

test('formatPHP formats currency with PHP symbol and 2 decimals', () => {
  assert.equal(formatPHP(1500), 'PHP 1,500.00');
  assert.equal(formatPHP(0), 'PHP 0.00');
});

test('card and pin generators produce valid formats', () => {
  const cardNum = generateCardNumber('100000248');
  assert.match(cardNum, /^5424-8901-\d{4}-\d{5}$/);
});

test('SavingsAccount enforces maintaining balance and withdrawal limits', () => {
  const sa = new SavingsAccount('100000248', 'Test User', 1000);
  assert.equal(sa.maintainingBalance, 500);
  assert.equal(sa.withdrawalFee, 0);
  assert.equal(sa.getMaxWithdrawable(), 500);

  // Withdraw 500 succeeds
  const tx = sa.withdraw(500);
  assert.equal(tx.amount, 500);
  assert.equal(sa.balance, 500);

  // Withdraw below maintaining balance throws
  assert.throws(() => {
    sa.withdraw(100);
  }, ATMTransactionError);
});

test('CheckingAccount applies withdrawal fee and limits', () => {
  const ca = new CheckingAccount('100000248', 'Test User', 5000);
  assert.equal(ca.withdrawalFee, 15);
  assert.equal(ca.maintainingBalance, 0);

  const tx = ca.withdraw(1000);
  assert.equal(tx.amount, 1000);
  assert.equal(tx.fee, 15);
  assert.equal(ca.balance, 3985);
});

test('ATMService user registration, login, and transactions', () => {
  const service = new ATMService();
  const card = service.registerCustomAccount('Pedro Penduko', '100000999', '654321', 5000, 10000);

  assert.equal(card.holderName, 'Pedro Penduko');
  assert.equal(card.pin, '654321');

  // Login succeeds with correct pin
  const loggedInCard = service.loginWithCard('100000999', '654321');
  assert.equal(loggedInCard.accountNumber, '100000999');

  // Withdrawal on Savings
  service.selectAccountType('savings');
  const tx = service.performWithdrawal(1000);
  assert.equal(tx.amount, 1000);
  assert.equal(service.currentAccount.balance, 4000);
});

test('Deposit enforces pocket cash limit on both Savings and Checking accounts', () => {
  const service = new ATMService();
  service.registerCustomAccount('Juan Test', '100000777', '123456', 5000, 10000);
  service.loginWithCard('100000777', '123456');

  // Test Savings Account deposit with limited pocket cash (₱1,500)
  service.selectAccountType('savings');
  assert.throws(() => {
    service.performDeposit(2000, 1500); // Exceeds pocket cash of 1500
  }, /Insufficient cash in pocket/);

  // Valid deposit of ₱1,000 succeeds
  const txSavings = service.performDeposit(1000, 1500);
  assert.equal(txSavings.amount, 1000);
  assert.equal(service.currentAccount.balance, 6000);

  // Test Checking Account deposit with limited pocket cash (₱500)
  service.selectAccountType('checking');
  assert.throws(() => {
    service.performDeposit(1000, 500); // Exceeds pocket cash of 500
  }, /Insufficient cash in pocket/);

  // Valid deposit of ₱500 succeeds
  const txChecking = service.performDeposit(500, 500);
  assert.equal(txChecking.amount, 500);
  assert.equal(service.currentAccount.balance, 10500);
});

test('Multiple withdrawals stack dispensed cash without erasing prior withdrawals', () => {
  const service = new ATMService();
  service.registerCustomAccount('Stack Tester', '100000888', '123456', 20000, 20000);
  service.loginWithCard('100000888', '123456');
  service.selectAccountType('savings');

  let dispensedCash = null;
  const dispense = (amt) => {
    dispensedCash = {
      amount: ((dispensedCash && dispensedCash.isDispensed) ? dispensedCash.amount : 0) + amt,
      isDispensed: true,
    };
  };

  // 1st withdrawal: 1,000
  const tx1 = service.performWithdrawal(1000);
  dispense(tx1.amount);
  assert.equal(dispensedCash.amount, 1000);

  // 2nd withdrawal: 500 without taking the 1st
  const tx2 = service.performWithdrawal(500);
  dispense(tx2.amount);
  assert.equal(dispensedCash.amount, 1500); // STACKED!

  // 3rd withdrawal: 2,000
  const tx3 = service.performWithdrawal(2000);
  dispense(tx3.amount);
  assert.equal(dispensedCash.amount, 3500); // STACKED!

  // Collect cash
  const collected = dispensedCash.amount;
  dispensedCash = null;
  assert.equal(collected, 3500);
  assert.equal(service.currentAccount.balance, 16500);
});


