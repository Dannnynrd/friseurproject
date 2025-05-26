import { useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import EventBus from "./EventBus";

const AuthVerify = ({ logOut }) => {
    useEffect(() => {
        const user = JSON.parse(localStorage.getItem("user"));

        if (user && user.token) {
            const decodedJwt = jwtDecode(user.token);

            if (decodedJwt.exp * 1000 < Date.now()) {
                EventBus.dispatch("logout");
            }
        }
    }, [logOut]);

    return null;
};

export default AuthVerify;
