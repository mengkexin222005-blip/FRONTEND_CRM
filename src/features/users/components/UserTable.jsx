import {Pencil,Trash2} from "lucide-react";
import {getProfileImage} from "../../../utils/avatar";
import {getDisplayName} from "../../../utils/name";
import {formatPhone} from "../../../utils/format";
import {
  BaseTable,TableRow,TableCell,TablePagination,useTablePagination,
} from "../../../components/table";

export default function UserTable({
  users=[],
  onEdit,
  onView,
  onDelete,
  isLoading=false,
}){
  const columns=[
    {label:"User ID"},
    {label:"Name"},
    {label:"Email"},
    {label:"Phone"},
    {label:"Role"},
    {label:"Team"},
    {label:"",align:"text-right"},
  ];

  const{
    currentPage,
    rowsPerPage,
    totalRows,
    totalPages,
    paginatedItems,
    pageWindow,
    from,
    to,
    goTo,
    setRowsPerPage,
  }=useTablePagination(users,10);

  if(isLoading){
    return(
      <div className="flex h-full min-h-[180px] items-center justify-center text-sm text-gray-400">
        Loading users...
      </div>
    );
  }

  return(
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 overflow-auto [&_thead]:sticky [&_thead]:top-0 [&_thead]:z-10 [&_thead]:bg-white">
        <BaseTable
          columns={columns}
          empty={paginatedItems.length===0?"No users found.":null}
          colSpan={columns.length}
          heightClass="h-auto"
        >
          {paginatedItems.map(user=>{
            const teamName=
              typeof user.team==="string"
                ?user.team
                :user.team?.name||"—";

            return(
              <TableRow
                key={user._id||user.employeeId}
                onClick={()=>onView?.(user)}
              >
                <TableCell>{user.employeeId||"—"}</TableCell>

                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <img
                      src={getProfileImage(user)}
                      alt={getDisplayName(user)}
                      className="h-7 w-7 shrink-0 rounded-full border border-gray-300 object-cover"
                    />

                    <span className="whitespace-nowrap">
                      {getDisplayName(user,{
                        includeMiddleInitial:true,
                        includeSuffix:true,
                      })}
                    </span>
                  </div>
                </TableCell>

                <TableCell>{user.email||"—"}</TableCell>
                <TableCell>{user.phone?formatPhone(user.phone):"—"}</TableCell>
                <TableCell>{user.role||"—"}</TableCell>

                <TableCell>
                  {teamName==="—"
                    ?<span className="text-gray-400">—</span>
                    :teamName}
                </TableCell>

                <TableCell align="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={event=>{
                        event.stopPropagation();
                        onEdit?.(user);
                      }}
                      className="cursor-pointer rounded-md p-2 text-gray-400 transition hover:bg-gray-100 hover:text-red-500"
                      title="Edit user"
                      aria-label={`Edit ${getDisplayName(user)}`}
                    >
                      <Pencil size={17}/>
                    </button>

                    <button
                      type="button"
                      onClick={event=>{
                        event.stopPropagation();
                        onDelete?.(user);
                      }}
                      className="cursor-pointer rounded-md p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                      title="Delete user"
                      aria-label={`Delete ${getDisplayName(user)}`}
                    >
                      <Trash2 size={17}/>
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </BaseTable>
      </div>

      {totalRows>0&&(
        <div className="shrink-0 border-t border-gray-200 bg-white pt-3">
          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalRows={totalRows}
            rowsPerPage={rowsPerPage}
            from={from}
            to={to}
            pageWindow={pageWindow}
            onGoTo={goTo}
            onRowsPerPageChange={setRowsPerPage}
          />
        </div>
      )}
    </div>
  );
}