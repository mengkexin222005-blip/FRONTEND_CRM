import { DragDropContext, Droppable } from "@hello-pangea/dnd";
import { useLayoutEffect, useRef, useState } from "react";

const BASE_MIN_HEIGHT = 120;

export default function BaseKanban({
  columns = {},
  statuses = [],
  onDragEnd,
  emptyMessage = "No items",
  maxHeight = "calc(100vh - 130px)",
  renderHeader,
  renderCard,
  successStatus = null,
}) {
  const [minColHeight, setMinColHeight] = useState(BASE_MIN_HEIGHT);
  const contentRefs = useRef({});
  const scrollRef = useRef(null);

  useLayoutEffect(() => {
    const measure = () => {
      const heights = statuses.map((status) => {
        const el = contentRefs.current[status];
        return el ? el.scrollHeight : 0;
      });

      const tallest = Math.max(BASE_MIN_HEIGHT, ...heights);
      setMinColHeight(tallest);
    };

    measure();

    const observer = new ResizeObserver(() => {
      measure();
    });

    statuses.forEach((status) => {
      const el = contentRefs.current[status];
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [statuses, columns]);

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div
        ref={scrollRef}
        className="overflow-x-auto overflow-y-auto pb-4 touch-pan-x"
        style={{ maxHeight }}
      >
        <div className="flex min-w-max gap-3 sm:gap-4 items-start">
          {statuses.map((status) => {
            const items = columns[status] || [];
            const isSuccess = successStatus && status === successStatus;

            return (
              <Droppable key={status} droppableId={status}>
                {(provided, snapshot) => {
                  const isDraggingOverSuccess =
                    isSuccess && snapshot.isDraggingOver;

                  return (
                    <div
                      className={`w-[calc(100vw-3rem)] max-w-70 shrink-0 flex flex-col rounded-md border transition-all duration-150 sm:w-70 ${
                        isDraggingOverSuccess
                          ? "bg-green-50 border-green-400"
                          : "bg-[#f5f5f5] border-gray-200"
                      }`}
                    >
                      {renderHeader?.(status, items, snapshot)}

                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`p-2 transition-colors duration-150 ${
                          snapshot.isDraggingOver && !isSuccess
                            ? "bg-red-50/50"
                            : isDraggingOverSuccess
                              ? "bg-green-50/50"
                              : ""
                        }`}
                        style={{ minHeight: `${minColHeight}px` }}
                      >
                        <div
                          ref={(el) => {
                            contentRefs.current[status] = el;
                          }}
                        >
                          {items.length === 0 && !snapshot.isDraggingOver && (
                            <div className="flex items-center justify-center h-20 text-xs text-gray-400">
                              {emptyMessage}
                            </div>
                          )}
                          {items.map((item, index) =>
                            renderCard(item, index, items),
                          )}
                          {provided.placeholder}
                        </div>
                      </div>
                    </div>
                  );
                }}
              </Droppable>
            );
          })}
        </div>
      </div>
    </DragDropContext>
  );
}
