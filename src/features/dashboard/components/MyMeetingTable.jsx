import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

import {
  CalendarDays,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Clock,
  UserRound,
  Video,
  Check,
  Paperclip,
  ExternalLink,
  Video as ZoomIcon,
  MapPin,
} from "lucide-react";

const VISIBLE_CARDS = 4;
const CLONE_COUNT = 4;
const ALL_VALUES = "all";
const NO_VALUE = "__no_value__";

// Updated meeting status options including "In Progress"
const MEETING_STATUS_OPTIONS = [
  "Scheduled",
  "In Progress",
  "Completed",
  "Cancelled",
  "Rescheduled",
];

// Color styling system with Scheduled as orange and In Progress as blue
const STATUS_STYLES = {
  Scheduled: { bg: "bg-orange-50", text: "text-orange-600", border: "border-orange-400", dot: "bg-orange-600" },
  "In Progress": { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-400", dot: "bg-blue-600" },
  Completed: { bg: "bg-green-50", text: "text-green-600", border: "border-green-400", dot: "bg-green-600" },
  Cancelled: { bg: "bg-red-50", text: "text-red-600", border: "border-red-400", dot: "bg-red-600" },
  Rescheduled: { bg: "bg-purple-50", text: "text-purple-600", border: "border-purple-400", dot: "bg-purple-600" },
};

const clamp = (value, minimum, maximum) =>
  Math.min(maximum, Math.max(minimum, value));

const getMeetingTitle = (m) =>
  m?.title || m?.meetingTitle || m?.subject || m?.name || "Untitled Meeting";

const getMeetingType = (m) =>
  m?.meetingType || m?.type || m?.category || m?.kind || "Meeting";

const getMeetingStatus = (m) =>
  m?.status || m?.meetingStatus || m?.state || "Scheduled";

const getMeetingLink = (m) =>
  m?.meetingLink || m?.link || m?.url || m?.location || m?.venue || "";

const getMeetingFiles = (m) => {
  const files = m?.files || m?.attachments || m?.documents || [];
  if (Array.isArray(files)) return files;
  if (typeof files === "string" && files.trim()) return [files];
  return [];
};

const isUrlString = (str) => {
  if (typeof str !== "string") return false;
  return str.startsWith("http://") || str.startsWith("https://") || str.includes("www.") || str.includes(".com");
};

const getObjectName = (record) => {
  if (!record || typeof record !== "object") return "";
  const directName =
    record.name ||
    record.fullName ||
    record.clientName ||
    record.customerName ||
    record.companyName ||
    record.businessName ||
    record.organizationName;

  if (directName && String(directName).trim()) return String(directName).trim();

  return [record.firstName, record.middleName, record.middleInitial, record.lastName, record.suffix]
    .filter(Boolean)
    .join(" ")
    .trim();
};

const getClientName = (m) => {
  const directClientName =
    m?.clientName || m?.customerName || m?.contactName || m?.companyName || m?.prospectName || m?.leadName;

  if (typeof directClientName === "string" && directClientName.trim()) {
    return directClientName.trim();
  }

  const possibleRecords = [m?.client, m?.customer, m?.contact, m?.prospect, m?.lead, m?.relatedTo];

  for (const record of possibleRecords) {
    if (typeof record === "string" && record.trim()) return record.trim();
    const recordName = getObjectName(record);
    if (recordName) return recordName;
  }

  return "No client assigned";
};

const getMeetingDateValue = (m) =>
  m?.meetingDate || m?.date || m?.scheduledDate || m?.startDate || null;

const getMeetingTimeValue = (m) =>
  m?.startTime || m?.time || m?.meetingTime || m?.scheduledTime || "";

const parseTime = (value) => {
  if (!value) return null;
  const normalizedTime = String(value).trim();
  const twelveHourMatch = normalizedTime.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)$/i);

  if (twelveHourMatch) {
    let hours = Number(twelveHourMatch[1]);
    const minutes = Number(twelveHourMatch[2]);
    const seconds = Number(twelveHourMatch[3] || 0);
    const period = twelveHourMatch[4].toUpperCase();

    if (period === "AM" && hours === 12) hours = 0;
    if (period === "PM" && hours !== 12) hours += 12;

    return { hours, minutes, seconds };
  }

  const twentyFourHourMatch = normalizedTime.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (twentyFourHourMatch) {
    return {
      hours: Number(twentyFourHourMatch[1]),
      minutes: Number(twentyFourHourMatch[2]),
      seconds: Number(twentyFourHourMatch[3] || 0),
    };
  }

  return null;
};

const parseDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : new Date(value.getTime());

  let normalizedDate = String(value).trim();
  if (normalizedDate.includes("T")) {
    normalizedDate = normalizedDate.split("T")[0];
  }

  const dateOnlyMatch = normalizedDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (dateOnlyMatch) {
    const parsedDate = new Date(Number(dateOnlyMatch[1]), Number(dateOnlyMatch[2]) - 1, Number(dateOnlyMatch[3]));
    return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
  }

  const parsedDate = new Date(normalizedDate);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
};

const getMeetingTimeParts = (m) => {
  const parsedTime = parseTime(getMeetingTimeValue(m));
  if (parsedTime) return parsedTime;

  const dateValue = getMeetingDateValue(m);
  if (typeof dateValue === "string" && dateValue.includes("T")) {
    const parsedDate = parseDate(dateValue);
    if (parsedDate) {
      return { hours: parsedDate.getHours(), minutes: parsedDate.getMinutes(), seconds: parsedDate.getSeconds() };
    }
  }

  return null;
};

const getMeetingTimeKey = (m) => {
  const timeParts = getMeetingTimeParts(m);
  if (!timeParts) return NO_VALUE;
  return `${String(timeParts.hours).padStart(2, "0")}:${String(timeParts.minutes).padStart(2, "0")}`;
};

const formatMeetingTimeKey = (timeKey) => {
  if (timeKey === NO_VALUE) return "No Time";
  const parsedTime = parseTime(timeKey);
  if (!parsedTime) return timeKey;

  const temporaryDate = new Date();
  temporaryDate.setHours(parsedTime.hours, parsedTime.minutes, parsedTime.seconds, 0);

  return temporaryDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
};

const getMeetingTimestamp = (m) => {
  const parsedDate = parseDate(getMeetingDateValue(m));
  if (!parsedDate) return Number.MAX_SAFE_INTEGER;

  const parsedTime = getMeetingTimeParts(m);
  if (parsedTime) {
    parsedDate.setHours(parsedTime.hours, parsedTime.minutes, parsedTime.seconds, 0);
  }

  return parsedDate.getTime();
};

