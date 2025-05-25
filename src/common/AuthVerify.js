import { useEffect } from "react";
import { jwtDecode } from "jwt-decode"; // Neu: für JWT Dekodierung (muss installiert werden)
import EventBus from "./EventBus"; // EventBus importieren

const AuthVerify = ({ logOut }) => {
    useEffect(() => {
        const user = JSON.parse(localStorage.getItem("user"));

        if (user && user.token) {
            const decodedJwt = jwtDecode(user.token); // Token dekodieren

            // Prüfen, ob der Token abgelaufen ist (exp ist in Sekunden)
            if (decodedJwt.exp * 1000 < Date.now()) {
                EventBus.dispatch("logout"); // Logout-Event auslösen
            }
        }
    }, [logOut]); // Abhängigkeit von logOut

    return null; // Diese Komponente rendert nichts visuelles
};

export default AuthVerify;