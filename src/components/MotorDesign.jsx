/**
 * Motor de Design (AdminMotor) — Hierarquia: Eixos > Programas > Projetos > Ações > KPIs.
 * Expõe os 5 níveis e o saldo de KPIs vinculados a cada ação.
 */

import React, { useMemo, useState } from 'react';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';
import {
  Database,
  FileText,
  Layers,
  Save,
  Settings2,
  Target,
  Trash2,
  Users,
} from 'lucide-react';
import { AdminInput, AdminSelect, FormTitle } from './ui/AdminFields';
import LancarAcaoForm from './LancarAcaoForm';
import EvidenceBadge from './widgets/EvidenceBadge';

const TABS = [
  { id: 'eixos', label: 'Eixos', icon: Layers },
  { id: 'programas', label: 'Programas', icon: Layers },
  { id: 'projetos', label: 'Projetos', icon: FileText },
  { id: 'acoes', label: 'Ações', icon: Users },
  { id: 'kpis', label: 'KPIs', icon: Target },
];

function getCurrentList(subTab, data) {
  return data[subTab] || [];
}

function getCount(subTab, data) {
  return getCurrentList(subTab, data).length;
}

export default function MotorDesign({
  appId,
  db,
  eixos = [],
  programas = [],
  projetos = [],
  acoes = [],
  kpis = [],
}) {
  const [subTab, setSubTab] = useState('projetos');
  const [editingItem, setEditingItem] = useState(null);

  const data = useMemo(
    () => ({ eixos, programas, projetos, acoes, kpis }),
    [eixos, programas, projetos, acoes, kpis],
  );

  const kpisPorAcao = useMemo(() => {
    const map = {};
    acoes.forEach((a) => (map[a.id] = 0));
    kpis.forEach((k) => {
      if (k.acaoId && map[k.acaoId] !== undefined) map[k.acaoId]++;
    });
    return map;
  }, [acoes, kpis]);

  const handleSave = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const dataPayload = Object.fromEntries(formData.entries());
    const path = `artifacts/${appId}/public/data/${subTab}`;
    try {
      if (editingItem) {
        await updateDoc(doc(db, path, editingItem.id), {
          ...dataPayload,
          updatedAt: Timestamp.now(),
        });
      } else {
        await addDoc(collection(db, path), {
          ...dataPayload,
          createdAt: Timestamp.now(),
          status: 'Ativo',
        });
      }
      setEditingItem(null);
      e.currentTarget.reset();
    } catch (err) {
      alert('Falha na sincronização com o Baú Cloud.');
    }
  };

  const handleDelete = async (item) => {
    if (!confirm('Apagar dado permanentemente?')) return;
    const path = `artifacts/${appId}/public/data/${subTab}`;
    try {
      await deleteDoc(doc(db, path, item.id));
      setEditingItem(null);
    } catch (err) {
      alert('Falha ao apagar.');
    }
  };

  const list = getCurrentList(subTab, data);
  const count = getCount(subTab, data);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000 pb-20">
      <div className="flex gap-2 mb-12 bg-zinc-900/50 p-2 rounded-[2rem] border border-white/5 w-max overflow-x-auto no-scrollbar backdrop-blur-md sticky top-0 z-10">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              setSubTab(id);
              setEditingItem(null);
            }}
            className={`px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
              subTab === id
                ? 'bg-[#ebe22f] text-black shadow-2xl shadow-[#ebe22f]/20'
                : 'text-zinc-500 hover:text-white hover:bg-white/5'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-16">
        <section className="xl:col-span-5 bg-zinc-900/30 p-12 rounded-[3.5rem] border border-white/5 h-max shadow-3xl relative overflow-hidden group">
          <div className="absolute -top-32 -left-32 w-64 h-64 bg-[#ebe22f]/5 blur-[120px] rounded-full group-hover:bg-[#ebe22f]/10 transition-all duration-1000" />
          <form onSubmit={handleSave} className="relative z-10">
            {subTab === 'eixos' && (
              <>
                <FormTitle title="Eixo" icon={Layers} />
                <AdminInput
                  label="Nome do Eixo"
                  name="nome"
                  required
                  defaultValue={editingItem?.nome}
                />
              </>
            )}

            {subTab === 'programas' && (
              <>
                <FormTitle title="Programa" icon={Layers} />
                <AdminInput
                  label="Nome do Programa"
                  name="nome"
                  required
                  defaultValue={editingItem?.nome}
                />
                <AdminSelect
                  label="Eixo"
                  name="eixoId"
                  options={eixos.map((e) => ({ label: e.nome, value: e.id }))}
                  defaultValue={editingItem?.eixoId}
                />
              </>
            )}

            {subTab === 'projetos' && (
              <>
                <FormTitle title="Projeto Master" icon={FileText} />
                <AdminInput
                  label="Nome Oficial"
                  name="nome"
                  required
                  defaultValue={editingItem?.nome}
                />
                <AdminInput
                  label="Código PRONAC / ID"
                  name="codigo"
                  defaultValue={editingItem?.codigo}
                  placeholder="Ex: 247449"
                />
                <AdminSelect
                  label="Programa"
                  name="programaId"
                  options={programas.map((p) => ({ label: p.nome, value: p.id }))}
                  defaultValue={editingItem?.programaId}
                />
                <AdminSelect
                  label="Mecanismo"
                  name="mecanismo"
                  options={[
                    { label: 'Lei Rouanet', value: 'rouanet' },
                    { label: 'PNAB', value: 'pnab' },
                    { label: 'OSF', value: 'osf' },
                  ]}
                  defaultValue={editingItem?.mecanismo}
                />
                <div className="grid grid-cols-2 gap-6">
                  <AdminInput
                    label="Valor Aprovado"
                    name="valorAprovado"
                    type="number"
                    defaultValue={editingItem?.valorAprovado}
                  />
                  <AdminInput
                    label="Valor Captado"
                    name="valorCaptado"
                    type="number"
                    defaultValue={editingItem?.valorCaptado}
                  />
                </div>
              </>
            )}

            {subTab === 'acoes' && (
              <LancarAcaoForm
                appId={appId}
                db={db}
                editingItem={editingItem}
                projetos={projetos}
              />
            )}

            {subTab === 'kpis' && (
              <>
                <FormTitle title="KPI" icon={Target} />
                <AdminInput
                  label="Nome do KPI"
                  name="nome"
                  required
                  defaultValue={editingItem?.nome}
                />
                <AdminInput
                  label="Meta"
                  name="meta"
                  defaultValue={editingItem?.meta}
                  placeholder="Ex: 100% ou valor"
                />
                <AdminSelect
                  label="Ação vinculada"
                  name="acaoId"
                  options={acoes.map((a) => ({ label: a.nome, value: a.id }))}
                  defaultValue={editingItem?.acaoId}
                />
              </>
            )}

            <button
              type="submit"
              className="w-full bg-[#ebe22f] text-black font-black uppercase py-6 rounded-3xl mt-12 hover:scale-[1.02] active:scale-95 transition-all shadow-2xl shadow-[#ebe22f]/20 italic flex items-center justify-center gap-3"
            >
              <Save size={20} /> {editingItem ? 'Sincronizar' : 'Comandar Registro'}
            </button>
            {editingItem && (
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="w-full mt-6 text-[10px] font-black uppercase text-zinc-700 hover:text-white transition-colors"
              >
                Cancelar Edição
              </button>
            )}
          </form>
        </section>

        <section className="xl:col-span-7">
          <div className="flex items-center gap-4 mb-12 px-4">
            <Database size={24} className="text-zinc-600" />
            <div>
              <h5 className="text-[11px] font-black uppercase tracking-[0.4em] text-zinc-500 leading-none">
                Baú de Dados
              </h5>
              <p className="text-[9px] font-bold text-zinc-700 uppercase mt-1 italic">
                {count} Registros
              </p>
            </div>
          </div>
          <div className="grid gap-4 max-h-[900px] overflow-y-auto pr-6 custom-scrollbar">
            {list.map((item) => (
              <div
                key={item.id}
                className="bg-zinc-900/60 border border-white/5 p-8 rounded-[2.5rem] flex justify-between items-center group hover:border-[#ebe22f]/40 transition-all shadow-2xl relative overflow-hidden"
              >
                <div className="truncate pr-12 relative z-10 flex-1 min-w-0">
                  <h6 className="text-[16px] font-black uppercase italic text-white truncate group-hover:text-[#ebe22f] transition-colors">
                    {item.nome || item.title || 'Indefinido'}
                  </h6>
                  <div className="flex gap-4 mt-3 opacity-60 flex-wrap items-center">
                    <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">
                      {subTab === 'projetos' ? item.mecanismo : item.status || '—'}
                    </span>
                    {subTab === 'acoes' && (
                      <span className="text-[9px] font-black uppercase tracking-widest text-[#ebe22f] bg-[#ebe22f]/10 border border-[#ebe22f]/20 px-2 py-0.5 rounded">
                        {kpisPorAcao[item.id] ?? 0} KPI(s)
                      </span>
                    )}
                    {subTab === 'acoes' && (
                      <span className="flex gap-2">
                        <EvidenceBadge label="NF" ok={item.temNf === 'Sim'} />
                        <EvidenceBadge label="PIX" ok={item.temPix === 'Sim'} />
                        <EvidenceBadge label="Lista" ok={item.temLista === 'Sim'} />
                        <EvidenceBadge label="Foto" ok={item.temFoto === 'Sim'} />
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-3 shrink-0 opacity-20 group-hover:opacity-100 transition-all relative z-10">
                  <button
                    type="button"
                    onClick={() => setEditingItem(item)}
                    className="p-4 text-[#ebe22f] bg-[#ebe22f]/5 border border-[#ebe22f]/20 rounded-2xl hover:bg-[#ebe22f] hover:text-black transition-all shadow-lg"
                  >
                    <Settings2 size={16} strokeWidth={3} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item)}
                    className="p-4 text-[#db2669] bg-[#db2669]/5 border border-[#db2669]/20 rounded-2xl hover:bg-[#db2669] hover:text-white transition-all shadow-lg"
                  >
                    <Trash2 size={16} strokeWidth={3} />
                  </button>
                </div>
                <div className="absolute top-0 left-0 w-1 h-full bg-[#ebe22f] opacity-0 group-hover:opacity-100 transition-all" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

