// friseursalon-frontend/src/components/CalendarEvent.js

import React from 'react';

const CustomEvent = ({ event }) => {
    return (
        <div className="flex flex-col h-full">
            <strong className="text-sm font-semibold truncate">{event.title}</strong>
            {event.employee && (
                <span className="text-xs opacity-80">{event.employee}</span>
            )}
        </div>
    );
};

export default CustomEvent;