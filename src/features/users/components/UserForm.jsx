import {useEffect,useMemo,useState} from "react";
import {FaEye,FaEyeSlash} from "react-icons/fa";
import Select from "react-select";
import api from "../../../services/api";
import {getSelectProps} from "../../../components/select/selectConfig";
import FormDrawer from "../../../components/form/FormDrawer";
import FormSection from "../../../components/form/FormSection";
import AvatarUploader from "../../../components/form/AvatarUploader";
import PhAddressFields from "../../../components/form/PhAddressFields";
import {FormLabel,FormInput} from "../../../components/form/FormField";

const ROLE_OPTIONS=[
  {label:"Sales Manager",value:"Sales Manager"},
  {label:"Sales Agent",value:"Sales Agent"},
  {label:"Support Staff",value:"Support Staff"},
];

const unwrapTeams=data=>{
  if(Array.isArray(data))return data;
  if(Array.isArray(data?.data))return data.data;
  if(Array.isArray(data?.teams))return data.teams;
  return[];
};

export default function UserForm({
  open,
  editingUser,
  formData,
  addressCodes,
  preview,
  loading,
  showPassword,
  setShowPassword,
  showConfirmPassword,
  setShowConfirmPassword,
  onChange,
  onAddressSelect,
  onAvatarChange,
  onClearAvatar,
  onSubmit,
  onClose,
  onCancel,
  teams:providedTeams=[],
}){
  const[fetchedTeams,setFetchedTeams]=useState([]);
  const[teamsLoading,setTeamsLoading]=useState(false);
  const role=formData.role;
  const showTeamField=role==="Sales Agent";

  useEffect(()=>{
    if(!open||!showTeamField||providedTeams.length)return;

    let active=true;

    const fetchTeams=async()=>{
      setTeamsLoading(true);

      try{
        const response=await api.get("/api/teams");
        if(active)setFetchedTeams(unwrapTeams(response.data));
      }catch(error){
        console.error("Fetch teams error:",error);
        if(active)setFetchedTeams([]);
      }finally{
        if(active)setTeamsLoading(false);
      }
    };

    fetchTeams();

    return()=>{
      active=false;
    };
  },[open,showTeamField,providedTeams.length]);

  const teams=providedTeams.length?providedTeams:fetchedTeams;

  const teamOptions=useMemo(()=>{
    if(role!=="Sales Agent")return[];

    return teams
      .filter(team=>team&&team.isActive!==false)
      .map(team=>({
        label:team.name||"Unnamed Team",
        value:team._id||team.id,
      }))
      .filter(option=>option.value);
  },[role,teams]);

  const selectedTeam=
    teamOptions.find(option=>option.value===formData.team)||null;

  const handleRoleChange=option=>{
    const nextRole=option?.value||"";

    onChange({
      target:{
        name:"role",
        value:nextRole,
      },
    });

    if(nextRole!=="Sales Agent"){
      onChange({
        target:{
          name:"team",
          value:"",
        },
      });
    }
  };

  const handleAvatarChange=file=>{
    onChange({
      target:{
        name:"removeProfilePicture",
        value:false,
      },
    });

    onAvatarChange?.(file);
  };

  const handleClearAvatar=()=>{
    onChange({
      target:{
        name:"removeProfilePicture",
        value:true,
      },
    });

    onClearAvatar?.();
  };

  return(
    <FormDrawer
      open={open}
      title={editingUser?"Edit User Account":"Add User Account"}
      formId="user-form"
      loading={loading}
      onClose={onClose}
      onCancel={onCancel}
    >
      <form id="user-form" onSubmit={onSubmit} className="space-y-5">
        <AvatarUploader
          preview={preview}
          onAvatarChange={handleAvatarChange}
          onClearAvatar={handleClearAvatar}
        />

        <FormSection title="Personal Information">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              ["firstName","First Name",true,"e.g. Juan"],
              ["middleName","Middle Name",false,"e.g. Dela"],
              ["lastName","Last Name",true,"e.g. Cruz"],
            ].map(([name,label,required,placeholder])=>(
              <div key={name}>
                <FormLabel required={required}>{label}</FormLabel>
                <FormInput
                  name={name}
                  value={formData[name]||""}
                  onChange={onChange}
                  required={required}
                  placeholder={placeholder}
                  disabled={loading}
                />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <FormLabel>Suffix</FormLabel>
              <FormInput
                name="suffixName"
                value={formData.suffixName||""}
                onChange={onChange}
                placeholder="e.g. Jr., Sr., III"
                disabled={loading}
              />
            </div>

            <div>
              <FormLabel required>Date of Birth</FormLabel>
              <FormInput
                name="birthday"
                value={formData.birthday||""}
                onChange={onChange}
                type="date"
                required
                min="1900-01-01"
                max={new Date().toISOString().split("T")[0]}
                disabled={loading}
              />
            </div>

            <div>
              <FormLabel required>Place of Birth</FormLabel>
              <FormInput
                name="placeOfBirth"
                value={formData.placeOfBirth||""}
                onChange={onChange}
                placeholder="e.g. Legazpi City, Albay"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <FormLabel required>Gender</FormLabel>
              <FormInput
                name="gender"
                value={formData.gender||""}
                onChange={onChange}
                placeholder="e.g. Male, Female"
                required
                disabled={loading}
              />
            </div>

            <div>
              <FormLabel required>Contact Number</FormLabel>
              <FormInput
                name="phone"
                value={formData.phone||""}
                onChange={onChange}
                type="tel"
                placeholder="e.g. 09123456789"
                required
                disabled={loading}
              />
            </div>
          </div>
        </FormSection>

        <FormSection title="Address Information">
          <PhAddressFields
            formData={formData}
            addressCodes={addressCodes}
            onAddressSelect={onAddressSelect}
            onChange={onChange}
          />
        </FormSection>

        <FormSection title="Account Creation">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <FormLabel required>Email</FormLabel>
              <FormInput
                name="email"
                value={formData.email||""}
                onChange={onChange}
                type="email"
                placeholder="e.g. juan@email.com"
                required
                disabled={loading}
              />
            </div>

            <div>
              <FormLabel required>Select Role</FormLabel>
              <Select
                {...getSelectProps({isSearchable:false})}
                options={ROLE_OPTIONS}
                value={
                  formData.role
                    ?{
                      label:formData.role,
                      value:formData.role,
                    }
                    :null
                }
                onChange={handleRoleChange}
                placeholder="Select role"
                isDisabled={loading}
              />
            </div>
          </div>

          {showTeamField&&(
            <div>
              <FormLabel>Assign to Team (Optional)</FormLabel>
              <Select
                {...getSelectProps({isSearchable:true})}
                options={teamOptions}
                value={selectedTeam}
                onChange={option=>
                  onChange({
                    target:{
                      name:"team",
                      value:option?.value||"",
                    },
                  })
                }
                placeholder={teamsLoading?"Loading teams...":"Select a team..."}
                isLoading={teamsLoading}
                isDisabled={loading||teamsLoading}
                isClearable
                noOptionsMessage={()=>teamsLoading?"Loading teams...":"No teams available"}
              />
            </div>
          )}

          {!editingUser&&(
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <FormLabel required>Password</FormLabel>
                <div className="relative">
                  <FormInput
                    name="password"
                    value={formData.password||""}
                    onChange={onChange}
                    type={showPassword?"text":"password"}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    disabled={loading}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
                  />
                  <button
                    type="button"
                    onClick={()=>setShowPassword(previous=>!previous)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-400 hover:text-gray-600"
                    aria-label={showPassword?"Hide password":"Show password"}
                  >
                    {showPassword?<FaEye size={14}/>:<FaEyeSlash size={14}/>}
                  </button>
                </div>
              </div>

              <div>
                <FormLabel required>Confirm Password</FormLabel>
                <div className="relative">
                  <FormInput
                    name="confirmPassword"
                    value={formData.confirmPassword||""}
                    onChange={onChange}
                    type={showConfirmPassword?"text":"password"}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    disabled={loading}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
                  />
                  <button
                    type="button"
                    onClick={()=>setShowConfirmPassword(previous=>!previous)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-400 hover:text-gray-600"
                    aria-label={showConfirmPassword?"Hide password":"Show password"}
                  >
                    {showConfirmPassword?<FaEye size={14}/>:<FaEyeSlash size={14}/>}
                  </button>
                </div>
              </div>
            </div>
          )}
        </FormSection>
      </form>
    </FormDrawer>
  );
}