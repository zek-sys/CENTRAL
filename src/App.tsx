/**
 * CENTRAL REGATÃO V2.2 - CASCO MODULAR (REFIT)
 * Foco: Hubs, Sidebar + BottomNav, Login Google, Folha de Rosto, useFinanceiro, Trava IN 29.
 * Rotas: docs/arquitetura.md — /minhas-tarefas, /gestao, /projetos, /comunicacao, /configuracoes.
 * Performance: code splitting — apenas /minhas-tarefas e layout no bundle principal; demais rotas lazy + Suspense.
 */

import React, { useEffect, useState, lazy, Suspense } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import {
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
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

import { auth, db, appId, checkInNoPorto, isFirebaseConfigured, isEmailWhitelisted } from './core/firebase';
import { pathToTab, tabToPath, DEFAULT_PATH, getPageTitle, ROUTES_ADMIN_ONLY, ROUTES_DIRETORIA_ONLY } from './routes';
import { getAlunoAuth, clearAlunoAuth, isAlunoAuthForFormacao } from './lib/alunoAuth';
import { ProtectedRoute } from './components/ProtectedRoute';
import Sidebar from './components/layout/Sidebar';
import BottomNav from './components/layout/BottomNav';
import BadgeStatus from './components/layout/BadgeStatus';
import HeaderOptions from './components/layout/HeaderOptions';
import HeaderHoras from './components/layout/HeaderHoras';
import MinhasTarefasPage from './screens/MinhasTarefasPage';
import LoadingScreen from './components/LoadingScreen';
import ErrorBoundary from './components/ErrorBoundary';
import { useTaskManager } from './hooks/useTaskManager';
import { useTheme } from './context/ThemeContext';

/* Lazy: rotas secundárias — carregadas sob demanda para reduzir TTI/FCP */
const LoginHub = lazy(() => import('./hubs/LoginHub'));
const TaskDetailPage = lazy(() => import('./screens/TaskDetailPage'));
const BussolaHub = lazy(() => import('./hubs/BussolaHub'));
const GestaoDiretoriaScreen = lazy(() => import('./screens/GestaoDiretoriaScreen'));
const ProjetosVisaoGeral = lazy(() => import('./screens/ProjetosVisaoGeral'));
const NovoProjetoPage = lazy(() => import('./screens/NovoProjetoPage'));
const ProjetoDetalheScreen = lazy(() => import('./screens/ProjetoDetalheScreen'));
const FinanceiroHub = lazy(() => import('./hubs/FinanceiroHub'));
const MapaCulturalHub = lazy(() => import('./hubs/MapaCulturalHub'));
const CronogramaGeralHub = lazy(() => import('./hubs/CronogramaGeralHub'));
const MapadoImpactoHub = lazy(() => import('./hubs/MapadoImpactoHub'));
const ConhecaInstitutoScreen = lazy(() => import('./screens/ConhecaInstitutoScreen'));
const GuiaAprendizagemScreen = lazy(() => import('./screens/GuiaAprendizagemScreen'));
const GuiaDeBordoPage = lazy(() => import('./screens/GuiaDeBordoPage'));
const SetorPedagogico = lazy(() => import('./hubs/SetorPedagogico'));
const FormacaoDetalheScreen = lazy(() => import('./screens/FormacaoDetalheScreen'));
const PerfilScreen = lazy(() => import('./screens/PerfilScreen'));
const CulturaManuaisScreen = lazy(() => import('./screens/CulturaManuaisScreen'));
const MinhasEntregasScreen = lazy(() => import('./screens/MinhasEntregasScreen'));
const ComunicacaoScreen = lazy(() => import('./screens/ComunicacaoScreen'));

const NucleoLayout = lazy(() => import('./pages/nucleos/NucleoLayout'));
const NucleoGestaoPage = lazy(() => import('./pages/nucleos/NucleoGestaoPage'));
const NucleoComunicacaoPage = lazy(() => import('./pages/nucleos/NucleoComunicacaoPage'));
const NucleoCampoPage = lazy(() => import('./pages/nucleos/NucleoCampoPage'));
const NucleoPedagogicoPage = lazy(() => import('./pages/nucleos/NucleoPedagogicoPage'));
const AreaDoAlunoPage = lazy(() => import('./pages/AreaDoAlunoPage'));
const LoginAlunoPage = lazy(() => import('./pages/aluno/LoginAlunoPage'));

const MasterControlPanel = lazy(() => import('./components/master/MasterControlPanel'));

/** Oculta a aba Financeiro no menu até concluir desenvolvimento. Alterar para true para exibir. */
const SHOW_FINANCEIRO_TAB = true;

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [authSuccess, setAuthSuccess] = useState(null);
  const [hasCheckedIn, setHasCheckedIn] = useState(false);

  /** Aba ativa derivada da URL (fonte única de verdade). */
  const tabFromPath = pathToTab(location.pathname);
  const activeTab = tabFromPath ?? 'meu_conves';
  const setActiveTab = (tabId: string) => navigate(tabToPath(tabId));

  const [eixos, setEixos] = useState([]);
  const [programas, setProgramas] = useState([]);
  const [projetos, setProjetos] = useState([]);
  const [acoes, setAcoes] = useState([]);
  const [kpis, setKpis] = useState([]);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  const { tasks: userTasks, syncPendingIds, loading: tasksLoading, error: tasksError, concluirTarefa, atualizarEvidencias, atualizarStatus } = useTaskManager(user?.uid ?? null);
  const { theme } = useTheme();
  const bgPage = theme === 'light' ? 'bg-white' : theme === 'soft' ? 'bg-stone-100' : theme === 'brand' ? 'bg-amber-50' : 'bg-white dark:bg-black';
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(t);
  }, []);
  const overdueCount = React.useMemo(() => {
    if (!Array.isArray(userTasks)) return 0;
    return userTasks.filter((t) => {
      if (t.status === 'concluido') return false;
      const prazo = t.prazoFinal;
      if (!prazo) return false;
      const ms = prazo?.toDate ? prazo.toDate().getTime() : new Date(prazo).getTime();
      return ms < now;
    }).length;
  }, [userTasks, now]);

  const projetosMap = React.useMemo(
    () => (projetos?.length ? Object.fromEntries(projetos.map((p) => [p.id, p.nome])) : {}),
    [projetos]
  );

  const handleConcluirMinhasTarefas = React.useCallback(
    async (tarefa, payload) => {
      await atualizarEvidencias(tarefa.id, {
        linkNF: payload.linkNF,
        linkPix: payload.linkPix,
        linkComprovacaoVisual: payload.linkComprovacaoVisual,
      });
      const acaoComEvidencias = tarefa.tipoAcao === 'A' || tarefa.tipoAcao === 'D'
        ? { ...tarefa, evidencias: { ...(tarefa.evidencias || {}), linkNF: payload.linkNF, linkPix: payload.linkPix, linkComprovacaoVisual: payload.linkComprovacaoVisual } }
        : tarefa;
      const res = await concluirTarefa(acaoComEvidencias, { horasDedicadas: payload.horasDedicadas });
      if (res.message) alert(res.message);
    },
    [atualizarEvidencias, concluirTarefa]
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const snapshotUnsubRef = { current: null };
    const profileTimeoutRef = { current: null };

    const unsub = onAuthStateChanged(auth, (u) => {
      if (profileTimeoutRef.current) {
        clearTimeout(profileTimeoutRef.current);
        profileTimeoutRef.current = null;
      }
      snapshotUnsubRef.current?.();
      snapshotUnsubRef.current = null;

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

      const clearProfileTimeout = () => {
        if (profileTimeoutRef.current) {
          clearTimeout(profileTimeoutRef.current);
          profileTimeoutRef.current = null;
        }
      };

      snapshotUnsubRef.current = onSnapshot(
        userRef,
        (snap) => {
          clearProfileTimeout();
          if (snap.exists()) {
            setUserProfile({ uid: u.uid, ...snap.data() });
          } else {
            const defaultProfile = {
              uid: u.uid,
              nome: u.displayName || u.email?.split('@')[0] || 'Usuário',
              email: u.email || null,
              nucleos: ['Estratégico'],
              nucleo: 'Estratégico',
              nivelAcesso: 3,
              role: 'user',
              createdAt: Timestamp.now(),
            };
            setDoc(userRef, defaultProfile).catch(() => {});
            setUserProfile(defaultProfile);
          }
          setLoading(false);
        },
        (err) => {
          clearProfileTimeout();
          console.warn('Erro ao carregar perfil do usuário:', err?.message ?? err);
          setUserProfile({
            uid: u.uid,
            nome: u.displayName || u.email?.split('@')[0] || 'Usuário',
            email: u.email || null,
            nucleos: ['Estratégico'],
            nucleo: 'Estratégico',
            nivelAcesso: 3,
            role: 'user',
          });
          setLoading(false);
        }
      );

      // Segurança: se em 15s o perfil não responder, libera a tela com perfil mínimo
      profileTimeoutRef.current = setTimeout(() => {
        profileTimeoutRef.current = null;
        setLoading((prev) => {
          if (prev) {
            setUserProfile((p) => p || {
              uid: u.uid,
              nome: u.displayName || u.email?.split('@')[0] || 'Usuário',
              email: u.email || null,
              nucleos: ['Estratégico'],
              nucleo: 'Estratégico',
              nivelAcesso: 3,
              role: 'user',
            });
            return false;
          }
          return prev;
        });
      }, 15000);
    });

    return () => {
      if (profileTimeoutRef.current) clearTimeout(profileTimeoutRef.current);
      snapshotUnsubRef.current?.();
      unsub();
    };
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
      onSnapshot(query(path('projetos')), (s) => {
        const list = s.docs.map((d) => ({ id: d.id, ...d.data() }));
        setProjetos(list.filter((p) => (p as { status?: string }).status !== 'arquivado'));
      }),
      onSnapshot(query(path('acoes'), orderBy('createdAt', 'desc')), (s) => {
        setAcoes(s.docs.map((d) => ({ id: d.id, ...d.data() })));
      }),
      onSnapshot(query(path('kpis')), (s) =>
        setKpis(s.docs.map((d) => ({ id: d.id, ...d.data() }))),
      ),
    ];
    return () => unsubs.forEach((fn) => fn());
  }, [user]);

  const isAdmin = userProfile?.role === 'admin' || userProfile?.nucleo === 'Estratégico';
  /** Núcleo Pedagógico: visível para role "diretoria", admin ou núcleo Estratégico */
  const isDiretoria = userProfile?.role === 'diretoria' || isAdmin;
  const podeVerFinanceiro = isAdmin || userProfile?.nucleo === 'Financeiro';

  useEffect(() => {
    document.title = getPageTitle(location.pathname);
  }, [location.pathname]);

  const handleLogout = () => {
    if (window.confirm('Deseja sair da Gestão Regatão?')) {
      signOut(auth);
    }
  };

  if (loading)
    return (
      <div className={`h-screen ${bgPage} flex flex-col items-center justify-center gap-6`}>
        <div className="w-12 h-12 border-2 border-zinc-200 dark:border-[#2A2A2A] border-t-[#EBE22F] rounded-full animate-spin" />
        <p className="text-sm font-medium text-zinc-500">
          A carregar...
        </p>
      </div>
    );

  if (!user || !userProfile)
    return (
      <Suspense fallback={<LoadingScreen />}>
        <LoginHub
        onLogin={async (e, p) => {
          setAuthError(null);
          setAuthSuccess(null);
          try {
            await signInWithEmailAndPassword(auth, e, p);
          } catch (err: unknown) {
            const msg = (err && typeof err === 'object' && 'message' in err) ? String((err as { message: unknown }).message) : '';
            const code = (err && typeof err === 'object' && 'code' in err) ? (err as { code: string }).code : '';
            const isInvalidApiKey = code === 'auth/api-key-not-valid' || /api-key-not-valid/i.test(msg);
            if (code === 'auth/invalid-credential') {
              setAuthError('E-mail ou senha incorretos. Se esqueceu a senha, use "Esqueci a senha" abaixo.');
              return;
            }
            setAuthError(isInvalidApiKey
              ? 'Chave de API do Firebase inválida ou ausente. Desenvolvimento: confira o arquivo .env.local. Produção: refaça o deploy com as variáveis corretas. Obtenha a chave em: Firebase Console → Configurações do projeto → Geral.'
              : (msg || 'Falha no acesso.'));
          }
        }}
        onRegister={async (email, pass, data) => {
          setAuthError(null);
          setAuthSuccess(null);
          try {
            const u = await createUserWithEmailAndPassword(auth, email, pass);
            await setDoc(
              doc(db, 'artifacts', appId, 'public', 'data', 'usuarios', u.user.uid),
              { ...data, uid: u.user.uid, email, role: 'user', createdAt: Timestamp.now() },
            );
          } catch (err: unknown) {
            const msg = (err && typeof err === 'object' && 'message' in err) ? String((err as { message: unknown }).message) : '';
            const code = (err && typeof err === 'object' && 'code' in err) ? (err as { code: string }).code : '';
            const isInvalidApiKey = code === 'auth/api-key-not-valid' || /api-key-not-valid/i.test(msg);
            if (code === 'auth/email-already-in-use') {
              setAuthError('Este e-mail já está cadastrado. Use "Já tenho conta" para entrar com a sua senha. Esqueceu a senha? Use "Esqueci a senha" abaixo.');
              return;
            }
            setAuthError(isInvalidApiKey
              ? 'Chave de API do Firebase inválida ou ausente. Confira o .env.local (desenvolvimento) ou variáveis de build (produção). Firebase Console → Configurações do projeto → Geral.'
              : (msg || 'Falha no alistamento.'));
          }
        }}
        onGoogleLogin={async () => {
          setAuthError(null);
          setAuthSuccess(null);
          try {
            const result = await signInWithPopup(auth, new GoogleAuthProvider());
            const email = result?.user?.email;
            if (email) {
              const allowed = await isEmailWhitelisted(email);
              if (!allowed) {
                await signOut(auth);
                setAuthError('Este e-mail não está autorizado a acessar a Central Regatão. Entre em contacto com a diretoria.');
                return;
              }
            }
          } catch (err: unknown) {
            const msg = (err && typeof err === 'object' && 'message' in err) ? String((err as { message: unknown }).message) : '';
            const code = (err && typeof err === 'object' && 'code' in err) ? (err as { code: string }).code : '';
            const isInvalidApiKey = code === 'auth/api-key-not-valid' || /api-key-not-valid/i.test(msg);
            setAuthError(isInvalidApiKey
              ? 'Chave de API do Firebase inválida ou ausente. Confira o .env.local (desenvolvimento) ou variáveis de build (produção). Firebase Console → Configurações do projeto → Geral.'
              : (msg || 'Falha no acesso com Google.'));
          }
        }}
        onForgotPassword={async (email) => {
          setAuthError(null);
          setAuthSuccess(null);
          try {
            await sendPasswordResetEmail(auth, email);
            setAuthSuccess('Enviámos um e-mail para redefinir a sua senha. Verifique a caixa de entrada (e o spam).');
          } catch (err: unknown) {
            const code = (err && typeof err === 'object' && 'code' in err) ? (err as { code: string }).code : '';
            if (code === 'auth/user-not-found') {
              setAuthError('Não existe conta com este e-mail. Crie uma conta ou verifique o endereço.');
            } else {
              const msg = (err && typeof err === 'object' && 'message' in err) ? String((err as { message: unknown }).message) : '';
              setAuthError(msg || 'Não foi possível enviar o e-mail de recuperação. Tente novamente.');
            }
          }
        }}
        error={authError}
        success={authSuccess}
        firebaseNotConfigured={!isFirebaseConfigured}
      />
      </Suspense>
    );

  if (location.pathname === '/' || location.pathname === '') {
    return <Navigate to={DEFAULT_PATH} replace />;
  }

  /* Rota pública: Login do Aluno (WhatsApp + PIN) — sem Firebase Auth */
  if (location.pathname === '/login-aluno') {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <LoginAlunoPage />
      </Suspense>
    );
  }

  /* Área do Aluno: se não há user Firebase mas há sessão aluno válida, layout mínimo */
  const areaAlunoMatchNoUser = location.pathname.match(/^\/area-aluno\/([^/]+)$/);
  if (areaAlunoMatchNoUser && !user) {
    const formacaoId = areaAlunoMatchNoUser[1];
    const auth = getAlunoAuth();
    if (auth && auth.formacaoId === formacaoId) {
      return (
        <Suspense fallback={<LoadingScreen />}>
          <div className="min-h-screen bg-black flex flex-col">
            <header className="flex justify-between items-center p-4 border-b border-zinc-800">
              <span className="text-white font-semibold truncate">{auth.nomeArtistico || 'Área do Aluno'}</span>
              <button
                type="button"
                onClick={() => { clearAlunoAuth(); navigate('/login-aluno'); }}
                className="text-zinc-400 hover:text-white text-sm px-3 py-2 rounded-lg hover:bg-zinc-800 transition-colors"
              >
                Sair
              </button>
            </header>
            <main className="flex-1 overflow-auto">
              <AreaDoAlunoPage formacaoId={formacaoId} />
            </main>
          </div>
        </Suspense>
      );
    }
    return <Navigate to="/login-aluno" replace />;
  }

  if (tabFromPath === null) {
    return <Navigate to={DEFAULT_PATH} replace />;
  }
  if (ROUTES_ADMIN_ONLY.includes(location.pathname.replace(/\/$/, '') || '/') && !isAdmin) {
    return <Navigate to={DEFAULT_PATH} replace />;
  }
  if (ROUTES_DIRETORIA_ONLY.includes(location.pathname.replace(/\/$/, '') || '/') && !isDiretoria) {
    return <Navigate to={DEFAULT_PATH} replace />;
  }

  /** Nível 4 (externos/consultores): apenas tela Minhas Entregas, sem menu. */
  if (userProfile?.nivelAcesso === 4) {
    return (
      <div className="min-h-screen bg-[#121212] flex flex-col">
        <header className="flex justify-between items-center p-4 border-b border-white/10">
          <span className="text-white font-semibold">Minhas Entregas</span>
          <button
            type="button"
            onClick={handleLogout}
            className="text-zinc-400 hover:text-white text-sm px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            Sair
          </button>
        </header>
        <Suspense fallback={<LoadingScreen />}>
          <MinhasEntregasScreen userUid={user?.uid ?? ''} tarefas={userTasks ?? []} />
        </Suspense>
      </div>
    );
  }

  return (
    <div className={`flex flex-col md:flex-row h-screen ${bgPage} text-zinc-800 dark:text-zinc-200 font-sans overflow-hidden selection:bg-[#EBE22F]/20`}>
      {!isOnline && (
        <div className="flex-shrink-0 bg-[#EBE22F] px-4 py-3 text-center">
          <p className="text-sm font-semibold text-[#121212]">
            Modo Sem Internet: O sistema guardará as alterações no seu aparelho e enviará assim que você se conectar novamente.
          </p>
        </div>
      )}
        <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isAdmin={isAdmin}
        isDiretoria={isDiretoria}
        podeVerFinanceiro={podeVerFinanceiro}
        showFinanceiroTab={SHOW_FINANCEIRO_TAB}
        userProfile={userProfile}
        onLogout={handleLogout}
      />

        <main className={`flex-1 overflow-y-auto relative p-6 md:p-10 pb-[max(6rem,calc(5.5rem+env(safe-area-inset-bottom)))] md:pb-10 ${bgPage}`}>
        <header className={`mb-6 flex justify-between items-center gap-4 sticky top-0 z-20 py-4 -mx-2 border-b border-zinc-200 dark:border-white/5 ${bgPage} shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.2)]`}>
          <div className="min-w-0">
            <h2 className="text-2xl font-title text-zinc-900 dark:text-white truncate" style={{ fontSize: '1.5rem' }}>
              {activeTab === 'meu_conves'
                ? 'Minhas Tarefas'
                : activeTab === 'admin'
                  ? 'Gestão Estratégica'
                  : activeTab === 'financeiro'
                    ? 'Direção e Finanças'
                    : activeTab === 'projetos'
                      ? (location.pathname === '/projetos/novo' ? 'Novo Projeto' : location.pathname.match(/^\/projetos\/([^/]+)$/) ? 'Projeto' : 'Projetos')
                      : activeTab === 'perfil'
                        ? 'Meu Perfil'
                        : activeTab === 'mapa_cultural'
                        ? 'Configurações'
                        : activeTab === 'bussola'
                          ? 'Visão Geral'
                            : activeTab === 'cronograma_geral'
                            ? 'Cronograma Geral'
                            : activeTab === 'conheca_o_instituto'
                              ? 'Conheça o Instituto'
                              : activeTab === 'guia_aprendizagem'
                                ? 'Guia de Bordo'
                                : activeTab === 'nucleo_pedagogico'
                                  ? 'Núcleo Pedagógico'
                                  : activeTab === 'cultura'
                                    ? 'Cultura e Manuais'
                                    : activeTab === 'mapa_impacto'
                                      ? 'Mapa do Impacto'
                                        : activeTab === 'comunicacao'
                                        ? 'Comunicação'
                                        : activeTab === 'nucleo_gestao'
                                          ? 'Núcleo Gestão'
                                          : activeTab === 'nucleo_comunicacao'
                                            ? 'Núcleo Comunicação'
                                            : activeTab === 'nucleo_campo'
                                              ? 'Núcleo Campo'
                                                : activeTab === 'nucleo_pedagogico_page'
                                                ? 'Núcleo Pedagógico'
                                                : activeTab === 'master_outliner'
                                                  ? 'Master Outliner'
                                                  : activeTab.replace(/_/g, ' ')}
            </h2>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <HeaderHoras tasks={userTasks ?? []} />
            <HeaderOptions />
            <BadgeStatus
              isOnline={isOnline}
              pendingSyncCount={syncPendingIds?.size ?? 0}
              overdueCount={overdueCount}
              compactWhenGreen
              showStatusPicker
            />
          </div>
        </header>

        <div className="pt-4">
        {activeTab === 'meu_conves' && (() => {
          const match = location.pathname.match(/^\/minhas-tarefas\/([^/]+)$/);
          const taskId = match?.[1];
          return taskId ? (
            <Suspense fallback={<LoadingScreen />}>
              <TaskDetailPage taskId={taskId} />
            </Suspense>
          ) : (
            <ErrorBoundary>
              <MinhasTarefasPage
                userUid={user?.uid ?? null}
                tarefasReais={userTasks}
                projetosMap={projetosMap}
                carregando={tasksLoading}
                erro={tasksError}
                onConcluir={handleConcluirMinhasTarefas}
                onAtualizarStatus={atualizarStatus}
                isDiretoria={isDiretoria}
              />
            </ErrorBoundary>
          );
        })()}
        {activeTab === 'admin' && (
          <ProtectedRoute user={user} userProfile={userProfile} adminOnly>
            <Suspense fallback={<LoadingScreen />}>
              <GestaoDiretoriaScreen
              appId={appId}
              db={db}
              eixos={eixos}
              programas={programas}
              projetos={projetos}
              acoes={acoes}
              kpis={kpis}
            />
            </Suspense>
          </ProtectedRoute>
        )}
        {activeTab === 'financeiro' && (
          <Suspense fallback={<LoadingScreen />}>
            <FinanceiroHub userProfile={userProfile} projetos={projetos} acoes={acoes} />
          </Suspense>
        )}
        {activeTab === 'bussola' && (
          <Suspense fallback={<LoadingScreen />}>
            <BussolaHub projetos={projetos} />
          </Suspense>
        )}
        {activeTab === 'projetos' && (() => {
          const path = location.pathname.replace(/\/$/, '');
          const isNovo = path === '/projetos/novo';
          const match = location.pathname.match(/^\/projetos\/([^/]+)$/);
          const projetoId = match?.[1];
          if (isNovo) {
            return (
              <Suspense fallback={<LoadingScreen />}>
                <NovoProjetoPage
                  programas={programas}
                />
              </Suspense>
            );
          }
          if (projetoId && projetoId !== 'novo') {
            return (
              <Suspense fallback={<LoadingScreen />}>
                <ProjetoDetalheScreen
                id={projetoId}
                userProfile={userProfile}
                userUid={user?.uid ?? ''}
                projetos={projetos}
                acoes={acoes}
                programas={programas}
                eixos={eixos}
                kpis={kpis}
                />
              </Suspense>
            );
          }
          return (
            <Suspense fallback={<LoadingScreen />}>
              <ProjetosVisaoGeral
              projetos={projetos}
              acoes={acoes}
              programas={programas}
              eixos={eixos}
              kpis={kpis}
                userProfile={userProfile}
              />
            </Suspense>
          );
        })()}
        {activeTab === 'cronograma_geral' && (
          <ErrorBoundary>
            <Suspense fallback={<LoadingScreen />}>
              <CronogramaGeralHub
            projetos={projetos}
            acoes={acoes}
            eixos={eixos}
            userProfile={userProfile}
            userUid={user?.uid}
              userEmail={user?.email}
            />
            </Suspense>
          </ErrorBoundary>
        )}
        {activeTab === 'mapa_impacto' && (
          <Suspense fallback={<LoadingScreen />}>
            <MapadoImpactoHub
              eixos={eixos}
              projetos={projetos}
              acoes={acoes}
              userProfile={userProfile}
              userRole={userProfile?.role === 'admin' || userProfile?.nucleo === 'Estratégico' ? 'diretor' : 'equipe'}
            />
          </Suspense>
        )}
        {activeTab === 'arquivos' && (
          <div className="bg-[#1E1E1E] p-12 rounded-lg text-center text-zinc-500 text-sm font-medium">
            Arquivos e Documentos — Em integração
          </div>
        )}
        {activeTab === 'perfil' && (
          <Suspense fallback={<LoadingScreen />}>
            <PerfilScreen userProfile={userProfile} carregando={false} userUid={user?.uid ?? null} />
          </Suspense>
        )}
        {activeTab === 'mapa_cultural' && (
          <Suspense fallback={<LoadingScreen />}>
            <MapaCulturalHub userProfile={userProfile} />
          </Suspense>
        )}
        {activeTab === 'conheca_o_instituto' && (
          <Suspense fallback={<LoadingScreen />}>
            <ConhecaInstitutoScreen />
          </Suspense>
        )}
        {activeTab === 'guia_aprendizagem' && (
          <Suspense fallback={<LoadingScreen />}>
            <GuiaDeBordoPage userProfile={userProfile} isAdmin={isAdmin} isDiretoria={isDiretoria} />
          </Suspense>
        )}
        {activeTab === 'nucleo_pedagogico' && (() => {
          const areaAlunoMatch = location.pathname.match(/^\/area-aluno\/([^/]+)$/);
          const formacaoMatch = location.pathname.match(/^\/nucleo-pedagogico\/([^/]+)$/);
          const formacaoId = areaAlunoMatch?.[1] ?? formacaoMatch?.[1];
          if (areaAlunoMatch) {
            const fid = areaAlunoMatch[1];
            if (!isDiretoria && !isAlunoAuthForFormacao(fid)) {
              return <Navigate to="/login-aluno" replace />;
            }
            return <AreaDoAlunoPage formacaoId={fid} />;
          }
          return (
            <ProtectedRoute user={user} userProfile={userProfile} diretoriaOnly>
              <Suspense fallback={<LoadingScreen />}>
                {formacaoId ? (
                  <FormacaoDetalheScreen
                    userProfile={userProfile}
                    eixos={eixos}
                    programas={programas}
                  />
                ) : (
                  <SetorPedagogico userProfile={userProfile} eixos={eixos} programas={programas} />
                )}
              </Suspense>
            </ProtectedRoute>
          );
        })()}
        {activeTab === 'cultura' && (
          <Suspense fallback={<LoadingScreen />}>
            <CulturaManuaisScreen userProfile={userProfile} eixos={eixos} />
          </Suspense>
        )}
        {activeTab === 'comunicacao' && (
          <Suspense fallback={<LoadingScreen />}>
            <ComunicacaoScreen />
          </Suspense>
        )}
        {activeTab === 'master_outliner' && (
          <ProtectedRoute user={user} userProfile={userProfile} adminOnly>
            <Suspense fallback={<LoadingScreen />}>
              <MasterControlPanel
                eixos={eixos}
                programas={programas}
                projetos={projetos}
                acoes={acoes}
                kpis={kpis}
                fetchFromFirestore={false}
              />
            </Suspense>
          </ProtectedRoute>
        )}
        {(activeTab === 'nucleo_gestao' || activeTab === 'nucleo_comunicacao' || activeTab === 'nucleo_campo' || activeTab === 'nucleo_pedagogico_page') && (() => {
          const slugMatch = location.pathname.match(/^\/nucleos\/([^/]+)/);
          const slug = slugMatch?.[1] ?? 'gestao';
          return (
            <Suspense fallback={<LoadingScreen />}>
              <NucleoLayout nucleoSlug={slug} userProfile={userProfile}>
                {activeTab === 'nucleo_gestao' && (
                  <NucleoGestaoPage
                    projetos={projetos}
                    acoes={acoes}
                    kpis={kpis}
                    userProfile={userProfile}
                    onOpenTarefa={(a) => navigate(`/minhas-tarefas/${a.id}`)}
                  />
                )}
                {activeTab === 'nucleo_comunicacao' && (
                  <NucleoComunicacaoPage
                    projetos={projetos}
                    acoes={acoes}
                    kpis={kpis}
                    userProfile={userProfile}
                  />
                )}
                {activeTab === 'nucleo_campo' && (
                  <NucleoCampoPage
                    projetos={projetos}
                    acoes={acoes}
                    kpis={kpis}
                    userProfile={userProfile}
                  />
                )}
                {activeTab === 'nucleo_pedagogico_page' && (
                  <NucleoPedagogicoPage
                    projetos={projetos}
                    acoes={acoes}
                    kpis={kpis}
                    userProfile={userProfile}
                    eixos={eixos}
                    programas={programas}
                  />
                )}
              </NucleoLayout>
            </Suspense>
          );
        })()}
        </div>
      </main>

      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isAdmin={isAdmin}
        isDiretoria={isDiretoria}
        podeVerFinanceiro={podeVerFinanceiro}
        showFinanceiroTab={SHOW_FINANCEIRO_TAB}
        onLogout={handleLogout}
      />
    </div>
  );
}
