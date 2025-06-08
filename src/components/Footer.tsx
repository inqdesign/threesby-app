import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="py-6 text-center text-[#585757] text-xs border-t border-gray-100">
      <div className="container mx-auto px-4">
        <p className="mb-3">© {new Date().getFullYear()} ThreesBy</p>
        <div className="flex justify-center space-x-4">
          <Link to="/terms" className="text-blue-600 hover:underline">Terms & Conditions</Link>
          <span className="text-gray-300">|</span>
          <Link to="/privacy-policy" className="text-blue-600 hover:underline">Privacy Policy</Link>
        </div>
      </div>
    </footer>
  );
}