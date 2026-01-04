import React, { useState, useEffect } from 'react';
import DesktopHomePage from './DesktopHomePage';
import MobileHomepage from './MobileHomepage';

const HomePage = () => {
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return isMobile ? <MobileHomepage /> : <DesktopHomePage />;
};

export default HomePage;
