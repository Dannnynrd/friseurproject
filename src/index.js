import React from 'react';
import ReactDOM from 'react-dom/client'; // Für React 18+ (create-react-app Standard)
import './index.css'; // Standardmäßiges CSS für index.js
import App from './App'; // Import deiner App-Komponente
import reportWebVitals from './reportWebVitals'; // Für Performance-Messung
// WICHTIG: BrowserRouter nur einmal hier, ganz oben in der Anwendung, definieren
import { BrowserRouter } from 'react-router-dom';


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <BrowserRouter> {/* HIER WIRD DER BROWSERROUTER UMWICKELT */}
            <App />
        </BrowserRouter>
    </React.StrictMode>
);

reportWebVitals();