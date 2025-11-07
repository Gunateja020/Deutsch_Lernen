import React from 'react';

interface FooterProps {
    designerName: string;
}

const Footer: React.FC<FooterProps> = ({ designerName }) => {
    return (
        <footer className="bg-white dark:bg-gray-800 mt-12 py-4 shadow-inner">
            <div className="container mx-auto px-4 text-center text-gray-500 dark:text-gray-400">
                <p>&copy; {new Date().getFullYear()} Deutsch Lernen. Viel Spaß beim Lernen! (Happy learning!)</p>
                <p className="mt-2 text-sm">
                    Designed by{' '}
                    <span className="font-semibold text-blue-600 dark:text-blue-400">
                        {designerName}
                    </span>
                </p>
            </div>
        </footer>
    );
};

export default Footer;