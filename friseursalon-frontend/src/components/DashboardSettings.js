// File: src/components/DashboardSettings.js
import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faSave, faEye, faEyeSlash, faAngleUp, faAngleDown, faCheckCircle,
    faExclamationCircle, faSpinner, faStore, faBell, faCalendarCheck as faCalendarAlt
} from '@fortawesome/free-solid-svg-icons';
import './DashboardSettings.module.css';

// Default KPI definitions (could be moved to a config file)
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

// localStorage keys
const KPI_VISIBILITY_STORAGE_KEY = 'friseurDashboardKpiVisibility_v2';
const KPI_GOALS_STORAGE_KEY = 'friseurDashboardKpiGoals_v1';
const KPI_GROUP_ORDER_STORAGE_KEY = 'friseurDashboardKpiGroupOrder_v1';
const TOP_N_SERVICES_STORAGE_KEY = 'friseurDashboardTopNServices_v1';
const SALON_SETTINGS_STORAGE_KEY = 'friseurSalonSettings_v1';


// Helper to get initial state from localStorage or return default
const getInitialState = (key, defaultValue) => {
    // Resolve defaultValue if it's a function
    const resolvedDefaultValue = typeof defaultValue === 'function' ? defaultValue() : defaultValue;
    try {
        const saved = localStorage.getItem(key);
        if (saved) {
            const parsed = JSON.parse(saved);
            // If the default value is an array, ensure the parsed value is also an array.
            // Otherwise, fall back to the default.
            if (Array.isArray(resolvedDefaultValue)) {
                return Array.isArray(parsed) ? parsed : resolvedDefaultValue;
            }
            // If the default value is an object (and not null), merge parsed into it.
            // This handles cases where new default properties might have been added.
            if (typeof resolvedDefaultValue === 'object' && resolvedDefaultValue !== null) {
                return { ...resolvedDefaultValue, ...parsed };
            }
            // For primitive types or if types don't match above conditions, return parsed.
            return parsed;
        }
    } catch (e) {
        console.error(`Fehler beim Lesen von ${key} aus localStorage:`, e);
    }
    // If anything fails or nothing is saved, return the resolved default value.
    return resolvedDefaultValue;
};


