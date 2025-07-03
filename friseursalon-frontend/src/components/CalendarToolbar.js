// friseursalon-frontend/src/components/CalendarToolbar.js

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight, faUser, faScissors } from '@fortawesome/free-solid-svg-icons';

const CustomToolbar = (props) => {
    const { onNavigate, label, onView, view } = props;

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between mb-6 p-1 bg-white/30 rounded-xl border border-white/50 shadow-sm">
            {/* Navigation: Zurück, Heute, Weiter */}
            <div className="flex items-center gap-1">
                <button type="button" onClick={() => onNavigate('PREV')} className="p-2 w-10 h-10 rounded-md hover:bg-black/5">
                    <FontAwesomeIcon icon={faChevronLeft} />
                </button>
                <button type="button" onClick={() => onNavigate('TODAY')} className="px-4 py-2 text-sm font-semibold rounded-md hover:bg-black/5">
                    Heute
                </button>
                <button type="button" onClick={() => onNavigate('NEXT')} className="p-2 w-10 h-10 rounded-md hover:bg-black/5">
                    <FontAwesomeIcon icon={faChevronRight} />
                </button>
            </div>

            {/* Aktuelles Datum */}
            <h2 className="text-lg font-bold text-gray-800 my-2 sm:my-0">
                {label}
            </h2>

            {/* Ansichts-Umschalter und Filter */}
            <div className="flex items-center gap-2">
                {/* Ansicht-Umschalter (Woche/Tag) */}
                <div className="flex items-center bg-gray-200/80 rounded-lg p-1">
                    <button
                        onClick={() => onView('week')}
                        className={`px-3 py-1 text-sm font-semibold rounded-md ${view === 'week' ? 'bg-white shadow' : 'text-gray-600'}`}
                    >
                        Woche
                    </button>
                    <button
                        onClick={() => onView('day')}
                        className={`px-3 py-1 text-sm font-semibold rounded-md ${view === 'day' ? 'bg-white shadow' : 'text-gray-600'}`}
                    >
                        Tag
                    </button>
                </div>

                {/* Platzhalter für Filter-Dropdowns */}
                <div className="hidden md:flex items-center gap-2">
                    <select className="pl-3 pr-8 py-2 text-sm border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500">
                        <option>Alle Mitarbeiter</option>
                        <option>Mitarbeiter A</option>
                    </select>
                    <select className="pl-3 pr-8 py-2 text-sm border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500">
                        <option>Alle Services</option>
                        <option>Haarschnitt</option>
                    </select>
                </div>
            </div>
        </div>
    );
};

export default CustomToolbar;