const formatMeetingDate = (m) => {
  const parsedDate = parseDate(getMeetingDateValue(m));
  if (!parsedDate) return "No Date";
  const year = parsedDate.getFullYear();
  const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
  const day = String(parsedDate.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatMeetingTime = (m) => formatMeetingTimeKey(getMeetingTimeKey(m));

const normalizeStatus = (value) => {
  const normalizedStatus = String(value || "").trim();
  if (!normalizedStatus) return "Scheduled";
  const found = MEETING_STATUS_OPTIONS.find(
    (opt) => opt.toLowerCase() === normalizedStatus.toLowerCase()
  );
  return found || normalizedStatus;
};

function ColorPillMeetingStatusDropdown({ currentStatus, onSelect, scale }) {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ bottom: 0, left: 0 });
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);

  const updatePosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setCoords({
        bottom: window.innerHeight - rect.top + 4,
        left: rect.right + window.scrollX - 156,
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      window.addEventListener("scroll", updatePosition, true);
      window.addEventListener("resize", updatePosition);
    }
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        buttonRef.current &&
        !buttonRef.current.contains(event.target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleDropdown = (e) => {
    e.stopPropagation();
    setIsOpen((prev) => !prev);
  };

  const currentStyle = STATUS_STYLES[currentStatus] || STATUS_STYLES.Scheduled;
  const ChevronIcon = isOpen ? ChevronDown : ChevronUp;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggleDropdown}
        className={`inline-flex items-center gap-1.5 rounded-full border ${currentStyle.border} ${currentStyle.bg} transition-all hover:opacity-80 focus:outline-none`}
        style={{
          padding: `${clamp(3 * scale, 2, 4)}px ${clamp(10 * scale, 6, 10)}px`,
        }}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${currentStyle.dot}`} />
        <span
          className={`font-normal uppercase tracking-wide ${currentStyle.text}`}
          style={{ fontSize: `${clamp(10 * scale, 7, 10)}px` }}
        >
          {currentStatus}
        </span>
        <ChevronIcon size={clamp(12 * scale, 9, 12)} className={currentStyle.text} />
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{
              position: "fixed",
              bottom: `${coords.bottom}px`,
              left: `${coords.left}px`,
              zIndex: 999999,
            }}
            className="w-36 overflow-hidden rounded-2xl border border-slate-100 bg-white p-1.5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col gap-1">
              {MEETING_STATUS_OPTIONS.map((status) => {
                const isSelected = status === currentStatus;
                const optStyle = STATUS_STYLES[status] || STATUS_STYLES.Scheduled;

                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() => {
                      onSelect(status);
                      setIsOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 transition-colors ${
                      isSelected ? "bg-slate-100" : "hover:bg-slate-50"
                    }`}
                  >
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border ${optStyle.border} ${optStyle.bg} px-2 py-0.5`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${optStyle.dot}`} />
                      <span className={`text-[10px] font-normal uppercase tracking-wide ${optStyle.text}`}>
                        {status}
                      </span>
                    </span>
                    {isSelected && <Check size={12} className={optStyle.text} />}
                  </button>
                );
              })}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

