import React, { useEffect, useState } from 'react';
import { getDocs, collection } from 'firebase/firestore';
import { Users } from 'lucide-react';
import { AdminInput, AdminSelect, FormTitle } from './ui/AdminFields';

const OUTRO_VALUE = '__outro__';

export default function LancarAcaoForm({ appId, db, editingItem, projetos }) {
  const [tripulantes, setTripulantes] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState(editingItem?.emailResponsavel ?? '');
  const [useOutro, setUseOutro] = useState(!editingItem?.emailResponsavel);

  useEffect(() => {
    if (!db || !appId) return;
    const ref = collection(db, 'artifacts', appId, 'public', 'data', 'usuarios');
    getDocs(ref)
      .then((snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setTripulantes(list);
      })
      .catch((err) => console.error('Erro ao carregar tripulantes:', err));
  }, [db, appId]);

  useEffect(() => {
    if (!editingItem?.emailResponsavel) return;
    setSelectedEmail(editingItem.emailResponsavel);
    const naLista = tripulantes.some((t) => (t.email || '').trim() === (editingItem.emailResponsavel || '').trim());
    setUseOutro(!naLista);
  }, [editingItem?.emailResponsavel, tripulantes.length]);

  const options = [
    ...tripulantes
      .filter((t) => (t.email || '').trim())
      .map((t) => ({
        label: t.nome ? `${t.nome} (${t.email})` : t.email,
        value: t.email,
      })),
    { label: 'Outro e-mail (convite)', value: OUTRO_VALUE },
  ];

  return (
    <>
      <FormTitle title="Ação Tática" icon={Users} />
      <AdminInput
        label="Descrição da Remada"
        name="nome"
        required
        defaultValue={editingItem?.nome}
      />
      <AdminSelect
        label="Projeto Pagador"
        name="projetoId"
        options={projetos.map((p) => ({ label: p.nome, value: p.id }))}
        defaultValue={editingItem?.projetoId}
      />

      <div className="flex flex-col gap-2 mb-6">
        <label className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em] ml-1">
          Responsável pela remada
        </label>
        <div className="relative">
          <select
            value={useOutro ? OUTRO_VALUE : selectedEmail}
            onChange={(e) => {
              const v = e.target.value;
              if (v === OUTRO_VALUE) {
                setUseOutro(true);
                setSelectedEmail(editingItem?.emailResponsavel ?? '');
              } else {
                setUseOutro(false);
                setSelectedEmail(v);
              }
            }}
            className="w-full bg-zinc-900/50 border border-white/10 rounded-2xl p-5 text-sm text-white focus:border-[#ebe22f] outline-none appearance-none cursor-pointer transition-all shadow-inner"
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-zinc-900 text-white">
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        {useOutro && (
          <input
            type="email"
            placeholder="E-mail para convite (ex.: novo@regatao.org)"
            value={selectedEmail}
            onChange={(e) => setSelectedEmail(e.target.value)}
            className="mt-2 w-full bg-zinc-900/50 border border-white/10 rounded-2xl p-5 text-sm text-white focus:border-[#ebe22f] outline-none transition-all placeholder:text-zinc-700 shadow-inner"
          />
        )}
        <input type="hidden" name="emailResponsavel" value={selectedEmail} />
      </div>

      <AdminInput
        label="Prazo Final"
        name="prazo"
        type="date"
        defaultValue={editingItem?.prazo}
      />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-8">
        <AdminSelect
          label="NF?"
          name="temNf"
          options={[
            { label: 'Sim', value: 'Sim' },
            { label: 'Não', value: 'Não' },
          ]}
          defaultValue={editingItem?.temNf}
        />
        <AdminSelect
          label="PIX?"
          name="temPix"
          options={[
            { label: 'Sim', value: 'Sim' },
            { label: 'Não', value: 'Não' },
          ]}
          defaultValue={editingItem?.temPix}
        />
        <AdminSelect
          label="Lista CPF?"
          name="temLista"
          options={[
            { label: 'Sim', value: 'Sim' },
            { label: 'Não', value: 'Não' },
          ]}
          defaultValue={editingItem?.temLista}
        />
        <AdminSelect
          label="Fotos?"
          name="temFoto"
          options={[
            { label: 'Sim', value: 'Sim' },
            { label: 'Não', value: 'Não' },
          ]}
          defaultValue={editingItem?.temFoto}
        />
      </div>
    </>
  );
}
