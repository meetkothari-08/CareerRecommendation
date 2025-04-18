import React from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, User, MessageCircle } from 'lucide-react';

const Navbar: React.FC = () => {
  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <Briefcase className="h-8 w-8 text-indigo-600" />
              <span className="text-2xl font-bold text-gray-900">CareerCompass</span>
            </Link>
          </div>
          
          <div className="flex items-center space-x-8">
            <Link to="/" className="text-gray-700 hover:text-indigo-600 transition-colors">
              Home
            </Link>
            <Link to="/about" className="text-gray-700 hover:text-indigo-600 transition-colors">
              About Us
            </Link>
            <Link to="/contact" className="text-gray-700 hover:text-indigo-600 transition-colors">
              Contact
            </Link>
            <Link to="/career-paths" className="text-gray-700 hover:text-indigo-600 transition-colors">
              Career Paths
            </Link>
            <Link to="/chat" className="text-gray-700 hover:text-indigo-600 transition-colors">
              <MessageCircle className="h-6 w-6" />
            </Link>
            <Link to="/user-profile" className="text-gray-700 hover:text-indigo-600">
              <User className="h-6 w-6" />
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;