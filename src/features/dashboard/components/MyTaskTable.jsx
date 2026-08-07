import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  ListTodo,
  Mail,
  MessageSquareText,
  Phone,
  UserRound,
  Bell,
  ExternalLink,
  FileText,
  Paperclip,
} from "lucide-react";

import HeaderFilterDropdown from "./HeaderFilterDropdown";
import { getDynamicTaskStatus } from "../hooks/useDashboard";
import { useAuth } from "../../../context/AuthContext";

const VISIBLE_CARDS = 4;
const CLONE_COUNT = 4;
const ALL_TIMES = "all";
const NO_TIME = "__no_time__";

const TASK_STATUS_OPTIONS = ["Pending", "Ongoing", "Due Soon", "Completed", "Overdue"];

const PRIORITY_ORDER = {
  high: 3,
  medium: 2,
  low: 1,
};

const STATUS_STYLES = {
  Pending: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-400", dot: "bg-amber-500" },
  "In Progress": { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-400", dot: "bg-blue-600" },
  Ongoing: { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-400", dot: "bg-blue-600" },
  "Due Soon": { bg: "bg-orange-500/10", text: "text-orange-500", border: "border-orange-500", dot: "bg-orange-500" },
  Completed: { bg: "bg-green-50", text: "text-green-600", border: "border-green-400", dot: "bg-green-600" },
  Overdue: { bg: "bg-red-50", text: "text-red-600", border: "border-red-200", dot: "bg-red-600" },
};

const clamp = (value, minimum, maximum) =>
  Math.min(maximum, Math.max(minimum, value));

const getTaskTitle = (task) =>
  task?.subject ||
  task?.title ||
  task?.taskTitle ||
  task?.name ||
  "Untitled Task";

const getTaskTypeText = (task) =>
  [
    task?.taskType,
    task?.type,
    task?.category,
    task?.activityType,
    getTaskTitle(task),
  ]
    .filter(Boolean)
    .join(" ")
    .trim()
    .toLowerCase();

const getTaskType = (task) => {
  const type = getTaskTypeText(task);
  if (type.includes("call") || type.includes("phone")) return "Call";
  if (type.includes("email") || type.includes("e-mail") || type.includes("mail")) return "Email";
  if (type.includes("message") || type.includes("chat") || type.includes("sms")) return "Message";
  if (type.includes("reminder")) return "Reminder";
  return "Others";
};

const getTaskTypeIcon = (task) => {
  const taskType = getTaskType(task);
  if (taskType === "Call") return Phone;
  if (taskType === "Email") return Mail;
  if (taskType === "Message") return MessageSquareText;
  if (taskType === "Reminder") return Bell;
  return ListTodo;
};

const parseSingleAttachment = (rawAtt) => {
  if (!rawAtt) return null;
  if (typeof rawAtt === "object") {
    const url = rawAtt.url || rawAtt.link || rawAtt.path || rawAtt.fileUrl;
    const name = rawAtt.name || rawAtt.title || rawAtt.fileName || "Document";
    if (!url && !name) return null;
    const finalUrl = url ? (!/^https?:\/\//i.test(url) ? `${window.location.origin}/${url.replace(/^\/+/, "")}` : url) : "#";
    return {
      name,
      url: finalUrl,
    };
  }
  if (typeof rawAtt === "string") {
    const trimmed = rawAtt.trim();
    if (!trimmed || trimmed === "-") return null;
    const finalUrl = !/^https?:\/\//i.test(trimmed) 
      ? `${window.location.origin}/${trimmed.replace(/^\/+/, "")}` 
      : trimmed;
    return {
      name: trimmed.split("/").pop() || "Document",
      url: finalUrl,
    };
  }
  return null;
};

const getTaskLinkAndAttachments = (task) => {
  const linkItems = [];
  const attachmentList = [];

  const getLinks = (value) => {
    if (Array.isArray(value)) return value;
    if (typeof value !== "string") return [];

    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      return [];
    }
  };

  const addLink = (rawLink, customName = "") => {
    if (!rawLink) return;

    if (typeof rawLink === "string" && rawLink.trim() !== "") {
      const url = rawLink.startsWith("http") ? rawLink : `https://${rawLink}`;
      if (!linkItems.some((item) => item.url === url)) {
        linkItems.push({ name: customName || rawLink, url });
      }
    } else if (typeof rawLink === "object") {
      const parsed = parseSingleAttachment(rawLink);
      if (parsed && !linkItems.some((item) => item.url === parsed.url)) {
        linkItems.push({ ...parsed, name: customName || parsed.name });
      }
    }
  };

  getLinks(task?.links).forEach((link) => {
    if (typeof link === "string") {
      addLink(link);
      return;
    }
    addLink(link?.url || link?.link || link?.href, link?.name || link?.title || "");
  });
  addLink(
    task?.link || task?.url || task?.externalLink,
    typeof task?.linkName === "string" ? task.linkName.trim() : "",
  );

  const rawAtts = task?.attachments || task?.files || task?.file || task?.documents;
  if (rawAtts) {
    (Array.isArray(rawAtts) ? rawAtts : [rawAtts]).forEach((item) => {
      const parsed = parseSingleAttachment(item);
      if (parsed) attachmentList.push(parsed);
    });
  }

  return { linkItems, attachmentList };
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

const getClientInfo = (task) => {
  const directClientName =
    task?.clientName || task?.customerName || task?.contactName || task?.companyName || task?.prospectName || task?.leadName;

  if (typeof directClientName === "string" && directClientName.trim()) {
    const clientId = task?.clientId || task?.client?._id || task?.client?.id || task?.customerId || task?.contactId;
    return { name: directClientName.trim(), id: clientId };
  }

  const possibleRecords = [task?.client, task?.customer, task?.contact, task?.prospect, task?.lead, task?.relatedTo];

  for (const record of possibleRecords) {
    if (typeof record === "string" && record.trim()) return { name: record.trim(), id: null };
    if (record && typeof record === "object") {
      const recordName = getObjectName(record);
      if (recordName) {
        const recordId = record._id || record.id;
        return { name: recordName, id: recordId };
      }
    }
  }

  if (task?.clientId) {
    return { name: `Client (${task.clientId.slice(-4)})`, id: task.clientId };
  }

  return null;
};

const getAssignerInfo = (task, currentUserId) => {
  const creatorField = task?.createdBy || task?.assignedBy || task?.owner || task?.author;
  if (!creatorField) return null;

  let creatorId = "";
  let creatorName = "";

  if (typeof creatorField === "string") {
    creatorId = creatorField.trim();
    creatorName = creatorId;
  } else if (typeof creatorField === "object") {
    creatorId = String(creatorField._id || creatorField.id || "");
    creatorName = getObjectName(creatorField);
  }

  if (currentUserId && creatorId && creatorId === currentUserId) {
    return null;
  }

  if (creatorName && creatorName !== currentUserId) {
    return { name: creatorName, id: creatorId };
  }

  return null;
};

const getTaskDateValue = (task) =>
  task?.dueDate || task?.date || task?.taskDate || task?.scheduledDate || task?.reminderDate || null;

const getTaskTimeValue = (task) =>
  task?.dueTime || task?.time || task?.taskTime || task?.scheduledTime || task?.reminderTime || task?.startTime || "";

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

  const normalizedDate = String(value).trim();
  const dateOnlyMatch = normalizedDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (dateOnlyMatch) {
    const parsedDate = new Date(Number(dateOnlyMatch[1]), Number(dateOnlyMatch[2]) - 1, Number(dateOnlyMatch[3]));
    return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
  }

  const parsedDate = new Date(normalizedDate);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
};

const getTaskTimeParts = (task) => {
  const parsedTime = parseTime(getTaskTimeValue(task));
  if (parsedTime) return parsedTime;

  const dateValue = getTaskDateValue(task);
  if (typeof dateValue === "string" && dateValue.includes("T")) {
    const parsedDate = parseDate(dateValue);
    if (parsedDate) {
      return { hours: parsedDate.getHours(), minutes: parsedDate.getMinutes(), seconds: parsedDate.getSeconds() };
    }
  }

  return null;
};

const getTaskTimeKey = (task) => {
  const timeParts = getTaskTimeParts(task);
  if (!timeParts) return NO_TIME;
  return `${String(timeParts.hours).padStart(2, "0")}:${String(timeParts.minutes).padStart(2, "0")}`;
};

const formatTimeKey = (timeKey) => {
  if (timeKey === NO_TIME) return "No Time";
  const parsedTime = parseTime(timeKey);
  if (!parsedTime) return timeKey;

  const temporaryDate = new Date();
  temporaryDate.setHours(parsedTime.hours, parsedTime.minutes, parsedTime.seconds, 0);

  return temporaryDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
};

const getTaskTimestamp = (task) => {
  const parsedDate = parseDate(getTaskDateValue(task));
  if (!parsedDate) return Number.MAX_SAFE_INTEGER;

  const parsedTime = getTaskTimeParts(task);
  if (parsedTime) {
    parsedDate.setHours(parsedTime.hours, parsedTime.minutes, parsedTime.seconds, 0);
  }

  return parsedDate.getTime();
};

const getPriorityClasses = (priority) => {
  const p = String(priority || "medium").toLowerCase();
  if (p === "high") return "bg-red-50 text-red-600 border-red-200/60";
  if (p === "medium") return "bg-amber-50 text-amber-600 border-amber-200/60";
  return "bg-gray-100 text-gray-600 border-gray-200/60";
};

function ColorPillStatusDropdown({ currentStatus, onSelect, scale }) {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ bottom: 0, left: 0 });
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);

  const updatePosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setCoords({
        bottom: window.innerHeight - rect.top + 4,
        left: rect.right + window.scrollX - 144,
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

  const currentStyle = STATUS_STYLES[currentStatus] || STATUS_STYLES.Pending;
  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggleDropdown}
        className={`inline-flex items-center gap-1 rounded-md border ${currentStyle.border} ${currentStyle.bg} transition-all hover:opacity-80 focus:outline-none`}
        style={{
          minWidth: `${clamp(94 * scale, 72, 94)}px`,
          padding: `${clamp(4 * scale, 2, 4)}px ${clamp(9 * scale, 6, 9)}px`,
        }}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${currentStyle.dot}`} />
        <span
          className={`font-medium ${currentStyle.text}`}
          style={{ fontSize: `${clamp(10 * scale, 7, 10)}px` }}
        >
          {currentStatus}
        </span>
        <ChevronDown size={clamp(12 * scale, 9, 12)} className={currentStyle.text} />
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
              {TASK_STATUS_OPTIONS.map((status) => {
                const isSelected = status === currentStatus;
                const optStyle = STATUS_STYLES[status] || STATUS_STYLES.Pending;

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
                    <span className={`inline-flex items-center gap-1 rounded-md border ${optStyle.border} ${optStyle.bg} px-2 py-0.5`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${optStyle.dot}`} />
                      <span className={`text-[10px] font-medium ${optStyle.text}`}>
                        {status}
                      </span>
                    </span>
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

