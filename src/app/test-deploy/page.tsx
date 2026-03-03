'use client';
export default function TestPage() {
    return (
        <div className="p-20 text-center">
            <h1 className="text-4xl font-bold">Deployment Test: Successful!</h1>
            <p className="mt-4 text-xl">Current Commit: 5cc442f (Fix price alignment and 3-dot menu)</p>
            <p className="mt-2 text-muted-foreground">If you see this, the site is deploying correctly.</p>
        </div>
    );
}
