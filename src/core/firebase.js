import { initializeApp } from "firebase/app";
import { getFirestore, collection, query, where, getDocs, writeBatch, Timestamp } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// --- CONFIGURAÇÃO OFICIAL FORNECIDA ---
const firebaseConfig = {
  apiKey: "AIzaSyCEsVH38nMXwCKDfIXuC_C20xpJyo2PUb0",
  authDomain: "central-regatao.firebaseapp.com",
  projectId: "central-regatao",
  storageBucket: "central-regatao.firebasestorage.app",
  messagingSenderId: "433962319849",
  appId: "1:433962319849:web:8a735f13877058ac66d578",
  measurementId: "G-09123EC9B5",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);

/** Identificador do artefato no Firestore (Manual de Marca: manter Ouro Tapajós #ebe22f, Cinza Chumbo/zinc). */
export const appId = "central-regatao-v1";

/**
 * Check-in no porto: vincula ao UID do usuário as ações com emailResponsavel = user.email e uidResponsavel = null.
 */
export async function checkInNoPorto(user) {
  if (!user?.email) return;
  try {
    const acoesRef = collection(db, "artifacts", appId, "public", "data", "acoes");
    const q = query(
      acoesRef,
      where("emailResponsavel", "==", user.email),
      where("uidResponsavel", "==", null),
    );
    const snap = await getDocs(q);
    if (snap.empty) return;
    const batch = writeBatch(db);
    snap.forEach((docSnap) => {
      batch.update(docSnap.ref, { uidResponsavel: user.uid, updatedAt: Timestamp.now() });
    });
    await batch.commit();
  } catch (err) {
    console.error("Falha no check-in de porto:", err);
  }
}