import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  ListTodo,
  Mail,
  MessageSquareText,
  Phone,
  UserRound,
  Bell,
} from "lucide-react";

import HeaderFilterDropdown from "./HeaderFilterDropdown";

const VISIBLE_CARDS = 4;
const CLONE_COUNT = 4;
const ALL_TIMES = "all";
const NO_TIME = "__no_time__";

// Status weight ranking (Higher number = higher rank/urgency)
const STATUS_ORDER = {
  Overdue: 4,   // 1st: Immediate action required
  "Due Soon": 3, // 2nd: Needs urgent attention
  Pending: 2,   // 3rd: Backlog / To start
  Ongoing: 1,   // 4th: Work in progress
};

// Priority weight ranking
const PRIORITY_ORDER = {
  high: 3,
  medium: 2,
  low: 1,
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

const getClientName = (task) => {
  const directClientName =
    task?.clientName || task?.customerName || task?.contactName || task?.companyName || task?.prospectName || task?.leadName;

  if (typeof directClientName === "string" && directClientName.trim()) {
    return directClientName.trim();
  }

  const possibleRecords = [task?.client, task?.customer, task?.contact, task?.prospect, task?.lead, task?.relatedTo];

  for (const record of possibleRecords) {
    if (typeof record === "string" && record.trim()) return record.trim();
    const recordName = getObjectName(record);
    if (recordName) return recordName;
  }

  return "No client assigned";
};

const getTaskDateValue = (task) =>
  task?.dueDate || task?.date || task?.taskDate || task?.scheduledDate || task?.reminderDate || null;

const getTaskStartDateValue = (task) =>
  task?.startDate || task?.createdAt || task?.createdDate || null;

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

const getTaskStartTimestamp = (task) => {
  const parsedDate = parseDate(getTaskStartDateValue(task));
  if (!parsedDate) return null;
  return parsedDate.getTime();
};

const formatTaskDate = (task) => {
  const parsedDate = parseDate(getTaskDateValue(task));
  if (!parsedDate) return "No date";
  return parsedDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const formatTaskTime = (task) => formatTimeKey(getTaskTimeKey(task));

const normalizeStatus = (value) => {
  const normalizedStatus = String(value || "").trim().toLowerCase();
  if (normalizedStatus === "due soon" || normalizedStatus === "due_soon") return "Due Soon";
  if (!normalizedStatus || normalizedStatus === "to do" || normalizedStatus === "todo" || normalizedStatus === "pending") return "Pending";
  if (normalizedStatus === "in progress" || normalizedStatus === "ongoing") return "Ongoing";
  if (normalizedStatus === "overdue") return "Overdue";
  return "Pending";
};

const getTaskStatus = (task) => {
  const timestamp = getTaskTimestamp(task);
  const startTimestamp = getTaskStartTimestamp(task);
  const now = Date.now();

  // 1. Overdue Check
  if (timestamp !== Number.MAX_SAFE_INTEGER && timestamp < now) {
    return "Overdue";
  }

  // 2. Length-based / Remaining Time "Due Soon" Check
  if (timestamp !== Number.MAX_SAFE_INTEGER && timestamp >= now) {
    const threeDaysInMs = 3 * 24 * 60 * 60 * 1000;

    if (startTimestamp && !Number.isNaN(startTimestamp)) {
      const totalTaskDuration = timestamp - startTimestamp;

      // If the entire task duration is <= 3 days, flag as Due Soon immediately upon start
      if (totalTaskDuration <= threeDaysInMs) {
        return "Due Soon";
      }
    }

    // Standard remaining-time check for longer tasks
    if (timestamp - now <= threeDaysInMs) {
      return "Due Soon";
    }
  }

  return normalizeStatus(task?.status);
};

const getStatusClasses = (value) => {
  const status = normalizeStatus(value);
  if (status === "Due Soon") return "border-orange-500 bg-orange-50 text-orange-700";
  if (status === "Pending") return "border-yellow-400 bg-yellow-50 text-yellow-700";
  if (status === "Ongoing") return "border-blue-400 bg-blue-50 text-blue-700";
  if (status === "Overdue") return "border-red-500 bg-red-50 text-red-700";
  return "border-black/10 bg-black/[0.035] text-black/60";
};

const getStatusDotClasses = (value) => {
  const status = normalizeStatus(value);
  if (status === "Due Soon") return "bg-orange-500";
  if (status === "Pending") return "bg-yellow-500";
  if (status === "Ongoing") return "bg-blue-500";
  if (status === "Overdue") return "bg-red-500";
  return "bg-black/50";
};

const getPriorityClasses = (priority) => {
  const p = String(priority || "medium").toLowerCase();
  if (p === "high") return "bg-red-100 text-red-700 border-red-200";
  if (p === "medium") return "bg-amber-100 text-amber-700 border-amber-200";
  return "bg-gray-100 text-gray-600 border-gray-200";
};

export default function MyTasksTable({ tasks = [], hideFilter = false }) {
  const viewportRef = useRef(null);
  const movingRef = useRef(false);
  const touchStartRef = useRef(null);
  const resizeFrameRef = useRef(null);

  const [index, setIndex] = useState(0);
  const [animated, setAnimated] = useState(false);
  const [hoveredSide, setHoveredSide] = useState(null);
  const [selectedTime, setSelectedTime] = useState(ALL_TIMES);

  const [layout, setLayout] = useState({ cardWidth: 0, cardHeight: 194, gap: 16, scale: 1 });

  const activeTasks = useMemo(() => {
    return tasks.filter((task) => {
      const status = String(task?.status || "").trim().toLowerCase();
      const isCompleted = status === "completed" || status === "complete" || status === "done";
      
      const typeText = getTaskTypeText(task);
      const isMeeting = typeText.includes("meeting") || typeText.includes("appointment");

      return !isCompleted && !isMeeting;
    });
  }, [tasks]);

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

  // Priority and Urgency Sorting Implementation
  const sortedTasks = useMemo(() => {
    return [...filteredTasks].sort((a, b) => {
      // 1. Resolve and compare Status weight (Overdue > Due Soon > Pending > Ongoing)
      const statusA = getTaskStatus(a);
      const statusB = getTaskStatus(b);
      const statusWeightA = STATUS_ORDER[statusA] || 0;
      const statusWeightB = STATUS_ORDER[statusB] || 0;

      if (statusWeightA !== statusWeightB) {
        return statusWeightB - statusWeightA;
      }

      // 2. Compare Priority weight (High > Medium > Low)
      const priorityA = String(a?.priority || "medium").toLowerCase();
      const priorityB = String(b?.priority || "medium").toLowerCase();
      const priorityWeightA = PRIORITY_ORDER[priorityA] || 0;
      const priorityWeightB = PRIORITY_ORDER[priorityB] || 0;

      if (priorityWeightA !== priorityWeightB) {
        return priorityWeightB - priorityWeightA;
      }

      // 3. Compare Due Date & Time (Earliest date/time first)
      const dateDiff = getTaskTimestamp(a) - getTaskTimestamp(b);
      if (dateDiff !== 0) return dateDiff;

      // 4. Fallback alphabetical title comparison
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
          cardHeight: clamp(194 * scale, 132, 194),
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
      secondFrame = window.requestAnimationFrame(() => setAnimated(true));
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

          <div ref={viewportRef} className="w-full min-w-0 overflow-hidden py-2">
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
                const TaskTypeIcon = getTaskTypeIcon(task);
                const taskType = getTaskType(task);
                const clientName = getClientName(task);
                const status = getTaskStatus(task);
                const priority = task?.priority || "medium";

                return (
                  <article
                    key={`${task?._id || task?.id || "task"}-${itemIndex}`}
                    className="group relative box-border min-w-0 shrink-0 overflow-hidden rounded-xl border border-black/[0.08] bg-white shadow-[0_4px_14px_rgba(0,0,0,0.05)] transition duration-200 hover:-translate-y-0.5 hover:border-red-500/25 hover:shadow-[0_9px_22px_rgba(0,0,0,0.09)]"
                    style={{ width: `${cardWidth}px`, height: `${cardHeight}px`, padding: `${padding}px` }}
                  >
                    <span className="absolute bottom-0 left-5 right-5 h-0.5 rounded-full bg-red-500 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />

                    <div className="flex h-full min-w-0 flex-col">
                      <div className="min-w-0">
                        <div className="flex min-w-0 items-center justify-between" style={{ gap: `${clamp(7 * scale, 4, 7)}px` }}>
                          <div className="flex min-w-0 items-center gap-1.5">
                            <TaskTypeIcon size={iconSize} strokeWidth={2} className="shrink-0 text-red-600" />
                            <p className="min-w-0 truncate font-semibold uppercase tracking-[0.05em] text-red-600" style={{ fontSize: `${typeSize}px`, lineHeight: 1 }}>
                              {taskType}
                            </p>
                          </div>

                          <span
                            className={`inline-flex shrink-0 items-center rounded-md border font-bold uppercase ${getPriorityClasses(priority)}`}
                            style={{ fontSize: `${clamp(9 * scale, 6, 9)}px`, padding: `1px ${clamp(6 * scale, 3, 6)}px` }}
                          >
                            {priority}
                          </span>
                        </div>

                        <h3 className="line-clamp-2 min-w-0 font-semibold text-black/85" style={{ marginTop: `${clamp(9 * scale, 5, 9)}px`, fontSize: `${titleSize}px`, lineHeight: 1.35 }}>
                          {getTaskTitle(task)}
                        </h3>
                      </div>

                      <div className="flex min-w-0 items-center text-black/50" style={{ gap: `${clamp(6 * scale, 3, 6)}px`, marginTop: `${clamp(12 * scale, 6, 12)}px`, fontSize: `${clientSize}px` }}>
                        <UserRound size={smallIconSize} className="shrink-0 text-red-600" />
                        <span className="truncate" title={clientName}>{clientName}</span>
                      </div>

                      <div className="mt-auto border-t border-black/[0.08]" style={{ paddingTop: `${clamp(10 * scale, 5, 10)}px` }}>
                        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
                          <div className="flex min-w-0 items-center text-black/45" style={{ gap: `${clamp(5 * scale, 2, 5)}px`, fontSize: `${metaSize}px` }}>
                            <CalendarDays size={smallIconSize} className="shrink-0" />
                            <span className="truncate">{formatTaskDate(task)}</span>
                            <Clock size={smallIconSize} className="ml-1 shrink-0" />
                            <span className="truncate">{formatTaskTime(task)}</span>
                          </div>

                          <span className={`inline-flex shrink-0 items-center rounded-full border font-semibold uppercase ${getStatusClasses(status)}`} style={{ gap: `${clamp(5 * scale, 3, 5)}px`, fontSize: `${metaSize}px`, padding: `${clamp(4 * scale, 2, 4)}px ${clamp(8 * scale, 4, 8)}px` }}>
                            <span className={`shrink-0 rounded-full ${getStatusDotClasses(status)}`} style={{ width: `${clamp(5 * scale, 3, 5)}px`, height: `${clamp(5 * scale, 3, 5)}px` }} />
                            <span>{status}</span>
                          </span>
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