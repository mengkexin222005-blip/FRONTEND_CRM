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
  UserRound,
  Video,
} from "lucide-react";

import HeaderFilterDropdown from "./HeaderFilterDropdown";

const VISIBLE_CARDS = 4;
const CLONE_COUNT = 4;
const ALL_VALUES = "all";
const NO_VALUE = "__no_value__";

const clamp = (value, minimum, maximum) =>
  Math.min(maximum, Math.max(minimum, value));

const getMeetingTitle = (m) =>
  m?.title || m?.meetingTitle || m?.subject || m?.name || "Untitled Meeting";

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

const getMeetingDateKey = (m) => {
  const dateValue = getMeetingDateValue(m);
  if (!dateValue) return NO_VALUE;

  const rawString = String(dateValue).trim();
  const cleanString = rawString.includes("T") ? rawString.split("T")[0] : rawString;

  const parsedDate = parseDate(cleanString);
  if (!parsedDate) return cleanString || NO_VALUE;

  const year = parsedDate.getFullYear();
  const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
  const day = String(parsedDate.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

// FIX: Formats to strictly YYYY-MM-DD
const formatMeetingDateKey = (dateKey) => {
  if (dateKey === NO_VALUE || !dateKey) return "No Date";

  const cleanKey = String(dateKey).includes("T") ? String(dateKey).split("T")[0] : String(dateKey);
  const parsedDate = parseDate(cleanKey);
  if (!parsedDate) return cleanKey;

  const year = parsedDate.getFullYear();
  const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
  const day = String(parsedDate.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
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

const formatMeetingDate = (m) => formatMeetingDateKey(getMeetingDateKey(m));
const formatMeetingTime = (m) => formatMeetingTimeKey(getMeetingTimeKey(m));

const normalizeStatus = (value) => {
  const normalizedStatus = String(value || "").trim().toLowerCase();
  if (!normalizedStatus || normalizedStatus === "scheduled" || normalizedStatus === "upcoming") return "Scheduled";
  if (normalizedStatus === "in progress" || normalizedStatus === "ongoing") return "Ongoing";
  if (normalizedStatus === "completed" || normalizedStatus === "complete" || normalizedStatus === "done") return "Completed";
  if (normalizedStatus === "cancelled" || normalizedStatus === "canceled") return "Cancelled";
  return value;
};

const getMeetingStatus = (m) => {
  const normalizedStatus = normalizeStatus(m?.status);
  if (normalizedStatus === "Completed" || normalizedStatus === "Cancelled") return normalizedStatus;

  const timestamp = getMeetingTimestamp(m);
  if (timestamp !== Number.MAX_SAFE_INTEGER && timestamp < Date.now()) {
    return "Completed";
  }

  return normalizedStatus;
};

const getStatusClasses = (value) => {
  const status = normalizeStatus(value);
  if (status === "Scheduled") return "border-blue-400 bg-blue-50 text-blue-700";
  if (status === "Ongoing") return "border-purple-400 bg-purple-50 text-purple-700";
  if (status === "Completed") return "border-green-500 bg-green-50 text-green-700";
  if (status === "Cancelled") return "border-red-500 bg-red-50 text-red-700";
  return "border-black/10 bg-black/[0.035] text-black/60";
};

const getStatusDotClasses = (value) => {
  const status = normalizeStatus(value);
  if (status === "Scheduled") return "bg-blue-500";
  if (status === "Ongoing") return "bg-purple-500";
  if (status === "Completed") return "bg-green-500";
  if (status === "Cancelled") return "bg-red-500";
  return "bg-black/50";
};

export default function MyMeetingsTable({ meetings = [], hideFilter = false }) {
  const viewportRef = useRef(null);
  const movingRef = useRef(false);
  const touchStartRef = useRef(null);
  const resizeFrameRef = useRef(null);

  const [index, setIndex] = useState(0);
  const [animated, setAnimated] = useState(false);
  const [hoveredSide, setHoveredSide] = useState(null);

  const [selectedDate, setSelectedDate] = useState(ALL_VALUES);
  const [selectedTime, setSelectedTime] = useState(ALL_VALUES);

  const [layout, setLayout] = useState({ cardWidth: 0, cardHeight: 194, gap: 16, scale: 1 });

  const dateOptions = useMemo(() => {
    const uniqueDates = [...new Set(meetings.map((m) => getMeetingDateKey(m)))].sort((a, b) => {
      if (a === NO_VALUE) return 1;
      if (b === NO_VALUE) return -1;
      return a.localeCompare(b);
    });

    return [
      { value: ALL_VALUES, label: "All Dates" },
      ...uniqueDates.map((d) => ({ value: d, label: formatMeetingDateKey(d) })),
    ];
  }, [meetings]);

  const timeOptions = useMemo(() => {
    const uniqueTimes = [...new Set(meetings.map((m) => getMeetingTimeKey(m)))].sort((a, b) => {
      if (a === NO_VALUE) return 1;
      if (b === NO_VALUE) return -1;
      return a.localeCompare(b);
    });

    return [
      { value: ALL_VALUES, label: "All Times" },
      ...uniqueTimes.map((t) => ({ value: t, label: formatMeetingTimeKey(t) })),
    ];
  }, [meetings]);

  useEffect(() => {
    if (!dateOptions.some((opt) => opt.value === selectedDate)) setSelectedDate(ALL_VALUES);
  }, [selectedDate, dateOptions]);

  useEffect(() => {
    if (!timeOptions.some((opt) => opt.value === selectedTime)) setSelectedTime(ALL_VALUES);
  }, [selectedTime, timeOptions]);

  const filteredMeetings = useMemo(() => {
    if (hideFilter) return meetings;
    return meetings.filter((m) => {
      const dateMatch = selectedDate === ALL_VALUES || getMeetingDateKey(m) === selectedDate;
      const timeMatch = selectedTime === ALL_VALUES || getMeetingTimeKey(m) === selectedTime;
      return dateMatch && timeMatch;
    });
  }, [meetings, selectedDate, selectedTime, hideFilter]);

  const sortedMeetings = useMemo(() => {
    return [...filteredMeetings].sort((a, b) => {
      const dateDiff = getMeetingTimestamp(a) - getMeetingTimestamp(b);
      if (dateDiff !== 0) return dateDiff;
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
        <div className="mb-4 mt-2 flex w-full flex-wrap justify-end gap-2">
          <HeaderFilterDropdown
            icon={CalendarDays}
            ariaLabel="Filter meetings by date"
            value={selectedDate}
            options={dateOptions}
            onChange={setSelectedDate}
            minimumWidth={150}
          />
          <HeaderFilterDropdown
            icon={Clock}
            ariaLabel="Filter meetings by time"
            value={selectedTime}
            options={timeOptions}
            onChange={setSelectedTime}
          />
        </div>
      )}

      {!items.length ? (
        <div className="flex h-36 w-full items-center justify-center rounded-xl border border-black/10 bg-white text-sm text-black/40">
          {meetings.length ? "No meetings match the selected filters" : "No meetings scheduled"}
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
              {cards.map((meeting, itemIndex) => {
                const clientName = getClientName(meeting);
                const status = getMeetingStatus(meeting);

                return (
                  <article
                    key={`${meeting?._id || meeting?.id || "meeting"}-${itemIndex}`}
                    className="group relative box-border min-w-0 shrink-0 overflow-hidden rounded-xl border border-black/[0.08] bg-white shadow-[0_4px_14px_rgba(0,0,0,0.05)] transition duration-200 hover:-translate-y-0.5 hover:border-red-500/25 hover:shadow-[0_9px_22px_rgba(0,0,0,0.09)]"
                    style={{ width: `${cardWidth}px`, height: `${cardHeight}px`, padding: `${padding}px` }}
                  >
                    <span className="absolute bottom-0 left-5 right-5 h-0.5 rounded-full bg-red-500 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />

                    <div className="flex h-full min-w-0 flex-col">
                      <div className="min-w-0">
                        <div className="flex min-w-0 items-center" style={{ gap: `${clamp(7 * scale, 4, 7)}px` }}>
                          <Video size={iconSize} strokeWidth={2} className="shrink-0 text-red-600" />
                          <p className="min-w-0 truncate font-semibold uppercase tracking-[0.05em] text-red-600" style={{ fontSize: `${typeSize}px`, lineHeight: 1 }}>
                            Meeting
                          </p>
                        </div>

                        <h3 className="line-clamp-2 min-w-0 font-semibold text-black/85" style={{ marginTop: `${clamp(9 * scale, 5, 9)}px`, fontSize: `${titleSize}px`, lineHeight: 1.35 }}>
                          {getMeetingTitle(meeting)}
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
                            <span className="truncate">{formatMeetingDate(meeting)}</span>
                            <Clock size={smallIconSize} className="ml-1 shrink-0" />
                            <span className="truncate">{formatMeetingTime(meeting)}</span>
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