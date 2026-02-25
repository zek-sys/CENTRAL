import React, { useState } from 'react';
import { ShieldAlert, CheckCircle, XCircle, MessageSquare, Anchor } from 'lucide-react';
import { db } from '../core/firebase';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';

const appId = 'central-regatao-v1';

export default function AprovacaoDemandas({ acoes, userProfile }) {
  const [justificativa, setJustificativa] = useState("");
  const [acaoEmFoco, setAcaoEmFoco] = useState(null);

  // Filtramos as ações que foram enviadas PARA o núcleo deste usuário
  // e que ainda estão aguardando validação do Capitão.
  const pedidosPendentes = acoes.filter(a => 
    a.nucleoDestino === userProfile.nucleo && 
    a.statusValidacao === 'aguardando_capitão'
  );

  const processarDemanda = async (id, status) => {
    try {
      const acaoRef = doc(db, 'artifacts', appId, 'public', 'data', 'acoes', id);
      await updateDoc(acaoRef, {
        statusValidacao: status,
        justificativaCoordenador: status === 'recusada' ? justificativa : null,
        validadoPorUID: userProfile.uid,
        validadoEm: Timestamp.now()
      });
      setAcaoEmFoco(null);
      setJustificativa("");
      alert(status === 'validada' ? "Âncora levantada! Ação liberada." : "Demanda devolvida ao remetente.");
    } catch (err) {
      console.error("Erro na manobra de validação:", err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-right-4 duration-500">
      <header className="flex items-center gap-4 border-b border-white/10 pb-6">
        <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-900/20">
          <ShieldAlert size={24} />
        </div>
        <div>
          <h2 className="text-xl font-black uppercase italic text-white tracking-tighter">Validação de Porto</h2>
          <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">Aprovações pendentes para o núcleo {userProfile.nucleo}</p>
        </div>
      </header>

      {pedidosPendentes.length === 0 ? (
        <div className="py-20 text-center opacity-30 italic flex flex-col items-center gap-4">
          <Anchor size={48} />
          <p className="text-sm font-bold uppercase">Nenhum pedido externo aguardando no cais.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {pedidosPendentes.map(acao => (
            <div key={acao.id} className="bg-[#1E1E1E] border border-blue-500/20 p-6 rounded-[2rem] shadow-xl group">
              <div className="flex flex-col md:flex-row justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[9px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full font-black uppercase">Pedido de: {acao.criadoPorNome}</span>
                  </div>
                  <h4 className="text-lg font-black uppercase italic text-zinc-100 group-hover:text-blue-400 transition-colors">{acao.nome}</h4>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Prazo solicitado: {acao.prazo?.split('-').reverse().join('/')}</p>
                </div>

                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => processarDemanda(acao.id, 'validada')}
                    className="h-12 w-12 bg-green-500/10 text-green-500 rounded-xl flex items-center justify-center hover:bg-green-500 hover:text-black transition-all"
                  >
                    <CheckCircle size={20} />
                  </button>
                  <button 
                    onClick={() => setAcaoEmFoco(acao.id)}
                    className="h-12 w-12 bg-red-500/10 text-red-500 rounded-xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"
                  >
                    <XCircle size={20} />
                  </button>
                </div>
              </div>

              {/* Box de Recusa (Aparece apenas ao clicar no X) */}
              {acaoEmFoco === acao.id && (
                <div className="mt-6 pt-6 border-t border-white/5 space-y-4 animate-in fade-in zoom-in duration-300">
                  <div className="relative">
                    <textarea 
                      value={justificativa}
                      onChange={(e) => setJustificativa(e.target.value)}
                      placeholder="Justifique a recusa ou peça ajustes..."
                      className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm text-white focus:border-red-500 outline-none transition-all h-24"
                    />
                    <MessageSquare className="absolute right-4 bottom-4 text-zinc-700" size={16} />
                  </div>
                  <button 
                    disabled={!justificativa}
                    onClick={() => processarDemanda(acao.id, 'recusada')}
                    className="w-full h-12 bg-red-600 text-white font-black uppercase text-[10px] rounded-xl disabled:opacity-30"
                  >
                    Confirmar Recusa e Devolver Demanda
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}