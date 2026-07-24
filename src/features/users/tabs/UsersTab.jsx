import {useCallback,useMemo,useState} from "react";
import {FaPlus} from "react-icons/fa";
import Select from "react-select";
import {PageHeader,PageToolbar} from "../../../components/page";
import FilterPopover from "../../../components/filters/FilterPopover";
import {useFilterPopover} from "../../../components/filters/useFilterPopover";
import {getSelectProps} from "../../../components/select/selectConfig";
import UserTable from "../components/UserTable";
import UserForm from "../components/UserForm";
import UserView from "../components/UserView";
import EditAccessTab from "./EditAccessTab";
import {useUsers} from "../hooks/useUsers";
import {useUserForm} from "../hooks/useUserForm";

const TAB_STORAGE_KEY="settings_active_tab";
const TABS=["Users","Edit Access"];

const getInitialTab=()=>{
  try{
    const storedTab=sessionStorage.getItem(TAB_STORAGE_KEY);
    return TABS.includes(storedTab)?storedTab:"Users";
  }catch{
    return"Users";
  }
};

export default function UsersTab(){
  const[activeTab,setActiveTab]=useState(getInitialTab);
  const[search,setSearch]=useState("");
  const[viewUser,setViewUser]=useState(null);
  const[filterRole,setFilterRole]=useState(null);
  const[filterTeam,setFilterTeam]=useState(null);
  const[filterStatus,setFilterStatus]=useState(null);

  const{
    users=[],
    loading,
    createUser,
    updateUser,
    deleteUser,
  }=useUsers();

  const{
    formData,
    addressCodes,
    preview,
    avatar,
    setAvatar,
    handleChange,
    handleAddressSelect,
    showPassword,
    setShowPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    showSidePane,
    editingUser,
    openCreateSidePane,
    openEditSidePane,
    resetAndClose,
    validateForm,
    buildUserPayload,
  }=useUserForm();

  const changeTab=tab=>{
    if(!TABS.includes(tab))return;

    setActiveTab(tab);

    try{
      sessionStorage.setItem(TAB_STORAGE_KEY,tab);
    }catch(error){
      console.error("Save active settings tab error:",error);
    }
  };

  const roleOptions=useMemo(
    ()=>[...new Set(users.map(user=>user.role).filter(Boolean))]
      .sort()
      .map(value=>({label:value,value})),
    [users],
  );

  const teamOptions=useMemo(
    ()=>[...new Set(
      users
        .map(user=>
          typeof user.team==="string"
            ?user.team
            :user.team?.name,
        )
        .filter(Boolean),
    )]
      .sort()
      .map(value=>({label:value,value})),
    [users],
  );

  const statusOptions=useMemo(
    ()=>[...new Set(users.map(user=>user.status).filter(Boolean))]
      .sort()
      .map(value=>({label:value,value})),
    [users],
  );

  const clearAllFilters=useCallback(()=>{
    setFilterRole(null);
    setFilterTeam(null);
    setFilterStatus(null);
  },[]);

  const{
    filterOpen,
    setFilterOpen,
    filterRef,
    activeFilterCount,
    clearAllFilters:handleClearFilters,
  }=useFilterPopover(
    {filterRole,filterTeam,filterStatus},
    clearAllFilters,
  );

  const filteredUsers=useMemo(()=>{
    const query=search.trim().toLowerCase();

    return users.filter(user=>{
      const name=[
        user.firstName,
        user.middleName,
        user.lastName,
        user.suffixName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const team=
        typeof user.team==="string"
          ?user.team
          :user.team?.name||"";

      const matchesSearch=
        !query||
        [
          user.employeeId,
          name,
          user.email,
          user.phone,
          user.role,
          team,
          user.status,
        ].some(value=>
          String(value||"")
            .toLowerCase()
            .includes(query),
        );

      const matchesRole=
        !filterRole||
        user.role===filterRole;

      const matchesTeam=
        !filterTeam||
        team===filterTeam;

      const matchesStatus=
        !filterStatus||
        user.status===filterStatus;

      return(
        matchesSearch&&
        matchesRole&&
        matchesTeam&&
        matchesStatus
      );
    });
  },[
    users,
    search,
    filterRole,
    filterTeam,
    filterStatus,
  ]);

  const submit=async event=>{
    event.preventDefault();

    if(!validateForm())return;

    const payload={
      ...buildUserPayload(),
      profilePicture:avatar||null,
    };

    try{
      const result=editingUser
        ?await updateUser(editingUser,payload)
        :await createUser(payload);

      if(result)resetAndClose();
    }catch(error){
      console.error("User form submission error:",error);
    }
  };

  const handleDelete=async user=>{
    const deleted=await deleteUser(user);

    if(
      deleted&&
      viewUser?.employeeId===user.employeeId
    ){
      setViewUser(null);
    }
  };

  return(
    <div className="flex h-full min-h-0 flex-col px-6 py-5">
      <div className="flex shrink-0 gap-11 border-b border-gray-200">
        {TABS.map(tab=>(
          <button
            key={tab}
            type="button"
            onClick={()=>changeTab(tab)}
            className={`relative px-1 pb-4 text-sm font-medium transition-colors ${
              activeTab===tab
                ?"text-red-600"
                :"text-gray-600 hover:text-gray-900"
            }`}
          >
            {tab}

            {activeTab===tab&&(
              <span className="absolute bottom-[-1px] left-0 h-0.5 w-full bg-red-600"/>
            )}
          </button>
        ))}
      </div>

      {activeTab==="Users"&&(
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="mb-4 mt-4 flex shrink-0 flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <PageHeader
              title="Users"
              subtitle="Manage system users and roles"
            />

            <PageToolbar
              searchValue={search}
              onSearchChange={event=>setSearch(event.target.value)}
              searchPlaceholder="Search users..."
              filterSlot={
                <FilterPopover
                  filterRef={filterRef}
                  filterOpen={filterOpen}
                  onToggle={()=>
                    setFilterOpen(previous=>!previous)
                  }
                  activeFilterCount={activeFilterCount}
                  onClearAll={handleClearFilters}
                >
                  <div>
                    <p className="mb-1 text-xs text-gray-400">
                      Role
                    </p>

                    <Select
                      {...getSelectProps({variant:"filter"})}
                      placeholder="All roles"
                      options={roleOptions}
                      value={
                        roleOptions.find(
                          option=>option.value===filterRole,
                        )||null
                      }
                      onChange={option=>
                        setFilterRole(option?.value||null)
                      }
                    />
                  </div>

                  <div>
                    <p className="mb-1 text-xs text-gray-400">
                      Team
                    </p>

                    <Select
                      {...getSelectProps({variant:"filter"})}
                      placeholder="All teams"
                      options={teamOptions}
                      value={
                        teamOptions.find(
                          option=>option.value===filterTeam,
                        )||null
                      }
                      onChange={option=>
                        setFilterTeam(option?.value||null)
                      }
                    />
                  </div>

                  {statusOptions.length>0&&(
                    <div>
                      <p className="mb-1 text-xs text-gray-400">
                        Status
                      </p>

                      <Select
                        {...getSelectProps({variant:"filter"})}
                        placeholder="All statuses"
                        options={statusOptions}
                        value={
                          statusOptions.find(
                            option=>option.value===filterStatus,
                          )||null
                        }
                        onChange={option=>
                          setFilterStatus(option?.value||null)
                        }
                      />
                    </div>
                  )}
                </FilterPopover>
              }
              actionButton={
                <button
                  type="button"
                  onClick={openCreateSidePane}
                  className="min-w-[150px] cursor-pointer rounded-md bg-red-500 px-5 py-2 text-white hover:bg-red-600"
                >
                  <span className="flex items-center justify-center gap-2 whitespace-nowrap text-sm">
                    <FaPlus size={11}/>
                    Add User
                  </span>
                </button>
              }
            />
          </div>

          <div className="min-h-0 flex-1">
            <UserTable
              users={filteredUsers}
              isLoading={loading}
              onEdit={openEditSidePane}
              onView={setViewUser}
              onDelete={handleDelete}
            />
          </div>

          <UserForm
            open={showSidePane}
            editingUser={editingUser}
            formData={formData}
            addressCodes={addressCodes}
            preview={preview}
            loading={loading}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            showConfirmPassword={showConfirmPassword}
            setShowConfirmPassword={setShowConfirmPassword}
            onChange={handleChange}
            onAddressSelect={handleAddressSelect}
            onAvatarChange={setAvatar}
            onClearAvatar={()=>setAvatar(null)}
            onSubmit={submit}
            onClose={resetAndClose}
            onCancel={resetAndClose}
          />

          {viewUser&&(
            <UserView
              user={viewUser}
              onClose={()=>setViewUser(null)}
            />
          )}
        </div>
      )}

      {activeTab==="Edit Access"&&(
        <div className="min-h-0 flex-1 overflow-auto">
          <EditAccessTab/>
        </div>
      )}
    </div>
  );
}