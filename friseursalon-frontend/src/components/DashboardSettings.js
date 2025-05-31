// friseursalon-frontend/src/components/DashboardSettings.js
import React, { useState, useEffect, useRef } from 'react';
import styles from './DashboardSettings.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faUndo, faEye, faEyeSlash, faGripVertical, faArrowUp, faArrowDown, faCog, faChartBar, faTags, faBullseye } from '@fortawesome/free-solid-svg-icons';

const KPI_VISIBILITY_STORAGE_KEY = 'friseurDashboardKpiVisibility_v2';
const KPI_GOALS_STORAGE_KEY = 'friseurDashboardKpiGoals_v1';
const KPI_GROUP_ORDER_STORAGE_KEY = 'friseurDashboardKpiGroupOrder_v1';
const TOP_N_SERVICES_STORAGE_KEY = 'friseurDashboardTopNServices_v1';

// Annahme: KPI_DEFINITIONS ist hier verfügbar (importiert oder hier definiert)
// Vereinfachte Struktur für dieses Beispiel, an deine Definition anpassen.
const KPI_DEFINITIONS = {
    main: {
        label: "Hauptkennzahlen",
        kpis: [
            { id: 'termine', label: "Termine" },
            { id: 'umsatz', label: "Umsatz" },
            { id: 'avgUmsatz', label: "Ø-Umsatz/Termin" },
            { id: 'auslastung', label: "Auslastung" }
        ]
    },
    customerService: {
        label: "Kunden- & Service-Metriken",
        kpis: [
            { id: 'einzigKunden', label: "Einzig. Kunden" },
            { id: 'kundenWachstum', label: "Kundenwachstum" },
            { id: 'avgBuchungKunde', label: "Ø Buchung/Kunde" },
            { id: 'neukundenAnteil', label: "Neukundenanteil" },
            { id: 'avgTermindauer', label: "Ø Termindauer" },
            { id: 'servicesAngeboten', label: "Services Angeboten" }
        ]
    },
    operationalDaily: {
        label: "Operative & Tagesaktuelle Zahlen",
        kpis: [
            { id: 'termineHeute', label: "Termine Heute" },
            { id: 'umsatzHeute', label: "Umsatz Heute" },
            { id: 'gesBevorstehend', label: "Ges. Bevorstehend" },
            { id: 'stornoquote', label: "Stornoquote" },
            { id: 'avgVorlaufzeit', label: "Ø Vorlaufzeit Buch." },
            { id: 'prognUmsatz', label: "Progn. Umsatz (30T)" }
        ]
    }
};


