import React, { useState, useMemo } from 'react';
import {
  ATMService,
  generateCardNumber,
} from './utils/atmLogic.js';
import { WalkingCutscene } from './components/WalkingCutscene.jsx';
import { AtmPovKiosk } from './components/AtmPovKiosk.jsx';
import { WalletView } from './components/WalletView.jsx';
import { AtmZoomedView } from './components/AtmZoomedView.jsx';
import { LeaveAtmCutscene } from './components/LeaveAtmCutscene.jsx';

export default function App() {
  // Initialize ATM service (OOP instance)
  const service = useMemo(() => new ATMService(), []);

  // Predefined default session card
  const initialDefaultCard = useMemo(
    () => ({
      accountNumber: '100000248',
      cardNumber: generateCardNumber('100000248'),
      holderName: 'Hanz Dalmino',
      pin: '123456',
      expiry: '12/28',
      cvv: '392',
    }),
    []
  );

  // Each user session has its own isolated wallet
  const [sessionCards, setSessionCards] = useState([initialDefaultCard]);
  const [activeCard, setActiveCard] = useState(initialDefaultCard);
  const [walletCash, setWalletCash] = useState(3600);

  // Check URL query parameters for testability (?autostart=1 or ?skip=1)
  const isAutostart = typeof window !== 'undefined' && (
    new URLSearchParams(window.location.search).get('autostart') === '1' ||
    new URLSearchParams(window.location.search).get('skip') === '1'
  );

  const [simulatorState, setSimulatorState] = useState(
    isAutostart ? 'pov_standing' : 'walking'
  );

  // Register custom user account for THIS distinct session
  const handleRegisterAccount = (name, customPin) => {
    const profile = service.registerCustomAccount(name, undefined, customPin);
    // Distinct session: only this user's card exists in their personal wallet!
    setSessionCards([profile]);
    setActiveCard(profile);
    setWalletCash(3600);
    return profile;
  };

  const handleArriveAtAtm = (profile) => {
    setActiveCard(profile);
    setSimulatorState('pov_standing');
  };

  const handleInteractUseCard = () => {
    setSimulatorState('atm_zoomed');
  };

  const handleOpenWallet = () => {
    setSimulatorState('wallet_modal');
  };

  const handleCloseWallet = () => {
    setSimulatorState('pov_standing');
  };

  const handleSelectCard = (card) => {
    setActiveCard(card);
  };

  const handleInsertCardDirectly = (card) => {
    setActiveCard(card);
    setSimulatorState('atm_zoomed');
  };

  const handleExitAtmToPov = () => {
    setSimulatorState('pov_standing');
  };

  const handleLeaveAtm = () => {
    setSimulatorState('leaving');
  };

  const handleReturnToAtm = () => {
    setSimulatorState('pov_standing');
  };

  const [walkSessionKey, setWalkSessionKey] = useState(0);

  const handleStartNewWalk = () => {
    setSessionCards([initialDefaultCard]);
    setActiveCard(initialDefaultCard);
    setWalletCash(3600);
    setDispensedCash(null);
    setWalkSessionKey((prev) => prev + 1);
    setSimulatorState('walking');
  };

  const handleAddCashToWallet = (amount) => {
    setWalletCash((prev) => prev + amount);
  };

  const handleSubtractCashFromWallet = (amount) => {
    setWalletCash((prev) => Math.max(0, prev - amount));
  };

  // State for cash sitting in physical dispenser slot across zoomed & POV views
  const [dispensedCash, setDispensedCash] = useState(null);

  const handleCashDispensed = (amount) => {
    setDispensedCash((prev) => {
      const currentAmt = (prev && prev.isDispensed) ? prev.amount : 0;
      return {
        amount: currentAmt + amount,
        isDispensed: true,
      };
    });
  };

  const handleTakeDispensedCash = () => {
    if (dispensedCash && dispensedCash.isDispensed) {
      const amt = dispensedCash.amount;
      setWalletCash((prev) => prev + amt);
      setDispensedCash(null);
      return amt;
    }
    return 0;
  };

  return (
    <div className="w-full h-full min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none overflow-x-hidden">
      {/* SCENE 1: WALKING CUTSCENE */}
      {simulatorState === 'walking' && (
        <WalkingCutscene
          key={walkSessionKey}
          onArriveAtAtm={handleArriveAtAtm}
          onRegisterAccount={handleRegisterAccount}
        />
      )}

      {/* SCENE 2: POV STANDING AT ATM (Matching the provided photo) */}
      {simulatorState === 'pov_standing' && (
        <AtmPovKiosk
          activeProfile={activeCard}
          onInteractUseCard={handleInteractUseCard}
          onOpenWallet={handleOpenWallet}
          onLeaveAtm={handleLeaveAtm}
          onStartNewWalk={handleStartNewWalk}
          dispensedCash={dispensedCash}
          onTakeDispensedCash={handleTakeDispensedCash}
        />
      )}

      {/* SCENE 3: WALLET MODAL VIEW */}
      {simulatorState === 'wallet_modal' && (
        <>
          {/* Keep POV behind modal */}
          <AtmPovKiosk
            activeProfile={activeCard}
            onInteractUseCard={handleInteractUseCard}
            onOpenWallet={handleOpenWallet}
            onLeaveAtm={handleLeaveAtm}
            onStartNewWalk={handleStartNewWalk}
            dispensedCash={dispensedCash}
            onTakeDispensedCash={handleTakeDispensedCash}
          />
          <WalletView
            availableCards={sessionCards}
            activeCard={activeCard}
            walletCash={walletCash}
            onSelectCard={handleSelectCard}
            onInsertCardDirectly={handleInsertCardDirectly}
            onCloseWallet={handleCloseWallet}
          />
        </>
      )}

      {/* SCENE 4: ATM ZOOMED IN (Full ExpressBank ATM Software) */}
      {simulatorState === 'atm_zoomed' && (
        <AtmZoomedView
          service={service}
          insertedCard={activeCard}
          walletCash={walletCash}
          onSubtractCashFromWallet={handleSubtractCashFromWallet}
          onExitAtm={handleExitAtmToPov}
          onAddCashToWallet={handleAddCashToWallet}
          dispensedCash={dispensedCash}
          onCashDispensed={handleCashDispensed}
          onTakeDispensedCash={handleTakeDispensedCash}
        />
      )}

      {/* SCENE 5: LEAVING ATM */}
      {simulatorState === 'leaving' && (
        <LeaveAtmCutscene
          activeProfile={activeCard}
          onReturnToAtm={handleReturnToAtm}
          onStartNewWalk={handleStartNewWalk}
          onOpenWallet={handleOpenWallet}
        />
      )}
    </div>
  );
}
