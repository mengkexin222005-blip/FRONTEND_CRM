import{useCallback,useEffect,useState}from"react";
import api from"../../../services/api";

const MIN_ITEMS=10;
const DAY=86400000;

const defaultTasks=[
{
subject:"Follow up with client",
taskType:"Follow Up",
priority:"High",
status:"To Do"
},
{
subject:"Prepare quotation",
taskType:"Sales",
priority:"Medium",
status:"In Progress"
},
{
subject:"Review sales report",
taskType:"Sales",
priority:"Low",
status:"To Do"
},
{
subject:"Call new prospect",
taskType:"Follow Up",
priority:"High",
status:"To Do"
},
{
subject:"Update customer details",
taskType:"Sales",
priority:"Medium",
status:"In Progress"
},
{
subject:"Send proposal",
taskType:"Follow Up",
priority:"High",
status:"In Progress"
},
{
subject:"Schedule client meeting",
taskType:"Sales",
priority:"Medium",
status:"To Do"
},
{
subject:"Check pending invoice",
taskType:"Follow Up",
priority:"High",
status:"In Progress"
},
{
subject:"Prepare weekly report",
taskType:"Sales",
priority:"Low",
status:"To Do"
},
{
subject:"Complete CRM update",
taskType:"Follow Up",
priority:"Medium",
status:"In Progress"
}
].map((task,index)=>({
_id:`default-task-${index+1}`,
...task,
dueDate:new Date(Date.now()+((index+1)*DAY)).toISOString()
}));

const defaultMeetings=[
{
meetingTitle:"Sales Strategy Meeting",
startTime:"9:00 AM",
endTime:"10:00 AM"
},
{
meetingTitle:"Client Presentation",
startTime:"10:00 AM",
endTime:"11:00 AM"
},
{
meetingTitle:"Team Discussion",
startTime:"11:00 AM",
endTime:"12:00 PM"
},
{
meetingTitle:"Project Review",
startTime:"1:00 PM",
endTime:"2:00 PM"
},
{
meetingTitle:"Marketing Sync",
startTime:"2:00 PM",
endTime:"3:00 PM"
},
{
meetingTitle:"Budget Planning",
startTime:"3:00 PM",
endTime:"4:00 PM"
},
{
meetingTitle:"Customer Demo",
startTime:"9:30 AM",
endTime:"10:30 AM"
},
{
meetingTitle:"Weekly Catch Up",
startTime:"10:30 AM",
endTime:"11:30 AM"
},
{
meetingTitle:"Contract Discussion",
startTime:"1:30 PM",
endTime:"2:30 PM"
},
{
meetingTitle:"Performance Review",
startTime:"3:30 PM",
endTime:"4:30 PM"
}
].map((meeting,index)=>({
_id:`default-meeting-${index+1}`,
...meeting,
date:new Date(Date.now()+((index+1)*DAY)).toISOString()
}));

const isCompletedTask=task=>{
const taskStatus=String(task?.status||"")
.trim()
.toLowerCase();

return taskStatus==="completed";
};

const removeCompletedTasks=tasks=>{
if(!Array.isArray(tasks))return[];

return tasks.filter(task=>!isCompletedTask(task));
};

const fillMinimum=(records,defaults)=>{
const validRecords=Array.isArray(records)?records:[];

if(validRecords.length>=MIN_ITEMS){
return validRecords;
}

const existingIds=new Set(
validRecords.map(item=>String(item?._id||""))
);

const availableDefaults=defaults.filter(
item=>!existingIds.has(String(item._id))
);

return[
...validRecords,
...availableDefaults.slice(
0,
MIN_ITEMS-validRecords.length
)
];
};

export function useDashboard(){
const[stats,setStats]=useState({
tasks:defaultTasks,
meetings:defaultMeetings
});

const[loading,setLoading]=useState(true);
const[error,setError]=useState(null);

const fetchStats=useCallback(async()=>{
setLoading(true);
setError(null);

try{
const{data}=await api.get("/api/dashboard/stats");

const activeTasks=removeCompletedTasks(
data?.tasksList
);

setStats({
tasks:fillMinimum(
activeTasks,
defaultTasks
),
meetings:fillMinimum(
data?.meetings,
defaultMeetings
)
});
}catch(err){
console.error(
"Dashboard fetch error:",
err
);

setStats({
tasks:defaultTasks,
meetings:defaultMeetings
});

setError(
err?.response?.data?.error||""
);
}finally{
setLoading(false);
}
},[]);

useEffect(()=>{
fetchStats();
},[fetchStats]);

return{
stats,
loading,
error,
refetch:fetchStats
};
}

export default useDashboard;