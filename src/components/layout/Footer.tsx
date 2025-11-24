'use client';

import Link from 'next/link';
import { Facebook, Twitter, Instagram } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-primary text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">DFC</h3>
            <p className="text-gray-300">
              Connecting you with world-class medical care right here in Nigeria.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li><Link href="#" className="text-gray-300 hover:text-white transition-colors">Home</Link></li>
              <li><Link href="#" className="text-gray-300 hover:text-white transition-colors">Book Appointment</Link></li>
              <li><Link href="#" className="text-gray-300 hover:text-white transition-colors">About Us</Link></li>
              <li><Link href="#" className="text-gray-300 hover:text-white transition-colors">Partners</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2">
              <li><Link href="#" className="text-gray-300 hover:text-white transition-colors">Help Center</Link></li>
              <li><Link href="#" className="text-gray-300 hover:text-white transition-colors">Contact Us</Link></li>
              <li><Link href="#" className="text-gray-300 hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="#" className="text-gray-300 hover:text-white transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Follow Us</h4>
            <div className="flex space-x-4">
              <Link href="#" className="text-gray-300 hover:text-white transition-colors">
                <Facebook className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-gray-300 hover:text-white transition-colors">
                <Twitter className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-gray-300 hover:text-white transition-colors">
                <Instagram className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-600 mt-8 pt-8 text-center text-gray-300">
          <p>&copy; {new Date().getFullYear()} Doctors Foundation for Care. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}