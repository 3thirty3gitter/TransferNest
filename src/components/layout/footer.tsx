export default function Footer() {
  return (
    <div className="border-t bg-card">
      <div className="container mx-auto px-4 py-8">
        <p className="text-sm text-muted-foreground text-center">
          &copy; {new Date().getFullYear()} DTF Wholesale Canada. All Rights Reserved.
        </p>
      </div>
    </div>
  );
}
