import { useUserRecords } from "../hooks/useUserRecords";
import UserRecordList from "./UserRecordList";
import ViewMoreButton from "../components/ViewMoreButton";
import TabToolbar from "../components/TabToolbar";

const STATUS_OPTIONS = ["To Do", "In Progress", "Completed"].map((s) => ({
  label: s,
  value: s,
}));

export default function UserTasksTab({ employeeId, enabled }) {
  const r = useUserRecords(employeeId, "tasks", enabled);
  return (
    <div className="py-2">
      <TabToolbar
        search={r.search}
        onSearch={r.handleSearch}
        placeholder="Search tasks..."
        filterValue={r.filter}
        onFilter={r.handleFilter}
        filterOptions={STATUS_OPTIONS}
        filterPlaceholder="All statuses"
      />
      <UserRecordList items={r.data} loading={r.loading} resource="tasks" />
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
