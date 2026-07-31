import {ChevronDown} from "lucide-react";

const DEFAULT_OPTIONS=[
  {name:"Super Admin"},
  {name:"Admin"},
  {name:"Sales Manager"},
  {name:"Sales Agent"},
  {name:"Support Staff"},
];

export default function RoleTemplateSelect({
  value="",
  onChange,
  roles=[],
  disabled=false,
}){
  const options=roles.length?roles:DEFAULT_OPTIONS;

  return(
    <div>
      <label className="block text-[11px] font-medium text-slate-600">
        Select Role/Edit Role
      </label>

      <div className="relative mt-1">
        <select
          value={value}
          onChange={event=>onChange?.(event.target.value)}
          disabled={disabled||options.length===0}
          className="h-9 w-full appearance-none rounded-md border border-slate-300 bg-white px-3 pr-8 text-[11px] text-slate-700 outline-none transition focus:border-red-400 focus:ring-1 focus:ring-red-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
        >
          <option value="" disabled>
            Select Role/Edit Role
          </option>
          {options.length===0&&(
            <option value="">No role templates available</option>
          )}

          {options.map(option=>{
            const name=typeof option==="string"?option:option.name;

            return(
              <option key={name} value={name}>
                {name}
              </option>
            );
          })}
        </select>

        <ChevronDown
          size={14}
          className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500"
        />
      </div>
    </div>
  );
}
