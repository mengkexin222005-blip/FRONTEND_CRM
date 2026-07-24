import Select from "react-select";
import { getSelectProps } from "../../../components/select/selectConfig";

export default function TabToolbar({
  search,
  onSearch,
  placeholder,
  filterValue,
  onFilter,
  filterOptions,
  filterPlaceholder,
}) {
  return (
    <div className="flex gap-2 mb-3">
      <input
        type="text"
        placeholder={placeholder}
        value={search}
        onChange={(e) => onSearch(e.target.value)}
        className="flex-1 border border-gray-300 rounded-md px-3 py-1.25 text-sm focus:outline-none focus:ring-2 focus:ring-red-200 w-56"
      />
      <Select
        {...getSelectProps({ variant: "filter" })}
        value={filterOptions.find((o) => o.value === filterValue) || null}
        onChange={(opt) => onFilter(opt?.value ?? "")}
        placeholder={filterPlaceholder}
        options={filterOptions}
        isClearable
        isSearchable
      />
    </div>
  );
}
