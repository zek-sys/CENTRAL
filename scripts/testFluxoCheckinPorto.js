import {
  collection,
  addDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  writeBatch,
  updateDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../src/core/firebase.js';

const appId = 'central-regatao-v1';

async function lançarTarefaComoAdmin() {
  const prazo = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const acoesRef = collection(
    db,
    'artifacts',
    appId,
    'public',
    'data',
    'acoes',
  );

  const docRef = await addDoc(acoesRef, {
    nome: 'Teste Check-in no Porto',
    nucleoDestino: 'Produção',
    status: 'Pendente',
    statusValidacao: 'aguardando_capitão',
    emailResponsavel: 'gael@regatao.org',
    uidResponsavel: null,
    prazo,
    createdAt: Timestamp.now(),
  });

  const snap = await getDoc(docRef);
  if (!snap.exists()) {
    throw new Error('Ação não encontrada após criação.');
  }

  const data = snap.data();
  if (data.statusValidacao !== 'aguardando_capitão') {
    throw new Error(
      `Status de validação inesperado. Esperado "aguardando_capitão", recebido "${data.statusValidacao}".`,
    );
  }

  console.log('✓ Tarefa nasceu com status "aguardando_capitão".');
  return { id: docRef.id, ...data };
}

async function checkInNoPortoSimulado(user) {
  if (!user?.email) return;

  const acoesRef = collection(
    db,
    'artifacts',
    appId,
    'public',
    'data',
    'acoes',
  );

  const q = query(
    acoesRef,
    where('emailResponsavel', '==', user.email),
    where('uidResponsavel', '==', null),
  );

  const snap = await getDocs(q);
  if (snap.empty) {
    console.log('Nenhuma ação órfã encontrada para check-in.');
    return;
  }

  const batch = writeBatch(db);
  snap.forEach((docSnap) => {
    batch.update(docSnap.ref, {
      uidResponsavel: user.uid,
      updatedAt: Timestamp.now(),
    });
  });

  await batch.commit();
  console.log(
    `✓ Check-in no porto: ${snap.size} ação(ões) vinculada(s) ao UID ${user.uid}.`,
  );
}

async function validarComoGael(acaoId, gael) {
  const ref = doc(
    db,
    'artifacts',
    appId,
    'public',
    'data',
    'acoes',
    acaoId,
  );

  await updateDoc(ref, {
    statusValidacao: 'validada',
    justificativaCoordenador: null,
    validadoPorUID: gael.uid,
    validadoEm: Timestamp.now(),
  });

  console.log('✓ Gael validou a ação.');
}

function montarCronogramaPara(acoes, gael) {
  return acoes
    .filter(
      (a) =>
        a.prazo &&
        a.uidResponsavel === gael.uid &&
        a.statusValidacao === 'validada',
    )
    .sort((a, b) => (a.prazo > b.prazo ? 1 : -1))
    .slice(0, 8);
}

async function verificarNoCronograma(acaoId, gael) {
  const acoesRef = collection(
    db,
    'artifacts',
    appId,
    'public',
    'data',
    'acoes',
  );
  const snap = await getDocs(acoesRef);
  const acoes = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

  const cronograma = montarCronogramaPara(acoes, gael);
  const encontrada = cronograma.find((a) => a.id === acaoId);

  if (!encontrada) {
    throw new Error('Ação não apareceu no cronograma do Gael.');
  }

  console.log('✓ Ação presente no cronograma do Gael.');
}

async function main() {
  console.log('Iniciando fluxo de teste de Check-in no Porto...');

  const gael = {
    uid: 'uid-teste-gael',
    email: 'gael@regatao.org',
    nucleo: 'Produção',
  };

  const acao = await lançarTarefaComoAdmin();
  await checkInNoPortoSimulado(gael);
  await validarComoGael(acao.id, gael);
  await verificarNoCronograma(acao.id, gael);

  console.log('✅ Fluxo completo executado com sucesso.');
}

main().catch((err) => {
  console.error('❌ Erro no fluxo de teste:', err);
  process.exit(1);
});

