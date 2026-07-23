import{ChevronLeft,ChevronRight}from"lucide-react";

export function PreviousArrow({onClick}){

return(
<button
type="button"
onClick={onClick}
className="absolute left-0 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm transition hover:bg-gray-50"
>
<ChevronLeft size={18}/>
</button>
);

}


export function NextArrow({onClick}){

return(
<button
type="button"
onClick={onClick}
className="absolute right-0 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm transition hover:bg-gray-50"
>
<ChevronRight size={18}/>
</button>
);

}
