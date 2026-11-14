import {Outlet} from 'react-router-dom';
import Footer from './Footer';
import Navbar from './Navbar';
import {ToastHost} from '@/components/Toast';

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <ToastHost />
    </div>
  );
}
