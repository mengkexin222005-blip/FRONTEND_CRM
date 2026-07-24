import { useUserRecords } from "../hooks/useUserRecords";
import UserRecordList from "./UserRecordList";
import ViewMoreButton from "../components/ViewMoreButton";
import TabToolbar from "../components/TabToolbar";

const STAGE_OPTIONS = [
  "New",
  "Contacted",
  "Qualified",
  "Converted",
  "Lost",
].map((s) => ({ label: s, value: s }));

export default function UserQuotationsTab({ employeeId, enabled }) {
  const r = useUserRecords(employeeId, "quotations", enabled);
  return (
    <div className="py-2">
      <TabToolbar
        search={r.search}
        onSearch={r.handleSearch}
        placeholder="Search quotations..."
        filterValue={r.filter}
        onFilter={r.handleFilter}
        filterOptions={STAGE_OPTIONS}
        filterPlaceholder="All stages"
      />
      <UserRecordList items={r.data} loading={r.loading} resource="quotations" />
      <ViewMoreButton
        hasMore={r.hasMore}
        loadingMore={r.loadingMore}
        onViewMore={r.fetchMore}
        totalRows={r.totalRows}
        shown={r.data.length}
      />
    </div>
  );
}