export default function MyTasksTable({ tasks = [], hideFilter = false, onStatusChange, onClientClick }) {
  const { user: currentUser } = useAuth();
  const currentUserId = String(currentUser?._id || currentUser?.id || "");

  const viewportRef = useRef(null);
  const movingRef = useRef(false);
  const touchStartRef = useRef(null);
  const resizeFrameRef = useRef(null);

  const [index, setIndex] = useState(0);
  const [animated, setAnimated] = useState(false);
  const [hoveredSide, setHoveredSide] = useState(null);
  const [selectedTime, setSelectedTime] = useState(ALL_TIMES);

  const [layout, setLayout] = useState({ cardWidth: 0, cardHeight: 225, gap: 16, scale: 1 });

  const handleStatusUpdate = (task, newStatus) => {
    if (onStatusChange) {
      onStatusChange(task, newStatus);
    }
  };

  const activeTasks = useMemo(() => {
    return tasks.filter((task) => {
      const creatorId = String(task.createdBy?._id || task.createdBy?.id || task.createdBy || "");
      const isCreator = creatorId === currentUserId;

      const assigneeId = String(task.assignedTo?._id || task.assignedTo?.id || task.assignedTo || "");
      const isAssignee = assigneeId === currentUserId;

      if (currentUserId && !isCreator && !isAssignee) return false;

      const status = getDynamicTaskStatus(task);
      const isCompleted = status === "Completed";
      
      const typeText = getTaskTypeText(task);
      const isMeeting = typeText.includes("meeting") || typeText.includes("appointment");

      return !isCompleted && !isMeeting;
    });
  }, [tasks, currentUserId]);

  const timeOptions = useMemo(() => {
    const uniqueTimes = [...new Set(activeTasks.map((task) => getTaskTimeKey(task)))].sort((a, b) => {
      if (a === NO_TIME) return 1;
      if (b === NO_TIME) return -1;
      return a.localeCompare(b);
    });

    return [
      { value: ALL_TIMES, label: "All Times" },
      ...uniqueTimes.map((timeKey) => ({ value: timeKey, label: formatTimeKey(timeKey) })),
    ];
  }, [activeTasks]);

  useEffect(() => {
    const selectedStillExists = timeOptions.some((option) => option.value === selectedTime);
    if (!selectedStillExists) setSelectedTime(ALL_TIMES);
  }, [selectedTime, timeOptions]);

  const filteredTasks = useMemo(() => {
    if (hideFilter) return activeTasks;
    return activeTasks.filter((task) => selectedTime === ALL_TIMES || getTaskTimeKey(task) === selectedTime);
  }, [activeTasks, selectedTime, hideFilter]);

  const sortedTasks = useMemo(() => {
    return [...filteredTasks].sort((a, b) => {
      const priorityA = String(a?.priority || "medium").toLowerCase();
      const priorityB = String(b?.priority || "medium").toLowerCase();
      const priorityWeightA = PRIORITY_ORDER[priorityA] || 0;
      const priorityWeightB = PRIORITY_ORDER[priorityB] || 0;

      if (priorityWeightA !== priorityWeightB) {
        return priorityWeightB - priorityWeightA;
      }

      const dateDiff = getTaskTimestamp(a) - getTaskTimestamp(b);
      if (dateDiff !== 0) return dateDiff;

      return getTaskTitle(a).localeCompare(getTaskTitle(b));
    });
  }, [filteredTasks]);

  const items = sortedTasks;
  const carouselEnabled = items.length > VISIBLE_CARDS;
  const cloneCount = carouselEnabled ? Math.min(CLONE_COUNT, items.length) : 0;

  const cards = useMemo(() => {
    if (!items.length) return [];
    if (!carouselEnabled) return items;
    return [...items.slice(-cloneCount), ...items, ...items.slice(0, cloneCount)];
  }, [items, carouselEnabled, cloneCount]);

  const itemsSignature = useMemo(
    () => items.map((t) => `${t?._id || t?.id || getTaskTitle(t)}-${getTaskTimestamp(t)}`).join("|"),
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
          cardHeight: clamp(290 * scale, 225, 300),
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
    setIndex((prev) => prev + direction * VISIBLE_CARDS);
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
  const smallIconSize = clamp(11 * scale, 7, 11);
  const arrowIconSize = clamp(22 * scale, 17, 22);
  const arrowButtonSize = clamp(42 * scale, 34, 42);
  const hoverZone = clamp(72 * scale, 48, 72);

  return (
    <div className="w-full min-w-0">
      {!hideFilter && (
        <div className="mb-4 mt-2 flex w-full justify-end">
          <HeaderFilterDropdown
            icon={Clock}
            ariaLabel="Filter tasks by time"
            value={selectedTime}
            options={timeOptions}
            onChange={setSelectedTime}
          />
        </div>
      )}

      {!items.length ? (
        <div className="flex h-36 w-full items-center justify-center rounded-xl border border-black/10 bg-white text-sm text-black/40">
          {activeTasks.length ? "No tasks match the selected criteria" : "No tasks available"}
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
                  aria-label="Previous task"
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
                  aria-label="Next task"
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
              {cards.map((task, itemIndex) => {
                const taskId = task?._id || task?.id;
                const cardKey = `${taskId || "task"}-${itemIndex}`;
                const TaskTypeIcon = getTaskTypeIcon(task);
                const taskType = getTaskType(task);
                const clientInfo = getClientInfo(task);
                const assignerInfo = getAssignerInfo(task, currentUserId);
                const { linkItems, attachmentList } = getTaskLinkAndAttachments(task);
                const currentStatus = getDynamicTaskStatus(task);
                const priority = task?.priority || "medium";

                return (
                  <article
                    key={cardKey}
                    className="group relative box-border flex min-w-0 shrink-0 flex-col overflow-hidden rounded-2xl border border-black/[0.08] bg-white shadow-[0_4px_14px_rgba(0,0,0,0.05)] transition-all duration-200 hover:border-red-500/25 hover:shadow-[0_6px_18px_rgba(0,0,0,0.08)]"
                    style={{ width: `${cardWidth}px`, height: `${cardHeight}px`, padding: `${padding}px` }}
                  >
                    <span className="absolute bottom-0 left-5 right-5 h-0.5 rounded-full bg-red-500 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />

                    <div className="flex min-h-0 shrink-0 flex-col overflow-hidden">
                      <div className="flex min-w-0 items-center justify-between" style={{ gap: `${clamp(7 * scale, 4, 7)}px` }}>
                        <div className="flex min-w-0 items-center gap-1.5">
                          <TaskTypeIcon size={iconSize} strokeWidth={2} className="shrink-0 text-red-600" />
                          <p className="min-w-0 truncate font-semibold uppercase tracking-[0.05em] text-red-600" style={{ fontSize: `${typeSize}px`, lineHeight: 1 }}>
                            {taskType}
                          </p>
                        </div>

                      </div>

                      <h3 className="line-clamp-2 min-w-0 font-semibold text-black/85" style={{ marginTop: `${clamp(8 * scale, 4, 8)}px`, fontSize: `${titleSize}px`, lineHeight: 1.35 }}>
                        {getTaskTitle(task)}
                      </h3>

                      {assignerInfo && (
                        <div 
                          className="flex min-w-0 items-center text-black/50" 
                          style={{ gap: `${clamp(6 * scale, 3, 6)}px`, marginTop: `${clamp(6 * scale, 3, 6)}px`, fontSize: `${clientSize}px` }}
                        >
                          <UserRound size={smallIconSize} className="shrink-0 text-red-600" />
                          <span className="truncate" title={`Assigned by: ${assignerInfo.name}`}>
                            Assigned by {assignerInfo.name}
                          </span>
                        </div>
                      )}
                    </div>

                    <div
                      className="min-h-0 flex-1 overflow-y-scroll overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                      style={{ fontSize: `${clientSize}px`, marginTop: `${clamp(12 * scale, 6, 12)}px` }}
                    >
                      <div className="flex min-h-full flex-col justify-end gap-1">
                        {linkItems.map((linkItem, idx) => (
                          <a
                            key={`${linkItem.url}-${idx}`}
                            href={linkItem.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="flex shrink-0 items-center gap-1 truncate rounded border border-blue-100 bg-blue-50/50 px-2 py-0.5 text-blue-600 hover:underline"
                            title={linkItem.name}
                          >
                            <ExternalLink size={smallIconSize} className="shrink-0" />
                            <span className="truncate">{linkItem.name}</span>
                          </a>
                        ))}
                        {attachmentList.map((file, idx) => (
                          <a
                            key={`${file.url}-${idx}`}
                            href={file.url}
                            download={file.name}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="flex shrink-0 items-center gap-1 truncate rounded border border-slate-200/60 bg-slate-50 px-2 py-0.5 text-gray-700 transition-colors hover:text-red-500"
                            title={file.name}
                          >
                            <Paperclip size={smallIconSize} className="shrink-0 text-red-500" />
                            <span className="truncate font-medium">{file.name}</span>
                          </a>
                        ))}
                        {clientInfo && !linkItems.length && attachmentList.length === 0 && (
                          <div
                            className="flex min-w-0 items-center rounded-md border border-slate-200/60 bg-slate-50 transition-colors hover:bg-slate-100 cursor-pointer"
                            style={{ gap: `${clamp(6 * scale, 3, 6)}px`, padding: `${clamp(2 * scale, 1, 2)}px ${clamp(6 * scale, 3, 6)}px`, fontSize: `${clientSize}px` }}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onClientClick) {
                                onClientClick(clientInfo, task);
                              }
                            }}
                          >
                            <UserRound size={smallIconSize} className="shrink-0 text-red-600" />
                            <span className="truncate font-medium text-slate-700" title={clientInfo?.name}>
                              {clientInfo?.name}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 border-t border-black/[0.08]" style={{ paddingTop: `${clamp(6 * scale, 3, 6)}px` }}>
                      <div className="flex min-w-0 items-center justify-between gap-2">
                        <div className="flex min-w-0 flex-1">
                          <span
                            className={`inline-flex shrink-0 items-center rounded-md border font-bold uppercase ${getPriorityClasses(priority)}`}
                            style={{ minWidth: `${clamp(94 * scale, 72, 94)}px`, fontSize: `${clamp(10 * scale, 7, 10)}px`, padding: `${clamp(4 * scale, 2, 4)}px ${clamp(9 * scale, 6, 9)}px` }}
                          >
                            {priority}
                          </span>
                        </div>

                        <div className="shrink-0">
                          <ColorPillStatusDropdown
                            currentStatus={currentStatus}
                            onSelect={(status) => handleStatusUpdate(task, status)}
                            scale={scale}
                          />
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
