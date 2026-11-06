#!/usr/bin/env python3
"""
ExpressBank ATM Simulator - Object-Oriented Banking Engine (OOP)
Demonstrates Core OOP Principles:
  1. Abstraction (Base Account class with abstract interfaces)
  2. Encapsulation (Private fields _balance, _pin_hash, _transactions with getters/setters)
  3. Inheritance (SavingsAccount and CheckingAccount inheriting from Account)
  4. Polymorphism (Overridden withdraw(), get_max_withdrawable(), and calculate_fee())
"""

import sys
import json
import hashlib
import random
from abc import ABC, abstractmethod
from datetime import datetime


class ATMException(Exception):
    """Base exception class for ATM domain errors."""
    pass


class InvalidCredentialsException(ATMException):
    """Raised when card number or PIN is invalid."""
    pass


class InsufficientFundsException(ATMException):
    """Raised when balance is inadequate for withdrawal."""
    pass


class MaintainingBalanceException(ATMException):
    """Raised when withdrawal violates maintaining balance requirements."""
    pass


class TransactionLimitException(ATMException):
    """Raised when an action exceeds ATM transaction ceilings."""
    pass


class Transaction:
    """Encapsulates a single ATM financial transaction ledger entry."""

    def __init__(self, tx_id: str, tx_type: str, amount: float, fee: float, balance_after: float):
        self._tx_id = tx_id
        self._tx_type = tx_type
        self._amount = amount
        self._fee = fee
        self._balance_after = balance_after
        self._timestamp = datetime.now().strftime("%Y-%m-%d %I:%M:%S %p")

    @property
    def tx_id(self) -> str:
        return self._tx_id

    @property
    def tx_type(self) -> str:
        return self._tx_type

    @property
    def amount(self) -> float:
        return self._amount

    @property
    def fee(self) -> float:
        return self._fee

    @property
    def balance_after(self) -> float:
        return self._balance_after

    @property
    def timestamp(self) -> str:
        return self._timestamp

    def to_dict(self) -> dict:
        return {
            "transaction_id": self._tx_id,
            "tx_type": self._tx_type,
            "amount": self._amount,
            "fee": self._fee,
            "balance_after": self._balance_after,
            "timestamp": self._timestamp
        }


class DebitCard:
    """Encapsulates debit card hardware metadata, chip data, and security validation."""

    def __init__(self, account_number: str, card_number: str, holder_name: str, pin: str, expiry: str = "12/28", cvv: str = "392"):
        self._account_number = account_number
        self._card_number = card_number
        self._holder_name = holder_name
        self._pin_hash = self._hash_pin(pin)
        self._raw_pin = pin  # Stored for terminal simulation peek
        self._expiry = expiry
        self._cvv = cvv
        self._is_active = True

    @staticmethod
    def _hash_pin(pin: str) -> str:
        return hashlib.sha256(pin.strip().encode("utf-8")).hexdigest()

    @property
    def account_number(self) -> str:
        return self._account_number

    @property
    def card_number(self) -> str:
        return self._card_number

    @property
    def masked_card_number(self) -> str:
        clean = self._card_number.replace("-", "")
        return f"•••• •••• •••• {clean[-4:] if len(clean) >= 4 else clean}"

    @property
    def masked_account_number(self) -> str:
        return f"••••••{self._account_number[-3:] if len(self._account_number) >= 3 else self._account_number}"

    @property
    def holder_name(self) -> str:
        return self._holder_name

    @property
    def expiry(self) -> str:
        return self._expiry

    @property
    def cvv(self) -> str:
        return self._cvv

    @property
    def pin_code(self) -> str:
        return self._raw_pin

    def verify_pin(self, entered_pin: str) -> bool:
        if not self._is_active:
            raise InvalidCredentialsException("Card has been deactivated.")
        return self._pin_hash == self._hash_pin(entered_pin)

    def to_dict(self) -> dict:
        return {
            "accountNumber": self._account_number,
            "cardNumber": self._card_number,
            "maskedCardNumber": self.masked_card_number,
            "maskedAccountNumber": self.masked_account_number,
            "holderName": self._holder_name,
            "pin": self._raw_pin,
            "expiry": self._expiry,
            "cvv": self._cvv
        }