function HeaderFilterDropdown({
  icon: Icon,
  ariaLabel,
  value,
  options,
  onChange,
  minimumWidth = 145,
  isStatusFilter = false,
}) {
  const containerRef = useRef(null);
  const [open, setOpen] = useState(false);

  const selectedOption =
    options.find((opt) => opt.value === value) || options[0];

  useEffect(() => {
    if (!options.length) return;

    const valueStillExists = options.some((option) => option.value === value);
    if (!valueStillExists) {
      onChange(options[0].value);
    }
  }, [onChange, options, value]);

  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const activeStyle = isStatusFilter && value !== ALL_VALUES && STATUS_STYLES[value];

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label={ariaLabel}
        aria-expanded={open}
        disabled={!options.length}
        onClick={() => setOpen((prev) => !prev)}
        className={`inline-flex items-center justify-between gap-2 rounded-lg border bg-white px-3 py-1.5 text-xs font-medium shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${
          open
            ? "border-red-500/50 text-red-600"
            : "border-black/10 text-black/65 hover:border-red-500/30"
        }`}
        style={{ minWidth: `${minimumWidth}px` }}
      >
        <span className="flex min-w-0 items-center gap-1.5">
          {activeStyle ? (
            <span className={`inline-flex items-center gap-1.5 rounded-full border ${activeStyle.border} ${activeStyle.bg} px-2 py-0.5`}>
              <span className={`h-1.5 w-1.5 rounded-full ${activeStyle.dot}`} />
              <span className={`text-[10px] font-normal uppercase tracking-wide ${activeStyle.text}`}>
                {selectedOption?.label}
              </span>
            </span>
          ) : (
            <>
              <Icon size={14} className="shrink-0 text-red-600" />
              <span className="truncate">{selectedOption?.label}</span>
            </>
          )}
        </span>
        <ChevronDown
          size={14}
          className={`shrink-0 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1.5 w-48 overflow-hidden rounded-xl border border-black/10 bg-white p-1.5 shadow-lg">
          <p className="px-2.5 pb-1.5 pt-1 text-[11px] font-medium text-black/40">
            Select option
          </p>
          <div className="max-h-56 overflow-y-auto space-y-1">
            {options.map((opt) => {
              const selected = opt.value === value;
              const optStyle = STATUS_STYLES[opt.value];

              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition ${
                    selected ? "bg-black/5 font-semibold" : "text-black/65 hover:bg-black/5"
                  }`}
                >
                  {optStyle ? (
                    <span className={`inline-flex items-center gap-1.5 rounded-full border ${optStyle.border} ${optStyle.bg} px-2 py-0.5`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${optStyle.dot}`} />
                      <span className={`text-[10px] font-normal uppercase tracking-wide ${optStyle.text}`}>
                        {opt.label}
                      </span>
                    </span>
                  ) : (
                    <span className="truncate">{opt.label}</span>
                  )}
                  {selected && (
                    <Check size={14} className="shrink-0 text-red-600" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function MyMeetingsTable({ meetings = [], hideFilter = false, onStatusChange, currentUserId, isSuperAdmin = false }) {
  const viewportRef = useRef(null);
  const movingRef = useRef(false);
  const touchStartRef = useRef(null);
  const resizeFrameRef = useRef(null);

  const [index, setIndex] = useState(0);
  const [animated, setAnimated] = useState(false);
  const [hoveredSide, setHoveredSide] = useState(null);

  const [selectedStatus, setSelectedStatus] = useState(ALL_VALUES);
  const [selectedTime, setSelectedTime] = useState(ALL_VALUES);
  const [localMeetingStatuses, setLocalMeetingStatuses] = useState({});

  const [layout, setLayout] = useState({ cardWidth: 0, cardHeight: 225, gap: 16, scale: 1 });

  const handleStatusUpdate = (meeting, newStatus) => {
    const meetingId = meeting?._id || meeting?.id;
    if (meetingId) {
      setLocalMeetingStatuses((prev) => ({ ...prev, [meetingId]: newStatus }));
    }
    if (onStatusChange) {
      onStatusChange(meeting, newStatus);
    }
  };

  const getUserIdFromValue = (value) => {
    if (!value) return "";
    if (typeof value === "string") return value;
    if (typeof value === "number") return String(value);
    if (typeof value === "object") {
      return (
        value._id ||
        value.id ||
        value.userId ||
        value.user?.id ||
        value.user?._id ||
        value.uid ||
        ""
      );
    }
    return "";
  };

  const userRelatedMeetings = useMemo(() => {
    if (isSuperAdmin || !currentUserId) return meetings;

    return meetings.filter((m) => {
      const creatorId = getUserIdFromValue(m?.userId || m?.createdBy || m?.creator || m?.creator?.user);
      const hostId = getUserIdFromValue(m?.host || m?.organizer || m?.host?.user || m?.organizer?.user);
      const assignedUsers = m?.assignedTo || m?.participants || m?.attendees || [];
      
      const isCreator = creatorId && String(creatorId) === String(currentUserId);
      const isHost = hostId && String(hostId) === String(currentUserId);
      const isParticipant = Array.isArray(assignedUsers)
        ? assignedUsers.some((u) => {
            const uId = getUserIdFromValue(u);
            return String(uId) === String(currentUserId);
          })
        : false;

      const assignedUserId = getUserIdFromValue(assignedUsers);

      return isCreator || isHost || isParticipant || String(assignedUserId) === String(currentUserId);
    });
  }, [meetings, currentUserId, isSuperAdmin]);

  const statusOptions = useMemo(() => {
    return [
      { value: ALL_VALUES, label: "All Statuses" },
      ...MEETING_STATUS_OPTIONS.map((status) => ({ value: status, label: status })),
    ];
  }, []);

  const timeOptions = useMemo(() => {
    const uniqueTimes = [...new Set(userRelatedMeetings.map((m) => getMeetingTimeKey(m)))].sort((a, b) => {
      if (a === NO_VALUE) return 1;
      if (b === NO_VALUE) return -1;
      return a.localeCompare(b);
    });

    return [
      { value: ALL_VALUES, label: "All Times" },
      ...uniqueTimes.map((t) => ({ value: t, label: formatMeetingTimeKey(t) })),
    ];
  }, [userRelatedMeetings]);

  useEffect(() => {
    if (!statusOptions.some((opt) => opt.value === selectedStatus)) setSelectedStatus(ALL_VALUES);
  }, [selectedStatus, statusOptions]);

  useEffect(() => {
    if (!timeOptions.some((opt) => opt.value === selectedTime)) setSelectedTime(ALL_VALUES);
  }, [selectedTime, timeOptions]);

  const filteredMeetings = useMemo(() => {
    if (hideFilter) return userRelatedMeetings;
    return userRelatedMeetings.filter((m) => {
      const meetingId = m?._id || m?.id;
      const currentStatus = localMeetingStatuses[meetingId]
        ? normalizeStatus(localMeetingStatuses[meetingId])
        : normalizeStatus(getMeetingStatus(m));

      const statusMatch = selectedStatus === ALL_VALUES || currentStatus.toLowerCase() === selectedStatus.toLowerCase();
      const timeMatch = selectedTime === ALL_VALUES || getMeetingTimeKey(m) === selectedTime;

      return statusMatch && timeMatch;
    });
  }, [userRelatedMeetings, localMeetingStatuses, selectedStatus, selectedTime, hideFilter]);

  const sortedMeetings = useMemo(() => {
    return [...filteredMeetings].sort((a, b) => {
      const timeA = getMeetingTimestamp(a);
      const timeB = getMeetingTimestamp(b);

      if (timeA !== timeB) return timeA - timeB;
      return getMeetingTitle(a).localeCompare(getMeetingTitle(b));
    });
  }, [filteredMeetings]);

  const items = sortedMeetings;
  const carouselEnabled = items.length > VISIBLE_CARDS;
  const cloneCount = carouselEnabled ? Math.min(CLONE_COUNT, items.length) : 0;

  const cards = useMemo(() => {
    if (!items.length) return [];
    if (!carouselEnabled) return items;
    return [...items.slice(-cloneCount), ...items, ...items.slice(0, cloneCount)];
  }, [items, carouselEnabled, cloneCount]);

  const itemsSignature = useMemo(
    () => items.map((m) => `${m?._id || m?.id || getMeetingTitle(m)}-${getMeetingTimestamp(m)}`).join("|"),
    [items],
  );

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return undefined;

    const measure = () => {
      if (resizeFrameRef.current) window.cancelAnimationFrame(resizeFrameRef.current);
      resizeFrameRef.current = window.requestAnimationFrame(() => {
        const availableWidth = viewport.getBoundingClientRect().width;
        if (availableWidth <= 0) return;

        const gap = clamp(availableWidth * 0.012, 7, 16);
        const cardWidth = (availableWidth - gap * (VISIBLE_CARDS - 1)) / VISIBLE_CARDS;
        const scale = clamp(cardWidth / 290, 0.5, 1);

        setAnimated(false);
        setLayout({
          cardWidth: Math.max(0, cardWidth),
          cardHeight: clamp(225 * scale, 160, 235),
          gap,
          scale,
        });

        window.requestAnimationFrame(() => setAnimated(true));
      });
    };

    measure();
    let observer;
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(measure);
      observer.observe(viewport);
    }

    window.addEventListener("resize", measure);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", measure);
      if (resizeFrameRef.current) window.cancelAnimationFrame(resizeFrameRef.current);
    };
  }, [items.length]);

  useLayoutEffect(() => {
    movingRef.current = false;
    setAnimated(false);
    setIndex(cloneCount);

    let secondFrame;
    const firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(() => setIndex(cloneCount));
    });

    return () => {
      window.cancelAnimationFrame(firstFrame);
      if (secondFrame) window.cancelAnimationFrame(secondFrame);
    };
  }, [items.length, itemsSignature, cloneCount]);

  const move = (direction) => {
    if (!carouselEnabled || !items.length || !layout.cardWidth || movingRef.current) return;
    movingRef.current = true;
    setAnimated(true);
    setIndex((prev) => prev + direction);
  };

  const finishMove = () => {
    if (!carouselEnabled || !items.length) {
      movingRef.current = false;
      return;
    }
    if (index >= cloneCount + items.length) {
      setAnimated(false);
      setIndex(index - items.length);
    } else if (index < cloneCount) {
      setAnimated(false);
      setIndex(index + items.length);
    }
    movingRef.current = false;
  };

  const handleTouchStart = (e) => {
    if (!carouselEnabled) return;
    touchStartRef.current = e.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (e) => {
    if (!carouselEnabled || touchStartRef.current === null) return;
    const endX = e.changedTouches[0]?.clientX ?? touchStartRef.current;
    const diff = touchStartRef.current - endX;
    touchStartRef.current = null;
    if (Math.abs(diff) < 30) return;
    move(diff > 0 ? 1 : -1);
  };

  const { cardWidth, cardHeight, gap, scale } = layout;
  const translate = index * (cardWidth + gap);

  const padding = clamp(17 * scale, 8, 17);
  const iconSize = clamp(17 * scale, 10, 17);
  const typeSize = clamp(10 * scale, 6, 10);
  const titleSize = clamp(14 * scale, 8, 14);
  const clientSize = clamp(11 * scale, 7, 11);
  const metaSize = clamp(10 * scale, 6, 10);
  const smallIconSize = clamp(11 * scale, 7, 11);
  const arrowIconSize = clamp(22 * scale, 17, 22);
  const arrowButtonSize = clamp(42 * scale, 34, 42);
  const hoverZone = clamp(72 * scale, 48, 72);

  return (
    <div className="w-full min-w-0">
      {!hideFilter && (
        <div className="mb-4 mt-2 flex w-full flex-wrap justify-end gap-2">
          <HeaderFilterDropdown
            icon={Clock}
            ariaLabel="Filter meetings by status"
            value={selectedStatus}
            options={statusOptions}
            onChange={setSelectedStatus}
            minimumWidth={145}
            isStatusFilter={true}
          />
          <HeaderFilterDropdown
            icon={Clock}
            ariaLabel="Filter meetings by time"
            value={selectedTime}
            options={timeOptions}
            onChange={setSelectedTime}
            minimumWidth={130}
          />
        </div>
      )}

      {!items.length ? (
        <div className="flex h-36 w-full items-center justify-center rounded-xl border border-black/10 bg-white text-sm text-black/40">
          {meetings.length ? "No meetings match your account" : "No meetings scheduled"}
        </div>
      ) : (
        <div
          className="relative w-full min-w-0"
          style={{ touchAction: "pan-y" }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {carouselEnabled && (
            <>
              <div
                className="absolute inset-y-2 left-0 z-30 flex items-center justify-start"
                style={{ width: `${hoverZone}px` }}
                onMouseEnter={() => setHoveredSide("left")}
                onMouseLeave={() => setHoveredSide(null)}
              >
                <button
                  type="button"
                  aria-label="Previous meeting"
                  onClick={() => move(-1)}
                  className={`flex items-center justify-center rounded-full border border-black/10 bg-white text-black/65 shadow-[0_6px_18px_rgba(0,0,0,0.15)] transition-all duration-200 hover:border-red-500/40 hover:text-red-600 ${
                    hoveredSide === "left"
                      ? "pointer-events-auto translate-x-1 opacity-100"
                      : "pointer-events-none -translate-x-2 opacity-0"
                  }`}
                  style={{ width: `${arrowButtonSize}px`, height: `${arrowButtonSize}px` }}
                >
                  <ChevronLeft size={arrowIconSize} strokeWidth={2.4} />
                </button>
              </div>

              <div
                className="absolute inset-y-2 right-0 z-30 flex items-center justify-end"
                style={{ width: `${hoverZone}px` }}
                onMouseEnter={() => setHoveredSide("right")}
                onMouseLeave={() => setHoveredSide(null)}
              >
                <button
                  type="button"
                  aria-label="Next meeting"
                  onClick={() => move(1)}
                  className={`flex items-center justify-center rounded-full border border-black/10 bg-white text-black/65 shadow-[0_6px_18px_rgba(0,0,0,0.15)] transition-all duration-200 hover:border-red-500/40 hover:text-red-600 ${
                    hoveredSide === "right"
                      ? "pointer-events-auto -translate-x-1 opacity-100"
                      : "pointer-events-none translate-x-2 opacity-0"
                  }`}
                  style={{ width: `${arrowButtonSize}px`, height: `${arrowButtonSize}px` }}
                >
                  <ChevronRight size={arrowIconSize} strokeWidth={2.4} />
                </button>
              </div>
            </>
          )}

          <div ref={viewportRef} className="w-full min-w-0 py-2">
            <div
              className="flex"
              onTransitionEnd={(e) => e.target === e.currentTarget && finishMove()}
              style={{
                gap: `${gap}px`,
                transform: `translate3d(-${translate}px, 0, 0)`,
                transition: animated ? "transform 350ms ease" : "none",
                visibility: cardWidth > 0 ? "visible" : "hidden",
                willChange: "transform",
              }}
            >
              {cards.map((meeting, itemIndex) => {
                const meetingId = meeting?._id || meeting?.id;
                const clientName = getClientName(meeting);
                const meetingType = getMeetingType(meeting);
                const meetingLink = getMeetingLink(meeting);
                const meetingFiles = getMeetingFiles(meeting);
                const currentStatus = localMeetingStatuses[meetingId]
                  ? normalizeStatus(localMeetingStatuses[meetingId])
                  : normalizeStatus(getMeetingStatus(meeting));

                return (
                  <article
                    key={`${meetingId || "meeting"}-${itemIndex}`}
                    className="group relative box-border min-w-0 shrink-0 rounded-2xl border border-black/[0.08] bg-white shadow-[0_4px_14px_rgba(0,0,0,0.05)] transition-all duration-200 hover:border-red-500/25 hover:shadow-[0_6px_18px_rgba(0,0,0,0.08)]"
                    style={{ width: `${cardWidth}px`, height: `${cardHeight}px`, padding: `${padding}px` }}
                  >
                    <span className="absolute bottom-0 left-5 right-5 h-0.5 rounded-full bg-red-500 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />

                    <div className="flex h-full min-w-0 flex-col">
                      <div className="min-w-0">
                        <div className="flex min-w-0 items-center justify-between" style={{ gap: `${clamp(7 * scale, 4, 7)}px` }}>
                          <div className="flex min-w-0 items-center" style={{ gap: `${clamp(7 * scale, 4, 7)}px` }}>
                            <Video size={iconSize} strokeWidth={2} className="shrink-0 text-red-600" />
                            <p className="min-w-0 truncate font-semibold uppercase tracking-[0.05em] text-red-600" style={{ fontSize: `${typeSize}px`, lineHeight: 1 }}>
                              {meetingType}
                            </p>
                          </div>
                        </div>

                        <h3 className="line-clamp-2 min-w-0 font-semibold text-black/85" style={{ marginTop: `${clamp(9 * scale, 5, 9)}px`, fontSize: `${titleSize}px`, lineHeight: 1.35 }}>
                          {getMeetingTitle(meeting)}
                        </h3>
                      </div>

                      <div className="flex min-w-0 items-center text-black/50" style={{ gap: `${clamp(6 * scale, 3, 6)}px`, marginTop: `${clamp(6 * scale, 3, 6)}px`, fontSize: `${clientSize}px` }}>
                        <UserRound size={smallIconSize} className="shrink-0 text-red-600" />
                        <span className="truncate" title={clientName}>{clientName}</span>
                      </div>

                      <div className="mt-auto flex flex-col gap-1.5 min-w-0">
                        {/* MEETING LINK DISPLAY WITH ZOOM ICON */}
                        {meetingLink && (
                          <div className="min-w-0 flex flex-col">
                            {isUrlString(meetingLink) ? (
                              <a
                                href={meetingLink.startsWith("http") ? meetingLink : `https://${meetingLink}`}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex max-w-full items-center gap-1.5 truncate rounded-lg border border-purple-500/20 bg-purple-500/[0.03] px-2.5 py-1 text-xs text-purple-600 hover:bg-purple-500/[0.08] transition"
                                style={{ fontSize: `${clamp(11 * scale, 8, 11)}px` }}
                                title={meetingLink}
                              >
                                <ZoomIcon size={12} className="shrink-0 text-purple-600" />
                                <span className="truncate">{meetingLink}</span>
                              </a>
                            ) : (
                              <div
                                className="inline-flex max-w-full items-center gap-1.5 truncate rounded-lg border border-black/10 bg-black/[0.02] px-2.5 py-1 text-xs text-black/70"
                                style={{ fontSize: `${clamp(11 * scale, 8, 11)}px` }}
                                title={meetingLink}
                              >
                                <MapPin size={12} className="shrink-0 text-black/50" />
                                <span className="truncate">{meetingLink}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* FILE ATTACHMENTS DISPLAY MATCHING TASKS */}
                        {meetingFiles.length > 0 && (
                          <div className="flex flex-col gap-1 min-w-0">
                            {meetingFiles.map((file, fileIdx) => {
                              const fileName = typeof file === "string" ? file.split("/").pop() || file : file?.name || "Attachment";
                              const fileUrl = typeof file === "string" ? file : file?.url || file?.link || "#";
                              return (
                                <a
                                  key={fileIdx}
                                  href={fileUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex max-w-full items-center gap-1.5 truncate rounded-lg border border-black/10 bg-black/[0.02] px-2.5 py-1 text-xs text-black/70 hover:bg-black/[0.05] transition"
                                  style={{ fontSize: `${clamp(11 * scale, 8, 11)}px` }}
                                  title={fileName}
                                >
                                  <Paperclip size={12} className="shrink-0 text-black/50" />
                                  <span className="truncate">{fileName}</span>
                                </a>
                              );
                            })}
                          </div>
                        )}

                        <div className="border-t border-black/[0.08] pt-2 mt-1">
                          <div className="flex min-w-0 items-center justify-between gap-2">
                            <div className="flex min-w-0 flex-1 flex-col text-black/45" style={{ gap: `${clamp(2 * scale, 1, 3)}px`, fontSize: `${metaSize}px` }}>
                              <div className="flex min-w-0 items-center" style={{ gap: `${clamp(5 * scale, 2, 5)}px` }}>
                                <CalendarDays size={smallIconSize} className="shrink-0" />
                                <span className="truncate">{formatMeetingDate(meeting)}</span>
                              </div>
                              <div className="flex min-w-0 items-center" style={{ gap: `${clamp(5 * scale, 2, 5)}px` }}>
                                <Clock size={smallIconSize} className="shrink-0" />
                                <span className="truncate">{formatMeetingTime(meeting)}</span>
                              </div>
                            </div>

                            <div className="shrink-0">
                              <ColorPillMeetingStatusDropdown
                                currentStatus={currentStatus}
                                onSelect={(status) => handleStatusUpdate(meeting, status)}
                                scale={scale}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}