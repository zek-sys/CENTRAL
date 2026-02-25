/**
 * CENTRAL REGATÃO V2.2 - CASCO MODULAR (REFIT)
 * Foco: Hubs, Sidebar + BottomNav, Login Google, Folha de Rosto, useFinanceiro, Trava IN 29.
 */

import React, { useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from 'firebase/auth';
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  Timestamp,
} from 'firebase/firestore';

import { auth, db, appId, checkInNoPorto } from './core/firebase';
import AprovacaoDemandas from './components/AprovacaoDemandas';
import MotorDesign from './components/MotorDesign';
import Sidebar from './components/layout/Sidebar';
import BottomNav from './components/layout/BottomNav';
import BadgeStatus from './components/layout/BadgeStatus';
import LoginHub from './hubs/LoginHub';
import MeuConvesHub from './hubs/MeuConvesHub';
import BussolaHub from './hubs/BussolaHub';
import ProjetosHub from './hubs/ProjetosHub';
import FinanceiroHub from './hubs/FinanceiroHub';
import MapaCulturalHub from './hubs/MapaCulturalHub';

export default function App() {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('meu_conves');
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [hasCheckedIn, setHasCheckedIn] = useState(false);

  const [eixos, setEixos] = useState([]);
  const [programas, setProgramas] = useState([]);
  const [projetos, setProjetos] = useState([]);
  const [acoes, setAcoes] = useState([]);
  const [kpis, setKpis] = useState([]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) {
        setUser(null);
        setUserProfile(null);
        setHasCheckedIn(false);
        setLoading(false);
        return;
      }

      setUser(u);
      const userRef = doc(
        db,
        'artifacts',
        appId,
        'public',
        'data',
        'usuarios',
        u.uid,
      );

      return onSnapshot(userRef, (snap) => {
        if (snap.exists()) {
          setUserProfile({ uid: u.uid, ...snap.data() });
        } else {
          const defaultProfile = {
            uid: u.uid,
            nome: u.displayName || u.email?.split('@')[0],
            nucleo: 'Estratégico',
            role: 'user',
            email: u.email || null,
            createdAt: Timestamp.now(),
          };
          setDoc(userRef, defaultProfile).catch(() => {});
          setUserProfile(defaultProfile);
        }
        setLoading(false);
      });
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user || hasCheckedIn) return;
    checkInNoPorto(user).finally(() => setHasCheckedIn(true));
  }, [user, hasCheckedIn]);

  useEffect(() => {
    if (!user) return;
    const path = (c) => collection(db, 'artifacts', appId, 'public', 'data', c);
    const unsubs = [
      onSnapshot(query(path('eixos')), (s) =>
        setEixos(s.docs.map((d) => ({ id: d.id, ...d.data() }))),
      ),
      onSnapshot(query(path('programas')), (s) =>
        setProgramas(s.docs.map((d) => ({ id: d.id, ...d.data() }))),
      ),
      onSnapshot(query(path('projetos')), (s) =>
        setProjetos(s.docs.map((d) => ({ id: d.id, ...d.data() }))),
      ),
      onSnapshot(query(path('acoes'), orderBy('createdAt', 'desc')), (s) =>
        setAcoes(s.docs.map((d) => ({ id: d.id, ...d.data() }))),
      ),
      onSnapshot(query(path('kpis')), (s) =>
        setKpis(s.docs.map((d) => ({ id: d.id, ...d.data() }))),
      ),
    ];
    return () => unsubs.forEach((fn) => fn());
  }, [user]);

  const isAdmin = userProfile?.role === 'admin' || userProfile?.nucleo === 'Estratégico';
  const podeVerFinanceiro = isAdmin || userProfile?.nucleo === 'Financeiro';

  const handleLogout = () => {
    if (window.confirm('Deseja desembarcar da Central?')) {
      signOut(auth);
    }
  };

  if (loading)
    return (
      <div className="h-screen bg-[#070707] flex flex-col items-center justify-center gap-6">
        <div className="w-16 h-16 border-4 border-[#ebe22f]/20 border-t-[#ebe22f] rounded-full animate-spin shadow-[0_0_50px_rgba(235,226,47,0.1)]" />
        <p className="text-[10px] font-black text-[#ebe22f] uppercase tracking-[0.5em] animate-pulse italic">
          Iniciando Motores...
        </p>
      </div>
    );

  if (!user || !userProfile)
    return (
      <LoginHub
        onLogin={async (e, p) => {
          setAuthError(null);
          try {
            await signInWithEmailAndPassword(auth, e, p);
          } catch (err) {
            setAuthError(err.message || 'Falha no acesso.');
          }
        }}
        onRegister={async (email, pass, data) => {
          setAuthError(null);
          try {
            const u = await createUserWithEmailAndPassword(auth, email, pass);
            await setDoc(
              doc(db, 'artifacts', appId, 'public', 'data', 'usuarios', u.user.uid),
              { ...data, uid: u.user.uid, email, role: 'user', createdAt: Timestamp.now() },
            );
          } catch (err) {
            setAuthError(err.message || 'Falha no alistamento.');
          }
        }}
        onGoogleLogin={async () => {
          setAuthError(null);
          try {
            await signInWithPopup(auth, new GoogleAuthProvider());
          } catch (err) {
            setAuthError(err.message || 'Falha no acesso com Google.');
          }
        }}
        error={authError}
      />
    );

  return (
    <div className="flex flex-col md:flex-row h-screen bg-[#070707] text-zinc-100 font-sans overflow-hidden selection:bg-[#ebe22f]/30">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isAdmin={isAdmin}
        podeVerFinanceiro={podeVerFinanceiro}
        userProfile={userProfile}
        onLogout={handleLogout}
      />

      <main className="flex-1 overflow-y-auto relative p-6 md:p-12 pb-24 md:pb-12 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-zinc-900/20 via-transparent to-transparent">
        <header className="mb-12 flex justify-between items-center sticky top-0 bg-[#070707]/90 backdrop-blur-2xl z-20 py-4 px-2 -mx-2 rounded-b-3xl">
          <div>
            <h2 className="text-4xl font-black italic uppercase tracking-tighter text-white drop-shadow-2xl">
              {activeTab === 'meu_conves'
                ? 'Meu Convés'
                : activeTab === 'admin'
                  ? 'Design'
                  : activeTab === 'financeiro'
                    ? 'Financeiro'
                    : activeTab === 'projetos'
                      ? 'Mapa de Batalha'
                      : activeTab === 'mapa_cultural'
                        ? 'Mapa Cultural'
                        : activeTab.replace('_', ' ')}
            </h2>
          </div>
          <BadgeStatus label="Sincronizado" color="green" />
        </header>

        {activeTab === 'meu_conves' && (
          <MeuConvesHub userProfile={userProfile} userUid={user.uid} acoes={acoes} />
        )}
        {activeTab === 'admin' && (
          <MotorDesign
            appId={appId}
            db={db}
            eixos={eixos}
            programas={programas}
            projetos={projetos}
            acoes={acoes}
            kpis={kpis}
          />
        )}
        {activeTab === 'aprovacoes' && (
          <AprovacaoDemandas acoes={acoes} userProfile={userProfile} />
        )}
        {activeTab === 'financeiro' && (
          <FinanceiroHub userProfile={userProfile} />
        )}
        {activeTab === 'bussola' && <BussolaHub />}
        {activeTab === 'projetos' && <ProjetosHub projetos={projetos} />}
        {activeTab === 'arquivos' && (
          <div className="bg-zinc-900/40 border border-white/5 p-16 rounded-[3.5rem] text-center italic text-zinc-500 text-sm font-black uppercase tracking-widest">
            Baú Cloud — Em integração
          </div>
        )}
        {activeTab === 'mapa_cultural' && (
          <MapaCulturalHub userProfile={userProfile} />
        )}
      </main>

      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isAdmin={isAdmin}
        podeVerFinanceiro={podeVerFinanceiro}
        onLogout={handleLogout}
      />
    </div>
  );
}