class Account(ABC):
    """Abstract Base Class for Bank Accounts (Abstraction & Encapsulation)."""

    def __init__(self, account_number: str, holder_name: str, initial_balance: float = 0.0):
        self._account_number = account_number
        self._holder_name = holder_name
        self._balance = float(initial_balance)
        self._transactions: list[Transaction] = []

    @property
    def account_number(self) -> str:
        return self._account_number

    @property
    def masked_account_number(self) -> str:
        return f"••••••{self._account_number[-3:] if len(self._account_number) >= 3 else self._account_number}"

    @property
    def holder_name(self) -> str:
        return self._holder_name

    @property
    def balance(self) -> float:
        return self._balance

    @property
    def transactions(self) -> list[Transaction]:
        return list(self._transactions)

    @abstractmethod
    def get_account_type(self) -> str:
        pass

    @abstractmethod
    def get_maintaining_balance(self) -> float:
        pass

    @abstractmethod
    def calculate_withdrawal_fee(self, amount: float) -> float:
        pass

    @abstractmethod
    def get_max_withdrawal_limit(self) -> float:
        pass

    def get_max_withdrawable(self) -> float:
        limit = self.get_max_withdrawal_limit()
        available = self._balance - self.get_maintaining_balance()
        fee = self.calculate_withdrawal_fee(limit)
        max_possible = max(0.0, available - fee)
        return min(limit, max_possible)

    def deposit(self, amount: float, pocket_cash: float | None = None) -> Transaction:
        if amount <= 0:
            raise ATMException("Deposit amount must be greater than PHP 0.00.")
        if amount % 100 != 0:
            raise ATMException("Deposit bills must be in denominations of PHP 100, 500, or 1,000.")
        if pocket_cash is not None and amount > pocket_cash:
            raise InsufficientFundsException(
                f"Insufficient cash in pocket! You only have PHP {pocket_cash:,.2f} in your pocket to deposit."
            )

        self._balance += amount
        tx_id = f"DEP{random.randint(100000, 999999)}"
        tx = Transaction(tx_id, "Deposit", amount, 0.0, self._balance)
        self._transactions.insert(0, tx)
        return tx

    def withdraw(self, amount: float) -> Transaction:
        if amount <= 0:
            raise ATMException("Withdrawal amount must be greater than PHP 0.00.")
        if amount % 100 != 0:
            raise ATMException("ATM only dispenses PHP 100, 500, and 1,000 bills.")

        limit = self.get_max_withdrawal_limit()
        if amount > limit:
            raise TransactionLimitException(f"Withdrawal exceeds per-transaction limit of PHP {limit:,.2f}.")

        fee = self.calculate_withdrawal_fee(amount)
        total_deduction = amount + fee
        maintaining = self.get_maintaining_balance()

        if self._balance - total_deduction < maintaining:
            if maintaining > 0:
                raise MaintainingBalanceException(
                    f"Transaction declined: Must maintain minimum balance of PHP {maintaining:,.2f}. Available to withdraw: PHP {self.get_max_withdrawable():,.2f}."
                )
            else:
                raise InsufficientFundsException(
                    f"Insufficient funds: Balance is PHP {self._balance:,.2f}. Total needed: PHP {total_deduction:,.2f}."
                )

        self._balance -= total_deduction
        tx_id = f"WDL{random.randint(100000, 999999)}"
        tx = Transaction(tx_id, "Withdrawal", amount, fee, self._balance)
        self._transactions.insert(0, tx)
        return tx

    def to_dict(self) -> dict:
        return {
            "accountNumber": self._account_number,
            "maskedAccountNumber": self.masked_account_number,
            "holderName": self._holder_name,
            "balance": self._balance,
            "accountType": self.get_account_type(),
            "maintainingBalance": self.get_maintaining_balance(),
            "maxWithdrawable": self.get_max_withdrawable(),
            "transactions": [t.to_dict() for t in self._transactions]
        }


class SavingsAccount(Account):
    """Savings Account subclass (Inheritance & Polymorphism).
       Rules: Maintaining balance of PHP 500.00, Max withdrawal PHP 20,000.00, Free withdrawal.
    """

    def get_account_type(self) -> str:
        return "Savings Account"

    def get_maintaining_balance(self) -> float:
        return 500.00

    def calculate_withdrawal_fee(self, amount: float) -> float:
        return 0.00

    def get_max_withdrawal_limit(self) -> float:
        return 20000.00


class CheckingAccount(Account):
    """Checking Account subclass (Inheritance & Polymorphism).
       Rules: Maintaining balance PHP 0.00, Max withdrawal PHP 50,000.00, Fee PHP 15.00 per withdrawal.
    """

    def get_account_type(self) -> str:
        return "Checking Account"

    def get_maintaining_balance(self) -> float:
        return 0.00

    def calculate_withdrawal_fee(self, amount: float) -> float:
        return 15.00

    def get_max_withdrawal_limit(self) -> float:
        return 50000.00


class ATMDispenser:
    """Hardware cash dispenser simulator (OOP Hardware Abstraction)."""

    @staticmethod
    def breakdown_bills(amount: float) -> list[int]:
        """Calculates authentic Philippine banknote denomination breakdown (1000, 500, 100)."""
        bills = []
        rem = int(amount)
        while rem >= 1000:
            bills.append(1000)
            rem -= 1000
        while rem >= 500:
            bills.append(500)
            rem -= 500
        while rem >= 100:
            bills.append(100)
            rem -= 100
        return bills