function DashboardSettings({ showMessage }) {
    const [kpiVisibility, setKpiVisibility] = useState(() => {
        try {
            const saved = localStorage.getItem(KPI_VISIBILITY_STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                const validated = {};
                Object.keys(KPI_DEFINITIONS).forEach(groupKey => {
                    validated[groupKey] = {
                        visible: parsed[groupKey]?.visible ?? true,
                        kpis: {}
                    };
                    KPI_DEFINITIONS[groupKey].kpis.forEach(kpi => {
                        validated[groupKey].kpis[kpi.id] = parsed[groupKey]?.kpis?.[kpi.id] ?? true;
                    });
                });
                return validated;
            }
        } catch (e) { console.error("Error reading KPI visibility from localStorage", e); }
        const defaults = {};
        Object.keys(KPI_DEFINITIONS).forEach(groupKey => {
            defaults[groupKey] = { visible: true, kpis: {} };
            KPI_DEFINITIONS[groupKey].kpis.forEach(kpi => {
                defaults[groupKey].kpis[kpi.id] = true;
            });
        });
        return defaults;
    });

    const [kpiGoals, setKpiGoals] = useState(() => {
        try {
            const saved = localStorage.getItem(KPI_GOALS_STORAGE_KEY);
            return saved ? JSON.parse(saved) : { monthlyRevenueGoal: '', monthlyAppointmentsGoal: '' };
        } catch (e) { return { monthlyRevenueGoal: '', monthlyAppointmentsGoal: '' }; }
    });

    const [kpiGroupOrder, setKpiGroupOrder] = useState(() => {
        try {
            const saved = localStorage.getItem(KPI_GROUP_ORDER_STORAGE_KEY);
            const parsed = saved ? JSON.parse(saved) : Object.keys(KPI_DEFINITIONS);
            const currentGroups = Object.keys(KPI_DEFINITIONS);
            // Stelle sicher, dass die Reihenfolge nur gültige und alle aktuellen Gruppen enthält
            const validOrder = parsed.filter(groupKey => currentGroups.includes(groupKey));
            currentGroups.forEach(groupKey => {
                if (!validOrder.includes(groupKey)) validOrder.push(groupKey); // Füge neue Gruppen am Ende hinzu
            });
            return validOrder;
        } catch (e) { return Object.keys(KPI_DEFINITIONS); }
    });

    const [topNServices, setTopNServices] = useState(() => {
        try {
            const saved = localStorage.getItem(TOP_N_SERVICES_STORAGE_KEY);
            return saved ? parseInt(saved, 10) : 5;
        } catch (e) { return 5; }
    });

    const draggedItem = useRef(null);
    const draggedOverItem = useRef(null);

    const handleSaveSettings = () => {
        try {
            localStorage.setItem(KPI_VISIBILITY_STORAGE_KEY, JSON.stringify(kpiVisibility));
            localStorage.setItem(KPI_GOALS_STORAGE_KEY, JSON.stringify(kpiGoals));
            localStorage.setItem(KPI_GROUP_ORDER_STORAGE_KEY, JSON.stringify(kpiGroupOrder));
            localStorage.setItem(TOP_N_SERVICES_STORAGE_KEY, topNServices.toString());
            if (showMessage) showMessage("Einstellungen erfolgreich gespeichert!", "success");
        } catch (e) {
            console.error("Error saving settings to localStorage", e);
            if (showMessage) showMessage("Fehler beim Speichern der Einstellungen.", "error");
        }
    };

    const handleResetSettings = () => {
        // Verwende window.confirm für eine einfache Bestätigung
        if (window.confirm("Möchten Sie wirklich alle Dashboard-Einstellungen auf die Standardwerte zurücksetzen? Diese Aktion kann nicht rückgängig gemacht werden.")) {
            localStorage.removeItem(KPI_VISIBILITY_STORAGE_KEY);
            localStorage.removeItem(KPI_GOALS_STORAGE_KEY);
            localStorage.removeItem(KPI_GROUP_ORDER_STORAGE_KEY);
            localStorage.removeItem(TOP_N_SERVICES_STORAGE_KEY);
            // Neuladen der Seite, um die Standardwerte effektiv anzuwenden
            // Eine bessere Methode wäre, die State-Variablen auf ihre Default-Funktionen zurückzusetzen
            // und dann showMessage aufzurufen, aber für einen schnellen Reset ist Reload okay.
            window.location.reload();
        }
    };

    const toggleKpiGroupVisibility = (groupKey) => {
        setKpiVisibility(prev => ({
            ...prev,
            [groupKey]: { ...prev[groupKey], visible: !prev[groupKey]?.visible }
        }));
    };

    const toggleIndividualKpiVisibility = (groupKey, kpiId) => {
        setKpiVisibility(prev => ({
            ...prev,
            [groupKey]: {
                ...prev[groupKey],
                kpis: { ...prev[groupKey]?.kpis, [kpiId]: !prev[groupKey]?.kpis?.[kpiId] }
            }
        }));
    };

    const handleGoalChange = (goalKey, value) => {
        const numValue = value === '' ? '' : Number(value); // Erlaube leeren String für "kein Ziel"
        // Erlaube leeren String oder positive Zahlen (inkl. 0)
        if (value === '' || (!isNaN(numValue) && numValue >= 0)) {
            setKpiGoals(prev => ({ ...prev, [goalKey]: value === '' ? null : numValue })); // Speichere null wenn leer
        }
    };

    const moveKpiGroup = (groupKey, direction) => {
        setKpiGroupOrder(prevOrder => {
            const currentIndex = prevOrder.indexOf(groupKey);
            if (currentIndex === -1) return prevOrder;
            const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
            if (newIndex < 0 || newIndex >= prevOrder.length) return prevOrder;

            const newOrder = [...prevOrder];
            const [item] = newOrder.splice(currentIndex, 1);
            newOrder.splice(newIndex, 0, item);
            return newOrder;
        });
        if (showMessage) showMessage("Reihenfolge der KPI-Gruppen angepasst.", "info");
    };

    const handleDragStart = (e, index) => {
        draggedItem.current = index;
        e.dataTransfer.effectAllowed = "move";
        // e.dataTransfer.setData('text/html', e.target); // Kann bei komplexen Elementen Probleme machen
        e.dataTransfer.setData('application/json', JSON.stringify({index: index, groupKey: kpiGroupOrder[index]}));
    };

    const handleDragOver = (e, index) => {
        e.preventDefault(); // Notwendig, um onDrop zu ermöglichen
        draggedOverItem.current = index;
    };

    const handleDrop = (e) => {
        e.preventDefault();
        if (draggedItem.current === null || draggedOverItem.current === null || draggedItem.current === draggedOverItem.current) {
            draggedItem.current = null;
            draggedOverItem.current = null;
            return;
        }
        const newOrder = [...kpiGroupOrder];
        const item = newOrder.splice(draggedItem.current, 1)[0];
        newOrder.splice(draggedOverItem.current, 0, item);
        setKpiGroupOrder(newOrder);
        draggedItem.current = null;
        draggedOverItem.current = null;
        if (showMessage) showMessage("Reihenfolge der KPI-Gruppen angepasst.", "info");
    };

    return (
        <div className={`bg-white p-4 sm:p-6 rounded-xl shadow-lg ${styles.dashboardSettingsContainer}`}>
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 font-serif mb-6 pb-4 border-b border-gray-200 flex items-center">
                <FontAwesomeIcon icon={faCog} className="mr-3 text-indigo-600" />
                Dashboard Einstellungen
            </h2>

            <section className="mb-8">
                <h3 className="text-lg font-medium text-gray-700 mb-4 font-serif flex items-center">
                    <FontAwesomeIcon icon={faChartBar} className="mr-2 text-gray-500" /> Kennzahlen (KPIs) anpassen
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                    Wählen Sie aus, welche Kennzahlengruppen und einzelne KPIs in Ihrer Dashboard-Übersicht angezeigt werden sollen. Ändern Sie die Reihenfolge der Gruppen per Drag & Drop oder mit den Pfeiltasten.
                </p>
                <ul className={`space-y-3 ${styles.kpiGroupList}`}>
                    {kpiGroupOrder.map((groupKey, index) => {
                        const groupDef = KPI_DEFINITIONS[groupKey];
                        if (!groupDef) return null;
                        const groupVisibility = kpiVisibility[groupKey] || { visible: true, kpis: {} };

                        return (
                            <li
                                key={groupKey}
                                draggable
                                onDragStart={(e) => handleDragStart(e, index)}
                                onDragOver={(e) => handleDragOver(e, index)}
                                onDrop={handleDrop}
                                onDragEnd={() => { /* Reset drag refs if needed */ }}
                                className={`p-4 border border-gray-200 rounded-lg bg-slate-50 hover:shadow-md transition-shadow ${styles.kpiGroupItem}`}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center">
                                        <FontAwesomeIcon icon={faGripVertical} className="mr-3 text-gray-400 cursor-move" title="Verschieben (Drag & Drop)" />
                                        <label htmlFor={`group-toggle-${groupKey}`} className="flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                id={`group-toggle-${groupKey}`}
                                                checked={groupVisibility.visible}
                                                onChange={() => toggleKpiGroupVisibility(groupKey)}
                                                className="h-5 w-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 mr-2"
                                            />
                                            <span className="font-medium text-gray-700">{groupDef.label}</span>
                                        </label>
                                    </div>
                                    <div className="space-x-1">
                                        <button onClick={() => moveKpiGroup(groupKey, 'up')} disabled={index === 0} className={`p-1.5 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-md hover:bg-gray-100 ${styles.moveButton}`} title="Gruppe nach oben verschieben"><FontAwesomeIcon icon={faArrowUp} /></button>
                                        <button onClick={() => moveKpiGroup(groupKey, 'down')} disabled={index === kpiGroupOrder.length - 1} className={`p-1.5 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-md hover:bg-gray-100 ${styles.moveButton}`} title="Gruppe nach unten verschieben"><FontAwesomeIcon icon={faArrowDown} /></button>
                                    </div>
                                </div>
                                {groupVisibility.visible && (
                                    <ul className="pl-10 mt-2 space-y-1.5"> {/* Etwas mehr Einzug und Abstand */}
                                        {groupDef.kpis.map(kpi => (
                                            <li key={kpi.id} className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    id={`kpi-toggle-${groupKey}-${kpi.id}`}
                                                    checked={groupVisibility.kpis?.[kpi.id] ?? true}
                                                    onChange={() => toggleIndividualKpiVisibility(groupKey, kpi.id)}
                                                    className="h-4 w-4 text-indigo-500 border-gray-300 rounded focus:ring-indigo-400 mr-2.5" // Größerer Abstand
                                                />
                                                <label htmlFor={`kpi-toggle-${groupKey}-${kpi.id}`} className="text-sm text-gray-600 cursor-pointer">{kpi.label}</label>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </li>
                        );
                    })}
                </ul>
            </section>

            <section className="mb-8">
                <h3 className="text-lg font-medium text-gray-700 mb-4 font-serif flex items-center">
                    <FontAwesomeIcon icon={faBullseye} className="mr-2 text-gray-500" /> KPI Ziele definieren
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 p-4 border border-gray-200 rounded-lg bg-slate-50">
                    <div className={styles.formGroup}>
                        <label htmlFor="monthlyRevenueGoal" className="block text-sm font-medium text-gray-600">Monatsumsatzziel (€)</label>
                        <input
                            type="number"
                            id="monthlyRevenueGoal"
                            value={kpiGoals.monthlyRevenueGoal === null ? '' : kpiGoals.monthlyRevenueGoal} // Zeige leeren String für null
                            onChange={(e) => handleGoalChange('monthlyRevenueGoal', e.target.value)}
                            placeholder="z.B. 5000"
                            min="0" // Verhindert negative Eingaben im Browser
                            className={`mt-1 w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${styles.formInput}`}
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label htmlFor="monthlyAppointmentsGoal" className="block text-sm font-medium text-gray-600">Monatliches Terminziel (Anzahl)</label>
                        <input
                            type="number"
                            id="monthlyAppointmentsGoal"
                            value={kpiGoals.monthlyAppointmentsGoal === null ? '' : kpiGoals.monthlyAppointmentsGoal} // Zeige leeren String für null
                            onChange={(e) => handleGoalChange('monthlyAppointmentsGoal', e.target.value)}
                            placeholder="z.B. 100"
                            min="0"
                            className={`mt-1 w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${styles.formInput}`}
                        />
                    </div>
                </div>
            </section>

            <section className="mb-8">
                <h3 className="text-lg font-medium text-gray-700 mb-4 font-serif flex items-center">
                    <FontAwesomeIcon icon={faTags} className="mr-2 text-gray-500" /> Diagramm-Einstellungen
                </h3>
                <div className="p-4 border border-gray-200 rounded-lg bg-slate-50">
                    <div className={styles.formGroup}>
                        <label htmlFor="topNServices" className="block text-sm font-medium text-gray-600">Anzahl Top Dienstleistungen im Diagramm</label>
                        <select
                            id="topNServices"
                            value={topNServices}
                            onChange={(e) => setTopNServices(parseInt(e.target.value, 10))}
                            className={`mt-1 block w-full sm:w-auto p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${styles.formInput}`}
                        >
                            <option value="3">Top 3</option>
                            <option value="5">Top 5</option>
                            <option value="7">Top 7</option>
                            <option value="10">Top 10</option>
                        </select>
                    </div>
                </div>
            </section>

            <div className="mt-8 pt-6 border-t border-gray-300 flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4">
                <button
                    onClick={handleResetSettings}
                    className={`px-6 py-2.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-150 ${styles.actionButton} ${styles.resetButton}`}
                >
                    <FontAwesomeIcon icon={faUndo} className="mr-2" />
                    Zurücksetzen
                </button>
                <button
                    onClick={handleSaveSettings}
                    className={`inline-flex items-center justify-center px-6 py-2.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-150 ${styles.actionButton} ${styles.saveButton}`}
                >
                    <FontAwesomeIcon icon={faSave} className="mr-2" />
                    Einstellungen speichern
                </button>
            </div>
        </div>
    );
}

export default DashboardSettings;
