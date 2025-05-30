// File: friseursalon-frontend/src/components/DashboardSettings.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faEye, faEyeSlash, faAngleUp, faAngleDown, faCheckCircle, faExclamationCircle, faSpinner } from '@fortawesome/free-solid-svg-icons';
import './DashboardSettings.css'; // We'll create this CSS file

// These would typically come from a shared config or AdminDashboardStats itself if not centralizing
const KPI_DEFINITIONS_DEFAULT = {
    main: {
        label: "Hauptkennzahlen",
        kpis: [
            { id: 'termine', label: "Termine", goalKey: 'monthlyAppointmentsGoal' },
            { id: 'umsatz', label: "Umsatz", goalKey: 'monthlyRevenueGoal', isCurrency: true },
            { id: 'avgUmsatz', label: "Ø-Umsatz/Termin", isCurrency: true },
            { id: 'auslastung', label: "Auslastung", isPercentage: true },
        ]
    },
    customerService: {
        label: "Kunden- & Service-Metriken",
        kpis: [
            { id: 'einzigKunden', label: "Einzig. Kunden" },
            { id: 'kundenWachstum', label: "Kundenwachstum", isPercentage: true },
            { id: 'avgBuchungKunde', label: "Ø Buchung/Kunde" },
            { id: 'neukundenAnteil', label: "Neukundenanteil", isPercentage: true },
            { id: 'avgTermindauer', label: "Ø Termindauer" },
            { id: 'servicesAngeboten', label: "Services Angeboten" },
        ]
    },
    operationalDaily: {
        label: "Operative & Tagesaktuelle Zahlen",
        kpis: [
            { id: 'termineHeute', label: "Termine Heute" },
            { id: 'umsatzHeute', label: "Umsatz Heute", isCurrency: true },
            { id: 'gesBevorstehend', label: "Ges. Bevorstehend" },
            { id: 'stornoquote', label: "Stornoquote", isPercentage: true },
            { id: 'avgVorlaufzeit', label: "Ø Vorlaufzeit Buch." },
            { id: 'prognUmsatz', label: "Progn. Umsatz (30T)", isCurrency: true },
        ]
    }
};

const KPI_VISIBILITY_STORAGE_KEY = 'friseurDashboardKpiVisibility_v2';
const KPI_GOALS_STORAGE_KEY = 'friseurDashboardKpiGoals_v1';
const KPI_GROUP_ORDER_STORAGE_KEY = 'friseurDashboardKpiGroupOrder_v1';
const TOP_N_SERVICES_STORAGE_KEY = 'friseurDashboardTopNServices_v1';


