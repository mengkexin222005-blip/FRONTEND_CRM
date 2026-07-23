import{ChevronRight,Filter}from"lucide-react";
import{useNavigate}from"react-router-dom";
import{PageBase,PageContentState}from"../../components/page";
import{useDashboard}from"./hooks/useDashboard";
import MyTasksTable from"./components/MyTaskTable";
import MyMeetingsTable from"./components/MyMeetingTable";

const TASKS_ROUTE="/tasks";
const MEETINGS_ROUTE="/meetings";

export default function DashboardPage(){
const navigate=useNavigate();
const{stats,loading,error}=useDashboard();

const tasks=stats?.tasks||[];
const meetings=stats?.meetings||[];

return(
<PageBase>

<div className="mb-3 flex w-full min-w-0 shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

<div className="min-w-0">
<h1 className="text-base font-semibold text-gray-800 sm:text-lg">
Dashboard
</h1>

<p className="truncate text-[11px] text-gray-400 sm:text-xs">
Manage your tasks and meetings
</p>
</div>

<button
type="button"
className="flex w-full shrink-0 items-center justify-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-[11px] text-gray-600 transition hover:border-red-200 hover:text-red-600 sm:w-auto sm:px-4 sm:text-xs"
>
<Filter className="h-3.5 w-3.5"/>
Filter
</button>

</div>

{error&&(
<div className="mb-2 rounded-md bg-red-50 px-3 py-2 text-[11px] text-red-600 sm:text-xs">
{error}
</div>
)}

<PageContentState loading={loading}>

<div className="flex h-full min-h-0 w-full min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden pb-4 pr-1">

<section className="mt-3 w-full min-w-0 shrink-0 sm:mt-4">

<div className="mb-2 flex w-full min-w-0 items-center justify-between gap-2 sm:mb-3">

<div className="flex min-w-0 items-center gap-2">
<h2 className="truncate text-xs font-semibold text-gray-700 sm:text-sm">
My Tasks
</h2>

<span className="shrink-0 rounded-full bg-black/[0.05] px-2 py-0.5 text-[10px] text-black/50 sm:text-[11px]">
{tasks.length}
</span>
</div>

<button
type="button"
onClick={()=>navigate(TASKS_ROUTE)}
className="mr-0 inline-flex shrink-0 items-center whitespace-nowrap text-[10px] font-medium text-black/50 transition hover:text-red-600 sm:mr-4 sm:text-xs lg:mr-8"
>
<span>View more</span>
<ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4"/>
</button>

</div>

<MyTasksTable tasks={tasks}/>

</section>

<section className="mt-6 w-full min-w-0 shrink-0 sm:mt-8 lg:mt-auto lg:pt-8">

<div className="mb-2 flex w-full min-w-0 items-center justify-between gap-2 sm:mb-3">

<div className="flex min-w-0 items-center gap-2">
<h2 className="truncate text-xs font-semibold text-gray-700 sm:text-sm">
My Meetings
</h2>

<span className="shrink-0 rounded-full bg-black/[0.05] px-2 py-0.5 text-[10px] text-black/50 sm:text-[11px]">
{meetings.length}
</span>
</div>

<button
type="button"
onClick={()=>navigate(MEETINGS_ROUTE)}
className="mr-0 inline-flex shrink-0 items-center whitespace-nowrap text-[10px] font-medium text-black/50 transition hover:text-red-600 sm:mr-4 sm:text-xs lg:mr-8"
>
<span>View more</span>
<ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4"/>
</button>

</div>

<MyMeetingsTable meetings={meetings}/>

</section>

</div>

</PageContentState>

</PageBase>
);
}