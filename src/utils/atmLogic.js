/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ExpressBank ATM Simulator - JavaScript Object-Oriented Architecture (OOP)
 * Mirrors the Python OOP architecture:
 *   - Abstraction & Encapsulation
 *   - Inheritance (SavingsAccount and CheckingAccount extending Account)
 *   - Polymorphism (Overriding withdraw, getMaintainingBalance, and getWithdrawalFee)
 */

export class ATMTransactionError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ATMTransactionError';
  }
}

/**
 * Format currency to Philippine Peso standard (e.g. PHP 1,234.56)
 */
export function formatPHP(amount) {
  return `PHP ${Number(amount || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Mask account number for security (e.g. ••••••248)
 */
export function maskAccountNumber(acc) {
  const s = String(acc || '');
  if (s.length <= 3) return s;
  return '••••••' + s.slice(-3);
}

/**
 * Generate a realistic 16-digit debit card number based on an account number
 */
export function generateCardNumber(accountNumber) {
  const seed = String(accountNumber || '100000248');
  const tail = seed.slice(-5).padStart(5, '0');
  const mid = '4892';
  return `5424-8901-${mid}-${tail}`;
}

/**
 * Transaction Object
 */
export class Transaction {
  constructor(txId, txType, amount, fee, balanceAfter) {
    this.transaction_id = txId;
    this.tx_type = txType;
    this.amount = Number(amount);
    this.fee = Number(fee || 0);
    this.balance_after = Number(balanceAfter);
    this.timestamp = new Date().toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'medium',
    });
  }
}

/**
 * Base Account Class (Abstraction & Encapsulation)
 */
export class Account {
  constructor(accountNumber, holderName, initialBalance = 0) {
    this._accountNumber = String(accountNumber);
    this._holderName = holderName;
    this._balance = Number(initialBalance);
    this._transactions = [];
  }

  get accountNumber() {
    return this._accountNumber;
  }

  get maskedAccountNumber() {
    return maskAccountNumber(this._accountNumber);
  }

  get holderName() {
    return this._holderName;
  }

  get balance() {
    return this._balance;
  }

  get transactions() {
    return [...this._transactions];
  }

  get accountType() {
    return 'General Account';
  }

  get maintainingBalance() {
    return 0;
  }

  get withdrawalFee() {
    return 0;
  }

  get maxWithdrawalPerTx() {
    return 20000;
  }

  getMaxWithdrawable() {
    const available = this._balance - this.maintainingBalance;
    const maxPossible = Math.max(0, available - this.withdrawalFee);
    return Math.min(this.maxWithdrawalPerTx, maxPossible);
  }

  deposit(amount, pocketCash = null) {
    const num = Number(amount);
    if (isNaN(num) || num <= 0) {
      throw new ATMTransactionError('Deposit amount must be a positive number.');
    }
    if (num % 100 !== 0) {
      throw new ATMTransactionError('Deposit must be in denominations of PHP 100, 500, or 1,000.');
    }
    if (pocketCash !== null && pocketCash !== undefined && num > Number(pocketCash)) {
      throw new ATMTransactionError(
        `Insufficient cash in pocket! You only have ${formatPHP(pocketCash)} in your pocket to deposit.`
      );
    }

    this._balance += num;
    const tx = new Transaction(
      `DEP${Math.floor(100000 + Math.random() * 900000)}`,
      'Deposit',
      num,
      0,
      this._balance
    );
    this._transactions.unshift(tx);
    return tx;
  }

  withdraw(amount) {
    const num = Number(amount);
    if (isNaN(num) || num <= 0) {
      throw new ATMTransactionError('Withdrawal amount must be a positive number.');
    }
    if (num % 100 !== 0) {
      throw new ATMTransactionError('ATM only dispenses PHP 100, 500, and 1,000 bills.');
    }
    if (num > this.maxWithdrawalPerTx) {
      throw new ATMTransactionError(
        `Withdrawal exceeds per-transaction limit of ${formatPHP(this.maxWithdrawalPerTx)}.`
      );
    }

    const totalDeduction = num + this.withdrawalFee;
    if (this._balance - totalDeduction < this.maintainingBalance) {
      if (this.maintainingBalance > 0) {
        throw new ATMTransactionError(
          `Transaction declined: Must maintain minimum balance of ${formatPHP(
            this.maintainingBalance
          )}. Available to withdraw: ${formatPHP(this.getMaxWithdrawable())}.`
        );
      } else {
        throw new ATMTransactionError(
          `Insufficient funds: Current balance is ${formatPHP(
            this._balance
          )}. Total needed (including fee): ${formatPHP(totalDeduction)}.`
        );
      }
    }

    this._balance -= totalDeduction;
    const tx = new Transaction(
      `WDL${Math.floor(100000 + Math.random() * 900000)}`,
      'Withdrawal',
      num,
      this.withdrawalFee,
      this._balance
    );
    this._transactions.unshift(tx);
    return tx;
  }
}

/**
 * SavingsAccount Subclass (Inheritance & Polymorphism)
 * Maintaining Balance: PHP 500.00
 * Max Withdrawal: PHP 20,000.00
 * Fee: FREE (PHP 0.00)
 */
export class SavingsAccount extends Account {
  get accountType() {
    return 'Savings Account';
  }

  get maintainingBalance() {
    return 500;
  }

  get withdrawalFee() {
    return 0;
  }

  get maxWithdrawalPerTx() {
    return 20000;
  }
}

/**
 * CheckingAccount Subclass (Inheritance & Polymorphism)
 * Maintaining Balance: PHP 0.00
 * Max Withdrawal: PHP 50,000.00
 * Fee: PHP 15.00
 */
export class CheckingAccount extends Account {
  get accountType() {
    return 'Checking Account';
  }

  get maintainingBalance() {
    return 0;
  }

  get withdrawalFee() {
    return 15;
  }

  get maxWithdrawalPerTx() {
    return 50000;
  }
}

/**
 * DebitCard Class
 */
export class DebitCard {
  constructor(accountNumber, cardNumber, holderName, pin, expiry = '12/28', cvv = '392') {
    this.accountNumber = String(accountNumber);
    this.cardNumber = cardNumber;
    this.holderName = holderName;
    this.pin = String(pin).trim();
    this.expiry = expiry;
    this.cvv = cvv;
  }

  verifyPin(enteredPin) {
    return this.pin === String(enteredPin).trim();
  }
}

/**
 * ATMService (Master OOP Banking Controller)
 */
export class ATMService {
  constructor() {
    this._cards = new Map();
    this._savingsAccounts = new Map();
    this._checkingAccounts = new Map();

    this._loggedInCardNumber = null;
    this._selectedAccountKind = 'savings'; // 'savings' | 'checking'

    this._seedInitialAccounts();
  }

  _seedInitialAccounts() {
    // Default account from user project: Hanz Dalmino
    this.registerCustomAccount('Hanz Dalmino', '100000248', '123456', 18500, 42000);
    // Secondary preset account: Maria Santos
    this.registerCustomAccount('Maria Santos', '100000301', '112233', 25000, 15000);
  }

  registerCustomAccount(
    name,
    customAccountNumber,
    customPin,
    savingsBal = 12500,
    checkingBal = 25000
  ) {
    const accNum = customAccountNumber || `1000${Math.floor(10000 + Math.random() * 90000)}`;
    const pin = customPin ? String(customPin).trim() : `${Math.floor(100000 + Math.random() * 900000)}`;
    const cardNum = generateCardNumber(accNum);

    const card = new DebitCard(accNum, cardNum, name, pin);
    const savings = new SavingsAccount(accNum, name, savingsBal);
    const checking = new CheckingAccount(accNum, name, checkingBal);

    this._cards.set(accNum, card);
    this._savingsAccounts.set(accNum, savings);
    this._checkingAccounts.set(accNum, checking);

    return {
      accountNumber: card.accountNumber,
      cardNumber: card.cardNumber,
      holderName: card.holderName,
      pin: card.pin,
      expiry: card.expiry,
      cvv: card.cvv,
      isCustomUser: true,
    };
  }

  getCardProfile(accountNumber) {
    return this._cards.get(String(accountNumber)) || null;
  }

  loginWithCard(accountNumber, pin) {
    const card = this._cards.get(String(accountNumber));
    if (!card) {
      throw new ATMTransactionError('Card record not recognized by the terminal.');
    }
    if (!card.verifyPin(pin)) {
      throw new ATMTransactionError('Invalid PIN code. Please enter the correct PIN.');
    }

    this._loggedInCardNumber = card.accountNumber;
    this._selectedAccountKind = 'savings';
    return card;
  }

  logout() {
    this._loggedInCardNumber = null;
    this._selectedAccountKind = 'savings';
  }

  get loggedInCard() {
    return this._loggedInCardNumber;
  }

  selectAccountType(kind) {
    if (kind !== 'savings' && kind !== 'checking') {
      throw new ATMTransactionError("Account type must be 'savings' or 'checking'.");
    }
    this._selectedAccountKind = kind;
  }

  get currentAccount() {
    if (!this._loggedInCardNumber) return null;
    if (this._selectedAccountKind === 'savings') {
      return this._savingsAccounts.get(this._loggedInCardNumber) || null;
    }
    return this._checkingAccounts.get(this._loggedInCardNumber) || null;
  }

  performWithdrawal(amount) {
    const acc = this.currentAccount;
    if (!acc) {
      throw new ATMTransactionError('No active account selected.');
    }
    return acc.withdraw(amount);
  }

  performDeposit(amount, pocketCash = null) {
    const acc = this.currentAccount;
    if (!acc) {
      throw new ATMTransactionError('No active account selected.');
    }
    return acc.deposit(amount, pocketCash);
  }
}
