import { FC } from 'react';
import { LayoutProps } from '../types/types';
import Footer from './Footer';
import Navbar from './Navbar';

const Layout: FC<LayoutProps> = ({ children }) => {
    return (
        <div className="flex flex-col min-h-screen relative overflow-hidden">
            <div className="flex-grow flex flex-col items-center max-w-4xL w-full mx-auto">
                <Navbar />
                <main className="w-full pb-12 px-4 flex-grow">{children}</main>
            </div>
            <Footer />
        </div>
    );
};

export default Layout;