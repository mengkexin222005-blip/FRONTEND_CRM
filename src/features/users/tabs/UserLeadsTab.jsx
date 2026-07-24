import { useUserRecords } from "../hooks/useUserRecords";
import UserRecordList from "./UserRecordList";
import ViewMoreButton from "../components/ViewMoreButton";
import TabToolbar from "../components/TabToolbar";

const STATUS_OPTIONS = [
  // "New",
  "Contacted",
  "Qualified",
  "Converted",
  "Lost",
].map((s) => ({ label: s, value: s }));

export default function UserLeadsTab({ employeeId, enabled }) {
  const r = useUserRecords(employeeId, "leads", enabled);
  return (
    <div className="py-2">
      <TabToolbar
        search={r.search}
        onSearch={r.handleSearch}
        placeholder="Search leads..."
        filterValue={r.filter}
        onFilter={r.handleFilter}
        filterOptions={STATUS_OPTIONS}
        filterPlaceholder="All statuses"
      />
      <UserRecordList items={r.data} loading={r.loading} resource="leads" />
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