function DashboardSettings({ currentUser }) {
    // KPI_DEFINITIONS is stable, so directly use KPI_DEFINITIONS_DEFAULT
    // const KPI_DEFINITIONS = KPI_DEFINITIONS_DEFAULT; // Not needed as a separate const if only using default

    const [kpiVisibility, setKpiVisibility] = useState(() => getInitialState(KPI_VISIBILITY_STORAGE_KEY, () => {
        const defaultVisibility = {};
        for (const groupKey in KPI_DEFINITIONS_DEFAULT) {
            defaultVisibility[groupKey] = { visible: true, kpis: {} };
            KPI_DEFINITIONS_DEFAULT[groupKey].kpis.forEach(kpi => {
                defaultVisibility[groupKey].kpis[kpi.id] = true;
            });
        }
        return defaultVisibility;
    }));

    const [kpiGoals, setKpiGoals] = useState(() => getInitialState(KPI_GOALS_STORAGE_KEY, {
        monthlyRevenueGoal: '',
        monthlyAppointmentsGoal: '',
    }));

    // Initialize kpiGroupOrder, ensuring it's an array.
    // The useEffect below will further sanitize and synchronize it.
    const [kpiGroupOrder, setKpiGroupOrder] = useState(() =>
        getInitialState(KPI_GROUP_ORDER_STORAGE_KEY, () => Object.keys(KPI_DEFINITIONS_DEFAULT))
    );

    const [topNServicesConfig, setTopNServicesConfig] = useState(() => getInitialState(TOP_N_SERVICES_STORAGE_KEY, 5));

    const [salonSettings, setSalonSettings] = useState(() => getInitialState(SALON_SETTINGS_STORAGE_KEY, {
        salonName: "Mein Friseursalon",
        minBookingLeadTimeHours: 2,
        maxBookingHorizonDays: 60,
        cancellationGracePeriodHours: 24,
        defaultSlotDurationMinutes: 30,
        adminNotificationEmail: currentUser?.email || '',
        autoConfirmBookings: true,
        salonSlogan: "Ihr Experte für Haar & Stil!",
    }));

    const [saveMessage, setSaveMessage] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // Effect to synchronize kpiGroupOrder with KPI_DEFINITIONS_DEFAULT
    // This ensures that if definitions change, the order is updated,
    // and it also guarantees kpiGroupOrder is always a valid array.
    useEffect(() => {
        const definitionKeys = Object.keys(KPI_DEFINITIONS_DEFAULT);
        // Start with the current order if it's an array, otherwise start fresh
        let currentValidOrder = Array.isArray(kpiGroupOrder) ? kpiGroupOrder.filter(key => definitionKeys.includes(key)) : [];

        let orderChanged = false;

        // Add any new keys from definitions that are not in the current valid order
        definitionKeys.forEach(key => {
            if (!currentValidOrder.includes(key)) {
                currentValidOrder.push(key);
                orderChanged = true;
            }
        });

        // Check if the length changed (e.g. old keys were filtered out)
        if (Array.isArray(kpiGroupOrder) && currentValidOrder.length !== kpiGroupOrder.length) {
            orderChanged = true;
        }

        // If the order was not an array initially, or if it changed, update the state.
        if (!Array.isArray(kpiGroupOrder) || orderChanged) {
            setKpiGroupOrder(currentValidOrder);
        }
    }, [kpiGroupOrder]); // Rerun if kpiGroupOrder itself changes (e.g. from localStorage)


    const showAndClearSaveMessage = (message, type = 'success') => {
        setSaveMessage({ text: message, type });
        setTimeout(() => setSaveMessage(''), 3500);
    };

    const handleSalonSettingChange = (e) => {
        const { name, value, type, checked } = e.target;
        setSalonSettings(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : (type === 'number' ? parseInt(value, 10) : value)
        }));
    };

    const handleSaveSettings = () => {
        setIsSaving(true);
        try {
            localStorage.setItem(KPI_VISIBILITY_STORAGE_KEY, JSON.stringify(kpiVisibility));
            localStorage.setItem(KPI_GOALS_STORAGE_KEY, JSON.stringify({
                monthlyRevenueGoal: kpiGoals.monthlyRevenueGoal === '' ? null : Number(kpiGoals.monthlyRevenueGoal),
                monthlyAppointmentsGoal: kpiGoals.monthlyAppointmentsGoal === '' ? null : Number(kpiGoals.monthlyAppointmentsGoal),
            }));
            // Ensure kpiGroupOrder is an array before saving
            localStorage.setItem(KPI_GROUP_ORDER_STORAGE_KEY, JSON.stringify(Array.isArray(kpiGroupOrder) ? kpiGroupOrder : Object.keys(KPI_DEFINITIONS_DEFAULT)));
            localStorage.setItem(TOP_N_SERVICES_STORAGE_KEY, topNServicesConfig.toString());
            localStorage.setItem(SALON_SETTINGS_STORAGE_KEY, JSON.stringify(salonSettings));
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
            // Ensure prevOrder is an array
            const orderArray = Array.isArray(prevOrder) ? [...prevOrder] : Object.keys(KPI_DEFINITIONS_DEFAULT);
            const currentIndex = orderArray.indexOf(groupKey);

            if (currentIndex === -1) return orderArray; // Should not happen if synced

            const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
            if (newIndex < 0 || newIndex >= orderArray.length) return orderArray;

            const newOrder = [...orderArray];
            [newOrder[currentIndex], newOrder[newIndex]] = [newOrder[newIndex], newOrder[currentIndex]];
            return newOrder;
        });
    };

    if (!currentUser || !currentUser.roles?.includes("ROLE_ADMIN")) {
        return <p className="form-message error">Zugriff verweigert.</p>;
    }

    // Ensure kpiGroupOrder is an array before mapping
    const safeKpiGroupOrder = Array.isArray(kpiGroupOrder) ? kpiGroupOrder : [];


    return (
        <div className="dashboard-settings-container">
            {saveMessage.text && (
                <p className={`form-message mb-4 ${saveMessage.type === 'success' ? 'success' : 'error'}`}>
                    <FontAwesomeIcon icon={saveMessage.type === 'success' ? faCheckCircle : faExclamationCircle} /> {saveMessage.text}
                </p>
            )}

            <section className="settings-section">
                <h3 className="settings-section-title"><FontAwesomeIcon icon={faStore} /> Salon & Buchung</h3>
                <div className="settings-grid two-columns">
                    <div className="form-group settings-form-group">
                        <label htmlFor="salonName">Salon Name</label>
                        <input type="text" id="salonName" name="salonName" value={salonSettings.salonName} onChange={handleSalonSettingChange} />
                    </div>
                    <div className="form-group settings-form-group">
                        <label htmlFor="salonSlogan">Salon Slogan/Kurzbeschreibung</label>
                        <input type="text" id="salonSlogan" name="salonSlogan" value={salonSettings.salonSlogan} onChange={handleSalonSettingChange} />
                    </div>
                    <div className="form-group settings-form-group">
                        <label htmlFor="minBookingLeadTimeHours">Min. Vorlaufzeit Buchung (Std.)</label>
                        <input type="number" id="minBookingLeadTimeHours" name="minBookingLeadTimeHours" value={salonSettings.minBookingLeadTimeHours} onChange={handleSalonSettingChange} min="0" />
                    </div>
                    <div className="form-group settings-form-group">
                        <label htmlFor="maxBookingHorizonDays">Max. Buchungshorizont (Tage)</label>
                        <input type="number" id="maxBookingHorizonDays" name="maxBookingHorizonDays" value={salonSettings.maxBookingHorizonDays} onChange={handleSalonSettingChange} min="1" />
                    </div>
                    <div className="form-group settings-form-group">
                        <label htmlFor="cancellationGracePeriodHours">Stornierungsfrist (Std. vorher)</label>
                        <input type="number" id="cancellationGracePeriodHours" name="cancellationGracePeriodHours" value={salonSettings.cancellationGracePeriodHours} onChange={handleSalonSettingChange} min="0" />
                    </div>
                    <div className="form-group settings-form-group">
                        <label htmlFor="defaultSlotDurationMinutes">Standard Terminslot (Min.)</label>
                        <select id="defaultSlotDurationMinutes" name="defaultSlotDurationMinutes" value={salonSettings.defaultSlotDurationMinutes} onChange={handleSalonSettingChange}>
                            <option value="15">15 Minuten</option>
                            <option value="30">30 Minuten</option>
                            <option value="45">45 Minuten</option>
                            <option value="60">60 Minuten</option>
                        </select>
                    </div>
                </div>
            </section>

            <section className="settings-section">
                <h3 className="settings-section-title"><FontAwesomeIcon icon={faBell} /> Benachrichtigungen</h3>
                <div className="settings-grid two-columns">
                    <div className="form-group settings-form-group">
                        <label htmlFor="adminNotificationEmail">Admin E-Mail für Benachrichtigungen</label>
                        <input type="email" id="adminNotificationEmail" name="adminNotificationEmail" value={salonSettings.adminNotificationEmail} onChange={handleSalonSettingChange} />
                    </div>
                    <div className="form-group settings-form-group toggle-setting">
                        <label htmlFor="autoConfirmBookings">Automatische Buchungsbestätigung an Kunden</label>
                        <div className="settings-toggle-switch">
                            <input type="checkbox" id="autoConfirmBookings" name="autoConfirmBookings" checked={salonSettings.autoConfirmBookings} onChange={handleSalonSettingChange} />
                            <label htmlFor="autoConfirmBookings" className="slider"></label>
                        </div>
                    </div>
                </div>
            </section>

            <section className="settings-section">
                <h3 className="settings-section-title"><FontAwesomeIcon icon={faCalendarAlt} /> Dashboard Ansicht & KPIs</h3>
                <p className="settings-section-description">
                    Passen Sie an, welche Kennzahlengruppen und einzelne KPIs in Ihrer Dashboard-Übersicht angezeigt werden und in welcher Reihenfolge die Gruppen erscheinen.
                </p>
                {safeKpiGroupOrder.map((groupKey, index) => { {/* MODIFIED: Use safeKpiGroupOrder */}
                    const groupDef = KPI_DEFINITIONS_DEFAULT[groupKey];
                    if (!groupDef) return null;
                    // Ensure kpiVisibility structure for the groupKey exists
                    const groupVisibility = kpiVisibility[groupKey] || { visible: true, kpis: {} };
                    const isGroupVisible = groupVisibility.visible;

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
                                    <button type="button" onClick={() => moveKpiGroup(groupKey, 'up')} disabled={index === 0} aria-label="Gruppe nach oben verschieben">
                                        <FontAwesomeIcon icon={faAngleUp} />
                                    </button>
                                    <button type="button" onClick={() => moveKpiGroup(groupKey, 'down')} disabled={index === safeKpiGroupOrder.length - 1} aria-label="Gruppe nach unten verschieben">
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
                                                checked={groupVisibility.kpis[kpi.id] ?? true} // Default to true if kpi.id is new
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
                <div className="kpi-goal-inputs settings-grid two-columns">
                    <div className="form-group settings-form-group">
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
                    <div className="form-group settings-form-group">
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
                <div className="form-group settings-form-group">
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
                <button type="button" onClick={handleSaveSettings} className="button-link primary" disabled={isSaving}>
                    {isSaving ? <><FontAwesomeIcon icon={faSpinner} spin /> Speichern...</> : <><FontAwesomeIcon icon={faSave} /> Alle Einstellungen Speichern</>}
                </button>
            </div>
        </div>
    );
}

export default DashboardSettings;
