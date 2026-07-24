import UserTabs from "./tabs/UsersTab";

export default function UserManagementPage(){
  return(
    <div className="mt-4 flex h-[calc(100%-1rem)] min-h-0 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white">
      <UserTabs/>
    </div>
  );
}