function DashboardSettings({ currentUser }) {
    // Initialize KPI definitions - in a real app, this might be fetched or a more complex structure
    const KPI_DEFINITIONS = KPI_DEFINITIONS_DEFAULT;


    const [kpiVisibility, setKpiVisibility] = useState(() => {
        try {
            const saved = localStorage.getItem(KPI_VISIBILITY_STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                const validatedVisibility = {};
                for (const groupKey in KPI_DEFINITIONS) {
                    validatedVisibility[groupKey] = {
                        visible: parsed[groupKey]?.visible ?? true,
                        kpis: {}
                    };
                    KPI_DEFINITIONS[groupKey].kpis.forEach(kpi => {
                        validatedVisibility[groupKey].kpis[kpi.id] = parsed[groupKey]?.kpis?.[kpi.id] ?? true;
                    });
                }
                return validatedVisibility;
            }
        } catch (e) { console.error("Fehler beim Lesen der KPI Sichtbarkeit:", e); }
        const defaultVisibility = {};
        for (const groupKey in KPI_DEFINITIONS) {
            defaultVisibility[groupKey] = { visible: true, kpis: {} };
            KPI_DEFINITIONS[groupKey].kpis.forEach(kpi => {
                defaultVisibility[groupKey].kpis[kpi.id] = true;
            });
        }
        return defaultVisibility;
    });

    const [kpiGoals, setKpiGoals] = useState(() => {
        try {
            const savedGoals = localStorage.getItem(KPI_GOALS_STORAGE_KEY);
            return savedGoals ? JSON.parse(savedGoals) : {
                monthlyRevenueGoal: '', // Keep as string for input field
                monthlyAppointmentsGoal: '', // Keep as string for input field
            };
        } catch (e) {
            console.error("Fehler beim Lesen der KPI Ziele:", e);
            return { monthlyRevenueGoal: '', monthlyAppointmentsGoal: '' };
        }
    });

    const [kpiGroupOrder, setKpiGroupOrder] = useState(() => {
        try {
            const savedOrder = localStorage.getItem(KPI_GROUP_ORDER_STORAGE_KEY);
            const parsedOrder = savedOrder ? JSON.parse(savedOrder) : Object.keys(KPI_DEFINITIONS);
            // Ensure all current group keys are present, add new ones at the end
            const currentKeys = Object.keys(KPI_DEFINITIONS);
            const finalOrder = [];
            parsedOrder.forEach(key => {
                if (currentKeys.includes(key)) {
                    finalOrder.push(key);
                }
            });
            currentKeys.forEach(key => {
                if (!finalOrder.includes(key)) {
                    finalOrder.push(key);
                }
            });
            return finalOrder;
        } catch (e) {
            console.error("Fehler beim Lesen der KPI Gruppenreihenfolge:", e);
            return Object.keys(KPI_DEFINITIONS);
        }
    });

    const [topNServicesConfig, setTopNServicesConfig] = useState(() => {
        try {
            const savedTopN = localStorage.getItem(TOP_N_SERVICES_STORAGE_KEY);
            return savedTopN ? parseInt(savedTopN, 10) : 5;
        } catch (e) { return 5; }
    });

    const [saveMessage, setSaveMessage] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const showAndClearSaveMessage = (message, type = 'success') => {
        setSaveMessage({ text: message, type });
        setTimeout(() => setSaveMessage(''), 3500);
    };

    const handleSaveSettings = () => {
        setIsSaving(true);
        try {
            localStorage.setItem(KPI_VISIBILITY_STORAGE_KEY, JSON.stringify(kpiVisibility));
            localStorage.setItem(KPI_GOALS_STORAGE_KEY, JSON.stringify({
                monthlyRevenueGoal: kpiGoals.monthlyRevenueGoal === '' ? null : Number(kpiGoals.monthlyRevenueGoal),
                monthlyAppointmentsGoal: kpiGoals.monthlyAppointmentsGoal === '' ? null : Number(kpiGoals.monthlyAppointmentsGoal),
            }));
            localStorage.setItem(KPI_GROUP_ORDER_STORAGE_KEY, JSON.stringify(kpiGroupOrder));
            localStorage.setItem(TOP_N_SERVICES_STORAGE_KEY, topNServicesConfig.toString());
            showAndClearSaveMessage("Einstellungen erfolgreich gespeichert!");
        } catch (error) {
            console.error("Fehler beim Speichern der Dashboard-Einstellungen:", error);
            showAndClearSaveMessage("Fehler beim Speichern der Einstellungen.", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const handleGoalChange = (goalKey, value) => {
        setKpiGoals(prev => ({ ...prev, [goalKey]: value }));
    };

    const toggleKpiGroupVisibility = (groupKey) => {
        setKpiVisibility(prev => ({ ...prev, [groupKey]: { ...prev[groupKey], visible: !prev[groupKey].visible } }));
    };

    const toggleIndividualKpiVisibility = (groupKey, kpiId) => {
        setKpiVisibility(prev => ({ ...prev, [groupKey]: { ...prev[groupKey], kpis: { ...prev[groupKey].kpis, [kpiId]: !prev[groupKey].kpis[kpiId] } } }));
    };

    const moveKpiGroup = (groupKey, direction) => {
        setKpiGroupOrder(prevOrder => {
            const currentIndex = prevOrder.indexOf(groupKey);
            if (currentIndex === -1) return prevOrder;
            const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
            if (newIndex < 0 || newIndex >= prevOrder.length) return prevOrder;
            const newOrder = [...prevOrder];
            [newOrder[currentIndex], newOrder[newIndex]] = [newOrder[newIndex], newOrder[currentIndex]];
            return newOrder;
        });
    };

    if (!currentUser || !currentUser.roles?.includes("ROLE_ADMIN")) {
        return <p className="form-message error">Zugriff verweigert.</p>;
    }

    return (
        <div className="dashboard-settings-container">
            {saveMessage.text && (
                <p className={`form-message mb-4 ${saveMessage.type === 'success' ? 'success' : 'error'}`}>
                    <FontAwesomeIcon icon={saveMessage.type === 'success' ? faCheckCircle : faExclamationCircle} /> {saveMessage.text}
                </p>
            )}

            <section className="settings-section">
                <h3 className="settings-section-title">KPI Sichtbarkeit & Reihenfolge</h3>
                <p className="settings-section-description">
                    Passen Sie an, welche Kennzahlengruppen und einzelne KPIs in Ihrer Dashboard-Übersicht angezeigt werden und in welcher Reihenfolge die Gruppen erscheinen.
                </p>
                {kpiGroupOrder.map((groupKey, index) => {
                    const groupDef = KPI_DEFINITIONS[groupKey];
                    if (!groupDef) return null;
                    const isGroupVisible = kpiVisibility[groupKey]?.visible ?? true;
                    return (
                        <fieldset key={groupKey} className="kpi-visibility-group">
                            <legend className="kpi-group-legend">
                                <div className="kpi-group-toggle">
                                    <input
                                        type="checkbox"
                                        id={`toggle-group-${groupKey}`}
                                        checked={isGroupVisible}
                                        onChange={() => toggleKpiGroupVisibility(groupKey)}
                                    />
                                    <label htmlFor={`toggle-group-${groupKey}`}>{groupDef.label}</label>
                                    <FontAwesomeIcon icon={isGroupVisible ? faEye : faEyeSlash} className="visibility-icon" />
                                </div>
                                <div className="kpi-group-order-buttons">
                                    <button onClick={() => moveKpiGroup(groupKey, 'up')} disabled={index === 0} aria-label="Gruppe nach oben verschieben">
                                        <FontAwesomeIcon icon={faAngleUp} />
                                    </button>
                                    <button onClick={() => moveKpiGroup(groupKey, 'down')} disabled={index === kpiGroupOrder.length - 1} aria-label="Gruppe nach unten verschieben">
                                        <FontAwesomeIcon icon={faAngleDown} />
                                    </button>
                                </div>
                            </legend>
                            {isGroupVisible && (
                                <div className="individual-kpi-toggles">
                                    {groupDef.kpis.map(kpi => (
                                        <div key={kpi.id} className="kpi-visibility-toggle individual">
                                            <input
                                                type="checkbox"
                                                id={`toggle-kpi-${kpi.id}`}
                                                checked={kpiVisibility[groupKey]?.kpis[kpi.id] ?? true}
                                                onChange={() => toggleIndividualKpiVisibility(groupKey, kpi.id)}
                                            />
                                            <label htmlFor={`toggle-kpi-${kpi.id}`}>{kpi.label}</label>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </fieldset>
                    );
                })}
            </section>

            <section className="settings-section">
                <h3 className="settings-section-title">Monatsziele Festlegen</h3>
                <p className="settings-section-description">
                    Definieren Sie Ihre monatlichen Ziele für Umsatz und Terminanzahl. Diese werden in der KPI-Übersicht visualisiert.
                </p>
                <div className="kpi-goal-inputs">
                    <div className="form-group">
                        <label htmlFor="monthlyRevenueGoal">Umsatzziel (€):</label>
                        <input
                            type="number"
                            id="monthlyRevenueGoal"
                            value={kpiGoals.monthlyRevenueGoal ?? ''}
                            onChange={(e) => handleGoalChange('monthlyRevenueGoal', e.target.value)}
                            placeholder="z.B. 5000"
                            min="0"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="monthlyAppointmentsGoal">Terminanzahl-Ziel:</label>
                        <input
                            type="number"
                            id="monthlyAppointmentsGoal"
                            value={kpiGoals.monthlyAppointmentsGoal ?? ''}
                            onChange={(e) => handleGoalChange('monthlyAppointmentsGoal', e.target.value)}
                            placeholder="z.B. 100"
                            min="0"
                        />
                    </div>
                </div>
            </section>

            <section className="settings-section">
                <h3 className="settings-section-title">Diagramm-Einstellungen</h3>
                <p className="settings-section-description">
                    Konfigurieren Sie die Darstellung Ihrer Diagramme.
                </p>
                <div className="form-group">
                    <label htmlFor="topNServices">Anzahl Top Dienstleistungen (Diagramm):</label>
                    <select
                        id="topNServices"
                        value={topNServicesConfig}
                        onChange={(e) => setTopNServicesConfig(parseInt(e.target.value, 10))}
                    >
                        {[3, 5, 7, 10].map(n => <option key={n} value={n}>Top {n}</option>)}
                    </select>
                </div>
            </section>

            <div className="settings-save-action">
                <button onClick={handleSaveSettings} className="button-link" disabled={isSaving}>
                    {isSaving ? <><FontAwesomeIcon icon={faSpinner} spin /> Speichern...</> : <><FontAwesomeIcon icon={faSave} /> Einstellungen Speichern</>}
                </button>
            </div>
        </div>
    );
}

export default DashboardSettings;
