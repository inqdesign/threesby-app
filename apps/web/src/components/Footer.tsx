import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="py-6 text-center text-muted-foreground text-xs border-t border-border">
      <div className="container mx-auto px-4">
        <p className="mb-3">© {new Date().getFullYear()} ThreesBy</p>
        <div className="flex justify-center space-x-4">
          <Link to="/terms" className="text-muted-foreground hover:text-foreground">Terms & Conditions</Link>
          <span className="text-border">|</span>
          <Link to="/privacy-policy" className="text-muted-foreground hover:text-foreground">Privacy Policy</Link>
        </div>
      </div>
    </footer>
  );
}