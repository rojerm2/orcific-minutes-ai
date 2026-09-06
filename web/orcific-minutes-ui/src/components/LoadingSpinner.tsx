export default function LoadingSpinner() {
    return (
        <div className="surface flex flex-col items-center justify-center py-14">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />

            <p className="mt-4 text-slate-600">Generating meeting notes...</p>
        </div>
    );
}
