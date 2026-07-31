import GenderIcon from "../GenderIcon";

import { getProfileImage } from "../../utils/avatar";
import { getDisplayName } from "../../utils/name";

export default function ViewProfileHero({
  record,
  image,
  title,
  subtitle,
  badge,
}) {
  const profileSrc = image || getProfileImage(record);

  const displayTitle =
    title ||
    getDisplayName(record, {
      includeMiddleInitial: true,
      includeSuffix: true,
    });

  return (
    <div className="flex items-center gap-4">
      <img
        src={profileSrc}
        alt="Profile"
        className="w-20 h-20 rounded-full object-cover border-2 border-gray-200 shrink-0"
      />

      <div>
        <div className="flex items-center gap-1.5">
          <h2 className="text-lg font-semibold text-gray-800 leading-tight">
            {displayTitle}
          </h2>

          {!title && <GenderIcon gender={record?.sex} />}
        </div>

        {subtitle && (
          <p className="text-sm text-gray-500 mt-0.5">
            {subtitle}
          </p>
        )}

        {badge && <div>{badge}</div>}
      </div>
    </div>
  );
}