class ATMTerminal:
    """Master ATM Controller (Orchestrator Pattern). Manages accounts, cards, and user sessions."""

    def __init__(self):
        self._cards: dict[str, DebitCard] = {}
        self._savings_accounts: dict[str, SavingsAccount] = {}
        self._checking_accounts: dict[str, CheckingAccount] = {}

        # Active Terminal Session state
        self._current_card: DebitCard | None = None
        self._selected_account_kind: str = "savings"  # 'savings' | 'checking'
        self._dispenser = ATMDispenser()

        # Seed initial accounts matching user project
        self._seed_default_accounts()

    def _seed_default_accounts(self):
        # 1. Hanz Dalmino (from user's original Brython app)
        self.register_account(
            name="Hanz Dalmino",
            account_number="100000248",
            pin="123456",
            savings_bal=18500.00,
            checking_bal=42000.00
        )
        # 2. Maria Santos (Default customer)
        self.register_account(
            name="Maria Santos",
            account_number="100000301",
            pin="112233",
            savings_bal=25000.00,
            checking_bal=15000.00
        )

    def register_account(self, name: str, account_number: str | None = None, pin: str | None = None, savings_bal: float = 12500.00, checking_bal: float = 25000.00) -> DebitCard:
        if not account_number:
            account_number = f"1000{random.randint(10000, 99999)}"
        if not pin:
            pin = f"{random.randint(100000, 999999)}"

        # Generate unique 16-digit debit card number (4 groups of 4 digits)
        tail = account_number[-5:] if len(account_number) >= 5 else account_number.zfill(5)
        mid = f"{random.randint(1000, 9999)}"
        card_num = f"5424-8901-{mid}-{tail}"

        card = DebitCard(account_number, card_num, name, pin)
        savings = SavingsAccount(account_number, name, savings_bal)
        checking = CheckingAccount(account_number, name, checking_bal)

        self._cards[account_number] = card
        self._savings_accounts[account_number] = savings
        self._checking_accounts[account_number] = checking

        return card

    def authenticate_card_login(self, account_number: str, pin: str) -> DebitCard:
        if account_number not in self._cards:
            raise InvalidCredentialsException("Card not recognized by terminal.")

        card = self._cards[account_number]
        if not card.verify_pin(pin):
            raise InvalidCredentialsException("Incorrect PIN code. Please try again.")

        self._current_card = card
        self._selected_account_kind = "savings"
        return card

    def select_account_kind(self, kind: str):
        if kind not in ("savings", "checking"):
            raise ATMException("Invalid account kind. Choose 'savings' or 'checking'.")
        self._selected_account_kind = kind

    @property
    def current_account(self) -> Account | None:
        if not self._current_card:
            return None
        acc_num = self._current_card.account_number
        if self._selected_account_kind == "savings":
            return self._savings_accounts.get(acc_num)
        return self._checking_accounts.get(acc_num)

    def withdraw(self, amount: float) -> tuple[Transaction, list[int]]:
        account = self.current_account
        if not account:
            raise ATMException("No active account selected.")
        tx = account.withdraw(amount)
        bills = self._dispenser.breakdown_bills(amount)
        return tx, bills

    def deposit(self, amount: float, pocket_cash: float | None = None) -> Transaction:
        account = self.current_account
        if not account:
            raise ATMException("No active account selected.")
        return account.deposit(amount, pocket_cash)

    def logout(self):
        self._current_card = None
        self._selected_account_kind = "savings"


# CLI Verification & OOP Self-Test
if __name__ == "__main__":
    print("=" * 60)
    print("  EXPRESSBANK ATM SIMULATOR - PYTHON OOP DEMONSTRATION")
    print("=" * 60)

    terminal = ATMTerminal()
    # Test registration
    new_card = terminal.register_account("Juan Dela Cruz", pin="889900")
    print(f"[OOP] Registered New Customer: {new_card.holder_name}")
    print(f"[OOP] Card Number: {new_card.card_number} (Masked: {new_card.masked_card_number})")
    print(f"[OOP] Account Number: {new_card.account_number}")

    # Test login authentication
    card = terminal.authenticate_card_login(new_card.account_number, "889900")
    print(f"[OOP] Logged in successfully with PIN: {card.holder_name}")

    # Test savings account withdrawal
    terminal.select_account_kind("savings")
    print(f"[OOP] Initial Savings Balance: PHP {terminal.current_account.balance:,.2f}")
    tx, bills = terminal.withdraw(1500)
    print(f"[OOP] Withdrew PHP 1,500.00. Fee: PHP {tx.fee:.2f}. New Balance: PHP {tx.balance_after:,.2f}")
    print(f"[OOP] Dispensed Banknotes: {bills}")

    # Test checking account with fee
    terminal.select_account_kind("checking")
    print(f"[OOP] Initial Checking Balance: PHP {terminal.current_account.balance:,.2f}")
    tx_chk, bills_chk = terminal.withdraw(2000)
    print(f"[OOP] Withdrew PHP 2,000.00 from Checking. Fee: PHP {tx_chk.fee:.2f}. New Balance: PHP {tx_chk.balance_after:,.2f}")

    print("=" * 60)
    print("  ALL PYTHON OOP TESTS COMPLETED SUCCESSFULLY!")
    print("=" * 60)
