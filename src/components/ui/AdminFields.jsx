import React from 'react';
import { ChevronRight } from 'lucide-react';

export const AdminInput = ({
  label,
  name,
  type = 'text',
  placeholder,
  value,
  onChange,
  ...rest
}) => (
  <div className="flex flex-col gap-2 mb-6">
    <label className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em] ml-1">
      {label}
    </label>
    <input
      type={type}
      name={name}
      placeholder={placeholder}
      value={value !== undefined ? value : undefined}
      onChange={onChange ? (e) => onChange(e.target.value) : undefined}
      className="bg-zinc-900/50 border border-white/10 rounded-2xl p-5 text-sm text-white focus:border-[#ebe22f] outline-none transition-all placeholder:text-zinc-700 w-full shadow-inner"
      {...rest}
    />
  </div>
);

export const AdminSelect = ({
  label,
  name,
  options,
  value,
  onChange,
  ...rest
}) => (
  <div className="flex flex-col gap-2 mb-6">
    <label className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em] ml-1">
      {label}
    </label>
    <div className="relative">
      <select
        name={name}
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        className="w-full bg-zinc-900/50 border border-white/10 rounded-2xl p-5 text-sm text-white focus:border-[#ebe22f] outline-none appearance-none cursor-pointer transition-all shadow-inner"
        {...rest}
      >
        <option value="">-- Selecionar --</option>
        {options?.map((opt) => (
          <option
            key={opt.value}
            value={opt.value}
            className="bg-zinc-900 text-white"
          >
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronRight
        size={18}
        className="absolute right-5 top-1/2 -translate-y-1/2 rotate-90 text-zinc-700 pointer-events-none"
        strokeWidth={3}
      />
    </div>
  </div>
);

export const FormTitle = ({ title, icon: Icon }) => (
  <div className="flex items-center gap-4 border-b border-white/5 pb-6 mb-10">
    <div className="p-3 rounded-2xl bg-[#ebe22f]/10 text-[#ebe22f] border border-[#ebe22f]/20 shadow-inner">
      <Icon size={20} strokeWidth={3} />
    </div>
    <h4 className="text-2xl font-black text-white uppercase italic tracking-tighter">
      {title}
    </h4>
  </div>
);

